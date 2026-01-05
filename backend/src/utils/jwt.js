const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'coworking-jwt-secret-key-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '365d';

if (!process.env.JWT_SECRET) {
    console.warn('⚠️ JWT_SECRET is not defined in environment variables. Using fallback secret.');
}

// Générer un token JWT
const generateToken = (userId, email) => {
    return jwt.sign(
        { 
            id: userId, 
            email,
            iat: Math.floor(Date.now() / 1000) // issued at
        },
        JWT_SECRET,
        { 
            expiresIn: JWT_EXPIRES_IN,
            algorithm: 'HS256'
        }
    );
};

// Vérifier un token JWT
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    } catch (error) {
        console.error('JWT verification error:', error.message);
        return null;
    }
};

// Décoder un token sans vérification (pour débogage)
const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        console.error('JWT decode error:', error.message);
        return null;
    }
};

module.exports = {
    generateToken,
    verifyToken,
    decodeToken,
    JWT_SECRET
};