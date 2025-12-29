const pool = require('../utils/database');
const bcrypt = require('bcryptjs');

class User {
    // Find user by email
    static async findByEmail(email) {
        try {
            const result = await pool.query(
                'SELECT * FROM users WHERE email = $1',
                [email]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }

    // Find user by ID
    static async findById(id) {
        try {
            const result = await pool.query(
                'SELECT id, username, email, created_at FROM users WHERE id = $1',
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding user by id:', error);
            throw error;
        }
    }

    // Create a new user
    static async create(userData) {
        const { username, email, password } = userData;
        
        try {
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            
            const result = await pool.query(
                'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
                [username, email, passwordHash]
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    // Verify password
    static async verifyPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    // Update a user
    static async update(id, updateData) {
        try {
            const fields = [];
            const values = [];
            let paramIndex = 1;
            
            if (updateData.username) {
                fields.push(`username = $${paramIndex}`);
                values.push(updateData.username);
                paramIndex++;
            }
            
            if (updateData.email) {
                fields.push(`email = $${paramIndex}`);
                values.push(updateData.email);
                paramIndex++;
            }
            
            if (updateData.password) {
                const salt = await bcrypt.genSalt(10);
                const passwordHash = await bcrypt.hash(updateData.password, salt);
                fields.push(`password_hash = $${paramIndex}`);
                values.push(passwordHash);
                paramIndex++;
            }
            
            if (fields.length === 0) {
                return null;
            }
            
            values.push(id);
            
            const result = await pool.query(
                `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
                values
            );
            
            return result.rowCount > 0;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    // Delete a user
    static async delete(id) {
        try {
            const result = await pool.query(
                'DELETE FROM users WHERE id = $1',
                [id]
            );
            return result.rowCount > 0;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }
}

module.exports = User;