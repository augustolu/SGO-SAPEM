import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import logo from '/uploads/logo.png'; // Importar el logo desde la subcarpeta
import './AuthPage.css';


// --- Login Form Component ---
const LoginForm = ({ onSwitch, onForgotPassword }) => {
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(loginIdentifier, password, keepLoggedIn);
      navigate('/obras');
    } catch (err) {
      // Mejorar el mensaje de error usando la respuesta del servidor
      const errorMessage = err.response?.data?.message || 'Credenciales incorrectas. Por favor, inténtalo de nuevo.';
      setError(errorMessage);
    }
  };

  return (
    <div className="form-container login-form-container-inner">
      <div className="login-header">
        <img src={logo} alt="SGO Sapem Logo" className="header-logo" />
        <div className="header-text">
          <h2>SGO</h2>
          <span className="subtitle">
            Sapem
          </span>
        </div>
      </div>
      <h1>Iniciar Sesión</h1>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="input-group">
          <label htmlFor="login-identifier">Email o Nombre de Usuario</label>
          <input type="text" id="login-identifier" value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} required placeholder="email@ejemplo.com o usuario" autoComplete="email" />
        </div>
        <div className="input-group">
          <label htmlFor="login-password">Contraseña</label>
          <input type="password" id="login-password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" autoComplete="current-password" />
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
  const [nombre, setNombre] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(nombre, username, email, password);
      alert('Registro exitoso. Su cuenta está pendiente de aprobación por un administrador.');
      onSwitch(e); // Switch to login view on success
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'No se pudo registrar. Inténtalo de nuevo.';
      setError(errorMessage);
    }
  };

  return (
    <div className="form-container register-form-container-inner">
      <div className="login-header">
        <img src={logo} alt="SGO Sapem Logo" className="header-logo" />
        <div className="header-text">
          <h2>SGO</h2>
          <span className="subtitle">
            Sapem
          </span>
        </div>
      </div>
      <h1>Crear Cuenta</h1>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="input-group">
          <label htmlFor="register-nombre">Nombre Completo</label>
          <input type="text" id="register-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="Juan Perez" autoComplete="name" />
        </div>
        <div className="input-group">
          <label htmlFor="register-username">Nombre de Usuario</label>
          <input type="text" id="register-username" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="jperez" autoComplete="username" />
        </div>
        <div className="input-group">
          <label htmlFor="register-email">Dirección de Email</label>
          <input type="email" id="register-email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email@ejemplo.com" autoComplete="email" />
        </div>
        <div className="input-group">
          <label htmlFor="register-password">Contraseña</label>
          <input type="password" id="register-password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" autoComplete="new-password" />
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

// --- Forgot Password Form Component ---
const ForgotPasswordForm = ({ onSwitch }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [code, setCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const { requestPasswordReset, verifyPasswordResetCode } = useAuth();
  const navigate = useNavigate();

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const response = await requestPasswordReset(email);
      setMessage(response.message);
      setShowCodeInput(true); // Mostrar campo para el código
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al enviar el correo. Inténtalo de nuevo.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await verifyPasswordResetCode(email, code);
      // El AuthContext maneja el inicio de sesión.
      // Navegamos al perfil para que el usuario cambie su contraseña.
      navigate('/perfil');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al verificar el código.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container forgot-password-form-container-inner">
      <div className="login-header">
        <img src={logo} alt="SGO Sapem Logo" className="header-logo" />
        <div className="header-text">
          <h2>SGO</h2>
          <span className="subtitle">Sapem</span>
        </div>
      </div>
      <h1>Recuperar Contraseña</h1>
      <p className="form-description">Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>
      <form onSubmit={showCodeInput ? handleVerifyCode : handleRequestCode} className="login-form">
        {!showCodeInput ? (
          <div className="input-group">
            <label htmlFor="forgot-email">Dirección de Email</label>
            <input type="email" id="forgot-email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email@ejemplo.com" autoComplete="email" />
          </div>
        ) : (
          <div className="input-group">
            <label htmlFor="reset-code">Código de Verificación</label>
            <input type="text" id="reset-code" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="123456" autoComplete="one-time-code" />
          </div>
        )}

        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        <button type="submit" className="login-button" disabled={loading}>
          {loading 
            ? (showCodeInput ? 'Verificando...' : 'Enviando...') 
            : (showCodeInput ? 'Verificar y Continuar' : 'Enviar Código')}
        </button>
      </form>
      <div className="login-footer">
        <p>¿Recordaste tu contraseña? <a href="#" onClick={onSwitch}>Inicia Sesión</a></p>
      </div>
    </div>
  );
};

// --- Main Auth Page Component ---
const AuthPage = () => {
  const location = useLocation(); // Usar el hook useLocation
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('login'); // 'login', 'register', 'forgot'

  useEffect(() => {
    // Actualizar la vista si la ruta cambia (ej. usando atrás/adelante del navegador)
    if (location.pathname === '/register') {
      setCurrentView('register');
    } else if (location.pathname === '/forgot-password') {
      setCurrentView('forgot');
    } else {
      setCurrentView('login');
    }
  }, [location.pathname]);

  const handleSwitchToRegister = (e) => {
    e.preventDefault();
    navigate('/register');
  };

  const handleSwitchToLogin = (e) => {
    e.preventDefault();
    navigate('/login', { replace: true });
  };

  const handleSwitchToForgot = (e) => {
    e.preventDefault();
    navigate('/forgot-password');
  };

  return (
    <div className="auth-container">
      <div className={`auth-form-wrapper show-${currentView}`}>
        <div className="forms-inner-wrapper">
          <LoginForm onSwitch={handleSwitchToRegister} onForgotPassword={handleSwitchToForgot} />
          <RegisterForm onSwitch={handleSwitchToLogin} />
          <ForgotPasswordForm onSwitch={handleSwitchToLogin} />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;