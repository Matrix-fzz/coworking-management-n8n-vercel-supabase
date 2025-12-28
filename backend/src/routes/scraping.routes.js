const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const ScrapingController = require('../controllers/scraping.controller');

// Route pour déclencher le scraping
router.post('/trigger', authMiddleware, ScrapingController.triggerScraping);

// Route pour récupérer l'historique des scrapings
router.get('/history', authMiddleware, ScrapingController.getHistory);

module.exports = router;