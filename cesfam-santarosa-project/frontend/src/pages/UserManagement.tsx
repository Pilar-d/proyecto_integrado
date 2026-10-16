// frontend/src/pages/UserManagement.tsx
import React, { useState } from 'react';
import { Users, UserPlus, Shield, CheckCircle2, XCircle } from 'lucide-react';

export default function UserManagement() {
  const [users] = useState([
    { id: 1, rut: '12345678-9', nombre: 'Administrador Principal', rol: 'Gestor', activo: true },
    { id: 2, rut: '98765432-1', nombre: 'Funcionario Clínico REM', rol: 'Digitador', activo: true },
    { id: 3, rut: '11223344-5', nombre: 'Supervisor Estadísticas', rol: 'Validador', activo: false },
  ]);

  return (
    <div className="w-full min-h-full bg-white p-6 md:p-8 space-y-6">
      
      {/* Cabecera de la sección */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-950 text-lime-400 shadow-md">
            <Users size={26} />
          </div>
          <div>
            <h3 className="text-xl font-black text-blue-950">Gestión de Usuarios y Roles</h3>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Administre el acceso de los funcionarios al sistema de monitoreo del CESFAM Santa Rosa.
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => alert('Modal para registrar nuevo usuario institucional')}
          className="flex items-center justify-center gap-2 bg-blue-950 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-950/20 hover:bg-blue-900 transition-all duration-200 border-b-4 border-orange-500 cursor-pointer"
        >
          <UserPlus size={18} />
          Registrar Usuario
        </button>
      </div>

      {/* Tabla de Usuarios expandida al 100% */}
      <div className="overflow-x-auto w-full pt-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
              <th className="py-3 px-4 rounded-l-xl">RUT Institucional</th>
              <th className="py-3 px-4">Funcionario</th>
              <th className="py-3 px-4">Rol Asignado</th>
              <th className="py-3 px-4">Estado de Cuenta</th>
              <th className="py-3 px-4 text-right rounded-r-xl">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/80 transition">
                <td className="py-4 px-4 font-bold text-slate-900">{u.rut}</td>
                <td className="py-4 px-4 text-slate-700 font-medium">{u.nombre}</td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-900 font-bold text-xs border border-blue-200">
                    <Shield size={12} className="text-blue-600" />
                    {u.rol}
                  </span>
                </td>
                <td className="py-4 px-4">
                  {u.activo ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 size={14} /> Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-rose-600 font-bold text-xs bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                      <XCircle size={14} /> Inactivo
                    </span>
                  )}
                </td>
                <td className="py-4 px-4 text-right">
                  <button className="bg-slate-100 hover:bg-blue-950 hover:text-white text-blue-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-xs">
                    Configurar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}