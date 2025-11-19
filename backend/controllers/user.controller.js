const db = require("../models");
const User = db.Usuarios;
const Role = db.Roles;
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// --- Configuración de Nodemailer ---
// Configura el transportador de correo usando las credenciales de Gmail.
// ¡IMPORTANTE! Es más seguro usar variables de entorno para esto.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sapemsgo@gmail.com', 
    pass: 'ztyv muyh xhdc mttv' 
  }
});

// --- Almacenamiento temporal de códigos ---
// En una aplicación real, esto debería estar en la base de datos (una tabla `email_verifications`)
// con una fecha de expiración. Para simplificar, usaremos un objeto en memoria.
const verificationCodes = {}; // { userId: { code: '123456', newEmail: 'new@email.com', expires: timestamp } }


exports.findAll = (req, res) => {
  console.log("Fetching all users...");
  User.findAll({
    // Ordenar para mostrar los usuarios pendientes primero
    order: [
      [db.Sequelize.literal("CASE WHEN \"role\".\"nombre\" = 'Pendiente' THEN 0 ELSE 1 END"), 'ASC'],
      ['nombre', 'ASC']
    ],
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

exports.updateProfile = async (req, res) => {
  const { id } = req.params;
  const { nombre, email, password, verificationCode } = req.body;

  // --- LOG DE DIAGNÓSTICO ---
  console.log(`[LOG] Petición PUT a /users/${id} recibida. Body:`, req.body);

  try {
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).send({ message: "Usuario no encontrado." });
    }

    // El middleware verifyToken añade req.userId y req.userRole
    // Verificamos si el usuario que hace la petición es el dueño del perfil o un admin
    if (user.id !== req.userId && req.userRole !== 'Administrador General') {
        return res.status(403).send({ message: "No tienes permiso para actualizar este perfil." });
    }

    // Lógica de verificación de cambio de email
    if (verificationCode) {
      const stored = verificationCodes[req.userId];

      if (!stored || stored.code !== verificationCode || stored.newEmail !== email) {
        return res.status(400).send({ message: "Código de verificación inválido o expirado." });
      }

      if (new Date().getTime() > stored.expires) {
        delete verificationCodes[req.userId]; // Limpiar código expirado
        return res.status(400).send({ message: "El código de verificación ha expirado. Por favor, solicita uno nuevo." });
      }

      // El código es correcto, procedemos a actualizar el email.
      user.email = email;
      delete verificationCodes[req.userId]; // El código ya fue usado

    } else if (email !== user.email) {
      // Si el email es diferente pero no se proveyó un código, es un intento inválido.
      return res.status(403).send({ message: "Para cambiar tu email, debes verificarlo primero." });
    }

    // Actualizar otros campos
    user.nombre = nombre;
    if (!verificationCode) { // Solo actualiza el email si no estamos en el flujo de verificación
        user.email = email;
    }

    if (password) {
      user.password = bcrypt.hashSync(password, 8);
    }

    await user.save();

    const userResponse = {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: req.userRole
    };

    res.status(200).send({
      message: "Perfil actualizado con éxito.",
      user: userResponse
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// --- NUEVA FUNCIÓN PARA SOLICITAR CAMBIO DE EMAIL ---
exports.requestEmailChange = async (req, res) => {
  const { newEmail } = req.body;
  const userId = req.userId; // Obtenido del token JWT

  // --- LOG DE DIAGNÓSTICO ---
  console.log(`[LOG] Petición POST a /users/request-email-change recibida. UserID: ${userId}, NewEmail: ${newEmail}`);

  if (!newEmail) {
    return res.status(400).send({ message: "El nuevo email es requerido." });
  }

  try {
    // 1. Verificar si el nuevo email ya está en uso
    const existingUser = await User.findOne({ where: { email: newEmail } });
    if (existingUser && existingUser.id !== userId) {
      return res.status(409).send({ message: "Este correo electrónico ya está en uso por otra cuenta." });
    }

    // 2. Generar código de verificación
    const code = crypto.randomInt(100000, 999999).toString(); // Código de 6 dígitos
    const expiration = new Date().getTime() + 15 * 60 * 1000; // Válido por 15 minutos

    // 3. Almacenar el código (en memoria para este ejemplo)
    verificationCodes[userId] = { code, newEmail, expires: expiration };

    // 4. Enviar el email
    const mailOptions = {
      from: '"SAPEM SGO" <sapemsgo@gmail.com>',
      to: newEmail,
      subject: 'Código de Verificación para Cambio de Email',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Verificación de Cambio de Correo Electrónico</h2>
          <p>Hola,</p>
          <p>Has solicitado cambiar tu dirección de correo electrónico en el sistema de SAPEM SGO.</p>
          <p>Usa el siguiente código para confirmar tu nueva dirección. Este código es válido por 15 minutos.</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0; text-align: center;">${code}</p>
          <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
          <br>
          <p>Saludos,<br>El equipo de SAPEM SGO</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send({ message: `Código de verificación enviado a ${newEmail}.` });
  } catch (error) {
    console.error("Error en requestEmailChange:", error);
    res.status(500).send({ message: "Error al procesar la solicitud." });
  }
};

// --- AÑADE ESTA NUEVA FUNCIÓN ---
exports.findAllInspectores = (req, res) => {
  // Primero, encontramos el ID del rol "Inspector"
  Role.findOne({ where: { nombre: 'Inspector' } })
    .then(role => {
      if (!role) {
        return res.status(404).send({ message: "Rol 'Inspector' no encontrado." });
      }
      // Luego, buscamos todos los usuarios con ese rol_id
      User.findAll({
        where: { rol_id: role.id },
        attributes: ['id', 'nombre'], // Solo enviamos los datos que el formulario necesita
        order: [['nombre', 'ASC']] // Opcional: ordenar alfabéticamente
      })
      .then(users => {
        res.status(200).send(users);
      })
      .catch(err => {
        console.error(`Error al buscar inspectores por rol_id=${role.id}:`, err);
        res.status(500).send({ message: err.message });
      });
    })
    .catch(err => {
      console.error("Error al buscar el rol 'Inspector':", err);
      res.status(500).send({ message: err.message });
    });
};
// ----------------------------------

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
  Role.findOne({ where: { nombre: "Pendiente" } })
    .then(role => {
      if (!role) {
        return res.status(500).send({ message: "Default role not found." });
      }
      User.findByPk(req.params.id)
        .then(user => {
          if (!user) {
            return res.status(404).send({ message: "User Not found." });
          }

          user.update({ rol_id: role.id })
            .then(() => {
              res.send({ message: "User was demoted to a pending state successfully!" });
            })
            .catch(err => {
              res.status(500).send({ message: err.message });
            });
        })
        .catch(err => {
          res.status(500).send({ message: err.message });
        });
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};