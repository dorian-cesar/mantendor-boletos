import React, { useEffect, useState } from 'react';
import Sidebar from '@components/Sidebar/Sidebar';
import '@components/Dashboard/dashboard.css';
import { Spinner } from 'react-bootstrap';
import ModalBase from '@components/ModalBase/ModalBase';
import { showToast } from '@components/Toast/Toast';

const Layout = () => {
  const [layouts, setLayouts] = useState([]);
  const [cargando, setCargando] = useState(true);   
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [layoutEditando, setLayoutEditando] = useState(null);
  const [formLayout, setFormLayout] = useState({ name: '', pisos: '', capacidad: '', tipo_Asiento_piso_1: '', tipo_Asiento_piso_2: '' });
  const [actualizando, setActualizando] = useState(false);
  const [layoutOriginal, setLayoutOriginal] = useState(null);


  const handleEditar = (layout) => {
    setLayoutEditando(layout.name);
    setFormLayout({ 
        name: layout.name, 
        rows: layout.rows,
        columns: layout.columns,
        pisos: layout.pisos, 
        capacidad: layout.capacidad, 
        tipo_Asiento_piso_1: layout.tipo_Asiento_piso_1, 
        tipo_Asiento_piso_2: layout.tipo_Asiento_piso_2});
    setModalEditarVisible(true);
  };

    const handleGuardar = async () => {
        // Si estás editando, compara el formLayout con layoutOriginal
        if (layoutEditando && layoutOriginal) {
            const sinCambios = Object.keys(formLayout).every((key) => {
            const original = layoutOriginal[key] ?? '';
            const actual = formLayout[key] ?? '';
            return String(original) === String(actual);
            });

            if (sinCambios) {
            showToast('Sin cambios', 'No se realizaron modificaciones.');
            setModalEditarVisible(false);
            return;
            }
        }

        const endpoint = layoutEditando
            ? `https://boletos.dev-wit.com/api/layouts/${layoutEditando}`
            : `https://boletos.dev-wit.com/api/layouts/`;

        const metodo = layoutEditando ? 'PUT' : 'POST';

        try {
            const res = await fetch(endpoint, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formLayout),
            });

            if (!res.ok) throw new Error('Error al guardar layout de servicio');

            const nuevo = await res.json();

            setLayouts((prev) => {
            if (layoutEditando) {
                return prev.map((t) => (t.name === layoutEditando ? nuevo : t));
            } else {
                return [...prev, nuevo];
            }
            });

            setModalEditarVisible(false);
            setLayoutEditando(null);
            setLayoutOriginal(null);
        } catch (err) {
            console.error(err);
            alert('Error al guardar layout de servicio');
        }
        };

  const handleEliminar = async (name) => {
    if (!window.confirm('¿Estás seguro de eliminar este layout de servicio?')) return;

    try {
      const res = await fetch(`https://boletos.dev-wit.com/api/layouts/${name}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Error al eliminar');
      setLayouts((prev) => prev.filter((t) => t.name !== name));
    } catch (err) {
      console.error(err);
      alert('Error al eliminar');
    }
  };

  useEffect(() => {
    const fetchLayouts = async () => {
      try {
        const res = await fetch('https://boletos.dev-wit.com/api/layouts/');
        const data = await res.json();
        setLayouts(data);
      } catch (error) {
        console.error('Error al cargar layout de servicio:', error);
      } finally {
        setCargando(false);
      }
    };

    fetchLayouts();
  }, []);
  
  return (
    <div className="dashboard-container">
      <Sidebar activeItem="layout" />
      <main className="main-content">
        <div className="header">
          <h1 className="mb-0">Layouts de Buses</h1>
          <p className="text-muted">Aquí puedes gestionar los layouts de buses</p>
        </div>

        <div className="stats-box">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">Listado</h4>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={actualizando}
                onClick={async () => {
                  setActualizando(true);
                  try {
                    const res = await fetch('https://boletos.dev-wit.com/api/layouts/');
                    if (!res.ok) throw new Error('Error al obtener layouts desde el servidor');
                    const data = await res.json();

                    setLayouts((prev) => {
                      const nuevos = [];

                      data.forEach((nuevo) => {
                        const antiguo = prev.find(t => t.name === nuevo.name);
                        const haCambiado =
                          !antiguo ||
                          antiguo.name !== nuevo.name ||
                          antiguo.rows !== nuevo.rows;
                          antiguo.columns !== nuevo.columns;
                          antiguo.pisos !== nuevo.pisos;
                          antiguo.capacidad !== nuevo.capacidad;
                          antiguo.tipo_Asiento_piso_1 !== nuevo.tipo_Asiento_piso_1;
                          antiguo.tipo_Asiento_piso_2 !== nuevo.tipo_Asiento_piso_2;

                        nuevos.push(haCambiado || !antiguo ? nuevo : antiguo);
                      });

                      // Eliminar Layouts que ya no están
                      const names = data.map(t => t.name);
                      return nuevos.filter(t => names.includes(t.name));
                    });

                    showToast('Actualizado', 'Se sincronizó la lista de layouts de servicio');
                  } catch (error) {
                    console.error(error);
                    showToast('Error', error.message || 'No se pudo actualizar la lista', true);
                  } finally {
                    setActualizando(false);
                  }
                }}
              >
                {actualizando ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <>
                    <i className="bi bi-arrow-repeat me-1"></i> Actualizar
                  </>
                )}
              </button>

              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setLayoutEditando(null);
                  setFormLayout({ name: '', description: '' });
                  setModalEditarVisible(true);
                }}
              >
                <i className="bi bi-plus-lg me-2"></i> Nuevo Layout
              </button>
            </div>
          </div>

          {cargando ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Cargando layouts de servicio...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>                    
                    <th>Nombre</th>
                    <th>Filas</th>
                    <th>Columnas</th>
                    <th>Pisos</th>
                    <th>Capacidad</th>
                    <th>Tipo asiento 1</th>
                    <th>Tipo asiento 2</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {layouts.map((layout) => (
                    <tr key={layout.name}>                      
                      <td>{layout.name}</td>
                      <td>{layout.rows}</td>
                      <td>{layout.columns}</td>
                      <td>{layout.pisos}</td>
                      <td>{layout.capacidad}</td>
                      <td>{layout.tipo_Asiento_piso_1}</td>
                      <td>{layout.tipo_Asiento_piso_2}</td>
                      <td>
                        <button className="btn btn-sm btn-warning me-2" onClick={() => handleEditar(layout)}>
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleEliminar(layout.name)}>
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
        title={layoutEditando ? 'Editar Layout' : 'Nuevo Layout'}
        onClose={() => {
          setModalEditarVisible(false);
          setLayoutEditando(null);
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
            value={formLayout.name}
            onChange={(e) => setFormLayout((prev) => ({ ...prev, name: e.target.value }))}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Pisos</label>
          <input
            className="form-control"
            type="number"
            value={formLayout.pisos}
            onChange={(e) => setFormLayout((prev) => ({ ...prev, pisos: e.target.value }))}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Capacidad</label>
          <input
            className="form-control"
            type="number"
            value={formLayout.capacidad}
            onChange={(e) => setFormLayout((prev) => ({ ...prev, capacidad: e.target.value }))}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Tipo Asiento Piso 1</label>
          <input
            className="form-control"
            value={formLayout.tipo_Asiento_piso_1}
            onChange={(e) => setFormLayout((prev) => ({ ...prev, tipo_Asiento_piso_1: e.target.value }))}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Tipo Asiento Piso 2</label>
          <input
            className="form-control"
            value={formLayout.tipo_Asiento_piso_2}
            onChange={(e) => setFormLayout((prev) => ({ ...prev, tipo_Asiento_piso_2: e.target.value }))}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Filas</label>
          <input
            className="form-control"
            type="number"
            value={formLayout.rows}
            onChange={(e) => setFormLayout((prev) => ({ ...prev, rows: e.target.value }))}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Columnas</label>
          <input
            className="form-control"
            type="number"
            value={formLayout.columns}
            onChange={(e) => setFormLayout((prev) => ({ ...prev, columns: e.target.value }))}
          />
        </div>
      </ModalBase>
    </div>
  );     
};

export default Layout;