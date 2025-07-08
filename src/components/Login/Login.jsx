// src/Login.jsx
import React, { useEffect } from 'react';
import './login.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function Login() {
  useEffect(() => {    
    const formularioInicio = document.getElementById('form-inicio');
    const campoEmail = document.getElementById('email');
    const campoPassword = document.getElementById('password');
    const rememberMe = document.getElementById('rememberMe');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const iconoPassword = document.getElementById('iconoPassword');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const btnIngresar = document.getElementById('btn-ingresar');
    const API_TIMEOUT = 10000;

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const showToast = (titulo, mensaje, esError = false) => {
      alert(`${titulo}: ${mensaje}`); // puedes reemplazar esto por un toast visual real
    };

    const saveSessionData = (token, user, remember) => {
      if (remember) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 7);
        const sessionData = {
          token,
          user,
          expiresAt: expirationDate.getTime()
        };
        localStorage.setItem('rememberedSession', JSON.stringify(sessionData));
      } else {
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(user));
      }
    };

    const checkRememberedSession = () => {
      const rememberedSession = localStorage.getItem('rememberedSession');
      if (rememberedSession) {
        const sessionData = JSON.parse(rememberedSession);
        if (sessionData.expiresAt > Date.now()) {
          rememberMe.checked = true;
          if (sessionData.user?.email) {
            campoEmail.value = sessionData.user.email;
          }
        } else {
          localStorage.removeItem('rememberedSession');
        }
      }
    };

    togglePasswordBtn.addEventListener("click", () => {
      const esVisible = campoPassword.type === "text";
      campoPassword.type = esVisible ? "password" : "text";
      iconoPassword.className = esVisible ? "bi bi-eye" : "bi bi-eye-slash";
    });

    formularioInicio.addEventListener('submit', async (e) => {
      e.preventDefault();

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

      btnIngresar.disabled = true;
      btnIngresar.classList.add("btn-cargando");
      loadingSpinner.classList.remove("d-none");

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

        const respuesta = await fetch('https://boletos.dev-wit.com/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!respuesta.ok) {
          const errorData = await respuesta.json().catch(() => ({}));
          const mensaje = (errorData?.message || errorData?.error || "").toLowerCase();

          if (respuesta.status === 401) {
            if (mensaje.includes("user no encontrado")) throw new Error("El correo ingresado no está registrado.");
            if (mensaje.includes("credenciales inválidas")) throw new Error("La contraseña ingresada es incorrecta.");
            if (mensaje.includes("contraseña incorrecta")) throw new Error("Contraseña incorrecta");
            throw new Error("No autorizado. Verifica tus datos.");
          }

          if (respuesta.status === 404 && mensaje.includes("usuario no encontrado")) {
            throw new Error("El correo ingresado no está registrado.");
          }

          throw new Error("Error inesperado del servidor. Intenta nuevamente más tarde.");
        }

        const resultado = await respuesta.json();
        if (!resultado.token || !resultado.user) throw new Error('Respuesta inválida del servidor.');

        if (resultado.user.role !== 'admin') {
          showToast("Acceso denegado", "Tu cuenta no cumple con los requisitos para acceder a esta sección.", true);
          btnIngresar.disabled = false;
          btnIngresar.classList.remove("btn-cargando");
          loadingSpinner.classList.add("d-none");
          return;
        }

        saveSessionData(resultado.token, resultado.user, rememberMe.checked);
        window.location.href = 'dashboard.html';

      } catch (error) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        localStorage.removeItem('rememberedSession');

        const mensaje = error.name === 'AbortError'
          ? 'La solicitud tardó demasiado. Por favor intente nuevamente.'
          : error.message;

        showToast("Error", mensaje, true);
        btnIngresar.disabled = false;
        btnIngresar.classList.remove("btn-cargando");
        loadingSpinner.classList.add("d-none");
      }
    });

    checkRememberedSession();
  }, []);

  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <div className="rounded-4 bg-flotante bg-opacity-75 d-inline-flex p-4 position-relative shadow floating" style={{ width: 96, height: 96 }}>
          <img src="/img/bus.svg" alt="Ícono de bus" className="img-fluid" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </div>
        <h1 className="gradient-bg fw-bold display-5 mt-3">Panel de Administración</h1>
        <p className="text-secondary">Mantenedor Sistema de Gestión de Pasajes</p>
      </div>

      <div className="card shadow rounded-4 border-0 bg-white bg-opacity-75 mx-auto w-100" style={{ maxWidth: 420 }}>
        <div className="card-header bg-transparent border-bottom-0 text-center pt-4">
          <h5 className="text-login fw-bold">Acceso de Mantenedor</h5>
        </div>
        <div className="card-body p-4">
          <form id="form-inicio">
            <div className="mb-3">
              <label htmlFor="email" className="form-label fw-bold text-login">Correo Electrónico</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-login text-login"><i className="bi bi-person"></i></span>
                <input type="email" className="form-control border-login" id="email" placeholder="admin@empresa.com" required />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label fw-bold text-login">Contraseña</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-login text-login"><i className="bi bi-lock"></i></span>
                <input type="password" className="form-control border-login" id="password" placeholder="••••••••" required />
                <button className="btn btn-outline-secondary" type="button" id="togglePassword">
                  <i className="bi bi-eye" id="iconoPassword"></i>
                </button>
              </div>
            </div>

            <div className="form-check mb-3">
              <input className="form-check-input border-login" type="checkbox" id="rememberMe" />
              <label className="form-check-label text-muted" htmlFor="rememberMe">Recordar sesión</label>
            </div>

            <div className="d-grid mb-3">
              <button type="submit" className="btn btn-warning fw-bold" id="btn-ingresar">
                <span>Iniciar Sesión</span>
                <span className="spinner-border spinner-border-sm d-none" id="loadingSpinner" role="status"></span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="text-center mt-4">
        <p className="text-muted small">¿Problemas para acceder?</p>
        <div className="d-flex justify-content-center gap-3">
          <button className="btn btn-warning btn-sm">📞 Contactar soporte técnico</button>
          <button className="btn btn-primary btn-sm">📧 Enviar ticket de ayuda</button>
        </div>
        <p className="text-secondary mt-4 small">© 2025 WIT Innovasión Tecnológica</p>
      </div>
    </div>
  );
}

export default Login;
