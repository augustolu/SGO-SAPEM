
const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");
const User = db.Usuarios;

verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, config.secret,
    (err, decoded) => {
      if (err) {
        return res.status(401).send({ message: "Unauthorized!" });
      }
      req.userId = decoded.id;
      next();
    });
};

isAdmin = (req, res, next) => {
  User.findByPk(req.userId).then(user => {
    user.getRole().then(role => {
      if (role.nombre === "Administrador General") {
        next();
        return;
      }

      res.status(403).send({ message: "Require Admin Role!" });
    });
  });
};

isInspector = (req, res, next) => {
  User.findByPk(req.userId).then(user => {
    user.getRole().then(role => {
      if (role.nombre === "Inspector") {
        next();
        return;
      }

      res.status(403).send({ message: "Require Inspector Role!" });
    });
  });
};

isAdminOrInspector = (req, res, next) => {
  User.findByPk(req.userId).then(user => {
    user.getRole().then(role => {
      if (role.nombre === "Administrador General" || role.nombre === "Inspector") {
        next();
        return;
      }

      res.status(403).send({ message: "Require Admin or Inspector Role!" });
    });
  });
};

const authJwt = {
  verifyToken: verifyToken,
  isAdmin: isAdmin,
  isInspector: isInspector,
  isAdminOrInspector: isAdminOrInspector
};
module.exports = authJwt;
