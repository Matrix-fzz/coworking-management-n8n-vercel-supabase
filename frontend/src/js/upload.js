// Gestion de l'upload d'images
class UploadManager {
    // Upload une image
    static async uploadImage(file) {
        try {
            const formData = new FormData();
            formData.append('image', file);
            
            const response = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AuthManager.getToken()}`
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Upload failed');
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    }

    // Afficher le sélecteur de fichier
    static showImageUpload(onSuccess) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // Validation de la taille
            if (file.size > 5 * 1024 * 1024) {
                AuthManager.showMessage('L\'image est trop volumineuse (max 5MB)', 'error');
                return;
            }
            
            // Validation du type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                AuthManager.showMessage('Format d\'image non supporté', 'error');
                return;
            }
            
            try {
                // Afficher un indicateur de chargement
                AuthManager.showMessage('Upload de l\'image en cours...', 'info');
                
                const result = await this.uploadImage(file);
                
                if (result.success) {
                    AuthManager.showMessage('Image uploadée avec succès', 'success');
                    
                    if (onSuccess && typeof onSuccess === 'function') {
                        onSuccess(result.data.imageUrl);
                    }
                }
            } catch (error) {
                AuthManager.showMessage('Erreur lors de l\'upload', 'error');
            }
        };
        
        input.click();
    }

    // Prévisualiser une image
    static previewImage(file, previewElementId) {
        const reader = new FileReader();
        const preview = document.getElementById(previewElementId);
        
        reader.onload = (e) => {
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
        };
        
        reader.readAsDataURL(file);
    }

    // Redimensionner une image côté client (optionnel)
    static resizeImage(file, maxWidth = 800, maxHeight = 600) {
        return new Promise((resolve) => {
            const img = new Image();
            const reader = new FileReader();
            
            reader.onload = (e) => {
                img.src = e.target.result;
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    // Calculer les nouvelles dimensions
                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        }));
                    }, 'image/jpeg', 0.8);
                };
            };
            
            reader.readAsDataURL(file);
        });
    }
}

window.UploadManager = UploadManager;