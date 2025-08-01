import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Route } from "lucide-react";
import { BusFront } from 'lucide-react';
import { Building } from 'lucide-react';
import { Landmark } from 'lucide-react';
import { HouseDoor, People, CalendarCheck } from 'react-bootstrap-icons';
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
      <Link to="/servicios" className={activeItem === 'servicios' ? 'active' : ''}>
        <CalendarCheck className="me-2" /> Servicios
      </Link>
     <Link to="/ciudades" className={activeItem === 'ciudades' ? 'active' : ''}>
        <Landmark className="me-2" /> Ciudades
      </Link>
      <Link to="/terminales" className={activeItem === 'terminales' ? 'active' : ''}>
          <Building className="me-2" /> Terminales
      </Link>

      <a href="#" onClick={handleLogout} className="mt-auto">
        <i className="bi bi-box-arrow-right me-2"></i> Cerrar Sesión
      </a>
    </nav>
  );
};

export default Sidebar;