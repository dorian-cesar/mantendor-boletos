// @components/RutaEditor/RutaEditor.jsx
import React from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable
} from 'react-beautiful-dnd';

const RutaEditor = ({ formRuta, setFormRuta, ciudades }) => {
  const handleInputChange = (campo, valor) => {
    setFormRuta((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleStopsChange = (nuevasStops) => {
    setFormRuta((prev) => ({ ...prev, stops: nuevasStops }));
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const items = Array.from(formRuta.stops);
    const [moved] = items.splice(source.index, 1);
    items.splice(destination.index, 0, moved);

    const reordenadas = items.map((s, i) => ({ ...s, order: i + 1 }));
    handleStopsChange(reordenadas);
  };

  const handleChangeStop = (idx, value) => {
    const nuevasStops = [...formRuta.stops];
    nuevasStops[idx].city = value;
    handleStopsChange(nuevasStops);
  };

  const handleDeleteStop = (idx) => {
    const nuevasStops = formRuta.stops.filter((_, i) => i !== idx);
    const reordenadas = nuevasStops.map((s, i) => ({ ...s, order: i + 1 }));
    handleStopsChange(reordenadas);
  };

  const handleAgregarStop = () => {
    const nuevasStops = [...formRuta.stops, { city: '', order: formRuta.stops.length + 1 }];
    handleStopsChange(nuevasStops);
  };

  return (
    <>
      <div className="mb-3">
        <label className="form-label">Nombre de la ruta</label>
        <input
          className="form-control"
          value={formRuta.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Origen</label>
        <select
          className="form-select"
          value={formRuta.origin}
          onChange={(e) => handleInputChange('origin', e.target.value)}
        >
          <option value="">Selecciona ciudad</option>
          {ciudades.map((c) => (
            <option key={c._id} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">Destino</label>
        <select
          className="form-select"
          value={formRuta.destination}
          onChange={(e) => handleInputChange('destination', e.target.value)}
        >
          <option value="">Selecciona ciudad</option>
          {ciudades.map((c) => (
            <option key={c._id} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">Paradas intermedias</label>
        {formRuta.stops.length === 0 && (
          <div className="text-muted small mb-2">No hay paradas intermedias definidas</div>
        )}

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="stops">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {formRuta.stops.map((stop, idx) => (
                  <Draggable key={idx} draggableId={`stop-${idx}`} index={idx}>
                    {(provided) => (
                      <div
                        className="d-flex mb-2 gap-2 align-items-center"
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <span className="me-2" style={{ cursor: 'grab' }}>☰</span>
                        <select
                          className="form-select"
                          value={stop.city}
                          onChange={(e) => handleChangeStop(idx, e.target.value)}
                        >
                          <option value="">Selecciona ciudad</option>
                          {ciudades.map((c) => (
                            <option key={c._id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteStop(idx)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <button
          type="button"
          className="btn btn-outline-primary btn-sm mt-2"
          onClick={handleAgregarStop}
        >
          <i className="bi bi-plus"></i> Agregar parada
        </button>
      </div>
    </>
  );
};

export default RutaEditor;
