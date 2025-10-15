
module.exports = (sequelize, Sequelize) => {
  const Documento = sequelize.define("Documentos", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre_archivo: {
      type: Sequelize.STRING(255),
      allowNull: false
    },
    ruta_archivo: {
      type: Sequelize.STRING(255),
      allowNull: false
    },
    fecha_carga: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    }
  });

  return Documento;
};
