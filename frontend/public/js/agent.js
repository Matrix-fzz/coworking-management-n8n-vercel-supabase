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
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/agent/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    message: text,
                    history: this.history
                })
            });

            const result = await response.json();

            // Hide typing
            this.hideTyping();

            if (result.success) {
                this.addMessage('ai', result.data.response);
            } else {
                this.addMessage('ai', "Désolé, j'ai rencontré une petite erreur. Pouvez-vous reformuler ?");
                console.error('Agent API error:', result.message);
            }
        } catch (error) {
            this.hideTyping();
            this.addMessage('ai', "Oups ! Je n'arrive pas à me connecter au serveur.");
            console.error('Fetch error:', error);
        } finally {
            this.sendBtn.disabled = false;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.aiAgent = new AIAgent();
});
