
// PLEASE UPDATE WITH YOUR DATABASE CREDENTIALS
module.exports = {
  HOST: "localhost",
  USER: "sapem",
  PASSWORD: "sapemsegura2025",
  DB: "sgo_sapem",
  dialect: "mysql",
  charset: "utf8mb4",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};
