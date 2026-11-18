import React, { useState, useEffect } from 'react';
import { 
  Filter, Download, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, 
  Search, MessageSquare, Send, Calendar, User, BarChart3, Layers, Minus, 
  Info, RefreshCw, FileSpreadsheet, CheckCircle2 
} from 'lucide-react';
import api from '../api/axios';
import ModalDetalleIndicador from '../components/ModalDetalleIndicador';

interface ResultadoCalc {
  indicador: number;
  codigo: string;
  nombre: string;
  meta_codigo: string;
  meta_nombre: string;
  seccion: string;
  programa: string | null;
  forma_calculo: string;
  orientacion: string;
  ponderacion: string | null;
  meta_valor: string | null;
  numerador: string;
  denominador: string | null;
  resultado: string | null;
  cumplimiento_pct: string | null;
  estado: 'CUMPLE' | 'EN_RIESGO' | 'NO_CUMPLE' | 'SIN_META' | 'SIN_CONFIGURAR' | 'NO_CALCULABLE';
  meses_con_datos: number[];
  errores: string[];
}

interface ComentarioClinico {
  id: number;
  programa: string;
  sector: string;
  autor: string;
  texto: string;
  fecha: string;
}

const SECTORES_OPCIONES = [
  'Todos los Sectores',
  'Sector Norte (Azul)',
  'Sector Sur (Verde)',
  'Sector Oriente (Rojo)',
  'SAPU / Urgencias',
  'Transversal'
];

const PROGRAMAS_OPCIONES = [
  'Todos los Programas',
  'Cardiovascular',
  'Salud Mental',
  'Odontológico',
  'Niñez y Adolescencia',
  'Adulto y Persona Mayor',
  'Salud Maternal y Reproductiva',
  'Respiratorio (Asma/EPOC)',
  'Salud Comunitaria',
  'Transversal'
];

const CORTES = [
  { value: '', label: 'Acumulado del año' },
  { value: '1', label: '1er corte (ene - mayo)' },
  { value: '2', label: '2° corte (ene - julio)' },
  { value: '3', label: '3er corte (ene - sept)' },
  { value: '4', label: '4° corte (ene - dic)' },
];

const ESTADO_BADGE: Record<string, { cls: string; icono: 'up' | 'down' | 'mid' | 'info' }> = {
  CUMPLE: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icono: 'up' },
  EN_RIESGO: { cls: 'bg-amber-50 text-amber-700 border-amber-200', icono: 'mid' },
  NO_CUMPLE: { cls: 'bg-rose-50 text-rose-600 border-rose-200', icono: 'down' },
  SIN_META: { cls: 'bg-slate-50 text-slate-500 border-slate-200', icono: 'info' },
  SIN_CONFIGURAR: { cls: 'bg-slate-50 text-slate-400 border-slate-200', icono: 'info' },
  NO_CALCULABLE: { cls: 'bg-sky-50 text-sky-600 border-sky-200', icono: 'info' },
};

const ESTADO_LABEL: Record<string, string> = {
  CUMPLE: 'Cumple',
  EN_RIESGO: 'En riesgo',
  NO_CUMPLE: 'No cumple',
  SIN_META: 'Sin meta',
  SIN_CONFIGURAR: 'Sin configurar',
  NO_CALCULABLE: 'Faltan datos',
};

function BadgeEstado({ estado }: { estado: string }) {
  const conf = ESTADO_BADGE[estado] || ESTADO_BADGE.SIN_META;
  const Icono = conf.icono === 'up' ? TrendingUp : conf.icono === 'down' ? TrendingDown
    : conf.icono === 'mid' ? Minus : Info;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${conf.cls}`}>
      <Icono size={12} />
      {ESTADO_LABEL[estado] || estado}
    </span>
  );
}

function BarraProgreso({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-slate-300">—</span>;
  const ancho = Math.min(100, Math.max(0, pct));
  const color = pct >= 100 ? 'bg-emerald-500' : pct >= 80 ? 'bg-amber-400' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-2 min-w-[130px]">
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${ancho}%` }} />
      </div>
      <span className="text-xs font-black text-slate-700 tabular-nums w-12 text-right">{pct.toFixed(1)}%</span>
    </div>
  );
}

export default function ReportesDirectora() {
  const userRole = localStorage.getItem('user_role') || 'Directora';
  const userName = localStorage.getItem('user_name') || 'Funcionario';

  // Filtros principales
  const [sectorSeleccionado, setSectorSeleccionado] = useState('Todos los Sectores');
  const [programaSeleccionado, setProgramaSeleccionado] = useState('Todos los Programas');
  const [anio, setAnio] = useState('2026');
  const [corte, setCorte] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Datos de indicadores y cálculo
  const [resultados, setResultados] = useState<ResultadoCalc[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [indicadorModal, setIndicadorModal] = useState<ResultadoCalc | null>(null);

  // Observaciones Clínicas (RF de retroalimentación)
  const [comentarios, setComentarios] = useState<ComentarioClinico[]>([
    {
      id: 1,
      programa: 'Cardiovascular',
      sector: 'Sector Sur (Verde)',
      autor: 'Enf. Marcela Riquelme (Jefe de Programa)',
      texto: 'Se intensificaron los controles cardiovasculares y operativos sabatinos de compensación en personas con DM2 y HTA.',
      fecha: '2026-10-15 10:30'
    },
    {
      id: 2,
      programa: 'Odontológico',
      sector: 'Sector Norte (Azul)',
      autor: 'Dr. Esteban Tapia (Jefe de Programa)',
      texto: 'Meta de alta odontológica infantil de 6 años requiere seguimiento debido a rotación de sillón dental en sector norte.',
      fecha: '2026-10-14 16:45'
    }
  ]);
  const [nuevoComentarioTexto, setNuevoComentarioTexto] = useState('');
  const [comentarioPrograma, setComentarioPrograma] = useState('Cardiovascular');
  const [comentarioSector, setComentarioSector] = useState('Sector Norte (Azul)');

  // Carga de datos desde la API oficial de PostgreSQL
  const cargarMetas = async () => {
    setCargando(true);
    setError('');
    try {
      const res = await api.get('param/calc/', {
        params: {
          anio,
          ...(corte ? { corte } : {}),
          ...(programaSeleccionado !== 'Todos los Programas' ? { programa: programaSeleccionado } : {}),
          ...(sectorSeleccionado !== 'Todos los Sectores' ? { sector: sectorSeleccionado } : {}),
          ...(fechaInicio ? { fecha_inicio: fechaInicio } : {}),
          ...(fechaFin ? { fecha_fin: fechaFin } : {}),
        }
      });
      setResultados(res.data.resultados || []);
    } catch (err: any) {
      console.error('Error al cargar metas e indicadores:', err);
      setError('No se pudo calcular el cumplimiento. Verifique la conexión con el servidor y las planillas REM cargadas.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMetas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anio, corte, sectorSeleccionado, programaSeleccionado, fechaInicio, fechaFin]);

  // Filtrado local adicional para búsqueda de texto
  const metasFiltradas = resultados.filter((item) => {
    const coincideBusqueda = busqueda.trim() === '' ||
      item.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.meta_codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (item.programa && item.programa.toLowerCase().includes(busqueda.toLowerCase()));

    const coincidePrograma = programaSeleccionado === 'Todos los Programas' ||
      (item.programa && item.programa.toLowerCase().includes(programaSeleccionado.toLowerCase()));

    return coincideBusqueda && coincidePrograma;
  });

  // Estadísticas de cumplimiento para el resumen
  const totalMetas = metasFiltradas.length;
  const cumplen = metasFiltradas.filter((m) => m.estado === 'CUMPLE').length;
  const enRiesgo = metasFiltradas.filter((m) => m.estado === 'EN_RIESGO').length;
  const noCumplen = metasFiltradas.filter((m) => m.estado === 'NO_CUMPLE').length;

  const porcentajesValidos = metasFiltradas
    .map((m) => m.cumplimiento_pct ? parseFloat(m.cumplimiento_pct) : null)
    .filter((p): p is number => p !== null && !isNaN(p));

  const promedioCumplimiento = porcentajesValidos.length > 0
    ? (porcentajesValidos.reduce((acc, v) => acc + v, 0) / porcentajesValidos.length).toFixed(1)
    : '0.0';

  // Exportar a archivo CSV
  const exportarCSV = () => {
    if (metasFiltradas.length === 0) {
      alert('No hay metas para exportar con los filtros seleccionados.');
      return;
    }

    const headers = ['Codigo', 'Indicador', 'Meta Codigo', 'Programa', 'Sector', 'Numerador', 'Denominador', 'Meta Anual', 'Resultado', 'Cumplimiento %', 'Estado'];
    const rows = metasFiltradas.map((m) => [
      `"${m.codigo}"`,
      `"${m.nombre.replace(/"/g, '""')}"`,
      `"${m.meta_codigo}"`,
      `"${m.programa || 'Transversal'}"`,
      `"${sectorSeleccionado}"`,
      `"${m.numerador}"`,
      `"${m.denominador || ''}"`,
      `"${m.meta_valor || ''}"`,
      `"${m.resultado || ''}"`,
      `"${m.cumplimiento_pct || ''}"`,
      `"${ESTADO_LABEL[m.estado] || m.estado}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_metas_${sectorSeleccionado.replace(/\s+/g, '_')}_${anio}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Publicar nueva observación clínica
  const handleGuardarComentario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoComentarioTexto.trim()) return;

    const nuevo: ComentarioClinico = {
      id: Date.now(),
      programa: comentarioPrograma,
      sector: comentarioSector,
      autor: `${userName} (${userRole})`,
      texto: nuevoComentarioTexto,
      fecha: new Date().toLocaleString('es-CL')
    };

    setComentarios([nuevo, ...comentarios]);
    setNuevoComentarioTexto('');
  };

  return (
    <div className="w-full min-h-full bg-slate-50 p-6 md:p-8 space-y-6">
      
      {/* Cabecera del Módulo */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 uppercase">
              Módulo de Reportes & Jefe de Programa
            </span>
            <span className="text-xs font-semibold text-slate-400">
              Sector: <strong className="text-slate-700">{sectorSeleccionado}</strong>
            </span>
          </div>
          <h3 className="text-xl font-black text-blue-950 mt-1">Cumplimiento de Metas e Indicadores Clínicos</h3>
          <p className="text-xs text-slate-500 font-medium">
            Monitoreo en tiempo real con filtro por sector, desglose por programa de salud y trazabilidad de celdas REM.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={cargarMetas}
            disabled={cargando}
            className="flex items-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
            title="Recargar datos"
          >
            <RefreshCw size={15} className={cargando ? 'animate-spin' : ''} />
            Recargar
          </button>
          <button 
            onClick={exportarCSV} 
            className="flex items-center gap-2 bg-blue-950 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow hover:bg-blue-900 transition cursor-pointer"
          >
            <Download size={15} /> Exportar Reporte CSV
          </button>
        </div>
      </div>

      {/* Barra de Filtros: Filtro por Sector, Filtro por Programa, Año y Fechas */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-950 uppercase tracking-wider pb-2 border-b border-slate-100">
          <Filter size={16} />
          <span>Filtros de Búsqueda y Segmentación Territorial</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. FILTRO POR SECTOR (Requisito Clave) */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Filtro por Sector
            </label>
            <select 
              value={sectorSeleccionado} 
              onChange={(e) => setSectorSeleccionado(e.target.value)} 
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-slate-50 font-bold text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
            >
              {SECTORES_OPCIONES.map((sec) => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>

          {/* 2. FILTRO POR PROGRAMA DE SALUD */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Programa de Salud
            </label>
            <select 
              value={programaSeleccionado} 
              onChange={(e) => setProgramaSeleccionado(e.target.value)} 
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
            >
              {PROGRAMAS_OPCIONES.map((prog) => (
                <option key={prog} value={prog}>{prog}</option>
              ))}
            </select>
          </div>

          {/* 3. AÑO Y CORTE EVALUATIVO */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Corte Evaluativo ({anio})
            </label>
            <select 
              value={corte} 
              onChange={(e) => setCorte(e.target.value)} 
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-slate-50 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
            >
              {CORTES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* 4. BUSCADOR RÁPIDO */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Búsqueda de Indicador
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input 
                type="text" 
                value={busqueda} 
                onChange={(e) => setBusqueda(e.target.value)} 
                placeholder="Ej: 6.1.A, diabetes, PAP..." 
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900" 
              />
            </div>
          </div>
        </div>

        {/* Rango de Fechas Opcionales */}
        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
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
          {(fechaInicio || fechaFin || busqueda || sectorSeleccionado !== 'Todos los Sectores' || programaSeleccionado !== 'Todos los Programas') && (
            <button
              onClick={() => {
                setFechaInicio('');
                setFechaFin('');
                setBusqueda('');
                setSectorSeleccionado('Todos los Sectores');
                setProgramaSeleccionado('Todos los Programas');
              }}
              className="text-rose-600 font-bold hover:underline cursor-pointer ml-auto"
            >
              Restablecer Filtros
            </button>
          )}
        </div>
      </div>

      {/* Tarjetas de Semáforo de Cumplimiento (Resumen Estadístico) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Metas</span>
          <h4 className="text-2xl font-black text-blue-950">{totalMetas}</h4>
          <p className="text-[11px] text-slate-500 font-medium">{sectorSeleccionado}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Cumplen</span>
            <CheckCircle className="text-emerald-500" size={18} />
          </div>
          <h4 className="text-2xl font-black text-emerald-600">{cumplen}</h4>
          <p className="text-[11px] text-emerald-700 font-semibold">Meta lograda</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">En Riesgo</span>
            <AlertTriangle className="text-amber-500" size={18} />
          </div>
          <h4 className="text-2xl font-black text-amber-600">{enRiesgo}</h4>
          <p className="text-[11px] text-amber-700 font-semibold">80% - 99% meta</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">No Cumplen</span>
            <TrendingDown className="text-rose-500" size={18} />
          </div>
          <h4 className="text-2xl font-black text-rose-600">{noCumplen}</h4>
          <p className="text-[11px] text-rose-700 font-semibold">Crítico (&lt;80%)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Promedio</span>
            <TrendingUp className="text-blue-600" size={18} />
          </div>
          <h4 className="text-2xl font-black text-blue-950">{promedioCumplimiento}%</h4>
          <p className="text-[11px] text-blue-700 font-semibold">Avance ponderado</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-orange-50 text-orange-900 border border-orange-200 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* ============================================================== */}
      {/* TABLA DE METAS (Requisito Principal Integrado)                  */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-0">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-900">
              <Layers size={20} />
            </div>
            <div>
              <h4 className="font-black text-blue-950 text-sm">
                Tabla de Metas e Indicadores ({metasFiltradas.length} registros)
              </h4>
              <p className="text-xs text-slate-500">
                Haz clic en cualquier indicador para inspeccionar las celdas del REM Serie A y la fórmula ministerial.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-lg self-start sm:self-center">
            Sector activo: {sectorSeleccionado}
          </span>
        </div>

        {cargando ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <RefreshCw size={36} className="animate-spin text-blue-900" />
            <p className="text-xs font-bold">Calculando indicadores con datos PostgreSQL...</p>
          </div>
        ) : metasFiltradas.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-400 space-y-2 p-6">
            <BarChart3 size={36} className="text-slate-300" />
            <p className="text-sm font-semibold">No se encontraron indicadores para los filtros seleccionados.</p>
            <p className="text-xs text-slate-400">Prueba cambiando el sector o programa seleccionado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Cód.</th>
                  <th className="py-3 px-4">Indicador / Meta Sanitaria</th>
                  <th className="py-3 px-4">Programa</th>
                  <th className="py-3 px-4">N / D</th>
                  <th className="py-3 px-4">Meta Anual</th>
                  <th className="py-3 px-4">Resultado</th>
                  <th className="py-3 px-4">Cumplimiento (%)</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {metasFiltradas.map((r) => (
                  <tr 
                    key={r.indicador} 
                    onClick={() => setIndicadorModal(r)}
                    className="hover:bg-blue-50/50 transition cursor-pointer group"
                    title="Haz clic para ver el desglose y celdas REM"
                  >
                    <td className="py-3 px-4 font-bold text-blue-950 whitespace-nowrap group-hover:text-blue-600">
                      {r.codigo}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 max-w-[280px] truncate" title={r.nombre}>
                        {r.nombre}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {r.meta_codigo} · {r.meta_nombre}
                        {r.ponderacion ? ` · Ponderación: ${r.ponderacion}%` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-600 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {r.programa || 'Transversal'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 font-medium tabular-nums whitespace-nowrap">
                      {r.estado === 'SIN_CONFIGURAR' ? '—' : `${r.numerador}${r.denominador !== null ? ` / ${r.denominador}` : ''}`}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-700 tabular-nums">
                      {r.meta_valor ?? '—'}
                    </td>
                    <td className="py-3 px-4 font-black text-blue-950 tabular-nums">
                      {r.resultado !== null ? `${r.resultado}${r.forma_calculo === 'PORCENTAJE' ? '%' : ''}` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <BarraProgreso pct={r.cumplimiento_pct ? parseFloat(r.cumplimiento_pct) : null} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <BadgeEstado estado={r.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* SECCIÓN DE OBSERVACIONES CLÍNICAS (Jefe de Programa / Dirección) */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-900">
            <MessageSquare size={20} />
          </div>
          <div>
            <h4 className="font-black text-blue-950 text-sm">
              Observaciones Clínicas y Justificaciones del Jefe de Programa
            </h4>
            <p className="text-xs text-slate-500">
              Registro oficial de retroalimentación técnica accesible para Dirección y Subdirección del CESFAM.
            </p>
          </div>
        </div>

        {/* Formulario para agregar observación */}
        <form onSubmit={handleGuardarComentario} className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Programa Asociado</label>
              <select 
                value={comentarioPrograma} 
                onChange={(e) => setComentarioPrograma(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-white font-semibold text-slate-800"
              >
                {PROGRAMAS_OPCIONES.filter(p => p !== 'Todos los Programas').map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Sector Involucrado</label>
              <select 
                value={comentarioSector} 
                onChange={(e) => setComentarioSector(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-white font-semibold text-slate-800"
              >
                {SECTORES_OPCIONES.filter(s => s !== 'Todos los Sectores').map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Análisis Técnico / Justificación de Cumplimiento
            </label>
            <textarea 
              rows={2} 
              value={nuevoComentarioTexto} 
              onChange={(e) => setNuevoComentarioTexto(e.target.value)} 
              placeholder="Describa factores clínicos, operativos o de dotación que impactan en el cumplimiento de las metas..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
              required 
            />
          </div>

          <div className="flex justify-end">
            <button 
              type="submit" 
              className="flex items-center gap-2 bg-blue-950 text-white px-5 py-2 rounded-xl font-bold text-xs shadow hover:bg-blue-900 transition cursor-pointer"
            >
              <Send size={14} /> Registrar Observación
            </button>
          </div>
        </form>

        {/* Listado de observaciones */}
        <div className="space-y-3">
          {comentarios.map((c) => (
            <div key={c.id} className="p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-300 transition space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-blue-950">{c.programa}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800">
                    {c.sector}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar size={12} /> {c.fecha}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">{c.texto}</p>
              <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5 pt-1">
                <User size={13} className="text-slate-400" />
                Registrado por: <span className="text-blue-950 font-bold">{c.autor}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Detalle de Indicador (Coordenadas REM y Fórmulas) */}
      <ModalDetalleIndicador 
        isOpen={Boolean(indicadorModal)} 
        onClose={() => setIndicadorModal(null)} 
        indicador={indicadorModal} 
      />

    </div>
  );
}
