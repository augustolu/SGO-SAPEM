import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './ObrasPage.css';

// --- Roles Management Modal --- //
const RolesManagementModal = ({ onClose }) => {
  const [users, setUsers] = useState([
    { id: 1, nombre: 'augusto', email: 'augustoluceropollio@gmail.com', role: 'Administrador General' },
    { id: 2, nombre: 'juan.perez', email: 'juan.perez@example.com', role: 'Inspector' },
    { id: 3, nombre: 'maria.gomez', email: 'maria.gomez@example.com', role: 'Pendiente' },
    { id: 4, nombre: 'carlos.sanchez', email: 'carlos.sanchez@example.com', role: 'Inspector' },
  ]);

  const handleApprove = (userId) => {
    console.log(`FRONTEND: Aprobando usuario con ID: ${userId}. (Llamada a API iría aquí)`);
    setUsers(users.map(u => u.id === userId ? { ...u, role: 'Inspector' } : u));
  };

  const handlePromote = (userId) => {
    console.log(`FRONTEND: Promoviendo a Admin al usuario con ID: ${userId}. (Llamada a API iría aquí)`);
    setUsers(users.map(u => u.id === userId ? { ...u, role: 'Administrador General' } : u));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content roles-modal">
        <h2>Administrar Roles y Usuarios</h2>
        <ul className="user-list">
          {users.map(user => (
            <li key={user.id} className="user-list-item">
              <div className="user-details">
                <span className="user-name">{user.nombre} ({user.email})</span>
                <span className={`user-role-tag role-${user.role.toLowerCase().replace(/\s+/g, '-')}`}>{user.role}</span>
              </div>
              <div className="user-actions">
                {user.role === 'Pendiente' && <button className="btn btn-success" onClick={() => handleApprove(user.id)}>Aprobar</button>}
                {user.role === 'Inspector' && <button className="btn btn-promote" onClick={() => handlePromote(user.id)}>Promover a Admin</button>}
              </div>
            </li>
          ))}
        </ul>
        <button className="modal-close-button" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
};


// --- Header --- //
const DashboardHeader = ({ user, isAdmin, onManageRolesClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuRef]);

  return (
    <header className="dashboard-header">
      <h1>SGO-SAPEM</h1>
      <div className="user-menu-container" ref={menuRef}>
        <button className="user-menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menú">
          <div className="user-info-btn">
            <span className="username">{user?.nombre || 'Usuario'}</span>
            <span className="user-role-btn">{isAdmin ? 'Administrador General' : 'Inspector'}</span>
          </div>
          <i className={`arrow-icon ${menuOpen ? 'is-open' : ''}`}></i>
        </button>
        {menuOpen && (
          <div className="dropdown-menu">
            <ul>
              <li><button>Editar Perfil</button></li>
              {isAdmin && <li><button onClick={() => { setMenuOpen(false); onManageRolesClick(); }}>Administrar Roles</button></li>}
              <li><button onClick={handleLogout}>Cerrar Sesión</button></li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
};

// --- Other Components (ObraCard, AdminDashboard, InspectorDashboard) --- //
// (Sin cambios, se mantienen igual que antes)
const ObraCard = ({ obra, isAdmin }) => (
  <div className="obra-card">
    <div className="card-header">
      <h3>{obra.titulo}</h3>
      <span className={`status-badge status-${obra.estado?.toLowerCase().replace(/\s+/g, '-')}`}>{obra.estado}</span>
    </div>
    <div className="card-body"><p>Progreso:</p><div className="progress-bar-container"><div className="progress-bar" style={{ width: `${obra.progreso || 0}%` }}></div><span>{obra.progreso || 0}%</span></div></div>
    <div className="card-footer">
      <Link to={`/obras/${obra.id}`} className="btn btn-details">Ver Detalles</Link>
      {isAdmin && <button className="btn btn-assign">Asignar</button>}
    </div>
  </div>
);
const AdminDashboard = ({ obras }) => (
  <div className="dashboard-view"><div className="dashboard-title-bar"><h2>Panel de Administrador</h2><button className="btn btn-primary">+ Crear Nueva Obra</button></div><div className="obras-grid">{obras && obras.length > 0 ? (obras.map(obra => <ObraCard key={obra.id} obra={obra} isAdmin={true} />)) : (<p className="no-obras-message">No hay obras para mostrar.</p>)}</div></div>
);
const InspectorDashboard = ({ obras, user }) => {
  const misObras = user && user.id && obras ? obras.filter(obra => obra.inspectorId === user.id) : [];
  return (
    <div className="dashboard-view"><div className="dashboard-title-bar"><h2>Mis Obras Asignadas</h2></div><div className="obras-grid">{misObras.length > 0 ? (misObras.map(obra => <ObraCard key={obra.id} obra={obra} isAdmin={false} />)) : (<p className="no-obras-message">No tienes obras asignadas actualmente.</p>)}</div></div>
  );
};


// --- Main Page Component --- //
const ObrasPage = () => {
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rolesModalOpen, setRolesModalOpen] = useState(false); // Estado para el nuevo modal
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      console.log('--- DEBUG: User Object ---');
      console.log(user);
    }
    const fetchObras = async () => {
      try {
        setLoading(true);
        const response = await api.get('/obras');
        setObras(response.data);
      } catch (error) {
        console.error('Error fetching obras:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchObras();
    else setLoading(false);
  }, [user]);

  if (loading || !user) {
    return <div className="loading-screen">Cargando...</div>;
  }

  const isAdmin = user.email === 'augustoluceropollio@gmail.com';

  return (
    <div className="obras-page-container">
      <DashboardHeader user={user} isAdmin={isAdmin} onManageRolesClick={() => setRolesModalOpen(true)} />
      <main className="dashboard-main-content">
        {isAdmin ? (
          <AdminDashboard obras={obras} />
        ) : (
          <InspectorDashboard obras={obras} user={user} />
        )}
      </main>
      {rolesModalOpen && <RolesManagementModal onClose={() => setRolesModalOpen(false)} />}
    </div>
  );
};

export default ObrasPage;
