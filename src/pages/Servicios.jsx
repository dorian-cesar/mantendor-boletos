import React, { useEffect, useState } from 'react';
import Sidebar from '@components/Sidebar/Sidebar';
import '@components/Dashboard/dashboard.css';
import ModalBase from '@components/ModalBase/ModalBase';
import { showToast } from '@components/Toast/Toast';

const Servicios = () => {
  const [servicios, setServicios] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const serviciosPorPagina = 10;
  const [modalVisible, setModalVisible] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    fetchServicios();
  }, []);

  const fetchServicios = async () => {
    try {
      let token = sessionStorage.getItem("token");

      if (!token) {
        const recordarSession = localStorage.getItem("recordarSession");
        if (recordarSession) {
          try {
            const parsed = JSON.parse(recordarSession);
            token = parsed.token;
          } catch (e) {
            console.error("Error al parsear recordarSession:", e);
          }
        }
      }

      const res = await fetch("https://boletos.dev-wit.com/api/services/all", {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error("Error al obtener servicios. Código: " + res.status);
      }

      const data = await res.json();
      setServicios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar servicios:", error);
      setServicios([]);
    }
  };

  const serviciosFiltrados = servicios.filter(servicio =>
    [servicio.origin, servicio.destination, servicio.busTypeDescription].some(campo =>
      campo.toLowerCase().includes(filtro.toLowerCase())
    )
  );

  const serviciosAMostrar = serviciosFiltrados.slice(
    (paginaActual - 1) * serviciosPorPagina,
    paginaActual * serviciosPorPagina
  );

  const totalPaginas = Math.ceil(serviciosFiltrados.length / serviciosPorPagina);

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleVerAsientos = (servicio) => {
    setServicioSeleccionado(servicio);
    setModalVisible(true);
  };

  const renderAsientos = () => {
    if (!servicioSeleccionado) return null;
    
    const { seats, layout } = servicioSeleccionado;
    const isDoubleDecker = layout.includes('double_decker');
    
    // Agrupar asientos por piso si es bus de dos pisos
    if (isDoubleDecker) {
      const firstFloor = seats.filter(seat => seat.number.match(/^1/));
      const secondFloor = seats.filter(seat => seat.number.match(/^2/));
      
      return (
        <div className="row">
          <div className="col-md-6">
            <h5>Primer Piso (${servicioSeleccionado.priceFirst} - {servicioSeleccionado.seatDescriptionFirst})</h5>
            <div className="d-flex flex-wrap gap-2">
              {firstFloor.map(asiento => (
                <div 
                  key={asiento._id}
                  className={`p-2 border rounded ${asiento.status === 'available' ? 'bg-success text-white' : 'bg-secondary text-white'}`}
                  style={{ width: '50px', textAlign: 'center' }}
                >
                  {asiento.number}
                </div>
              ))}
            </div>
          </div>
          <div className="col-md-6">
            <h5>Segundo Piso (${servicioSeleccionado.priceSecond} - {servicioSeleccionado.seatDescriptionSecond})</h5>
            <div className="d-flex flex-wrap gap-2">
              {secondFloor.map(asiento => (
                <div 
                  key={asiento._id}
                  className={`p-2 border rounded ${asiento.status === 'available' ? 'bg-success text-white' : 'bg-secondary text-white'}`}
                  style={{ width: '50px', textAlign: 'center' }}
                >
                  {asiento.number}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    // Para buses de un solo piso
    return (
      <div>
        <h5>Asientos (${servicioSeleccionado.priceFirst})</h5>
        <div className="d-flex flex-wrap gap-2">
          {seats.map(asiento => (
            <div 
              key={asiento._id}
              className={`p-2 border rounded ${asiento.status === 'available' ? 'bg-success text-white' : 'bg-secondary text-white'}`}
              style={{ width: '50px', textAlign: 'center' }}
            >
              {asiento.number}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="dashboard-container">
        <Sidebar activeItem="servicios" />
        <main className="main-content">
          <div className="header">
            <h1>Gestión de Servicios</h1>
            <p className="text-muted">Aquí puedes ver y gestionar todos los servicios de buses en el sistema.</p>
          </div>

          <div className="stats-box">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">Lista de Servicios</h4>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setModalVisible(true)}
              >
                <i className="bi bi-plus-circle me-2"></i> Nuevo Servicio
              </button>
            </div>

            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar servicio por origen, destino o tipo de bus..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
            </div>

            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Fecha</th>
                    <th>Origen</th>
                    <th>Destino</th>
                    <th>Hora Salida</th>
                    <th>Hora Llegada</th>
                    <th>Tipo de Bus</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {serviciosAMostrar.map((servicio) => (
                    <tr key={servicio._id}>
                      <td>{formatearFecha(servicio.date)}</td>
                      <td>{servicio.origin} ({servicio.terminalOrigin})</td>
                      <td>{servicio.destination} ({servicio.terminalDestination})</td>
                      <td>{servicio.departureTime}</td>
                      <td>{servicio.arrivalTime}</td>
                      <td>{servicio.busTypeDescription}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleVerAsientos(servicio)}
                        >
                          <i className="bi bi-eye me-1"></i> Ver Asientos
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3">
              <p>Mostrando {serviciosAMostrar.length} de {serviciosFiltrados.length} servicios</p>
              <span>Página {paginaActual} de {totalPaginas}</span>
              <div>
                <button
                  className="btn btn-outline-primary btn-sm me-2"
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                >
                  Anterior
                </button>
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <ModalBase
        visible={modalVisible}
        title={`Asientos del servicio ${servicioSeleccionado ? `${servicioSeleccionado.origin} → ${servicioSeleccionado.destination}` : ''}`}
        onClose={() => {
          setModalVisible(false);
          setServicioSeleccionado(null);
        }}
        size="lg"
        footer={
          <div className="d-flex justify-content-end gap-2 px-2">
            <button 
              className="btn btn-outline-secondary" 
              onClick={() => {
                setModalVisible(false);
                setServicioSeleccionado(null);
              }}
            >
              Cerrar
            </button>
          </div>
        }
      >
        {servicioSeleccionado && (
          <div>
            <div className="mb-4">
              <h5>Información del Servicio</h5>
              <p><strong>Fecha:</strong> {formatearFecha(servicioSeleccionado.date)}</p>
              <p><strong>Salida:</strong> {servicioSeleccionado.departureTime} desde {servicioSeleccionado.terminalOrigin}</p>
              <p><strong>Llegada:</strong> {servicioSeleccionado.arrivalTime} en {servicioSeleccionado.terminalDestination}</p>
              <p><strong>Tipo de bus:</strong> {servicioSeleccionado.busTypeDescription}</p>
            </div>
            
            {renderAsientos()}
            
            <div className="mt-4">
              <div className="d-flex gap-3">
                <div className="d-flex align-items-center gap-1">
                  <div className="bg-success rounded" style={{ width: '20px', height: '20px' }}></div>
                  <span>Disponible</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <div className="bg-secondary rounded" style={{ width: '20px', height: '20px' }}></div>
                  <span>Ocupado/Reservado</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </ModalBase>
    </>
  );
};

export default Servicios;