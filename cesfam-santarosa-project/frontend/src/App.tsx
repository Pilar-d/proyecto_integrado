// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import AdminRem from './pages/AdminRem';
import UserManagement from './pages/UserManagement';
import AuditLog from './pages/AuditLog';

// Componente para proteger rutas según autenticación
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function DashboardHome() {
  const role = localStorage.getItem('user_role') || 'Usuario';
  return (
    <div className="w-full min-h-full bg-white p-8 space-y-6">
      <h1 className="text-2xl font-black text-blue-950 mb-2">Panel Directivo y Clínico - CESFAM Santa Rosa</h1>
      <p className="text-slate-600 font-medium">
        Bienvenido al sistema. Tu perfil actual cuenta con permisos de rol: <span className="font-bold text-emerald-600">{role}</span>.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="admin-rem" element={<AdminRem />} />
          <Route path="usuarios" element={<UserManagement />} />
          <Route path="audit" element={<AuditLog />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}