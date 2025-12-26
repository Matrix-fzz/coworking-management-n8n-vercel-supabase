const { body, validationResult } = require('express-validator');

// Validation pour l'inscription
const validateRegister = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];

// Validation pour la connexion
const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Password is required'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];

// Validation pour la création d'espace
const validateWorkspace = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    
    body('capacity')
        .notEmpty().withMessage('Capacity is required')
        .isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
    
    body('price_per_day')
        .notEmpty().withMessage('Price per day is required')
        .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    
    body('city')
        .trim()
        .notEmpty().withMessage('City is required'),
    
    body('amenities')
        .optional()
        .isArray().withMessage('Amenities must be an array'),
    
    body('status')
        .optional()
        .isIn(['available', 'full']).withMessage('Status must be either "available" or "full"'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        next();
    }
];

module.exports = {
    validateRegister,
    validateLogin,
    validateWorkspace
};