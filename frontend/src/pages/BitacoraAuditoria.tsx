import React, { useState } from 'react';
import { ShieldCheck, Filter, Calendar, User, Activity, Monitor, Globe, Clock, Search, ChevronDown, ChevronUp, FileText, CheckCircle2, AlertCircle, Lock } from 'lucide-react';

interface DetalleAccion {
  hora: string;
  modulo: string;
  tipoAccion: string;
  descripcion: string;
}

interface RegistroAuditoria {
  id: number;
  funcionario: string;
  rut: string;
  rol: string;
  accionPrincipal: string;
  resumen: string;
  fechaHora: string;
  duracionSesion: string;
  ip: string;
  dispositivo: string;
  navegador: string;
  accionesDetalladas: DetalleAccion[];
}

export default function BitacoraAuditoria() {
  const [registros] = useState<RegistroAuditoria[]>([
    {
      id: 1,
      funcionario: 'Dr. Esteban Tapia',
      rut: '12.345.678-9',
      rol: 'Gestor',
      accionPrincipal: 'CARGA_REM',
      resumen: 'Procesamiento de planilla REM A24 (1,420 registros cargados)',
      fechaHora: '2026-10-17 09:10:22',
      duracionSesion: '45 minutos',
      ip: '200.14.88.5',
      dispositivo: 'MacBook Pro 14"',
      navegador: 'Safari 18.2',
      accionesDetalladas: [
        { hora: '09:10:05', modulo: 'Carga y Parametrización REM', tipoAccion: 'UPLOAD', descripcion: 'Subió el archivo "REM_Octubre_2026.xlsx".' },
        { hora: '09:10:12', modulo: 'Carga y Parametrización REM', tipoAccion: 'UPDATE_CONFIG', descripcion: 'Aplicó coordenadas: Hoja [REM A24], Fila inicio [12].' },
        { hora: '09:10:22', modulo: 'Carga y Parametrización REM', tipoAccion: 'PROCESS_SUCCESS', descripcion: 'Validación e inserción exitosa de 1,420 filas a la base de datos PostgreSQL.' }
      ]
    },
    {
      id: 2,
      funcionario: 'Dra. Carmen Valdés',
      rut: '9.876.543-2',
      rol: 'Directora',
      accionPrincipal: 'LECTURA_COMENTARIOS',
      resumen: 'Revisión y seguimiento de observaciones del Programa Odontológico',
      fechaHora: '2026-10-17 08:35:10',
      duracionSesion: '1 hora 12 minutos',
      ip: '190.160.20.15',
      dispositivo: 'MacBook Pro 16"',
      navegador: 'Google Chrome 130',
      accionesDetalladas: [
        { hora: '08:35:10', modulo: 'Dashboard General', tipoAccion: 'VIEW', descripcion: 'Accedió al resumen de metas sanitarias.' },
        { hora: '08:45:20', modulo: 'Comentarios Clínicos', tipoAccion: 'FILTER', descripcion: 'Filtró comentarios por Programa Odontológico y Sector Norte.' },
        { hora: '09:15:00', modulo: 'Comentarios Clínicos', tipoAccion: 'READ', descripcion: 'Visualizó notas y observaciones enviadas por Jefatura.' }
      ]
    },
    {
      id: 3,
      funcionario: 'Mg. Roberto Soto',
      rut: '15.432.111-K',
      rol: 'Subdireccion',
      accionPrincipal: 'MODIFICACION_USUARIO',
      resumen: 'Cambio de estado de Acceso a "Inactivo" para cuenta de Jefe de Programa',
      fechaHora: '2026-10-16 17:50:04',
      duracionSesion: '28 minutos',
      ip: '190.160.20.42',
      dispositivo: 'Dell Latitude E5450',
      navegador: 'Microsoft Edge 129',
      accionesDetalladas: [
        { hora: '17:45:00', modulo: 'Gestión de Usuarios', tipoAccion: 'VIEW', descripcion: 'Búsqueda de usuario por RUT.' },
        { hora: '17:50:04', modulo: 'Gestión de Usuarios', tipoAccion: 'SUSPEND_USER', descripcion: 'Modificó estado de cuenta a "Inactivo" para impedir el acceso institucional.' }
      ]
    }
  ]);

  // Estados de búsqueda, filtros y acordeón desplegable
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('Todas');
  const [idExpandido, setIdExpandido] = useState<number | null>(null);

  const toggleExpandir = (id: number) => {
    setIdExpandido(idExpandido === id ? null : id);
  };

  const registrosFiltrados = registros.filter(r => {
    const coincideTexto = r.funcionario.toLowerCase().includes(busquedaTexto.toLowerCase()) || r.resumen.toLowerCase().includes(busquedaTexto.toLowerCase());
    const coincideAccion = filtroAccion === 'Todas' || r.accionPrincipal === filtroAccion;
    return coincideTexto && coincideAccion;
  });

  return (
    <div className="w-full min-h-full bg-slate-50 p-6 md:p-8 space-y-6">
      
      {/* Cabecera del Módulo con Título Centrado e Icono Renovado */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center space-y-2">
        <div className="space-y-1 max-w-2xl">
          <h3 className="text-xl font-black text-blue-950">Bitácora de Auditoría y Trazabilidad Institucional</h3>
          <p className="text-sm font-medium text-slate-500">
            Registro inmutable de accesos, duración de sesiones, dispositivos y desglose detallado de acciones por usuario.
          </p>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><Search size={16} /></span>
          <input 
            type="text" 
            value={busquedaTexto} 
            onChange={(e) => setBusquedaTexto(e.target.value)} 
            placeholder="Buscar por funcionario o resumen de acción..." 
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-slate-900 text-sm focus:outline-none" 
          />
        </div>

        <div>
          <select 
            value={filtroAccion} 
            onChange={(e) => setFiltroAccion(e.target.value)} 
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-semibold text-slate-800 focus:outline-none"
          >
            <option value="Todas">Todas las Acciones del Sistema</option>
            <option value="CARGA_REM">Carga y Procesamiento REM</option>
            <option value="LECTURA_COMENTARIOS">Lectura / Comentarios Clínicos</option>
            <option value="MODIFICACION_USUARIO">Modificación de Usuarios</option>
          </select>
        </div>

      </div>

      {/* Tabla de Auditoría */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
              <th className="py-3 px-4 rounded-l-xl">Funcionario / RUT</th>
              <th className="py-3 px-4">Acción Principal & Resumen</th>
              <th className="py-3 px-4">Sesión (Fecha / Duración)</th>
              <th className="py-3 px-4">Trazabilidad Técnica (IP / Dispositivo)</th>
              <th className="py-3 px-4 rounded-r-xl text-center">Desglose Detallado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {registrosFiltrados.length > 0 ? (
              registrosFiltrados.map((r) => {
                const estaExpandido = idExpandido === r.id;
                return (
                  <React.Fragment key={r.id}>
                    <tr className={`transition ${estaExpandido ? 'bg-blue-50/40' : 'hover:bg-slate-50/80'}`}>
                      
                      {/* Funcionario, RUT y Rol */}
                      <td className="py-4 px-4 align-top">
                        <p className="font-bold text-slate-900">{r.funcionario}</p>
                        <p className="text-xs text-slate-500 font-mono">{r.rut}</p>
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-900 px-2 py-0.5 rounded font-bold text-[10px] border border-blue-200 mt-1">
                          {r.rol}
                        </span>
                      </td>

                      {/* Acción y Resumen */}
                      <td className="py-4 px-4 align-top space-y-1">
                        <span className="inline-block px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 text-xs font-mono font-bold">
                          {r.accionPrincipal}
                        </span>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed pt-0.5">
                          {r.resumen}
                        </p>
                      </td>

                      {/* Duración y Fecha */}
                      <td className="py-4 px-4 align-top text-xs text-slate-600 space-y-1">
                        <p className="flex items-center gap-1 font-bold text-slate-800"><Clock size={13} className="text-emerald-600" /> {r.duracionSesion}</p>
                        <p className="flex items-center gap-1 text-slate-500"><Calendar size={13} className="text-slate-400" /> {r.fechaHora}</p>
                      </td>

                      {/* Trazabilidad Técnica */}
                      <td className="py-4 px-4 align-top text-xs text-slate-600 space-y-1">
                        <p className="flex items-center gap-1"><Globe size={13} className="text-blue-600" /> <span className="font-mono">IP: {r.ip}</span></p>
                        <p className="flex items-center gap-1"><Monitor size={13} className="text-indigo-600" /> {r.dispositivo}</p>
                        <p className="text-[11px] text-slate-400">🌐 {r.navegador}</p>
                      </td>

                      {/* Botón para desplegar detalle */}
                      <td className="py-4 px-4 align-top text-center">
                        <button 
                          onClick={() => toggleExpandir(r.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                            estaExpandido 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {estaExpandido ? 'Ocultar' : 'Ver Acciones'}
                          {estaExpandido ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>

                    </tr>

                    {/* Fila Desplegable con el Desglose de Acciones */}
                    {estaExpandido && (
                      <tr>
                        <td colSpan={5} className="bg-slate-50/80 p-6 border-b border-slate-200">
                          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-inner space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                              <h4 className="font-black text-blue-950 text-sm flex items-center gap-2">
                                <Activity size={16} className="text-emerald-600" />
                                Desglose de Actividad de Sesión — {r.funcionario} ({r.fechaHora})
                              </h4>
                              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                Total acciones registradas: {r.accionesDetalladas.length}
                              </span>
                            </div>

                            <div className="space-y-3">
                              {r.accionesDetalladas.map((act, index) => (
                                <div key={index} className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                      {act.hora}
                                    </span>
                                    <div>
                                      <p className="font-bold text-blue-950">{act.modulo}</p>
                                      <p className="text-slate-600">{act.descripcion}</p>
                                    </div>
                                  </div>
                                  <span className="self-start md:self-center font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px]">
                                    {act.tipoAccion}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm font-medium text-slate-400">
                  No se encontraron registros de auditoría con los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}