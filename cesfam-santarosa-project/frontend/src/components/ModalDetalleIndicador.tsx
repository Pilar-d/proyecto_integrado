import React from 'react';
import { X, FileText, CheckCircle2, TrendingUp, HelpCircle } from 'lucide-react';

interface DetalleIndicadorProps {
  isOpen: boolean;
  onClose: () => void;
  indicador: {
    codigo: string;
    nombre: string;
    meta_codigo: string;
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
    estado: string;
  } | null;
}

export default function ModalDetalleIndicador({ isOpen, onClose, indicador }: DetalleIndicadorProps) {
  if (!isOpen || !indicador) return null;

  // Datos simulados de evolución mensual (pueden conectarse a tu API de detalle por mes)
  const mesesEvolucion = [
    { mes: 'Ene', num: 120, den: 150, pct: 80 },
    { mes: 'Feb', num: 135, den: 150, pct: 90 },
    { mes: 'Mar', num: 140, den: 150, pct: 93 },
    { mes: 'Abr', num: 145, den: 160, pct: 90 },
    { mes: 'May', num: 150, den: 160, pct: 93 },
    { mes: 'Jun', num: 155, den: 165, pct: 93 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-6 py-5 bg-blue-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-900 text-lime-400 font-black text-sm">
              {indicador.codigo}
            </div>
            <div>
              <h3 className="text-base font-black truncate max-w-md">{indicador.nombre}</h3>
              <p className="text-xs text-slate-300 font-medium">
                {indicador.meta_codigo} {indicador.programa ? `· ${indicador.programa}` : ''}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo del Modal con Scroll */}
        <div className="p-6 space-y-6 overflow-y-auto bg-slate-50 flex-1">
          
          {/* Tarjetas de Resumen del Indicador */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Meta Definida</span>
              <p className="text-xl font-black text-blue-950 mt-1">{indicador.meta_valor ?? '—'}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Resultado Actual</span>
              <p className="text-xl font-black text-blue-950 mt-1">
                {indicador.resultado !== null ? `${indicador.resultado}${indicador.forma_calculo === 'PORCENTAJE' ? '%' : ''}` : '—'}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">% Cumplimiento</span>
              <p className={`text-xl font-black mt-1 ${parseFloat(indicador.cumplimiento_pct || '0') >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {indicador.cumplimiento_pct ? `${parseFloat(indicador.cumplimiento_pct).toFixed(1)}%` : '—'}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Ponderación IAAPS</span>
              <p className="text-xl font-black text-blue-950 mt-1">{indicador.ponderacion ? `${indicador.ponderacion}%` : 'N/A'}</p>
            </div>
          </div>

          {/* Origen de Celdas REM (Numerador y Denominador) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase text-blue-950 tracking-wider flex items-center gap-2">
              <FileText size={16} className="text-blue-600" />
              Trazabilidad y Origen de Celdas REM
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Numerador (Fórmula / Celdas)</span>
                <p className="font-semibold text-slate-800 bg-white p-2 rounded-lg border border-slate-200">
                  {indicador.numerador || 'Sin numerador especificado'}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Denominador (Fórmula / Celdas)</span>
                <p className="font-semibold text-slate-800 bg-white p-2 rounded-lg border border-slate-200">
                  {indicador.denominador || 'Sin denominador (Indicador de conteo directo)'}
                </p>
              </div>
            </div>
          </div>

          {/* Desglose de Evolución Mensual */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase text-blue-950 tracking-wider flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-600" />
              Evolución Mensual del Indicador
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase">
                    <th className="py-2 px-3">Mes</th>
                    <th className="py-2 px-3">Numerador</th>
                    <th className="py-2 px-3">Denominador</th>
                    <th className="py-2 px-3">Avance Mensual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mesesEvolucion.map((m) => (
                    <tr key={m.mes} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-blue-950">{m.mes}</td>
                      <td className="py-2 px-3 text-slate-600 font-semibold">{m.num}</td>
                      <td className="py-2 px-3 text-slate-600 font-semibold">{m.den}</td>
                      <td className="py-2 px-3 font-black text-emerald-600">{m.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Pie del Modal */}
        <div className="flex items-center justify-end px-6 py-4 bg-white border-t border-slate-200 shrink-0">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 rounded-xl bg-blue-950 text-white font-bold text-xs shadow hover:bg-blue-900 transition cursor-pointer"
          >
            Cerrar Detalle
          </button>
        </div>

      </div>
    </div>
  );
}