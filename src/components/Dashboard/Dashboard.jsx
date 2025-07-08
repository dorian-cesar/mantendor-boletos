
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HouseDoor, People, Building, Tools, 
  UiChecksGrid, Ticket, JournalCheck, 
  CheckCircle, PeopleFill, TicketDetailed, 
  Check2Square
} from 'react-bootstrap-icons';
import './dashboard.css';
import Sidebar from '@components/Sidebar/Sidebar';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: '--',
    areas: '--',
    attentionTypes: '--',
    assignedTickets: '--',
    pendingTickets: '--',
    inProgressTickets: '--',
    cancelledTickets: '--',
    readyTickets: '--',
    rejectedTickets: '--'
  });

  useEffect(() => {
    checkAuthAndRole();
    // Aquí podrías agregar llamadas a la API para cargar las estadísticas reales
    // fetchStats();
  }, []);

  const checkAuthAndRole = () => {
    // 1. Check sessionStorage first
    let user = null;
    const sessionUser = sessionStorage.getItem('user');
    
    if (sessionUser) {
      user = JSON.parse(sessionUser);
    } 
    // 2. If not in sessionStorage, check localStorage
    else {
      const rememberedSession = localStorage.getItem('rememberedSession');
      if (rememberedSession) {
        try {
          const sessionData = JSON.parse(rememberedSession);
          user = sessionData.user;
        } catch (e) {
          console.error("Failed to parse remembered session:", e);
        }
      }
    }

    // 3. If no user found, redirect to login
    if (!user) {
      navigate('/');
      return;
    }

    // 4. Check user role
    if (user.role !== 'admin') {
      navigate('/');
      return;
    }

    // 5. If everything is OK, continue loading the dashboard
    loadDashboard();
  };

  const loadDashboard = () => {
    console.log("Loading dashboard...");
    // Aquí puedes inicializar cualquier cosa que necesites para el dashboard
  };  

  return (
    <div className="dashboard-container">      
      <Sidebar activeItem="dashboard" />
      <main className="main-content">
        <div className="header">
          <h1>Panel General</h1>
        </div>

        <div className="stats-box mt-5">
          <h6>Estadísticas del Sistema</h6>
          <div className="stat-item">Usuarios Registrados <span>{stats.users}</span></div>
          <div className="stat-item">Áreas Configuradas <span>{stats.areas}</span></div>
          <div className="stat-item">Tipos de Atención <span>{stats.attentionTypes}</span></div>
          <div className="stat-item">Tickets asignados <span>{stats.assignedTickets}</span></div>
          <div className="stat-item">Tickets pendientes <span>{stats.pendingTickets}</span></div>
          <div className="stat-item">Tickets ejecutándose <span>{stats.inProgressTickets}</span></div>
          <div className="stat-item">Tickets cancelados <span>{stats.cancelledTickets}</span></div>
          <div className="stat-item">Tickets listos <span>{stats.readyTickets}</span></div>
          <div className="stat-item">Tickets rechazados <span>{stats.rejectedTickets}</span></div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;