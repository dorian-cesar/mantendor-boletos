import React, { useEffect, useState } from 'react';
import Sidebar from '@components/Sidebar/Sidebar';
import '@components/Dashboard/dashboard.css';
import { Spinner } from 'react-bootstrap';
import { showToast } from '@components/Toast/Toast';
import ModalBase from '@components/ModalBase/ModalBase';
import RutaEditor from '@components/RutaEditor/RutaEditor';
import Swal from 'sweetalert2';
import { ReactSortable } from 'react-sortablejs';

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
  
  // Modal de Blocks
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

  // --- Blocks CRUD state ---
  const [blockMode, setBlockMode] = useState('view'); // 'view' | 'create' | 'edit'
  const [blockForm, setBlockForm] = useState({ name: '', stops: [] }); // stops: [{ name, order }]
  const [editingBlockId, setEditingBlockId] = useState(null);

  // Helpers UI para el formulario de block
  const addBlockStop = () => {
    setBlockForm((prev) => ({
      ...prev,
      stops: [...(prev.stops || []), { name: '', order: (prev.stops?.length || 0) + 1 }],
    }));
  };
  const removeBlockStop = (idx) => {
    setBlockForm((prev) => {
      const next = (prev.stops || []).filter((_, i) => i !== idx)
        .map((s, i) => ({ ...s, order: i + 1 }));
    return { ...prev, stops: next };
    });
  };
  const moveBlockStop = (idx, dir) => {
    setBlockForm((prev) => {
      const arr = [...(prev.stops || [])];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return prev;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      const ordered = arr.map((s, i) => ({ ...s, order: i + 1 }));
      return { ...prev, stops: ordered };
    });
  };

  // Abrir creación de block
  const openCreateBlock = () => {
    setEditingBlockId(null);
    setBlockForm({ name: '', stops: [] });
    setBlockMode('create');
  };

  // Abrir edición de block
  const openEditBlock = (bloque) => {
    setEditingBlockId(bloque._id);
    setBlockForm({
      name: bloque.name || '',
      stops: (bloque.stops || [])
        .slice()
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(s => ({ name: s.name, order: s.order })),
    });
    setBlockMode('edit');
  };

  // Cancelar formulario
  const cancelBlockForm = () => {
    setEditingBlockId(null);
    setBlockForm({ name: '', stops: [] });
    setBlockMode('view');
  };

  // Guardar (create/edit)
  const saveBlock = async () => {
    const routeMasterId = routeMasterForBlocks?._id;
    if (!routeMasterId) {
      showToast('Error', 'No hay routeMaster seleccionado.', true);
      return;
    }
    const stops = (blockForm.stops || [])
      .filter(s => typeof s?.name === 'string' && s.name.trim())
      .map((s, i) => ({ name: s.name.trim(), order: i + 1 }));

    if (!blockForm.name?.trim() || stops.length < 1) {
      showToast('Datos incompletos', 'Nombre del bloque y al menos 1 parada.', true);
      return;
    }

    const payload = {
      name: blockForm.name.trim(),
      routeMaster: routeMasterId,
      stops,
    };

    try {
      let res, body;
      if (blockMode === 'create') {
        res = await fetch('https://boletos.dev-wit.com/api/route-blocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`https://boletos.dev-wit.com/api/route-blocks/${encodeURIComponent(editingBlockId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      body = await parseResponseSafe(res);
      if (!res.ok) throw new Error(body?.message || `${res.status} ${res.statusText}`);

      showToast(blockMode === 'create' ? 'Bloque creado' : 'Bloque actualizado',
                blockMode === 'create' ? 'Se creó correctamente' : 'Cambios guardados');
      cancelBlockForm();
      // Refrescar lista
      await fetchBlocksByRouteMaster(routeMasterId);
    } catch (e) {
      console.error(e);
      showToast('Error', e.message || 'No se pudo guardar el bloque', true);
    }
  };

  // Eliminar block
  const deleteBlock = async (blockId) => {
    const result = await Swal.fire({
      title: '¿Eliminar bloque?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`https://boletos.dev-wit.com/api/route-blocks/${encodeURIComponent(blockId)}`, {
        method: 'DELETE',
      });
      const body = await parseResponseSafe(res);
      if (!res.ok) throw new Error(body?.message || `${res.status} ${res.statusText}`);

      showToast('Bloque eliminado', 'El bloque fue eliminado correctamente');
      await fetchBlocksByRouteMaster(routeMasterForBlocks?._id);
    } catch (e) {
      console.error(e);
      showToast('Error', e.message || 'No se pudo eliminar el bloque', true);
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
          // reset de formulario de blocks
          setBlockMode?.('view');
          setEditingBlockId?.(null);
          setBlockForm?.({ name: '', stops: [] });
        }}
        footer={
          <button
            className="btn btn-secondary"
            onClick={() => {
              setModalBlocksVisible(false);
              setBlockMode?.('view');
              setEditingBlockId?.(null);
              setBlockForm?.({ name: '', stops: [] });
            }}
          >
            Cerrar
          </button>
        }
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
            {/* Encabezado con total y botón crear */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="fw-semibold">Ruta Maestra: {blocksData.routeMaster}</div>
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-secondary">Total: {blocksData.totalBlocks}</span>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={openCreateBlock}
                  disabled={blockMode !== 'view'}
                  title="Crear bloque"
                >
                  <i className="bi bi-plus-circle me-1" />
                  Nuevo bloque
                </button>
              </div>
            </div>

              {/* Formulario crear/editar bloque */}
              {blockMode !== 'view' && (
              <div className="mb-3 p-3 border rounded bg-light-subtle">
                <div className="row g-2 align-items-end">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Nombre del bloque</label>
                    <input
                      className="form-control"
                      value={blockForm.name}
                      onChange={(e) => setBlockForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Ej: Tramo Norte"
                    />
                  </div>
                  <div className="col-12 col-md-6 text-md-end">
                    <div className="d-flex gap-2 justify-content-md-end mt-2 mt-md-0">
                      <button className="btn btn-secondary" onClick={cancelBlockForm}>
                        Cancelar
                      </button>
                      <button className="btn btn-primary" onClick={saveBlock}>
                        {blockMode === 'create' ? 'Crear bloque' : 'Guardar cambios'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label fw-semibold mb-0">
                      Paradas del bloque (arrástralas para reordenar)
                    </label>
                    <button className="btn btn-sm btn-outline-primary" onClick={addBlockStop}>
                      <i className="bi bi-plus" /> Añadir parada
                    </button>
                  </div>

                  {/* Drag & Drop de paradas */}
                  <ReactSortable
                    list={blockForm.stops || []}
                    setList={(newOrder) =>
                      setBlockForm((p) => ({
                        ...p,
                        stops: (newOrder || []).map((s, i) => ({ name: s.name || '', order: i + 1 })),
                      }))
                    }
                    animation={180}
                    handle=".drag-handle"
                    ghostClass="sortable-ghost"
                    chosenClass="sortable-chosen"
                  >
                    {(blockForm.stops || []).map((s, idx) => (
                      <div
                        key={`${idx}-${s?.name || 'stop'}`}
                        className="d-flex gap-2 align-items-center mb-2 p-2 border rounded bg-white"
                      >
                        {/* Asa de arrastre */}
                        <span
                          className="drag-handle d-inline-flex align-items-center justify-content-center px-2"
                          title="Arrastrar para reordenar"
                          style={{ cursor: 'grab' }}
                        >
                          <i className="bi bi-grip-vertical" />
                        </span>

                        {/* Selector de ciudad */}
                        <select
                          className="form-select form-select-sm flex-fill"
                          value={s?.name || ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            setBlockForm((p) => {
                              const arr = [...(p.stops || [])];
                              arr[idx] = { name: v, order: idx + 1 };
                              return { ...p, stops: arr };
                            });
                          }}
                        >
                          <option value="">Selecciona ciudad</option>
                          {(ciudades || []).map((c) => (
                            <option key={c._id || c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>

                        {/* Eliminar */}
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => removeBlockStop(idx)}
                          title="Quitar parada"
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    ))}
                  </ReactSortable>

                  {(blockForm.stops || []).length === 0 && (
                    <p className="text-muted fst-italic mt-2">Aún no hay paradas. Agrega al menos una.</p>
                  )}
                </div>
              </div>
            )}

            {/* Listado de bloques */}
            {Array.isArray(blocksData.blocks) && blocksData.blocks.length > 0 ? (
              blocksData.blocks.map((bloque) => {
                const isEditingThis = blockMode === 'edit' && editingBlockId === bloque._id;
                const disableOthers = blockMode !== 'view' && !isEditingThis;

                return (
                  <div
                    key={bloque._id}
                    className={`mb-3 p-2 border rounded ${isEditingThis ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'bg-light'}`}
                    style={disableOthers ? { opacity: 0.6, pointerEvents: 'none' } : undefined}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <strong>{bloque.name}</strong>
                        {isEditingThis && <span className="badge bg-primary">Editando…</span>}
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-muted small">ID: {bloque._id}</span>
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => openEditBlock(bloque)}
                          disabled={blockMode !== 'view'}
                          title="Editar bloque"
                        >
                          <i className="bi bi-pencil-square" />
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => deleteBlock(bloque._id)}
                          disabled={blockMode !== 'view'}
                          title="Eliminar bloque"
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-sm table-striped mb-0">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Parada</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...(bloque.stops || [])]
                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                            .map((s) => (
                              <tr key={s._id || `${s.name}-${s.order}`}>
                                <td>{s.order}</td>
                                <td>{s.name}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
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
