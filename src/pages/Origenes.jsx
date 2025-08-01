import React, { useEffect, useState } from 'react';
import Sidebar from '@components/Sidebar/Sidebar';
import '@components/Dashboard/dashboard.css';

const Origenes = () => {
  const [rutas, setRutas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchRutas = async () => {
      try {
        const res = await fetch('https://boletos.dev-wit.com/api/routes/origins');
        const data = await res.json();
        setRutas(data);
      } catch (error) {
        console.error('Error al cargar los orígenes:', error);
      } finally {
        setCargando(false);
      }
    };

    fetchRutas();
  }, []);

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container my-4">
        <div className="card shadow-sm">
          <div className="card-header">
            <h5 className="mb-0 fw-semibold">Rutas por Origen</h5>
          </div>
          <div className="card-body">
            {cargando ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status"></div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Origen</th>
                      <th>Destinos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rutas.map((ruta, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{ruta.origen}</td>
                        <td>{ruta.destinos.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Origenes;
