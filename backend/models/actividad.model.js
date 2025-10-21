module.exports = (sequelize, Sequelize) => {
  const Actividad = sequelize.define("Actividades", {
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
      type: Sequelize.ENUM('pendiente', 'completada'),
      allowNull: false,
      defaultValue: 'pendiente'
    },
    impacto: {
      type: Sequelize.ENUM('alto', 'medio', 'bajo'),
      allowNull: false,
      defaultValue: 'medio'
    }
  }, {
    timestamps: false
  });

  return Actividad;
};