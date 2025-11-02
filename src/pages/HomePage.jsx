import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './HomePage.css';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/obras');
    }
  }, [user, navigate]);

  return (
    <div className="homepage">
      <Header />
      <main className="homepage-content">
        <div className="hero-section">
          <h1>Bienvenido a Sapem</h1>
          <p>El Sistema de Gestión de Obras para un control eficiente y centralizado.</p>
          <div className="cta-buttons">
            <Link to="/login" className="btn btn-primary">Iniciar Sesión</Link>
            <Link to="/register" className="btn btn-secondary">Registrarse</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;