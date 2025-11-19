const { authJwt } = require("../middleware");
const controller = require("../controllers/archivo.controller");
const documentUpload = require("../middleware/documentUpload");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Get file/folder tree for an obra
  app.get(
    "/obras/:obra_id/archivos",
    [authJwt.verifyToken],
    controller.getArchivosPorObra
  );

  // Create a new folder
  app.post(
    "/obras/:obra_id/archivos/folder",
    [authJwt.verifyToken],
    controller.createFolder
  );

  // Upload files
  app.post(
    "/obras/:obra_id/archivos/upload",
    [authJwt.verifyToken, documentUpload],
    controller.uploadFiles
  );

  // Delete a file or folder
  app.delete(
    "/archivos/:id",
    [authJwt.verifyToken],
    controller.deleteArchivo
  );

  // Rename a file or folder
  app.put(
    "/archivos/:id",
    [authJwt.verifyToken],
    controller.renameArchivo
  );
};
