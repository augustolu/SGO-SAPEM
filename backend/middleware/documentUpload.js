const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Destination for general documents
const documentsPath = path.join(__dirname, '..', '..', 'public', 'uploads', 'documentos');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure the directory exists
    fs.mkdirSync(documentsPath, { recursive: true });
    cb(null, documentsPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Sanitize originalname to prevent path traversal issues, though multer handles this well.
    const originalname = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
    cb(null, `doc-${uniqueSuffix}-${originalname}`);
  }
});

// No file filter to allow any type of file
const upload = multer({ storage: storage }).array('files', 10); // Allow up to 10 files at once

module.exports = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      return res.status(500).json({ message: `Multer error: ${err.message}` });
    } else if (err) {
      // An unknown error occurred when uploading.
      return res.status(500).json({ message: `Unknown upload error: ${err.message}` });
    }
    // Everything went fine.
    next();
  });
};
