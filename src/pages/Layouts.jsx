import React, { useEffect, useState } from 'react';
import Sidebar from '@components/Sidebar/Sidebar';
import '@components/Dashboard/dashboard.css';
import { Spinner } from 'react-bootstrap';
import ModalBase from '@components/ModalBase/ModalBase';
import { showToast } from '@components/Toast/Toast';
import SeatMapVisualizer from '@components/SeatMapVisualizer/SeatMapVisualizer';
import Swal from 'sweetalert2';

const Layout = () => {
  const [layouts, setLayouts] = useState([]);
  const [cargando, setCargando] = useState(true);   
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [layoutEditando, setLayoutEditando] = useState(null);

  const [formLayout, setFormLayout] = useState({
    name: '',
    rows: '',
    columns: '',
    pisos: '',
    capacidad: '',
    tipo_Asiento_piso_1: '',
    tipo_Asiento_piso_2: ''
  });

  const [actualizando, setActualizando] = useState(false);  
  const [currentStep, setCurrentStep] = useState(1);
  const [seatMap, setSeatMap] = useState({
    floor1: { seatMap: [] },
    floor2: { seatMap: [] }
  });

  const handleEditar = async (layout) => {
    try {
      const res = await fetch(`https://boletos.dev-wit.com/api/layouts/${layout.name}`);
      if (!res.ok) throw new Error('No se pudo cargar el layout completo');
      const fullLayout = await res.json();

      setLayoutEditando(fullLayout.name);
      setFormLayout({ 
        name: fullLayout.name, 
        rows: fullLayout.rows,
        columns: fullLayout.columns,
        pisos: fullLayout.pisos, 
        capacidad: fullLayout.capacidad, 
        tipo_Asiento_piso_1: fullLayout.tipo_Asiento_piso_1, 
        tipo_Asiento_piso_2: fullLayout.tipo_Asiento_piso_2
      });

      setSeatMap({
        floor1: fullLayout.floor1 || { seatMap: [] },
        floor2: fullLayout.floor2 || { seatMap: [] }
      });

      setModalEditarVisible(true);
    } catch (error) {
      console.error('Error al cargar layout completo:', error);
      showToast('Error', 'No se pudo cargar el layout completo', true);
    }
  };


  const handleEliminar = async (name) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Estás seguro de eliminar este layout de servicio?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#3085d6',
      cancelButtonText: 'Cancelar',
      cancelButtonColor: '#d33',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`https://boletos.dev-wit.com/api/layouts/${name}`, {
        method: 'DELETE',
      });
      await showToast('Layout eliminado', 'El layout fue eliminado exitosamente.');

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
        setLayouts(data.map(layout => ({
          ...layout,
          floor1: layout.floor1,
          floor2: layout.floor2
        })));

      } catch (error) {
        console.error('Error al cargar layout de servicio:', error);
      } finally {
        setCargando(false);
      }
    };

    fetchLayouts();
  }, []);

  // Generar mapa de asientos automáticamente al cambiar filas/columnas
  useEffect(() => {
    if (!formLayout.rows || !formLayout.columns) return;

    const totalRows = parseInt(formLayout.rows);
    const totalCols = parseInt(formLayout.columns);
    const pisos = parseInt(formLayout.pisos);

    const generateSeatMap = (rows, cols, startNum = 1) => {
      return Array.from({ length: rows }, (_, rowIdx) =>
        Array.from({ length: cols }, (_, colIdx) => {
          const rowNum = rowIdx + startNum;
          if (cols === 5 && colIdx === 2) return ""; // pasillo
          const colLetter = String.fromCharCode(65 + colIdx - (cols === 5 && colIdx > 2 ? 1 : 0));
          return `${rowNum}${colLetter}`;
        })
      );
    };

    const floor1Rows = pisos === 2 ? Math.ceil(totalRows / 2) : totalRows;
    const floor2Rows = pisos === 2 ? totalRows - floor1Rows : 0;

    const floor1Map = generateSeatMap(floor1Rows, totalCols, 1);
    const floor2Map = pisos === 2
      ? generateSeatMap(floor2Rows, totalCols, floor1Rows + 1)
      : [];

    setSeatMap({
      floor1: { seatMap: floor1Map },
      floor2: { seatMap: floor2Map }
    });
  }, [formLayout.rows, formLayout.columns, formLayout.pisos]);


  const handleGuardar = async () => {
    const payload = {
      ...formLayout,
      ...seatMap,
      pisos: parseInt(formLayout.pisos),
      rows: parseInt(formLayout.rows),
      columns: parseInt(formLayout.columns),
      capacidad: parseInt(formLayout.capacidad)
    };

    try {
      const res = await fetch('https://boletos.dev-wit.com/api/layouts/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Error al crear layout');
      
      await showToast('Éxito', 'Layout creado correctamente');
      setModalEditarVisible(false);
      setCurrentStep(1);

      // Recarga la lista desde el backend
      setCargando(true);
      const resList = await fetch('https://boletos.dev-wit.com/api/layouts/');
      const data = await resList.json();
      setLayouts(data.map(layout => ({
        ...layout,
        floor1: layout.floor1,
        floor2: layout.floor2
      })));
      setCargando(false);

    } catch (error) {
      console.error(error);
      showToast('Error', error.message, true);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Nombre del Layout*</label>
              <input
                className="form-control"
                value={formLayout.name}
                onChange={(e) => setFormLayout({...formLayout, name: e.target.value})}
                placeholder="Ej: bus_2pisos_48Seat"
                required
              />
            </div>
            
            <div className="col-md-6">
              <label className="form-label">Número de Pisos*</label>
              <select
                className="form-select"
                value={formLayout.pisos}
                onChange={(e) => setFormLayout({...formLayout, pisos: e.target.value})}
                required
              >
                <option value="">Seleccionar...</option>
                <option value="1">1 Piso</option>
                <option value="2">2 Pisos</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Filas Totales*</label>
              <input
                type="number"
                className="form-control"
                min="1"
                value={formLayout.rows}
                onChange={(e) => setFormLayout({...formLayout, rows: e.target.value})}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Columnas*</label>
              <input
                type="number"
                className="form-control"
                min="1"
                max="6"
                value={formLayout.columns}
                onChange={(e) => setFormLayout({...formLayout, columns: e.target.value})}
                required
              />
            </div>

            <div className="col-12">
              <div className="card mt-3">
                <div className="card-body">
                  <h5 className="card-title">Vista Previa</h5>
                  {formLayout.rows && formLayout.columns ? (
                    <SeatMapVisualizer 
                      seatMap={seatMap} 
                      floors={formLayout.pisos} 
                    />
                  ) : (
                    <p className="text-muted">Configura las filas y columnas para ver la vista previa</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Tipo de Asiento - Piso 1*</label>
              <select
                className="form-select"
                value={formLayout.tipo_Asiento_piso_1}
                onChange={(e) => setFormLayout({...formLayout, tipo_Asiento_piso_1: e.target.value})}
                required
              >
                <option value="">Seleccionar...</option>
                <option value="Salón-Cama">Salón Cama</option>
                <option value="Semi-Cama">Semi Cama</option>
                <option value="Ejecutivo">Ejecutivo</option>
              </select>
            </div>

            {formLayout.pisos === '2' && (
              <div className="col-md-6">
                <label className="form-label">Tipo de Asiento - Piso 2*</label>
                <select
                  className="form-select"
                  value={formLayout.tipo_Asiento_piso_2}
                  onChange={(e) => setFormLayout({...formLayout, tipo_Asiento_piso_2: e.target.value})}
                  required
                >
                  <option value="">Seleccionar...</option>
                  <option value="Salón-Cama">Salón Cama</option>
                  <option value="Semi-Cama">Semi Cama</option>
                  <option value="Ejecutivo">Ejecutivo</option>
                </select>
              </div>
            )}

            <div className="col-md-6">
              <label className="form-label">Capacidad Total*</label>
              <input
                type="number"
                className="form-control"
                min="1"
                value={formLayout.capacidad || (formLayout.rows * formLayout.columns * formLayout.pisos)}
                onChange={(e) => setFormLayout({...formLayout, capacidad: e.target.value})}
                required
              />
            </div>

            <div className="col-12">
              <div className="card mt-3">
                <div className="card-body">
                  <h5 className="card-title">Resumen</h5>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Nombre:</span>
                      <strong>{formLayout.name || 'No definido'}</strong>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Pisos:</span>
                      <strong>{formLayout.pisos || '0'}</strong>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Configuración:</span>
                      <strong>{formLayout.rows || '0'} filas × {formLayout.columns || '0'} columnas</strong>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Capacidad:</span>
                      <strong>{formLayout.capacidad || '0'} asientos</strong>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };
  
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
                  setFormLayout({
                    name: '',
                    rows: '',
                    columns: '',
                    pisos: '',
                    capacidad: '',
                    tipo_Asiento_piso_1: '',
                    tipo_Asiento_piso_2: ''
                  });
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

      {/* MODAL MEJORADO */}
      <ModalBase
        visible={modalEditarVisible}
        title={layoutEditando ? 'Editar Layout' : 'Nuevo Layout'}
        onClose={() => {
          setModalEditarVisible(false);
          setLayoutEditando(null);
          setCurrentStep(1);
        }}
        size="lg"
        footer={
          <div className="d-flex justify-content-between w-100">
            {currentStep > 1 ? (
              <button 
                className="btn btn-secondary"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                <i className="bi bi-arrow-left me-2"></i> Anterior
              </button>
            ) : (
              <div></div>
            )}
            
            {currentStep < 2 ? (
              <button 
                className="btn btn-primary"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!formLayout.name || !formLayout.pisos || !formLayout.rows || !formLayout.columns}
              >
                Siguiente <i className="bi bi-arrow-right ms-2"></i>
              </button>
            ) : (
              <button 
                className="btn btn-success"
                onClick={handleGuardar}
                disabled={!formLayout.tipo_Asiento_piso_1 || (!formLayout.tipo_Asiento_piso_2 && formLayout.pisos === '2')}
              >
                <i className="bi bi-check-circle me-2"></i> Guardar Layout
              </button>
            )}
          </div>
        }
      >
        <div className="mb-4">
          <ul className="nav nav-pills nav-justified">
            <li className="nav-item">
              <button 
                className={`nav-link ${currentStep === 1 ? 'active' : ''}`}
                onClick={() => setCurrentStep(1)}
              >
                <i className="bi bi-gear me-2"></i> Configuración
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${currentStep === 2 ? 'active' : ''}`}
                onClick={() => setCurrentStep(2)}
                disabled={!formLayout.name || !formLayout.pisos || !formLayout.rows || !formLayout.columns}
              >
                <i className="bi bi-card-checklist me-2"></i> Detalles
              </button>
            </li>
          </ul>
        </div>

        {renderStepContent()}
      </ModalBase>
    </div>
  );
};

export default Layout;