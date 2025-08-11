import React, { useEffect, useState } from 'react';
import Sidebar from '@components/Sidebar/Sidebar';
import '@components/Dashboard/dashboard.css';
import { Spinner } from 'react-bootstrap';
import { showToast } from '@components/Toast/Toast';
import ModalBase from '@components/ModalBase/ModalBase';
import RutaEditor from '@components/RutaEditor/RutaEditor';
import Swal from 'sweetalert2';

const Rutas = () => {
  const [rutas, setRutas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [rutaEditando, setRutaEditando] = useState(null);
  // Mantengo origin/destination SOLO para compatibilidad con RutaEditor, pero el guardado usa "stops".
  const [formRuta, setFormRuta] = useState({ name: '', origin: '', destination: '', stops: [] });
  const [ciudades, setCiudades] = useState([]);
  const [bloquesPorRuta, setBloquesPorRuta] = useState({});
  const [rutasExpandida, setRutasExpandida] = useState(null);
  const [modalEditarBloqueVisible, setModalEditarBloqueVisible] = useState(false);
  const [bloqueEditando, setBloqueEditando] = useState(null);
  const [formBloque, setFormBloque] = useState({ name: '', segments: [] });
  const [actualizando, setActualizando] = useState(false);

  // ---- CATALOGOS ----
  useEffect(() => {
    const fetchCiudades = async () => {
      try {
        const res = await fetch('https://boletos.dev-wit.com/api/cities');
        const data = await res.json();
        setCiudades(data || []);
      } catch (err) {
        console.error('Error al cargar ciudades:', err);
      }
    };
    fetchCiudades();
  }, []);

  // ---- CARGA INICIAL RUTAS (route-masters) ----
  useEffect(() => {
    const fetchRutas = async () => {
      try {
        const res = await fetch('https://boletos.dev-wit.com/api/route-masters/');
        const data = await res.json();
        setRutas(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error al cargar rutas maestras:', error);
      } finally {
        setCargando(false);
      }
    };
    fetchRutas();
  }, []);

  // ---- BLOQUES POR RUTA MAESTRA ----
  const fetchBloques = async (rutaId) => {
    try {
      const res = await fetch(`https://boletos.dev-wit.com/api/blocks/route/${rutaId}`);
      const data = await res.json();
      setBloquesPorRuta((prev) => ({ ...prev, [rutaId]: Array.isArray(data) ? data : [] }));
    } catch (err) {
      console.error('Error al obtener bloques:', err);
    }
  };

  const toggleExpandirRuta = (rutaId) => {
    setRutasExpandida((prev) => (prev === rutaId ? null : rutaId));
  };

  // ---- CRUD RUTA MAESTRA ----
  const handleEditar = (ruta) => {
    const paradas = Array.isArray(ruta.stops) ? [...ruta.stops].sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
    const origin = paradas[0]?.name || '';
    const destination = paradas[paradas.length - 1]?.name || '';
    const intermedias = paradas.length > 2 ? paradas.slice(1, -1).map((s, i) => ({ city: s.name, order: i + 1 })) : [];

    setRutaEditando(ruta._id);
    setFormRuta({
      name: ruta.name || '',
      origin,
      destination,
      stops: intermedias,
    });
    setModalEditarVisible(true);
  };

  const handleGuardar = async () => {
    const esNuevaRuta = !rutaEditando;

    // Componer la lista completa de paradas: origen + intermedias + destino
    const todasLasParadas = [
      formRuta.origin,
      ...(formRuta.stops || []).map((s) => s.city),
      formRuta.destination,
    ].filter((x) => typeof x === 'string' && x.trim().length > 0);

    if (todasLasParadas.length < 2) {
      showToast('Datos incompletos', 'Debes seleccionar al menos origen y destino', true);
      return;
    }

    // Normalizar y ordenar
    const stopsConOrden = todasLasParadas.map((name, i) => ({ name, order: i + 1 }));

    const dataAGuardar = {
      name: formRuta.name,
      stops: stopsConOrden,
    };

    const endpoint = esNuevaRuta
      ? 'https://boletos.dev-wit.com/api/route-masters/'
      : `https://boletos.dev-wit.com/api/route-masters/${rutaEditando}`;

    const metodo = esNuevaRuta ? 'POST' : 'PUT';

    try {
      const res = await fetch(endpoint, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataAGuardar),
      });
      const body = await res.json();

      if (!res.ok) {
        const mensaje = body?.message || 'Error desconocido al guardar la ruta maestra';
        throw new Error(mensaje);
      }

      const rutaGuardada = body;

      setRutas((prev) => {
        if (esNuevaRuta) return [...prev, rutaGuardada];
        return prev.map((t) => (t._id === rutaEditando ? rutaGuardada : t));
      });

      showToast(
        esNuevaRuta ? 'Ruta maestra creada' : 'Ruta maestra actualizada',
        esNuevaRuta
          ? 'La nueva ruta maestra fue creada exitosamente'
          : 'Los cambios fueron guardados correctamente'
      );

      setModalEditarVisible(false);
      setRutaEditando(null);
    } catch (err) {
      console.error(err);
      showToast('Error', err.message || 'No se pudo guardar la ruta maestra', true);
    }
  };

  const handleEliminar = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar ruta maestra?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`https://boletos.dev-wit.com/api/route-masters/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');

      setRutas((prev) => prev.filter((t) => t._id !== id));
      await Swal.fire('Ruta eliminada', 'La ruta maestra fue eliminada exitosamente.', 'success');
    } catch (err) {
      console.error(err);
      await Swal.fire('Error', 'No se pudo eliminar la ruta maestra', 'error');
    }
  };

  // ---- CRUD BLOQUES (sin cambios, pero vinculados a routeMaster) ----
  const handleGuardarBloque = async () => {
    const isEditando = Boolean(bloqueEditando);

    const segmentsLimpios = (formBloque.segments || []).map((seg, index) => ({
      from: seg.from,
      to: seg.to,
      ...(isEditando ? { _id: seg._id, order: index + 1 } : {}),
    }));

    const data = {
      name: formBloque.name,
      segments: segmentsLimpios,
      ...(isEditando ? {} : { routeMaster: rutasExpandida }),
    };

    const endpoint = isEditando
      ? `https://boletos.dev-wit.com/api/blocks/${bloqueEditando}`
      : `https://boletos.dev-wit.com/api/blocks`;

    const method = isEditando ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseBody = await res.json();
      if (!res.ok) {
        const errorMessage = responseBody?.message || 'Error desconocido al guardar el bloque';
        throw new Error(errorMessage);
      }

      const bloqueGuardado = responseBody;

      setBloquesPorRuta((prev) => {
        const bloquesActuales = prev[rutasExpandida] || [];
        if (isEditando) {
          const nuevosBloques = bloquesActuales.map((bloque) =>
            bloque._id === bloqueEditando ? bloqueGuardado : bloque
          );
          return { ...prev, [rutasExpandida]: nuevosBloques };
        }
        return { ...prev, [rutasExpandida]: [...bloquesActuales, bloqueGuardado] };
      });

      showToast(
        isEditando ? 'Bloque actualizado' : 'Bloque creado',
        isEditando ? 'Los cambios fueron guardados correctamente' : 'El nuevo bloque fue creado exitosamente'
      );

      setModalEditarBloqueVisible(false);
      setBloqueEditando(null);
    } catch (err) {
      console.error(err);
      showToast('Error', err.message || 'No se pudo guardar el bloque', true);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="rutas" />
      <main className="main-content">
        <div className="header">
          <h1 className="mb-0">Rutas Maestras</h1>
          <p className="text-muted">Aquí puedes visualizar y gestionar las rutas maestras y paradas</p>
        </div>

        <div className="stats-box">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">Listado de rutas maestras</h4>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={actualizando}
                onClick={async () => {
                  setActualizando(true);
                  try {
                    const res = await fetch('https://boletos.dev-wit.com/api/route-masters/');
                    const data = await res.json();

                    setRutas((prevRutas) => {
                      const nuevas = [];
                      const mapaPrev = new Map(prevRutas.map((r) => [r._id, r]));
                      (Array.isArray(data) ? data : []).forEach((rm) => {
                        const old = mapaPrev.get(rm._id);
                        const same =
                          !!old &&
                          old.name === rm.name &&
                          JSON.stringify(old.stops || []) === JSON.stringify(rm.stops || []);
                        nuevas.push(same ? old : rm);
                      });
                      return nuevas;
                    });

                    showToast('Actualizado', 'Lista de rutas maestras sincronizada');
                  } catch (err) {
                    console.error(err);
                    showToast('Error al actualizar', err.message || 'No se pudo sincronizar', true);
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
                  setRutaEditando(null);
                  setFormRuta({ name: '', origin: '', destination: '', stops: [] });
                  setModalEditarVisible(true);
                }}
              >
                <i className="bi bi-plus-lg me-2"></i> Nueva ruta maestra
              </button>
            </div>
          </div>

          <p className="text-muted">Haz click en cada ruta para ver detalle de paradas</p>

          {cargando ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Cargando rutas maestras...</p>
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
                  {rutas.map((ruta) => {
                    const origen = ruta?.stops?.[0]?.name || '';
                    const destino = ruta?.stops?.[ruta.stops.length - 1]?.name || '';
                    return (
                      <React.Fragment key={ruta._id}>
                        <tr
                          onClick={() => toggleExpandirRuta(ruta._id)}
                          style={{ cursor: 'pointer' }}
                          className={rutasExpandida === ruta._id ? 'table-active' : ''}
                        >
                          <td title={rutasExpandida === ruta._id ? 'Ocultar paradas' : 'Ver paradas'}>
                            <i
                              className={`bi bi-chevron-right me-2 chevron-icon ${
                                rutasExpandida === ruta._id ? 'rotated' : ''
                              }`}
                            ></i>
                            {ruta.name}
                          </td>
                          <td>{origen}</td>
                          <td>{destino}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-warning me-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditar(ruta);
                              }}
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEliminar(ruta._id);
                              }}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>

                        {rutasExpandida === ruta._id && (
                          <tr>
                            <td colSpan="4">
                              <h6 className="mb-2">Paradas de esta ruta</h6>
                              <div className="table-responsive">
                                <table className="table table-sm table-striped mb-0">
                                  <thead>
                                    <tr>
                                      <th>#</th>
                                      <th>Nombre de la parada</th>
                                      <th className="text-muted">ID</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {[...(ruta.stops || [])]
                                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                                      .map((stop) => (
                                        <tr key={stop._id || `${stop.name}-${stop.order}`}>
                                          <td>{stop.order}</td>
                                          <td>{stop.name}</td>
                                          <td className="text-muted small">{stop._id}</td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* MODAL RUTA MAESTRA */}
      <ModalBase
        visible={modalEditarVisible}
        title={rutaEditando ? 'Editar Ruta Maestra' : 'Nueva Ruta Maestra'}
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
        <RutaEditor formRuta={formRuta} setFormRuta={setFormRuta} ciudades={ciudades} />
      </ModalBase>

      {/* MODAL BLOQUE */}
      <ModalBase
        visible={modalEditarBloqueVisible}
        title="Editar Bloque"
        onClose={() => {
          setModalEditarBloqueVisible(false);
          setBloqueEditando(null);
        }}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalEditarBloqueVisible(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleGuardarBloque}>
              Guardar Cambios
            </button>
          </>
        }
      >
        <div className="mb-3">
          <label className="form-label fw-bold">Nombre del bloque</label>
          <input
            type="text"
            className="form-control"
            value={formBloque.name}
            onChange={(e) => setFormBloque({ ...formBloque, name: e.target.value })}
            placeholder="Ej: Bloque Norte-Sur"
          />
        </div>

        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <label className="form-label fw-bold">Segmentos del bloque</label>
            <button
              className="btn btn-sm btn-success"
              onClick={() =>
                setFormBloque({
                  ...formBloque,
                  segments: [
                    ...formBloque.segments,
                    { from: '', to: '', order: formBloque.segments.length + 1 },
                  ],
                })
              }
            >
              <i className="bi bi-plus-circle me-1"></i> Añadir segmento
            </button>
          </div>

          {formBloque.segments.length === 0 && (
            <p className="text-muted fst-italic">No hay segmentos agregados.</p>
          )}

          {formBloque.segments.map((segment, index) => (
            <div key={segment._id || index} className="border rounded p-3 mb-2 bg-light-subtle position-relative">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="badge bg-primary">Segmento #{index + 1}</span>
              </div>

              <div className="d-flex gap-2 align-items-end">
                <div className="flex-fill">
                  <label className="form-label">Desde</label>
                  <select
                    className="form-select"
                    value={segment.from}
                    onChange={(e) => {
                      const segs = [...formBloque.segments];
                      segs[index].from = e.target.value;
                      setFormBloque({ ...formBloque, segments: segs });
                    }}
                  >
                    <option value="">Seleccionar ciudad</option>
                    {ciudades.map((ciudad) => (
                      <option key={ciudad._id} value={ciudad.name}>
                        {ciudad.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-fill">
                  <label className="form-label">Hasta</label>
                  <select
                    className="form-select"
                    value={segment.to}
                    onChange={(e) => {
                      const segs = [...formBloque.segments];
                      segs[index].to = e.target.value;
                      setFormBloque({ ...formBloque, segments: segs });
                    }}
                  >
                    <option value="">Seleccionar ciudad</option>
                    {ciudades.map((ciudad) => (
                      <option key={ciudad._id} value={ciudad.name}>
                        {ciudad.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    title="Eliminar segmento"
                    onClick={() => {
                      const segs = formBloque.segments.filter((_, i) => i !== index);
                      setFormBloque({ ...formBloque, segments: segs });
                    }}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ModalBase>
    </div>
  );
};

export default Rutas;
