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
            <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end" id="ai-chat-widget">
                <!-- Chat Container -->
                <div class="hidden flex-col w-[380px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-100 mb-4 overflow-hidden transition-all duration-300 origin-bottom-right transform scale-95 opacity-0" id="chat-container">
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-primary-600 to-violet-600 p-4 flex justify-between items-center text-white shrink-0">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <i class="fas fa-robot text-lg"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-base m-0 leading-tight">Assistant IA</h3>
                                <div class="flex items-center gap-1.5 opacity-90">
                                    <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    <span class="text-xs font-medium">En ligne</span>
                                </div>
                            </div>
                        </div>
                        <button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors text-white focus:outline-none" id="chat-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <!-- Messages Area -->
                    <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scroll-smooth custom-scrollbar" id="chat-messages">
                        <!-- Messages walk in here -->
                    </div>
                    
                    <!-- Input Area -->
                    <form class="p-4 bg-white border-t border-gray-100 shrink-0 flex gap-2" id="chat-form">
                        <input type="text" class="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all placeholder:text-slate-400 text-sm" id="chat-input" placeholder="Posez votre question..." autocomplete="off">
                        <button type="submit" class="w-12 h-12 flex items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-500/30 hover:bg-primary-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed" id="chat-send">
                            <i class="fas fa-paper-plane text-sm"></i>
                        </button>
                    </form>
                </div>

                <!-- Toggle Button -->
                <button class="w-14 h-14 rounded-full bg-gradient-to-r from-primary-600 to-violet-600 text-white shadow-xl shadow-primary-900/20 flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-all duration-300 group" id="chat-toggle">
                    <i class="fas fa-comment-alt group-hover:rotate-12 transition-transform"></i>
                </button>
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
        // this.chatContainer.classList.toggle('active', this.isOpen); // Old class toggling
        
        const toggleBtn = document.getElementById('chat-toggle');
        if (this.isOpen) {
            // Open state
            this.chatContainer.classList.remove('hidden', 'scale-95', 'opacity-0');
            this.chatContainer.classList.add('flex', 'scale-100', 'opacity-100');
            
            toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
            toggleBtn.classList.add('rotate-180');
            this.inputField.focus();
        } else {
            // Closed state
            this.chatContainer.classList.remove('flex', 'scale-100', 'opacity-100');
            this.chatContainer.classList.add('hidden', 'scale-95', 'opacity-0');
            
            toggleBtn.innerHTML = '<i class="fas fa-comment-alt"></i>';
             toggleBtn.classList.remove('rotate-180');
        }
    }

    addMessage(role, text) {
        const messageDiv = document.createElement('div');
        const isAI = role === 'ai';
        
        messageDiv.className = `flex w-full ${isAI ? 'justify-start' : 'justify-end'} animate-fade-in`;
        
        messageDiv.innerHTML = `
            <div class="max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                isAI 
                ? 'bg-white text-slate-700 rounded-tl-none border border-gray-100' 
                : 'bg-primary-600 text-white rounded-tr-none shadow-primary-500/20'
            }">
                ${text}
            </div>
        `;
        
        this.messageContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
        
        // Update history (simplified)
        this.history.push({ role, text });
        if (this.history.length > 10) this.history.shift(); // Keep last 10 messages
    }

    showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'flex w-full justify-start animate-fade-in';
        typingDiv.innerHTML = `
            <div class="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style="animation-delay: 0s"></span>
                <span class="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style="animation-delay: 0.2s"></span>
                <span class="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style="animation-delay: 0.4s"></span>
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
                error: error,
                context: 'handleSendMessage'
            });

            if (error.status === 503) {
                displayMsg = "Le service d'IA n'est pas encore configuré sur le serveur (Variable d'environnement manquante).";
            } else if (error.status === 404) {
                displayMsg = "La route du chat n'a pas été trouvée (/api/agent/chat). Vérifiez le déploiement du backend et l'URL du webhook n8n.";
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
