import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        nombre: user.nombre || '',
        email: user.email || '',
      }));
    } else {
      // Si no hay usuario, no debería estar aquí. Redirigir a login.
      navigate('/login');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRequestCode = async () => {
    try {
      // --- LOG DE DIAGNÓSTICO ---
      console.log('[LOG] Intentando solicitar código de verificación para:', formData.email);
      console.log('[LOG] URL de la API (base):', api.defaults.baseURL);
      await api.post('/users/request-email-change', { newEmail: formData.email });
      toast.info(`Se ha enviado un código de verificación a ${formData.email}`);
      setPendingEmail(formData.email);
      setVerificationStep(true);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error de conexión. ¿El servidor backend está funcionando?';
      setError(errorMsg);
      console.error('Error requesting email change:', err);
    }
  };

  const handleUpdateProfile = async (data) => {
    try {
      const response = await api.put(`/users/${user.id}`, data);
      const updatedUser = { ...user, ...response.data.user };
      setUser(updatedUser);
      toast.success('¡Perfil actualizado con éxito!');
      navigate('/obras');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al actualizar el perfil.';
      setError(errorMsg);
      console.error('Error updating profile:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);

    const emailChanged = formData.email !== user.email;

    if (emailChanged && !verificationStep) {
      await handleRequestCode();
      setIsSubmitting(false);
    } else {
      const dataToUpdate = { nombre: formData.nombre };
      if (formData.password) {
        dataToUpdate.password = formData.password;
      }
      // Si el email no cambió, lo incluimos para la actualización normal.
      if (!emailChanged) {
        dataToUpdate.email = formData.email;
      }
      await handleUpdateProfile(dataToUpdate);
      setIsSubmitting(false);
    }
  };

  const handleVerifyAndSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const dataToUpdate = {
      nombre: formData.nombre,
      email: pendingEmail, // El nuevo email pendiente de verificación
      verificationCode: verificationCode,
    };

    if (formData.password) {
      dataToUpdate.password = formData.password;
    }

    await handleUpdateProfile(dataToUpdate);
    setIsSubmitting(false);
    if (!error) {
      setVerificationStep(false);
    }
  };

  const handleGoBack = () => {
    if (verificationStep) {
      setVerificationStep(false);
      setError('');
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="profile-page-container">
      <div className="profile-form-wrapper">
        <div className="profile-header">
            <button onClick={handleGoBack} className="back-button">
                &larr; {verificationStep ? 'Atrás' : 'Volver'}
            </button>
            <h2>Editar Perfil</h2>
        </div>
        <form onSubmit={verificationStep ? handleVerifyAndSubmit : handleSubmit} className="profile-form">
          {!verificationStep ? (
            <>
              <div className="form-group">
                <label htmlFor="nombre">Nombre de Usuario</label>
                <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Correo Electrónico</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="password">Nueva Contraseña</label>
                <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} placeholder="Dejar en blanco para no cambiar" />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar Nueva Contraseña</label>
                <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} />
              </div>
              <button type="submit" className="submit-button" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </>
          ) : (
            <>
              <p>Se ha enviado un código de verificación a <strong>{pendingEmail}</strong>. Por favor, introdúcelo a continuación para confirmar el cambio de correo electrónico.</p>
              <div className="form-group">
                <label htmlFor="verificationCode">Código de Verificación</label>
                <input type="text" id="verificationCode" name="verificationCode" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} required />
              </div>
              <button type="submit" className="submit-button" disabled={isSubmitting}>
                {isSubmitting ? 'Verificando y Guardando...' : 'Verificar y Guardar Cambios'}
              </button>
            </>
          )}
          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;