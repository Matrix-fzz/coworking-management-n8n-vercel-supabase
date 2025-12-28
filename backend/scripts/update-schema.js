require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateSchema() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'coworking_db'
        });

        console.log('✅ Connected to database');

        // Alter the table to change image_url to TEXT
        await connection.execute('ALTER TABLE workspaces MODIFY COLUMN image_url TEXT');
        console.log('✅ "image_url" column modified to TEXT');

        await connection.end();
        console.log('✅ Schema update completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating schema:', error.message);
        process.exit(1);
    }
}

updateSchema();
