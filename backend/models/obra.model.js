
module.exports = (sequelize, Sequelize) => {
  const Obra = sequelize.define("Obras", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    titulo: {
      type: Sequelize.STRING(255),
      allowNull: false
    },
    descripcion: {
      type: Sequelize.TEXT
    },
    ubicacion: {
      type: Sequelize.STRING(255)
    },
    numero_gestion: {
      type: Sequelize.STRING(100),
      unique: true
    },
    categoria: {
      type: Sequelize.ENUM('salud', 'educación', 'deporte', 'secretaría general', 'vialidad', 'obra pública', 'varios'),
      allowNull: false
    },
    estado: {
      type: Sequelize.ENUM('Solicitud', 'Proceso de compulsa', 'En ejecución', 'Finalizada', 'Anulada'),
      allowNull: false,
      defaultValue: 'Solicitud'
    },
    fecha_inicio: {
      type: Sequelize.DATE
    },
    fecha_finalizacion_estimada: {
      type: Sequelize.DATE
    },
    plazo_dias: {
      type: Sequelize.INTEGER
    },
    monto: {
      type: Sequelize.DECIMAL(15, 2)
    },
    contratista: {
      type: Sequelize.STRING(255)
    },
    progreso: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    motivo_anulacion: {
      type: Sequelize.TEXT
    }
  });

  return Obra;
};
