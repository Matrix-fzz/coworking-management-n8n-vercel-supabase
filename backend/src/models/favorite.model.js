const pool = require('../utils/database');

class Favorite {
    // Add to favorites
    static async add(userId, workspaceId) {
        try {
            // Check if workspace exists
            const workspaceResult = await pool.query(
                'SELECT id FROM workspaces WHERE id = $1',
                [workspaceId]
            );
            
            if (!workspaceResult.rows[0]) {
                throw new Error('Workspace not found');
            }
            
            // Check if already favorite
            const existingResult = await pool.query(
                'SELECT id FROM favorites WHERE user_id = $1 AND workspace_id = $2',
                [userId, workspaceId]
            );
            
            if (existingResult.rows[0]) {
                throw new Error('Already in favorites');
            }
            
            const result = await pool.query(
                'INSERT INTO favorites (user_id, workspace_id) VALUES ($1, $2) RETURNING id, user_id, workspace_id, created_at',
                [userId, workspaceId]
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error adding favorite:', error);
            throw error;
        }
    }

    // Remove from favorites
    static async remove(userId, workspaceId) {
        try {
            const result = await pool.query(
                'DELETE FROM favorites WHERE user_id = $1 AND workspace_id = $2',
                [userId, workspaceId]
            );
            
            return result.rowCount > 0;
        } catch (error) {
            console.error('Error removing favorite:', error);
            throw error;
        }
    }

    // Find favorites by user ID
    static async findByUserId(userId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            
            const result = await pool.query(
                `SELECT f.*, w.name, w.capacity, w.price_per_day, w.city, 
                        w.amenities, w.status, w.image_url, u.username as owner_name
                 FROM favorites f
                 JOIN workspaces w ON f.workspace_id = w.id
                 JOIN users u ON w.user_id = u.id
                 WHERE f.user_id = $1
                 ORDER BY f.created_at DESC
                 LIMIT $2 OFFSET $3`,
                [userId, limit, offset]
            );
            
            const countResult = await pool.query(
                'SELECT COUNT(*) as total FROM favorites WHERE user_id = $1',
                [userId]
            );
            
            // Convert amenities
            const formattedFavorites = result.rows.map(favorite => {
                try {
                     if (typeof favorite.amenities === 'string') {
                        favorite.amenities = JSON.parse(favorite.amenities);
                    }
                } catch (e) {
                }
                return favorite;
            });
            
            const total = parseInt(countResult.rows[0].total);

            return {
                favorites: formattedFavorites,
                total: total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            console.error('Error finding favorites:', error);
            throw error;
        }
    }

    // Check if workspace is favorite
    static async isFavorite(userId, workspaceId) {
        try {
            const result = await pool.query(
                'SELECT id FROM favorites WHERE user_id = $1 AND workspace_id = $2',
                [userId, workspaceId]
            );
            
            return result.rowCount > 0;
        } catch (error) {
            console.error('Error checking favorite:', error);
            throw error;
        }
    }

    // Get favorite IDs for user
    static async getFavoriteIds(userId) {
        try {
            const result = await pool.query(
                'SELECT workspace_id FROM favorites WHERE user_id = $1',
                [userId]
            );
            
            return result.rows.map(row => row.workspace_id);
        } catch (error) {
            console.error('Error getting favorite ids:', error);
            throw error;
        }
    }
}

module.exports = Favorite;