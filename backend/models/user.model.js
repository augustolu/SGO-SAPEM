module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("Usuarios", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: Sequelize.STRING(255),
      allowNull: false
    },
    username: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: Sequelize.STRING(255),
      allowNull: false,
      unique: true
    },
    password: {
      type: Sequelize.STRING(255),
      allowNull: false
    },
    rol_id: {
      type: Sequelize.INTEGER,
      references: {
        model: 'Roles',
        key: 'id'
      }
    }
  }, {
    timestamps: true,
    underscored: true
  });

  return User;
};