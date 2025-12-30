require('dotenv').config();
const { Client } = require('pg');

async function updateImageUrls() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const result = await client.query(
            `UPDATE workspaces SET image_url = REPLACE(image_url, 'via.placeholder.com', 'placehold.co') WHERE image_url LIKE '%via.placeholder.com%'`
        );

        console.log(`Updated ${result.rowCount} workspace image URLs`);
        await client.end();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

updateImageUrls();
