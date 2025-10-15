import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div>
      <h1>Bienvenido a Sapem</h1>
      <p>Por favor, inicie sesión o regístrese para continuar.</p>
      <Link to="/login">
        <button>Iniciar Sesión</button>
      </Link>
      <Link to="/register">
        <button>Registrarse</button>
      </Link>
    </div>
  );
};

export default HomePage;
