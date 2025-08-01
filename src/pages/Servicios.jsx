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
  const [modalNuevoVisible, setModalNuevoVisible] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [todosLosServicios, setTodosLosServicios] = useState([]);
  const [nuevoServicio, setNuevoServicio] = useState({
    origin: '',
    destination: '',
    startDate: '',
    days: [],
    time: '',
    busLayout: '',
    company: '',
    busTypeDescription: '',
    seatDescriptionFirst: '',
    seatDescriptionSecond: '',
    priceFirst: '',
    priceSecond: '',
    terminalOrigin: '',
    terminalDestination: '',
    arrivalDate: '',
    arrivalTime: ''
  });
  const [rutas, setRutas] = useState([]);
  const [destinosDisponibles, setDestinosDisponibles] = useState([]);
  const [layouts, setLayouts] = useState([]);
  const layoutSeleccionado = layouts.find(l => l.name === nuevoServicio.busLayout);
  const tieneDosPisos = layoutSeleccionado?.pisos === 2;



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

  useEffect(() => {
    const fetchRutas = async () => {
      try {
        const res = await fetch('https://boletos.dev-wit.com/api/routes/origins');
        const data = await res.json();
        setRutas(data);
      } catch (error) {
        console.error('Error al obtener rutas:', error);
      }
    };
    fetchRutas();
  }, []);

  useEffect(() => {
    const fetchLayouts = async () => {
      try {
        const res = await fetch('https://boletos.dev-wit.com/api/layouts/');
        const data = await res.json();
        setLayouts(data);
      } catch (error) {
        console.error('Error al obtener layouts:', error);
      }
    };
    fetchLayouts();
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

  const handleNuevoChange = (e) => {
    const { name, value } = e.target;
    setNuevoServicio(prev => ({ ...prev, [name]: value }));
  };

  const handleDaysChange = (day) => {
    setNuevoServicio(prev => {
      const days = prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day];
      return { ...prev, days };
    });
  };

  const crearNuevoServicio = async () => {
    try {
      const token =
        sessionStorage.getItem("token") ||
        JSON.parse(localStorage.getItem("recordarSession") || '{}').token;
      
      const payload = {
        ...nuevoServicio,
        priceFirst: nuevoServicio.priceFirst ? Number(nuevoServicio.priceFirst) : null,
        priceSecond: nuevoServicio.priceSecond ? Number(nuevoServicio.priceSecond) : null
      };

      const res = await fetch('https://boletos.dev-wit.com/api/templates/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Error al crear servicio');

      showToast('Éxito', 'Servicio creado correctamente.');
      setModalNuevoVisible(false);
    } catch (error) {
      console.error(error);
      showToast('Error', 'No se pudo crear el servicio.', true);
    }
  };

  const tiposDeBus = [
    {
      tipo: "Salón-Ejecutivo",
      descripcionPiso1: "Asientos ejecutivo",
      descripcionPiso2: "Ejecutivo estándar"
    },
    {
      tipo: "Semi-cama",
      descripcionPiso1: "Semi-cama normal",
      descripcionPiso2: "Semi-cama reclinable"
    },
    {
      tipo: "Cama",
      descripcionPiso1: "Cama total",
      descripcionPiso2: "Cama reclinable"
    },
    {
      tipo: "Premium",
      descripcionPiso1: "Butaca Premium",
      descripcionPiso2: "Butaca Premium Relax"
    }
  ];

  const terminales = [
    "Terminal Alameda",
    "Terminal Sur Santiago",
    "Terminal Rodoviario Antofagasta",
    "Terminal de Buses Temuco",
    "Terminal de Buses Valparaíso",
    "Terminal de Buses Concepción",
    "Terminal de Buses Osorno",
    "Terminal de Buses Iquique",
    "Terminal de Buses Chillán",
    "Terminal de Buses Puerto Montt"
  ];

  const companias = [
    "BusesExpress",
    "TurBus",
    "Pullman Bus",
    "Condor Bus",
    "JetSur",
    "Buses Romani",
    "Buses BioBio",
    "Andesmar Chile",
    "Via Costa",
    "Expreso Norte"
  ];


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
                onClick={() => setModalNuevoVisible(true)}
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
        visible={modalNuevoVisible}
        title="Nuevo Servicio"
        onClose={() => setModalNuevoVisible(false)}
        footer={
          <button className="btn btn-primary" onClick={crearNuevoServicio}>
            Guardar
          </button>
        }
      >
        <div className="row g-2">
          <div className="col-md-6">
            <label className="form-label">Origen</label>
            <select
              name="origin"
              className="form-control"
              onChange={(e) => {
                handleNuevoChange(e);
                const origenSeleccionado = rutas.find(r => r.origen === e.target.value);
                setDestinosDisponibles(origenSeleccionado?.destinos || []);
              }}
            >
              <option value="">Seleccione Origen</option>
              {rutas.map((r, i) => (
                <option key={i} value={r.origen}>{r.origen}</option>
              ))}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label">Destino</label>
            <select
              name="destination"
              className="form-control"
              onChange={handleNuevoChange}
              disabled={!destinosDisponibles.length}
            >
              <option value="">Seleccione Destino</option>
              {destinosDisponibles.map((dest, i) => (
                <option key={i} value={dest}>{dest}</option>
              ))}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label">Fecha de Salida</label>
            <input type="date" name="startDate" className="form-control" onChange={handleNuevoChange} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Hora de Salida</label>
            <input type="time" name="time" className="form-control" onChange={handleNuevoChange} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Fecha Llegada</label>
            <input type="date" name="arrivalDate" className="form-control" onChange={handleNuevoChange} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Hora Llegada</label>
            <input type="time" name="arrivalTime" className="form-control" onChange={handleNuevoChange} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Días vigente</label>
            <div className="d-flex flex-wrap gap-1">
              {[1,2,3,4,5,6,7].map(d => (
                <button
                  key={d}
                  type="button"
                  className={`btn btn-sm ${nuevoServicio.days.includes(d) ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleDaysChange(d)}
                >
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'][d-1]}
                </button>
              ))}
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label">Compañía</label>
            <select
              name="company"
              className="form-control"
              onChange={handleNuevoChange}
            >
              <option value="">Seleccione Compañía</option>
              {companias.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label">Layout del Bus</label>
            <select
              name="busLayout"
              className="form-control"
              onChange={(e) => {
                handleNuevoChange(e);

                const layoutSeleccionado = layouts.find(l => l.name === e.target.value);
                if (layoutSeleccionado?.pisos !== 2) {
                  // Limpiar segundo piso si el layout no tiene 2 pisos
                  setNuevoServicio(prev => ({
                    ...prev,
                    seatDescriptionSecond: ""
                  }));
                }
              }}
            >
              <option value="">Seleccione layout</option>
              {layouts.map((layout, i) => (
                <option key={i} value={layout.name}>{layout.name}</option>
              ))}
            </select>
            {nuevoServicio.busLayout && (
              <div className="mt-2 small text-muted">
                {(() => {
                  const selected = layouts.find(l => l.name === nuevoServicio.busLayout);
                  if (!selected) return null;

                  const info = [];
                  if (selected.pisos) info.push(`Pisos: ${selected.pisos}`);
                  if (selected.capacidad) info.push(`Capacidad: ${selected.capacidad}`);
                  if (selected.tipo_Asiento_piso_1) info.push(`1° piso: ${selected.tipo_Asiento_piso_1}`);
                  if (selected.tipo_Asiento_piso_2) info.push(`2° piso: ${selected.tipo_Asiento_piso_2}`);
                  if (selected.rows && selected.columns) info.push(`Filas: ${selected.rows}, Columnas: ${selected.columns}`);

                  return info.join(' | ');
                })()}
              </div>
            )}

          </div>
          
          <div className="col-md-6">
            <label className="form-label">Tipo de Bus</label>
            <select
              name="busTypeDescription"
              className="form-control"
              onChange={(e) => {
                const tipo = e.target.value;
                const match = tiposDeBus.find(t => t.tipo === tipo);
                handleNuevoChange({ target: { name: 'busTypeDescription', value: tipo } });
                handleNuevoChange({ target: { name: 'seatDescriptionFirst', value: match?.descripcionPiso1 || '' } });
                handleNuevoChange({ target: { name: 'seatDescriptionSecond', value: match?.descripcionPiso2 || '' } });
              }}
            >
              <option value="">Seleccione tipo</option>
              {tiposDeBus.map((t, i) => (
                <option key={i} value={t.tipo}>{t.tipo}</option>
              ))}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label">Descripción 1° Piso</label>
            <select
              name="seatDescriptionFirst"
              className="form-control"
              onChange={handleNuevoChange}
              value={nuevoServicio.seatDescriptionFirst || ''}
            >
              <option value="">Seleccione descripción</option>
              {[...new Set(tiposDeBus.map(t => t.descripcionPiso1))].map((desc, i) => (
                <option key={i} value={desc}>{desc}</option>
              ))}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label">Descripción 2° Piso</label>
            <select
              name="seatDescriptionSecond"
              className="form-control"
              onChange={handleNuevoChange}
              value={nuevoServicio.seatDescriptionSecond || ''}
              disabled={!tieneDosPisos}
            >
              <option value="">{tieneDosPisos ? 'Seleccione descripción' : 'Solo 1 piso'}</option>
              {[...new Set(tiposDeBus.map(t => t.descripcionPiso2))].map((desc, i) => (
                <option key={i} value={desc}>{desc}</option>
              ))}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label">Precio 1° Piso</label>
            <input
              type="number"
              name="priceFirst"
              className="form-control"
              value={nuevoServicio.priceFirst ?? ''}
              onChange={handleNuevoChange}
              placeholder="Ej: 15000"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Precio 2° Piso</label>
            <input
              type="number"
              name="priceSecond"
              className="form-control"
              value={nuevoServicio.priceSecond ?? ''}
              onChange={handleNuevoChange}
              placeholder="Ej: 14000"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Terminal Origen</label>
            <select
              name="terminalOrigin"
              className="form-control"
              onChange={handleNuevoChange}
            >
              <option value="">Seleccione Terminal</option>
              {terminales.map((terminal, i) => (
                <option key={i} value={terminal}>{terminal}</option>
              ))}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label">Terminal Destino</label>
            <select
              name="terminalDestination"
              className="form-control"
              onChange={handleNuevoChange}
            >
              <option value="">Seleccione Terminal</option>
              {terminales.map((terminal, i) => (
                <option key={i} value={terminal}>{terminal}</option>
              ))}
            </select>
          </div>          
        </div>
      </ModalBase>      
      
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