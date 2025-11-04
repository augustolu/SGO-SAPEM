module.exports = (sequelize, Sequelize) => {
  const Archivo = sequelize.define("Archivos", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre_original: {
      type: Sequelize.STRING(255),
      allowNull: false
    },
    nombre_guardado: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    ruta_archivo: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    mime_type: {
      type: Sequelize.STRING(100),
      allowNull: true
    },
    tamano_archivo: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    obra_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Obras',
        key: 'id'
      }
    },
    parent_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Archivos',
        key: 'id'
      }
    },
    tipo: {
      type: Sequelize.STRING(10),
      allowNull: false,
      defaultValue: 'file'
    }
  }, {
    timestamps: true, // createdAt and updatedAt
    tableName: 'Archivos'
  });

  return Archivo;
};