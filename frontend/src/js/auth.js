// Gestion de l'authentification
class AuthManager {
    // Vérifier l'état d'authentification
    static checkAuth() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
            try {
                const userData = JSON.parse(user);
                this.updateUI(true, userData);
                return true;
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.logout();
                return false;
            }
        }
        
        this.updateUI(false);
        return false;
    }

    // Mettre à jour l'interface utilisateur
    static updateUI(isAuthenticated, userData = null) {
        const authSection = document.getElementById('authSection');
        const userSection = document.getElementById('userSection');
        const usernameDisplay = document.getElementById('usernameDisplay');
        const addWorkspaceBtn = document.getElementById('addWorkspaceBtn');
        
        if (isAuthenticated && userData) {
            authSection.style.display = 'none';
            userSection.style.display = 'flex';
            if (usernameDisplay) {
                usernameDisplay.textContent = userData.username;
            }
            if (addWorkspaceBtn) {
                addWorkspaceBtn.style.display = 'block';
            }
            
            // Ajouter le token aux headers par défaut
            this.setAuthHeader();
        } else {
            authSection.style.display = 'flex';
            userSection.style.display = 'none';
            if (usernameDisplay) {
                usernameDisplay.textContent = '';
            }
            if (addWorkspaceBtn) {
                addWorkspaceBtn.style.display = 'none';
            }
        }
    }

    // Définir le header d'authentification
    static setAuthHeader() {
        const token = localStorage.getItem('token');
        if (token) {
            // Déjà géré dans ApiService.getHeaders()
        }
    }

    // Inscription
    static async register(event) {
        event.preventDefault();
        
        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Récupérer les données du formulaire
        const userData = {
            username: form.username.value,
            email: form.email.value,
            password: form.password.value
        };
        
        // Validation
        if (userData.password !== form.confirmPassword?.value) {
            this.showMessage('Les mots de passe ne correspondent pas', 'error');
            return;
        }
        
        try {
            // Désactiver le bouton pendant la requête
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inscription...';
            
            // Appel API
            const response = await CoworkingApi.register(userData);
            
            if (response.success) {
                // Sauvegarder les données
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                
                // Mettre à jour l'UI
                this.updateUI(true, response.data.user);
                
                // Redirection
                this.showMessage('Inscription réussie ! Redirection...', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showMessage(error.message || 'Erreur lors de l\'inscription', 'error');
        } finally {
            // Réactiver le bouton
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    // Connexion
    static async login(event) {
        event.preventDefault();
        
        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        const credentials = {
            email: form.email.value,
            password: form.password.value
        };
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
            
            const response = await CoworkingApi.login(credentials);
            
            if (response.success) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                
                this.updateUI(true, response.data.user);
                
                this.showMessage('Connexion réussie !', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage(error.message || 'Email ou mot de passe incorrect', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    // Déconnexion
    static logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.updateUI(false);
        
        this.showMessage('Déconnexion réussie', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    }

    // Afficher un message
    static showMessage(message, type = 'info') {
        // Supprimer les anciens messages
        const oldMessage = document.querySelector('.message');
        if (oldMessage) oldMessage.remove();
        
        // Créer le nouveau message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        
        // Styles pour le message
        const styles = `
            .message {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 15px;
                min-width: 300px;
                max-width: 500px;
                z-index: 10000;
                animation: slideIn 0.3s ease;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .message-success { background: #10b981; }
            .message-error { background: #ef4444; }
            .message-info { background: #3b82f6; }
            .message button {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                margin: 0;
            }
        `;
        
        // Ajouter les styles
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
        
        // Ajouter le message au body
        document.body.appendChild(messageDiv);
        
        // Supprimer automatiquement après 5 secondes
        setTimeout(() => {
            if (messageDiv.parentElement) {
                messageDiv.remove();
            }
        }, 5000);
    }

    // Vérifier si l'utilisateur est authentifié
    static isAuthenticated() {
        return !!localStorage.getItem('token');
    }

    // Récupérer l'utilisateur courant
    static getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    // Récupérer le token
    static getToken() {
        return localStorage.getItem('token');
    }

    // Protéger les routes
    static requireAuth(redirectTo = 'src/pages/login.html') {
        if (!this.isAuthenticated()) {
            window.location.href = redirectTo;
            return false;
        }
        return true;
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    AuthManager.checkAuth();
    
    // Gestion du menu mobile
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
});

// Exporter pour usage global
window.AuthManager = AuthManager;
window.logout = AuthManager.logout.bind(AuthManager);
window.checkAuth = AuthManager.checkAuth.bind(AuthManager);