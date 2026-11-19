import React, { useState } from 'react';
import { 
  ShieldCheck, Filter, Calendar, User, Activity, Clock, Search, 
  ChevronDown, ChevronUp, FileText, CheckCircle2, AlertCircle, 
  RefreshCw, Download, Database, Layers, ArrowRight 
} from 'lucide-react';
import { useBitacoraAuditoriaQuery } from '../api/queries';

interface UsuarioDetalle {
  id: number;
  rut: string;
  nombres: string;
  apellidos: string;
  email: string;
}

interface RegistroAuditoria {
  id: number;
  accion: string;
  rol_usuario: string;
  tabla_afectada: string;
  valor_anterior: any;
  valor_nuevo: any;
  fecha_hora: string;
  ip_origen: string;
  usuario: number | null;
  usuario_detalle?: UsuarioDetalle | null;
}

const ACCIONES_LABEL: Record<string, { label: string; color: string }> = {
  ACTUALIZAR_POBLACION_DENOMINADORES: { label: 'Actualización Población / Denominadores', color: 'bg-blue-50 text-blue-800 border-blue-200' },
  PARAMETRIZAR_META_CELDA: { label: 'Calibración Meta / Celda REM', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  CARGA_REM: { label: 'Carga Planilla Serie A', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  CREAR_USUARIO: { label: 'Creación de Usuario', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  MODIFICAR_USUARIO: { label: 'Modificación de Usuario', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  ELIMINAR_USUARIO: { label: 'Eliminación de Usuario', color: 'bg-rose-50 text-rose-800 border-rose-200' },
  LOGIN: { label: 'Inicio de Sesión', color: 'bg-slate-50 text-slate-800 border-slate-200' },
};

export default function BitacoraAuditoria() {
  const { data, isLoading: cargando, isError, refetch: cargarBitacora, isFetching } = useBitacoraAuditoriaQuery();
  const registros: RegistroAuditoria[] = data || [];
  const error = isError ? 'No se pudo cargar la bitácora de auditoría. Verifique sus permisos de acceso.' : '';

  // Filtros
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('Todas');
  const [filtroRol, setFiltroRol] = useState('Todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [idExpandido, setIdExpandido] = useState<number | null>(null);

  const toggleExpandir = (id: number) => {
    setIdExpandido(idExpandido === id ? null : id);
  };

  // Filtrado de registros en memoria
  const registrosFiltrados = registros.filter(r => {
    const nombre = r.usuario_detalle ? `${r.usuario_detalle.nombres} ${r.usuario_detalle.apellidos}` : 'Sistema Automático';
    const rut = r.usuario_detalle?.rut || '';
    const textoBuscar = `${nombre} ${rut} ${r.accion} ${r.tabla_afectada} ${r.ip_origen} ${r.rol_usuario}`.toLowerCase();
    
    const coincideTexto = busquedaTexto.trim() === '' || textoBuscar.includes(busquedaTexto.toLowerCase());
    const coincideAccion = filtroAccion === 'Todas' || r.accion === filtroAccion;
    const coincideRol = filtroRol === 'Todos' || r.rol_usuario.toLowerCase().includes(filtroRol.toLowerCase());

    let coincideFecha = true;
    if (fechaInicio) {
      coincideFecha = coincideFecha && r.fecha_hora >= fechaInicio;
    }
    if (fechaFin) {
      coincideFecha = coincideFecha && r.fecha_hora <= `${fechaFin}T23:59:59`;
    }

    return coincideTexto && coincideAccion && coincideRol && coincideFecha;
  });

  // Estadísticas rápidas
  const totalRegistros = registros.length;
  const eventosParametrizacion = registros.filter(r => r.accion.includes('PARAM') || r.accion.includes('POBLACION')).length;
  const eventosCargaRem = registros.filter(r => r.accion === 'CARGA_REM').length;

  // Exportar a CSV
  const exportarCSV = () => {
    if (registrosFiltrados.length === 0) {
      alert('No hay registros para exportar.');
      return;
    }
    const headers = ['ID', 'Fecha Hora', 'Accion', 'Rol', 'Funcionario', 'RUT', 'Tabla Afectada', 'IP Origen'];
    const rows = registrosFiltrados.map(r => [
      r.id,
      `"${r.fecha_hora}"`,
      `"${r.accion}"`,
      `"${r.rol_usuario}"`,
      `"${r.usuario_detalle ? `${r.usuario_detalle.nombres} ${r.usuario_detalle.apellidos}` : 'Sistema'}"`,
      `"${r.usuario_detalle?.rut || 'N/A'}"`,
      `"${r.tabla_afectada}"`,
      `"${r.ip_origen}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bitacora_auditoria_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatearFecha = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="w-full min-h-full bg-slate-50 p-6 md:p-8 space-y-6">
      
      {/* Cabecera del Módulo */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 uppercase">
              Módulo de Seguridad & Trazabilidad (RF-12)
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Registros en PostgreSQL: <strong className="text-slate-700">{totalRegistros}</strong>
            </span>
          </div>
          <h3 className="text-xl font-black text-blue-950 mt-1">Bitácora Oficial de Auditoría</h3>
          <p className="text-xs text-slate-500 font-medium">
            Registro inmutable de actividades administrativas, cambios de parámetros de metas, ingestas REM y operaciones de usuarios.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => cargarBitacora()}
            disabled={cargando}
            className="flex items-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
            title="Recargar bitácora"
          >
            <RefreshCw size={15} className={cargando ? 'animate-spin' : ''} />
            Recargar
          </button>
          <button
            onClick={exportarCSV}
            className="flex items-center gap-2 bg-blue-950 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow hover:bg-blue-900 transition cursor-pointer"
          >
            <Download size={15} /> Exportar Bitácora CSV
          </button>
        </div>
      </div>

      {/* Tarjetas Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Eventos Auditados</span>
            <Activity className="text-blue-600" size={18} />
          </div>
          <h4 className="text-2xl font-black text-blue-950">{totalRegistros}</h4>
          <p className="text-[11px] text-slate-500">Persistidos en tabla <code className="bg-slate-100 px-1 py-0.5 rounded">api_registros</code></p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Cambios de Parametrización</span>
            <Layers className="text-emerald-600" size={18} />
          </div>
          <h4 className="text-2xl font-black text-emerald-600">{eventosParametrizacion}</h4>
          <p className="text-[11px] text-emerald-700 font-medium">Metas, celdas y denominadores FONASA</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Ingestas de Planillas REM</span>
            <Database className="text-indigo-600" size={18} />
          </div>
          <h4 className="text-2xl font-black text-indigo-900">{eventosCargaRem}</h4>
          <p className="text-[11px] text-indigo-700 font-medium">Cargas de Excel Serie A auditadas</p>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros con Fechas, Roles y Acciones */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-950 uppercase tracking-wider pb-2 border-b border-slate-100">
          <Filter size={15} />
          <span>Filtros de Auditoría y Trazabilidad</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Búsqueda por texto */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Buscar por Texto</label>
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={busquedaTexto}
                onChange={(e) => setBusquedaTexto(e.target.value)}
                placeholder="Funcionario, RUT, IP, tabla..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          {/* Filtro por Acción */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Tipo de Acción</label>
            <select
              value={filtroAccion}
              onChange={(e) => setFiltroAccion(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
            >
              <option value="Todas">Todas las acciones</option>
              <option value="ACTUALIZAR_POBLACION_DENOMINADORES">Actualizar Población / Denominadores</option>
              <option value="PARAMETRIZAR_META_CELDA">Parametrizar Meta / Celda REM</option>
              <option value="CARGA_REM">Carga Planilla REM</option>
              <option value="CREAR_USUARIO">Creación de Usuario</option>
              <option value="MODIFICAR_USUARIO">Modificación de Usuario</option>
              <option value="LOGIN">Inicio de Sesión</option>
            </select>
          </div>

          {/* Filtro por Rol */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Rol de Funcionario</label>
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
            >
              <option value="Todos">Todos los roles</option>
              <option value="Directora">Directora</option>
              <option value="Subdireccion">Subdirección</option>
              <option value="Gestor">Gestor de Información</option>
              <option value="Jefe">Jefe de Programa</option>
              <option value="Sistema">Sistema</option>
            </select>
          </div>
        </div>

        {/* Filtros de Fecha Calendario */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Fecha Desde:</span>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="rounded-lg border border-slate-200 px-2.5 py-1 bg-slate-50 font-medium"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Fecha Hasta:</span>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="rounded-lg border border-slate-200 px-2.5 py-1 bg-slate-50 font-medium"
            />
          </div>

          {(busquedaTexto || filtroAccion !== 'Todas' || filtroRol !== 'Todos' || fechaInicio || fechaFin) && (
            <button
              onClick={() => {
                setBusquedaTexto('');
                setFiltroAccion('Todas');
                setFiltroRol('Todos');
                setFechaInicio('');
                setFechaFin('');
              }}
              className="text-xs font-bold text-rose-600 hover:underline cursor-pointer ml-auto"
            >
              Restablecer Filtros
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-orange-50 text-orange-900 border border-orange-200 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Lista de Eventos de Auditoría */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-900" />
            <h4 className="font-black text-blue-950 text-sm">
              Historial de Eventos ({registrosFiltrados.length} encontrados)
            </h4>
          </div>
          <span className="text-xs font-semibold text-slate-400">Orden: Más reciente primero</span>
        </div>

        {cargando ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <RefreshCw size={36} className="animate-spin text-blue-900" />
            <p className="text-xs font-bold">Consultando bitácora de auditoría en PostgreSQL...</p>
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-400 space-y-2 p-6">
            <FileText size={36} className="text-slate-300" />
            <p className="text-sm font-semibold">No se encontraron registros de auditoría para el filtro actual.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {registrosFiltrados.map((r) => {
              const expandido = idExpandido === r.id;
              const accionInfo = ACCIONES_LABEL[r.accion] || { label: r.accion, color: 'bg-slate-100 text-slate-800 border-slate-200' };
              const funcionarioNombre = r.usuario_detalle 
                ? `${r.usuario_detalle.nombres} ${r.usuario_detalle.apellidos}` 
                : 'Sistema Automático / Admin';
              const rut = r.usuario_detalle?.rut || 'RUT no asociado';

              return (
                <div key={r.id} className="p-5 hover:bg-slate-50/60 transition space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${accionInfo.color}`}>
                          {accionInfo.label}
                        </span>
                        <span className="text-xs font-bold text-blue-950">
                          Tabla: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-900">{r.tabla_afectada}</code>
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                          <Clock size={12} /> {formatearFecha(r.fecha_hora)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium">
                        Ejecutado por <strong className="text-slate-900">{funcionarioNombre}</strong> ({rut}) con rol <span className="font-bold text-blue-900 uppercase">[{r.rol_usuario}]</span> desde IP <span className="font-mono text-slate-500">{r.ip_origen}</span>.
                      </p>
                    </div>

                    <button
                      onClick={() => toggleExpandir(r.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-900 hover:text-blue-700 px-3 py-1.5 rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-blue-50 transition cursor-pointer self-start md:self-center whitespace-nowrap"
                    >
                      {expandido ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      {expandido ? 'Ocultar Valores' : 'Ver Valores Auditados'}
                    </button>
                  </div>

                  {/* Detalle Desplegable con Valores JSON */}
                  {expandido && (
                    <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Valor Anterior */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <span className="font-bold uppercase tracking-wider text-slate-500 text-[11px] flex items-center gap-1">
                          Valor Anterior
                        </span>
                        {r.valor_anterior ? (
                          <pre className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-slate-800 overflow-x-auto max-h-48">
                            {JSON.stringify(r.valor_anterior, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-slate-400 italic">Sin valor previo registrado (Registro inicial)</p>
                        )}
                      </div>

                      {/* Valor Nuevo */}
                      <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1.5">
                        <span className="font-bold uppercase tracking-wider text-emerald-900 text-[11px] flex items-center gap-1">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          Valor Nuevo Aplicado
                        </span>
                        {r.valor_nuevo ? (
                          <pre className="p-2.5 rounded-lg bg-white border border-emerald-200 font-mono text-[11px] text-slate-800 overflow-x-auto max-h-48">
                            {JSON.stringify(r.valor_nuevo, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-slate-400 italic">No especificado</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
