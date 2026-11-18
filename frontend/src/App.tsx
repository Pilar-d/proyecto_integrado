import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import RecuperarPassword from './pages/RecuperarPassword';
import DisenoPrincipal from './layouts/DisenoPrincipal';
import GestionUsuarios from './pages/GestionUsuarios';
import CargaYParametrizacionRem from './pages/CargaYParametrizacionRem';
import BitacoraAuditoria from './pages/BitacoraAuditoria';
import Cumplimiento from './pages/Cumplimiento';
import DashboardDirectora from './pages/DashboardDirectora';
import ReportesDirectora from './pages/ReportesDirectora';
import ConfiguracionCuenta from './pages/ConfiguracionCuenta';
import EstadoDatos from './pages/EstadoDatos';
import ReporteHistorico from './pages/ReporteHistorico';

// Componente para proteger rutas según autenticación
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

// Componente para restringir rutas según rol (RBAC Frontend)
function RutaProtegidaPorRol({ 
  rolesPermitidos, 
  children 
}: { 
  rolesPermitidos: string[]; 
  children: React.ReactNode 
}) {
  const userRole = localStorage.getItem('user_role') || '';
  if (!rolesPermitidos.includes(userRole)) {
    return <Navigate to={userRole === 'JefePrograma' || userRole === 'Jefe de Programa' ? "/reportes" : "/dashboard"} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-password" element={<RecuperarPassword />} />
        <Route path="/" element={<PrivateRoute><DisenoPrincipal /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={
            <RutaProtegidaPorRol rolesPermitidos={['Directora', 'Subdireccion', 'Gestor', 'JefePrograma', 'Jefe de Programa']}>
              <DashboardDirectora />
            </RutaProtegidaPorRol>
          } />
          <Route path="cumplimiento" element={<Cumplimiento />} />
          <Route path="usuarios" element={
            <RutaProtegidaPorRol rolesPermitidos={['Gestor']}>
              <GestionUsuarios />
            </RutaProtegidaPorRol>
          } />
          <Route path="admin-rem" element={
            <RutaProtegidaPorRol rolesPermitidos={['Subdireccion', 'Gestor']}>
              <CargaYParametrizacionRem />
            </RutaProtegidaPorRol>
          } />
          <Route path="audit" element={
            <RutaProtegidaPorRol rolesPermitidos={['Gestor']}>
              <BitacoraAuditoria />
            </RutaProtegidaPorRol>
          } />
          <Route path="reportes" element={<ReportesDirectora />} />
          <Route path="configuracion-cuenta" element={<ConfiguracionCuenta />} />
          <Route path="estado-datos" element={
            <RutaProtegidaPorRol rolesPermitidos={['Subdireccion', 'Gestor']}>
              <EstadoDatos />
            </RutaProtegidaPorRol>
          } />
          <Route path="historico" element={
            <RutaProtegidaPorRol rolesPermitidos={['Directora', 'Subdireccion', 'Gestor']}>
              <ReporteHistorico />
            </RutaProtegidaPorRol>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}