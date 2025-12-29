const pool = require('../utils/database');

class Workspace {
    // Find all workspaces with pagination and filters
    static async findAll(page = 1, limit = 6, filters = {}) {
        try {
            const offset = (page - 1) * limit;
            let query = 'SELECT w.*, u.username as owner_name FROM workspaces w JOIN users u ON w.user_id = u.id WHERE 1=1';
            let countQuery = 'SELECT COUNT(*) as total FROM workspaces w WHERE 1=1';
            const values = [];
            const countValues = [];
            let paramIndex = 1;

            // Apply filters
            if (filters.city) {
                query += ` AND w.city ILIKE $${paramIndex}`; // ILIKE for case-insensitive
                countQuery += ` AND w.city ILIKE $${paramIndex}`;
                values.push(`%${filters.city}%`);
                countValues.push(`%${filters.city}%`);
                paramIndex++;
            }

            if (filters.status) {
                query += ` AND w.status = $${paramIndex}`;
                countQuery += ` AND w.status = $${paramIndex}`;
                values.push(filters.status);
                countValues.push(filters.status);
                paramIndex++;
            }

            if (filters.minPrice) {
                query += ` AND w.price_per_day >= $${paramIndex}`;
                countQuery += ` AND w.price_per_day >= $${paramIndex}`;
                values.push(filters.minPrice);
                countValues.push(filters.minPrice);
                paramIndex++;
            }

            if (filters.maxPrice) {
                query += ` AND w.price_per_day <= $${paramIndex}`;
                countQuery += ` AND w.price_per_day <= $${paramIndex}`;
                values.push(filters.maxPrice);
                countValues.push(filters.maxPrice);
                paramIndex++;
            }

            if (filters.minCapacity) {
                query += ` AND w.capacity >= $${paramIndex}`;
                countQuery += ` AND w.capacity >= $${paramIndex}`;
                values.push(filters.minCapacity);
                countValues.push(filters.minCapacity);
                paramIndex++;
            }

            if (filters.amenities && Array.isArray(filters.amenities)) {
                filters.amenities.forEach(amenity => {
                    query += ` AND w.amenities LIKE $${paramIndex}`;
                    countQuery += ` AND w.amenities LIKE $${paramIndex}`;
                    values.push(`%${amenity}%`);
                    countValues.push(`%${amenity}%`);
                    paramIndex++;
                });
            }

            if (filters.search) {
                query += ` AND (w.name ILIKE $${paramIndex} OR w.city ILIKE $${paramIndex} OR w.amenities ILIKE $${paramIndex})`;
                countQuery += ` AND (w.name ILIKE $${paramIndex} OR w.city ILIKE $${paramIndex} OR w.amenities ILIKE $${paramIndex})`;
                values.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
                countValues.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
                paramIndex++;
            }

            // Ordering
            let orderByClause = 'ORDER BY w.created_at DESC'; // Default

            if (filters.sortBy) {
                switch (filters.sortBy) {
                    case 'price_asc':
                        orderByClause = 'ORDER BY w.price_per_day ASC';
                        break;
                    case 'price_desc':
                        orderByClause = 'ORDER BY w.price_per_day DESC';
                        break;
                    case 'capacity':
                        orderByClause = 'ORDER BY w.capacity DESC';
                        break;
                    case 'newest':
                    default:
                        orderByClause = 'ORDER BY w.created_at DESC';
                        break;
                }
            }

            query += ` ${orderByClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            values.push(limit, offset);

            // Execute queries
            const result = await pool.query(query, values);
            const countResult = await pool.query(countQuery, countValues);

            // Format workspaces
            const formattedWorkspaces = result.rows.map(workspace => {
                try {
                    // Check if amenities is already an object/array (pg might parse JSON automatically if column was JSON type, but here it is TEXT)
                    if (typeof workspace.amenities === 'string') {
                         workspace.amenities = JSON.parse(workspace.amenities);
                    }
                } catch (e) {
                    // keep as is
                }
                return workspace;
            });

            const total = parseInt(countResult.rows[0].total);

            return {
                workspaces: formattedWorkspaces,
                total: total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            console.error('Error finding workspaces:', error);
            throw error;
        }
    }

    // Find workspace by ID
    static async findById(id) {
        try {
            const result = await pool.query(
                'SELECT w.*, u.username as owner_name FROM workspaces w JOIN users u ON w.user_id = u.id WHERE w.id = $1',
                [id]
            );
            
            if (result.rows[0]) {
                try {
                    if (typeof result.rows[0].amenities === 'string') {
                        result.rows[0].amenities = JSON.parse(result.rows[0].amenities);
                    }
                } catch (e) {
                    // keep as is
                }
            }
            
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding workspace by id:', error);
            throw error;
        }
    }

    // Create a new workspace
    static async create(workspaceData) {
        const { name, capacity, price_per_day, city, amenities, status, image_url, user_id } = workspaceData;
        
        try {
            const amenitiesJson = Array.isArray(amenities) 
                ? JSON.stringify(amenities) 
                : amenities;
            
            const result = await pool.query(
                'INSERT INTO workspaces (name, capacity, price_per_day, city, amenities, status, image_url, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                [name, capacity, price_per_day, city, amenitiesJson, status, image_url, user_id]
            );
            
            const newWorkspace = result.rows[0];
            
             try {
                if (typeof newWorkspace.amenities === 'string') {
                    newWorkspace.amenities = JSON.parse(newWorkspace.amenities);
                }
            } catch (e) { }

            return newWorkspace;
        } catch (error) {
            console.error('Error creating workspace:', error);
            throw error;
        }
    }

    // Update a workspace
    static async update(id, updateData, userId) {
        try {
            // Check ownership
            const workspaceResult = await pool.query(
                'SELECT user_id FROM workspaces WHERE id = $1',
                [id]
            );
            
            if (!workspaceResult.rows[0]) {
                throw new Error('Workspace not found');
            }
            
            // Ownership check (uncomment if strict ownership is enforced again)
            // if (workspaceResult.rows[0].user_id !== userId) { ... }
            
            const fields = [];
            const values = [];
            let paramIndex = 1;
            
            const allowedFields = ['name', 'capacity', 'price_per_day', 'city', 'amenities', 'status', 'image_url'];
            
            allowedFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    fields.push(`${field} = $${paramIndex}`);
                    paramIndex++;
                    
                    if (field === 'amenities' && Array.isArray(updateData[field])) {
                        values.push(JSON.stringify(updateData[field]));
                    } else {
                        values.push(updateData[field]);
                    }
                }
            });
            
            if (fields.length === 0) {
                return null;
            }
            
            values.push(id);
            
            const result = await pool.query(
                `UPDATE workspaces SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
                values
            );
            
            return result.rowCount > 0;
        } catch (error) {
            console.error('Error updating workspace:', error);
            throw error;
        }
    }

    // Delete a workspace
    static async delete(id, userId) {
        try {
            const workspaceResult = await pool.query(
                'SELECT user_id FROM workspaces WHERE id = $1',
                [id]
            );
            
            if (!workspaceResult.rows[0]) {
                throw new Error('Workspace not found');
            }
            
            const result = await pool.query(
                'DELETE FROM workspaces WHERE id = $1',
                [id]
            );
            
            return result.rowCount > 0;
        } catch (error) {
            console.error('Error deleting workspace:', error);
            throw error;
        }
    }

    // Find workspaces by user ID
    static async findByUserId(userId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            
            const result = await pool.query(
                'SELECT * FROM workspaces WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
                [userId, limit, offset]
            );
            
            const countResult = await pool.query(
                'SELECT COUNT(*) as total FROM workspaces WHERE user_id = $1',
                [userId]
            );
            
            const formattedWorkspaces = result.rows.map(workspace => {
                try {
                     if (typeof workspace.amenities === 'string') {
                        workspace.amenities = JSON.parse(workspace.amenities);
                    }
                } catch (e) {
                }
                return workspace;
            });
            
            const total = parseInt(countResult.rows[0].total);

            return {
                workspaces: formattedWorkspaces,
                total: total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            console.error('Error finding workspaces by user id:', error);
            throw error;
        }
    }
}

module.exports = Workspace;