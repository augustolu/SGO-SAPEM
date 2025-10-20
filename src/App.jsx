import { Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
// import AuthPage from './pages/AuthPage'; // Ya no se usa para /login y /register
import LoginPage from './pages/LoginPage'; // Importar el componente correcto
import RegisterPage from './pages/RegisterPage'; // Importar el componente correcto
import ObrasPage from './pages/ObrasPage';
import DetalleObraPage from './pages/DetalleObraPage';
import RutaProtegida from './components/RutaProtegida';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      {/* Rutas actualizadas para usar los componentes correctos */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* <Route path="/login" element={<AuthPage />} /> */} {/* Esta era la ruta incorrecta */}
      {/* <Route path="/register" element={<AuthPage />} /> */} {/* Esta era la ruta incorrecta */}

      <Route element={<RutaProtegida />}>
        <Route path="/obras" element={<ObrasPage />} />
        <Route path="/obras/:id" element={<DetalleObraPage />} />
      </Route>
    </Routes>
  );
}

export default App;