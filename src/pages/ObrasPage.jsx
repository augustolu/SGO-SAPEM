import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './ObrasPage.css';

// --- User Management Modal --- //
const UserManagementModal = ({ onClose }) => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersResponse, rolesResponse] = await Promise.all([
          api.get('/users'),
          api.get('/roles')
        ]);
        setUsers(usersResponse.data);
        setRoles(rolesResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRoleChange = async (userId, newRoleName) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRoleName });
      setUsers(users.map(u => u.id === userId ? { ...u, role: { nombre: newRoleName } } : u));
      console.log(`Rol del usuario con ID: ${userId} actualizado a ${newRoleName}.`);
    } catch (error) {
      console.error(`Error al actualizar el rol del usuario ${userId}:`, error);
    }
  };

  const handleDelete = async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      setUsers(users.map(u => u.id === userId ? { ...u, role: { nombre: 'Pendiente' } } : u));
      console.log(`Usuario con ID: ${userId} movido a pendiente.`);
    } catch (error) {
      console.error(`Error al eliminar el usuario ${userId}:`, error);
    }
  };

  const selectableRoles = roles.filter(role => ['Inspector', 'Pendiente'].includes(role.nombre));

  return (
    <div className="modal-overlay">
      <div className="modal-content roles-modal">
        <h2>Administrar Usuarios</h2>
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <ul className="user-list">
            {users.map(user => (
              <li key={user.id} className="user-list-item">
                <div className="user-details">
                  <span className="user-name">{user.nombre} ({user.email})</span>
                  <span className={`user-role-tag`}>{user.role ? user.role.nombre : 'Sin rol'}</span>
                </div>
                <div className="user-actions">
                  <select 
                    value={user.role ? user.role.nombre : ''} 
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={user.role?.nombre === 'Administrador General'}
                    className="role-select"
                  >
                    {user.role?.nombre === 'Administrador General' ? (
                      <option value="Administrador General">Administrador General</option>
                    ) : (
                      selectableRoles.map(role => (
                        <option key={role.id} value={role.nombre}>{role.nombre}</option>
                      ))
                    )}
                  </select>
                  <button className="btn btn-danger" onClick={() => handleDelete(user.id)}>Eliminar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
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
              {isAdmin && <li><button onClick={() => { setMenuOpen(false); onManageRolesClick(); }}>Administrar Usuarios</button></li>}
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
const AdminDashboard = ({ obras, onCreateObraClick }) => (
  <div className="dashboard-view"><div className="dashboard-title-bar"><h2>Panel de Administrador</h2><button className="btn btn-primary" onClick={onCreateObraClick}>+ Crear Nueva Obra</button></div><div className="obras-grid">{obras && obras.length > 0 ? (obras.map(obra => <ObraCard key={obra.id} obra={obra} isAdmin={true} />)) : (<p className="no-obras-message">No hay obras para mostrar.</p>)}</div></div>
);
const InspectorDashboard = ({ obras, user }) => {
  const misObras = user && user.id && obras ? obras.filter(obra => obra.inspectorId === user.id) : [];
  return (
    <div className="dashboard-view"><div className="dashboard-title-bar"><h2>Mis Obras Asignadas</h2></div><div className="obras-grid">{misObras.length > 0 ? (misObras.map(obra => <ObraCard key={obra.id} obra={obra} isAdmin={false} />)) : (<p className="no-obras-message">No tienes obras asignadas actualmente.</p>)}</div></div>
  );
};


import ObraWizardForm from '../components/ObraWizardForm'; // ¡Importamos el nuevo WIZARD!

const CreateObraModal = ({ onClose, onObraCreated }) => {

  const handleSubmit = async (formData) => {
    try {
      const response = await api.post('/obras', formData);
      onObraCreated(response.data);
      onClose();
    } catch (error) {
      console.error('Error creating obra:', error); // Log genérico
      if (error.response) {
        // El servidor respondió con un código de estado fuera del rango 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        alert(`Error del servidor: ${error.response.data.message || 'Error desconocido'}`);
      } else if (error.request) {
        // La solicitud se hizo pero no se recibió respuesta
        console.error('Error request:', error.request);
        alert('No se pudo conectar con el servidor. Revisa tu conexión de red.');
      } else {
        // Algo sucedió al configurar la solicitud que provocó un error
        console.error('Error message:', error.message);
        alert(`Error al crear la solicitud: ${error.message}`);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-form" onClick={e => e.stopPropagation()}>
         <div className="modal-header">
            <h2>Crear Nueva Obra</h2>
            <button onClick={onClose} className="wizard-close-button" aria-label="Cerrar modal">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" stroke="#E2E8F0" />
              </svg>
            </button>
         </div>
        <div className="modal-body">
            {/* Aquí usamos el nuevo formulario wizard */}
            <ObraWizardForm onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
};



// --- Main Page Component --- //
const ObrasPage = () => {
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [isCreateObraModalOpen, setCreateObraModalOpen] = useState(false);
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

  const isAdmin = user.role === 'Administrador General';

  return (
    <div className="obras-page-container">
      <DashboardHeader user={user} isAdmin={isAdmin} onManageRolesClick={() => setUserModalOpen(true)} />
      <main className="dashboard-main-content">
        {isAdmin ? (
          <AdminDashboard obras={obras} onCreateObraClick={() => setCreateObraModalOpen(true)} />
        ) : (
          <InspectorDashboard obras={obras} user={user} />
        )}
      </main>
      {userModalOpen && <UserManagementModal onClose={() => setUserModalOpen(false)} />}
      {isCreateObraModalOpen && <CreateObraModal onClose={() => setCreateObraModalOpen(false)} onObraCreated={(newObra) => setObras([...obras, newObra])} />}
    </div>
  );
};

export default ObrasPage;