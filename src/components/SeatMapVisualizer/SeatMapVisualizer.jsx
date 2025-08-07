import React from 'react';
import './SeatMapVisualizer.css'; // Estilos para la visualización

const SeatMapVisualizer = ({ seatMap, floors }) => {
  return (
    <div className="seat-map-container">
      {floors >= 1 && (
        <div className="floor-section">
          <h6>Piso 1</h6>
          <div className="seat-grid">
            {seatMap.floor1.seatMap.map((row, rowIdx) => (
              <div key={`f1r${rowIdx}`} className="seat-row">
                {row.map((seat, seatIdx) => (
                  <div 
                    key={`f1r${rowIdx}s${seatIdx}`}
                    className={`seat ${seat ? 'occupied' : 'empty'}`}
                  >
                    {seat || 'X'}
                  </div>
                ))}
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
                {row.map((seat, seatIdx) => (
                  <div 
                    key={`f2r${rowIdx}s${seatIdx}`}
                    className={`seat ${seat ? 'occupied' : 'empty'}`}
                  >
                    {seat || 'X'}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatMapVisualizer;