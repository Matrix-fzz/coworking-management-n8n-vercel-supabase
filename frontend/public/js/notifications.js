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
            this.container.className = 'fixed top-24 right-4 z-[100] flex flex-col gap-2 pointer-events-none w-full max-w-sm';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('notification-container');
        }
    }

    // Afficher une notification
    show(title, message, type = 'info', duration = 5000) {
        // Types supportés
        const types = {
            'success': { icon: 'fas fa-check-circle', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', iconColor: 'text-green-500' },
            'error': { icon: 'fas fa-exclamation-circle', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', iconColor: 'text-red-500' },
            'warning': { icon: 'fas fa-exclamation-triangle', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', iconColor: 'text-yellow-500' },
            'info': { icon: 'fas fa-info-circle', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', iconColor: 'text-blue-500' }
        };

        const style = types[type] || types.info;

        // Créer l'élément de notification
        const notification = document.createElement('div');
        notification.className = `transform transition-all duration-300 ease-in-out translate-x-full mb-3 max-w-sm w-full bg-white shadow-lg rounded-xl pointer-events-auto border-l-4 ${style.border} flex ring-1 ring-black ring-opacity-5 overflow-hidden`;
        // Additional inline style for slide-in animation handled by JS/CSS usually, but Tailwind translate works if we toggle it.
        // Let's rely on base structure first.
        
        notification.innerHTML = `
            <div class="p-4 w-full flex items-start">
                <div class="flex-shrink-0">
                    <i class="${style.icon} ${style.iconColor} text-xl"></i>
                </div>
                <div class="ml-3 w-0 flex-1 pt-0.5">
                    <p class="text-sm font-bold ${style.text}">${title}</p>
                    <p class="mt-1 text-sm text-slate-600 leading-relaxed">${message}</p>
                </div>
                <div class="ml-4 flex-shrink-0 flex">
                    <button class="bg-white rounded-md inline-flex text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500" onclick="window.NotificationManager.closeNotification(this.closest('div.transform'))">
                        <span class="sr-only">Fermer</span>
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;

        // Ajouter au conteneur
        this.container.appendChild(notification);
        this.notifications.add(notification);
        
        // Trigger generic animation (CSS transition)
        requestAnimationFrame(() => {
            notification.classList.remove('translate-x-full');
            notification.classList.add('translate-x-0');
        });

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
        notification.classList.remove('translate-x-0');
        notification.classList.add('translate-x-full', 'opacity-0');
        
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