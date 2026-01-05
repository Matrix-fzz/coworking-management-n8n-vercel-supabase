const { verifyToken } = require('../utils/jwt');

const authMiddleware = (req, res, next) => {
    console.log(`[AUTH] Middleware check for ${req.method} ${req.url}`);
    try {
        // Rely exclusively on the Authorization header with Bearer token
        const authHeader = req.headers.authorization;
        
        if (authHeader) {
            console.log(`[AUTH] Found Authorization header: ${authHeader.substring(0, 15)}...`);
            
            if (authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                const decoded = verifyToken(token);
                
                if (decoded) {
                    console.log(`[AUTH] Token verified for user: ${decoded.email}`);
                    req.user = decoded;
                    return next();
                } else {
                    console.warn(`[AUTH] Token verification failed`);
                }
            } else {
                console.warn(`[AUTH] Authorization header format invalid (expected Bearer)`);
            }
        } else {
            console.warn(`[AUTH] No Authorization header found. Access denied.`);
        }
        
        return res.status(401).json({
            success: false,
            message: 'Authentication required. Please log in.'
        });
    } catch (error) {
        console.error('[AUTH] Critical middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

const optionalAuthMiddleware = (req, res, next) => {
    try {
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