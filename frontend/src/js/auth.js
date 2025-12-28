// Gestion de l'authentification
class AuthManager {
  // Vérifier l'état d'authentification
  static checkAuth() {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user) {
      try {
        const userData = JSON.parse(user);
        this.updateUI(true, userData);
        return true;
      } catch (error) {
        console.error("Error parsing user data:", error);
        this.logout();
        return false;
      }
    }

    this.updateUI(false);
    return false;
  }

  // Mettre à jour l'interface utilisateur
  static updateUI(isAuthenticated, userData = null) {
    const authSection = document.getElementById("authSection");
    const userSection = document.getElementById("userSection");
    const usernameDisplay = document.getElementById("usernameDisplay");
    const addWorkspaceBtn = document.getElementById("addWorkspaceBtn");

    if (isAuthenticated && userData) {
      if (authSection) authSection.style.display = "none";
      if (userSection) userSection.style.display = "flex";
      if (usernameDisplay) {
        usernameDisplay.textContent = userData.username;
      }
      if (addWorkspaceBtn) {
        addWorkspaceBtn.style.display = "block";
      }
    } else {
      if (authSection) authSection.style.display = "flex";
      if (userSection) userSection.style.display = "none";
      if (usernameDisplay) {
        usernameDisplay.textContent = "";
      }
      if (addWorkspaceBtn) {
        addWorkspaceBtn.style.display = "none";
      }
    }
  }

  // Inscription
  static async register(event) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    // Récupérer les données du formulaire
    const formData = new FormData(form);
    const userData = {
      username: formData.get("username"),
      email: formData.get("email"),
      password: formData.get("password"),
    };

    // Validation frontend
    if (!this.validateRegistrationData(userData, form.confirmPassword?.value)) {
      return;
    }

    try {
      // Désactiver le bouton pendant la requête
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Inscription...';

      // Appel API
      const response = await CoworkingApi.register(userData);

      if (response.success) {
        // Sauvegarder les données
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        // Notification de succès
        AppNotification.success("Votre compte a été créé avec succès !");

        // Mettre à jour l'UI
        this.updateUI(true, response.data.user);

        // Redirection
        setTimeout(() => {
          window.location.href = "../../public/index.html";
        }, 1500);
      }
    } catch (error) {
      console.error("Registration error:", error);

      // Notification d'erreur
      const errorMessage = this.getErrorMessage(error, "inscription");
      AppNotification.error(errorMessage);
    } finally {
      // Réactiver le bouton
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }

  // Connexion
  // Dans la méthode login, ajoutez ce logging :
  static async login(event) {
    event.preventDefault();

    console.log("🟡 Début du processus de connexion...");

    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    const formData = new FormData(form);
    const credentials = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    console.log("📧 Email saisi:", credentials.email);
    console.log(
      "🔐 Mot de passe saisi:",
      credentials.password ? "***" : "vide"
    );

    // Validation frontend
    if (!this.validateLoginData(credentials)) {
      console.log("❌ Validation frontend échouée");
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Connexion...';

      console.log("🔄 Appel de l'API login...");
      console.log("URL API:", API_BASE_URL + "/auth/login");

      const response = await CoworkingApi.login(credentials);

      console.log("✅ Réponse API reçue:", response);

      if (response.success) {
        console.log("🎉 Connexion réussie !");
        console.log("Token reçu:", response.data.token ? "Oui" : "Non");
        console.log("User data:", response.data.user);

        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        AppNotification.success("Connexion réussie !");

        this.updateUI(true, response.data.user);

        setTimeout(() => {
          console.log("🔄 Redirection vers index.html...");
          window.location.href = "../../public/index.html";
        }, 1000);
      }
    } catch (error) {
      console.error("❌ Erreur détaillée:", error);
      console.error("Message d'erreur:", error.message);
      console.error("Stack trace:", error.stack);

      // Notification d'erreur
      const errorMessage = this.getErrorMessage(error, "connexion");
      console.log("📝 Message d'erreur affiché:", errorMessage);
      AppNotification.error(errorMessage);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }
  // Déconnexion
  static logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    this.updateUI(false);

    // Notification de succès
    AppNotification.success("Vous avez été déconnecté avec succès");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  }

  // Validation des données d'inscription
  static validateRegistrationData(userData, confirmPassword) {
    // Vérifier les champs requis
    if (!userData.username || !userData.email || !userData.password) {
      AppNotification.warning("Veuillez remplir tous les champs obligatoires");
      return false;
    }

    // Vérifier le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      AppNotification.warning("Veuillez entrer une adresse email valide");
      return false;
    }

    // Vérifier le mot de passe
    if (userData.password.length < 6) {
      AppNotification.warning(
        "Le mot de passe doit contenir au moins 6 caractères"
      );
      return false;
    }

    // Vérifier la confirmation du mot de passe
    if (confirmPassword && userData.password !== confirmPassword) {
      AppNotification.warning("Les mots de passe ne correspondent pas");
      return false;
    }

    // Vérifier le nom d'utilisateur
    if (userData.username.length < 3) {
      AppNotification.warning(
        "Le nom d'utilisateur doit contenir au moins 3 caractères"
      );
      return false;
    }

    return true;
  }

  // Validation des données de connexion
  static validateLoginData(credentials) {
    if (!credentials.email || !credentials.password) {
      AppNotification.warning("Veuillez remplir tous les champs");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      AppNotification.warning("Veuillez entrer une adresse email valide");
      return false;
    }

    return true;
  }

  // Obtenir un message d'erreur lisible
  static getErrorMessage(error, context = "opération") {
    if (
      error.message.includes("NetworkError") ||
      error.message.includes("Failed to fetch")
    ) {
      return "Erreur de connexion au serveur. Veuillez vérifier votre connexion internet.";
    }

    if (error.message.includes("401") || error.message.includes("Invalid")) {
      return context === "connexion"
        ? "Email ou mot de passe incorrect"
        : "Données d'authentification invalides";
    }

    if (
      error.message.includes("409") ||
      error.message.includes("already exists")
    ) {
      return "Cet email est déjà utilisé. Veuillez en choisir un autre.";
    }

    if (error.message.includes("400") || error.message.includes("Validation")) {
      return "Données invalides. Veuillez vérifier les informations saisies.";
    }

    if (error.message.includes("404")) {
      return "Ressource non trouvée.";
    }

    if (error.message.includes("500")) {
      return "Erreur interne du serveur. Veuillez réessayer plus tard.";
    }

    return `Erreur lors de la ${context}. Veuillez réessayer.`;
  }

  // Vérifier si l'utilisateur est authentifié
  static isAuthenticated() {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      return false;
    }

    try {
      // Vérifier si le token est expiré (simplifié)
      const tokenData = JSON.parse(atob(token.split(".")[1]));
      const now = Math.floor(Date.now() / 1000);

      if (tokenData.exp && tokenData.exp < now) {
        this.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error("Token validation error:", error);
      return false;
    }
  }

  // Récupérer l'utilisateur courant
  static getCurrentUser() {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        return JSON.parse(user);
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  // Récupérer le token
  static getToken() {
    return localStorage.getItem("token");
  }

  // Protéger les routes
  static requireAuth(redirectTo = "src/pages/login.html") {
    if (!this.isAuthenticated()) {
      // Notification d'information
      AppNotification.info("Veuillez vous connecter pour accéder à cette page");

      // Redirection
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 1500);

      return false;
    }
    return true;
  }

  // Mettre à jour le profil utilisateur
  static async updateProfile(updateData) {
    try {
      const response = await CoworkingApi.updateProfile(updateData);

      if (response.success) {
        // Mettre à jour les données locales
        const currentUser = this.getCurrentUser();
        const updatedUser = { ...currentUser, ...updateData };
        localStorage.setItem("user", JSON.stringify(updatedUser));

        // Notification de succès
        AppNotification.success("Profil mis à jour avec succès");

        return response.data;
      }
    } catch (error) {
      console.error("Update profile error:", error);
      AppNotification.error("Erreur lors de la mise à jour du profil");
      throw error;
    }
  }
  // Afficher un message (proxy vers Notification)
  static showMessage(message, type = 'info') {
    if (typeof AppNotification !== 'undefined') {
      switch (type) {
        case 'success':
          AppNotification.success(message);
          break;
        case 'error':
          AppNotification.error(message);
          break;
        case 'warning':
          AppNotification.warning(message);
          break;
        default:
          AppNotification.info(message);
      }
    } else {
      alert(message);
    }
  }
}

// Initialisation
document.addEventListener("DOMContentLoaded", function () {
  AuthManager.checkAuth();

  // Gestion du menu mobile
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
  }

  // Vérifier s'il y a un message dans l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const message = urlParams.get("message");
  const messageType = urlParams.get("type");

  if (message && window.AppNotification) {
    switch (messageType) {
      case "success":
        AppNotification.success(message);
        break;
      case "error":
        AppNotification.error(message);
        break;
      case "warning":
        AppNotification.warning(message);
        break;
      default:
        AppNotification.info(message);
    }

    // Nettoyer l'URL
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }
});

// Exporter pour usage global
window.AuthManager = AuthManager;
window.logout = AuthManager.logout.bind(AuthManager);
window.checkAuth = AuthManager.checkAuth.bind(AuthManager);
