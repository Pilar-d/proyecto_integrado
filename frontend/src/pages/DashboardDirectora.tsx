import React, { useState } from 'react';
import { Download, CheckCircle, AlertTriangle, TrendingUp, BarChart2, Activity, ShieldCheck, PieChart, LineChart } from 'lucide-react';

export default function DashboardDirectora() {
  const [area, setArea] = useState('Sector Verde');
  const [anio, setAnio] = useState('2026');
  const [fechaInicio, setFechaInicio] = useState('2026-01-01');
  const [fechaFin, setFechaFin] = useState('2026-10-31');

  // Datos simulados de cumplimiento por programa
  const programasCumplimiento = [
    { nombre: 'Salud Cardiovascular (GES / Hipertensión)', avance: 94.5, meta: 90, estado: 'Óptimo' },
    { nombre: 'Programa de la Mujer (PAP y Mamografías)', avance: 82.0, meta: 85, estado: 'En Alerta' },
    { nombre: 'Salud Infantil y Vacunatorio', avance: 98.2, meta: 95, estado: 'Óptimo' },
    { nombre: 'Programa Adulto Mayor (EMPAM)', avance: 88.7, meta: 85, estado: 'Óptimo' },
    { nombre: 'Atención Odontológica GES 6 Años', avance: 76.4, meta: 80, estado: 'Crítico' },
  ];

  // Datos simulados para el gráfico de líneas (Evolución Ene - Oct)
  const evolucionMensual = [
    { mes: 'Ene', pct: 70 },
    { mes: 'Feb', pct: 74 },
    { mes: 'Mar', pct: 78 },
    { mes: 'Abr', pct: 82 },
    { mes: 'May', pct: 85 },
    { mes: 'Jun', pct: 84 },
    { mes: 'Jul', pct: 88 },
    { mes: 'Ago', pct: 90 },
    { mes: 'Sep', pct: 92.4 },
    { mes: 'Oct', pct: 91.5 },
  ];

  const exportarInformacion = () => {
    alert(`Exportando reporte institucional consolidado para el área: ${area} (${anio})`);
  };

  return (
    <div className="w-full min-h-full bg-slate-50 p-6 md:p-8 space-y-6">
      
      {/* Cabecera del Módulo Centrada y sin icono */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center space-y-4">
        <div className="space-y-1 max-w-2xl">
          <h3 className="text-xl font-black text-blue-950">Panel Directivo - Monitoreo Global de Metas</h3>
          <p className="text-sm font-medium text-slate-500">
            Visualización interactiva y gráficos analíticos del cumplimiento de metas IAAPS y Ley 19.813 en el CESFAM Santa Rosa.
          </p>
        </div>
        <button 
          onClick={exportarInformacion} 
          className="flex items-center gap-2 bg-blue-950 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow hover:bg-blue-900 transition cursor-pointer"
        >
          <Download size={16} /> Exportar Reporte Consolidado
        </button>
      </div>

      {/* Input Selector de Área, Año y Fechas Específicas */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Seleccionar Área / Sector</label>
          <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full rounded-xl border border-slate-300 p-2.5 text-sm bg-slate-50 font-semibold focus:outline-none cursor-pointer">
            <option value="Sector Verde">Sector Verde</option>
            <option value="Sector Azul">Sector Azul</option>
            <option value="Sector Amarillo">Sector Amarillo</option>
            <option value="SAPU / Urgencias">SAPU / Urgencias</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Año de Evaluación</label>
          <select value={anio} onChange={(e) => setAnio(e.target.value)} className="w-full rounded-xl border border-slate-300 p-2.5 text-sm bg-slate-50 font-semibold focus:outline-none cursor-pointer">
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Fecha Desde</label>
          <input 
            type="date" 
            value={fechaInicio} 
            onChange={(e) => setFechaInicio(e.target.value)} 
            className="w-full rounded-xl border border-slate-300 p-2 text-sm bg-slate-50 focus:outline-none cursor-pointer relative [&::-webkit-calendar-picker-indicator]:cursor-pointer" 
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Fecha Hasta</label>
          <input 
            type="date" 
            value={fechaFin} 
            onChange={(e) => setFechaFin(e.target.value)} 
            className="w-full rounded-xl border border-slate-300 p-2 text-sm bg-slate-50 focus:outline-none cursor-pointer relative [&::-webkit-calendar-picker-indicator]:cursor-pointer" 
          />
        </div>
      </div>

      {/* Tarjetas de Semáforo de Cumplimiento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Cumplimiento Global IAAPS</span>
            <CheckCircle className="text-emerald-500" size={24} />
          </div>
          <h4 className="text-3xl font-black text-blue-950">92.4%</h4>
          <p className="text-xs text-emerald-600 font-bold">Estado: Óptimo (Corte Septiembre)</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Metas Ley 19.813</span>
            <AlertTriangle className="text-amber-500" size={24} />
          </div>
          <h4 className="text-3xl font-black text-blue-950">78.1%</h4>
          <p className="text-xs text-amber-600 font-bold">Estado: En revisión / Alerta</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Proyección Bonificación</span>
            <TrendingUp className="text-blue-600" size={24} />
          </div>
          <h4 className="text-3xl font-black text-blue-950">Sin Rebaja</h4>
          <p className="text-xs text-slate-500 font-medium">Manteniendo ritmo actual</p>
        </div>
      </div>

      {/* ================= SECCIÓN DE GRÁFICOS VISUALES / FALSOS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Gráfico de Líneas Falso (Evolución Mensual) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-black text-blue-950 text-sm flex items-center gap-2">
              <LineChart size={18} className="text-blue-600" />
              Evolución Porcentual del Cumplimiento (Acumulado 2026)
            </h4>
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
              Tendencia Anual
            </span>
          </div>
          
          <div className="pt-4 pb-2">
            {/* Simulación visual de gráfico de barras / puntos mensuales */}
            <div className="h-44 flex items-end justify-between gap-2 px-2 border-b border-slate-200 pb-2">
              {evolucionMensual.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip flotante al pasar el mouse */}
                  <div className="absolute -top-8 bg-blue-950 text-white text-[10px] font-bold py-1 px-1.5 rounded opacity-0 group-hover:opacity-150 transition pointer-events-none">
                    {item.pct}%
                  </div>
                  <div 
                    className="w-full bg-blue-600 hover:bg-blue-500 rounded-t-md transition-all duration-300"
                    style={{ height: `${item.pct}%` }}
                  />
                  <span className="text-[10px] font-bold text-slate-400 mt-1">{item.mes}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-2 px-1">
              <span>0% (Inicio año)</span>
              <span className="text-emerald-600 font-bold">▲ Meta Objetivo: 85%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* 2. Gráfico Circular Falso (Distribución de Estados de Indicadores) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-black text-blue-950 text-sm flex items-center gap-2">
              <PieChart size={18} className="text-emerald-600" />
              Estado General de los 27 Indicadores (IAAPS + Ley)
            </h4>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg">
              Consolidado
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center py-4">
            {/* Simulación Gráfico de Torta con CSS Donut */}
            <div className="flex justify-center">
              <div className="w-36 h-36 rounded-full border-8 border-slate-100 flex items-center justify-center relative shadow-inner bg-gradient-to-tr from-emerald-500 via-amber-400 to-rose-500 p-2">
                <div className="w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center shadow">
                  <span className="text-xs font-bold text-slate-400 uppercase">Total</span>
                  <span className="text-lg font-black text-blue-950">27 Metas</span>
                </div>
              </div>
            </div>

            {/* Leyenda y Porcentajes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-semibold text-slate-700">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Cumplen (&gt;=100%)
                </span>
                <span className="font-black text-blue-950">18 metas (66%)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-semibold text-slate-700">
                  <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span> En Riesgo (80-99%)
                </span>
                <span className="font-black text-blue-950">6 metas (22%)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-semibold text-slate-700">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span> No Cumplen (&lt;80%)
                </span>
                <span className="font-black text-blue-950">3 metas (12%)</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* SECCIÓN DE BARRAS DE AVANCE POR PROGRAMA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico de Barras por Programa */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-black text-blue-950 text-sm flex items-center gap-2">
              <BarChart2 size={18} className="text-blue-600" />
              Avance por Programas Clave ({area})
            </h4>
            <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">
              Filtro: {anio}
            </span>
          </div>

          <div className="space-y-4">
            {programasCumplimiento.map((prog, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-700 truncate max-w-[280px]" title={prog.nombre}>
                    {prog.nombre}
                  </span>
                  <span className="font-black text-blue-950">{prog.avance}% <span className="text-[10px] text-slate-400 font-normal">(Meta: {prog.meta}%)</span></span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${prog.avance >= prog.meta ? 'bg-emerald-500' : prog.avance >= 80 ? 'bg-amber-400' : 'bg-rose-500'}`} 
                    style={{ width: `${prog.avance}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel de Alertas Tempranas y Semáforo Institucional */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-black text-blue-950 text-sm flex items-center gap-2">
              <Activity size={18} className="text-emerald-600" />
              Semáforo y Alertas de Gestión
            </h4>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg">
              Actualizado hoy
            </span>
          </div>

          <div className="space-y-3.5">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-xs font-black text-emerald-900">Salud Infantil y Cardiovascular sobre el 90%</p>
                <p className="text-xs text-emerald-700 mt-0.5">Los registros REM reflejan un excelente rendimiento en controles preventivos para el corte de septiembre.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-xs font-black text-amber-900">Atención Odontológica GES en Seguimiento</p>
                <p className="text-xs text-amber-700 mt-0.5">Se requiere reforzar las derivaciones de pacientes de 6 años para evitar penalizaciones en la evaluación final.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
              <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-xs font-black text-blue-950">Integridad de REM Serie A Verificada</p>
                <p className="text-xs text-blue-800 mt-0.5">Todas las planillas mensuales de los sectores asignados se encuentran cargadas y auditadas por el sistema.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}