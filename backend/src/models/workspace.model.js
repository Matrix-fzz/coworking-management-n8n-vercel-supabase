const pool = require('../utils/database');

class Workspace {
    // Récupérer tous les espaces avec pagination
    static async findAll(page = 1, limit = 6, filters = {}) {
        try {
            const offset = (page - 1) * limit;
            let query = 'SELECT w.*, u.username as owner_name FROM workspaces w JOIN users u ON w.user_id = u.id WHERE 1=1';
            let countQuery = 'SELECT COUNT(*) as total FROM workspaces w WHERE 1=1';
            const values = [];
            const countValues = [];

            // Appliquer les filtres
            if (filters.city) {
                query += ' AND w.city LIKE ?';
                countQuery += ' AND w.city LIKE ?';
                values.push(`%${filters.city}%`);
                countValues.push(`%${filters.city}%`);
            }

            if (filters.status) {
                query += ' AND w.status = ?';
                countQuery += ' AND w.status = ?';
                values.push(filters.status);
                countValues.push(filters.status);
            }

            if (filters.minPrice) {
                query += ' AND w.price_per_day >= ?';
                countQuery += ' AND w.price_per_day >= ?';
                values.push(filters.minPrice);
                countValues.push(filters.minPrice);
            }

            if (filters.maxPrice) {
                query += ' AND w.price_per_day <= ?';
                countQuery += ' AND w.price_per_day <= ?';
                values.push(filters.maxPrice);
                countValues.push(filters.maxPrice);
            }

            if (filters.search) {
                query += ' AND (w.name LIKE ? OR w.city LIKE ? OR w.amenities LIKE ?)';
                countQuery += ' AND (w.name LIKE ? OR w.city LIKE ? OR w.amenities LIKE ?)';
                values.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
                countValues.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
            }

            // Ajouter l'ordre et la pagination
            query += ' ORDER BY w.created_at DESC LIMIT ? OFFSET ?';
            values.push(limit, offset);

            // Exécuter les requêtes
            const [workspaces] = await pool.execute(query, values);
            const [[countResult]] = await pool.execute(countQuery, countValues);

            // Convertir les amenities de JSON string à array si nécessaire
            const formattedWorkspaces = workspaces.map(workspace => {
                try {
                    workspace.amenities = JSON.parse(workspace.amenities);
                } catch (e) {
                    // Si ce n'est pas du JSON valide, le garder tel quel
                }
                return workspace;
            });

            return {
                workspaces: formattedWorkspaces,
                total: countResult.total,
                page: parseInt(page),
                totalPages: Math.ceil(countResult.total / limit)
            };
        } catch (error) {
            console.error('Error finding workspaces:', error);
            throw error;
        }
    }

    // Trouver un espace par ID
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT w.*, u.username as owner_name FROM workspaces w JOIN users u ON w.user_id = u.id WHERE w.id = ?',
                [id]
            );
            
            if (rows[0]) {
                try {
                    rows[0].amenities = JSON.parse(rows[0].amenities);
                } catch (e) {
                    // Si ce n'est pas du JSON valide
                }
            }
            
            return rows[0] || null;
        } catch (error) {
            console.error('Error finding workspace by id:', error);
            throw error;
        }
    }

    // Créer un nouvel espace
    static async create(workspaceData) {
        const { name, capacity, price_per_day, city, amenities, status, image_url, user_id } = workspaceData;
        
        try {
            // Convertir amenities en JSON string si c'est un array
            const amenitiesJson = Array.isArray(amenities) 
                ? JSON.stringify(amenities) 
                : amenities;
            
            const [result] = await pool.execute(
                'INSERT INTO workspaces (name, capacity, price_per_day, city, amenities, status, image_url, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [name, capacity, price_per_day, city, amenitiesJson, status, image_url, user_id]
            );
            
            return {
                id: result.insertId,
                ...workspaceData,
                amenities: Array.isArray(amenities) ? amenities : JSON.parse(amenities)
            };
        } catch (error) {
            console.error('Error creating workspace:', error);
            throw error;
        }
    }

    // Mettre à jour un espace
    static async update(id, updateData, userId) {
        try {
            // Vérifier que l'utilisateur est le propriétaire
            const [workspace] = await pool.execute(
                'SELECT user_id FROM workspaces WHERE id = ?',
                [id]
            );
            
            if (!workspace[0]) {
                throw new Error('Workspace not found');
            }
            
            if (workspace[0].user_id !== userId) {
                throw new Error('Not authorized to update this workspace');
            }
            
            const fields = [];
            const values = [];
            
            const allowedFields = ['name', 'capacity', 'price_per_day', 'city', 'amenities', 'status', 'image_url'];
            
            allowedFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    if (field === 'amenities' && Array.isArray(updateData[field])) {
                        fields.push(`${field} = ?`);
                        values.push(JSON.stringify(updateData[field]));
                    } else {
                        fields.push(`${field} = ?`);
                        values.push(updateData[field]);
                    }
                }
            });
            
            if (fields.length === 0) {
                return null;
            }
            
            values.push(id);
            
            const [result] = await pool.execute(
                `UPDATE workspaces SET ${fields.join(', ')} WHERE id = ?`,
                values
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating workspace:', error);
            throw error;
        }
    }

    // Supprimer un espace
    static async delete(id, userId) {
        try {
            // Vérifier que l'utilisateur est le propriétaire
            const [workspace] = await pool.execute(
                'SELECT user_id FROM workspaces WHERE id = ?',
                [id]
            );
            
            if (!workspace[0]) {
                throw new Error('Workspace not found');
            }
            
            if (workspace[0].user_id !== userId) {
                throw new Error('Not authorized to delete this workspace');
            }
            
            const [result] = await pool.execute(
                'DELETE FROM workspaces WHERE id = ?',
                [id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting workspace:', error);
            throw error;
        }
    }

    // Récupérer les espaces d'un utilisateur
    static async findByUserId(userId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            
            const [workspaces] = await pool.execute(
                'SELECT * FROM workspaces WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
                [userId, limit, offset]
            );
            
            const [[countResult]] = await pool.execute(
                'SELECT COUNT(*) as total FROM workspaces WHERE user_id = ?',
                [userId]
            );
            
            // Convertir amenities
            const formattedWorkspaces = workspaces.map(workspace => {
                try {
                    workspace.amenities = JSON.parse(workspace.amenities);
                } catch (e) {
                    // Si ce n'est pas du JSON valide
                }
                return workspace;
            });
            
            return {
                workspaces: formattedWorkspaces,
                total: countResult.total,
                page: parseInt(page),
                totalPages: Math.ceil(countResult.total / limit)
            };
        } catch (error) {
            console.error('Error finding workspaces by user id:', error);
            throw error;
        }
    }
}

module.exports = Workspace;