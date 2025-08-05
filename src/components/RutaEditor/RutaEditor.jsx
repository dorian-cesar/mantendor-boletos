// @components/RutaEditor/RutaEditor.jsx
import React from 'react';
import { ReactSortable } from 'react-sortablejs';
import './RutaEditor.css';



const RutaEditor = ({ formRuta, setFormRuta, ciudades }) => {
  const handleInputChange = (campo, valor) => {
    setFormRuta((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleStopsChange = (nuevasStops) => {
    setFormRuta((prev) => ({ ...prev, stops: nuevasStops }));
  };

  const handleAgregarStop = () => {
    const nuevasStops = [...formRuta.stops, { city: '', order: formRuta.stops.length + 1 }];
    handleStopsChange(nuevasStops);
  };

  const handleDeleteStop = (index) => {
    const nuevasStops = formRuta.stops.filter((_, i) => i !== index);
    handleStopsChange(nuevasStops.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const actualizarOrden = (ordenado) => {
    const nuevasStops = ordenado.map((city, idx) => ({
      city,
      order: idx + 1,
    }));
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
        <ReactSortable
          tag="div"
          className="d-flex flex-column gap-2"
          list={formRuta.stops.map((s) => s.city)}
          setList={actualizarOrden}
        >
          {formRuta.stops.map((stop, index) => (
            <div key={index} className="d-flex gap-2 align-items-center bg-light border rounded p-2 ">
              <span className="drag-handle d-flex flex-column justify-content-center me-2 cursor-pointer">
                <i className="bi bi-arrow-up-short"></i>
                <i className="bi bi-arrow-down-short"></i>
              </span>

              <select
                className="form-select form-select-sm flex-grow-1"
                value={stop.city}
                onChange={(e) => {
                  const nuevasStops = [...formRuta.stops];
                  nuevasStops[index].city = e.target.value;
                  handleStopsChange(nuevasStops);
                }}
              >
                <option value="">Selecciona ciudad</option>
                {ciudades.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => handleDeleteStop(index)}
              >
                <i className="bi bi-trash"></i>
              </button>
            </div>
          ))}
        </ReactSortable>


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
