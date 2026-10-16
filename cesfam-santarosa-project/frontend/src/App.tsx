// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import AdminRem from './pages/AdminRem';
import UserManagement from './pages/UserManagement';
import AuditLog from './pages/AuditLog';
import Parametrizacion from './pages/Parametrizacion';
import Cumplimiento from './pages/Cumplimiento';

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
        
        <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Cumplimiento titulo="Dashboard de Cumplimiento de Metas" />} />
          <Route path="cumplimiento" element={<Cumplimiento />} />
          <Route path="admin-rem" element={<AdminRem />} />
          <Route path="parametrizacion" element={<Parametrizacion />} />
          <Route path="usuarios" element={<UserManagement />} />
          <Route path="audit" element={<AuditLog />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}