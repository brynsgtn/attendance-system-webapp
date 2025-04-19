import multer from 'multer';
import path from 'path';
import fs from 'fs';


// Ensure directory exists before uploading
const ensureDirectoryExists = (directory) => {
    try {
        // Create directory if it doesn't exist, including parent directories
        fs.mkdirSync(directory, { recursive: true });
    } catch (err) {
        console.error('Error creating directory:', err);
    }
};

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Resolve absolute path from current working directory
        const uploadDir = path.join(process.cwd(), 'public/images');
        
        // Ensure directory exists
        ensureDirectoryExists(uploadDir);
        
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Create unique filename
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/i;
    const extname = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype;

    const isValidFileType = 
        allowedTypes.test(extname) && 
        allowedTypes.test(mimetype.split('/').pop());

    if (isValidFileType) {
        return cb(null, true);
    } else {
        return cb(new Error('Invalid file type. Only image files are allowed.'), false);
    }
};

// Multer upload configuration
const upload = multer({ 
    storage: storage, 
    fileFilter: fileFilter,
    limits: { 
        fileSize: 5 * 1024 * 1024, // 5MB file size limit
    }
}).single('file');

// Error handling middleware for file upload
export const uploadMiddleware = (req, res, next) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ 
                message: err.message || 'File upload error' 
            });
        } else if (err) {
            return res.status(400).json({ 
                message: err.message || 'An unexpected error occurred during file upload' 
            });
        }
        next();
    });
};
