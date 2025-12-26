const pool = require('../utils/database');
const bcrypt = require('bcryptjs');

class User {
    // Trouver un utilisateur par email
    static async findByEmail(email) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }

    // Trouver un utilisateur par ID
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT id, username, email, created_at FROM users WHERE id = ?',
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error finding user by id:', error);
            throw error;
        }
    }

    // Créer un nouvel utilisateur
    static async create(userData) {
        const { username, email, password } = userData;
        
        try {
            // Hasher le mot de passe
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            
            const [result] = await pool.execute(
                'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                [username, email, passwordHash]
            );
            
            return {
                id: result.insertId,
                username,
                email,
                created_at: new Date()
            };
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    // Vérifier le mot de passe
    static async verifyPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    // Mettre à jour un utilisateur
    static async update(id, updateData) {
        try {
            const fields = [];
            const values = [];
            
            if (updateData.username) {
                fields.push('username = ?');
                values.push(updateData.username);
            }
            
            if (updateData.email) {
                fields.push('email = ?');
                values.push(updateData.email);
            }
            
            if (updateData.password) {
                const salt = await bcrypt.genSalt(10);
                const passwordHash = await bcrypt.hash(updateData.password, salt);
                fields.push('password_hash = ?');
                values.push(passwordHash);
            }
            
            if (fields.length === 0) {
                return null;
            }
            
            values.push(id);
            
            const [result] = await pool.execute(
                `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
                values
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    // Supprimer un utilisateur
    static async delete(id) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM users WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }
}

module.exports = User;