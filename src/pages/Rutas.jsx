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
  const [formRuta, setFormRuta] = useState({ name: '', description: '' });

  const handleEditar = (ruta) => {
    setRutaEditando(ruta._id);
    setFormRuta({ name: ruta.name, description: ruta.description });
    setModalEditarVisible(true);
  };

  const handleGuardar = async () => {
    const endpoint = rutaEditando
      ? `https://boletos.dev-wit.com/api/rutas/${rutaEditando}`
      : `https://boletos.dev-wit.com/api/rutas/`;

    const metodo = rutaEditando ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formRuta),
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
      const res = await fetch(`https://boletos.dev-wit.com/api/rutas/${id}`, {
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
        const res = await fetch('https://boletos.dev-wit.com/api/rutas/');
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
                setFormRuta({ name: '', description: '' });
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
                    <th>Descripción</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rutas.map((ruta) => (
                    <tr key={ruta._id}>                      
                      <td>{ruta.name}</td>
                      <td>{ruta.description}</td>
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
        title="Editar Ruta de Servicio"
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
          <label className="form-label">Descripción</label>
          <textarea
            className="form-control"
            value={formRuta.description}
            onChange={(e) => setFormRuta((prev) => ({ ...prev, description: e.target.value }))}
          />
        </div>
      </ModalBase>
    </div>
  );     
};

export default Rutas;
