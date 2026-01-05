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
            console.log(`🏠 [WS-DEBUG] Loading workspaces: page=${page}`, filters);
            this.showLoading(true);
            
            // Appliquer les filtres
            const appliedFilters = { ...this.currentFilters, ...filters };
            
            // Récupérer les espaces depuis l'API
            const response = await CoworkingApi.getWorkspaces(page, appliedFilters);
            console.log('📦 [WS-DEBUG] API Response:', response);
            
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
        // Card container with hover effects and transition
        card.className = 'bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:border-primary-100 transition-all duration-300 group flex flex-col h-full';
        card.dataset.id = workspace.id;
        
        // Amenities parsing
        const amenities = Array.isArray(workspace.amenities) 
            ? workspace.amenities 
            : (typeof workspace.amenities === 'string' ? JSON.parse(workspace.amenities) : []);
        
        // Image handling
        const imageUrl = workspace.image_url || 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=500';
        
        // Status styling
        const statusColors = workspace.status === 'available' 
            ? 'bg-green-100 text-green-700 border-green-200' 
            : 'bg-red-100 text-red-700 border-red-200';
        const statusText = workspace.status === 'available' ? 'Disponible' : 'Complet';
        
        // Price formatting
        const formattedPrice = new Intl.NumberFormat('fr-MA', {
            style: 'currency',
            currency: 'MAD',
            maximumFractionDigits: 0
        }).format(workspace.price_per_day);
        
        const isAuthenticated = AuthManager.isAuthenticated();
        
        let actionButtons = '';
        if (isAuthenticated) {
            actionButtons = `
                <div class="flex gap-2">
                    <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 hover:bg-primary-50 hover:text-primary-600 transition-colors" onclick="openEditWorkspaceModal(${workspace.id})" title="Modifier">
                        <i class="fas fa-edit text-sm"></i>
                    </button>
                    <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" onclick="deleteWorkspace(${workspace.id})" title="Supprimer">
                        <i class="fas fa-trash text-sm"></i>
                    </button>
                </div>
            `;
        }
        
        card.innerHTML = `
            <div class="relative h-48 overflow-hidden">
                <img src="${imageUrl}" alt="${workspace.name}" class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500">
                <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <button class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:scale-110 transition-all duration-300 favorite-btn ${workspace.isFavorite ? 'text-red-500' : ''}" data-id="${workspace.id}">
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
        const workspace = this.workspaces.find(w => w.id == id);
        if (!workspace) {
            console.error('Workspace not found for id:', id, 'Type:', typeof id);
            return;
        }
        
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
        pagination.className = 'mt-12 flex justify-center items-center gap-2';
        
        // Helper to create buttons
        const createButton = (content, isDisabled, onClick, isActive = false) => {
            const btn = document.createElement('button');
            btn.innerHTML = content;
            btn.disabled = isDisabled;
            btn.className = `w-10 h-10 flex items-center justify-center rounded-lg transition-colors font-medium
                ${isActive 
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-primary-600'
                } 
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
            `;
            if (!isDisabled) btn.addEventListener('click', onClick);
            return btn;
        };

        // Prev Button
        pagination.appendChild(createButton(
            '<i class="fas fa-chevron-left"></i>',
            this.currentPage === 1,
            () => this.changePage(this.currentPage - 1)
        ));
        
        // Pages
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, startPage + 4);
        
        for (let i = startPage; i <= endPage; i++) {
            pagination.appendChild(createButton(
                i,
                false,
                () => this.changePage(i),
                i === this.currentPage
            ));
        }
        
        // Next Button
        pagination.appendChild(createButton(
            '<i class="fas fa-chevron-right"></i>',
            this.currentPage === this.totalPages,
            () => this.changePage(this.currentPage + 1)
        ));
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
            // Tailwind Grid Classes
            if (this.isGridView) {
                container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8';
            } else {
                container.className = 'grid grid-cols-1 gap-6'; // List view as single column grid
            }
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
        if(window.openModal) {
            window.openModal(modalId);
        } else {
            const modal = document.getElementById(modalId);
            if (modal) modal.classList.remove('hidden');
        }
    }

    closeModal(modalId) {
         if(window.closeModal) {
            window.closeModal(modalId);
        } else {
            const modal = document.getElementById(modalId);
            if (modal) modal.classList.add('hidden');
        }
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
        const dropdown = document.getElementById('amenitiesFilter');
        if (dropdown) {
            dropdown.classList.toggle('hidden');
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