const ApiResponse = require("../utils/response");

class AgentController {
  static async handleChat(req, res) {
    try {
      const { message, history } = req.body;
      const userId = req.user ? req.user.id : null;

      if (!message) {
        return res.status(400).json(ApiResponse.error("Le message est requis"));
      }

      const n8nAgentWebhookUrl =
        process.env.N8N_AGENT_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;

      console.log(`DEBUG - n8nAgentWebhookUrl found: [${n8nAgentWebhookUrl}]`);
      if (n8nAgentWebhookUrl) {
        console.log(`DEBUG - URL Length: ${n8nAgentWebhookUrl.length}`);
        console.log(
          `DEBUG - URL Prefix: ${n8nAgentWebhookUrl.substring(0, 10)}`
        );
      }

      if (!n8nAgentWebhookUrl) {
        console.error("DEBUG - No n8n webhook URL found in process.env");
        return res
          .status(503)
          .json(ApiResponse.error("Le service d'IA n'est pas configuré"));
      }

      const payload = {
        message: message, // Latest n8n workflow uses $json.body.message
        chatInput: message, // Keep for compatibility with LangChain nodes
        history: history || [],
        userId,
        timestamp: new Date().toISOString(),
      };

      console.log(`DEBUG - Sending payload to n8n:`, JSON.stringify(payload));

      const response = await fetch(n8nAgentWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log(`DEBUG - n8n response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`DEBUG - n8n agent error content: ${errorText}`);
        return res
          .status(response.status)
          .json(
            ApiResponse.error(
              `L'IA (n8n) a répondu avec une erreur : ${response.status}`
            )
          );
      }

      const responseText = await response.text();
      console.log(`DEBUG - n8n raw response: [${responseText}]`);

      if (!responseText || responseText.trim() === "") {
        console.error("DEBUG - n8n returned an empty response");
        return res
          .status(502)
          .json(
            ApiResponse.error(
              "L'IA (n8n) a renvoyé une réponse vide. Vérifiez que le workflow est bien configuré avec un nœud 'Respond to Webhook'."
            )
          );
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`DEBUG - Failed to parse n8n response as JSON: ${parseError.message}`);
        return res
          .status(502)
          .json(
            ApiResponse.error(
              "La réponse de l'IA n'est pas au format JSON valide."
            )
          );
      }
      
      console.log(`DEBUG - n8n result:`, JSON.stringify(result));

      // Check if n8n is in test mode (returns "Workflow was started")
      if (result.message === "Workflow was started") {
        console.error(
          "DEBUG - n8n workflow is in test mode, not returning actual response"
        );
        return res
          .status(503)
          .json(
            ApiResponse.error(
              "Le workflow n8n est en mode test. Veuillez activer le workflow en production ou cliquer sur 'Listen for test event' dans n8n."
            )
          );
      }

      // Parse n8n response - try different formats
      // The new workflow responds with { output: "...", success: true }
      const aiResponse =
        result.output ||
        result.response ||
        result.text ||
        (Array.isArray(result)
          ? result[0]?.output ||
            result[0]?.response ||
            result[0]?.message ||
            JSON.stringify(result[0])
          : typeof result === "string"
          ? result
          : null);

      if (!aiResponse) {
        console.error(
          "DEBUG - Could not extract AI response from n8n result:",
          result
        );
        return res
          .status(500)
          .json(
            ApiResponse.error(
              "Impossible d'extraire la réponse de l'IA. Format de réponse inattendu."
            )
          );
      }

      res.json(
        ApiResponse.success({ response: aiResponse }, "Réponse de l'IA reçue")
      );
    } catch (error) {
      console.error("CRITICAL DEBUG - Agent handleChat exception:");
      console.error("Error Name:", error.name);
      console.error("Error Message:", error.message);
      console.error("Error Stack:", error.stack);

      res
        .status(500)
        .json(
          ApiResponse.error(
            `Erreur interne : ${error.message || "Erreur inconnue"}`
          )
        );
    }
  }
}

module.exports = AgentController;
