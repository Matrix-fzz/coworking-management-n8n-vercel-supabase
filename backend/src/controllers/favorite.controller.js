const Favorite = require('../models/favorite.model');
const ApiResponse = require('../utils/response');

class FavoriteController {
    // Ajouter aux favoris
    static async add(req, res) {
        try {
            const userId = req.user.id;
            const workspaceId = parseInt(req.params.itemId);

            const favorite = await Favorite.add(userId, workspaceId);

            res.status(201).json(
                ApiResponse.success(
                    { favorite },
                    'Added to favorites successfully'
                )
            );
        } catch (error) {
            console.error('Add favorite error:', error);
            
            if (error.message === 'Workspace not found') {
                return res.status(404).json(
                    ApiResponse.notFound('Workspace not found')
                );
            }
            
            if (error.message === 'Already in favorites') {
                return res.status(400).json(
                    ApiResponse.error('Already in favorites')
                );
            }
            
            res.status(500).json(
                ApiResponse.error(error.message || 'Failed to add to favorites')
            );
        }
    }

    // Retirer des favoris
    static async remove(req, res) {
        try {
            const userId = req.user.id;
            const workspaceId = parseInt(req.params.itemId);

            const removed = await Favorite.remove(userId, workspaceId);
            
            if (!removed) {
                return res.status(404).json(
                    ApiResponse.notFound('Favorite not found')
                );
            }

            res.json(
                ApiResponse.success(
                    null,
                    'Removed from favorites successfully'
                )
            );
        } catch (error) {
            console.error('Remove favorite error:', error);
            res.status(500).json(
                ApiResponse.error(error.message || 'Failed to remove from favorites')
            );
        }
    }

    // Récupérer les favoris de l'utilisateur
    static async getUserFavorites(req, res) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const result = await Favorite.findByUserId(userId, page, limit);

            res.json(
                ApiResponse.success(
                    result,
                    'Favorites retrieved successfully'
                )
            );
        } catch (error) {
            console.error('Get favorites error:', error);
            res.status(500).json(
                ApiResponse.error(error.message || 'Failed to get favorites')
            );
        }
    }

    // Vérifier si un espace est en favoris
    static async checkFavorite(req, res) {
        try {
            const userId = req.user.id;
            const workspaceId = parseInt(req.params.itemId);

            const isFavorite = await Favorite.isFavorite(userId, workspaceId);

            res.json(
                ApiResponse.success(
                    { isFavorite },
                    'Favorite status retrieved'
                )
            );
        } catch (error) {
            console.error('Check favorite error:', error);
            res.status(500).json(
                ApiResponse.error(error.message || 'Failed to check favorite status')
            );
        }
    }
}

module.exports = FavoriteController;