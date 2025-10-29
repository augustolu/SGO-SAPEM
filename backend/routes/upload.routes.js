const multer = require('multer');
const path = require('path');

module.exports = function(app) {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../../public/uploads'));
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({ storage: storage });

  app.post('/upload', upload.single('imagen'), (req, res) => {
    if (!req.file) {
      return res.status(400).send({ message: 'No se subió ningún archivo.' });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    res.status(200).send({ imageUrl: imageUrl });
  });
};