import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import RecuperarPassword from './pages/RecuperarPassword';
import DisenoPrincipal from './layouts/DisenoPrincipal';
import GestionUsuarios from './pages/GestionUsuarios';
import CargaYParametrizacionRem from './pages/CargaYParametrizacionRem';
import BitacoraAuditoria from './pages/BitacoraAuditoria';
import Cumplimiento from './pages/Cumplimiento';
import ReportesDirectora from './pages/ReportesDirectora';
import ComentariosDirectora from './pages/ComentariosDirectora';
import ConfiguracionCuenta from './pages/ConfiguracionCuenta';
import EstadoDatos from './pages/EstadoDatos';
import ReporteHistorico from './pages/ReporteHistorico';

// Componente para proteger rutas según autenticación
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-password" element={<RecuperarPassword />} />
        <Route path="/" element={<PrivateRoute><DisenoPrincipal /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Cumplimiento titulo="Dashboard de Cumplimiento de Metas" />} />
          <Route path="cumplimiento" element={<Cumplimiento />} />
          <Route path="usuarios" element={<GestionUsuarios />} />
          <Route path="admin-rem" element={<CargaYParametrizacionRem />} />
          <Route path="audit" element={<BitacoraAuditoria />} />
          <Route path="reportes" element={<ReportesDirectora />} />
          <Route path="comentarios-programas" element={<ComentariosDirectora />} />
          <Route path="configuracion-cuenta" element={<ConfiguracionCuenta />} />
          <Route path="estado-datos" element={<EstadoDatos />} />
          <Route path="historico" element={<ReporteHistorico />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}