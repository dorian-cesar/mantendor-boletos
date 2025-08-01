import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from '@components/Login/Login';
import Dashboard from '@components/Dashboard/Dashboard';
import Usuarios from '@pages/Usuarios';
import Servicios from '@pages/Servicios';
import Ciudades from './pages/Ciudades';
import Terminales from './pages/Terminales';
import Companias from './pages/Companias';
import Buses from './pages/Buses';
import { ToastContainer } from '@components/Toast/Toast';

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/servicios" element={<Servicios />} />
        <Route path="/ciudades" element={<Ciudades />} />
        <Route path="/terminales" element={<Terminales />} />
        <Route path="/companias" element={<Companias />} />
        <Route path="/buses" element={<Buses />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
