const User = require('../models/user.model');
const { generateToken } = require('../utils/jwt');
const ApiResponse = require('../utils/response');

class AuthController {
    // Inscription
    static async register(req, res) {
        try {
            const { username, email, password } = req.body;

            // Vérifier si l'email existe déjà
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(400).json(
                    ApiResponse.error('Email already exists')
                );
            }

            // Vérifier si le username existe déjà
            // Note: Vous devrez ajouter cette méthode au modèle User
            // Pour l'instant, on utilise findByEmail pour la simplicité

            // Créer l'utilisateur
            const user = await User.create({ username, email, password });
            
            // Stocker l'utilisateur dans la session
            req.session.user = {
                id: user.id,
                username: user.username,
                email: user.email
            };

            // Ne pas renvoyer le hash du mot de passe
            delete user.password_hash;

            res.status(201).json(
                ApiResponse.success(
                    {
                        user: {
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            created_at: user.created_at
                        }
                    },
                    'User registered successfully'
                )
            );
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json(
                ApiResponse.error(error.message || 'Registration failed')
            );
        }
    }

    // Connexion
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Trouver l'utilisateur
            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(401).json(
                    ApiResponse.error('Invalid email or password')
                );
            }

            // Vérifier le mot de passe
            const isValidPassword = await User.verifyPassword(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json(
                    ApiResponse.error('Invalid email or password')
                );
            }

            // Stocker l'utilisateur dans la session
            req.session.user = {
                id: user.id,
                username: user.username,
                email: user.email
            };

            res.json(
                ApiResponse.success(
                    {
                        user: {
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            created_at: user.created_at
                        }
                    },
                    'Login successful'
                )
            );
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json(
                ApiResponse.error(error.message || 'Login failed')
            );
        }
    }

    // Déconnexion
    static async logout(req, res) {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json(ApiResponse.error('Logout failed'));
            }
            res.clearCookie('connect.sid'); // Nom par défaut du cookie express-session
            res.json(ApiResponse.success(null, 'Logged out successfully'));
        });
    }

    // Récupérer le profil de l'utilisateur connecté
    static async getProfile(req, res) {
        try {
            const userId = req.user.id;
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json(
                    ApiResponse.error('User not found')
                );
            }

            res.json(
                ApiResponse.success(
                    { user },
                    'Profile retrieved successfully'
                )
            );
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json(
                ApiResponse.error(error.message || 'Failed to get profile')
            );
        }
    }

    // Mettre à jour le profil
    static async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const updateData = req.body;

            const updated = await User.update(userId, updateData);
            
            if (!updated) {
                return res.status(400).json(
                    ApiResponse.error('Failed to update profile')
                );
            }

            // Mettre à jour la session si nécessaire
            if (updateData.username || updateData.email) {
                req.session.user = {
                    ...req.session.user,
                    ...(updateData.username && { username: updateData.username }),
                    ...(updateData.email && { email: updateData.email })
                };
            }

            // Récupérer les nouvelles données de l'utilisateur
            const user = await User.findById(userId);

            res.json(
                ApiResponse.success(
                    { user },
                    'Profile updated successfully'
                )
            );
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json(
                ApiResponse.error(error.message || 'Failed to update profile')
            );
        }
    }
}

module.exports = AuthController;