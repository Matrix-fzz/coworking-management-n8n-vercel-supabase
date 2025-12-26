const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const ApiResponse = require('../utils/response');

// Route pour déclencher le scraping
router.post('/trigger', authMiddleware, async (req, res) => {
    try {
        const { city, keyword } = req.body;
        const userId = req.user.id;

        // Validation
        if (!city || !keyword) {
            return res.status(400).json(
                ApiResponse.error('La ville et le mot-clé sont requis')
            );
        }

        // URL du webhook n8n (à configurer)
        const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://your-n8n.app/webhook/scraping';

        // Données à envoyer à n8n
        const payload = {
            city,
            keyword,
            userId,
            userEmail: req.user.email,
            timestamp: new Date().toISOString()
        };

        // Appeler le webhook n8n
        const response = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`n8n webhook returned ${response.status}`);
        }

        const result = await response.json();

        res.json(
            ApiResponse.success(
                {
                    ...result,
                    message: 'Scraping déclenché avec succès'
                },
                'Scraping en cours'
            )
        );

    } catch (error) {
        console.error('Scraping trigger error:', error);
        res.status(500).json(
            ApiResponse.error('Erreur lors du déclenchement du scraping')
        );
    }
});

// Route pour récupérer l'historique des scrapings
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const pool = require('../utils/database');
        const userId = req.user.id;

        const [scrapings] = await pool.execute(
            'SELECT * FROM scraping_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
            [userId]
        );

        res.json(
            ApiResponse.success(
                { scrapings },
                'Historique récupéré'
            )
        );
    } catch (error) {
        console.error('Scraping history error:', error);
        res.status(500).json(
            ApiResponse.error('Erreur lors de la récupération de l\'historique')
        );
    }
});

module.exports = router;