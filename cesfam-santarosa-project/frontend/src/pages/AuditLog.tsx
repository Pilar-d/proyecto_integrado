// frontend/src/pages/AuditLog.tsx
import { useState } from 'react';
import { ShieldCheck, Filter, Calendar, User, Activity } from 'lucide-react';

export default function AuditLog() {
  const [logs] = useState([
    { id: 1, fecha: '15/10/2026 14:32', usuario: '12345678-9 (Administrador)', accion: 'CARGA_REM', modulo: 'REM', detalle: 'Carga exitosa planilla REM-23 Periodo 08-2026' },
    { id: 2, fecha: '14/10/2026 11:15', usuario: '98765432-1 (Funcionario)', accion: 'LOGIN_EXITOSO', modulo: 'AUTH', detalle: 'Inicio de sesión correcto en plataforma' },
    { id: 3, fecha: '12/10/2026 09:40', usuario: '12345678-9 (Administrador)', accion: 'CREAR_USUARIO', modulo: 'USUARIOS', detalle: 'Registro de nuevo usuario rol Digitador' },
  ]);

  return (
    <div className="w-full min-h-full bg-white p-6 md:p-8 space-y-6">
      
      {/* Cabecera de la sección */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-950 text-lime-400 shadow-md">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h3 className="text-xl font-black text-blue-950">Bitácora de Auditoría Inmutable</h3>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Registro trazable de seguridad, accesos y operaciones críticas ejecutadas en el sistema.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs transition">
            <Filter size={16} />
            Filtrar Registros
          </button>
        </div>
      </div>

      {/* Tabla de Registros de Auditoría */}
      <div className="overflow-x-auto w-full pt-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
              <th className="py-3 px-4 rounded-l-xl"><Calendar size={14} className="inline mr-1" /> Fecha y Hora</th>
              <th className="py-3 px-4"><User size={14} className="inline mr-1" /> Usuario / RUT</th>
              <th className="py-3 px-4"><Activity size={14} className="inline mr-1" /> Acción</th>
              <th className="py-3 px-4">Módulo</th>
              <th className="py-3 px-4 rounded-r-xl">Detalle de la Operación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/80 transition">
                <td className="py-4 px-4 font-bold text-slate-800 text-xs whitespace-nowrap">{log.fecha}</td>
                <td className="py-4 px-4 text-slate-700 font-medium">{log.usuario}</td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-900 font-bold text-xs border border-blue-200">
                    {log.accion}
                  </span>
                </td>
                <td className="py-4 px-4 text-slate-600 font-semibold text-xs uppercase">{log.modulo}</td>
                <td className="py-4 px-4 text-slate-600 font-medium text-xs">{log.detalle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}