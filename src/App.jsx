import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from '@components/Login/Login';
import Dashboard from '@components/Dashboard/Dashboard';
import Usuarios from '@pages/Usuarios';
import { ToastContainer } from '@components/Toast/toast';

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/usuarios" element={<Usuarios />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
