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
        card.className = 'workspace-card';
        card.dataset.id = workspace.id;
        
        // Formater les équipements
        const amenities = Array.isArray(workspace.amenities) 
            ? workspace.amenities 
            : (typeof workspace.amenities === 'string' ? JSON.parse(workspace.amenities) : []);
        
        // Image par défaut si non fournie
        const imageUrl = workspace.image_url || 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400';
        
        // Statut
        const statusClass = workspace.status === 'available' ? 'status-available' : 'status-full';
        const statusText = workspace.status === 'available' ? 'Disponible' : 'Complet';
        
        // Prix formaté
        const formattedPrice = new Intl.NumberFormat('fr-MA', {
            style: 'currency',
            currency: 'MAD'
        }).format(workspace.price_per_day);
        
        card.innerHTML = `
            <img src="${imageUrl}" alt="${workspace.name}" class="workspace-image">
            <div class="workspace-content">
                <div class="workspace-header">
                    <h3 class="workspace-title">${workspace.name}</h3>
                    <button class="favorite-btn active" data-id="${workspace.id}">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                <div class="workspace-meta">
                    <span><i class="fas fa-users"></i> ${workspace.capacity} pers.</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${workspace.city}</span>
                </div>
                <div class="workspace-amenities">
                    ${amenities.map(amenity => `
                        <span class="amenity-tag">
                            <i class="fas fa-${this.getAmenityIcon(amenity)}"></i>
                            ${amenity}
                        </span>
                    `).join('')}
                </div>
                <div class="workspace-footer">
                    <div class="price">
                        ${formattedPrice}
                        <span>/jour</span>
                    </div>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                    <button class="btn btn-outline btn-sm" onclick="removeFromFavorites(${workspace.id})">
                        <i class="fas fa-trash"></i> Retirer
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
    async removeFromFavorites(workspaceId) {
        try {
            const response = await CoworkingApi.removeFavorite(workspaceId);
            
            if (response.success) {
                AuthManager.showMessage('Retiré des favoris', 'success');
                this.loadFavorites(this.currentPage);
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