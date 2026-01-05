// Gestion des favoris
class FavoritesManager {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 1;
    }

    // Charger les favoris
    async loadFavorites(page = 1) {
        try {
            this.showLoading(true);
            
            const response = await CoworkingApi.getFavorites(page);
            
            if (response.success) {
                this.displayFavorites(response.data.favorites);
                this.updatePagination(response.data);
                
                if (response.data.favorites.length === 0) {
                    this.showNoResults(true);
                } else {
                    this.showNoResults(false);
                }
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
            AuthManager.showMessage('Erreur lors du chargement des favoris', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Afficher les favoris
    displayFavorites(favorites) {
        const container = document.getElementById('favoritesContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (favorites.length === 0) return;
        
        favorites.forEach(favorite => {
            const workspace = favorite;
            workspace.id = favorite.workspace_id || favorite.id;
            workspace.isFavorite = true; // Toujours true dans les favoris
            
            const workspaceElement = this.createFavoriteCard(workspace);
            container.appendChild(workspaceElement);
        });
        
        // Ajouter les écouteurs d'événements
        this.attachFavoriteListeners();
    }

    // Créer une carte de favori
    createFavoriteCard(workspace) {
        const card = document.createElement('div');
        // Card container matching workspace.js design
        card.className = 'bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:border-primary-100 transition-all duration-300 group flex flex-col h-full';
        card.dataset.id = workspace.id;
        
        // Formater les équipements
        const amenities = Array.isArray(workspace.amenities) 
            ? workspace.amenities 
            : (typeof workspace.amenities === 'string' ? JSON.parse(workspace.amenities) : []);
        
        // Image par défaut si non fournie
        const imageUrl = workspace.image_url || 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=500';
        
        // Statut
        const statusColors = workspace.status === 'available' 
            ? 'bg-green-100 text-green-700 border-green-200' 
            : 'bg-red-100 text-red-700 border-red-200';
        const statusText = workspace.status === 'available' ? 'Disponible' : 'Complet';
        
        // Prix formaté
        const formattedPrice = new Intl.NumberFormat('fr-MA', {
            style: 'currency',
            currency: 'MAD',
            maximumFractionDigits: 0
        }).format(workspace.price_per_day);
        
        card.innerHTML = `
            <div class="relative h-48 overflow-hidden">
                <img src="${imageUrl}" alt="${workspace.name}" class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500">
                <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <button class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-red-500 hover:scale-110 transition-all duration-300 favorite-btn active" data-id="${workspace.id}">
                    <i class="fas fa-heart"></i>
                </button>
                 <div class="absolute bottom-4 right-4 ${statusColors} text-xs font-semibold px-3 py-1 rounded-full border shadow-sm">
                    ${statusText}
                </div>
            </div>

            <div class="p-5 flex-grow flex flex-col">
                 <div class="flex justify-between items-start mb-2">
                     <h3 class="text-lg font-bold text-slate-800 line-clamp-1 group-hover:text-primary-600 transition-colors">${workspace.name}</h3>
                </div>

                <div class="flex flex-wrap gap-4 text-sm text-slate-500 mb-4">
                    <div class="flex items-center gap-1.5">
                        <i class="fas fa-map-marker-alt text-primary-500"></i>
                        <span>${workspace.city}</span>
                    </div>
                     <div class="flex items-center gap-1.5">
                        <i class="fas fa-users text-primary-500"></i>
                        <span>${workspace.capacity} pers.</span>
                    </div>
                </div>

                 <div class="flex flex-wrap gap-2 mb-6">
                    ${amenities.slice(0, 3).map(amenity => `
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-50 text-slate-600 text-xs font-medium border border-slate-100">
                            <i class="fas fa-${this.getAmenityIcon(amenity)} text-slate-400"></i>
                            ${amenity}
                        </span>
                    `).join('')}
                     ${amenities.length > 3 ? `<span class="px-2 py-1 text-xs text-slate-400">+${amenities.length - 3}</span>` : ''}
                </div>

                <div class="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                    <div>
                        <span class="text-2xl font-bold text-slate-900">${formattedPrice}</span>
                        <span class="text-xs text-slate-500">/jour</span>
                    </div>
                    <button class="px-4 py-2 rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 text-sm font-medium transition-colors" onclick="removeFromFavorites(${workspace.id})">
                        <i class="fas fa-trash mr-2"></i> Retirer
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }

    // Obtenir l'icône d'un équipement
    getAmenityIcon(amenity) {
        const icons = {
            'wifi': 'wifi',
            'café': 'coffee',
            'imprimante': 'print',
            'parking': 'parking',
            'salle de réunion': 'users',
            'climatisation': 'snowflake'
        };
        return icons[amenity.toLowerCase()] || 'check';
    }

    // Retirer des favoris
    // Retirer des favoris
    async removeFromFavorites(workspaceId) {
        try {
            const response = await CoworkingApi.removeFavorite(workspaceId);
            
            if (response.success) {
                // Trouver et supprimer l'élément du DOM
                const card = document.querySelector(`.workspace-card[data-id="${workspaceId}"]`);
                if (card) {
                    // Animation simple de suppression
                    card.style.transition = 'all 0.3s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.9)';
                    
                    setTimeout(() => {
                        card.remove();
                        
                        // Vérifier s'il reste des favoris
                        const container = document.getElementById('favoritesContainer');
                        if (container && container.children.length === 0) {
                            this.showNoResults(true);
                            // Cacher aussi la pagination si vide
                            const pagination = document.getElementById('pagination');
                            if (pagination) pagination.innerHTML = '';
                        }
                    }, 300);
                }
                
                AuthManager.showMessage('Retiré des favoris', 'success');
                // Ne plus recharger toute la page
                // this.loadFavorites(this.currentPage);
            }
        } catch (error) {
            console.error('Error removing favorite:', error);
            AuthManager.showMessage(error.message || 'Erreur lors de la suppression', 'error');
        }
    }

    // Attacher les écouteurs pour les favoris
    attachFavoriteListeners() {
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const workspaceId = btn.dataset.id;
                await this.removeFromFavorites(workspaceId);
            });
        });
    }

    // Changer de page
    changePage(page) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.loadFavorites(page);
    }

    // Mettre à jour la pagination
    updatePagination(data) {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;
        
        pagination.innerHTML = '';
        
        this.currentPage = data.page;
        this.totalPages = data.totalPages;
        
        // Bouton précédent
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.addEventListener('click', () => this.changePage(this.currentPage - 1));
        pagination.appendChild(prevBtn);
        
        // Pages
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, startPage + 4);
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.classList.toggle('active', i === this.currentPage);
            pageBtn.addEventListener('click', () => this.changePage(i));
            pagination.appendChild(pageBtn);
        }
        
        // Bouton suivant
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = this.currentPage === this.totalPages;
        nextBtn.addEventListener('click', () => this.changePage(this.currentPage + 1));
        pagination.appendChild(nextBtn);
    }

    // Afficher/masquer le loading
    showLoading(show) {
        const loading = document.getElementById('loading');
        const container = document.getElementById('favoritesContainer');
        
        if (loading) loading.style.display = show ? 'flex' : 'none';
        if (container) container.style.display = show ? 'none' : 'grid';
    }

    // Afficher/masquer "aucun résultat"
    showNoResults(show) {
        const noResults = document.getElementById('noResults');
        const container = document.getElementById('favoritesContainer');
        
        if (noResults) noResults.style.display = show ? 'flex' : 'none';
        if (container) container.style.display = show ? 'none' : 'grid';
    }
}

// Initialiser le gestionnaire
const favoritesManager = new FavoritesManager();

// Fonctions globales
window.loadFavorites = favoritesManager.loadFavorites.bind(favoritesManager);
window.removeFromFavorites = favoritesManager.removeFromFavorites.bind(favoritesManager);