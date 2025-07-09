import React, { useEffect, useState } from 'react';
import Sidebar from '@components/Sidebar/Sidebar';
import '@components/Dashboard/dashboard.css';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const usuariosPorPagina = 10;

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
            let token = sessionStorage.getItem("token");

        if (!token) {
        const recordarSession = localStorage.getItem("recordarSession");
        if (recordarSession) {
            try {
            const parsed = JSON.parse(recordarSession);
            token = parsed.token;
            } catch (e) {
            console.error("Error al parsear recordarSession:", e);
            }
        }
        }

        const res = await fetch("https://boletos.dev-wit.com/api/users/", {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
        });

        if (!res.ok) {
        throw new Error("Error al obtener usuarios. Código: " + res.status);
        }

        const data = await res.json();

        if (Array.isArray(data)) {
        setUsuarios(data);
        } else {
        console.warn("Respuesta inesperada del backend:", data);
        setUsuarios([]);
        }

    } catch (error) {
        console.error("Error al cargar usuarios:", error);
        setUsuarios([]);
    }
    };

  const totalPaginas = Math.ceil(usuarios.length / usuariosPorPagina);
  const usuariosAMostrar = usuarios.slice(
    (paginaActual - 1) * usuariosPorPagina,
    paginaActual * usuariosPorPagina
  );

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="usuarios" />
      <main className="main-content">
        <div className="header">
          <h1>Gestión de Usuarios</h1>
        </div>

        <div className="stats-box">
          <h6>Lista de Usuarios</h6>
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Fecha de Registro</th>
                </tr>
              </thead>
              <tbody>
                {usuariosAMostrar.map((usuario) => (
                  <tr key={usuario._id}>
                    <td>{usuario.name}</td>
                    <td>{usuario.email}</td>
                    <td>{usuario.role}</td>
                    <td>{formatearFecha(usuario.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="d-flex justify-content-between align-items-center mt-3">
            <span>Página {paginaActual} de {totalPaginas}</span>
            <div>
              <button
                className="btn btn-outline-primary btn-sm me-2"
                onClick={() => cambiarPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
              >
                Anterior
              </button>
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => cambiarPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Usuarios;
