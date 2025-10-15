
// PLEASE UPDATE WITH YOUR DATABASE CREDENTIALS
module.exports = {
  HOST: "localhost",
  USER: "sapem",
  PASSWORD: "sapemsegura2025",
  DB: "sgo_sapem",
  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};
