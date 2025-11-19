import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '/uploads/logo.png';
import './AuthPage.css'; // Reutilizamos los estilos

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [token, setToken] = useState(null);
  const [email, setEmail] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get('token');
    const emailParam = params.get('email');

    if (!tokenParam || !emailParam) {
      setError("Enlace inválido o incompleto. Por favor, solicita un nuevo enlace de recuperación.");
    } else {
      setToken(tokenParam);
      setEmail(emailParam);
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!token || !email) {
      setError("Falta información para restablecer la contraseña. El enlace puede ser inválido.");
      return;
    }

    setError('');
    setMessage('');
    setLoading(true);

    try {
      await resetPassword(token, email, password);
      setMessage("¡Contraseña actualizada con éxito! Serás redirigido para iniciar sesión.");
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'No se pudo restablecer la contraseña. El enlace puede haber expirado.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="form-container">
        <div className="login-header">
          <img src={logo} alt="SGO Sapem Logo" className="header-logo" />
        </div>
        <h1>Restablecer Contraseña</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="reset-password">Nueva Contraseña</label>
            <input type="password" id="reset-password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <div className="input-group">
            <label htmlFor="reset-confirm-password">Confirmar Nueva Contraseña</label>
            <input type="password" id="reset-confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message}</p>}
          <button type="submit" className="login-button" disabled={loading || !token || !email}>
            {loading ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;