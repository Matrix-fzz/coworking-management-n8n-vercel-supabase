/**
 * AI Agent Logic for Coworking Management
 */

class AIAgent {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.chatWidget = null;
        this.chatContainer = null;
        this.messageContainer = null;
        this.inputField = null;
        this.sendBtn = null;
        this.history = []; // Store session history for context
        
        this.init();
    }

    init() {
        // Create the widget HTML structure
        this.createWidget();
        this.bindEvents();
        
        // Add initial welcome message
        setTimeout(() => {
            this.addMessage('ai', 'Bonjour ! Je suis votre assistant Coworking Manager. Comment puis-je vous aider aujourd\'hui ?');
        }, 1000);
    }

    createWidget() {
        const widgetHTML = `
            <div class="chat-widget" id="ai-chat-widget">
                <button class="chat-toggle" id="chat-toggle">
                    <i class="fas fa-comment-alt"></i>
                </button>
                <div class="chat-container" id="chat-container">
                    <div class="chat-header">
                        <div class="chat-header-info">
                            <i class="fas fa-robot"></i>
                            <div>
                                <h3>Assistant IA</h3>
                                <p>En ligne</p>
                            </div>
                        </div>
                        <button class="chat-close" id="chat-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="chat-messages" id="chat-messages">
                        <!-- Messages walk in here -->
                    </div>
                    <form class="chat-input-area" id="chat-form">
                        <input type="text" class="chat-input" id="chat-input" placeholder="Posez votre question..." autocomplete="off">
                        <button type="submit" class="chat-send" id="chat-send">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
        
        this.chatWidget = document.getElementById('ai-chat-widget');
        this.chatContainer = document.getElementById('chat-container');
        this.messageContainer = document.getElementById('chat-messages');
        this.inputField = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('chat-send');
        this.chatForm = document.getElementById('chat-form');
    }

    bindEvents() {
        document.getElementById('chat-toggle').addEventListener('click', () => this.toggleChat());
        document.getElementById('chat-close').addEventListener('click', () => this.toggleChat());
        
        this.chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSendMessage();
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        this.chatContainer.classList.toggle('active', this.isOpen);
        
        const toggleBtn = document.getElementById('chat-toggle');
        if (this.isOpen) {
            toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
            this.inputField.focus();
        } else {
            toggleBtn.innerHTML = '<i class="fas fa-comment-alt"></i>';
        }
    }

    addMessage(role, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${role}`;
        messageDiv.textContent = text;
        this.messageContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
        
        // Update history (simplified)
        this.history.push({ role, text });
        if (this.history.length > 10) this.history.shift(); // Keep last 10 messages
    }

    showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message message-ai typing-indicator';
        typingDiv.innerHTML = `
            <div class="typing">
                <span></span><span></span><span></span>
            </div>
        `;
        typingDiv.id = 'typing-indicator';
        this.messageContainer.appendChild(typingDiv);
        this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    }

    hideTyping() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    async handleSendMessage() {
        const text = this.inputField.value.trim();
        if (!text) return;

        // Reset input
        this.inputField.value = '';
        this.sendBtn.disabled = true;

        // Add user message to UI
        this.addMessage('user', text);

        // Show typing indicator
        this.showTyping();

        try {
            const result = await ApiService.post('/agent/chat', {
                message: text,
                history: this.history
            });

            // Hide typing
            this.hideTyping();

            if (result.success) {
                this.addMessage('ai', result.data.response);
            } else {
                this.addMessage('ai', result.message || "Désolé, j'ai rencontré une petite erreur.");
                console.error('Agent API error:', result);
            }
        } catch (error) {
            this.hideTyping();
            
            let displayMsg = "Oups ! Je n'arrive pas à me connecter au serveur.";
            
            console.error('AI Agent Error Details:', {
                status: error.status,
                message: error.message,
                error: error
            });

            if (error.status === 503) {
                displayMsg = "Le service d'IA n'est pas encore configuré sur le serveur (Variable d'environnement manquante).";
            } else if (error.status === 404) {
                // Si le message d'erreur contient "n8n", c'est que la route existe mais c'est n8n qui a renvoyé 404
                if (error.message && error.message.includes('n8n')) {
                    displayMsg = `Erreur n8n : ${error.message}`;
                } else if (error.message && error.message.length < 100) {
                    displayMsg = `Route ou service non trouvé (404) : ${error.message}`;
                } else {
                    displayMsg = "La route du chat n'a pas été trouvée (/api/agent/chat). Vérifiez le déploiement du backend.";
                }
            } else if (error.status === 500) {
                displayMsg = `Erreur serveur (500) : ${error.message || "Erreur interne"}`;
            } else if (error.message && error.message.includes('fetch')) {
                displayMsg = "Impossible de contacter le backend. Est-il démarré ?";
            } else if (error.message) {
                displayMsg = `Erreur : ${error.message}`;
            }
            
            this.addMessage('ai', displayMsg);
        } finally {
            this.sendBtn.disabled = false;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.aiAgent = new AIAgent();
});
