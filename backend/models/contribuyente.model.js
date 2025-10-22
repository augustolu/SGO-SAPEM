module.exports = (sequelize, Sequelize) => {
  const Contribuyente = sequelize.define("Contribuyentes", {
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

  return Contribuyente;
};