module.exports = (sequelize, Sequelize) => {
  const Contrato = sequelize.define("Contrato", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    orden: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    estado: {
      type: Sequelize.ENUM('pendiente', 'en ejecución', 'completado'),
      allowNull: false,
      defaultValue: 'pendiente',
    },
    monto: {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
    },
    fecha_firma: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    observaciones: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    nombre_archivo: {
      type: Sequelize.STRING(512),
      allowNull: true,
    },
    mime_type: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
    tamano_archivo: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    obra_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Obras',
        key: 'id',
      },
    },
  }, {
    tableName: 'Contratos',
  });

  return Contrato;
};
