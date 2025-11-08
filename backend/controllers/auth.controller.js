const db = require("../models");
const config = require("../config/auth.config");
const User = db.Usuarios;
const Role = db.Roles;

const Op = db.Sequelize.Op;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.signup = async (req, res) => {
  try {
    // Save User to Database
    const role = await Role.findOne({ where: { nombre: "Pendiente" } });

    if (!role) {
      return res.status(500).send({ message: "Initial role not found." });
    }

    await User.create({
      nombre: req.body.username,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
      rol_id: role.id
    });

    res.send({ message: "User was registered successfully!" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// --- FUNCIÓN PARA /api/auth/me ---
exports.me = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'nombre', 'email'], // No enviar la contraseña
      include: {
        model: Role,
        as: 'role',
        attributes: ['nombre']
      }
    });

    if (!user) return res.status(404).send({ message: "User Not found." });

    res.status(200).send(user);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.signin = async (req, res) => {
  try {
    console.log("signin request body:", req.body);
    const user = await User.findOne({
      where: { email: req.body.email },
      include: {
      model: Role,
      as: 'role',
      attributes: ['nombre']
    }
  });
    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    if (user.role && user.role.nombre === 'Pendiente') {
      return res.status(401).send({ message: "Usted todavia no fue habilitado" });
    }

    const passwordIsValid = bcrypt.compareSync(
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

    const keepLoggedIn = req.body.keepLoggedIn;
    const expiresIn = keepLoggedIn ? '365d' : '8h';

    const token = jwt.sign({ id: user.id }, config.secret, {
      expiresIn: expiresIn
    });

    res.status(200).send({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      role: user.role ? user.role.nombre : null,
      accessToken: token
    });
  } catch (err) { // Este catch ya maneja todos los errores
    console.log("error in signin:", err);
    res.status(500).send({ message: err.message });
  }
};