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


db.RepresentantesLegales = require("./representanteLegal.model.js")(sequelize, Sequelize); // NUEVO
db.Contribuyentes = require("./contribuyente.model.js")(sequelize, Sequelize);
db.Localidades = require("./localidad.model.js")(sequelize, Sequelize);
db.Archivos = require("./archivo.model.js")(sequelize, Sequelize); // Nuevo modelo de Archivos
db.Contratos = require("./contrato.model.js")(sequelize, Sequelize); // Nuevo modelo de Contratos


// Relaciones
db.Roles.hasMany(db.Usuarios, { as: "usuarios", foreignKey: 'rol_id' });
db.Usuarios.belongsTo(db.Roles, { as: "role", foreignKey: 'rol_id' });

db.Usuarios.hasMany(db.Obras, { as: 'Obras', foreignKey: 'inspector_id' });
db.Obras.belongsTo(db.Usuarios, { as: 'Usuario', foreignKey: 'inspector_id' });




// Obras <-> RepresentantesLegales
db.RepresentantesLegales.hasMany(db.Obras, { foreignKey: 'representante_legal_id' });
db.Obras.belongsTo(db.RepresentantesLegales, { as: 'RepresentanteLegal', foreignKey: 'representante_legal_id' });

// Obras <-> Contribuyentes
db.Contribuyentes.hasMany(db.Obras, { foreignKey: 'contribuyente_id' });
db.Obras.belongsTo(db.Contribuyentes, { as: 'Contribuyente', foreignKey: 'contribuyente_id' });

// Obras <-> Localidades
db.Localidades.hasMany(db.Obras, { foreignKey: 'localidad_id' });
db.Obras.belongsTo(db.Localidades, { as: 'Localidad', foreignKey: 'localidad_id' });

// Obras <-> Contratos
db.Obras.hasMany(db.Contratos, { as: 'Contratos', foreignKey: 'obra_id' });
db.Contratos.belongsTo(db.Obras, { foreignKey: 'obra_id' });

// Contratos <-> Archivos
db.Contratos.belongsTo(db.Archivos, { foreignKey: 'archivo_id', as: 'Archivo' });
db.Archivos.hasOne(db.Contratos, { foreignKey: 'archivo_id' });

// Obras <-> Archivos
db.Obras.hasMany(db.Archivos, { as: 'Archivos', foreignKey: 'obra_id' });
db.Archivos.belongsTo(db.Obras, { foreignKey: 'obra_id' });

// Archivos (self-referencing for parent_id)
db.Archivos.hasMany(db.Archivos, { as: 'Children', foreignKey: 'parent_id' });
db.Archivos.belongsTo(db.Archivos, { as: 'Parent', foreignKey: 'parent_id' });

module.exports = db;