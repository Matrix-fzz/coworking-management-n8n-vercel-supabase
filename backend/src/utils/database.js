const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Créer un pool de connexions
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'coworking_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test de connexion
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connected to MySQL database successfully');
        connection.release();
        
        // Vérifier si les tables existent
        await checkTables();
    } catch (error) {
        console.error('❌ Error connecting to database:', error.message);
        process.exit(1);
    }
};

// Vérifier et créer les tables si nécessaire
const checkTables = async () => {
    try {
        const createTables = `
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) NOT NULL UNIQUE,
                email VARCHAR(100) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS workspaces (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                capacity INT NOT NULL,
                price_per_day DECIMAL(10, 2) NOT NULL,
                city VARCHAR(50) NOT NULL,
                amenities TEXT NOT NULL,
                status ENUM('available', 'full') DEFAULT 'available',
                image_url TEXT,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS favorites (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                workspace_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_favorite (user_id, workspace_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS scraping_requests (
                id INT PRIMARY KEY AUTO_INCREMENT,
                city VARCHAR(50) NOT NULL,
                keyword VARCHAR(100) NOT NULL,
                status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
                sheet_url VARCHAR(255),
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            -- Créer des index pour améliorer les performances
            CREATE INDEX IF NOT EXISTS idx_workspaces_city ON workspaces(city);
            CREATE INDEX IF NOT EXISTS idx_workspaces_status ON workspaces(status);
            CREATE INDEX IF NOT EXISTS idx_workspaces_user ON workspaces(user_id);
            CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
            CREATE INDEX IF NOT EXISTS idx_favorites_workspace ON favorites(workspace_id);
        `;

        // Exécuter chaque instruction SQL séparément
        const statements = createTables.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                await pool.execute(statement + ';');
            }
        }
        
        console.log('✅ Database tables checked/created successfully');
    } catch (error) {
        console.error('❌ Error creating tables:', error.message);
    }
};

// Tester la connexion immédiatement
testConnection();

module.exports = pool;