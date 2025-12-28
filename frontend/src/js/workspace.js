// Gestion des espaces de coworking
class WorkspaceManager {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 1;
        this.currentFilters = {};
        this.isGridView = true;
        this.workspaces = [];
    }

    // Charger les espaces
    async loadWorkspaces(page = 1, filters = {}) {
        try {
            this.showLoading(true);
            
            // Appliquer les filtres
            const appliedFilters = { ...this.currentFilters, ...filters };
            
            // Récupérer les espaces depuis l'API
            const response = await CoworkingApi.getWorkspaces(page, appliedFilters);
            
            if (response.success) {
                this.workspaces = response.data.workspaces;
                this.currentPage = response.data.page;
                this.totalPages = response.data.totalPages;
                
                this.displayWorkspaces(this.workspaces);
                this.updatePagination();
                this.updateStats(response.data);
                
                // Vérifier si aucun résultat
                if (this.workspaces.length === 0) {
                    this.showNoResults(true);
                } else {
                    this.showNoResults(false);
                }
            }
        } catch (error) {
            console.error('Error loading workspaces:', error);
            AppNotification.error('Erreur lors du chargement des espaces');
        } finally {
            this.showLoading(false);
        }
    }

    // Afficher les espaces
    displayWorkspaces(workspaces) {
        const container = document.getElementById('workspacesContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        workspaces.forEach(workspace => {
            const workspaceElement = this.createWorkspaceCard(workspace);
            container.appendChild(workspaceElement);
        });
        
        // Ajouter les écouteurs d'événements pour les favoris
        this.attachFavoriteListeners();
    }

    // Créer une carte d'espace
    createWorkspaceCard(workspace) {
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
        
        const isAuthenticated = AuthManager.isAuthenticated();
        const currentUser = AuthManager.getCurrentUser();
        
        let actionButtons = '';
        // Wiki Model: Any authenticated user can edit/delete
        if (isAuthenticated) {
            actionButtons = `
                <div class="workspace-actions">
                    <button class="btn-icon edit-btn" onclick="openEditWorkspaceModal(${workspace.id})" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-btn" onclick="deleteWorkspace(${workspace.id})" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }
        
        card.innerHTML = `
            <img src="${imageUrl}" alt="${workspace.name}" class="workspace-image">
            <div class="workspace-content">
                <div class="workspace-header">
                    <h3 class="workspace-title">${workspace.name}</h3>
                    <button class="favorite-btn ${workspace.isFavorite ? 'active' : ''}" data-id="${workspace.id}">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                <div class="workspace-meta">
                    <span><i class="fas fa-users"></i> ${workspace.capacity} pers.</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${workspace.city}</span>
                    <span><i class="fas fa-user"></i> ${workspace.owner_name || 'Utilisateur'}</span>
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
                    <div class="price-container">
                        <div class="price">
                            ${formattedPrice}
                            <span>/jour</span>
                        </div>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                   ${actionButtons}
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
            'climatisation': 'snowflake',
            'gym': 'dumbbell',
            'terrasse': 'sun',
            'cuisine': 'utensils',
            'projecteur': 'video'
        };
        return icons[amenity.toLowerCase()] || 'check';
    }

    // Ajouter un espace
    // Gérer la soumission (Ajout ou Modification)
    async handleWorkspaceSubmit(event) {
        event.preventDefault();
        
        const form = document.getElementById('addWorkspaceForm');
        if (!form) return;
        
        const workspaceId = document.getElementById('workspaceId').value;
        const isEdit = !!workspaceId;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';

            // Gestion de l'image
            // Utiliser getElementById pour être plus robuste
            const urlInput = document.getElementById('workspaceImage');
            let finalImageUrl = urlInput ? urlInput.value : ''; 
            const imageFile = document.getElementById('workspaceImageFile').files[0];
            
            if (imageFile) {
                try {
                    const uploadResult = await UploadManager.uploadImage(imageFile);
                    if (uploadResult.success) {
                        finalImageUrl = uploadResult.data.imageUrl;
                    }
                } catch (uploadError) {
                    console.error('Image upload failed:', uploadError);
                    AppNotification.warning('Échec de l\'upload de l\'image, utilisation de l\'URL si disponible');
                }
            }

            // Récupérer les données
            const amenities = Array.from(form.querySelectorAll('input[name="amenities"]:checked'))
                .map(checkbox => checkbox.value);
            
            const workspaceData = {
                name: form.workspaceName.value,
                capacity: parseInt(form.workspaceCapacity.value),
                price_per_day: parseFloat(form.workspacePrice.value),
                city: form.workspaceCity.value,
                amenities: amenities,
                status: form.workspaceStatus.value,
                image_url: finalImageUrl || null
            };
            
            if (amenities.length === 0) {
                AppNotification.error('Sélectionnez au moins un équipement');
                return;
            }
            
            let response;
            if (isEdit) {
                response = await CoworkingApi.updateWorkspace(workspaceId, workspaceData);
            } else {
                response = await CoworkingApi.createWorkspace(workspaceData);
            }
            
            if (response.success) {
                if (isEdit) {
                    AppNotification.success('Espace modifié avec succès');
                    this.loadWorkspaces(this.currentPage);
                } else {
                    AppNotification.success('Espace créé avec succès');
                    // Reset filters to ensure the new item is visible? 
                    // For now, just go to page 1 which is safest for "latest items"
                    this.currentPage = 1;
                    this.loadWorkspaces(1);
                }
                this.closeModal('addWorkspaceModal');
                
                // Reset mode to add
                this.resetModalMode();
            }
        } catch (error) {
            console.error('Error saving workspace:', error);
            AppNotification.error(error.message || 'Erreur lors de la sauvegarde');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }

    // Ouvrir le modal d'édition
    openEditWorkspaceModal(id) {
        const workspace = this.workspaces.find(w => w.id === id);
        if (!workspace) return;
        
        const form = document.getElementById('addWorkspaceForm');
        if (!form) return;
        
        // Populate form
        document.getElementById('workspaceId').value = workspace.id;
        form.workspaceName.value = workspace.name;
        form.workspaceCapacity.value = workspace.capacity;
        form.workspacePrice.value = workspace.price_per_day;
        form.workspaceCity.value = workspace.city;
        form.workspaceStatus.value = workspace.status;
        form.workspaceImage.value = workspace.image_url || '';
        
        // Preview handling
        const previewImg = document.getElementById('previewImg');
        const uploadPlaceholder = document.getElementById('uploadPlaceholder');
        if (workspace.image_url) {
            previewImg.src = workspace.image_url;
            previewImg.style.display = 'block';
            if (uploadPlaceholder) uploadPlaceholder.style.display = 'none';
        } else {
            previewImg.style.display = 'none';
            if (uploadPlaceholder) uploadPlaceholder.style.display = 'flex';
        }

        // Reset file input
        const fileInput = document.getElementById('workspaceImageFile');
        if (fileInput) fileInput.value = '';
        
        // Reset checkboxes
        form.querySelectorAll('input[name="amenities"]').forEach(cb => cb.checked = false);
        
        // Check amenities
        let amenities = [];
        try {
             amenities = Array.isArray(workspace.amenities) 
                ? workspace.amenities 
                : JSON.parse(workspace.amenities);
        } catch(e) { 
            amenities = [];
        }
        
        amenities.forEach(amenity => {
            const cb = form.querySelector(`input[name="amenities"][value="${amenity}"]`);
            if (cb) cb.checked = true;
        });
        
        // Update UI Text
        document.getElementById('modalTitle').textContent = 'Modifier l\'espace';
        document.getElementById('submitBtnText').textContent = 'Modifier l\'espace';
        
        this.openModal('addWorkspaceModal');
    }

    resetModalMode() {
        const form = document.getElementById('addWorkspaceForm');
        if (form) {
             form.reset();
             document.getElementById('workspaceId').value = '';
             document.getElementById('modalTitle').textContent = 'Ajouter un espace de coworking';
             document.getElementById('submitBtnText').textContent = 'Ajouter l\'espace';
             
             // Reset preview
             const previewImg = document.getElementById('previewImg');
             const uploadPlaceholder = document.getElementById('uploadPlaceholder');
             if (previewImg) {
                 previewImg.style.display = 'none';
                 previewImg.src = '';
             }
             if (uploadPlaceholder) uploadPlaceholder.style.display = 'flex';
        }
    }

    // Mettre à jour un espace
    async updateWorkspace(id, data) {
        try {
            const response = await CoworkingApi.updateWorkspace(id, data);
            if (response.success) {
                AppNotification.success('Espace mis à jour avec succès');
                this.loadWorkspaces(this.currentPage);
            }
        } catch (error) {
            console.error('Error updating workspace:', error);
            AppNotification.error(error.message || 'Erreur lors de la mise à jour');
        }
    }

    // Supprimer un espace
    async deleteWorkspace(id) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet espace ?')) {
            return;
        }
        
        try {
            const response = await CoworkingApi.deleteWorkspace(id);
            if (response.success) {
                AppNotification.success('Espace supprimé avec succès');
                this.loadWorkspaces(this.currentPage);
            }
        } catch (error) {
            console.error('Error deleting workspace:', error);
            AppNotification.error(error.message || 'Erreur lors de la suppression');
        }
    }

    // Gestion des favoris
    async toggleFavorite(workspaceId) {
        if (!AuthManager.isAuthenticated()) {
            AppNotification.error('Connectez-vous pour ajouter aux favoris');
            return;
        }
        
        try {
            const favoriteBtn = document.querySelector(`.favorite-btn[data-id="${workspaceId}"]`);
            const isFavorite = favoriteBtn.classList.contains('active');
            
            if (isFavorite) {
                await CoworkingApi.removeFavorite(workspaceId);
                favoriteBtn.classList.remove('active');
                AppNotification.success('Retiré des favoris');
            } else {
                await CoworkingApi.addFavorite(workspaceId);
                favoriteBtn.classList.add('active');
                AppNotification.success('Ajouté aux favoris');
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            AppNotification.error(error.message || 'Erreur avec les favoris');
        }
    }

    // Attacher les écouteurs pour les favoris
    attachFavoriteListeners() {
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const workspaceId = btn.dataset.id;
                await this.toggleFavorite(workspaceId);
            });
        });
    }

    // Rechercher des espaces
    searchWorkspaces() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;
        
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            this.currentFilters.search = searchTerm;
        } else {
            delete this.currentFilters.search;
        }
        
        this.loadWorkspaces(1);
    }

    // Filtrer les espaces
    filterWorkspaces() {
        const cityFilter = document.getElementById('cityFilter');
        const statusFilter = document.getElementById('statusFilter');
        
        const minPrice = document.getElementById('minPrice');
        const maxPrice = document.getElementById('maxPrice');
        const minCapacity = document.getElementById('minCapacity');
        const amenitiesCheckboxes = document.querySelectorAll('#amenitiesFilter input[type="checkbox"]:checked');
        
        // City
        if (cityFilter && cityFilter.value) {
            this.currentFilters.city = cityFilter.value;
        } else {
            delete this.currentFilters.city;
        }
        
        // Status
        if (statusFilter && statusFilter.value) {
            this.currentFilters.status = statusFilter.value;
        } else {
            delete this.currentFilters.status;
        }

        // Price
        if (minPrice && minPrice.value) {
            this.currentFilters.minPrice = minPrice.value;
        } else {
            delete this.currentFilters.minPrice;
        }

        if (maxPrice && maxPrice.value) {
            this.currentFilters.maxPrice = maxPrice.value;
        } else {
            delete this.currentFilters.maxPrice;
        }

        // Capacity
        if (minCapacity && minCapacity.value) {
            this.currentFilters.minCapacity = minCapacity.value;
        } else {
            delete this.currentFilters.minCapacity;
        }

        // Amenities
        if (amenitiesCheckboxes.length > 0) {
            // Send as comma-separated string or rely on URLSearchParams handling multiple values
            // Currently our API wrapper uses URLSearchParams which supports arrays if appended multiple times,
            // but our backend controller change anticipates an array or comma-separated string.
            // Let's rely on array.
            this.currentFilters.amenities = Array.from(amenitiesCheckboxes).map(cb => cb.value);
        } else {
            delete this.currentFilters.amenities;
        }
        
        this.loadWorkspaces(1);
    }

    // Trier les espaces
    sortWorkspaces() {
        const sortFilter = document.getElementById('sortFilter');
        if (!sortFilter) return;
        
        if (sortFilter.value) {
            this.currentFilters.sortBy = sortFilter.value;
        } else {
            delete this.currentFilters.sortBy;
        }

        this.loadWorkspaces(1);
    }

    // Changer de page
    changePage(page) {
        if (page < 1 || page > this.totalPages) return;
        this.loadWorkspaces(page);
    }

    // Mettre à jour la pagination
    updatePagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;
        
        pagination.innerHTML = '';
        
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

    // Mettre à jour les statistiques
    updateStats(data) {
        // Total des espaces
        const totalWorkspaces = document.getElementById('totalWorkspaces');
        if (totalWorkspaces) {
            totalWorkspaces.textContent = data.total || 0;
        }
        
        // Capacité totale (calcul approximatif)
        const totalCapacity = document.getElementById('totalCapacity');
        if (totalCapacity && this.workspaces.length > 0) {
            const capacitySum = this.workspaces.reduce((sum, ws) => sum + ws.capacity, 0);
            totalCapacity.textContent = capacitySum.toLocaleString();
        }
        
        // Villes uniques
        const totalCities = document.getElementById('totalCities');
        if (totalCities && this.workspaces.length > 0) {
            const uniqueCities = new Set(this.workspaces.map(ws => ws.city));
            totalCities.textContent = uniqueCities.size;
        }
    }

    // Afficher/masquer le loading
    showLoading(show) {
        const loading = document.getElementById('loading');
        const container = document.getElementById('workspacesContainer');
        
        if (loading) loading.style.display = show ? 'block' : 'none';
        if (container) container.style.display = show ? 'none' : 'grid';
    }

    // Afficher/masquer "aucun résultat"
    showNoResults(show) {
        const noResults = document.getElementById('noResults');
        if (noResults) noResults.style.display = show ? 'flex' : 'none';
    }

    // Basculer entre vue grille/liste
    toggleView() {
        this.isGridView = !this.isGridView;
        const container = document.getElementById('workspacesContainer');
        const viewIcon = document.getElementById('viewIcon');
        const viewText = document.getElementById('viewText');
        
        if (container) {
            container.className = this.isGridView ? 'workspaces-grid' : 'workspaces-list';
        }
        
        if (viewIcon) {
            viewIcon.className = this.isGridView ? 'fas fa-th' : 'fas fa-list';
        }
        
        if (viewText) {
            viewText.textContent = this.isGridView ? 'Vue Grille' : 'Vue Liste';
        }
    }

    // Modales
    openAddWorkspaceModal() {
        if (!AuthManager.requireAuth()) return;
        this.openModal('addWorkspaceModal');
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('active');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
    }

    // Filtrer par ville
    filterByCity(city) {
        const cityFilter = document.getElementById('cityFilter');
        if (cityFilter) {
            cityFilter.value = city;
            this.filterWorkspaces();
        }
    }

    // Initialiser les écouteurs d'événements
    setupEventListeners() {
        // Recherche avec Enter
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.searchWorkspaces();
            });
        }
        
        // Filtres
        const filters = ['cityFilter', 'statusFilter', 'sortFilter'];
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => {
                    if (filterId !== 'sortFilter') {
                        this.filterWorkspaces();
                    } else {
                        this.sortWorkspaces();
                    }
                });
            }
        });

        // File Input Preview
        const fileInput = document.getElementById('workspaceImageFile');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    UploadManager.previewImage(file, 'previewImg');
                    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
                    if (uploadPlaceholder) uploadPlaceholder.style.display = 'none';
                }
            });
        }
        
        // URL Input Preview
        const urlInput = document.getElementById('workspaceImage');
        if (urlInput) {
            urlInput.addEventListener('input', (e) => {
                const url = e.target.value;
                const previewImg = document.getElementById('previewImg');
                const uploadPlaceholder = document.getElementById('uploadPlaceholder');
                
                if (url && previewImg) {
                    previewImg.src = url;
                    previewImg.style.display = 'block';
                    if (uploadPlaceholder) uploadPlaceholder.style.display = 'none';
                } else if (!fileInput.files[0] && previewImg) {
                    // Reset if no file and no URL
                    previewImg.style.display = 'none';
                    if (uploadPlaceholder) uploadPlaceholder.style.display = 'flex';
                }
            });
        }
    }
    // Toggle Dropdown amenities
    toggleAmenitiesDropdown() {
        const dropdown = document.querySelector('.dropdown-check-list');
        if (dropdown) {
            dropdown.classList.toggle('visible');
        }
    }
}

// Initialiser le gestionnaire
const workspaceManager = new WorkspaceManager();

// Fonctions globales
window.loadWorkspaces = workspaceManager.loadWorkspaces.bind(workspaceManager);
window.searchWorkspaces = workspaceManager.searchWorkspaces.bind(workspaceManager);
window.filterWorkspaces = workspaceManager.filterWorkspaces.bind(workspaceManager);
window.sortWorkspaces = workspaceManager.sortWorkspaces.bind(workspaceManager);
window.toggleView = workspaceManager.toggleView.bind(workspaceManager);
window.openAddWorkspaceModal = workspaceManager.openAddWorkspaceModal.bind(workspaceManager);
window.closeModal = workspaceManager.closeModal.bind(workspaceManager);
window.filterByCity = workspaceManager.filterByCity.bind(workspaceManager);
window.handleWorkspaceSubmit = workspaceManager.handleWorkspaceSubmit.bind(workspaceManager);
window.openEditWorkspaceModal = workspaceManager.openEditWorkspaceModal.bind(workspaceManager);
window.deleteWorkspace = workspaceManager.deleteWorkspace.bind(workspaceManager);
window.setupEventListeners = workspaceManager.setupEventListeners.bind(workspaceManager);

// Exporter
window.WorkspaceManager = workspaceManager;
window.toggleAmenitiesDropdown = workspaceManager.toggleAmenitiesDropdown.bind(workspaceManager);