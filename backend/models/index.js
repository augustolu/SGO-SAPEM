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
db.RepresentantesLegales = require("./representanteLegal.model.js")(sequelize, Sequelize); // NUEVO
db.Contribuyentes = require("./contribuyente.model.js")(sequelize, Sequelize);
db.Localidades = require("./localidad.model.js")(sequelize, Sequelize);

// Relaciones
db.Roles.hasMany(db.Usuarios, { as: "usuarios", foreignKey: 'rol_id' });
db.Usuarios.belongsTo(db.Roles, { as: "role", foreignKey: 'rol_id' });

db.Usuarios.hasMany(db.Obras, { as: 'Obras', foreignKey: 'inspector_id' }); // CORRECCIÓN: Añadir alias inverso
db.Obras.belongsTo(db.Usuarios, { as: 'Usuario', foreignKey: 'inspector_id' }); // CORRECCIÓN: Añadir alias 'Usuario'

db.Obras.hasMany(db.Actividades, { as: 'Actividades', foreignKey: 'obra_id' }); // CORRECCIÓN: Añadir alias 'Actividades'
db.Actividades.belongsTo(db.Obras, { foreignKey: 'obra_id' });

db.Obras.hasMany(db.Documentos, { as: 'Documentos', foreignKey: 'obra_id' }); // CORRECCIÓN: Añadir alias 'Documentos'
db.Documentos.belongsTo(db.Obras, { foreignKey: 'obra_id' });

db.Actividades.hasMany(db.Documentos, { foreignKey: 'actividad_id' });
db.Documentos.belongsTo(db.Actividades, { foreignKey: 'actividad_id' });

// NUEVA RELACIÓN: Obras <-> RepresentantesLegales
db.RepresentantesLegales.hasMany(db.Obras, { foreignKey: 'representante_legal_id' });
db.Obras.belongsTo(db.RepresentantesLegales, { as: 'RepresentanteLegal', foreignKey: 'representante_legal_id' });

// NUEVA RELACIÓN: Obras <-> Contribuyentes
db.Contribuyentes.hasMany(db.Obras, { foreignKey: 'contribuyente_id' });
db.Obras.belongsTo(db.Contribuyentes, { as: 'Contribuyente', foreignKey: 'contribuyente_id' });

// NUEVA RELACIÓN: Obras <-> Localidades
db.Localidades.hasMany(db.Obras, { foreignKey: 'localidad_id' });
db.Obras.belongsTo(db.Localidades, { as: 'Localidad', foreignKey: 'localidad_id' });

module.exports = db;