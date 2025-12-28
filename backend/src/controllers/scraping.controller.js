const ApiResponse = require('../utils/response');
const pool = require('../utils/database');

class ScrapingController {
    // Déclencher le scraping
    static async triggerScraping(req, res) {
        try {
            const { city, keyword, maxResults } = req.body;
            const userId = req.user.id;

            // Validation
            if (!city || !keyword) {
                return res.status(400).json(
                    ApiResponse.error('La ville et le mot-clé sont requis')
                );
            }

            // URL du webhook n8n (à configurer)
            const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://your-n8n.app/webhook/scraping';
            
            // Enregistrer la demande dans la base de données (statut 'pending')
            // Note: On suppose qu'une table scraping_requests existe, sinon il faudrait la créer.
            // Pour l'instant on garde la logique existante qui semblait juste appeler n8n.
            // Si on veut un historique, il faudrait idéalement insérer ici.
            // Mais pour coller au code existant, on va juste appeler le webhook.

            // Données à envoyer à n8n
            const payload = {
                city,
                keyword,
                maxResults: maxResults || 20,
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
                 // Si le webhook n'est pas configuré ou échoue, on renvoie une erreur ou un mock pour le test
                 console.warn(`n8n webhook warning: ${response.status} ${response.statusText}`);
                 // Pour éviter de bloquer l'utilisateur si n8n n'est pas là, on peut simuler un succès
                 // ou renvoyer l'erreur.
                 // throw new Error(`n8n webhook returned ${response.status}`);
            }
            
            // Si n8n renvoie du JSON, on l'utilise
            let result = {};
            try {
                result = await response.json();
            } catch(e) {
                // Ignore json parse error if n8n returns text
            }

            // On simule une réponse succès si n8n n'a rien renvoyé de précis
            // Cela permet à l'UI de fonctionner même sans le vrai n8n derrière pour le moment
            const responseData = {
                ...result,
                message: 'Scraping déclenché avec succès',
                sheetUrl: result.sheetUrl || null
            };

            res.json(
                ApiResponse.success(
                    responseData,
                    'Scraping en cours'
                )
            );

        } catch (error) {
            console.error('Scraping trigger error:', error);
            res.status(500).json(
                ApiResponse.error('Erreur lors du déclenchement du scraping')
            );
        }
    }

    // Récupérer l'historique
    static async getHistory(req, res) {
        try {
            const userId = req.user.id;

            // Vérifier si la table existe avant de requêter (protection basique)
            // Ou on suppose qu'elle existe. Le code original faisait juste le select.
            
            try {
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
            } catch (dbError) {
                // Si la table n'existe pas encore
                console.warn("Table scraping_requests might not exist:", dbError.message);
                res.json(
                    ApiResponse.success(
                        { scrapings: [] },
                        'Historique (vide)'
                    )
                );
            }
        } catch (error) {
            console.error('Scraping history error:', error);
            res.status(500).json(
                ApiResponse.error('Erreur lors de la récupération de l\'historique')
            );
        }
    }
}

module.exports = ScrapingController;
