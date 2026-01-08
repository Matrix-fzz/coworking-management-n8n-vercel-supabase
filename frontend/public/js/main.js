// Initialize
document.addEventListener("DOMContentLoaded", function () {
    if (typeof checkAuth === 'function') checkAuth();
    if (typeof loadWorkspaces === 'function') loadWorkspaces();
    if (typeof setupEventListeners === 'function') setupEventListeners();
});

// Update modal logic for new Tailwind structure
window.openModal = function (modalId) {
    const modal = document.getElementById(modalId);
    const backdrop = document.getElementById("modalBackdrop");
    const panel = document.getElementById("modalPanel");

    if (modal) {
        modal.classList.remove("hidden");
        // Trigger animations
        setTimeout(() => {
            if (backdrop) {
                backdrop.classList.remove("opacity-0");
                backdrop.classList.add("opacity-100");
            }
            if (panel) {
                panel.classList.remove(
                    "opacity-0",
                    "translate-y-4",
                    "sm:translate-y-0",
                    "sm:scale-95"
                );
                panel.classList.add(
                    "opacity-100",
                    "translate-y-0",
                    "sm:scale-100"
                );
            }
        }, 10);
    }
};

window.closeModal = function (modalId) {
    const modal = document.getElementById(modalId);
    const backdrop = document.getElementById("modalBackdrop");
    const panel = document.getElementById("modalPanel");

    if (modal) {
        if (backdrop) {
            backdrop.classList.remove("opacity-100");
            backdrop.classList.add("opacity-0");
        }
        if (panel) {
            panel.classList.remove(
                "opacity-100",
                "translate-y-0",
                "sm:scale-100"
            );
            panel.classList.add(
                "opacity-0",
                "translate-y-4",
                "sm:translate-y-0",
                "sm:scale-95"
            );
        }

        // Wait for animation to finish
        setTimeout(() => {
            modal.classList.add("hidden");
        }, 300);
    }
};

// Override the global openAddWorkspaceModal for specific animation handling
window.openAddWorkspaceModal = function () {
    const form = document.getElementById("addWorkspaceForm");
    const workspaceId = document.getElementById("workspaceId");
    const modalTitle = document.getElementById("modalTitle");
    const submitBtnText = document.getElementById("submitBtnText");
    const previewImg = document.getElementById("previewImg");
    const uploadPlaceholder = document.getElementById("uploadPlaceholder");

    if (form) form.reset();
    if (workspaceId) workspaceId.value = "";
    if (modalTitle) modalTitle.textContent = "Ajouter un espace";
    if (submitBtnText) submitBtnText.textContent = "Ajouter l'espace";
    if (previewImg) previewImg.style.display = "none";
    if (uploadPlaceholder) uploadPlaceholder.style.display = "block";

    openModal("addWorkspaceModal");
};
