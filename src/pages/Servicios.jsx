import React, { useEffect, useState } from 'react';
import Sidebar from '@components/Sidebar/Sidebar';
import '@components/Dashboard/dashboard.css';
import ModalBase from '@components/ModalBase/ModalBase';
import { showToast } from '@components/Toast/Toast';

const Servicios = () => {
  const [servicios, setServicios] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);

  useEffect(() => {
    const fetchServicios = async () => {
      try {
        const token =
          sessionStorage.getItem("token") ||
          JSON.parse(localStorage.getItem("recordarSession") || '{}').token;

        const res = await fetch('https://boletos.dev-wit.com/api/services/all', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error('No se pudieron obtener los servicios.');

        const data = await res.json();
        setServicios(data);
      } catch (error) {
        console.error('Error al cargar servicios:', error);
        showToast('Error', 'No se pudieron cargar los servicios.', true);
      }
    };

    fetchServicios();
  }, []);

  const abrirModal = (servicio) => {
    setServicioSeleccionado(servicio);
    setModalVisible(true);
  };

  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-CL', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <>
      <div className="dashboard-container">
        <Sidebar activeItem="servicios" />
        <main className="main-content">
          <div className="header">
            <h1>Gestión de Servicios</h1>
            <p className="text-muted">Visualiza los servicios de buses en una grilla tipo calendario.</p>
          </div>

          <div className="grid">
            {servicios.map(servicio => (
              <div
                key={servicio._id}
                className="card-tile"
                onClick={() => abrirModal(servicio)}
              >
                <h5>{servicio.origin} → {servicio.destination}</h5>
                <p><strong>Fecha:</strong> {formatearFecha(servicio.date)}</p>
                <p><strong>Salida:</strong> {servicio.departureTime} — <strong>Llegada:</strong> {servicio.arrivalTime}</p>
                <p><strong>Tipo:</strong> {servicio.busTypeDescription}</p>
                <p><strong>Precio 1er piso:</strong> ${servicio.priceFirst.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </main>
      </div>

      <ModalBase
        visible={modalVisible}
        title={`Asientos de servicio: ${servicioSeleccionado?.origin} → ${servicioSeleccionado?.destination}`}
        onClose={() => setModalVisible(false)}
        size="lg"
        footer={null}
      >
        {servicioSeleccionado && (
          <div className="row">
            {servicioSeleccionado.seats.map((asiento) => (
              <div key={asiento._id} className="col-3 mb-2">
                <div className={`p-2 border rounded text-center ${asiento.paid ? 'bg-danger text-white' : asiento.reserved ? 'bg-warning' : 'bg-light'}`}>
                  <strong>{asiento.number}</strong><br />
                  <small>{asiento.paid ? 'Pagado' : asiento.reserved ? 'Reservado' : 'Disponible'}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </ModalBase>
    </>
  );
};

export default Servicios;
