import React, { useEffect, useState } from 'react';
import Sidebar from '@components/Sidebar/Sidebar';
import '@components/Dashboard/dashboard.css';
import { Spinner } from 'react-bootstrap';
import ModalBase from '@components/ModalBase/ModalBase';
import RutaEditor from '@components/RutaEditor/RutaEditor';

const Rutas = () => {
  const [rutas, setRutas] = useState([]);
  const [cargando, setCargando] = useState(true);   
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [rutaEditando, setRutaEditando] = useState(null);
  const [formRuta, setFormRuta] = useState({ name: '', origin: '', destination: '', stops: [] });
  const [ciudades, setCiudades] = useState([]);
  const [bloquesPorRuta, setBloquesPorRuta] = useState({});
  const [rutasExpandida, setRutasExpandida] = useState(null);


  useEffect(() => {
    const fetchCiudades = async () => {
      try {
        const res = await fetch('https://boletos.dev-wit.com/api/cities'); 
        const data = await res.json();
        setCiudades(data);
      } catch (err) {
        console.error('Error al cargar ciudades:', err);
      }
    };

    fetchCiudades();
  }, []);

  const handleEditar = (ruta) => {
    setRutaEditando(ruta._id);
    setFormRuta({
      name: ruta.name,
      origin: ruta.origin,
      destination: ruta.destination,
      stops: ruta.stops || [],
    });
    setModalEditarVisible(true);
  };

  const handleGuardar = async () => {
    const stopsConOrden = formRuta.stops.map((s, i) => ({
      city: s.city,
      order: i + 1
    }));

    const dataAGuardar = {
      name: formRuta.name,
      origin: formRuta.origin,
      destination: formRuta.destination,
      stops: stopsConOrden,
    };

    const endpoint = rutaEditando
      ? `https://boletos.dev-wit.com/api/routes/${rutaEditando}`
      : `https://boletos.dev-wit.com/api/routes/`;

    const metodo = rutaEditando ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataAGuardar),
      });

      if (!res.ok) throw new Error('Error al guardar ruta de servicio');

      const nuevo = await res.json();

      setRutas((prev) => {
        if (rutaEditando) {
          return prev.map((t) => (t._id === rutaEditando ? nuevo : t));
        } else {
          return [...prev, nuevo];
        }
      });

      setModalEditarVisible(false);
      setRutaEditando(null);
    } catch (err) {
      console.error(err);
      alert('Error al guardar ruta');
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta ruta?')) return;

    try {
      const res = await fetch(`https://boletos.dev-wit.com/api/routes/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Error al eliminar');
      setRutas((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error(err);
      alert('Error al eliminar');
    }
  };

  useEffect(() => {
    const fetchRutas = async () => {
      try {
        const res = await fetch('https://boletos.dev-wit.com/api/routes/');
        const data = await res.json();
        setRutas(data);
      } catch (error) {
        console.error('Error al cargar rutas de servicio:', error);
      } finally {
        setCargando(false);
      }
    };

    fetchRutas();
  }, []);

  const fetchBloques = async (rutaId) => {
    try {
      const res = await fetch(`https://boletos.dev-wit.com/api/blocks/route/${rutaId}`);
      const data = await res.json();
      setBloquesPorRuta(prev => ({ ...prev, [rutaId]: data }));
    } catch (err) {
      console.error("Error al obtener bloques:", err);
    }
  };

  const toggleExpandirRuta = async (rutaId) => {
    if (rutasExpandida === rutaId) {
      setRutasExpandida(null);
    } else {
      if (!bloquesPorRuta[rutaId]) await fetchBloques(rutaId);
      setRutasExpandida(rutaId);
    }
  };
  
  return (
    <div className="dashboard-container">
      <Sidebar activeItem="rutas" />
      <main className="main-content">
        <div className="header">
          <h1 className="mb-0">Rutas Maestras</h1>
          <p className="text-muted">Aquí puedes visualizar y gestionar las rutas maestras, bloques y paradas</p>
        </div>

        <div className="stats-box">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">Listado de rutas</h4>            
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setRutaEditando(null);
                setFormRuta({ name: '', origin: '' , destination: ''});
                setModalEditarVisible(true);
              }}
            >
              <i className="bi bi-plus-lg me-2"></i> Nueva ruta
            </button>
          </div>
          <p className="text-muted">Haz click en cada ruta para ver detalle de bloques</p>          

          {cargando ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Cargando rutas de servicio...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>                    
                    <th>Nombre</th>
                    <th>Origen</th>
                    <th>Destino</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rutas.map((ruta) => (
                    <React.Fragment key={ruta._id}>
                      <tr
                        onClick={() => toggleExpandirRuta(ruta._id)}
                        style={{ cursor: 'pointer' }}
                        className={rutasExpandida === ruta._id ? 'table-active' : ''}
                      >
                        <td>{ruta.name}</td>
                        <td>{ruta.origin}</td>
                        <td>{ruta.destination}</td>
                        <td>
                          <button className="btn btn-sm btn-warning me-2" onClick={(e) => { e.stopPropagation(); handleEditar(ruta); }}>
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); handleEliminar(ruta._id); }}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>

                      {rutasExpandida === ruta._id && bloquesPorRuta[ruta._id] && (
                        <tr>
                          <td colSpan="4">
                            {bloquesPorRuta[ruta._id].map((bloque) => (
                              <div key={bloque._id} className="mb-3 p-2 border rounded bg-light">
                                <strong>{bloque.name}</strong>
                                <ul className="mb-0">
                                  {bloque.segments.map((segment) => (
                                    <li key={segment._id}>
                                      {segment.order}. {segment.from} → {segment.to}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <ModalBase
        visible={modalEditarVisible}
        title={rutaEditando ? "Editar Ruta de Servicio" : "Nueva Ruta de Servicio"}
        onClose={() => {
          setModalEditarVisible(false);
          setRutaEditando(null);
        }}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalEditarVisible(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleGuardar}>
              Guardar Cambios
            </button>
          </>
        }
      >
        <RutaEditor
          formRuta={formRuta}
          setFormRuta={setFormRuta}
          ciudades={ciudades}
        />
      </ModalBase>
    </div>
  );     
};

export default Rutas;
