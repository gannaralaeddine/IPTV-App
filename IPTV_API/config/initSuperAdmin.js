const User = require('../models/User');

const initSuperAdmin = async () => {
    try {
        // Check if any super_admin exists
        const superAdminExists = await User.findOne({ role: 'super_admin' });
        if (!superAdminExists) {
            console.log('[Init] No Super Admin found. Creating initial Super Admin account...');
            const superAdmin = new User({
                username: process.env.SUPER_ADMIN_USERNAME || 'superadmin',
                password: process.env.SUPER_ADMIN_PASSWORD || 'superadmin123',
                name: 'Super Administrator',
                phoneNumber: '+1000000000',
                email: 'superadmin@iptv.local',
                role: 'super_admin',
                status: 'active',
                expDate: new Date('2099-12-31')
            });
            await superAdmin.save();
            console.log(`[Init] Initial Super Admin created successfully: username="${superAdmin.username}", password="superadmin123"`);
        }

        // Check if an admin exists; if not, create a demo admin for easy testing
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            console.log('[Init] Creating default Admin account for role demonstration...');
            const demoAdmin = new User({
                username: 'admin',
                password: 'admin123',
                name: 'Operations Admin',
                phoneNumber: '+1000000001',
                email: 'admin@iptv.local',
                role: 'admin',
                status: 'active',
                expDate: new Date('2099-12-31')
            });
            await demoAdmin.save();
            console.log(`[Init] Default Admin created successfully: username="admin", password="admin123"`);
        }

        // Ensure "test" client user exists for backwards compatibility with existing player tests
        const testClientExists = await User.findOne({ username: 'test' });
        if (!testClientExists) {
            console.log('[Init] Creating legacy "test" client user for player compatibility...');
            const testClient = new User({
                username: 'test',
                password: 'test',
                rawPassword: 'test',
                name: 'Test Client User',
                phoneNumber: '+1000000002',
                email: 'test@iptv.local',
                role: 'client_user',
                status: 'active',
                allLiveCategories: true,
                allVodCategories: true,
                allSeriesCategories: true,
                expDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            });
            await testClient.save();
            console.log('[Init] Test client user created: username="test", password="test"');
        }
    } catch (err) {
        console.error('[Init] Error initializing default users:', err.message);
    }
};

module.exports = initSuperAdmin;
