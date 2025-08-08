import React, { useState } from 'react';

const tiposCelda = [
  { value: 'asiento', label: 'Asiento' },
  { value: 'pasillo', label: 'Pasillo' },
  { value: 'baño', label: 'Baño' },
  { value: 'vacio', label: 'Vacío' }
];

const getCellClass = (type) => {
  switch (type) {
    case 'asiento': return 'bg-primary text-white';
    case 'pasillo': return 'bg-light';
    case 'baño':    return 'bg-success text-white';
    case 'vacio':   return 'bg-secondary text-white';
    default:        return '';
  }
};

const SeatGridEditor = ({ grid, setGrid, title }) => {
  const [tipoSeleccionado, setTipoSeleccionado] = useState('asiento');

  const handleCellClick = (rowIdx, colIdx) => {
    setGrid(prev => {
        const nuevoGrid = Array.isArray(prev)
        ? prev.map((row, i) =>
            Array.isArray(row)
                ? row.map((cell, j) => {
                    const isTargetCell = i === rowIdx && j === colIdx;

                    if (!isTargetCell) {
                    return cell ?? { type: 'pasillo', label: '' };
                    }

                    // Validación para evitar duplicar asiento
                    if (
                    tipoSeleccionado === 'asiento' &&
                    cell?.type === 'asiento'
                    ) {
                    return cell; // no cambiar si ya es asiento
                    }

                    return {
                    type: tipoSeleccionado,
                    label:
                        tipoSeleccionado === 'asiento'
                        ? `${rowIdx + 1}${String.fromCharCode(65 + j)}`
                        : tipoSeleccionado === 'baño'
                        ? 'WC'
                        : ''
                    };
                })
                : row
            )
        : prev;

        console.log('Nuevo grid generado:', nuevoGrid);
        return nuevoGrid;
    });
    };


  // Contador de asientos válidos
  const totalAsientos = Array.isArray(grid)
    ? grid.reduce((acc, row) =>
        acc +
        (Array.isArray(row)
          ? row.filter(cell => cell.type === 'asiento').length
          : 0),
        0)
    : 0;

  return (
    <div className="mb-4">
      <h6>{title}</h6>
      <div className="mb-2">
        <label>Tipo de celda:</label>
        <select
          value={tipoSeleccionado}
          onChange={e => setTipoSeleccionado(e.target.value)}
          className="form-select w-auto d-inline-block ms-2"
        >
          {tiposCelda.map(t => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <span className="ms-3">
          Total asientos: <strong>{totalAsientos}</strong>
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${grid[0]?.length || 0}, 50px)`,
          gap: '2px'
        }}
      >
        {Array.isArray(grid) && grid.length > 0 ? (
        grid.map((row, rowIdx) =>
            Array.isArray(row)
            ? row.map((cell, colIdx) => {
                const safeCell = typeof cell === 'object' && cell !== null ? cell : { type: 'pasillo', label: '' };
                const type = safeCell.type;
                return (
                    <div
                    key={`${rowIdx}-${colIdx}`}
                    className={`border d-flex align-items-center justify-content-center ${getCellClass(type)}`}
                    style={{
                        height: 50,
                        width: 50,
                        cursor: 'pointer',
                        fontSize: 14
                    }}
                    onClick={() => handleCellClick(rowIdx, colIdx)}
                    >
                    {type === 'asiento' ? safeCell.label : type === 'baño' ? 'WC' : ''}
                    </div>
                );
                })
            : null
        )
        ) : (
        <p className="text-muted">No hay grilla para mostrar</p>
        )}

      </div>
    </div>
  );
};

export default SeatGridEditor;