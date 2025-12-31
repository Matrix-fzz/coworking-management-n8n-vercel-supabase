const express = require("express");
const router = express.Router();
const AgentController = require("../controllers/agent.controller");
const { optionalAuthMiddleware } = require("../middleware/auth.middleware");

// Route pour chatter avec l'IA
router.post("/chat", optionalAuthMiddleware, AgentController.handleChat);

// Route de test pour l'agent
router.get("/test", (req, res) => res.json({ success: true, message: "Agent route is reachable" }));

module.exports = router;
