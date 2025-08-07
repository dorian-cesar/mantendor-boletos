import React from 'react';
import './SeatMapVisualizer.css';

const SeatMapVisualizer = ({ seatMap, floors }) => {
  // Función para renderizar una fila de asientos
  const renderSeatRow = (row, rowIndex, floor) => {
    return row.map((seat, seatIndex) => {      
      // Si es cadena vacía, es pasillo
        if (seat === '') {
        return (
            <div 
            key={`${floor}r${rowIndex}s${seatIndex}`}
            className="seat aisle"
            title="Pasillo"
            >
            &nbsp;
            </div>
        );
        }

        // Si es null/undefined, es asiento vacío
        if (!seat) {
        return (
            <div 
            key={`${floor}r${rowIndex}s${seatIndex}`}
            className="seat empty"
            title="Asiento disponible"
            >
            X
            </div>
        );
        }

        // Asiento ocupado
        return (
        <div 
            key={`${floor}r${rowIndex}s${seatIndex}`}
            className="seat occupied"
            title={`Asiento ${seat}`}
        >
            {seat}
        </div>
        );
    });
  };
  console.log('seatMap props:', seatMap);
    //console.log('seatMap props:', JSON.stringify(seatMap, null, 2));

  return (
    <div className="seat-map-container">
      {floors >= 1 && (
        <div className="floor-section">
          <h6>Piso 1</h6>
          <div className="seat-grid">
            {seatMap.floor1.seatMap.map((row, rowIdx) => (
              <div key={`f1r${rowIdx}`} className="seat-row">
                {renderSeatRow(row, rowIdx, 'f1')}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {floors >= 2 && seatMap.floor2.seatMap.length > 0 && (
        <div className="floor-section mt-3">
          <h6>Piso 2</h6>
          <div className="seat-grid">
            {seatMap.floor2.seatMap.map((row, rowIdx) => (
              <div key={`f2r${rowIdx}`} className="seat-row">
                {renderSeatRow(row, rowIdx, 'f2')}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatMapVisualizer;