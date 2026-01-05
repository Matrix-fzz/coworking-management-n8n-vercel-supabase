const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

// Charger les variables d'environnement
dotenv.config();
dotenv.config({ path: path.join(__dirname, '../.env.local'), override: true });

// Importer la connexion à la base de données
const pool = require('./utils/database');

// Importer les routes
const authRoutes = require('./routes/auth.routes');
const workspaceRoutes = require('./routes/workspace.routes');
const favoriteRoutes = require('./routes/favorite.routes');
const uploadRoutes = require('./routes/upload.routes');
const agentRoutes = require('./routes/agent.routes');

// Initialiser l'application
const app = express();

// Middleware pour parser les cookies
app.use(cookieParser());

// Middleware CORS
const corsOptions = {
    origin: [
        'http://localhost:5500', 
        'http://127.0.0.1:5500', 
        'https://coworking-management-tawny.vercel.app',
        'https://coworking-management-izrei94lk-matrixs-projects-ced4ab94.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Middleware Session
app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'session',
        createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || 'coworking-secret-key-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
        secure: true, // Always true since we are on HTTPS in production or handled by proxy
        sameSite: 'lax', // Better for same-site cookie handling
        httpOnly: true
    }
}));

// Handle OPTIONS preflight requests (Express 5 compatible)
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.header('Access-Control-Allow-Credentials', 'true');
        return res.status(200).json({});
    }
    next();
});

// Middleware pour parser le JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger pour debugger les routes
app.use((req, res, next) => {
    console.log(`[DEBUG] ${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Servir les fichiers statiques (pour les images uploadées)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/scraping', require('./routes/scraping.routes'));
app.use('/api/agent', agentRoutes);

// Route racine - Redirection ou message d'accueil
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Coworking Management API',
        documentation: '/api/docs',
        health: '/api/health'
    });
});

// Route de test
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Coworking Management API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Route pour servir la documentation
app.get('/api/docs', (req, res) => {
    res.json({
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                profile: 'GET /api/auth/me'
            },
            workspaces: {
                getAll: 'GET /api/workspaces',
                getById: 'GET /api/workspaces/:id',
                create: 'POST /api/workspaces',
                update: 'PUT /api/workspaces/:id',
                delete: 'DELETE /api/workspaces/:id',
                userWorkspaces: 'GET /api/workspaces/user/my-workspaces'
            },
            favorites: {
                add: 'POST /api/favorites/:itemId',
                remove: 'DELETE /api/favorites/:itemId',
                get: 'GET /api/favorites/my-favorites',
                check: 'GET /api/favorites/check/:itemId'
            }
        }
    });
});

// Gestion des erreurs 404
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.url} not found`
    });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
    console.error('Global error handler:', err.stack);
    
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message;
    
    res.status(statusCode).json({
        success: false,
        message: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Export de l'application
module.exports = app;

// Port d'écoute
const PORT = process.env.PORT || 3000;

// Démarrer le serveur uniquement si le fichier est exécuté directement
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
        console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
        console.log(`🌐 CORS Origin: ${corsOptions.origin}`);
    });
}
