import { Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ObrasPage from './pages/ObrasPage';
import DetalleObraPage from './pages/DetalleObraPage';
import RutaProtegida from './components/RutaProtegida';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<RutaProtegida />}>
        <Route path="/obras" element={<ObrasPage />} />
        <Route path="/obras/:id" element={<DetalleObraPage />} />
      </Route>
    </Routes>
  );
}

export default App;