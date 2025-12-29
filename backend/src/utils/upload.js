const multer = require('multer');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = 'workspaces'; // Make sure this bucket exists in Supabase

// Storage configuration (Memory)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'));
    }
};

// Multer instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: fileFilter
});

// Helper to upload to Supabase
const uploadToSupabase = async (file) => {
    try {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`;
        
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filename, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (error) {
            throw error;
        }

        // Get public URL
        const { data: publicData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filename);
            
        return {
            filename: filename,
            url: publicData.publicUrl
        };
    } catch (error) {
        console.error('Supabase Upload Error:', error);
        throw error;
    }
};

// Middleware to handle upload errors
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB'
            });
        }
        return res.status(400).json({
            success: false,
            message: 'File upload error: ' + err.message
        });
    } else if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next();
};

module.exports = {
    upload,
    uploadToSupabase,
    handleUploadError
};