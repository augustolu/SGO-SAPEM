import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './ObrasPage.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import notificationSound from '../assets/notification.mp3';
import logo from '/uploads/logo.png'; // Importar el logo desde la subcarpeta
import ObraWizardForm from '../components/ObraWizardForm';

// --- Icons --- //
const FilterIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
  </svg>
);

const SearchIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const CollapseIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const TrashIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  );


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

  const selectableRoles = roles.filter(role => ['Inspector', 'Supervisor', 'Pendiente'].includes(role.nombre));

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
      <div className="header-title-container">
        <img src={logo} alt="SGO-SAPEM Logo" className="header-logo" />
        <div className="header-text">
          <h1>SGO</h1>
          <span className="subtitle">
            Sapem
          </span>
        </div>
      </div>
      <div className="user-menu-container" ref={menuRef}>
        <button className="user-menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menú">
          <div className="user-info-btn">
            <span className="username">{user?.nombre || 'Usuario'}</span>
            <span className="user-role-btn">{user.role}</span>
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

// --- Obra Card --- //
const ObraCard = ({ obra }) => (
  <Link to={`/obras/${obra.id}`} className="obra-card-link">
    <div className="obra-card">
      <div className="obra-card-image-container">
        <img
          src={obra.imagen_url || '/uploads/default-obra.png'}
          alt={`Imagen de la obra ${obra.establecimiento}`}
          className="obra-card-image"
        />
      </div>
      <div className="obra-card-content">
        <h3>{obra.establecimiento}</h3>
        <div className="card-body">
          <p>Progreso:</p>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${obra.progreso || 0}%` }}></div>
            <span>{obra.progreso || 0}%</span>
          </div>
        </div>
        <div className="card-footer">
            <span className={`status-badge status-${obra.estado?.toLowerCase().replace(/\s+/g, '-')}`}>{obra.estado}</span>
        </div>
      </div>
    </div>
  </Link>
);

// --- Filter Components --- //
const FilterDropdown = ({ close, applyFilters, currentStatus, currentSortBy }) => {
    const [status, setStatus] = useState(currentStatus);
    const [sortBy, setSortBy] = useState(currentSortBy);

    const handleApply = () => {
        applyFilters({ status, sortBy });
        close();
    };

    return (
        <div className="filter-dropdown">
            <div className="filter-section">
                <h5>Estado</h5>
                <div className="options-group">
                    {['En ejecución', 'Finalizada', 'Anulada'].map(s => (
                        <button key={s} className={`filter-option-btn ${status === s ? 'active' : ''}`} onClick={() => setStatus(s === status ? null : s)}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>
            <div className="filter-section">
                <h5>Ordenar por Fecha de Creación</h5>
                <div className="options-group">
                    <button className={`filter-option-btn ${sortBy === 'createdAt_desc' ? 'active' : ''}`} onClick={() => setSortBy('createdAt_desc')}>
                        Más Nuevas
                    </button>
                    <button className={`filter-option-btn ${sortBy === 'createdAt_asc' ? 'active' : ''}`} onClick={() => setSortBy('createdAt_asc')}>
                        Más Antiguas
                    </button>
                </div>
            </div>
            <button className="apply-filters-btn" onClick={handleApply}>Aplicar Filtros</button>
        </div>
    );
};

const FilterBar = ({ filterConfig, setFilterConfig, isAdmin }) => {
    const [localSearch, setLocalSearch] = useState(filterConfig.searchTerm);
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleSearch = () => {
        setFilterConfig({ ...filterConfig, searchTerm: localSearch });
    };

    const removeStatusFilter = () => {
        setFilterConfig({ ...filterConfig, status: null });
    };
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);


    return (
        <div className="filter-bar">
            <div className="filter-controls">
                <div className="filter-dropdown-container" ref={dropdownRef}>
                    <button className="icon-btn" onClick={() => setDropdownOpen(!isDropdownOpen)}>
                        <FilterIcon />
                    </button>
                    {isDropdownOpen && (
                        <FilterDropdown
                            close={() => setDropdownOpen(false)}
                            currentStatus={filterConfig.status}
                            currentSortBy={filterConfig.sortBy}
                            applyFilters={(newFilters) => setFilterConfig({ ...filterConfig, ...newFilters })}
                        />
                    )}
                </div>
                <div className="search-container">
                    <input
                        type="text"
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Buscar por establecimiento..."
                    />
                    <button className="icon-btn search-btn" onClick={handleSearch}>
                        <SearchIcon />
                    </button>
                </div>
            </div>

            <div className="active-filters">
                {filterConfig.status && (
                    <div className="active-filter-tag">
                        <span>{filterConfig.status}</span>
                        <button onClick={removeStatusFilter}><CloseIcon /></button>
                    </div>
                )}
            </div>
        </div>
    );
};

const CircularTimeChart = ({ percentage, color, size = 40 }) => {
    const strokeWidth = 4;
    const radius = (size / 2) - (strokeWidth * 2);
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="time-chart-container">
            <span className="time-chart-label">Tiempo restante</span>
            <svg width={size} height={size} className="time-chart-svg">
                <circle
                    stroke="#303c55"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    stroke={color}
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    className="time-chart-progress"
                />
            </svg>
        </div>
    );
};

// --- Reminders Panel --- //
const RemindersPanel = ({ obras, user, onUpdateObra }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    const sortedObras = obras
      .filter(obra => {
        if (!obra.fecha_finalizacion_estimada) return false;
        const dueDate = new Date(obra.fecha_finalizacion_estimada);
        return dueDate >= today;
      })
      .sort((a, b) => new Date(a.fecha_finalizacion_estimada) - new Date(b.fecha_finalizacion_estimada))
      .slice(0, 10);
  
    const getDaysUntil = (date) => {
      const diffTime = new Date(date).getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const MAX_DAYS_FOR_CHART = 30;
  
    const getDateColor = (date) => {
        const daysUntil = getDaysUntil(date);
        if (daysUntil < 0) return '#8892b0';
        if (daysUntil <= 7) {
            const green = Math.max(0, Math.floor((daysUntil / 7) * 146));
            const blue = Math.max(0, Math.floor((daysUntil / 7) * 176));
            return `rgb(255, ${green}, ${blue})`;
        }
        return '#8892b0';
    };
  
    const handleDelete = async (obraId) => {
      if (window.confirm('¿Está seguro de que desea eliminar el vencimiento de esta obra?')) {
        try {
          onUpdateObra(obraId, { fecha_finalizacion_estimada: null });
          await api.put(`/obras/${obraId}`, { fecha_finalizacion_estimada: null });
          toast.success('Vencimiento eliminado con éxito.');
        } catch (error) {
          console.error('Error deleting due date:', error);
          toast.error('No se pudo eliminar el vencimiento.');
        }
      }
    };
  
    const isAdmin = user.role === 'Administrador General';
  
    return (
      <div className="reminders-panel">
        {sortedObras.length > 0 ? (
          <ul className="reminders-list">
            {sortedObras.map(obra => {
                const daysUntil = getDaysUntil(obra.fecha_finalizacion_estimada);
                const timePercentage = Math.max(0, Math.min(100, (daysUntil / MAX_DAYS_FOR_CHART) * 100));
                const color = getDateColor(obra.fecha_finalizacion_estimada);

                return (
                    <li key={obra.id} className="reminder-item">
                        <Link to={`/obras/${obra.id}`} className="reminder-link">
                            <div className="reminder-info">
                                <span className="reminder-title">{obra.establecimiento}</span>
                                <div className="reminder-details">
                                    <span className="reminder-date" style={{ color }}>
                                        {new Date(obra.fecha_finalizacion_estimada).toLocaleDateString('es-AR')}
                                    </span>
                                    <div className="reminder-progress">
                                        <div className="progress-bar-reminder-container">
                                            <div className="progress-bar-reminder" style={{ width: `${obra.progreso || 0}%` }}></div>
                                        </div>
                                        <span className="progress-text">{obra.progreso || 0}%</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                        <CircularTimeChart percentage={timePercentage} color={color} />
                        {isAdmin && (
                            <button onClick={() => handleDelete(obra.id)} className="delete-reminder-btn" aria-label="Eliminar vencimiento">
                            <TrashIcon />
                            </button>
                        )}
                    </li>
                )
            })}
          </ul>
        ) : (
          <p className="no-reminders">No hay próximos vencimientos.</p>
        )}
      </div>
    );
  };

  const RightPanel = ({ obras, isCollapsed, onToggleCollapse, user, onUpdateObra }) => (
    <div className={`right-column ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="right-column-content-wrapper">
        <div className="reminders-container">
          <div className="reminders-header">
            <h4>Próximos Vencimientos</h4>
            <button onClick={onToggleCollapse} className="collapse-btn" aria-label="Minimizar panel">
              <CollapseIcon />
            </button>
          </div>
          <div className="reminders-content">
            <RemindersPanel obras={obras} user={user} onUpdateObra={onUpdateObra} />
          </div>
        </div>
      </div>
      <div className="right-column-handle" onClick={onToggleCollapse}>
          <CollapseIcon />
      </div>
    </div>
  );


// --- Create Obra Modal --- //
const CreateObraModal = ({ onClose, onObraCreated }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      onClose();
    }
  };

  const handleSubmit = async (formData) => {
    try {
      const response = await api.post('/obras', formData);
      onObraCreated(response.data);
      handleClose();
    } catch (error) {
      console.error('Error creating obra:', error);
      if (error.response) {
        alert(`Error del servidor: ${error.response.data.message || 'Error desconocido'}`);
      } else if (error.request) {
        alert('No se pudo conectar con el servidor. Revisa tu conexión de red.');
      } else {
        alert(`Error al crear la solicitud: ${error.message}`);
      }
    }
  };

  return (
    <div 
      className={`modal-overlay ${isClosing ? 'closing' : ''}`} 
      onAnimationEnd={handleAnimationEnd}
    >
      <div 
        className={`modal-content-form ${isClosing ? 'closing' : ''}`} 
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <button onClick={handleClose} className="wizard-close-button" aria-label="Cerrar modal">
            <span aria-hidden="true">( x )</span>
          </button>
        </div>
        <div className="modal-body">
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
  const [isRightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const { user } = useAuth();
  const [filterConfig, setFilterConfig] = useState({
    status: null,
    sortBy: 'createdAt_desc',
    searchTerm: ''
  });

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

  const handleObraCreated = (newObra) => {
    const audio = new Audio(notificationSound);
    audio.play();
    toast.success(`Obra "${newObra.establecimiento}" creada con éxito!`);
    fetchObras();
  };

  const handleUpdateObraInState = (obraId, updatedFields) => {
    setObras(prevObras => prevObras.map(o => o.id === obraId ? { ...o, ...updatedFields } : o));
  };

  useEffect(() => {
    if (user) fetchObras();
    else setLoading(false);
  }, [user]);

  const isAdmin = user.role === 'Administrador General';
  const canCreateObra = isAdmin || user.role === 'Supervisor';

  const obrasToShow = useMemo(() => {
    let filteredObras = isAdmin ? obras : obras.filter(obra => obra.inspector_id === user.id);

    if (filterConfig.searchTerm) {
        filteredObras = filteredObras.filter(obra =>
            obra.establecimiento.toLowerCase().includes(filterConfig.searchTerm.toLowerCase())
        );
    }

    if (filterConfig.status) {
        filteredObras = filteredObras.filter(obra => obra.estado === filterConfig.status);
    }

    filteredObras.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return filterConfig.sortBy === 'createdAt_asc' ? dateA - dateB : dateB - dateA;
    });

    return filteredObras;
  }, [obras, filterConfig, isAdmin, user.id]);


  if (loading || !user) {
    return <div className="loading-screen">Cargando...</div>;
  }

  return (
    <div className="obras-page-container">
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <DashboardHeader user={user} isAdmin={isAdmin} onManageRolesClick={() => setUserModalOpen(true)} />
      <main className={`dashboard-main-content ${isRightPanelCollapsed ? 'right-panel-collapsed' : ''}`}>
        <div className="obras-main-view">
          <div className="main-controls-bar">
            <FilterBar
              filterConfig={filterConfig}
              setFilterConfig={setFilterConfig}
              isAdmin={isAdmin}
            />
            {canCreateObra && (
              <button 
                className="btn btn-primary create-obra-btn"
                onClick={() => setCreateObraModalOpen(true)}
              >
                + Crear Nueva Obra
              </button>
            )}
          </div>
          <div className="obras-content-area">
            <div className="obras-grid-container">
              <div className="obras-grid">
                {obrasToShow.length > 0 ? (
                  obrasToShow.map(obra => <ObraCard key={obra.id} obra={obra} />)
                ) : (
                  <p className="no-obras-message">No hay obras para mostrar.</p>
                )}
              </div>
            </div>
            <RightPanel 
              obras={obras} 
              isCollapsed={isRightPanelCollapsed}
              onToggleCollapse={() => setRightPanelCollapsed(!isRightPanelCollapsed)}
              user={user}
              onUpdateObra={handleUpdateObraInState}
            />
          </div>
        </div>
      </main>
      {userModalOpen && <UserManagementModal onClose={() => setUserModalOpen(false)} />}
      {isCreateObraModalOpen && <CreateObraModal onClose={() => setCreateObraModalOpen(false)} onObraCreated={handleObraCreated} />}
    </div>
  );
};

export default ObrasPage;