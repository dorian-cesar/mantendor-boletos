import React, { useEffect, useState } from 'react';
import Sidebar from '@components/Sidebar/Sidebar';
import '@components/Dashboard/dashboard.css';
import { Spinner } from 'react-bootstrap';

const Ciudades = () => {
  const [ciudades, setCiudades] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchCiudades = async () => {
      try {
        const res = await fetch('https://boletos.dev-wit.com/api/cities');
        const data = await res.json();
        setCiudades(data);
      } catch (error) {
        console.error('Error al cargar ciudades:', error);
      } finally {
        setCargando(false);
      }
    };

    fetchCiudades();
  }, []);

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="ciudades" />
      <main className="main-content">
        <div className="header">
          <h1 className="mb-0">Gestión de Ciudades</h1>
          <p className="text-muted">Aquí puedes visualizar las ciudades disponibles en el sistema</p>
        </div>

        <div className="stats-box">
          <h4 className="mb-3">Ciudades registradas</h4>

          {cargando ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Cargando ciudades...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Región</th>
                    <th>País</th>
                  </tr>
                </thead>
                <tbody>
                  {ciudades.map((ciudad, i) => (
                    <tr key={ciudad._id}>
                      <td>{i + 1}</td>
                      <td>{ciudad.name}</td>
                      <td>{ciudad.region}</td>
                      <td>{ciudad.country}</td>
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

export default Ciudades;