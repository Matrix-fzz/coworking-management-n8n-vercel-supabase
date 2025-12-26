// Configuration de l'API
const API_BASE_URL = 'http://localhost:3000/api';

// Fonctions utilitaires pour les requêtes API
class ApiService {
    // Headers communs
    static getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }

    // Gestion des réponses
    static async handleResponse(response) {
        if (!response.ok) {
            const error = await response.json().catch(() => ({
                message: `HTTP error! status: ${response.status}`
            }));
            throw new Error(error.message || 'Une erreur est survenue');
        }
        return response.json();
    }

    // Requêtes GET
    static async get(endpoint) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    // Requêtes POST
    static async post(endpoint, data) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return this.handleResponse(response);
    }

    // Requêtes PUT
    static async put(endpoint, data) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return this.handleResponse(response);
    }

    // Requêtes DELETE
    static async delete(endpoint) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    // Upload de fichier
    static async uploadFile(endpoint, formData) {
        const headers = {};
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: headers,
            body: formData
        });
        return this.handleResponse(response);
    }
}

// Fonctions spécifiques à l'application
class CoworkingApi {
    // Auth
    static async register(userData) {
        return ApiService.post('/auth/register', userData);
    }

    static async login(credentials) {
        return ApiService.post('/auth/login', credentials);
    }

    static async getProfile() {
        return ApiService.get('/auth/me');
    }

    static async updateProfile(userData) {
        return ApiService.put('/auth/me', userData);
    }

    // Workspaces
    static async getWorkspaces(page = 1, filters = {}) {
        const queryParams = new URLSearchParams({
            page: page,
            limit: 6,
            ...filters
        });
        return ApiService.get(`/workspaces?${queryParams}`);
    }

    static async getWorkspace(id) {
        return ApiService.get(`/workspaces/${id}`);
    }

    static async createWorkspace(workspaceData) {
        return ApiService.post('/workspaces', workspaceData);
    }

    static async updateWorkspace(id, workspaceData) {
        return ApiService.put(`/workspaces/${id}`, workspaceData);
    }

    static async deleteWorkspace(id) {
        return ApiService.delete(`/workspaces/${id}`);
    }

    static async getUserWorkspaces(page = 1) {
        const queryParams = new URLSearchParams({ page, limit: 10 });
        return ApiService.get(`/workspaces/user/my-workspaces?${queryParams}`);
    }

    // Favorites
    static async addFavorite(workspaceId) {
        return ApiService.post(`/favorites/${workspaceId}`);
    }

    static async removeFavorite(workspaceId) {
        return ApiService.delete(`/favorites/${workspaceId}`);
    }

    static async getFavorites(page = 1) {
        const queryParams = new URLSearchParams({ page, limit: 10 });
        return ApiService.get(`/favorites/my-favorites?${queryParams}`);
    }

    static async checkFavorite(workspaceId) {
        return ApiService.get(`/favorites/check/${workspaceId}`);
    }

    // Scraping
    static async triggerScraping(data) {
        return ApiService.post('/scraping/trigger', data);
    }

    // Upload d'image
    static async uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);
        return ApiService.uploadFile('/upload', formData);
    }
}

// Export pour usage global
window.CoworkingApi = CoworkingApi;
window.ApiService = ApiService;