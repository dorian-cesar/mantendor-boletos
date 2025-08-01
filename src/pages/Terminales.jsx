import React, { useEffect, useState } from 'react';
import Sidebar from '@components/Sidebar/Sidebar';
import '@components/Dashboard/dashboard.css';
import { showToast } from '@components/Toast/Toast';
import Spinner from 'react-bootstrap/Spinner';

const Terminales = () => {
  const [terminales, setTerminales] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerTerminales = async () => {
      try {
        const res = await fetch('https://boletos.dev-wit.com/api/terminals/');
        if (!res.ok) throw new Error('Error al obtener terminales');
        const data = await res.json();
        setTerminales(data);
      } catch (error) {
        console.error(error);
        showToast('Error', 'No se pudieron cargar los terminales.', true);
      } finally {
        setCargando(false);
      }
    };

    obtenerTerminales();
  }, []);

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="main-content flex-grow-1 p-4">
        <h3 className="fw-semibold mb-4">Terminales</h3>

        <div className="card shadow-sm border-0">
          <div className="card-header bg-white border-bottom">
            <h5 className="mb-0">Lista de Terminales</h5>
          </div>
          <div className="card-body">
            {cargando ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Nombre</th>
                      <th>Ciudad</th>
                      <th>Región</th>
                      <th>Dirección</th>
                    </tr>
                  </thead>
                  <tbody>
                    {terminales.length ? (
                      terminales.map((t, i) => (
                        <tr key={t._id}>
                          <td>{i + 1}</td>
                          <td>{t.name || '—'}</td>
                          <td>{t.city || '—'}</td>
                          <td>{t.region || '—'}</td>
                          <td>{t.address || '—'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center text-muted">
                          No hay terminales registrados.
                        </td>
                      </tr>
                    )}
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

export default Terminales;
