const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'iptv_jwt_secret_super_secure_key_2026';

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
    try {
        let token = null;

        // Check Authorization header: Bearer <token>
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.query && req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            // For backward compatibility during migration/testing: if credentials are provided via query params
            const u = req.query?.username || req.body?.username;
            const p = req.query?.password || req.body?.password;
            if (u && p) {
                const user = await User.findOne({ username: u.toLowerCase() });
                if (user && await user.comparePassword(p)) {
                    if (user.status !== 'active') {
                        return res.status(403).json({ error: 'Account is disabled or inactive' });
                    }
                    req.user = user;
                    return next();
                }
            }
            return res.status(401).json({ error: 'Authentication token required' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ error: 'User no longer exists' });
        }

        if (user.status !== 'active') {
            return res.status(403).json({ error: 'Account is disabled or inactive' });
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token has expired', code: 'TOKEN_EXPIRED' });
        }
        return res.status(403).json({ error: 'Invalid or corrupt token' });
    }
};

// Middleware: only super_admin role can proceed
const requireSuperAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'super_admin') {
        return res.status(403).json({
            error: 'Forbidden: Super Admin privileges are required to access this resource.'
        });
    }

    next();
};

// Middleware: super_admin or admin can proceed
const requireAdminOrSuperAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Forbidden: Admin or Super Admin privileges are required to access this resource.'
        });
    }

    next();
};

module.exports = {
    JWT_SECRET,
    authenticateToken,
    requireSuperAdmin,
    requireAdminOrSuperAdmin
};
