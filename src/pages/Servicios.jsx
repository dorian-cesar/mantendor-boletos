import React, { useEffect, useState } from 'react';
import Sidebar from '@components/Sidebar/Sidebar';
import '@components/Dashboard/dashboard.css';
import ModalBase from '@components/ModalBase/ModalBase';
import { showToast } from '@components/Toast/Toast';

const Servicios = () => {
  const [servicios, setServicios] = useState([]);
  const [serviciosFiltrados, setServiciosFiltrados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');

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

        const formatoFecha = (fecha) => new Date(fecha).toISOString().split('T')[0];
        const fechaManana = new Date();
        fechaManana.setDate(fechaManana.getDate() + 1);
        const fechaMananaStr = formatoFecha(fechaManana);

        const serviciosManana = data
          .filter(s => formatoFecha(s.date) === fechaMananaStr)
          .sort((a, b) => a.departureTime.localeCompare(b.departureTime));

        setServicios(serviciosManana);
        setServiciosFiltrados(serviciosManana);
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

  const handleBuscar = (e) => {
    const texto = e.target.value.toLowerCase();
    setBusqueda(texto);

    const filtrados = servicios.filter((s) => {
      return Object.values(s).some((valor) =>
        String(valor).toLowerCase().includes(texto)
      );
    });

    setServiciosFiltrados(filtrados);
  };

  return (
    <>
      <div className="dashboard-container">
        <Sidebar activeItem="servicios" />
        <main className="main-content">
          <div className="header d-flex justify-content-between align-items-center">
            <div>
              <h1>Servicios para el día siguiente</h1>
              {servicios.length > 0 && (
                <p className="text-muted">{formatearFecha(servicios[0].date)}</p>
              )}
            </div>
            <div>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar servicio..."
                value={busqueda}
                onChange={handleBuscar}
              />
            </div>
          </div>

          <div className="table-responsive mt-3">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  {/* <th>ID Servicio</th> */}
                  <th>Origen → Destino</th>
                  <th>Terminales</th>
                  <th>Salida / Llegada</th>
                  <th>Fecha salida</th>
                  <th>Fecha llegada</th>
                  <th>Tipo de Bus</th>
                  <th>Precios</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      <div className="spinner-border text-primary me-2" role="status" />
                      Cargando servicios...
                    </td>
                  </tr>
                ) : serviciosFiltrados.length > 0 ? (
                  serviciosFiltrados.map(servicio => (
                    <tr key={servicio._id}>
                      {/* <td><code>{servicio._id}</code></td> */}
                      <td>{servicio.origin} → {servicio.destination}</td>
                      <td>{servicio.terminalOrigin} / {servicio.terminalDestination}</td>
                      <td>{servicio.departureTime} - {servicio.arrivalTime}</td>
                      <td>
                        {new Date(servicio.date).toLocaleDateString('es-CL', {
                          day: '2-digit',
                          month: 'short',
                          timeZone: 'UTC'
                        })}
                      </td>
                      <td>
                        {servicio.arrivalDate ? (() => {
                          const fechaSalida = new Date(servicio.date);
                          const fechaLlegada = new Date(servicio.arrivalDate);
                          const diferencia = fechaLlegada.getTime() - fechaSalida.getTime();
                          const esError = diferencia < 0;

                          return (
                            <span className={`${esError ? 'text-danger fw-bold' : fechaLlegada.toDateString() !== fechaSalida.toDateString() ? 'text-warning fw-semibold' : ''}`}>
                              {fechaLlegada.toLocaleDateString('es-CL', {
                                day: '2-digit',
                                month: 'short'
                              })}
                              {esError && <span title="La fecha de llegada es anterior a la de salida"> ❌</span>}
                              {!esError && fechaLlegada.toDateString() !== fechaSalida.toDateString() && (
                                <span title="Llega en día distinto al de salida"> ⚠️</span>
                              )}
                            </span>
                          );
                        })() : '—'}
                      </td>
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
                    <td colSpan="8" className="text-center text-muted">
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
