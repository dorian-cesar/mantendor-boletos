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
  const [todosLosServicios, setTodosLosServicios] = useState([]);

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

        setTodosLosServicios(data);
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

  const handleBuscar = (e) => {
    const texto = e.target.value.toLowerCase();
    setBusqueda(texto);

    if (!texto) {
      setServiciosFiltrados(servicios);
      return;
    }

    const filtrados = todosLosServicios.filter((s) => {
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
          <div className="header">
            <h1 className="mb-0">Gestión de servicios</h1> 
            <p className="text-muted">Aquí puedes ver y programar nuevos servicios de bus</p>                       
          </div>
          <div className="stats-box">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">
                Servicios programados para mañana ({new Date(Date.now() + 86400000).toLocaleDateString('es-CL', { day: '2-digit', month: 'long' })})
              </h4>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setModalVisible(true)}
              >
                <i className="bi bi-calendar-plus me-2"></i> Nuevo Servicio
              </button>
            </div>

            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar servicio por origen, destino, ID, etc..."
                value={busqueda}
                onChange={handleBuscar}
              />
            </div>

            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>ID Servicio</th>
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
                      <td colSpan="9" className="text-center py-4">
                        <div className="spinner-border text-primary me-2" role="status" />
                        Cargando servicios...
                      </td>
                    </tr>
                  ) : serviciosFiltrados.length > 0 ? (
                    serviciosFiltrados.map(servicio => (
                      <tr key={servicio._id}>
                        <td><code>{servicio._id}</code></td>
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
                          1° piso: ${servicio.priceFirst ? servicio.priceFirst.toLocaleString() : '—'}<br />
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
                      <td colSpan="9" className="text-center text-muted">
                        No hay servicios programados para mañana.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <ModalBase
        visible={modalVisible}
        title={`Asientos de: ${servicioSeleccionado?.origin} → ${servicioSeleccionado?.destination}`}
        onClose={() => setModalVisible(false)}
        size="xl"
        footer={null}
      >
        {servicioSeleccionado && (() => {
          const isDoubleDecker = servicioSeleccionado.layout?.includes('double');
          const seatsByFloor = { first: [], second: [] };

          servicioSeleccionado.seats.forEach(seat => {
            const fila = parseInt(seat.number.match(/\d+/)?.[0]);
            if (isDoubleDecker) {
              if (fila <= 4) {
                seatsByFloor.first.push(seat);
              } else {
                seatsByFloor.second.push(seat);
              }
            } else {
              seatsByFloor.first.push(seat);
            }
          });

          const renderPiso = (seats, piso, descripcion) => {
          const filas = {};

          seats.forEach(seat => {
            const match = seat.number.match(/^(\d+)([A-Z])$/);
            if (!match) return;

            const [, num, letra] = match;
            if (!filas[num]) filas[num] = { left: [], right: [] };

            if (letra === 'A' || letra === 'B') {
              filas[num].left.push(seat);
            } else {
              filas[num].right.push(seat);
            }
          });

          const resumenPiso = seats.reduce((acc, seat) => {
            if (seat.paid) {
              acc.pagados++;
              acc.ocupados++;
            } else if (seat.reserved) {
              acc.reservados++;
              acc.ocupados++;
            } else {
              acc.disponibles++;
            }
            return acc;
          }, { disponibles: 0, reservados: 0, pagados: 0, ocupados: 0 });

          return (
            <div key={piso} className="mb-5">
              <h6 className="text-muted">
                Piso {piso === 'first' ? '1' : '2'} ({descripcion})
              </h6>
              <div className="d-flex flex-column gap-1 border rounded p-3 bg-light align-items-center">             
                
                {Object.keys(filas)
                  .sort((a, b) => parseInt(a) - parseInt(b))
                  .map(fila => {
                    const { left, right } = filas[fila];
                    return (
                      <div key={fila} className="d-flex gap-3 justify-content-center align-items-center">
                        <div className="d-flex gap-2">
                          {left.map(seat => {
                            const statusClass = seat.paid
                              ? 'btn-danger'
                              : seat.reserved
                              ? 'btn-warning'
                              : 'btn-success';
                            return (
                              <button
                                key={seat._id}
                                className={`btn ${statusClass} btn-sm`}
                                disabled
                                style={{ width: 48 }}
                                title={`${seat.number} - ${seat.paid ? 'Pagado' : seat.reserved ? 'Reservado' : 'Disponible'}`}
                              >
                                {seat.number}
                              </button>
                            );
                          })}
                        </div>

                        <div style={{ width: '24px' }} />

                        <div className="d-flex gap-2">
                          {right.map(seat => {
                            const statusClass = seat.paid
                              ? 'btn-danger'
                              : seat.reserved
                              ? 'btn-warning'
                              : 'btn-success';
                            return (
                              <button
                                key={seat._id}
                                className={`btn ${statusClass} btn-sm`}
                                disabled
                                style={{ width: 48 }}
                                title={`${seat.number} - ${seat.paid ? 'Pagado' : seat.reserved ? 'Reservado' : 'Disponible'}`}
                              >
                                {seat.number}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>

              <p className="mt-2 small text-muted">
                Disponibles: <strong>{resumenPiso.disponibles}</strong> &nbsp;|&nbsp;
                Reservados: <strong>{resumenPiso.reservados}</strong> &nbsp;|&nbsp;
                Pagados: <strong>{resumenPiso.pagados}</strong> &nbsp;|&nbsp;
                Total ocupados: <strong>{resumenPiso.ocupados}</strong>
              </p>
            </div>
          );
        };

          return (
            <div>
              <div className="mb-3">
                <span className="badge bg-success me-2">Disponible</span>
                <span className="badge bg-warning text-dark me-2">Reservado</span>
                <span className="badge bg-danger">Pagado</span>
              </div>
              {renderPiso(
                seatsByFloor.first,
                'first',
                servicioSeleccionado.seatDescriptionFirst || 'Piso inferior'
              )}
              {isDoubleDecker && renderPiso(
                seatsByFloor.second,
                'second',
                servicioSeleccionado.seatDescriptionSecond || 'Piso superior'
              )}
              <div className="mt-3">
                <strong>
                  {servicioSeleccionado.seats.filter(s => !s.paid && !s.reserved).length} asientos disponibles
                </strong>
              </div>
            </div>
          );
        })()}
      </ModalBase>
    </>
  );
};

export default Servicios;