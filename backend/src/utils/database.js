const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Create a connection pool
// Prefer DATABASE_URL for Supabase/Vercel
const poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL is not defined in environment variables. Database queries will fail.');
}

const pool = new Pool(poolConfig);

// Test connection
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL database successfully');
        client.release();
        
        // Verify tables exist
        await checkTables();
    } catch (error) {
        console.error('❌ Error connecting to database:', error.message);
        // Don't exit process in serverless environment, just log error
        if (process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
    }
};

// Check and create tables if necessary
const checkTables = async () => {
    try {
        // Function to update timestamp
        const createUpdateTriggerFunc = `
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `;

        const createTables = `
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                email VARCHAR(100) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS workspaces (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                capacity INT NOT NULL,
                price_per_day DECIMAL(10, 2) NOT NULL,
                city VARCHAR(50) NOT NULL,
                amenities TEXT NOT NULL,
                status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'full')),
                image_url TEXT,
                user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS favorites (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                workspace_id INT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (user_id, workspace_id)
            );

            CREATE TABLE IF NOT EXISTS scraping_requests (
                id SERIAL PRIMARY KEY,
                city VARCHAR(50) NOT NULL,
                keyword VARCHAR(100) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
                sheet_url VARCHAR(255),
                user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP NULL
            );

            -- Indexes
            CREATE INDEX IF NOT EXISTS idx_workspaces_city ON workspaces(city);
            CREATE INDEX IF NOT EXISTS idx_workspaces_status ON workspaces(status);
            CREATE INDEX IF NOT EXISTS idx_workspaces_user ON workspaces(user_id);
            CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
            CREATE INDEX IF NOT EXISTS idx_favorites_workspace ON favorites(workspace_id);
        `;

        // Create Valid Triggers
        const createTriggers = `
            DROP TRIGGER IF EXISTS update_users_updated_at ON users;
            CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

            DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
            CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
        `;

        await pool.query(createUpdateTriggerFunc);
        await pool.query(createTables);
        await pool.query(createTriggers);
        
        console.log('✅ Database tables checked/created successfully');
    } catch (error) {
        console.error('❌ Error creating tables:', error.message);
    }
};

// Test connection functionality (optional, can be called manually)
const initializeDatabase = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL database successfully');
        client.release();
        
        // Only check tables in development or if explicitly requested
        // In serverless production, this should be handled by a migration script
        if (process.env.NODE_ENV !== 'production') {
            await checkTables();
        }
    } catch (error) {
        console.error('❌ Error connecting to database:', error.message);
    }
};

// Initialize only in development mode to avoid overhead in serverless
if (process.env.NODE_ENV !== 'production') {
    initializeDatabase();
}

module.exports = pool;