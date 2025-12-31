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

      if (!n8nAgentWebhookUrl) {
        return res
          .status(503)
          .json(ApiResponse.error("Le service d'IA n'est pas configuré"));
      }

      const payload = {
        message,
        history: history || [],
        userId,
        timestamp: new Date().toISOString(),
      };

      console.log(`Sending chat message to n8n: ${n8nAgentWebhookUrl}`);

      const response = await fetch(n8nAgentWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`n8n agent error: ${response.status} ${errorText}`);
        return res
          .status(response.status)
          .json(ApiResponse.error("Erreur lors de la communication avec l'IA"));
      }

      const result = await response.json();

      // Assume n8n returns { output: "response text" } or similar
      const aiResponse =
        result.output ||
        result.response ||
        result.message ||
        (Array.isArray(result)
          ? result[0].message
          : "Désolé, je ne peux pas répondre pour le moment.");

      res.json(
        ApiResponse.success({ response: aiResponse }, "Réponse de l'IA reçue")
      );
    } catch (error) {
      console.error("Agent handleChat error:", error);
      res
        .status(500)
        .json(
          ApiResponse.error(
            "Erreur interne du serveur lors du traitement du chat"
          )
        );
    }
  }
}

module.exports = AgentController;
