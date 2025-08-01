import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from '@components/Login/Login';
import Dashboard from '@components/Dashboard/Dashboard';
import Usuarios from '@pages/Usuarios';
import Servicios from '@pages/Servicios';
import Origenes from './pages/Origenes';
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
        <Route path="/origenes" element={<Origenes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
