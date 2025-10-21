module.exports = (sequelize, Sequelize) => {
  const RepresentanteLegal = sequelize.define("RepresentantesLegales", {
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

  return RepresentanteLegal;
};