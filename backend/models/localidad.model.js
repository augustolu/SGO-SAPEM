module.exports = (sequelize, Sequelize) => {
  const Localidad = sequelize.define("Localidades", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: Sequelize.STRING(255),
      allowNull: false,
      unique: true
    }
  }, {
    timestamps: false
  });

  return Localidad;
};