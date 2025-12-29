const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const { upload, uploadToSupabase, handleUploadError } = require('../utils/upload');

// Route d'upload
router.post('/', authMiddleware, upload.single('image'), handleUploadError, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }
        
        // Upload to Supabase
        const result = await uploadToSupabase(req.file);
        
        res.json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                imageUrl: result.url,
                filename: result.filename,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading file: ' + error.message
        });
    }
});

module.exports = router;