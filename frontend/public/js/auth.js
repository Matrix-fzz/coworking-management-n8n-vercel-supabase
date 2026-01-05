// Gestion de l'authentification
class AuthManager {
  // Vérifier l'état d'authentification
  static async checkAuth() {
    console.log("🔍 Checking auth state...");
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    console.log("💎 Current localStorage state:", { 
        hasUser: !!savedUser, 
        hasToken: !!savedToken 
    });
    
    // Si on a un utilisateur local, on met à jour l'UI immédiatement pour éviter le flash
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        this.updateUI(true, userData);
        console.log("✅ UI synced with local storage");
      } catch (e) {
        console.error("Failed to parse local user data", e);
      }
    }

    // On vérifie ensuite auprès du serveur
    try {
      console.log("📡 Verifying session with server...");
      const response = await CoworkingApi.getProfile();
      if (response.success) {
        const userData = response.data.user;
        localStorage.setItem("user", JSON.stringify(userData));
        this.updateUI(true, userData);
        console.log("✅ Session verified with server");
        return true;
      }
    } catch (error) {
      console.warn("📡 Session verification failed:", error.message);
      
      // On ne déconnecte plus automatiquement ici pour éviter les déconnexions intempestives
      // au chargement de la page. On laisse l'utilisateur dans son état local.
      // La déconnexion sera gérée si une action protégée échoue ou si l'utilisateur clique sur déconnexion.
      if (error.status === 401) {
        console.log("⚠️ Session potentially invalid on server, but keeping local session for now.");
      }
    }

    return savedUser !== null;
  }

  // Mettre à jour l'interface utilisateur
  static updateUI(isAuthenticated, userData = null) {
    // Desktop elements
    const authSection = document.getElementById("authSection");
    const userSection = document.getElementById("userSection");
    const usernameDisplay = document.getElementById("usernameDisplay");
    const addWorkspaceBtn = document.getElementById("addWorkspaceBtn"); // Only on index

    // Mobile elements
    const authSectionMobile = document.getElementById("authSectionMobile");
    const userSectionMobile = document.getElementById("userSectionMobile");
    const usernameDisplayMobile = document.getElementById("usernameDisplayMobile");

    if (isAuthenticated && userData) {
      // Desktop: Show User, Hide Auth
      if (authSection) authSection.style.display = "none";
      if (userSection) {
          userSection.style.display = "flex";
          userSection.classList.remove("hidden"); // Ensure Tailwind hidden class is removed
      }
      if (usernameDisplay) usernameDisplay.textContent = userData.username;
      
      // Mobile: Show User, Hide Auth
      if (authSectionMobile) authSectionMobile.style.display = "none";
      if (userSectionMobile) {
          userSectionMobile.style.display = "block";
          userSectionMobile.classList.remove("hidden");
      }
      if (usernameDisplayMobile) usernameDisplayMobile.textContent = userData.username;

      // Add Workspace Button (Index only)
      if (addWorkspaceBtn) addWorkspaceBtn.style.display = "block";

    } else {
      // Desktop: Show Auth, Hide User
      if (authSection) {
          authSection.style.display = "flex";
          authSection.classList.remove("hidden");
      }
      if (userSection) {
          userSection.style.display = "none";
          userSection.classList.add("hidden");
      }
      if (usernameDisplay) usernameDisplay.textContent = "";

      // Mobile: Show Auth, Hide User
      if (authSectionMobile) {
          authSectionMobile.style.display = "block"; // Usually div/block
          authSectionMobile.classList.remove("hidden");
      }
      if (userSectionMobile) {
          userSectionMobile.style.display = "none";
          userSectionMobile.classList.add("hidden");
      }
      if (usernameDisplayMobile) usernameDisplayMobile.textContent = "";

      // Add Workspace Button
      if (addWorkspaceBtn) addWorkspaceBtn.style.display = "none";
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
        if (response.data.token) {
            localStorage.setItem("token", response.data.token);
        }
        localStorage.setItem("user", JSON.stringify(response.data.user));

        // Notification de succès
        AppNotification.success("Votre compte a été créé avec succès !");

        // Mettre à jour l'UI
        this.updateUI(true, response.data.user);

        // Redirection
        setTimeout(() => {
          window.location.href = "../index.html";
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
        
        // On sauvegarde le token et l'utilisateur
        if (response.data.token) {
            localStorage.setItem("token", response.data.token);
            console.log("💾 Token saved to localStorage");
        }
        localStorage.setItem("user", JSON.stringify(response.data.user));
        console.log("💾 User data saved to localStorage");

        AppNotification.success("Connexion réussie !");

        // S'assurer que l'UI est mise à jour AVANT la redirection
        this.updateUI(true, response.data.user);

        setTimeout(() => {
          console.log("🔄 Redirection vers index.html...");
          window.location.href = "../index.html";
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
  static async logout(notify = true) {
    try {
        // Appeler l'API de déconnexion pour détruire la session sur le serveur
        await ApiService.post('/auth/logout', {});
    } catch (err) {
        console.log("Logout API call failed, proceeding with local logout");
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    this.updateUI(false);

    if (notify) {
        // Notification de succès
        AppNotification.success("Vous avez été déconnecté avec succès");

        setTimeout(() => {
            // Redirection dynamique selon la page actuelle
            const isPagesDir = window.location.pathname.includes('/pages/');
            window.location.href = isPagesDir ? "../index.html" : "index.html";
        }, 1000);
    }
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
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    const authenticated = user !== null && token !== null;
    console.log(`🔑 Session state: User is ${authenticated ? 'authenticated' : 'not authenticated'}.`);
    return authenticated;
  }

  // Récupérer l'utilisateur courant
  static getCurrentUser() {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        console.log("👤 Current user data retrieved:", parsedUser);
        return parsedUser;
      } catch (error) {
        console.error("❌ Error parsing user data from localStorage:", error);
        return null;
      }
    }
    console.log("👤 No current user found in localStorage.");
    return null;
  }

  // Récupérer le token
  static getToken() {
    return localStorage.getItem("token");
  }

  // Protéger les routes
  static requireAuth() {
    if (!this.isAuthenticated()) {
      // Notification d'information
      AppNotification.info("Veuillez vous connecter pour accéder à cette page");

      // Redirection dynamique
      const isPagesDir = window.location.pathname.includes('/pages/');
      const redirectTo = isPagesDir ? "login.html" : "pages/login.html";

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
        // Remove password from local storage if present in updateData (security)
        delete updatedUser.password; 
        
        localStorage.setItem("user", JSON.stringify(updatedUser));

        // Mettre à jour l'UI immédiatement sans rechargement
        this.updateUI(true, updatedUser);

        return response.data;
      }
    } catch (error) {
      console.error("Update profile error:", error);
      this.showMessage("Erreur lors de la mise à jour du profil", 'error'); // Use internal method
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
