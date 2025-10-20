import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './LoginPage.css'; // Asegúrate de crear este archivo CSS

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false); // Estado para el modal
  const [showNotEnabledModal, setShowNotEnabledModal] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setShowModal(true); // Muestra el modal
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password, keepLoggedIn);
      navigate('/obras');
    } catch (err) {
      console.error('Failed to login');
      console.log('Caught error:', JSON.stringify(err));
      if (err.response) {
        console.log('Error response:', JSON.stringify(err.response));
      }

      if (err.response && err.response.data && err.response.data.message === 'Usted todavia no fue habilitado') {
        setShowNotEnabledModal(true);
      } else {
        setError('Credenciales incorrectas. Por favor, inténtalo de nuevo.');
      }
    }
  };

  return (
    <div className="login-container">
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p>Contactarse con administrador, <strong>Maria Pia Pollio</strong></p>
            <button onClick={() => setShowModal(false)} className="modal-close-button">
              Cerrar
            </button>
          </div>
        </div>
      )}

      {showNotEnabledModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p>Usted debe ser habilitado por el Administrador</p>
            <button onClick={() => setShowNotEnabledModal(false)} className="modal-close-button">
              Cerrar
            </button>
          </div>
        </div>
      )}

      <div className="login-form-container">
        <div className="login-header">
          <h2>SGO-SAPEM</h2>
        </div>
        <h1>Iniciar Sesión</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="email">Dirección de Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email@ejemplo.com"
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          
          {error && <p className="error-message">{error}</p>}

          <div className="form-options">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={keepLoggedIn}
                onChange={(e) => setKeepLoggedIn(e.target.checked)}
              />
              Mantenerme conectado
            </label>
            <a href="#" onClick={handleForgotPassword} className="forgot-password-link">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button type="submit" className="login-button">Iniciar Sesión</button>
        </form>
        <div className="login-footer">
          <p>¿No tienes una cuenta? <Link to="/register">Regístrate</Link></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;