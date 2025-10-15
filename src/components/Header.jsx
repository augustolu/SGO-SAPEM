import React from 'react';
import { NavLink } from 'react-router-dom';
import './Header.css';

function Header() {
  const getNavLinkClass = ({ isActive }) => (isActive ? 'active' : '');

  return (
    <header className="app-header">
      <h1>SGO-SAPEM - Gestión de Obras</h1>
      <nav>
        <NavLink to="/obras" className={getNavLinkClass}>Obras</NavLink>
        <NavLink to="/inspectores" className={getNavLinkClass}>Inspectores</NavLink>
        <NavLink to="/reportes" className={getNavLinkClass}>Reportes</NavLink>
      </nav>
    </header>
  );
}

export default Header;