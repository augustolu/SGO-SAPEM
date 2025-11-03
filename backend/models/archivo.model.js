const ArchivoModel = (sequelize, Sequelize) => {
  const Archivo = sequelize.define("archivos", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre_original: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    nombre_guardado: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    ruta_archivo: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    mime_type: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    tamano_archivo: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });

  return Archivo;
};

module.exports = ArchivoModel;
