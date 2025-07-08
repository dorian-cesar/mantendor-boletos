document.addEventListener('DOMContentLoaded', () => {
  const formularioInicio = document.getElementById('form-inicio');
  const campoEmail = document.getElementById('email');
  const campoPassword = document.getElementById('password');  
  const rememberMe = document.getElementById('rememberMe');
  const API_TIMEOUT = 10000; // 10 segundos de timeout

  // Función para validar email
  const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Función para guardar datos de sesión
  const saveSessionData = (token, user, remember) => {
    if (remember) {
      // Guardar en localStorage con expiración (7 días)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);
      
      const sessionData = {
        token,
        user,
        expiresAt: expirationDate.getTime()
      };
      
      localStorage.setItem('rememberedSession', JSON.stringify(sessionData));
    } else {
      // Guardar solo en sessionStorage (se borra al cerrar el navegador)
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
    }
  };

  formularioInicio.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validación de campos antes de enviar
    if (!campoEmail.value.trim() || !campoPassword.value.trim()) {
      showToast("Error", "Por favor complete todos los campos", true);
      return;
    }

    if (!isValidEmail(campoEmail.value.trim())) {
      showToast("Error", "Por favor ingrese un email válido", true);
      return;
    }

    const datos = {
      email: campoEmail.value.trim(),
      password: campoPassword.value.trim()
    };

    const btn = document.getElementById("btn-ingresar");
    btn.disabled = true;
    btn.classList.add("btn-cargando");
    document.getElementById("loadingSpinner").classList.remove("d-none");

    try {
      // Configurar timeout para la petición
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      const respuesta = await fetch('https://boletos.dev-wit.com/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!respuesta.ok) {
        const errorData = await respuesta.json().catch(() => ({}));
        const mensaje = (errorData?.message || errorData?.error || "").toLowerCase();

        if (respuesta.status === 401) {
          if (mensaje.includes("user no encontrado")) {
            throw new Error("El correo ingresado no está registrado.");
          }
          if (mensaje.includes("credenciales inválidas")) {
            throw new Error("La contraseña ingresada es incorrecta.");
          }
          if (mensaje.includes("contraseña incorrecta")) {
            throw new Error("Contraseña incorrecta");
          }
          throw new Error("No autorizado. Verifica tus datos.");
        }

        if (respuesta.status === 404 && mensaje.includes("usuario no encontrado")) {
          throw new Error("El correo ingresado no está registrado.");
        }

        throw new Error("Error inesperado del servidor. Intenta nuevamente más tarde.");
      }

      const resultado = await respuesta.json();

      if (!resultado.token || !resultado.user) {
        throw new Error('Respuesta inválida del servidor.');
      }

      // Validar rol del usuario antes de continuar
      if (resultado.user.role !== 'admin') {
        showToast("Acceso denegado", "Tu cuenta no cumple con los requisitos para acceder a esta sección.", true);
        btn.disabled = false;
        btn.classList.remove("btn-cargando");
        document.getElementById("loadingSpinner").classList.add("d-none");
        return;
      }

      // Guardar sesión según la preferencia del usuario (usamos la estructura exacta del backend)
      saveSessionData(resultado.token, resultado.user, rememberMe.checked);

      // Redirigir al dashboard
      window.location.href = 'dashboard.html';

    } catch (error) {
      // Limpiar credenciales en caso de error
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      localStorage.removeItem('rememberedSession');

      let mensaje = error.message;

      if (error.name === 'AbortError') {
        mensaje = 'La solicitud tardó demasiado. Por favor intente nuevamente.';
      }

      showToast("Error", mensaje, true);

      btn.disabled = false;
      btn.classList.remove("btn-cargando");
      document.getElementById("loadingSpinner").classList.add("d-none"); 
    }
  });
});

// Verificar sesión recordada al cargar la página
function checkRememberedSession() {
  const rememberedSession = localStorage.getItem('rememberedSession');
  if (rememberedSession) {
    const sessionData = JSON.parse(rememberedSession);
    
    // Verificar si la sesión sigue vigente
    if (sessionData.expiresAt > Date.now()) {
      // Autocompletar el checkbox
      document.getElementById('rememberMe').checked = true;
      // Auto-rellenar email si está disponible
      if (sessionData.user && sessionData.user.email) {
        document.getElementById('email').value = sessionData.user.email;
      }
    } else {
      // Eliminar sesión expirada
      localStorage.removeItem('rememberedSession');
    }
  }
}

// Inicializar la verificación de sesión recordada
checkRememberedSession();

// Toggle para mostrar/ocultar contraseña
document.getElementById("togglePassword").addEventListener("click", () => {
  const passwordField = document.getElementById("password");
  const icon = document.getElementById("iconoPassword");

  const esVisible = passwordField.type === "text";
  passwordField.type = esVisible ? "password" : "text";
  icon.className = esVisible ? "bi bi-eye" : "bi bi-eye-slash";
});
