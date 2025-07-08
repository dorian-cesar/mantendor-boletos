/**
 * Sistema de Notificaciones Toast Dinámicas
 * =========================================
 * 
 * Este módulo proporciona un sistema de notificaciones toast personalizable que:
 * - Se posiciona en la parte superior derecha de la pantalla
 * - Soporta mensajes de éxito y error
 * - Se crea automáticamente si no existe en el DOM
 * - Es fácil de usar desde cualquier parte de la aplicación
 * 
 * Uso básico:
 * -----------
 * showToast("Título", "Mensaje");                  // Toast de éxito (verde)
 * showToast("Título", "Mensaje", false);           // Toast de éxito (verde)
 * showToast("Título", "Mensaje", true);            // Toast de error (rojo)
 * 
 * Características:
 * ----------------
 * - Posicionamiento fijo en pantalla: aparecen en el lado superior derecho
 * - Apilamiento: los nuevos toasts se agregan debajo del anterior
 * - Autocierre: se ocultan automáticamente después de 5 segundos
 * - Diseño responsivo: se adapta a diferentes tamaños de pantalla
 * - Barra de progreso con color según el tipo de notificación
 * - Sin dependencias externas: solo requiere Bootstrap 5
 * 
 * Personalización:
 * ----------------
 * - Para cambiar el tiempo de visualización: modificar el 'delay' en showToast()
 * - Para cambiar los colores: modificar las clases bg-danger/bg-success en showToast()
 * - Para cambiar la posición de los toasts: ajustar el estilo del contenedor en initToastContainer()
 */

let toastContainer; // Contenedor de toasts

/**
 * Inicializa el contenedor de toasts y los estilos si no existen
 */
function initToastContainer() {
  // Crear estilos para barra de progreso si aún no existen
  if (!document.getElementById('toast-style')) {
    const style = document.createElement('style');
    style.id = 'toast-style';
    style.innerHTML = `
      .toast-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 4px;
        width: 100%;
        animation: toast-progress-animation 4s linear forwards;
      }
      
      .toast-progress.success {
        background-color: #198754; /* Color verde de Bootstrap para éxito */
      }
      
      .toast-progress.error {
        background-color: #dc3545; /* Color rojo de Bootstrap para error */
      }

      @keyframes toast-progress-animation {
        from { width: 100%; }
        to { width: 0%; }
      }
    `;
    document.head.appendChild(style);
  }

  // Crear el contenedor si aún no existe
  if (!document.getElementById('toast-container')) {
    const containerHTML = `
      <div id="toast-container" style="
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 550px;
      "></div>
    `;
    document.body.insertAdjacentHTML('beforeend', containerHTML);
  }

  toastContainer = document.getElementById('toast-container');
}

/**
 * Muestra un toast de notificación
 * @param {string} title - Título del toast
 * @param {string} message - Mensaje a mostrar
 * @param {boolean} [isError=false] - Si es true, muestra un toast de error (rojo), sino de éxito (verde)
 */
function showToast(title, message, isError = false) {
  // Asegurar que el contenedor y los estilos estén presentes
  if (!toastContainer) initToastContainer();

  const id = `toast-${Date.now()}`;
  const typeClass = isError ? 'error' : 'success';
  const headerClass = isError ? 'bg-danger text-white' : 'bg-success text-white';

  const toastHTML = `
    <div id="${id}" class="toast show position-relative" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="5000">
      <div class="toast-header ${headerClass}">
        <strong class="me-auto">${title}</strong>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">${message}</div>
      <div class="toast-progress ${typeClass}"></div>
    </div>
  `;

  toastContainer.insertAdjacentHTML('beforeend', toastHTML);

  const toastEl = document.getElementById(id);
  const toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 4000 });
  toast.show();

  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
}