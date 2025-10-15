
module.exports = (sequelize, Sequelize) => {
  const Role = sequelize.define("Roles", {
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
  });

  return Role;
};
