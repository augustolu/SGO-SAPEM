const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', '..', 'public', 'uploads', 'contratos');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF!'), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter }).single('contrato');

module.exports = (req, res, next) => {
  console.log("--- Entering upload middleware ---");
  upload(req, res, (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).send({ message: err.message });
    }
    next();
  });
};
