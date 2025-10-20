const db = require("../models");
const User = db.Usuarios;
const Role = db.Roles;

exports.findAll = (req, res) => {
  console.log("Fetching all users...");
  User.findAll({
    attributes: ['id', 'nombre', 'email', 'rol_id'],
    include: {
      model: Role,
      as: 'role',
      attributes: ['nombre']
    }
  })
    .then(users => {
      console.log("Users found:", users);
      res.status(200).send(users);
    })
    .catch(err => {
      console.error("Error fetching users:", err);
      res.status(500).send({ message: err.message });
    });
};

exports.updateRole = (req, res) => {
  User.findByPk(req.params.id)
    .then(user => {
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      Role.findOne({ where: { nombre: req.body.role } })
        .then(role => {
          if (!role) {
            return res.status(404).send({ message: "Role Not found." });
          }

          user.update({ rol_id: role.id })
            .then(() => {
              User.findByPk(req.params.id, {
                include: {
                  model: Role,
                  as: 'role',
                  attributes: ['nombre']
                }
              }).then(updatedUser => {
                res.status(200).send({
                  id: updatedUser.id,
                  nombre: updatedUser.nombre,
                  email: updatedUser.email,
                  role: updatedUser.role ? updatedUser.role.nombre : null
                });
              });
            })
            .catch(err => {
              res.status(500).send({ message: err.message });
            });
        });
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};


exports.delete = (req, res) => {
  User.findByPk(req.params.id)
    .then(user => {
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      user.update({ activo: false })
        .then(() => {
          res.send({ message: "User deleted successfully!" });
        })
        .catch(err => {
          res.status(500).send({ message: err.message });
        });
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};