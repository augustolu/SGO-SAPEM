module.exports = (sequelize, Sequelize) => {
  const Obra = sequelize.define("Obras", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nro: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    establecimiento: { // Cambiado de 'titulo'
      type: Sequelize.STRING(255),
      allowNull: false
    },
    detalle: { // Cambiado de 'descripcion'
      type: Sequelize.TEXT
    },
    localidad: { // Cambiado de 'ubicacion'
      type: Sequelize.STRING(255)
    },
    numero_gestion: {
      type: Sequelize.STRING(100),
      unique: true
    },
    categoria: {
      type: Sequelize.ENUM('salud', 'educación', 'deporte', 'secretaría general', 'vialidad', 'obra pública', 'varios'),
      allowNull: false
    },
    estado: {
      type: Sequelize.ENUM('Solicitud', 'Proceso de compulsa', 'En ejecución', 'Finalizada', 'Anulada'),
      allowNull: false,
      defaultValue: 'Solicitud'
    },
    fecha_inicio: {
      type: Sequelize.DATE
    },
    fecha_finalizacion_estimada: {
      type: Sequelize.DATE
    },
    plazo: { // Cambiado de 'plazo_dias'
      type: Sequelize.INTEGER
    },
    monto_sapem: {
      type: Sequelize.DECIMAL(15, 2)
    },
    monto_sub: {
      type: Sequelize.DECIMAL(15, 2)
    },
    af: {
      type: Sequelize.DECIMAL(15, 2)
    },
    representante_legal_id: { // Cambiado de 'rep_legal'
      type: Sequelize.INTEGER, // CORRECCIÓN: Debe ser INTEGER para coincidir con la FK de la BD
      allowNull: true
    },
    contribuyente_id: { // CORRECCIÓN: El campo debe llamarse 'contribuyente_id' y ser INTEGER
      type: Sequelize.INTEGER,
      allowNull: true
    },
    inspector_id: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    progreso: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    motivo_anulacion: {
      type: Sequelize.TEXT
    },
    latitude: {
      type: Sequelize.DECIMAL(10, 8)
    },
    longitude: {
      type: Sequelize.DECIMAL(11, 8)
    }
  }, {
    timestamps: false
  });

  return Obra;
};