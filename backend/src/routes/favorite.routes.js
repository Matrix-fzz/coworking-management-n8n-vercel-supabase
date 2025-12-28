const express = require('express');
const router = express.Router();
const FavoriteController = require('../controllers/favorite.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Protected routes
router.post('/:itemId', authMiddleware, FavoriteController.add);
router.delete('/:itemId', authMiddleware, FavoriteController.remove);
router.get('/my-favorites', authMiddleware, FavoriteController.getUserFavorites);
router.get('/check/:itemId', authMiddleware, FavoriteController.checkFavorite);

module.exports = router;