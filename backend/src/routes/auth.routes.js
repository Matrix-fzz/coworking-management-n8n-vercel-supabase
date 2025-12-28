const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { validateRegister, validateLogin } = require('../middleware/validation.middleware');
const { authMiddleware } = require('../middleware/auth.middleware');

// Public routes
router.post('/register', validateRegister, AuthController.register);
router.post('/login', validateLogin, AuthController.login);

// Protected routes
router.get('/me', authMiddleware, AuthController.getProfile);
router.put('/me', authMiddleware, AuthController.updateProfile);

module.exports = router;