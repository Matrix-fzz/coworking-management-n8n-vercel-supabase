const { verifyToken } = require('../utils/jwt');

const authMiddleware = (req, res, next) => {
    try {
        // Récupérer le token depuis le header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        
        const token = authHeader.split(' ')[1];
        
        // Vérifier le token
        const decoded = verifyToken(token);
        
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        
        // Ajouter les données de l'utilisateur à la requête
        req.user = decoded;
        next();
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
        // En cas d'erreur (token invalide, expiré, etc.), on continue sans utilisateur connecté
        next();
    }
};

module.exports = { authMiddleware, optionalAuthMiddleware };