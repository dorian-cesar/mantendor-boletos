import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { HouseDoor, People, Building, Tools, UiChecksGrid, Ticket, JournalCheck, CheckCircle } from 'react-bootstrap-icons';
import './Sidebar.css';

const Sidebar = ({ activeItem }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');  
    localStorage.removeItem('recordarSession');
    navigate('/');
  };

  return (
    <nav className="sidebar">
      <h2>Admin Boletos</h2>
      <Link to="/dashboard" className={activeItem === 'dashboard' ? 'active' : ''}>
        <HouseDoor className="me-2" /> Dashboard
      </Link>
      <Link to="/usuarios" className={activeItem === 'usuarios' ? 'active' : ''}>
        <People className="me-2" /> Usuarios
      </Link>
      {/* Resto de enlaces... */}
      <a href="#" onClick={handleLogout} className="mt-auto">
        <i className="bi bi-box-arrow-right me-2"></i> Cerrar Sesión
      </a>
    </nav>
  );
};

export default Sidebar;