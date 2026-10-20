import React, { useState } from 'react';
import { Filter, Download, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';

export default function DashboardDirectora() {
  const [area, setArea] = useState('Sector Verde');
  const [anio, setAnio] = useState('2026');
  const [fechaInicio, setFechaInicio] = useState('2026-01-01');
  const [fechaFin, setFechaFin] = useState('2026-10-31');

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
            Visualización de cumplimiento de metas IAAPS y Ley 19.813.
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
          <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full rounded-xl border border-slate-300 p-2.5 text-sm bg-slate-50 font-semibold focus:outline-none">
            <option value="Sector Verde">Sector Verde</option>
            <option value="Sector Azul">Sector Azul</option>
            <option value="Sector Amarillo">Sector Amarillo</option>
            <option value="SAPU / Urgencias">SAPU / Urgencias</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Año de Evaluación</label>
          <select value={anio} onChange={(e) => setAnio(e.target.value)} className="w-full rounded-xl border border-slate-300 p-2.5 text-sm bg-slate-50 font-semibold focus:outline-none">
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Fecha Desde</label>
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full rounded-xl border border-slate-300 p-2 text-sm bg-slate-50 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Fecha Hasta</label>
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full rounded-xl border border-slate-300 p-2 text-sm bg-slate-50 focus:outline-none" />
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

    </div>
  );
}