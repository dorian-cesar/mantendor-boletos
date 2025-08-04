import React, { useEffect, useState } from 'react';
import Sidebar from '@components/Sidebar/Sidebar';
import '@components/Dashboard/dashboard.css';
import { Spinner } from 'react-bootstrap';

const TiposServicio = () => {
  const [tipos, setTipos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchTipos = async () => {
      try {
        const res = await fetch('https://boletos.dev-wit.com/api/tipoServicio/');
        const data = await res.json();
        setTipos(data);
      } catch (error) {
        console.error('Error al cargar tipos de servicio:', error);
      } finally {
        setCargando(false);
      }
    };

    fetchTipos();
  }, []);

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="tipos-servicio" />
      <main className="main-content">
        <div className="header">
          <h1 className="mb-0">Tipos de Servicio</h1>
          <p className="text-muted">Aquí puedes visualizar los distintos tipos de servicio disponibles</p>
        </div>

        <div className="stats-box">
          <h4 className="mb-3">Listado</h4>

          {cargando ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Cargando tipos de servicio...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {tipos.map((tipo) => (
                    <tr key={tipo._id}>
                      <td>{tipo._id}</td>
                      <td>{tipo.name}</td>
                      <td>{tipo.description}</td>
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

export default TiposServicio;
