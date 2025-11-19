import { Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import AuthPage from './pages/AuthPage';
import ObrasPage from './pages/ObrasPage'; 
import DetalleObraPage from './pages/DetalleObraPage';
import ProfilePage from './pages/ProfilePage';
import RutaProtegida from './components/RutaProtegida';
import { useAuth } from './context/AuthContext';
import { useEffect } from 'react';
import RootRedirect from './components/RootRedirect';

function App() {
  const { resetSessionTimeout } = useAuth();
  const location = useLocation();



  useEffect(() => {
    const activityEvents = ['click', 'keypress', 'scroll', 'mousemove'];
    const resetTimer = () => resetSessionTimeout();

    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [resetSessionTimeout]);


  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      {/* Rutas de autenticación */}
      <Route path="/login" element={<AuthPage />} />
      <Route path="/forgot-password" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage />} />

      <Route element={<RutaProtegida />}>
        <Route path="/obras" element={<ObrasPage />} />
        <Route path="/obras/:id" element={<DetalleObraPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}

export default App;