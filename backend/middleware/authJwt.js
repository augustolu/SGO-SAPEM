const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");
const User = db.Usuarios; // Asegúrate que el modelo es 'Usuarios'

const verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({
      message: "No token provided!"
    });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized!"
      });
    }
    req.userId = decoded.id;
    next();
  });
};

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId, {
      include: { model: db.Roles, as: 'role' } // Incluir el rol directamente
    });

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    if (user.role && user.role.nombre === "Administrador General") {
      return next();
    }
    res.status(403).send({ message: "Require Admin Role!" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const isSupervisorOrAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId, {
      include: { model: db.Roles, as: 'role' }
    });

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    if (user.role && (user.role.nombre === "Supervisor" || user.role.nombre === "Administrador General")) {
      return next();
    }

    res.status(403).send({ message: "Require Supervisor or Admin Role!" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const authJwt = {
  verifyToken: verifyToken,
  isAdmin: isAdmin,
  isSupervisorOrAdmin: isSupervisorOrAdmin
};
module.exports = authJwt;