// Gestionnaire de notifications
class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = new Set();
        this.init();
    }

    // Initialiser le conteneur
    init() {
        // Créer le conteneur s'il n'existe pas
        if (!document.getElementById('notification-container')) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('notification-container');
        }
    }

    // Afficher une notification
    show(title, message, type = 'info', duration = 5000) {
        // Types supportés
        const types = {
            'success': { icon: 'fas fa-check-circle' },
            'error': { icon: 'fas fa-exclamation-circle' },
            'warning': { icon: 'fas fa-exclamation-triangle' },
            'info': { icon: 'fas fa-info-circle' }
        };

        const notificationType = types[type] || types.info;

        // Créer l'élément de notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="${notificationType.icon}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="window.NotificationManager.closeNotification(this.parentElement)">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Ajouter au conteneur
        this.container.appendChild(notification);
        this.notifications.add(notification);

        // Démarrer le timer d'auto-fermeture
        if (duration > 0) {
            setTimeout(() => {
                this.closeNotification(notification);
            }, duration);
        }

        return notification;
    }

    // Fermer une notification
    closeNotification(notification) {
        if (!notification || !this.notifications.has(notification)) return;

        // Animation de sortie
        notification.classList.add('hiding');
        
        // Supprimer après l'animation
        setTimeout(() => {
            if (notification.parentElement === this.container) {
                this.container.removeChild(notification);
            }
            this.notifications.delete(notification);
        }, 300);
    }

    // Méthodes pratiques
    static success(message, title = 'Succès', duration = 3000) {
        return window.NotificationManager.show(title, message, 'success', duration);
    }

    static error(message, title = 'Erreur', duration = 5000) {
        return window.NotificationManager.show(title, message, 'error', duration);
    }

    static warning(message, title = 'Attention', duration = 4000) {
        return window.NotificationManager.show(title, message, 'warning', duration);
    }

    static info(message, title = 'Information', duration = 3000) {
        return window.NotificationManager.show(title, message, 'info', duration);
    }

    // Effacer toutes les notifications
    clearAll() {
        this.notifications.forEach(notification => {
            this.closeNotification(notification);
        });
    }
}

// Initialiser et exporter
const notificationManager = new NotificationManager();
window.NotificationManagerInstance = notificationManager; // Renamed for clarity, though keeping existing might be safer if used elsewhere.
// Actually, let's keep window.NotificationManager as instance since other code might use it (like the static methods do!)
window.NotificationManager = notificationManager;
window.AppNotification = NotificationManager; // Safe alias for the class
// window.Notification = NotificationManager; // Removed to avoid conflict with Native Browser API