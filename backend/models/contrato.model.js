module.exports = (sequelize, Sequelize) => {
  const Contrato = sequelize.define("Contratos", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: Sequelize.STRING(255),
      allowNull: false
    },
    orden: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    estado: {
      type: Sequelize.ENUM('pendiente', 'en ejecución', 'completado'),
      allowNull: false,
      defaultValue: 'pendiente'
    },
    monto: {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true
    },
    fecha_firma: {
      type: Sequelize.DATEONLY,
      allowNull: true
    },
    observaciones: {
      type: Sequelize.TEXT,
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
    archivo_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Archivos',
        key: 'id'
      }
    }
  }, {
    timestamps: false,
    tableName: 'Contratos'
  });

  return Contrato;
};