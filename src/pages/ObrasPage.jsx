import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './ObrasPage.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import notificationSound from '../assets/notification.mp3';
import logo from '/uploads/logo.png'; // Importar el logo desde la subcarpeta
import ConfirmationModal from '../components/ConfirmationModal'; // Importar ConfirmationModal
import ObraWizardForm from '../components/ObraWizardForm';

import { ObrasExcelUploader } from '../components/ObrasExcelUploader';

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

const CloseIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);


const capitalize = (s) => {
  if (typeof s !== 'string' || !s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// --- Role Selector Component ---
const RoleSelector = ({ user, roles, onRoleChange, isOpen, onToggle }) => {
  const selectorRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        if (isOpen) onToggle();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  const handleSelectRole = (roleName) => {
    onRoleChange(user.id, roleName);
    onToggle(); // Close dropdown on selection
  };

  const selectableRoles = roles.filter(role => ['Inspector', 'Supervisor', 'Pendiente'].includes(role.nombre));

  return (
    <div className="role-selector-container" ref={selectorRef}>
      <button 
        className={`user-role-tag role-${user.role?.nombre.toLowerCase().replace(/\s+/g, '-')}`}
        onClick={onToggle}
      >
        {user.role ? user.role.nombre : 'Sin rol'}
        <i className={`arrow-icon-select ${isOpen ? 'is-open' : ''}`}></i>
      </button>
      {isOpen && (
        <div className="role-options-dropdown">
          {selectableRoles.map(role => (
            <button 
              key={role.id} 
              className="role-option"
              onClick={() => handleSelectRole(role.nombre)}
            >
              {role.nombre}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- User Management Modal --- //
const UserManagementModal = ({ onClose }) => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSelector, setOpenSelector] = useState(null); // ID of the user whose selector is open

  // Efecto para controlar el scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.classList.add('modal-open');
    // Función de limpieza que se ejecuta cuando el componente se desmonta
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []); // El array vacío asegura que se ejecute solo al montar y desmontar


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

  const toggleSelector = (userId) => {
    setOpenSelector(openSelector === userId ? null : userId);
  };

  // Filter out the admin user
  const filteredUsers = users.filter(user => user.role?.nombre !== 'Administrador General');

  // Sort users to show "Pendiente" first
  filteredUsers.sort((a, b) => {
    if (a.role?.nombre === 'Pendiente' && b.role?.nombre !== 'Pendiente') {
      return -1; // a comes first
    }
    if (a.role?.nombre !== 'Pendiente' && b.role?.nombre === 'Pendiente') {
      return 1; // b comes first
    }
    return 0; // maintain original order otherwise
  });

  return (
    <div className="modal-overlay">
      <div className="modal-content roles-modal">
        <h2>Administrar Usuarios</h2>
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <ul className="user-list">
            {filteredUsers.map(user => (
              <li key={user.id} className={`user-list-item ${openSelector === user.id ? 'is-open' : ''}`}>
                <div className="user-details">
                  <span className="user-name">{user.nombre}</span>
                  <span className="user-email">{user.email}</span>
                </div>
                <div className="user-actions">
                  <RoleSelector 
                    user={user} 
                    roles={roles} 
                    onRoleChange={handleRoleChange} 
                    isOpen={openSelector === user.id}
                    onToggle={() => toggleSelector(user.id)}
                  />
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

const getPlazoStatus = (fechaFinEstimado) => {
  if (!fechaFinEstimado) {
    return { text: 'Plazo no asignado', className: 'status-plazo-no-asignado' };
  }
  const hoy = new Date();
  const fechaFin = new Date(fechaFinEstimado);
  hoy.setHours(0, 0, 0, 0);
  fechaFin.setHours(0, 0, 0, 0);

  if (fechaFin < hoy) {
    return { text: 'Plazo Vencido', className: 'status-plazo-vencido' };
  }
  return null;
};

// --- Obra Card --- //
const ObraCard = ({ obra, isAdmin, onDeleteClick, onStatusChange }) => {
  const plazoStatus = getPlazoStatus(obra.fecha_finalizacion_estimada);

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDeleteClick(obra.id);
  };

  const handleStatusChange = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onStatusChange(obra.id, e.target.value);
  };

  return (
    <Link to={`/obras/${obra.id}`} className="obra-card-link">
      <div className="obra-card">
        <div className="obra-card-image-container">
          <img
            src={obra.imagen_url || '/uploads/default-obra.png'}
            alt={`Imagen de la obra ${obra.establecimiento}`}
            className="obra-card-image"
          />
        </div>
        {isAdmin && (
          <button onClick={handleDelete} className="obra-card-delete-btn" title="Eliminar Obra">
            <TrashIcon style={{ width: '14px', height: '14px' }} />
          </button>
        )}
        <div className="obra-card-content">
          <span className="obra-gestion-number">#{obra.numero_gestion}</span>
          <h3>{obra.establecimiento}</h3>
          <div className="card-body">
            <p>Progreso:</p>
            <div className="progress-display" style={{ width: '100%' }}>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${obra.progreso || 0}%`, height: '100%', backgroundColor: '#84bef5ff' }}></div>
              </div>
              <span className="progress-text">{obra.progreso || 0}%</span>
            </div>
          </div>
          <div className="card-footer">
            {isAdmin ? (
              <select
                className={`status-badge status-select status-${obra.estado?.toLowerCase().replace(/\s+/g, '-')}`}
                value={obra.estado}
                onChange={handleStatusChange}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} // Prevent link navigation
              >
                <option value="Solicitud">Solicitud</option>
                <option value="Compulsa">Compulsa</option>
                <option value="En ejecución">En ejecución</option>
                <option value="Finalizada">Finalizada</option>
                <option value="Anulada">Anulada</option>
              </select>
            ) : (
              <span className={`status-badge status-${obra.estado?.toLowerCase().replace(/\s+/g, '-')}`}>{obra.estado}</span>
            )}
            {obra.categoria && <span className="status-badge status-categoria">{obra.categoria.toUpperCase()}</span>}
            {plazoStatus && <span className={`status-badge ${plazoStatus.className}`}>{plazoStatus.text}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
};

// --- Filter Components --- //
const FilterDropdown = ({ obras, applyFilters, currentStatus, currentSortBy, currentCategory }) => {
    const [status, setStatus] = useState(currentStatus);
    const [sortBy, setSortBy] = useState(currentSortBy);
    const [category, setCategory] = useState(currentCategory);
    const isInitialMount = useRef(true);

    const categories = useMemo(() => {
        const allCategories = obras.map(o => o.categoria).filter(Boolean);
        return [...new Set(allCategories)];
    }, [obras]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
        } else {
            applyFilters({ status, sortBy, category });
        }
    }, [status, sortBy, category]);

    return (
        <div className="filter-dropdown">
            <div className="filter-section">
                <h5>Estado</h5>
                <div className="options-group">
                    {['En ejecución', 'Finalizada', 'Anulada', 'Compulsa', 'Solicitud'].map(s => (
                        <button key={s} className={`filter-option-btn ${status === s ? 'active' : ''}`} onClick={() => setStatus(s === status ? null : s)}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>
            {categories.length > 0 && (
                <div className="filter-section">
                    <h5>Categoría</h5>
                    <div className="options-group">
                        {categories.map(c => (
                            <button key={c} className={`filter-option-btn ${category === c ? 'active' : ''}`} onClick={() => setCategory(c === category ? null : c)}>
                                {capitalize(c)}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
        </div>
    );
};

const SearchTypeDropdown = ({ searchType, setSearchType }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const handleSelect = (type) => {
        setSearchType(type);
        setIsOpen(false);
    }

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    }

    return (
        <div className="search-type-dropdown" ref={dropdownRef}>
            <button className="icon-btn" onClick={toggleDropdown}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
            {isOpen && (
                <div className="search-type-options">
                    <button 
                        className={searchType === 'establecimiento' ? 'active' : ''} 
                        onClick={() => handleSelect('establecimiento')}
                    >
                        Establecimiento
                    </button>
                    <button 
                        className={searchType === 'numero_gestion' ? 'active' : ''} 
                        onClick={() => handleSelect('numero_gestion')}
                    >
                        N° de Gestión
                    </button>
                </div>
            )}
        </div>
    );
}

const FilterBar = ({ obras, filterConfig, setFilterConfig, isAdmin }) => {
    const [localSearch, setLocalSearch] = useState(filterConfig.searchTerm);
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleSearch = () => {
        setFilterConfig({ ...filterConfig, searchTerm: localSearch });
    };

    const setSearchType = (type) => {
        setFilterConfig({ ...filterConfig, searchType: type, searchTerm: '' });
        setLocalSearch('');
    };

    const formatGestionNumber = (value) => {
        const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const maxLength = 7; // 2 + 1 + 4
        const truncated = cleaned.substring(0, maxLength);
        
        let formatted = '';
        if (truncated.length > 0) {
            formatted = truncated.substring(0, 2);
        }
        if (truncated.length > 2) {
            formatted += '-' + truncated.substring(2, 3);
        }
        if (truncated.length > 3) {
            formatted += ' - ' + truncated.substring(3, 7);
        }
        return formatted;
    };

    const handleInputChange = (e) => {
        if (filterConfig.searchType === 'numero_gestion') {
            const formattedValue = formatGestionNumber(e.target.value);
            setLocalSearch(formattedValue);
        } else {
            setLocalSearch(e.target.value);
        }
    };

    const removeStatusFilter = () => {
        setFilterConfig({ ...filterConfig, status: null });
    };

    const removeCategoryFilter = () => {
        setFilterConfig({ ...filterConfig, category: null });
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

    useEffect(() => {
        setLocalSearch(filterConfig.searchTerm);
    }, [filterConfig.searchTerm]);

    return (
        <div className="filter-bar">
            <div className="filter-controls">
                <div className="filter-dropdown-container" ref={dropdownRef}>
                    <button className="icon-btn" onClick={() => setDropdownOpen(!isDropdownOpen)}>
                        <FilterIcon />
                    </button>
                    {isDropdownOpen && (
                        <FilterDropdown
                            obras={obras}
                            currentStatus={filterConfig.status}
                            currentSortBy={filterConfig.sortBy}
                            currentCategory={filterConfig.category}
                            applyFilters={(newFilters) => setFilterConfig({ ...filterConfig, ...newFilters })}
                        />
                    )}
                </div>
                <div className="search-container">
                    <input
                        type="text"
                        value={localSearch}
                        onChange={handleInputChange}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder={filterConfig.searchType === 'establecimiento' ? "Buscar por establecimiento..." : "00-0 - 0000"}
                        maxLength={filterConfig.searchType === 'numero_gestion' ? 11 : undefined}
                    />
                    <button className="icon-btn search-btn" onClick={handleSearch}>
                        <SearchIcon />
                    </button>
                    <SearchTypeDropdown searchType={filterConfig.searchType} setSearchType={setSearchType} />
                </div>
            </div>

            <div className="active-filters">
                {filterConfig.status && (
                    <div className="active-filter-tag">
                        <span>{filterConfig.status}</span>
                        <button onClick={removeStatusFilter}><CloseIcon /></button>
                    </div>
                )}
                {filterConfig.category && (
                    <div className="active-filter-tag">
                        <span>{capitalize(filterConfig.category)}</span>
                        <button onClick={removeCategoryFilter}><CloseIcon /></button>
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
const RemindersPanel = ({ obras, user, onUpdateObra, onOpenDeleteModal }) => {
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
  
    const isAdmin = user.role === 'Administrador General';
  
    return (
      <div className="reminders-panel">
        {sortedObras.length > 0 ? (
          <ul className="reminders-list">
            {sortedObras.map(obra => {
                const daysUntil = getDaysUntil(obra.fecha_finalizacion_estimada);
                const color = getDateColor(obra.fecha_finalizacion_estimada);

                let timePercentage = 0;
                if (obra.fecha_inicio && obra.fecha_finalizacion_estimada) {
                    const startDate = new Date(obra.fecha_inicio);
                    const endDate = new Date(obra.fecha_finalizacion_estimada);
                    const todayDate = new Date();
                
                    // Set hours to 0 to compare dates only
                    startDate.setHours(0, 0, 0, 0);
                    endDate.setHours(0, 0, 0, 0);
                    todayDate.setHours(0, 0, 0, 0);
                
                    const totalDuration = (endDate.getTime() - startDate.getTime());
                    const elapsedDuration = (todayDate.getTime() - startDate.getTime());
                
                    if (totalDuration > 0) {
                        const elapsedPercentage = (elapsedDuration / totalDuration) * 100;
                        timePercentage = 100 - Math.max(0, Math.min(100, elapsedPercentage));
                    } else if (todayDate >= endDate) {
                        timePercentage = 0;
                    } else {
                        timePercentage = 100;
                    }
                }

                return (
                    <li key={obra.id} className="reminder-item">
                        <Link to={`/obras/${obra.id}`} className="reminder-link">
                            <span className="reminder-title">{obra.establecimiento}</span>
                            <div className="reminder-details">
                                <span className="reminder-date" style={{ color }}>
                                    {new Date(obra.fecha_finalizacion_estimada).toLocaleDateString('es-AR')}
                                </span>
                                <div className="reminder-progress">
                                    <div className="progress-bar-reminder-container" style={{ backgroundColor: '#3A475C' }}>
                                        <div className="progress-bar-reminder" style={{ width: `${obra.progreso || 0}%`, height: '100%', backgroundColor: '#0D99FF' }}></div>
                                    </div>
                                    <span className="progress-text">{obra.progreso || 0}%</span>
                                </div>
                            </div>
                        </Link>
                        <div className="reminder-actions">
                            <CircularTimeChart percentage={timePercentage} color={color} />
                            {isAdmin && obra.fecha_finalizacion_estimada && (
                                <button onClick={() => onOpenDeleteModal(obra.id)} className="delete-reminder-btn" aria-label="Eliminar vencimiento">
                                <TrashIcon />
                                </button>
                            )}
                        </div>
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

  const RightPanel = ({ obras, isCollapsed, onToggleCollapse, user, onUpdateObra, onOpenDeleteModal }) => (
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
            <RemindersPanel obras={obras} user={user} onUpdateObra={onUpdateObra} onOpenDeleteModal={onOpenDeleteModal} />
          </div>
        </div>
      </div>
      <div className="right-column-handle" onClick={onToggleCollapse}>
          <CollapseIcon />
      </div>
    </div>
  );


// --- Create Obra Modal --- //
const CreateObraModal = ({ onClose, onObraCreated, initialData }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Bloquear el scroll del body cuando el modal está abierto
    document.body.classList.add('modal-open');
    // Limpieza: remover la clase cuando el componente se desmonte
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []); // El array vacío asegura que se ejecute solo al montar y desmontar


  const handleClose = () => {
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      onClose();
    }
  };

  const handleSubmit = async (formData) => {
    // VALIDACIÓN: El nombre de la localidad no puede ser solo un número.
    if (formData.localidad_id && /^\d+$/.test(formData.localidad_id)) {
      alert('Error: El nombre de una nueva localidad no puede ser un número. Por favor, ingrese un nombre válido.');
      return; // Detiene el envío del formulario
    }

    try {
      let response;
      // Si tenemos un initialData con ID, es una actualización (PUT)
      if (initialData?.id) {
        const dataToUpdate = { ...formData, estado: 'En ejecución' };
        response = await api.put(`/obras/${initialData.id}`, dataToUpdate);
      } else {
        // Si no, es una creación (POST)
        response = await api.post('/obras', formData);
      }
      
      onObraCreated(response.data, initialData?.id);
      handleClose();
    } catch (error) {
      console.error('Error saving obra:', error);
      if (error.response) {
        alert(`Error del servidor: ${error.response.data.message || 'Error desconocido'}`);
      } else if (error.request) {
        alert('No se pudo conectar con el servidor. Revisa tu conexión de red.');
      } else {
        alert(`Error al guardar la obra: ${error.message}`);
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
          <ObraWizardForm onSubmit={handleSubmit} initialData={initialData} />
        </div>
      </div>
    </div>
  );
};

// --- NUEVO: Componente de Paginación --- //
const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  const handlePrev = () => {
    onPageChange(prev => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    onPageChange(prev => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="pagination-controls">
      <button 
        onClick={handlePrev} 
        disabled={currentPage === 1}
        className="pagination-btn"
      >
        Anterior
      </button>
      <span className="pagination-info">
        Página {currentPage} de {totalPages}
      </span>
      <button 
        onClick={handleNext} 
        disabled={currentPage === totalPages}
        className="pagination-btn"
      >
        Siguiente
      </button>
    </div>
  );
};




// --- Main Page Component --- //
const ObrasPage = () => {
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [isCreateObraModalOpen, setCreateObraModalOpen] = useState(false);
  const [obraToEdit, setObraToEdit] = useState(null);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false); // Estado para el modal de Excel
  const [isRightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  const [filterConfig, setFilterConfig] = useState({
    status: null,
    sortBy: 'fecha_inicio_desc',
    searchTerm: '',
    searchType: 'establecimiento',
    category: null,
  });

  const [isDeleteReminderModalOpen, setIsDeleteReminderModalOpen] = useState(false);
  const [obraToDeleteReminderId, setObraToDeleteReminderId] = useState(null);

  const [isDeleteObraModalOpen, setIsDeleteObraModalOpen] = useState(false);
  const [obraToDeleteId, setObraToDeleteId] = useState(null);

  useEffect(() => {
    const checkSize = () => {
      if (window.innerWidth < 992) {
        setRightPanelCollapsed(true);
      }
    };
    window.addEventListener('resize', checkSize);
    checkSize(); // Run on initial load
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const handleDeleteReminderClick = (obraId) => {
    setObraToDeleteReminderId(obraId);
    setIsDeleteReminderModalOpen(true);
  };

  const confirmDeleteReminder = async () => {
    if (!obraToDeleteReminderId) return;

    try {
      handleUpdateObraInState(obraToDeleteReminderId, { fecha_finalizacion_estimada: null });
      await api.put(`/obras/${obraToDeleteReminderId}`, { fecha_finalizacion_estimada: null });
      toast.success('Vencimiento eliminado con éxito.');
    } catch (error) {
      console.error('Error deleting due date:', error);
      toast.error('No se pudo eliminar el vencimiento.');
    } finally {
      setIsDeleteReminderModalOpen(false);
      setObraToDeleteReminderId(null);
    }
  };

  const handleCloseDeleteReminderModal = () => {
    setIsDeleteReminderModalOpen(false);
    setObraToDeleteReminderId(null);
  };

  const handleDeleteObraClick = (obraId) => {
    setObraToDeleteId(obraId);
    setIsDeleteObraModalOpen(true);
  };

  const handleCloseDeleteObraModal = () => {
    setIsDeleteObraModalOpen(false);
    setObraToDeleteId(null);
  };

  const confirmDeleteObra = async () => {
    if (!obraToDeleteId) return;
    try {
      await api.put(`/obras/${obraToDeleteId}`, { motivo_anulacion: "Borrado por Admin" });
      toast.success('Obra eliminada con éxito.');
      fetchObras(); // Volver a cargar las obras para que desaparezca
    } catch (error) {
      console.error('Error al eliminar la obra:', error);
      toast.error('No se pudo eliminar la obra.');
    } finally {
      handleCloseDeleteObraModal();
    }
  };

  const handleStatusChange = async (obraId, newStatus) => {
    const obra = obras.find(o => o.id === obraId);

    if (obra && newStatus === 'En ejecución' && (obra.estado === 'Solicitud' || obra.estado === 'Compulsa')) {
      setObraToEdit(obra);
      setCreateObraModalOpen(true);
      handleUpdateObraInState(obraId, { estado: newStatus }); // Optimistic update
      return; 
    }

    try {
      // Optimistically update the UI
      handleUpdateObraInState(obraId, { estado: newStatus });
      
      await api.put(`/obras/${obraId}`, { estado: newStatus });
      
      toast.success('Estado de la obra actualizado con éxito.');
      // Optionally, you can re-fetch all obras to ensure data consistency
      // fetchObras(); 
    } catch (error) {
      console.error('Error updating obra status:', error);
      toast.error('No se pudo actualizar el estado de la obra.');
      // Revert the optimistic update on error
      fetchObras();
    }
  };

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

  const handleObraCreated = (obra, originalId) => {
    const audio = new Audio(notificationSound);
    audio.play();
    const message = originalId
      ? `Obra "${obra.establecimiento}" actualizada con éxito!`
      : `Obra "${obra.establecimiento}" creada con éxito!`;
    toast.success(message);
    setObraToEdit(null); // Clear editing state
    fetchObras();
  };

  // --- AÑADE ESTA NUEVA FUNCIÓN ---
  // Esta función se pasará al uploader para refrescar la lista
  const handleExcelUploadSuccess = () => {
    toast.success("¡Obras importadas con éxito! Actualizando lista...");
    fetchObras(); // Re-utiliza tu función de carga
    setIsExcelModalOpen(false); // Cierra el modal después de la subida exitosa
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

  // Cuando cambian los filtros, volvemos a la primera página.
  useEffect(() => {
    setCurrentPage(1);
  }, [filterConfig]);

  const filteredAndSortedObras = useMemo(() => {
    let filteredObras = isAdmin ? obras : obras.filter(obra => obra.inspector_id === user.id);

    if (filterConfig.searchTerm) {
        if (filterConfig.searchType === 'establecimiento') {
            filteredObras = filteredObras.filter(obra =>
                obra.establecimiento.toLowerCase().includes(filterConfig.searchTerm.toLowerCase())
            );
        } else if (filterConfig.searchType === 'numero_gestion') {
            filteredObras = filteredObras.filter(obra => {
                if (!obra.numero_gestion) return false;
                return obra.numero_gestion.toUpperCase().includes(filterConfig.searchTerm.toUpperCase());
            });
        }
    }

    if (filterConfig.status) {
        filteredObras = filteredObras.filter(obra => obra.estado === filterConfig.status);
    }

    if (filterConfig.category) {
        filteredObras = filteredObras.filter(obra => obra.categoria === filterConfig.category);
    }

    const statusOrder = {
      'Solicitud': 1,
      'Compulsa': 2,
      'En ejecución': 3,
      'Finalizada': 4,
      'Anulada': 5,
    };

    filteredObras.sort((a, b) => {
      const orderA = statusOrder[a.estado] || 4;
      const orderB = statusOrder[b.estado] || 4;
      if (orderA !== orderB) {
        return orderA - orderB;
      }

      if (filterConfig.sortBy === 'fecha_inicio_asc' || filterConfig.sortBy === 'fecha_inicio_desc') {
        const dateA = a.fecha_inicio ? new Date(a.fecha_inicio) : null;
        const dateB = b.fecha_inicio ? new Date(b.fecha_inicio) : null;

        if (dateA && dateB) {
          return filterConfig.sortBy === 'fecha_inicio_asc' ? dateA - dateB : dateB - dateA;
        }
        if (dateA) return -1; // a has date, b doesn't, a comes first
        if (dateB) return 1;  // b has date, a doesn't, b comes first
        return 0; // both are null
      }

      // Fallback to createdAt, though UI doesn't set it anymore
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return filterConfig.sortBy === 'createdAt_asc' ? dateA - dateB : dateB - dateA;
    });

    return filteredObras;
  }, [obras, filterConfig, isAdmin, user.id]);

  const totalPages = Math.ceil(filteredAndSortedObras.length / itemsPerPage);

  const obrasToShow = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedObras.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedObras, currentPage, itemsPerPage]);
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
              obras={obras}
              filterConfig={filterConfig}
              setFilterConfig={setFilterConfig}
              isAdmin={isAdmin}
            />
            {canCreateObra && (
              <div style={{ display: 'flex', gap: '10px' }}> {/* Agrupador */}
                
                {/* 1. Tu botón existente */}
                <button 
                  className="btn btn-primary create-obra-btn"
                  onClick={() => setCreateObraModalOpen(true)}
                >
                  + Crear Nueva Obra
                </button>

                {/* 2. El nuevo componente de subida (solo para admins) */}
                {isAdmin &&
                  <button
                    className="btn btn-secondary create-obra-btn" // Usamos una clase similar para consistencia
                    onClick={() => setIsExcelModalOpen(true)}
                  >
                    Importar desde Excel
                  </button>}
              
              </div>
            )}
          </div>
          <div className="obras-content-area">
            <div className="obras-grid-container">
              <div className="obras-grid">
                {obrasToShow.length > 0 ? (
                  obrasToShow.map(obra => <ObraCard key={obra.id} obra={obra} isAdmin={isAdmin} onDeleteClick={handleDeleteObraClick} onStatusChange={handleStatusChange} />)
                ) : (
                  <p className="no-obras-message">No hay obras para mostrar.</p>
                )}
              </div>
              <PaginationControls 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
            <RightPanel 
              obras={obras} 
              isCollapsed={isRightPanelCollapsed}
              onToggleCollapse={() => setRightPanelCollapsed(!isRightPanelCollapsed)}
              user={user}
              onUpdateObra={handleUpdateObraInState}
              onOpenDeleteModal={handleDeleteReminderClick}
            />
          </div>
        </div>
      </main>
      {userModalOpen && <UserManagementModal onClose={() => setUserModalOpen(false)} />}
      {isCreateObraModalOpen && <CreateObraModal 
        initialData={obraToEdit} 
        onClose={() => { 
          setCreateObraModalOpen(false); 
          setObraToEdit(null); 
          fetchObras(); // Re-fetch to revert optimistic UI changes if cancelled
        }} 
        onObraCreated={handleObraCreated} 
      />}
      
      {/* El modal de Excel ahora se controla desde aquí */}
      {isExcelModalOpen && (
        <ObrasExcelUploader 
          isOpen={isExcelModalOpen}
          onClose={() => setIsExcelModalOpen(false)}
          onUploadSuccess={handleExcelUploadSuccess}
        />
      )}
      
      <ConfirmationModal
        isOpen={isDeleteReminderModalOpen}
        onClose={handleCloseDeleteReminderModal}
        onConfirm={confirmDeleteReminder}
        title="Eliminar Vencimiento"
        message="¿Estás seguro de que quieres eliminar el vencimiento de esta obra? Esta acción no se puede deshacer."
        type="danger"
      />

      <ConfirmationModal
        isOpen={isDeleteObraModalOpen}
        onClose={handleCloseDeleteObraModal}
        onConfirm={confirmDeleteObra}
        title="Eliminar Obra"
        message="¿Estás seguro de que quieres eliminar esta obra? La obra se ocultará para todos los usuarios pero no se borrará de la base de datos."
        type="danger"
      />
    </div>
  );
};

export default ObrasPage;