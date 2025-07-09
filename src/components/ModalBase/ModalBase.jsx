import React, { useEffect, useRef } from 'react';

// Tamaños de modal disponibles
const sizeClasses = {
  sm: 'max-w-md',   // modal pequeño
  md: 'max-w-lg',   // modal mediano (default)
  lg: 'max-w-3xl',  // modal grande
  xl: 'max-w-5xl',  // modal extragrande
};

/**
 * Componente ModalBase
 * ---------------------
 * Props esperadas:
 * - visible: boolean → indica si el modal debe mostrarse.
 * - title: string → texto que aparece como título del modal.
 * - onClose: función → se ejecuta al presionar ESC o la X.
 * - children: contenido principal dentro del modal.
 * - footer: contenido del pie (puede contener botones de acción).
 * - size: 'sm' | 'md' | 'lg' | 'xl' → tamaño del modal.
 * 
 * Uso recomendado:
 * <ModalBase
 *    visible={modalVisible}
 *    title="Título del Modal"
 *    onClose={() => setModalVisible(false)}
 *    size="lg"
 *    footer={
 *      <>
 *        <button className="btn btn-secondary" onClick={...}>Cancelar</button>
 *        <button className="btn btn-primary">Guardar</button>
 *      </>
 *    }
 * >
 *   <form>...</form>
 * </ModalBase>
 */

const ModalBase = ({ visible, title, onClose, children, footer, size = 'md' }) => {
  const modalRef = useRef();

  // Cierre con tecla ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (visible) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  // Si no está visible, no renderiza nada
  if (!visible) return null;

  return (
    <div
      className="modal-overlay d-flex justify-content-center align-items-center"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        zIndex: 1050, // Asegura que esté sobre otros elementos
      }}
    >
      <div
        ref={modalRef}
        className="bg-white text-dark rounded-4 shadow-lg d-flex flex-column"
        style={{
          maxWidth: '720px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'hidden',
        }}
      >
        <div className="modal-header border-bottom-0 p-4 pb-2 d-flex justify-content-between align-items-start">
          <h5 className="modal-title fw-semibold fs-5 mb-0">{title}</h5>
          <button type="button" className="btn-close" aria-label="Cerrar" onClick={onClose}></button>
        </div>

        <div className="modal-body px-4 py-3">
          {children}
        </div>

        {footer && (
          <div className="modal-footer border-top-0 px-4 pt-2 pb-4 d-flex justify-content-end gap-2 bg-light">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalBase;