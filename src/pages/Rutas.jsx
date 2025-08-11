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

  // Modal crear/editar ruta (solo para crear ahora; el botón de fila abre bloques)
  const [modalRutaVisible, setModalRutaVisible] = useState(false);
  const [rutaEditando, setRutaEditando] = useState(null); // se usa solo para PUT si reactivas edición
  const [formRuta, setFormRuta] = useState({ name: '', origin: '', destination: '', stops: [] });

  // Catálogo de ciudades
  const [ciudades, setCiudades] = useState([]);

  // Expandir paradas en la tabla
  const [rutasExpandida, setRutasExpandida] = useState(null);

  // Modal de BLOQUES por route master
  const [modalBlocksVisible, setModalBlocksVisible] = useState(false);
  const [routeMasterForBlocks, setRouteMasterForBlocks] = useState(null);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [blocksError, setBlocksError] = useState('');
  const [blocksData, setBlocksData] = useState(null); // { routeMaster, totalBlocks, blocks: [...] }

  const [actualizando, setActualizando] = useState(false);

  // Helpers
  const parseResponseSafe = async (res) => {
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { _raw: text }; }
  };

  // ---- CATALOGOS ----
  useEffect(() => {
    const fetchCiudades = async () => {
      try {
        const res = await fetch('https://boletos.dev-wit.com/api/cities');
        const data = await res.json();
        setCiudades(Array.isArray(data) ? data : []);
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
        const res = await fetch('https://boletos.dev-wit.com/api/route-masters');
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

  const toggleExpandirRuta = (rutaId) => {
    setRutasExpandida((prev) => (prev === rutaId ? null : rutaId));
  };

  // ---- CREAR (opcionalmente editar) RUTA MAESTRA ----
  const abrirModalNuevaRuta = () => {
    setRutaEditando(null);
    setFormRuta({ name: '', origin: '', destination: '', stops: [] });
    setModalRutaVisible(true);
  };

  const handleGuardarRuta = async () => {
    const esNuevaRuta = !rutaEditando;

    const todasLasParadas = [
      formRuta.origin,
      ...(Array.isArray(formRuta.stops) ? formRuta.stops.map((s) => s.city) : []),
      formRuta.destination,
    ].filter((x) => typeof x === 'string' && x.trim());

    if (todasLasParadas.length < 2) {
      showToast('Datos incompletos', 'Debes seleccionar al menos origen y destino', true);
      return;
    }

    const stopsConOrden = todasLasParadas.map((name, i) => ({ name, order: i + 1 }));

    const dataAGuardar = { name: formRuta.name, stops: stopsConOrden };
    const endpoint = esNuevaRuta
      ? 'https://boletos.dev-wit.com/api/route-masters'
      : `https://boletos.dev-wit.com/api/route-masters/${encodeURIComponent(rutaEditando)}`;
    const metodo = esNuevaRuta ? 'POST' : 'PUT';

    try {
      const res = await fetch(endpoint, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataAGuardar),
      });
      const body = await parseResponseSafe(res);

      if (!res.ok) {
        const msg = body?.message || `${res.status} ${res.statusText}`;
        throw new Error(msg);
      }

      const rutaGuardada = body;
      setRutas((prev) => (esNuevaRuta ? [...prev, rutaGuardada] : prev.map((t) => (t._id === rutaEditando ? rutaGuardada : t))));
      showToast(esNuevaRuta ? 'Ruta maestra creada' : 'Ruta maestra actualizada', esNuevaRuta ? 'Se creó correctamente' : 'Cambios guardados');
      setModalRutaVisible(false);
      setRutaEditando(null);
    } catch (err) {
      console.error(err);
      showToast('Error', err.message || 'No se pudo guardar la ruta maestra', true);
    }
  };
  
  const fetchBlocksByRouteMaster = async (id) => {
    if (!id) {
      setBlocksError('Falta el ID de la ruta maestra.');
      return;
    }
    setBlocksLoading(true);
    setBlocksError('');
    setBlocksData(null);

    const url = `https://boletos.dev-wit.com/api/route-blocks/byRouteMaster/${encodeURIComponent(id)}`;

    try {
      const res = await fetch(url, { method: 'GET' });
      const text = await res.text();
      let body;
      try { body = JSON.parse(text); } 
      catch { throw new Error(`Respuesta no JSON del servidor (status ${res.status}): ${text.slice(0,200)}…`); }

      if (!res.ok) {
        const msg = body?.message || `${res.status} ${res.statusText}`;
        throw new Error(msg);
      }

      setBlocksData(body);
    } catch (e) {
      console.error('fetchBlocksByRouteMaster error:', e);
      setBlocksError(e.message || 'No se pudieron obtener los bloques para esta ruta maestra.');
    } finally {
      setBlocksLoading(false);
    }
  };

  const handleVerBlocks = (ruta) => {
    setRouteMasterForBlocks(ruta);
    setModalBlocksVisible(true);
    fetchBlocksByRouteMaster(ruta._id);
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
      const res = await fetch(`https://boletos.dev-wit.com/api/route-masters/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');

      setRutas((prev) => prev.filter((t) => t._id !== id));
      await Swal.fire('Ruta eliminada', 'La ruta maestra fue eliminada exitosamente.', 'success');
    } catch (err) {
      console.error(err);
      await Swal.fire('Error', 'No se pudo eliminar la ruta maestra', 'error');
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
                    const res = await fetch('https://boletos.dev-wit.com/api/route-masters');
                    const data = await res.json();
                    setRutas(Array.isArray(data) ? data : []);
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

              <button className="btn btn-primary btn-sm" onClick={abrirModalNuevaRuta}>
                <i className="bi bi-plus-lg me-2"></i> Nueva ruta maestra
              </button>
            </div>
          </div>

          <p className="text-muted">Haz click en cada ruta para ver detalle de paradas. Usa el botón de capa para ver sus bloques.</p>

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
                              className="btn btn-sm btn-info me-2"
                              title="Ver bloques de esta ruta"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVerBlocks(ruta);
                              }}
                            >
                              <i className="bi bi-layers"></i>
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

      {/* MODAL RUTA (solo crear por ahora) */}
      <ModalBase
        visible={modalRutaVisible}
        title={rutaEditando ? 'Editar Ruta Maestra' : 'Nueva Ruta Maestra'}
        onClose={() => {
          setModalRutaVisible(false);
          setRutaEditando(null);
        }}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalRutaVisible(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleGuardarRuta}>
              Guardar Cambios
            </button>
          </>
        }
      >
        <RutaEditor formRuta={formRuta} setFormRuta={setFormRuta} ciudades={ciudades} />
      </ModalBase>

      {/* MODAL: BLOQUES POR ROUTE MASTER */}
      <ModalBase
        visible={modalBlocksVisible}
        title={`Bloques — ${routeMasterForBlocks?.name || ''}`}
        onClose={() => {
          setModalBlocksVisible(false);
          setBlocksData(null);
          setBlocksError('');
          setRouteMasterForBlocks(null);
        }}
        footer={<button className="btn btn-secondary" onClick={() => setModalBlocksVisible(false)}>Cerrar</button>}
      >
        {blocksLoading && (
          <div className="text-center py-3">
            <Spinner animation="border" />
            <div className="mt-2">Cargando bloques...</div>
          </div>
        )}

        {!blocksLoading && blocksError && (
          <div className="alert alert-danger" role="alert">
            {blocksError}
          </div>
        )}

        {!blocksLoading && !blocksError && blocksData && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="fw-semibold">Ruta Maestra: {blocksData.routeMaster}</div>
              <span className="badge bg-secondary">Total: {blocksData.totalBlocks}</span>
            </div>

            {Array.isArray(blocksData.blocks) && blocksData.blocks.length > 0 ? (
              blocksData.blocks.map((bloque) => (
                <div key={bloque._id} className="mb-3 p-2 border rounded bg-light">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong>{bloque.name}</strong>
                    <span className="text-muted small">ID: {bloque._id}</span>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-sm table-striped mb-0">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Parada</th>
                          <th className="text-muted">ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...(bloque.stops || [])]
                          .sort((a, b) => (a.order || 0) - (b.order || 0))
                          .map((s) => (
                            <tr key={s._id || `${s.name}-${s.order}`}>
                              <td>{s.order}</td>
                              <td>{s.name}</td>
                              <td className="text-muted small">{s._id}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted">No hay bloques para esta ruta.</p>
            )}
          </div>
        )}
      </ModalBase>
    </div>
  );
};

export default Rutas;
