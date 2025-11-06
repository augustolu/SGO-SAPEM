const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Carpeta para guardar temporalmente los archivos de Excel
const uploadPath = path.join(__dirname, '..', '..', 'public', 'uploads', 'temp_excel');
fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Aceptar solo archivos de Excel
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel' // .xls
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos .xlsx o .xls'), false);
  }
};

module.exports = multer({ storage: storage, fileFilter: fileFilter });