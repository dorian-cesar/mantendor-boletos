import React, { useEffect, useState } from 'react';
import Sidebar from '@components/Sidebar/Sidebar';
import '@components/Dashboard/dashboard.css';
import { Spinner } from 'react-bootstrap';

const Buses = () => {
  const [buses, setBuses] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const res = await fetch('https://boletos.dev-wit.com/api/buses/');
        const data = await res.json();
        setBuses(data);
      } catch (error) {
        console.error('Error al cargar buses:', error);
      } finally {
        setCargando(false);
      }
    };

    fetchBuses();
  }, []);

  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-CL');
  };

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="buses" />
      <main className="main-content">
        <div className="header">
          <h1 className="mb-0">Gestión de Buses</h1>
          <p className="text-muted">Aquí puedes visualizar los buses disponibles en el sistema</p>
        </div>

        <div className="stats-box">
          <h4 className="mb-3">Buses registrados</h4>

          {cargando ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Cargando buses...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Patente</th>
                    <th>Marca</th>
                    <th>Modelo</th>
                    <th>Año</th>
                    <th>Revisión Técnica</th>
                    <th>Permiso Circulación</th>
                    <th>Disponible</th>
                  </tr>
                </thead>
                <tbody>
                  {buses.map((bus) => (
                    <tr key={bus._id}>
                      <td>{bus.patente}</td>
                      <td>{bus.marca}</td>
                      <td>{bus.modelo}</td>
                      <td>{bus.anio}</td>
                      <td>{formatearFecha(bus.revision_tecnica)}</td>
                      <td>{formatearFecha(bus.permiso_circulacion)}</td>
                      <td>
                        {bus.disponible ? (
                          <span className="badge bg-success">Sí</span>
                        ) : (
                          <span className="badge bg-danger">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Buses;
