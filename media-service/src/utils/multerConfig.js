const multer = require('multer');
const path = require('path');

// Set up multer for file upload
const uploadStorage = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, }, // 5 MB limit
    
    // File filter to only accept images
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
            return cb(new Error('Only images are allowed'));
        }
        cb(null, true);
    },

}).single('file'); // 'file' is the name of the field in the form   

// Middleware to handle file upload


module.exports =  { uploadStorage };
// This middleware will be used in the routes to handle file upload