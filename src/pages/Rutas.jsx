import React, { useEffect, useState } from 'react';
import Sidebar from '@components/Sidebar/Sidebar';
import '@components/Dashboard/dashboard.css';
import { Spinner } from 'react-bootstrap';
import { showToast } from '@components/Toast/Toast';
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
  const [modalEditarBloqueVisible, setModalEditarBloqueVisible] = useState(false);
  const [bloqueEditando, setBloqueEditando] = useState(null);
  const [formBloque, setFormBloque] = useState({ name: '', segments: [] });


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
    const esNuevaRuta = !rutaEditando;

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

    const endpoint = esNuevaRuta
      ? 'https://boletos.dev-wit.com/api/routes/'
      : `https://boletos.dev-wit.com/api/routes/${rutaEditando}`;

    const metodo = esNuevaRuta ? 'POST' : 'PUT';

    try {
      const res = await fetch(endpoint, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataAGuardar),
      });

      const body = await res.json();

      if (!res.ok) {
        const mensaje = body?.message || 'Error desconocido al guardar la ruta';
        throw new Error(mensaje);
      }

      const nuevaRuta = body;

      setRutas((prev) => {
        if (esNuevaRuta) {
          return [...prev, nuevaRuta];
        } else {
          return prev.map((t) => (t._id === rutaEditando ? nuevaRuta : t));
        }
      });

      showToast(
        esNuevaRuta ? 'Ruta creada' : 'Ruta actualizada',
        esNuevaRuta
          ? 'La nueva ruta fue creada exitosamente'
          : 'Los cambios fueron guardados correctamente'
      );

      setModalEditarVisible(false);
      setRutaEditando(null);
    } catch (err) {
      console.error(err);
      showToast('Error', err.message || 'No se pudo guardar la ruta', true);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta ruta?')) return;

    try {
      const res = await fetch(`https://boletos.dev-wit.com/api/routes/${id}`, {
        method: 'DELETE',
      });

      showToast('Ruta eliminada', 'La ruta fue eliminada exitosamente');

      if (!res.ok) throw new Error('Error al eliminar');
      setRutas((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error(err);
      showToast('Error', 'No se pudo eliminar la ruta', true);
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

  const handleGuardarBloque = async () => {
    const isEditando = Boolean(bloqueEditando);

    const segmentsLimpios = formBloque.segments.map((seg, index) => {
      const base = {
        from: seg.from,
        to: seg.to,
      };
      if (isEditando) {
        return {
          ...base,
          _id: seg._id,
          order: index + 1,
        };
      }
      return base;
    });

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseBody = await res.json(); // leer siempre el cuerpo

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
        } else {
          return { ...prev, [rutasExpandida]: [...bloquesActuales, bloqueGuardado] };
        }
      });

      showToast(
        isEditando ? 'Bloque actualizado' : 'Bloque creado',
        isEditando
          ? 'Los cambios fueron guardados correctamente'
          : 'El nuevo bloque fue creado exitosamente'
      );

      setModalEditarBloqueVisible(false);
      setBloqueEditando(null);
    } catch (err) {
      console.error(err);
      showToast('Error', err.message || 'No se pudo guardar el bloque', true);
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
                setFormRuta({ name: '', origin: '', destination: '', stops: [] });
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
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h6 className="mb-0">Bloques de esta ruta</h6>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBloqueEditando(null);
                                  setFormBloque({ name: '', segments: [] });
                                  setRutasExpandida(ruta._id); // asegúrate de mantener esta ruta expandida
                                  setModalEditarBloqueVisible(true);
                                }}
                              >
                                <i className="bi bi-plus-circle me-1"></i> Nuevo bloque
                              </button>
                            </div>

                            {bloquesPorRuta[ruta._id].map((bloque) => (
                              <div key={bloque._id} className="mb-3 p-2 border rounded bg-light">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <strong>{bloque.name}</strong>
                                  <div>
                                    <button
                                      className="btn btn-sm btn-warning me-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setBloqueEditando(bloque._id);
                                        setFormBloque({
                                          name: bloque.name,
                                          segments: bloque.segments.map((seg) => ({ ...seg })),
                                        });
                                        setModalEditarBloqueVisible(true);
                                      }}
                                    >
                                      <i className="bi bi-pencil-square"></i>
                                    </button>

                                    <button
                                      className="btn btn-sm btn-danger"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (!window.confirm('¿Estás seguro de eliminar este bloque?')) return;

                                        try {
                                          const res = await fetch(`https://boletos.dev-wit.com/api/blocks/${bloque._id}`, {
                                            method: 'DELETE',
                                          });

                                          if (!res.ok) throw new Error('Error en la respuesta del servidor');

                                          setBloquesPorRuta((prev) => {
                                            const nuevosBloques = prev[ruta._id].filter((b) => b._id !== bloque._id);
                                            return { ...prev, [ruta._id]: nuevosBloques };
                                          });

                                          showToast('Bloque eliminado', 'El bloque fue eliminado correctamente');
                                        } catch (err) {
                                          console.error(err);
                                          showToast('Error', 'No se pudo eliminar el bloque', true);
                                        }
                                      }}
                                    >
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  </div>
                                </div>

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
              <div
                key={segment._id || index}
                className="border rounded p-3 mb-2 bg-light-subtle position-relative"
              >
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
