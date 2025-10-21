import { Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import ObrasPage from './pages/ObrasPage';
import DetalleObraPage from './pages/DetalleObraPage';
import RutaProtegida from './components/RutaProtegida';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      {/* Rutas de autenticación */}
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage />} />

      <Route element={<RutaProtegida />}>
        <Route path="/obras" element={<ObrasPage />} />
        <Route path="/obras/:id" element={<DetalleObraPage />} />
      </Route>
    </Routes>
  );
}

export default App;