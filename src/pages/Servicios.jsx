import React, { useEffect, useState } from 'react';
import Sidebar from '@components/Sidebar/Sidebar';
import '@components/Dashboard/dashboard.css';
import ModalBase from '@components/ModalBase/ModalBase';
import { showToast } from '@components/Toast/Toast';

const Servicios = () => {
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);

  useEffect(() => {
    const fetchServicios = async () => {
      try {
        setCargando(true);
        const token =
          sessionStorage.getItem("token") ||
          JSON.parse(localStorage.getItem("recordarSession") || '{}').token;

        const res = await fetch('https://boletos.dev-wit.com/api/services/all', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('No se pudieron obtener los servicios.');
        const data = await res.json();

        const mañana = new Date();
        mañana.setDate(mañana.getDate() + 1);
        const año = mañana.getFullYear();
        const mes = mañana.getMonth();
        const dia = mañana.getDate();

        const serviciosManana = data.filter(s => {
          const fecha = new Date(s.date);
          return (
            fecha.getFullYear() === año &&
            fecha.getMonth() === mes &&
            fecha.getDate() === dia
          );
        });

        serviciosManana.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
        setServicios(serviciosManana);
      } catch (error) {
        console.error('Error al cargar servicios:', error);
        showToast('Error', 'No se pudieron cargar los servicios.', true);
      } finally {
        setCargando(false);
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
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    });
  };

  return (
    <>
      <div className="dashboard-container">
        <Sidebar activeItem="servicios" />
        <main className="main-content">
          <div className="header">
            <h1>Servicios para el día siguiente</h1>
            {servicios.length > 0 && (
              <p className="text-muted">{formatearFecha(servicios[0].date)}</p>
            )}
          </div>

          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th>Origen → Destino</th>
                  <th>Terminales</th>
                  <th>Salida / Llegada</th>
                  <th>Tipo de Bus</th>
                  <th>Precios</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      <div className="spinner-border text-primary me-2" role="status" />
                      Cargando servicios...
                    </td>
                  </tr>
                ) : servicios.length > 0 ? (
                  servicios.map(servicio => (
                    <tr key={servicio._id}>
                      <td>{servicio.origin} → {servicio.destination}</td>
                      <td>{servicio.terminalOrigin} / {servicio.terminalDestination}</td>
                      <td>{servicio.departureTime} - {servicio.arrivalTime}</td>
                      <td>{servicio.busTypeDescription}</td>
                      <td>
                        1° piso: ${servicio.priceFirst ? servicio.priceFirst.toLocaleString() : '—'} <br />
                        2° piso: ${servicio.priceSecond ? servicio.priceSecond.toLocaleString() : '—'}
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary" onClick={() => abrirModal(servicio)}>
                          Ver asientos
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-muted">
                      No hay servicios programados para mañana.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      <ModalBase
        visible={modalVisible}
        title={`Asientos de: ${servicioSeleccionado?.origin} → ${servicioSeleccionado?.destination}`}
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
