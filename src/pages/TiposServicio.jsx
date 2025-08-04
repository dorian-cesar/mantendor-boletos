import React, { useEffect, useState } from 'react';
import Sidebar from '@components/Sidebar/Sidebar';
import '@components/Dashboard/dashboard.css';
import { Spinner } from 'react-bootstrap';
import ModalBase from '@components/ModalBase/ModalBase';

const TiposServicio = () => {
  const [tipos, setTipos] = useState([]);
  const [cargando, setCargando] = useState(true);   
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [tipoEditando, setTipoEditando] = useState(null);
  const [formTipo, setFormTipo] = useState({ name: '', description: '' });

  const handleEditar = (tipo) => {
    setTipoEditando(tipo._id);
    setFormTipo({ name: tipo.name, description: tipo.description });
    setModalEditarVisible(true);
  };

  const handleGuardar = async () => {
    const endpoint = tipoEditando
      ? `https://boletos.dev-wit.com/api/tipoServicio/${tipoEditando}`
      : `https://boletos.dev-wit.com/api/tipoServicio/`;

    const metodo = tipoEditando ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formTipo),
      });

      if (!res.ok) throw new Error('Error al guardar tipo de servicio');

      const nuevo = await res.json();

      setTipos((prev) => {
        if (tipoEditando) {
          return prev.map((t) => (t._id === tipoEditando ? nuevo : t));
        } else {
          return [...prev, nuevo];
        }
      });

      setModalEditarVisible(false);
      setTipoEditando(null);
    } catch (err) {
      console.error(err);
      alert('Error al guardar tipo de servicio');
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este tipo de servicio?')) return;

    try {
      const res = await fetch(`https://boletos.dev-wit.com/api/tipoServicio/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Error al eliminar');
      setTipos((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error(err);
      alert('Error al eliminar');
    }
  };

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
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">Listado</h4>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setTipoEditando(null);
                setFormTipo({ name: '', description: '' });
                setModalEditarVisible(true);
              }}
            >
              <i className="bi bi-plus-lg me-2"></i> Nuevo Tipo
            </button>
          </div>

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
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tipos.map((tipo) => (
                    <tr key={tipo._id}>                      
                      <td>{tipo.name}</td>
                      <td>{tipo.description}</td>
                      <td>
                        <button className="btn btn-sm btn-warning me-2" onClick={() => handleEditar(tipo)}>
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleEliminar(tipo._id)}>
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
        title="Editar Tipo de Servicio"
        onClose={() => {
          setModalEditarVisible(false);
          setTipoEditando(null);
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
            value={formTipo.name}
            onChange={(e) => setFormTipo((prev) => ({ ...prev, name: e.target.value }))}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Descripción</label>
          <textarea
            className="form-control"
            value={formTipo.description}
            onChange={(e) => setFormTipo((prev) => ({ ...prev, description: e.target.value }))}
          />
        </div>
      </ModalBase>
    </div>
  );     
};

export default TiposServicio;
