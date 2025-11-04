const express = require("express");
const cors = require("cors");
const path = require("path"); // Añadir path

const app = express();

var corsOptions = {
  origin: "http://localhost:5173"
};

app.use(cors(corsOptions));

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, '..', 'public')));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

const db = require("./models");
const Role = db.Roles;

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

  Role.findOrCreate({
    where: { nombre: "Supervisor" },
    defaults: { nombre: "Supervisor" }
  });

  Role.findOrCreate({
    where: { nombre: "Pendiente" },
    defaults: { nombre: "Pendiente" }
  });
}

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to SGO-SAPEM application." });
});

// routes
const apiRouter = express.Router();
require('./routes/auth.routes')(apiRouter);
require('./routes/user.routes')(apiRouter);
require('./routes/obra.routes')(apiRouter);


require('./routes/role.routes')(apiRouter);
require('./routes/geocode.routes')(apiRouter);
require('./routes/contribuyente.routes')(apiRouter);
require('./routes/representanteLegal.routes')(apiRouter);
require('./routes/localidad.routes')(apiRouter);

require('./routes/contrato.routes')(apiRouter);
require('./routes/upload.routes')(apiRouter);
app.use('/api', apiRouter);

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("================================================================================");
  console.log(`Backend Server is running on port ${PORT}.`);
  console.log("================================================================================");
});