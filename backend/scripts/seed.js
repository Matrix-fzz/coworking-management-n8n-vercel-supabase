require('dotenv').config();
const { Client } = require('pg');

async function seedDatabase() {
    // Prefer DATABASE_URL for Supabase/Vercel
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        // Delete existing data
        // await client.query('DELETE FROM favorites');
        // await client.query('DELETE FROM workspaces');
        // await client.query('DELETE FROM users');

        // Insert test users
        const users = [
            ['admin', 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqK.3.8.9.9.9.9.9.9.9.9.9.9'], // password: admin123
            ['user1', 'user1@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqK.3.8.9.9.9.9.9.9.9.9.9.9'], // password: user123
            ['user2', 'user2@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqK.3.8.9.9.9.9.9.9.9.9.9.9']  // password: user123
        ];

        for (const user of users) {
            try {
                await client.query(
                    'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
                    user
                );
                console.log(`✅ User ${user[0]} inserted`);
            } catch (error) {
                if (error.code === '23505') { // Unique Key Violation in Postgres
                    console.log(`⚠️ User ${user[0]} already exists`);
                } else {
                    console.error(`❌ Error inserting user ${user[0]}:`, error.message);
                }
            }
        }

        // Get user IDs
        const userRows = await client.query('SELECT id FROM users ORDER BY id');
        const userIds = userRows.rows.map(row => row.id);

        if (userIds.length === 0) {
            console.log('No users found, skipping workspace insertion');
            await client.end();
            return;
        }

        // Insert coworking workspaces
        const workspaces = [
            ['Coworking Marrakech', 50, 150.00, 'Marrakech', JSON.stringify(['wifi', 'imprimante', 'café', 'salle de réunion']), 'available', 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Coworking+Marrakech', userIds[0]],
            ['Espace Digital Casablanca', 30, 120.00, 'Casablanca', JSON.stringify(['wifi', 'imprimante', 'parking']), 'available', 'https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=Espace+Digital+Casablanca', userIds[1] || userIds[0]],
            ['Tech Hub Rabat', 100, 200.00, 'Rabat', JSON.stringify(['wifi', 'café', 'gym', 'salle de conférence']), 'full', 'https://via.placeholder.com/400x300/45B7D1/FFFFFF?text=Tech+Hub+Rabat', userIds[0]],
            ['Creative Space Fès', 20, 80.00, 'Fès', JSON.stringify(['wifi', 'imprimante', 'café']), 'available', 'https://via.placeholder.com/400x300/96CEB4/FFFFFF?text=Creative+Space+Fès', userIds[1] || userIds[0]],
            ['Business Center Tanger', 75, 180.00, 'Tanger', JSON.stringify(['wifi', 'imprimante', 'café', 'terrasse']), 'available', 'https://via.placeholder.com/400x300/FECA57/FFFFFF?text=Business+Center+Tanger', userIds[2] || userIds[0]],
            ['Startup Lab Agadir', 40, 130.00, 'Agadir', JSON.stringify(['wifi', 'imprimante', 'café', 'laboratoire']), 'available', 'https://via.placeholder.com/400x300/FF9FF3/FFFFFF?text=Startup+Lab+Agadir', userIds[0]]
        ];

        for (const workspace of workspaces) {
            try {
                await client.query(
                    'INSERT INTO workspaces (name, capacity, price_per_day, city, amenities, status, image_url, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                    workspace
                );
                console.log(`✅ Workspace "${workspace[0]}" inserted`);
            } catch (error) {
                console.error(`❌ Error inserting workspace "${workspace[0]}":`, error.message);
            }
        }

        // Get workspace IDs
        const workspaceRows = await client.query('SELECT id FROM workspaces ORDER BY id');
        const workspaceIds = workspaceRows.rows.map(row => row.id);

        if (workspaceIds.length < 2) { 
             console.log('Not enough workspaces for favorites seeding'); 
        } else {
             // Insert favorites
            const favorites = [
                [userIds[0], workspaceIds[1]],
                [userIds[0], workspaceIds[3] || workspaceIds[0]],
                [userIds[1] || userIds[0], workspaceIds[0]],
            ];

            for (const favorite of favorites) {
                if (!favorite[0] || !favorite[1]) continue;
                
                try {
                    await client.query(
                        'INSERT INTO favorites (user_id, workspace_id) VALUES ($1, $2)',
                        favorite
                    );
                    console.log(`✅ Favorite for user ${favorite[0]} added`);
                } catch (error) {
                     if (error.code === '23505') {
                        console.log(`⚠️ Favorite already exists`);
                    } else {
                        console.error(`❌ Error inserting favorite:`, error.message);
                    }
                }
            }
        }

        await client.end();
        console.log('✅ Database seeded successfully!');
        
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();