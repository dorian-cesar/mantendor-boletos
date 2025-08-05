import React, { useEffect, useState } from 'react';
import Sidebar from '@components/Sidebar/Sidebar';
import '@components/Dashboard/dashboard.css';
import { Spinner } from 'react-bootstrap';
import ModalBase from '@components/ModalBase/ModalBase';

const Rutas = () => {
  const [rutas, setRutas] = useState([]);
  const [cargando, setCargando] = useState(true);   
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [rutaEditando, setRutaEditando] = useState(null);
  const [formRuta, setFormRuta] = useState({ name: '', origin: '', destination: '', stops: [] });
  const [ciudades, setCiudades] = useState([]);

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
  
  return (
    <div className="dashboard-container">
      <Sidebar activeItem="rutas" />
      <main className="main-content">
        <div className="header">
          <h1 className="mb-0">Rutas de Servicio</h1>
          <p className="text-muted">Aquí puedes visualizar las distintas rutas de servicio disponibles</p>
        </div>

        <div className="stats-box">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">Listado</h4>
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
                    <tr key={ruta._id}>                      
                      <td>{ruta.name}</td>
                      <td>{ruta.origin}</td>
                      <td>{ruta.destination}</td>
                      <td>
                        <button className="btn btn-sm btn-warning me-2" onClick={() => handleEditar(ruta)}>
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleEliminar(ruta._id)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE EDICIÓN */}
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
        <div className="mb-3">
          <label className="form-label">Nombre</label>
          <input
            className="form-control"
            value={formRuta.name}
            onChange={(e) => setFormRuta((prev) => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Origen</label>
          <input
            className="form-control"
            value={formRuta.origin}
            onChange={(e) => setFormRuta((prev) => ({ ...prev, origin: e.target.value }))}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Destino</label>
          <input
            className="form-control"
            value={formRuta.destination}
            onChange={(e) => setFormRuta((prev) => ({ ...prev, destination: e.target.value }))}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Paradas intermedias</label>
          {formRuta.stops.length === 0 && (
            <div className="text-muted small mb-2">No hay paradas intermedias definidas</div>
          )}

          {formRuta.stops.map((stop, idx) => (
            <div className="d-flex mb-2 gap-2 align-items-center" key={idx}>
              <select
                className="form-select"
                value={stop.city}
                onChange={(e) => {
                  const nuevasStops = [...formRuta.stops];
                  nuevasStops[idx].city = e.target.value;
                  setFormRuta((prev) => ({ ...prev, stops: nuevasStops }));
                }}
              >
                <option value="">Selecciona ciudad</option>
                {ciudades.map((c) => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => {
                  const nuevasStops = formRuta.stops.filter((_, i) => i !== idx);
                  const reordenadas = nuevasStops.map((s, i) => ({ ...s, order: i + 1 }));
                  setFormRuta((prev) => ({ ...prev, stops: reordenadas }));
                }}
              >
                <i className="bi bi-trash"></i>
              </button>
            </div>
          ))}

          <button
            type="button"
            className="btn btn-outline-primary btn-sm mt-2"
            onClick={() => {
              const nuevasStops = [...formRuta.stops, { city: '', order: formRuta.stops.length + 1 }];
              setFormRuta((prev) => ({ ...prev, stops: nuevasStops }));
            }}
          >
            <i className="bi bi-plus"></i> Agregar parada
          </button>
        </div>
      </ModalBase>
    </div>
  );     
};

export default Rutas;
