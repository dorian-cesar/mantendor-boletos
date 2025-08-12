import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Sidebar from '@components/Sidebar/Sidebar';
import '@components/Dashboard/dashboard.css';
import { Spinner } from 'react-bootstrap';
import { showToast } from '@components/Toast/Toast';

const parseSafe = async (res) => {
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return null; }
};

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  } catch { return '—'; }
};

const Blocks = () => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Catálogos para mostrar nombres
  const [routeMasters, setRouteMasters] = useState([]);
  const [layouts, setLayouts] = useState([]);
  const [catLoading, setCatLoading] = useState(true);

  const [filtro, setFiltro] = useState('');
  const [actualizando, setActualizando] = useState(false);

  // expandir filas (para ver paradas)
  const [expanded, setExpanded] = useState(() => new Set());
  const isExpanded = useCallback((id) => expanded.has(id), [expanded]);
  const toggleExpanded = useCallback((id) => {
    setExpanded(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }, []);

  // Cargar blocks + catálogos
  useEffect(() => {
    let cancel = false;
    const fetchAll = async () => {
      setLoading(true);
      setCatLoading(true);
      setErrorMsg('');

      try {
        const [resBlocks, resRM, resLayouts] = await Promise.all([
          fetch('https://boletos.dev-wit.com/api/route-blocks/'),
          fetch('https://boletos.dev-wit.com/api/route-masters/'),
          fetch('https://boletos.dev-wit.com/api/layouts/'),
        ]);

        const [bodyBlocks, bodyRM, bodyLayouts] = await Promise.all([
          parseSafe(resBlocks),
          parseSafe(resRM),
          parseSafe(resLayouts),
        ]);

        if (!resBlocks.ok) throw new Error(bodyBlocks?.message || 'No se pudieron cargar los bloques');
        if (!Array.isArray(bodyBlocks)) throw new Error('La API de bloques no devolvió una lista');

        // Catálogos: si fallan, mostramos id truncado
        const rmList = Array.isArray(bodyRM) ? bodyRM : [];
        const layList = Array.isArray(bodyLayouts) ? bodyLayouts : [];

        if (!cancel) {
          setBlocks(bodyBlocks);
          setRouteMasters(rmList);
          setLayouts(layList);
        }
      } catch (e) {
        console.error(e);
        if (!cancel) {
          setErrorMsg(e.message || 'Error al cargar datos');
          setBlocks([]);
          showToast('Error', e.message || 'No se pudo cargar la lista de bloques', true);
        }
      } finally {
        if (!cancel) {
          setLoading(false);
          setCatLoading(false);
        }
      }
    };
    fetchAll();
    return () => { cancel = true; };
  }, []);

  // Mapas id->obj para mostrar nombres
  const routeMastersMap = useMemo(
    () => Object.fromEntries(routeMasters.filter(r => r && r._id).map(r => [r._id, r])),
    [routeMasters]
  );
  const layoutsMap = useMemo(
    () => Object.fromEntries(layouts.filter(l => l && l._id).map(l => [l._id, l])),
    [layouts]
  );

  // Filtro simple por nombre de bloque / nombre de RM / nombre de layout / paradas
  const norm = (v) => (v ?? '').toString().toLowerCase();
  const blocksFiltrados = useMemo(() => {
    const t = norm(filtro);
    if (!t) return blocks;
    return blocks.filter(b => {
      const rmId = typeof b.routeMaster === 'object' ? b.routeMaster?._id : b.routeMaster;
      const rmName = typeof b.routeMaster === 'object'
        ? b.routeMaster?.name
        : routeMastersMap[rmId]?.name;

      const layId = typeof b.layout === 'object' ? b.layout?._id : b.layout;
      const layName = typeof b.layout === 'object'
        ? b.layout?.name
        : layoutsMap[layId]?.name;

      const inStops = (b.stops || []).some(s => norm(s?.name).includes(t));

      return (
        norm(b.name).includes(t) ||
        norm(rmName).includes(t) ||
        norm(layName).includes(t) ||
        inStops
      );
    });
  }, [blocks, filtro, routeMastersMap, layoutsMap]);

  // Refresh
  const handleActualizar = async () => {
    setActualizando(true);
    try {
      const res = await fetch('https://boletos.dev-wit.com/api/route-blocks/');
      const body = await parseSafe(res);
      if (!res.ok) throw new Error(body?.message || 'No se pudo actualizar la lista de bloques');
      if (!Array.isArray(body)) throw new Error('La API no devolvió una lista de bloques');
      setBlocks(body);
      showToast('Actualizado', 'Listado de bloques sincronizado');
    } catch (e) {
      console.error(e);
      showToast('Error', e.message || 'No se pudo sincronizar', true);
    } finally {
      setActualizando(false);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="blocks" />

      <main className="main-content">
        <div className="header">
          <h1 className="mb-0">Bloques de rutas</h1>
          <p className="text-muted">Visualiza los bloques y sus paradas asociadas</p>
        </div>

        <div className="stats-box">
          {/* Encabezado moderno: título + acciones arriba, buscador abajo */}
          <div className="d-flex flex-column gap-2 mb-3">
            {/* Fila 1 */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div className="d-flex align-items-center gap-2">
                <h5 className="mb-0">Listado de bloques</h5>
                <span className="badge bg-light text-secondary border">
                  {blocksFiltrados.length} {blocksFiltrados.length === 1 ? 'resultado' : 'resultados'}
                </span>
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleActualizar}
                  disabled={actualizando}
                >
                  {actualizando
                    ? <Spinner animation="border" size="sm" />
                    : (<><i className="bi bi-arrow-repeat me-1" />Actualizar</>)}
                </button>
              </div>
            </div>

            {/* Fila 2: buscador */}
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-search" /></span>
              <input
                className="form-control"
                placeholder="Buscar por nombre de bloque, ruta, layout o parada…"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                aria-label="Buscar bloques"
              />
              {filtro && (
                <button className="btn btn-outline-secondary" onClick={() => setFiltro('')}>
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Cargando bloques…</p>
            </div>
          ) : errorMsg ? (
            <div className="alert alert-danger" role="alert">
              {errorMsg}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 48 }} aria-label="Expandir"></th>
                    <th>Bloque</th>
                    <th>Ruta Maestra</th>
                    <th>Layout</th>
                    <th style={{ width: 110 }}>Paradas</th>
                    <th style={{ width: 170 }}>Creado</th>
                    <th style={{ width: 170 }}>Actualizado</th>
                  </tr>
                </thead>
                <tbody>
                  {blocksFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={7}>
                        <div className="d-flex justify-content-between align-items-center p-3 border rounded bg-light">
                          <div>
                            <strong>Sin resultados</strong>
                            <div className="text-muted small">Prueba con otro término o limpia el filtro.</div>
                          </div>
                          {filtro && (
                            <button className="btn btn-outline-secondary btn-sm" onClick={() => setFiltro('')}>
                              Limpiar filtro
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}

                  {blocksFiltrados.map((b) => {
                    const rmId = typeof b.routeMaster === 'object' ? b.routeMaster?._id : b.routeMaster;
                    const rmName = typeof b.routeMaster === 'object'
                      ? b.routeMaster?.name
                      : routeMastersMap[rmId]?.name;

                    const layId = typeof b.layout === 'object' ? b.layout?._id : b.layout;
                    const layName = typeof b.layout === 'object'
                      ? b.layout?.name
                      : layoutsMap[layId]?.name;

                    const paradas = Array.isArray(b.stops) ? b.stops.length : 0;

                    return (
                      <React.Fragment key={b._id}>
                        <tr className={isExpanded(b._id) ? 'table-active' : ''}>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => toggleExpanded(b._id)}
                              aria-expanded={isExpanded(b._id)}
                              aria-controls={`stops-${b._id}`}
                              title={isExpanded(b._id) ? 'Ocultar paradas' : 'Ver paradas'}
                            >
                              <i className={`bi ${isExpanded(b._id) ? 'bi-chevron-down' : 'bi-chevron-right'}`} />
                            </button>
                          </td>
                          <td className="fw-semibold">{b.name || '—'}</td>
                          <td title={rmName || rmId || ''}>
                            {catLoading ? <Spinner animation="border" size="sm" /> : (rmName || (rmId ? `${rmId.slice(0, 8)}…` : '—'))}
                          </td>
                          <td title={layName || layId || ''}>
                            {catLoading ? <Spinner animation="border" size="sm" /> : (layName || (layId ? `${layId.slice(0, 8)}…` : '—'))}
                          </td>
                          <td>
                            <span className="badge bg-info-subtle text-info-emphasis border" style={{ '--bs-badge-font-size': '0.95rem' }}>
                              {paradas}
                            </span>
                          </td>
                          <td className="text-muted small">{formatDate(b.createdAt)}</td>
                          <td className="text-muted small">{formatDate(b.updatedAt)}</td>
                        </tr>

                        {isExpanded(b._id) && (
                          <tr id={`stops-${b._id}`}>
                            <td colSpan={7}>
                              <div className="p-2 border rounded bg-light">
                                <div className="d-flex align-items-center mb-2">
                                  <i className="bi bi-signpost-2 me-2" />
                                  <h6 className="mb-0">Paradas</h6>
                                </div>
                                <div className="table-responsive">
                                  <table className="table table-sm table-striped mb-0">
                                    <thead>
                                      <tr>
                                        <th style={{ width: 60 }}>#</th>
                                        <th>Nombre</th>
                                        <th className="text-muted">ID</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {[...(b.stops || [])]
                                        .sort((a, c) => (a.order || 0) - (c.order || 0))
                                        .map((s) => (
                                          <tr key={s._id || `${s.name}-${s.order}`}>
                                            <td>{s.order}</td>
                                            <td>{s.name}</td>
                                            <td className="text-muted small">{s._id || '—'}</td>
                                          </tr>
                                        ))}
                                    </tbody>
                                  </table>
                                </div>
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
    </div>
  );
};

export default Blocks;
