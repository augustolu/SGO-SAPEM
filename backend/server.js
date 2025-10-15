const express = require("express");
const cors = require("cors");

const app = express();

var corsOptions = {
  origin: "http://localhost:5173"
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

const db = require("./models");
const Role = db.Roles;

// In development, you may need to drop existing tables and re-sync database.
// Just use {force: true}
// db.sequelize.sync({force: true}).then(() => {
//   console.log('Drop and Resync Db');
//   initial();
// });

db.sequelize.sync().then(() => {
  console.log('DB Synced');
  initial();
});

function initial() {
  Role.findOrCreate({
    where: { nombre: "Administrador General" },
    defaults: { nombre: "Administrador General" }
  });
 
  Role.findOrCreate({
    where: { nombre: "Inspector" },
    defaults: { nombre: "Inspector" }
  });
}

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to SGO-SAPEM application." });
});

// routes
const apiRouter = express.Router();
require('./routes/auth.routes')(apiRouter);
require('./routes/obra.routes')(apiRouter);
require('./routes/actividad.routes')(apiRouter);
require('./routes/documento.routes')(apiRouter);
app.use('/api', apiRouter);

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});