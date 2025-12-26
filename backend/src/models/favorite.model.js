const pool = require('../utils/database');

class Favorite {
    // Ajouter aux favoris
    static async add(userId, workspaceId) {
        try {
            // Vérifier si l'espace existe
            const [workspace] = await pool.execute(
                'SELECT id FROM workspaces WHERE id = ?',
                [workspaceId]
            );
            
            if (!workspace[0]) {
                throw new Error('Workspace not found');
            }
            
            // Vérifier si déjà en favoris
            const [existing] = await pool.execute(
                'SELECT id FROM favorites WHERE user_id = ? AND workspace_id = ?',
                [userId, workspaceId]
            );
            
            if (existing[0]) {
                throw new Error('Already in favorites');
            }
            
            const [result] = await pool.execute(
                'INSERT INTO favorites (user_id, workspace_id) VALUES (?, ?)',
                [userId, workspaceId]
            );
            
            return {
                id: result.insertId,
                user_id: userId,
                workspace_id: workspaceId,
                created_at: new Date()
            };
        } catch (error) {
            console.error('Error adding favorite:', error);
            throw error;
        }
    }

    // Retirer des favoris
    static async remove(userId, workspaceId) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM favorites WHERE user_id = ? AND workspace_id = ?',
                [userId, workspaceId]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error removing favorite:', error);
            throw error;
        }
    }

    // Récupérer les favoris d'un utilisateur
    static async findByUserId(userId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            
            const [favorites] = await pool.execute(
                `SELECT f.*, w.name, w.capacity, w.price_per_day, w.city, 
                        w.amenities, w.status, w.image_url, u.username as owner_name
                 FROM favorites f
                 JOIN workspaces w ON f.workspace_id = w.id
                 JOIN users u ON w.user_id = u.id
                 WHERE f.user_id = ?
                 ORDER BY f.created_at DESC
                 LIMIT ? OFFSET ?`,
                [userId, limit, offset]
            );
            
            const [[countResult]] = await pool.execute(
                'SELECT COUNT(*) as total FROM favorites WHERE user_id = ?',
                [userId]
            );
            
            // Convertir amenities
            const formattedFavorites = favorites.map(favorite => {
                try {
                    favorite.amenities = JSON.parse(favorite.amenities);
                } catch (e) {
                    // Si ce n'est pas du JSON valide
                }
                return favorite;
            });
            
            return {
                favorites: formattedFavorites,
                total: countResult.total,
                page: parseInt(page),
                totalPages: Math.ceil(countResult.total / limit)
            };
        } catch (error) {
            console.error('Error finding favorites:', error);
            throw error;
        }
    }

    // Vérifier si un espace est en favoris
    static async isFavorite(userId, workspaceId) {
        try {
            const [rows] = await pool.execute(
                'SELECT id FROM favorites WHERE user_id = ? AND workspace_id = ?',
                [userId, workspaceId]
            );
            
            return rows.length > 0;
        } catch (error) {
            console.error('Error checking favorite:', error);
            throw error;
        }
    }

    // Récupérer les IDs des favoris d'un utilisateur
    static async getFavoriteIds(userId) {
        try {
            const [rows] = await pool.execute(
                'SELECT workspace_id FROM favorites WHERE user_id = ?',
                [userId]
            );
            
            return rows.map(row => row.workspace_id);
        } catch (error) {
            console.error('Error getting favorite ids:', error);
            throw error;
        }
    }
}

module.exports = Favorite;