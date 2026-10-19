import { useState } from 'react';
import { History, TrendingUp, TrendingDown, Download, BarChart2 } from 'lucide-react';
import api from '../api/axios';

interface ComparativaIndicador {
  codigo: string;
  nombre: string;
  programa: string;
  anioAnterior: number; // Ej: 2025
  anioActual: number;   // Ej: 2026
  variacion: number;    // % de diferencia
}

export default function ReporteHistorico() {
  const [anioBase, setAnioBase] = useState('2025');
  const [anioComparacion, setAnioComparacion] = useState('2026');
  const [area, setArea] = useState('Todos');
  const [cargando, setCargando] = useState(false);

  // Datos simulados/estructurados para el reporte comparativo histórico
  const datosComparativos: ComparativaIndicador[] = [
    { codigo: 'IND-01', nombre: 'Control de Salud Cardiovascular al Día', programa: 'Cardiovascular', anioAnterior: 82.5, anioActual: 91.0, variacion: 8.5 },
    { codigo: 'IND-02', nombre: 'Papanicolau (PAP) Vigente en Mujeres 25-64', programa: 'Programa de la Mujer', anioAnterior: 74.0, anioActual: 78.5, variacion: 4.5 },
    { codigo: 'IND-03', nombre: 'Evaluación Anual del Adulto Mayor (EMPAM)', programa: 'Adulto Mayor', anioAnterior: 88.0, anioActual: 85.2, variacion: -2.8 },
    { codigo: 'IND-04', nombre: 'Trazadora Odontológica GES 6 Años', programa: 'Odontología', anioAnterior: 90.5, anioActual: 95.0, variacion: 4.5 },
    { codigo: 'IND-05', nombre: 'Vacunación Campaña Influenza Grupos Objetivo', programa: 'Inmunizaciones', anioAnterior: 96.0, anioActual: 94.8, variacion: -1.2 },
  ];

  const exportarComparativo = () => {
    alert(`Exportando reporte comparativo histórico: ${anioBase} vs ${anioComparacion}`);
  };

  return (
    <div className="w-full min-h-full bg-slate-50 p-6 md:p-8 space-y-6">
      
      {/* Cabecera del Módulo Centrada */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex flex-col items-center text-center space-y-1">
          <h3 className="text-xl font-black text-blue-950">Reporte Comparativo Histórico</h3>
          <p className="text-sm font-medium text-slate-500 max-w-2xl">
            Análisis de evolución interanual y deltas de cumplimiento entre períodos evaluativos.
          </p>
        </div>
        <button 
          onClick={exportarComparativo}
          className="flex items-center gap-2 bg-blue-950 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow hover:bg-blue-900 transition cursor-pointer shrink-0"
        >
          <Download size={16} /> Exportar Comparativo
        </button>
      </div>

      {/* Filtros de Años a Comparar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Año Base (Referencia)</label>
          <select 
            value={anioBase} 
            onChange={(e) => setAnioBase(e.target.value)} 
            className="w-full rounded-xl border border-slate-300 p-2.5 text-sm bg-slate-50 font-semibold focus:outline-none"
          >
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Año a Comparar (Actual)</label>
          <select 
            value={anioComparacion} 
            onChange={(e) => setAnioComparacion(e.target.value)} 
            className="w-full rounded-xl border border-slate-300 p-2.5 text-sm bg-slate-50 font-semibold focus:outline-none"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Filtrar por Área / Sector</label>
          <select 
            value={area} 
            onChange={(e) => setArea(e.target.value)} 
            className="w-full rounded-xl border border-slate-300 p-2.5 text-sm bg-slate-50 font-semibold focus:outline-none"
          >
            <option value="Todos">Todos los Sectores</option>
            <option value="Sector Verde">Sector Verde</option>
            <option value="Sector Azul">Sector Azul</option>
            <option value="Sector Amarillo">Sector Amarillo</option>
          </select>
        </div>
      </div>

      {/* Tarjetas Resumen de Tendencia */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Indicadores con Mejora</span>
            <TrendingUp className="text-emerald-500" size={24} />
          </div>
          <h4 className="text-3xl font-black text-blue-950">
            {datosComparativos.filter(d => d.variacion > 0).length} <span className="text-xs font-semibold text-slate-400">indicadores</span>
          </h4>
          <p className="text-xs text-emerald-600 font-bold">Tendencia positiva general</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Indicadores en Descenso</span>
            <TrendingDown className="text-rose-500" size={24} />
          </div>
          <h4 className="text-3xl font-black text-blue-950">
            {datosComparativos.filter(d => d.variacion < 0).length} <span className="text-xs font-semibold text-slate-400">indicadores</span>
          </h4>
          <p className="text-xs text-rose-600 font-bold">Requieren plan de refuerzo</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Variación Promedio Global</span>
            <BarChart2 className="text-blue-600" size={24} />
          </div>
          <h4 className="text-3xl font-black text-blue-950">+3.1%</h4>
          <p className="text-xs text-blue-600 font-bold">Comparado con {anioBase}</p>
        </div>
      </div>

      {/* Tabla Comparativa Histórica */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-4">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-black text-blue-950 text-sm">Detalle de Deltas por Indicador ({anioBase} vs {anioComparacion})</h4>
        </div>

        <div className="overflow-x-auto p-6 pt-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Indicador / Programa</th>
                <th className="py-3 px-4 text-center">{anioBase} (%)</th>
                <th className="py-3 px-4 text-center">{anioComparacion} (%)</th>
                <th className="py-3 px-4 text-right">Variación (Delta)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {datosComparativos.map((item) => (
                <tr key={item.codigo} className="hover:bg-slate-50/50 transition">
                  <td className="py-3 px-4 font-bold text-blue-950">{item.codigo}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{item.nombre}</div>
                    <div className="text-[11px] text-slate-400 font-medium">{item.programa}</div>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-600 tabular-nums">{item.anioAnterior}%</td>
                  <td className="py-3 px-4 text-center font-black text-blue-950 tabular-nums">{item.anioActual}%</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${item.variacion >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {item.variacion >= 0 ? '+' : ''}{item.variacion}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}