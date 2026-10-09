const { Router } = require('express');
const userController = require('../controllers/userController');
const {
    authenticateToken,
    requireAdminOrSuperAdmin,
    requireSuperAdmin
} = require('../middleware/authMiddleware');

const router = Router();

// Public route: User Login
router.post('/login', userController.login);

// Authenticated route: Get current user profile
router.get('/me', authenticateToken, userController.getMe);

// Management routes: Accessible by Super Admin and Admin
router.get('/categories', authenticateToken, requireAdminOrSuperAdmin, userController.getAllCategories);
router.get('/generate-credentials', authenticateToken, requireAdminOrSuperAdmin, userController.generateCredentials);

// User CRUD (Role-level enforcement is handled in controller)
router.get('/', authenticateToken, requireAdminOrSuperAdmin, userController.getUsers);
router.post('/', authenticateToken, requireAdminOrSuperAdmin, userController.createUser);
router.put('/:id', authenticateToken, requireAdminOrSuperAdmin, userController.updateUser);
router.delete('/:id', authenticateToken, requireAdminOrSuperAdmin, userController.deleteUser);

module.exports = router;
