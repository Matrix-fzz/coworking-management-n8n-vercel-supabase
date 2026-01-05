const { verifyToken } = require('../utils/jwt');

const authMiddleware = (req, res, next) => {
    try {
        // 1. Vérifier la session (Priorité)
        if (req.session && req.session.user) {
            req.user = req.session.user;
            return next();
        }

        // 2. Vérifier le token (Fallback)
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            
            if (decoded) {
                req.user = decoded;
                return next();
            }
        }
        
        return res.status(401).json({
            success: false,
            message: 'Authentication required. Please log in.'
        });
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

const optionalAuthMiddleware = (req, res, next) => {
    try {
        // 1. Check session
        if (req.session && req.session.user) {
            req.user = req.session.user;
            return next();
        }

        // 2. Check token
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            
            if (decoded) {
                req.user = decoded;
            }
        }
        next();
    } catch (error) {
        next();
    }
};

module.exports = { authMiddleware, optionalAuthMiddleware };