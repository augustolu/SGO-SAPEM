import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom'; // Importar useLocation
import './AuthPage.css';

// --- Login Form Component ---
const LoginForm = ({ onSwitch, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password, keepLoggedIn);
      navigate('/obras');
    } catch (err) {
      setError('Credenciales incorrectas. Por favor, inténtalo de nuevo.');
    }
  };

  return (
    <div className="form-container login-form-container-inner">
      <div className="login-header">
        <h2>SGO-SAPEM</h2>
      </div>
      <h1>Iniciar Sesión</h1>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="input-group">
          <label htmlFor="login-email">Dirección de Email</label>
          <input type="email" id="login-email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email@ejemplo.com" />
        </div>
        <div className="input-group">
          <label htmlFor="login-password">Contraseña</label>
          <input type="password" id="login-password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
        </div>
        {error && <p className="error-message">{error}</p>}
        <div className="form-options">
          <label className="checkbox-container">
            <input type="checkbox" checked={keepLoggedIn} onChange={(e) => setKeepLoggedIn(e.target.checked)} />
            Mantenerme conectado
          </label>
          <a href="#" onClick={onForgotPassword} className="forgot-password-link">¿Olvidaste tu contraseña?</a>
        </div>
        <button type="submit" className="login-button">Iniciar Sesión</button>
      </form>
      <div className="login-footer">
        <p>¿No tienes una cuenta? <a href="#" onClick={onSwitch}>Regístrate</a></p>
      </div>
    </div>
  );
};

// --- Register Form Component ---
const RegisterForm = ({ onSwitch }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(username, email, password);
      alert('Registro exitoso. Ahora puedes iniciar sesión.');
      onSwitch(e); // Switch to login view on success
    } catch (err) {
      setError('No se pudo registrar. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="form-container register-form-container-inner">
      <div className="login-header">
        <h2>SGO-SAPEM</h2>
      </div>
      <h1>Crear Cuenta</h1>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="input-group">
          <label htmlFor="register-username">Nombre de Usuario</label>
          <input type="text" id="register-username" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="nombre.apellido" />
        </div>
        <div className="input-group">
          <label htmlFor="register-email">Dirección de Email</label>
          <input type="email" id="register-email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email@ejemplo.com" />
        </div>
        <div className="input-group">
          <label htmlFor="register-password">Contraseña</label>
          <input type="password" id="register-password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="login-button">Registrarse</button>
      </form>
      <div className="login-footer">
        <p>¿Ya tienes una cuenta? <a href="#" onClick={onSwitch}>Inicia Sesión</a></p>
      </div>
    </div>
  );
};

// --- Main Auth Page Component ---
const AuthPage = () => {
  const location = useLocation(); // Usar el hook useLocation
  const [isLoginView, setIsLoginView] = useState(location.pathname === '/login');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Actualizar la vista si la ruta cambia (ej. usando atrás/adelante del navegador)
    setIsLoginView(location.pathname === '/login');
  }, [location.pathname]);

  const handleSwitch = (e) => {
    e.preventDefault();
    setIsLoginView(!isLoginView);
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setShowModal(true);
  };

  return (
    <div className="auth-container">
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p>Contactarse con administrador, <strong>Maria Pia Pollio</strong></p>
            <button onClick={() => setShowModal(false)} className="modal-close-button">Cerrar</button>
          </div>
        </div>
      )}

      <div className={`auth-form-wrapper ${isLoginView ? 'show-login' : 'show-register'}`}>
        <div className="forms-inner-wrapper">
          <LoginForm onSwitch={handleSwitch} onForgotPassword={handleForgotPassword} />
          <RegisterForm onSwitch={handleSwitch} />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;