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

      console.log(`DEBUG - n8nAgentWebhookUrl: ${n8nAgentWebhookUrl}`);

      if (!n8nAgentWebhookUrl) {
        console.error("DEBUG - No n8n webhook URL found in process.env");
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
          .json(ApiResponse.error(`L'IA (n8n) a répondu avec une erreur : ${response.status}`));
      }

      const result = await response.json();
      console.log(`DEBUG - n8n result:`, JSON.stringify(result));

      // Assume n8n returns { output: "response text" } or similar
      const aiResponse =
        result.output ||
        result.response ||
        result.message ||
        (Array.isArray(result)
          ? result[0].message || result[0].output || JSON.stringify(result[0])
          : typeof result === 'string' ? result : "Désolé, je ne peux pas répondre pour le moment.");

      res.json(
        ApiResponse.success({ response: aiResponse }, "Réponse de l'IA reçue")
      );
    } catch (error) {
      console.error("DEBUG - Agent handleChat exception:", error);
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
