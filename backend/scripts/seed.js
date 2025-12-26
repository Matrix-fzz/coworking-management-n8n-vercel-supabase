require('dotenv').config();
const mysql = require('mysql2/promise');

async function seedDatabase() {
    try {
        // Connexion à la base de données
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'coworking_db'
        });

        console.log('✅ Connected to database');

        // Insérer des utilisateurs de test
        const users = [
            ['admin', 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqK.3.8.9.9.9.9.9.9.9.9.9.9'], // password: admin123
            ['user1', 'user1@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqK.3.8.9.9.9.9.9.9.9.9.9.9'], // password: user123
            ['user2', 'user2@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqK.3.8.9.9.9.9.9.9.9.9.9.9']  // password: user123
        ];

        for (const user of users) {
            try {
                await connection.execute(
                    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                    user
                );
                console.log(`✅ User ${user[0]} inserted`);
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    console.log(`⚠️ User ${user[0]} already exists`);
                } else {
                    console.error(`❌ Error inserting user ${user[0]}:`, error.message);
                }
            }
        }

        // Récupérer les IDs des utilisateurs
        const [userRows] = await connection.execute('SELECT id FROM users ORDER BY id');
        const userIds = userRows.map(row => row.id);

        // Insérer des espaces de coworking
        const workspaces = [
            ['Coworking Marrakech', 50, 150.00, 'Marrakech', JSON.stringify(['wifi', 'imprimante', 'café', 'salle de réunion']), 'available', 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Coworking+Marrakech', userIds[0]],
            ['Espace Digital Casablanca', 30, 120.00, 'Casablanca', JSON.stringify(['wifi', 'imprimante', 'parking']), 'available', 'https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=Espace+Digital+Casablanca', userIds[1]],
            ['Tech Hub Rabat', 100, 200.00, 'Rabat', JSON.stringify(['wifi', 'café', 'gym', 'salle de conférence']), 'full', 'https://via.placeholder.com/400x300/45B7D1/FFFFFF?text=Tech+Hub+Rabat', userIds[0]],
            ['Creative Space Fès', 20, 80.00, 'Fès', JSON.stringify(['wifi', 'imprimante', 'café']), 'available', 'https://via.placeholder.com/400x300/96CEB4/FFFFFF?text=Creative+Space+Fès', userIds[1]],
            ['Business Center Tanger', 75, 180.00, 'Tanger', JSON.stringify(['wifi', 'imprimante', 'café', 'terrasse']), 'available', 'https://via.placeholder.com/400x300/FECA57/FFFFFF?text=Business+Center+Tanger', userIds[2]],
            ['Startup Lab Agadir', 40, 130.00, 'Agadir', JSON.stringify(['wifi', 'imprimante', 'café', 'laboratoire']), 'available', 'https://via.placeholder.com/400x300/FF9FF3/FFFFFF?text=Startup+Lab+Agadir', userIds[0]]
        ];

        for (const workspace of workspaces) {
            try {
                await connection.execute(
                    'INSERT INTO workspaces (name, capacity, price_per_day, city, amenities, status, image_url, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    workspace
                );
                console.log(`✅ Workspace "${workspace[0]}" inserted`);
            } catch (error) {
                console.error(`❌ Error inserting workspace "${workspace[0]}":`, error.message);
            }
        }

        // Récupérer les IDs des espaces
        const [workspaceRows] = await connection.execute('SELECT id FROM workspaces ORDER BY id');
        const workspaceIds = workspaceRows.map(row => row.id);

        // Insérer des favoris
        const favorites = [
            [userIds[0], workspaceIds[1]],
            [userIds[0], workspaceIds[3]],
            [userIds[1], workspaceIds[0]],
            [userIds[1], workspaceIds[2]],
            [userIds[2], workspaceIds[4]]
        ];

        for (const favorite of favorites) {
            try {
                await connection.execute(
                    'INSERT INTO favorites (user_id, workspace_id) VALUES (?, ?)',
                    favorite
                );
                console.log(`✅ Favorite for user ${favorite[0]} added`);
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    console.log(`⚠️ Favorite already exists`);
                } else {
                    console.error(`❌ Error inserting favorite:`, error.message);
                }
            }
        }

        await connection.end();
        console.log('✅ Database seeded successfully!');
        
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();