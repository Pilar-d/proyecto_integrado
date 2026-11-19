import React, { useState } from 'react';
import { 
  Download, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, 
  BarChart2, BarChart3, Activity, ShieldCheck, PieChart, LineChart, Search, 
  RefreshCw, Calendar, Filter, Layers, Info, Minus, AlertCircle, 
  ArrowUpRight, Award 
} from 'lucide-react';
import { useCalculoIndicadoresQuery } from '../api/queries';
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

const SECTORES_OPCIONES = [
  'Todos los Sectores',
  'Sector Norte (Azul)',
  'Sector Sur (Verde)',
  'Sector Oriente (Rojo)',
  'SAPU / Urgencias',
  'Transversal'
];

const CORTES = [
  { value: '', label: 'Acumulado del año' },
  { value: '1', label: '1er corte (ene - mayo)' },
  { value: '2', label: '2° corte (ene - julio)' },
  { value: '3', label: '3er corte (ene - sept)' },
  { value: '4', label: '4° corte (ene - dic)' },
];

export default function DashboardDirectora() {
  const [area, setArea] = useState('Todos los Sectores');
  const [anio, setAnio] = useState('2026');
  const [corte, setCorte] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Consumo de datos reactivo con TanStack Query
  const { 
    data: calcData, 
    isLoading: cargando, 
    isError, 
    refetch: cargarDatos, 
    isFetching 
  } = useCalculoIndicadoresQuery({
    anio,
    corte,
    sector: area,
  });

  const resultados: ResultadoCalc[] = calcData?.resultados || [];
  const mesesConDatos = calcData?.hasta_mes || 12;
  const error = isError ? 'No se pudo conectar con el servidor de cálculo. Verifique la base de datos PostgreSQL.' : '';
  const [indicadorModal, setIndicadorModal] = useState<ResultadoCalc | null>(null);

  // ==========================================
  // CÁLCULOS DEL SEMÁFORO CON DATOS REALES
  // ==========================================

  // 1. Indicadores IAAPS (RISS + PRODUCCION + IMPACTO)
  const indicadoresIAAPS = resultados.filter(
    (r) => r.seccion === 'RISS' || r.seccion === 'PRODUCCION' || r.seccion === 'IMPACTO'
  );
  const pctsIAAPS = indicadoresIAAPS
    .map((r) => r.cumplimiento_pct ? parseFloat(r.cumplimiento_pct) : null)
    .filter((v): v is number => v !== null && !isNaN(v));
  const promedioIAAPS = pctsIAAPS.length > 0
    ? (pctsIAAPS.reduce((acc, val) => acc + val, 0) / pctsIAAPS.length)
    : 0;

  // 2. Indicadores Ley 19.813 / Metas Sanitarias Comunales (COMUNAL)
  const indicadoresLey = resultados.filter((r) => r.seccion === 'COMUNAL');
  const pctsLey = indicadoresLey
    .map((r) => r.cumplimiento_pct ? parseFloat(r.cumplimiento_pct) : null)
    .filter((v): v is number => v !== null && !isNaN(v));
  const promedioLey = pctsLey.length > 0
    ? (pctsLey.reduce((acc, val) => acc + val, 0) / pctsLey.length)
    : 0;

  // 3. Proyección de Bonificación de Desempeño Colectivo (Ley 19.813)
  // Tramo 1: >= 90% (100% asignación)
  // Tramo 2: 75% - 89.9% (50% asignación)
  // Tramo 3: < 75% (Sin bonificación)
  let estadoBonificacion = {
    titulo: 'Tramo 1 (100%)',
    subtitulo: 'Sin Rebaja Presupuestaria',
    colorTexto: 'text-emerald-600',
    colorFondo: 'bg-emerald-50 border-emerald-200',
    icono: CheckCircle,
    descripcion: 'Cumplimiento sobre el 90%. Todo el personal califica al 100% de la bonificación.'
  };

  if (promedioLey < 75 && pctsLey.length > 0) {
    estadoBonificacion = {
      titulo: 'Sin Tramo (0%)',
      subtitulo: 'Pérdida de Asignación',
      colorTexto: 'text-rose-600',
      colorFondo: 'bg-rose-50 border-rose-200',
      icono: AlertCircle,
      descripcion: 'Cumplimiento bajo el 75%. No se alcanza el umbral mínimo legal de la Ley 19.813.'
    };
  } else if (promedioLey < 90 && pctsLey.length > 0) {
    estadoBonificacion = {
      titulo: 'Tramo 2 (50%)',
      subtitulo: 'Rebaja Parcial al 50%',
      colorTexto: 'text-amber-600',
      colorFondo: 'bg-amber-50 border-amber-200',
      icono: AlertTriangle,
      descripcion: 'Cumplimiento entre 75% y 89.9%. Se proyecta un 50% de la bonificación de desempeño.'
    };
  }

  // 4. Conteo de Estados para la Distribución (Gráfico Real)
  const totalMetas = resultados.length;
  const cumplen = resultados.filter((r) => r.estado === 'CUMPLE').length;
  const enRiesgo = resultados.filter((r) => r.estado === 'EN_RIESGO').length;
  const noCumplen = resultados.filter((r) => r.estado === 'NO_CUMPLE').length;
  const sinDatos = totalMetas - cumplen - enRiesgo - noCumplen;

  const pctCumplen = totalMetas > 0 ? Math.round((cumplen / totalMetas) * 100) : 0;
  const pctRiesgo = totalMetas > 0 ? Math.round((enRiesgo / totalMetas) * 100) : 0;
  const pctNoCumplen = totalMetas > 0 ? Math.round((noCumplen / totalMetas) * 100) : 0;

  // 5. Avance Real por Programas Clave
  const programasNombres = [
    { nombre: 'Cardiovascular', label: 'Salud Cardiovascular (HTA / DM2)' },
    { nombre: 'Salud Maternal y Reproductiva', label: 'Salud de la Mujer y PAP' },
    { nombre: 'Niñez y Adolescencia', label: 'Salud Infantil y Desarrollo Psicomotor' },
    { nombre: 'Adulto y Persona Mayor', label: 'Adulto Mayor (EMPAM y Visitas)' },
    { nombre: 'Odontológico', label: 'Atención Odontológica y Caries GES' },
    { nombre: 'Salud Mental', label: 'Salud Mental Transversal' },
    { nombre: 'Respiratorio (Asma/EPOC)', label: 'Salud Respiratoria (ERA / IRA)' }
  ];

  const avanceProgramas = programasNombres.map((p) => {
    const indsProg = resultados.filter(
      (r) => r.programa === p.nombre || (r.meta_nombre && r.meta_nombre.toLowerCase().includes(p.nombre.toLowerCase()))
    );
    const pcts = indsProg
      .map((r) => r.cumplimiento_pct ? parseFloat(r.cumplimiento_pct) : null)
      .filter((v): v is number => v !== null && !isNaN(v));

    const avance = pcts.length > 0
      ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)
      : 0;

    let estado = 'Óptimo';
    let color = 'bg-emerald-500';
    if (avance < 80) {
      estado = 'Crítico';
      color = 'bg-rose-500';
    } else if (avance < 90) {
      estado = 'En Alerta';
      color = 'bg-amber-400';
    }

    return {
      nombre: p.label,
      clave: p.nombre,
      avance,
      cantidad: indsProg.length,
      estado,
      color
    };
  });

  // 6. Alertas Tempranas Reales
  const metasCriticas = resultados.filter((r) => r.estado === 'NO_CUMPLE');
  const metasEnAlerta = resultados.filter((r) => r.estado === 'EN_RIESGO');
  const metasOptimas = resultados.filter((r) => r.estado === 'CUMPLE');

  // Filtrado de la tabla según búsqueda
  const metasFiltradas = resultados.filter((r) => {
    return busqueda.trim() === '' ||
      r.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.meta_codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (r.programa && r.programa.toLowerCase().includes(busqueda.toLowerCase()));
  });

  // Exportar consolidado directivo a CSV
  const exportarInformacion = () => {
    if (resultados.length === 0) {
      alert('No hay datos calculados para exportar.');
      return;
    }
    const headers = ['Codigo', 'Indicador', 'Meta Codigo', 'Seccion', 'Programa', 'Numerador', 'Denominador', 'Meta Anual', 'Resultado', 'Cumplimiento %', 'Estado'];
    const rows = resultados.map((r) => [
      `"${r.codigo}"`,
      `"${r.nombre.replace(/"/g, '""')}"`,
      `"${r.meta_codigo}"`,
      `"${r.seccion}"`,
      `"${r.programa || 'Transversal'}"`,
      `"${r.numerador}"`,
      `"${r.denominador || ''}"`,
      `"${r.meta_valor || ''}"`,
      `"${r.resultado || ''}"`,
      `"${r.cumplimiento_pct || ''}"`,
      `"${r.estado}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_directora_${area.replace(/\s+/g, '_')}_${anio}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full min-h-full bg-slate-50 p-6 md:p-8 space-y-6">
      
      {/* Cabecera del Módulo */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-900 text-white uppercase tracking-wider">
              Panel Directivo Oficial
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Datos reales PostgreSQL ({totalMetas} indicadores procesados)
            </span>
          </div>
          <h3 className="text-xl font-black text-blue-950 mt-1">Dashboard de Gestión & Semáforo de Metas</h3>
          <p className="text-xs text-slate-500 font-medium">
            Monitoreo gerencial de metas IAAPS, Ley 19.813 y asignaciones presupuestarias del CESFAM Santa Rosa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => cargarDatos()}
            disabled={cargando || isFetching}
            className="flex items-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
            title="Recalcular desde PostgreSQL"
          >
            <RefreshCw size={15} className={cargando || isFetching ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <button 
            onClick={exportarInformacion} 
            className="flex items-center gap-2 bg-blue-950 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow hover:bg-blue-900 transition cursor-pointer"
          >
            <Download size={15} /> Exportar Reporte Consolidado
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 text-sm font-semibold flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Barra de Filtros: Filtro por Área / Sector, Año y Corte */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-950 uppercase tracking-wider pb-2 border-b border-slate-100">
          <Filter size={15} />
          <span>Filtros Institucionales de Visualización</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Filtro por Sector / Área
            </label>
            <select 
              value={area} 
              onChange={(e) => setArea(e.target.value)} 
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-slate-50 font-bold text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
            >
              {SECTORES_OPCIONES.map((sec) => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Año de Evaluación
            </label>
            <select 
              value={anio} 
              onChange={(e) => setAnio(e.target.value)} 
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-slate-50 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Corte Evaluativo
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

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Buscador Rápido
            </label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-3 text-slate-400" />
              <input 
                type="text" 
                value={busqueda} 
                onChange={(e) => setBusqueda(e.target.value)} 
                placeholder="Buscar código o nombre..." 
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900" 
              />
            </div>
          </div>
        </div>

        {/* Fechas opcionales */}
        <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
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
          {(fechaInicio || fechaFin || busqueda || area !== 'Todos los Sectores' || corte) && (
            <button 
              onClick={() => { setFechaInicio(''); setFechaFin(''); setBusqueda(''); setArea('Todos los Sectores'); setCorte(''); }}
              className="text-xs font-bold text-rose-600 hover:underline cursor-pointer ml-auto"
            >
              Restablecer Filtros
            </button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. TARJETAS DEL SEMÁFORO INSTITUCIONAL (DATOS REALES)          */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* SEMÁFORO 1: CUMPLIMIENTO GLOBAL IAAPS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Cumplimiento Global IAAPS
            </span>
            {promedioIAAPS >= 90 ? (
              <CheckCircle className="text-emerald-500" size={24} />
            ) : promedioIAAPS >= 80 ? (
              <AlertTriangle className="text-amber-500" size={24} />
            ) : (
              <AlertCircle className="text-rose-500" size={24} />
            )}
          </div>
          
          <div className="flex items-baseline gap-2">
            <h4 className="text-3xl font-black text-blue-950">
              {promedioIAAPS.toFixed(1)}%
            </h4>
            <span className="text-xs font-semibold text-slate-500">
              ({indicadoresIAAPS.length} indicadores)
            </span>
          </div>

          <div className="pt-1">
            {promedioIAAPS >= 90 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Semáforo Verde: Óptimo
              </span>
            ) : promedioIAAPS >= 80 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Semáforo Amarillo: En Alerta
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Semáforo Rojo: Crítico
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Cálculo consolidado desde planillas Serie A acumuladas a mes {mesesConDatos}.
          </p>
        </div>

        {/* SEMÁFORO 2: METAS LEY 19.813 (METAS COMUNALES) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Metas Ley 19.813 (Comunales)
            </span>
            {promedioLey >= 90 ? (
              <CheckCircle className="text-emerald-500" size={24} />
            ) : promedioLey >= 75 ? (
              <AlertTriangle className="text-amber-500" size={24} />
            ) : (
              <AlertCircle className="text-rose-500" size={24} />
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <h4 className="text-3xl font-black text-blue-950">
              {promedioLey.toFixed(1)}%
            </h4>
            <span className="text-xs font-semibold text-slate-500">
              ({indicadoresLey.length} metas comunales)
            </span>
          </div>

          <div className="pt-1">
            {promedioLey >= 90 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Semáforo Verde: Meta Alcanzada
              </span>
            ) : promedioLey >= 75 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Semáforo Amarillo: En Seguimiento
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Semáforo Rojo: Bajo Umbral Legal
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Evaluación oficial para la bonificación de desempeño institucional.
          </p>
        </div>

        {/* SEMÁFORO 3: PROYECCIÓN DE BONIFICACIÓN Y ASIGNACIÓN */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Proyección de Bonificación
            </span>
            <Award className={estadoBonificacion.colorTexto} size={24} />
          </div>

          <div className="flex items-baseline gap-2">
            <h4 className="text-3xl font-black text-blue-950">
              {estadoBonificacion.titulo}
            </h4>
          </div>

          <div className="pt-1">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${estadoBonificacion.colorFondo} ${estadoBonificacion.colorTexto}`}>
              {estadoBonificacion.subtitulo}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {estadoBonificacion.descripcion}
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. GRÁFICOS REALES: DISTRIBUCIÓN Y AVANCE POR PROGRAMA          */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GRÁFICO REAL 1: DISTRIBUCIÓN DE ESTADOS DE LAS 34 METAS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-black text-blue-950 text-sm flex items-center gap-2">
              <PieChart size={18} className="text-emerald-600" />
              Distribución de Estados ({totalMetas} Indicadores Oficiales)
            </h4>
            <span className="text-xs font-bold bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg">
              Corte {corte ? `N° ${corte}` : 'Acumulado'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center py-2">
            {/* Gráfico de Dona CSS Proporcional con Datos Reales */}
            <div className="flex flex-col items-center justify-center">
              <div 
                className="w-36 h-36 rounded-full flex items-center justify-center relative shadow-inner p-2.5"
                style={{
                  background: `conic-gradient(
                    #10b981 0% ${pctCumplen}%, 
                    #f59e0b ${pctCumplen}% ${pctCumplen + pctRiesgo}%, 
                    #ef4444 ${pctCumplen + pctRiesgo}% ${pctCumplen + pctRiesgo + pctNoCumplen}%,
                    #cbd5e1 ${pctCumplen + pctRiesgo + pctNoCumplen}% 100%
                  )`
                }}
              >
                <div className="w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center shadow">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
                  <span className="text-lg font-black text-blue-950">{totalMetas}</span>
                  <span className="text-[9px] text-slate-500 font-semibold">Metas</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 mt-2 font-medium">Distribución porcentual en vivo</span>
            </div>

            {/* Leyenda y Datos Reales */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <span className="flex items-center gap-2 font-bold text-emerald-900">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shrink-0"></span>
                  Cumplen (≥100%)
                </span>
                <span className="font-black text-emerald-950">{cumplen} ({pctCumplen}%)</span>
              </div>

              <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-amber-50/70 border border-amber-100">
                <span className="flex items-center gap-2 font-bold text-amber-900">
                  <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shrink-0"></span>
                  En Riesgo (80-99%)
                </span>
                <span className="font-black text-amber-950">{enRiesgo} ({pctRiesgo}%)</span>
              </div>

              <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-rose-50/70 border border-rose-100">
                <span className="flex items-center gap-2 font-bold text-rose-900">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shrink-0"></span>
                  No Cumplen (&lt;80%)
                </span>
                <span className="font-black text-rose-950">{noCumplen} ({pctNoCumplen}%)</span>
              </div>

              {sinDatos > 0 && (
                <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="flex items-center gap-2 font-bold text-slate-600">
                    <span className="w-3 h-3 rounded-full bg-slate-400 inline-block shrink-0"></span>
                    Sin Configurar / Datos
                  </span>
                  <span className="font-black text-slate-700">{sinDatos}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* GRÁFICO REAL 2: AVANCE REAL POR PROGRAMAS CLAVE */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-black text-blue-950 text-sm flex items-center gap-2">
              <BarChart2 size={18} className="text-blue-600" />
              Avance Real por Programas ({area})
            </h4>
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
              Año {anio}
            </span>
          </div>

          <div className="space-y-3.5 pt-1">
            {avanceProgramas.map((prog, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 truncate max-w-[260px]" title={prog.nombre}>
                    {prog.nombre}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-blue-950 tabular-nums">{prog.avance}%</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      prog.avance >= 90 ? 'bg-emerald-100 text-emerald-800' :
                      prog.avance >= 80 ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {prog.estado}
                    </span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${prog.color}`} 
                    style={{ width: `${Math.min(100, Math.max(0, prog.avance))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 3. SEMÁFORO Y ALERTAS DE GESTIÓN (AUTOMÁTICAS CON DATOS REALES)*/}
      {/* ============================================================== */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="font-black text-blue-950 text-sm flex items-center gap-2">
            <Activity size={18} className="text-blue-600" />
            Alertas Tempranas del Semáforo Directivo
          </h4>
          <span className="text-xs font-bold bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg">
            Generadas desde PostgreSQL
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Alerta Verde */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
              <CheckCircle size={16} className="text-emerald-600 shrink-0" />
              <span>{metasOptimas.length} Indicadores en Nivel Óptimo</span>
            </div>
            <p className="text-xs text-emerald-800">
              Las metas con cumplimiento $\ge 100\%$ aseguran la continuidad de tramo en IAAPS y la cobertura asistencial requerida por el Servicio de Salud.
            </p>
          </div>

          {/* Alerta Amarilla */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <AlertTriangle size={16} className="text-amber-600 shrink-0" />
              <span>{metasEnAlerta.length} Metas en Alerta Preventiva</span>
            </div>
            <p className="text-xs text-amber-800">
              {metasEnAlerta.length > 0 ? (
                `Indicadores como ${metasEnAlerta.slice(0, 3).map(m => m.codigo).join(', ')} se encuentran entre el 80% y 99%. Requieren refuerzo operativo.`
              ) : (
                'No hay indicadores en riesgo intermedio actualmente.'
              )}
            </p>
          </div>

          {/* Alerta Roja */}
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{metasCriticas.length} Indicadores en Nivel Crítico</span>
            </div>
            <p className="text-xs text-rose-800">
              {metasCriticas.length > 0 ? (
                `Prioridad para Dirección: ${metasCriticas.slice(0, 3).map(m => m.codigo).join(', ')} presentan avance menor al 80%. Riesgo de penalización.`
              ) : (
                'Excelente: No se registran indicadores en nivel crítico en el corte evaluativo.'
              )}
            </p>
          </div>

        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. TABLA EJECUTIVA DE INDICADORES CON SEMÁFORO                 */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-0">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-900">
              <Layers size={20} />
            </div>
            <div>
              <h4 className="font-black text-blue-950 text-sm">
                Matriz de Metas e Indicadores ({metasFiltradas.length} de {totalMetas} cargados)
              </h4>
              <p className="text-xs text-slate-500">
                Semáforos por indicador calculados contra las metas oficiales anuales. Haz clic para inspeccionar el REM.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-lg self-start sm:self-center">
            Sector: {area}
          </span>
        </div>

        {cargando ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <RefreshCw size={36} className="animate-spin text-blue-900" />
            <p className="text-xs font-bold">Calculando indicadores con datos reales PostgreSQL...</p>
          </div>
        ) : metasFiltradas.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-400 space-y-2 p-6">
            <BarChart3 size={36} className="text-slate-300" />
            <p className="text-sm font-semibold">No se encontraron indicadores para el filtro actual.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Cód.</th>
                  <th className="py-3 px-4">Indicador / Meta Sanitaria</th>
                  <th className="py-3 px-4">Sección</th>
                  <th className="py-3 px-4">N / D</th>
                  <th className="py-3 px-4">Meta</th>
                  <th className="py-3 px-4">Resultado</th>
                  <th className="py-3 px-4">Cumplimiento (%)</th>
                  <th className="py-3 px-4 text-center">Semáforo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {metasFiltradas.map((r) => {
                  const pct = r.cumplimiento_pct ? parseFloat(r.cumplimiento_pct) : null;
                  const colorBarra = pct === null ? 'bg-slate-300' : pct >= 100 ? 'bg-emerald-500' : pct >= 80 ? 'bg-amber-400' : 'bg-rose-500';

                  return (
                    <tr 
                      key={r.indicador} 
                      onClick={() => setIndicadorModal(r)}
                      className="hover:bg-blue-50/50 transition cursor-pointer group"
                      title="Haz clic para ver coordenadas de hojas REM y cálculo ministerial"
                    >
                      <td className="py-3 px-4 font-bold text-blue-950 whitespace-nowrap group-hover:text-blue-600">
                        {r.codigo}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 max-w-[280px] truncate" title={r.nombre}>
                          {r.nombre}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {r.meta_codigo} {r.programa ? `· ${r.programa}` : ''} {r.ponderacion ? `· Pondera ${r.ponderacion}%` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-600 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {r.seccion}
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
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${colorBarra}`} 
                              style={{ width: `${Math.min(100, Math.max(0, pct || 0))}%` }} 
                            />
                          </div>
                          <span className="text-xs font-black text-slate-700 tabular-nums w-12 text-right">
                            {pct !== null ? `${pct.toFixed(1)}%` : '—'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${
                          r.estado === 'CUMPLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          r.estado === 'EN_RIESGO' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          r.estado === 'NO_CUMPLE' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                          'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            r.estado === 'CUMPLE' ? 'bg-emerald-500' :
                            r.estado === 'EN_RIESGO' ? 'bg-amber-500' :
                            r.estado === 'NO_CUMPLE' ? 'bg-rose-500' :
                            'bg-slate-400'
                          }`} />
                          {r.estado === 'CUMPLE' ? 'Cumple' :
                           r.estado === 'EN_RIESGO' ? 'En riesgo' :
                           r.estado === 'NO_CUMPLE' ? 'No cumple' : 'Sin meta'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
