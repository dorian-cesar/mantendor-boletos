import React, { useEffect, useState } from 'react';
import Sidebar from '@components/Sidebar/Sidebar';
import '@components/Dashboard/dashboard.css';
import { Spinner } from 'react-bootstrap';
import { showToast } from '@components/Toast/Toast';
import ModalBase from '@components/ModalBase/ModalBase';
import Swal from 'sweetalert2';

const Buses = () => {
  const [buses, setBuses] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [formBus, setFormBus] = useState({
    patente: '',
    marca: '',
    modelo: '',
    anio: '',
    revision_tecnica: '',
    permiso_circulacion: '',
    disponible: true,
  });
  const [guardando, setGuardando] = useState(false);

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

  const handleEliminar = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar bus?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`https://boletos.dev-wit.com/api/buses/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Error al eliminar el bus');

      setBuses((prev) => prev.filter((b) => b._id !== id));

      await Swal.fire('Eliminado', 'El bus fue eliminado correctamente.', 'success');
    } catch (err) {
      console.error(err);
      await Swal.fire('Error', 'No se pudo eliminar el bus.', 'error');
    }
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
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">Buses registrados</h4>

            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={actualizando}
                onClick={async () => {
                  setActualizando(true);
                  try {
                    const res = await fetch('https://boletos.dev-wit.com/api/buses/');
                    if (!res.ok) throw new Error('Error al obtener buses desde el servidor');
                    const data = await res.json();

                    setBuses((prev) => {
                      const nuevos = [];

                      data.forEach((nuevo) => {
                        const antiguo = prev.find(b => b._id === nuevo._id);
                        const haCambiado =
                          !antiguo ||
                          antiguo.patente !== nuevo.patente ||
                          antiguo.marca !== nuevo.marca ||
                          antiguo.modelo !== nuevo.modelo ||
                          antiguo.anio !== nuevo.anio ||
                          antiguo.revision_tecnica !== nuevo.revision_tecnica ||
                          antiguo.permiso_circulacion !== nuevo.permiso_circulacion ||
                          antiguo.disponible !== nuevo.disponible;

                        nuevos.push(haCambiado || !antiguo ? nuevo : antiguo);
                      });

                      const ids = data.map(b => b._id);
                      return nuevos.filter(b => ids.includes(b._id));
                    });

                    showToast('Actualizado', 'Se sincronizó la lista de buses');
                  } catch (err) {
                    console.error(err);
                    showToast('Error al actualizar', err.message || 'No se pudo actualizar la lista de buses', true);
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
                  setFormBus({
                    patente: '',
                    marca: '',
                    modelo: '',
                    anio: '',
                    revision_tecnica: '',
                    permiso_circulacion: '',
                    disponible: true,
                  });
                  setModalVisible(true);
                }}
              >
                <i className="bi bi-plus-lg me-2"></i> Nuevo Bus
              </button>
            </div>
          </div>

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
                    <th>Acciones</th>
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
                      <td>
                        <button
                          className="btn btn-sm btn-warning me-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBusEditando(bus);
                            setFormBus({
                              patente: bus.patente,
                              marca: bus.marca,
                              modelo: bus.modelo,
                              anio: bus.anio,
                              revision_tecnica: bus.revision_tecnica.slice(0, 10),
                              permiso_circulacion: bus.permiso_circulacion.slice(0, 10),
                              disponible: bus.disponible,
                            });
                            setModalVisible(true);
                          }}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>

                        <button
                          className="btn btn-sm btn-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEliminar(bus._id);
                          }}
                        >
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
        <ModalBase
          visible={modalVisible}
          title="Registrar nuevo bus"
          onClose={() => {
            setModalVisible(false);
            setFormBus({
              patente: '',
              marca: '',
              modelo: '',
              anio: '',
              revision_tecnica: '',
              permiso_circulacion: '',
              disponible: true,
            });
          }}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setModalVisible(false)}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                disabled={guardando}
                onClick={async () => {
                  setGuardando(true);
                  try {
                    const res = await fetch('https://boletos.dev-wit.com/api/buses/', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(formBus),
                    });

                    if (!res.ok) throw new Error('Error al guardar bus');
                    const nuevoBus = await res.json();

                    setBuses((prev) => [...prev, nuevoBus]);
                    showToast('Éxito', 'Bus creado correctamente');
                    setModalVisible(false);
                  } catch (err) {
                    console.error(err);
                    showToast('Error', err.message || 'No se pudo guardar el bus', true);
                  } finally {
                    setGuardando(false);
                  }
                }}
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          }
        >
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Patente</label>
              <input
                type="text"
                className="form-control"
                value={formBus.patente}
                onChange={(e) => setFormBus({ ...formBus, patente: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Marca</label>
              <input
                type="text"
                className="form-control"
                value={formBus.marca}
                onChange={(e) => setFormBus({ ...formBus, marca: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Modelo</label>
              <input
                type="text"
                className="form-control"
                value={formBus.modelo}
                onChange={(e) => setFormBus({ ...formBus, modelo: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Año</label>
              <input
                type="number"
                className="form-control"
                value={formBus.anio}
                onChange={(e) => setFormBus({ ...formBus, anio: Number(e.target.value) })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Revisión Técnica</label>
              <input
                type="date"
                className="form-control"
                value={formBus.revision_tecnica?.slice(0, 10) || ''}
                onChange={(e) => setFormBus({ ...formBus, revision_tecnica: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Permiso Circulación</label>
              <input
                type="date"
                className="form-control"
                value={formBus.permiso_circulacion?.slice(0, 10) || ''}
                onChange={(e) => setFormBus({ ...formBus, permiso_circulacion: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Disponible</label>
              <select
                className="form-select"
                value={formBus.disponible ? '1' : '0'}
                onChange={(e) => setFormBus({ ...formBus, disponible: e.target.value === '1' })}
              >
                <option value="1">Sí</option>
                <option value="0">No</option>
              </select>
            </div>
          </div>
        </ModalBase>
      </main>
    </div>
  );
};

export default Buses;
