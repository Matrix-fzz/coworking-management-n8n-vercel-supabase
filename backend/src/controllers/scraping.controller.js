const ApiResponse = require("../utils/response");
const pool = require("../utils/database");

class ScrapingController {
  // Déclencher le scraping
  static async triggerScraping(req, res) {
    // Updated to Production URL
    console.log("ScrapingController.triggerScraping called");
    try {
      const { city, keyword, maxResults } = req.body;
      const userId = req.user.id;

      // Validation
      if (!city || !keyword) {
        return res
          .status(400)
          .json(ApiResponse.error("La ville et le mot-clé sont requis"));
      }

      // URL du webhook n8n (à configurer)
      const n8nWebhookUrl = process.env.N8N_SCRAPING_WEBHOOK_URL ;
      console.log("DEBUG - Using n8n Webhook URL:", n8nWebhookUrl);

      if (!n8nWebhookUrl) {
        console.error(
          "N8N_SCRAPING_WEBHOOK_URL  is not defined in environment variables"
        );
        return res
          .status(503)
          .json(
            ApiResponse.error(
              "Le service de scraping n'est pas configuré (URL manquante)"
            )
          );
      }

      // Données à envoyer à n8n - Simplified to match successful curl request
      const payload = {
        city,
        keyword,
        limit: parseInt(maxResults) || 20, // Send limit to n8n
      };

      console.log(
        `Sending simplified scraping request to n8n: ${n8nWebhookUrl}`,
        payload
      );

      // Appeler le webhook n8n
      let response;
      try {
        response = await fetch(n8nWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } catch (fetchError) {
        console.error("Failed to connect to n8n webhook:", fetchError);
        return res
          .status(502)
          .json(
            ApiResponse.error("Impossible de contacter le service de scraping")
          );
      }

      if (!response.ok) {
        console.error(
          `n8n webhook error: ${response.status} ${response.statusText}`
        );
        const errorText = await response.text();
        console.error(`n8n error details: ${errorText}`);
        return res
          .status(response.status)
          .json(
            ApiResponse.error(
              `Erreur du service de scraping: ${response.statusText}`
            )
          );
      }

      // Si n8n renvoie du JSON, on l'utilise
      let result = {};
      let places = [];

      try {
        const responseText = await response.text();
        // console.log('Raw n8n response:', responseText); // Uncomment for debugging

        try {
          const jsonResponse = JSON.parse(responseText);

          // Handle n8n response formats
          if (Array.isArray(jsonResponse)) {
            places = jsonResponse;
          } else if (jsonResponse.data && Array.isArray(jsonResponse.data)) {
            places = jsonResponse.data;
            result = jsonResponse;
          } else if (
            jsonResponse.places &&
            Array.isArray(jsonResponse.places)
          ) {
            places = jsonResponse.places;
            result = jsonResponse;
          } else if (jsonResponse.title || jsonResponse.place_id) {
            // Case: Single object returned
            console.log("DEBUG - Received single object, wrapping in array");
            places = [jsonResponse];
            result = jsonResponse;
          } else {
            // Fallback
            result = jsonResponse;
          }

          // Normalize places if they are wrapped in a 'json' property (n8n structure)
          // The workflow is configured to return unwrapped objects, but being safe
          if (places.length > 0 && places[0].json) {
            places = places.map((p) => p.json);
          }
        } catch (parseError) {
          console.error("Error parsing n8n response JSON:", parseError);
          // If parsing fails but we have text, maybe it's useful?
          // But usually implies failure.
        }

        console.log(`Received ${places.length} places from n8n`);
      } catch (e) {
        console.log("Error reading response body:", e);
      }

      const responseData = {
        ...result,
        message:
          result.message || `Scraping terminé : ${places.length} lieux trouvés`,
        places: places, // On renvoie les lieux trouvés
        sheetUrl: result.sheetUrl || null,
      };

      res.json(ApiResponse.success(responseData, responseData.message));
    } catch (error) {
      console.error("Scraping trigger error:", error);
      res
        .status(500)
        .json(
          ApiResponse.error("Erreur interne lors du déclenchement du scraping")
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
          "SELECT * FROM scraping_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 10",
          [userId]
        );

        res.json(ApiResponse.success({ scrapings }, "Historique récupéré"));
      } catch (dbError) {
        // Si la table n'existe pas encore
        console.warn(
          "Table scraping_requests might not exist:",
          dbError.message
        );
        res.json(ApiResponse.success({ scrapings: [] }, "Historique (vide)"));
      }
    } catch (error) {
      console.error("Scraping history error:", error);
      res
        .status(500)
        .json(
          ApiResponse.error("Erreur lors de la récupération de l'historique")
        );
    }
  }
}

module.exports = ScrapingController;
