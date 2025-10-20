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

const CreateObraModal = ({ onClose, onObraCreated }) => {
  const [titulo, setTitulo] = useState('');
  const [numero_gestion, setNumeroGestion] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('varios');
  const [ubicacion, setUbicacion] = useState('');
  const [contratista, setContratista] = useState('');
  const [rep_legal, setRepLegal] = useState('');
  const [monto_sapem, setMontoSapem] = useState('');
  const [monto_sub, setMontoSub] = useState('');
  const [af, setAf] = useState('');
  const [plazo_dias, setPlazoDias] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const obraData = {
        titulo,
        numero_gestion,
        descripcion,
        categoria,
        ubicacion,
        contratista,
        rep_legal,
        monto_sapem: monto_sapem ? parseFloat(monto_sapem) : null,
        monto_sub: monto_sub ? parseFloat(monto_sub) : null,
        af: af ? parseFloat(af) : null,
        plazo_dias: plazo_dias ? parseInt(plazo_dias, 10) : null,
      };
      const response = await api.post('/obras', obraData);
      onObraCreated(response.data);
      onClose();
    } catch (error) {
      console.error('Error creating obra:', error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Crear Nueva Obra</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="titulo">Título</label>
            <input type="text" id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="numero_gestion">Expediente</label>
            <input type="text" id="numero_gestion" value={numero_gestion} onChange={(e) => setNumeroGestion(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="ubicacion">Ubicación</label>
            <input type="text" id="ubicacion" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="contratista">Contratista</label>
            <input type="text" id="contratista" value={contratista} onChange={(e) => setContratista(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="rep_legal">Representante Legal</label>
            <input type="text" id="rep_legal" value={rep_legal} onChange={(e) => setRepLegal(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="monto_sapem">Monto SAPEM</label>
            <input type="number" id="monto_sapem" value={monto_sapem} onChange={(e) => setMontoSapem(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="monto_sub">Monto SUB</label>
            <input type="number" id="monto_sub" value={monto_sub} onChange={(e) => setMontoSub(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="af">Adelanto Financiero (AF)</label>
            <input type="number" id="af" value={af} onChange={(e) => setAf(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="plazo_dias">Plazo en días</label>
            <input type="number" id="plazo_dias" value={plazo_dias} onChange={(e) => setPlazoDias(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="categoria">Categoría</label>
            <select id="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} required>
              <option value="salud">Salud</option>
              <option value="educación">Educación</option>
              <option value="deporte">Deporte</option>
              <option value="secretaría general">Secretaría General</option>
              <option value="vialidad">Vialidad</option>
              <option value="obra pública">Obra Pública</option>
              <option value="varios">Varios</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="descripcion">Descripción</label>
            <textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)}></textarea>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Crear</button>
            <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          </div>
        </form>
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