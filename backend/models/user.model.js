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
    timestamps: false
  });

  return User;
};