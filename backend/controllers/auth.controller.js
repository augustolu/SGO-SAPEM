
const db = require("../models");
const config = require("../config/auth.config");
const User = db.Usuarios;
const Role = db.Roles;

const Op = db.Sequelize.Op;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.signup = (req, res) => {
  // Save User to Database
  Role.findOne({
    where: {
      nombre: "Pendiente"
    }
  }).then(role => {
    if (!role) {
      return res.status(500).send({ message: "Initial role not found." });
    }

    User.create({
      nombre: req.body.username,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
      rol_id: role.id
    })
    .then(user => {
      res.send({ message: "User was registered successfully!" });
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
  }).catch(err => {
    res.status(500).send({ message: err.message });
  });
};

exports.signin = (req, res) => {
  console.log("signin request body:", req.body);
  User.findOne({
    where: { email: req.body.email },
    include: {
      model: Role,
      as: 'role',
      attributes: ['nombre']
    }
  })
    .then(user => {
      console.log("user found:", user);
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      if (!user.activo) {
        return res.status(401).send({ message: "Su cuenta ha sido suspendida." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      console.log("password is valid:", passwordIsValid);
      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!"
        });
      }

      var token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: 86400 // 24 hours
      });

      res.status(200).send({
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role ? user.role.nombre : null,
        accessToken: token
      });
    })
    .catch(err => {
      console.log("error in signin:", err);
      res.status(500).send({ message: err.message });
    });
};
