const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const LiveCategory = require('../models/LiveCategory');
const VodCategory = require('../models/VodCategory');
const SeriesCategory = require('../models/SeriesCategory');
const { JWT_SECRET } = require('../middleware/authMiddleware');

// 1. User Login
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const cleanUsername = username.trim().toLowerCase();
        const user = await User.findOne({
            $or: [
                { username: cleanUsername },
                { email: cleanUsername }
            ]
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        if (user.status !== 'active') {
            return res.status(403).json({ error: 'Your account is disabled. Please contact an administrator.' });
        }

        // For client users, check expiration
        if (user.role === 'client_user' && user.expDate && new Date(user.expDate) < new Date()) {
            return res.status(403).json({ error: 'Your subscription has expired.' });
        }

        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign(
            {
                id: user._id,
                username: user.username,
                role: user.role,
                name: user.name
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
                status: user.status,
                expDate: user.expDate,
                allLiveCategories: user.allLiveCategories,
                allowedLiveCategories: user.allowedLiveCategories,
                allVodCategories: user.allVodCategories,
                allowedVodCategories: user.allowedVodCategories,
                allSeriesCategories: user.allSeriesCategories,
                allowedSeriesCategories: user.allowedSeriesCategories
            }
        });
    } catch (err) {
        console.error('Error during login:', err);
        return res.status(500).json({ error: 'Internal server error', message: err.message });
    }
};

// 2. Get Current Authenticated User Profile
exports.getMe = async (req, res) => {
    try {
        const user = req.user;
        return res.json({
            id: user._id,
            username: user.username,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            status: user.status,
            expDate: user.expDate,
            allLiveCategories: user.allLiveCategories,
            allowedLiveCategories: user.allowedLiveCategories,
            allVodCategories: user.allVodCategories,
            allowedVodCategories: user.allowedVodCategories,
            allSeriesCategories: user.allSeriesCategories,
            allowedSeriesCategories: user.allowedSeriesCategories,
            createdAt: user.createdAt
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// 3. Get Users List (Filtered by Role and Permissions)
exports.getUsers = async (req, res) => {
    try {
        const currentUser = req.user;
        const { role, search, status } = req.query;

        const filter = {};

        // Role-based visibility:
        // Admin can ONLY see client_user accounts!
        if (currentUser.role === 'admin') {
            filter.role = 'client_user';
        } else if (currentUser.role === 'super_admin') {
            // Super admin can see all or filter by requested role
            if (role && ['super_admin', 'admin', 'client_user'].includes(role)) {
                filter.role = role;
            }
        } else {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (status && ['active', 'disabled', 'expired'].includes(status)) {
            filter.status = status;
        }

        if (search) {
            const regex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { username: regex },
                { name: regex },
                { email: regex },
                { phoneNumber: regex }
            ];
        }

        const users = await User.find(filter)
            .sort({ createdAt: -1 })
            .select('-password'); // Omit hashed password, keep rawPassword for client_user accounts

        return res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ error: 'Failed to fetch users', message: err.message });
    }
};

// 4. Create New User / Subscription Account
exports.createUser = async (req, res) => {
    try {
        const currentUser = req.user;
        const {
            username,
            password,
            name,
            phoneNumber,
            email,
            role = 'client_user',
            status = 'active',
            expDate,
            maxConnections = 1,
            allLiveCategories = true,
            allowedLiveCategories = [],
            allVodCategories = true,
            allowedVodCategories = [],
            allSeriesCategories = true,
            allowedSeriesCategories = [],
            notes = ''
        } = req.body;

        if (!username || !password || !name || !phoneNumber || !email) {
            return res.status(400).json({
                error: 'Missing required fields: username, password, name, phoneNumber, and email are required.'
            });
        }

        const cleanUsername = username.trim().toLowerCase();

        // Check if username already exists
        const existingUser = await User.findOne({ username: cleanUsername });
        if (existingUser) {
            return res.status(409).json({ error: `Username "${cleanUsername}" is already taken.` });
        }

        // Check Role Permissions:
        // Admin role is STRICTLY allowed to create ONLY client_user accounts
        if (currentUser.role === 'admin') {
            if (role !== 'client_user') {
                return res.status(403).json({
                    error: 'Permission denied: Admins can only create client user accounts.'
                });
            }
        }

        // Only super_admin can create admin or super_admin
        if (['super_admin', 'admin'].includes(role) && currentUser.role !== 'super_admin') {
            return res.status(403).json({
                error: 'Permission denied: Only Super Admin can create Admin or Super Admin accounts.'
            });
        }

        // Calculate subscription expiration date
        let calculatedExpDate;
        if (expDate) {
            calculatedExpDate = new Date(expDate);
        } else {
            // Default: 1 year from now
            calculatedExpDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        }

        const newUser = new User({
            username: cleanUsername,
            password: password.trim(),
            rawPassword: role === 'client_user' ? password.trim() : '', // Save readable password for client accounts
            name: name.trim(),
            phoneNumber: phoneNumber.trim(),
            email: email.trim().toLowerCase(),
            role,
            status,
            expDate: calculatedExpDate,
            maxConnections: Number(maxConnections) || 1,
            allLiveCategories: Boolean(allLiveCategories),
            allowedLiveCategories: Array.isArray(allowedLiveCategories) ? allowedLiveCategories.map(Number) : [],
            allVodCategories: Boolean(allVodCategories),
            allowedVodCategories: Array.isArray(allowedVodCategories) ? allowedVodCategories.map(Number) : [],
            allSeriesCategories: Boolean(allSeriesCategories),
            allowedSeriesCategories: Array.isArray(allowedSeriesCategories) ? allowedSeriesCategories.map(Number) : [],
            createdBy: currentUser._id,
            createdByName: currentUser.name || currentUser.username,
            notes
        });

        await newUser.save();

        const responseObj = newUser.toSafeObject();
        return res.status(201).json({
            message: 'User created successfully',
            user: responseObj
        });
    } catch (err) {
        console.error('Error creating user:', err);
        return res.status(500).json({ error: 'Failed to create user', message: err.message });
    }
};

// 5. Update Existing User
exports.updateUser = async (req, res) => {
    try {
        const currentUser = req.user;
        const targetUserId = req.params.id;

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const {
            name,
            phoneNumber,
            email,
            role,
            status,
            password,
            expDate,
            maxConnections,
            allLiveCategories,
            allowedLiveCategories,
            allVodCategories,
            allowedVodCategories,
            allSeriesCategories,
            allowedSeriesCategories,
            notes
        } = req.body;

        // Permissions Check:
        // Admin can ONLY modify client_user accounts!
        if (currentUser.role === 'admin') {
            if (targetUser.role !== 'client_user') {
                return res.status(403).json({
                    error: 'Permission denied: Admins can only manage client users.'
                });
            }
            // Admin cannot promote a client to admin or super_admin
            if (role && role !== 'client_user') {
                return res.status(403).json({
                    error: 'Permission denied: Admins cannot change user roles.'
                });
            }
        }

        // Super Admin Role Assignment Check:
        // If changing roles, only super_admin can do it
        if (role && role !== targetUser.role) {
            if (currentUser.role !== 'super_admin') {
                return res.status(403).json({
                    error: 'Permission denied: Only Super Admin can assign or deassign roles.'
                });
            }
            // Prevent removing the last super_admin role
            if (targetUser.role === 'super_admin' && role !== 'super_admin') {
                const superAdminCount = await User.countDocuments({ role: 'super_admin' });
                if (superAdminCount <= 1) {
                    return res.status(400).json({
                        error: 'Cannot demote the only remaining Super Admin.'
                    });
                }
            }
            targetUser.role = role;
        }

        // Update fields if provided
        if (name) targetUser.name = name.trim();
        if (phoneNumber) targetUser.phoneNumber = phoneNumber.trim();
        if (email) targetUser.email = email.trim().toLowerCase();
        if (status) targetUser.status = status;
        if (expDate) targetUser.expDate = new Date(expDate);
        if (maxConnections !== undefined) targetUser.maxConnections = Number(maxConnections);
        if (notes !== undefined) targetUser.notes = notes;

        // Update Category Permissions
        if (allLiveCategories !== undefined) targetUser.allLiveCategories = Boolean(allLiveCategories);
        if (allowedLiveCategories !== undefined) {
            targetUser.allowedLiveCategories = Array.isArray(allowedLiveCategories) ? allowedLiveCategories.map(Number) : [];
        }
        if (allVodCategories !== undefined) targetUser.allVodCategories = Boolean(allVodCategories);
        if (allowedVodCategories !== undefined) {
            targetUser.allowedVodCategories = Array.isArray(allowedVodCategories) ? allowedVodCategories.map(Number) : [];
        }
        if (allSeriesCategories !== undefined) targetUser.allSeriesCategories = Boolean(allSeriesCategories);
        if (allowedSeriesCategories !== undefined) {
            targetUser.allowedSeriesCategories = Array.isArray(allowedSeriesCategories) ? allowedSeriesCategories.map(Number) : [];
        }

        // If new password provided
        if (password && password.trim().length > 0) {
            targetUser.password = password.trim();
            if (targetUser.role === 'client_user') {
                targetUser.rawPassword = password.trim();
            }
        }

        targetUser.updatedAt = new Date();
        await targetUser.save();

        return res.json({
            message: 'User updated successfully',
            user: targetUser.toSafeObject()
        });
    } catch (err) {
        console.error('Error updating user:', err);
        return res.status(500).json({ error: 'Failed to update user', message: err.message });
    }
};

// 6. Delete User
exports.deleteUser = async (req, res) => {
    try {
        const currentUser = req.user;
        const targetUserId = req.params.id;

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent deleting own account
        if (targetUser._id.toString() === currentUser._id.toString()) {
            return res.status(400).json({ error: 'You cannot delete your own account.' });
        }

        // Permissions Check:
        // Admin can ONLY delete client_user accounts!
        if (currentUser.role === 'admin') {
            if (targetUser.role !== 'client_user') {
                return res.status(403).json({
                    error: 'Permission denied: Admins can only delete client users.'
                });
            }
        }

        // If deleting a super_admin, verify there is at least one other super_admin
        if (targetUser.role === 'super_admin') {
            const superAdminCount = await User.countDocuments({ role: 'super_admin' });
            if (superAdminCount <= 1) {
                return res.status(400).json({ error: 'Cannot delete the only remaining Super Admin.' });
            }
        }

        await User.findByIdAndDelete(targetUserId);
        return res.json({ message: `User "${targetUser.username}" was deleted successfully.` });
    } catch (err) {
        console.error('Error deleting user:', err);
        return res.status(500).json({ error: 'Failed to delete user', message: err.message });
    }
};

// 7. Get All Categories for Category Assignment Selection (Live, VOD, Series)
exports.getAllCategories = async (req, res) => {
    try {
        const [liveCategories, vodCategories, seriesCategories] = await Promise.all([
            LiveCategory.find().sort({ category_name: 1 }).lean(),
            VodCategory.find().sort({ category_name: 1 }).lean(),
            SeriesCategory.find().sort({ category_name: 1 }).lean()
        ]);

        return res.json({
            liveCategories: liveCategories.map(c => ({
                id: c.category_id,
                name: c.category_name
            })),
            vodCategories: vodCategories.map(c => ({
                id: c.category_id,
                name: c.category_name
            })),
            seriesCategories: seriesCategories.map(c => ({
                id: c.category_id,
                name: c.category_name
            }))
        });
    } catch (err) {
        console.error('Error fetching categories for assignment:', err);
        return res.status(500).json({ error: 'Failed to fetch categories', message: err.message });
    }
};

// 8. Auto-Generate Unique Client Credentials Suggestion
exports.generateCredentials = async (req, res) => {
    try {
        let uniqueUsername = '';
        let isTaken = true;

        // Generate unique username
        while (isTaken) {
            const randomNum = Math.floor(100000 + Math.random() * 900000); // 6 digits
            uniqueUsername = `client_${randomNum}`;
            const exists = await User.findOne({ username: uniqueUsername });
            if (!exists) {
                isTaken = false;
            }
        }

        // Generate strong 8-character password
        const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
        let generatedPassword = '';
        for (let i = 0; i < 8; i++) {
            generatedPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return res.json({
            username: uniqueUsername,
            password: generatedPassword
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
