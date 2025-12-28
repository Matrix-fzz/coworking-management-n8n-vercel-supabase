const Workspace = require('../models/workspace.model');
const Favorite = require('../models/favorite.model');
const ApiResponse = require('../utils/response');

class WorkspaceController {
    // Récupérer tous les espaces (public)
    static async getAll(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 6;
            
            // Filtres
            const filters = {
                city: req.query.city,
                status: req.query.status,
                minPrice: req.query.minPrice,
                maxPrice: req.query.maxPrice,
                minCapacity: req.query.minCapacity,
                search: req.query.search,
                sortBy: req.query.sortBy,
                amenities: req.query.amenities ? (Array.isArray(req.query.amenities) ? req.query.amenities : req.query.amenities.split(',')) : undefined
            };

            // Récupérer les espaces
            const result = await Workspace.findAll(page, limit, filters);

            // Si l'utilisateur est connecté, ajouter l'état des favoris
            if (req.user) {
                const favoriteIds = await Favorite.getFavoriteIds(req.user.id);
                result.workspaces = result.workspaces.map(workspace => ({
                    ...workspace,
                    isFavorite: favoriteIds.includes(workspace.id)
                }));
            } else {
                // Pour les utilisateurs non connectés
                result.workspaces = result.workspaces.map(workspace => ({
                    ...workspace,
                    isFavorite: false
                }));
            }

            res.json(
                ApiResponse.success(
                    result,
                    'Workspaces retrieved successfully'
                )
            );
        } catch (error) {
            console.error('Get workspaces error:', error);
            res.status(500).json(
                ApiResponse.error(error.message || 'Failed to get workspaces')
            );
        }
    }

    // Récupérer un espace par ID (public)
    static async getById(req, res) {
        try {
            const workspaceId = parseInt(req.params.id);
            
            const workspace = await Workspace.findById(workspaceId);
            
            if (!workspace) {
                return res.status(404).json(
                    ApiResponse.notFound('Workspace not found')
                );
            }

            // Vérifier si c'est un favori
            if (req.user) {
                workspace.isFavorite = await Favorite.isFavorite(req.user.id, workspaceId);
            } else {
                workspace.isFavorite = false;
            }

            res.json(
                ApiResponse.success(
                    { workspace },
                    'Workspace retrieved successfully'
                )
            );
        } catch (error) {
            console.error('Get workspace by id error:', error);
            res.status(500).json(
                ApiResponse.error(error.message || 'Failed to get workspace')
            );
        }
    }

    // Créer un nouvel espace (protégé)
    static async create(req, res) {
        try {
            const userId = req.user.id;
            const workspaceData = {
                ...req.body,
                user_id: userId
            };

            // Assurer que amenities est un tableau
            if (workspaceData.amenities && typeof workspaceData.amenities === 'string') {
                try {
                    workspaceData.amenities = JSON.parse(workspaceData.amenities);
                } catch (e) {
                    // Si ce n'est pas du JSON, le convertir en tableau
                    workspaceData.amenities = workspaceData.amenities.split(',').map(item => item.trim());
                }
            }

            const workspace = await Workspace.create(workspaceData);

            res.status(201).json(
                ApiResponse.success(
                    { workspace },
                    'Workspace created successfully'
                )
            );
        } catch (error) {
            console.error('Create workspace error:', error);
            res.status(500).json(
                ApiResponse.error(error.message || 'Failed to create workspace')
            );
        }
    }

    // Mettre à jour un espace (protégé)
    static async update(req, res) {
        try {
            const workspaceId = parseInt(req.params.id);
            const userId = req.user.id;
            const updateData = req.body;

            // Convertir amenities si nécessaire
            if (updateData.amenities && typeof updateData.amenities === 'string') {
                try {
                    updateData.amenities = JSON.parse(updateData.amenities);
                } catch (e) {
                    updateData.amenities = updateData.amenities.split(',').map(item => item.trim());
                }
            }

            const updated = await Workspace.update(workspaceId, updateData, userId);
            
            if (!updated) {
                return res.status(404).json(
                    ApiResponse.notFound('Workspace not found or not authorized')
                );
            }

            // Récupérer l'espace mis à jour
            const workspace = await Workspace.findById(workspaceId);

            res.json(
                ApiResponse.success(
                    { workspace },
                    'Workspace updated successfully'
                )
            );
        } catch (error) {
            console.error('Update workspace error:', error);
            
            if (error.message === 'Not authorized to update this workspace') {
                return res.status(403).json(
                    ApiResponse.forbidden('Not authorized to update this workspace')
                );
            }
            
            res.status(500).json(
                ApiResponse.error(error.message || 'Failed to update workspace')
            );
        }
    }

    // Supprimer un espace (protégé)
    static async delete(req, res) {
        try {
            const workspaceId = parseInt(req.params.id);
            const userId = req.user.id;

            const deleted = await Workspace.delete(workspaceId, userId);
            
            if (!deleted) {
                return res.status(404).json(
                    ApiResponse.notFound('Workspace not found or not authorized')
                );
            }

            res.json(
                ApiResponse.success(
                    null,
                    'Workspace deleted successfully'
                )
            );
        } catch (error) {
            console.error('Delete workspace error:', error);
            
            if (error.message === 'Not authorized to delete this workspace') {
                return res.status(403).json(
                    ApiResponse.forbidden('Not authorized to delete this workspace')
                );
            }
            
            res.status(500).json(
                ApiResponse.error(error.message || 'Failed to delete workspace')
            );
        }
    }

    // Récupérer les espaces d'un utilisateur (protégé)
    static async getUserWorkspaces(req, res) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const result = await Workspace.findByUserId(userId, page, limit);

            res.json(
                ApiResponse.success(
                    result,
                    'User workspaces retrieved successfully'
                )
            );
        } catch (error) {
            console.error('Get user workspaces error:', error);
            res.status(500).json(
                ApiResponse.error(error.message || 'Failed to get user workspaces')
            );
        }
    }
}

module.exports = WorkspaceController;