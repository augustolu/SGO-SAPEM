
const dbConfig = require("../config/db.config.js");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,

  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Roles = require("./role.model.js")(sequelize, Sequelize);
db.Usuarios = require("./user.model.js")(sequelize, Sequelize);
db.Obras = require("./obra.model.js")(sequelize, Sequelize);
db.Actividades = require("./actividad.model.js")(sequelize, Sequelize);
db.Documentos = require("./documento.model.js")(sequelize, Sequelize);

// Relaciones
db.Roles.hasMany(db.Usuarios, { as: "usuarios", foreignKey: 'rol_id' });
db.Usuarios.belongsTo(db.Roles, { as: "role", foreignKey: 'rol_id' });

db.Usuarios.hasMany(db.Obras, { foreignKey: 'inspector_id' });
db.Obras.belongsTo(db.Usuarios, { foreignKey: 'inspector_id' });

db.Obras.hasMany(db.Actividades, { foreignKey: 'obra_id' });
db.Actividades.belongsTo(db.Obras, { foreignKey: 'obra_id' });

db.Obras.hasMany(db.Documentos, { foreignKey: 'obra_id' });
db.Documentos.belongsTo(db.Obras, { foreignKey: 'obra_id' });

db.Actividades.hasMany(db.Documentos, { foreignKey: 'actividad_id' });
db.Documentos.belongsTo(db.Actividades, { foreignKey: 'actividad_id' });

module.exports = db;
