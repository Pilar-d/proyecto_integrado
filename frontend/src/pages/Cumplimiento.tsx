// frontend/src/pages/Cumplimiento.tsx
import { useEffect, useState } from 'react';
import api from '../api/axios';
import { BarChart3, RefreshCw, TrendingUp, TrendingDown, Minus, Info, Calendar } from 'lucide-react';
import ModalDetalleIndicador from '../components/ModalDetalleIndicador';

interface ResultadoCalc {
  indicador: number;
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
  estado: 'CUMPLE' | 'EN_RIESGO' | 'NO_CUMPLE' | 'SIN_META' | 'SIN_CONFIGURAR' | 'NO_CALCULABLE';
  meses_con_datos: number[];
  errores: string[];
}

const SECCIONES_ORDEN = ['RISS', 'PRODUCCION', 'IMPACTO', 'COMUNAL'];
const SECCIONES_LABEL: Record<string, string> = {
  RISS: 'Estrategia RISS',
  PRODUCCION: 'Producción',
  IMPACTO: 'Impacto',
  COMUNAL: 'Metas Sanitarias Comunales',
};

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
  SIN_META: 'Sin meta definida',
  SIN_CONFIGURAR: 'Sin configurar',
  NO_CALCULABLE: 'Faltan datos',
};

function BadgeEstado({ estado }: { estado: string }) {
  const conf = ESTADO_BADGE[estado] || ESTADO_BADGE.SIN_META;
  const Icono = conf.icono === 'up' ? TrendingUp : conf.icono === 'down' ? TrendingDown
    : conf.icono === 'mid' ? Minus : Info;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${conf.cls}`}>
      <Icono size={13} />
      {ESTADO_LABEL[estado] || estado}
    </span>
  );
}

function BarraCumplimiento({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-slate-300">—</span>;
  const ancho = Math.min(100, Math.max(0, pct));
  const color = pct >= 100 ? 'bg-emerald-500' : pct >= 80 ? 'bg-amber-400' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${ancho}%` }} />
      </div>
      <span className="text-xs font-black text-slate-700 tabular-nums w-12 text-right">{pct.toFixed(0)}%</span>
    </div>
  );
}

export default function Cumplimiento({ titulo = 'Reportes de Cumplimiento', compacto = false }: {
  titulo?: string; compacto?: boolean;
}) {
  const [indicadorSeleccionado, setIndicadorSeleccionado] = useState<ResultadoCalc | null>(null);
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [corte, setCorte] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [resultados, setResultados] = useState<ResultadoCalc[]>([]);
  const [meses, setMeses] = useState<number>(12);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const cargar = async () => {
    setCargando(true);
    setError('');
    try {
      const res = await api.get('param/calc/', {
        params: { 
          anio, 
          ...(corte ? { corte } : {}),
          ...(fechaInicio ? { fecha_inicio: fechaInicio } : {}),
          ...(fechaFin ? { fecha_fin: fechaFin } : {})
        },
      });
      setResultados(res.data.resultados);
      setMeses(res.data.hasta_mes || 12);
    } catch {
      setError('No se pudo calcular el cumplimiento. Verifique que haya REM cargados.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [anio, corte, fechaInicio, fechaFin]);

  const agrupados = SECCIONES_ORDEN
    .map((s) => ({ seccion: s, items: resultados.filter((r) => r.seccion === s) }))
    .filter((g) => g.items.length > 0);

  const resumen = {
    cumple: resultados.filter((r) => r.estado === 'CUMPLE').length,
    riesgo: resultados.filter((r) => r.estado === 'EN_RIESGO').length,
    nocumple: resultados.filter((r) => r.estado === 'NO_CUMPLE').length,
  };

  return (
    <div className="w-full min-h-full bg-white p-6 md:p-8 space-y-6">
      
      {/* Cabecera del Módulo Centrada y sin icono */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex flex-col items-center text-center space-y-1">
          <h3 className="text-xl font-black text-blue-950">{titulo}</h3>
          <p className="text-sm font-medium text-slate-500 max-w-2xl">
            Indicadores calculados automáticamente desde los REM cargados, según la parametrización de metas vigente.
          </p>
        </div>
      </div>

      {/* Buscador de Fechas (Inputs de tipo fecha bajo el título) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase">
          <Calendar size={16} className="text-blue-950" />
          <span>Filtrar por Rango de Fechas:</span>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <label className="text-xs font-semibold text-slate-500">Desde:</label>
            <input 
              type="date" 
              value={fechaInicio} 
              onChange={(e) => setFechaInicio(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs font-semibold text-slate-800 focus:border-blue-900 focus:outline-none" 
            />
          </div>
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <label className="text-xs font-semibold text-slate-500">Hasta:</label>
            <input 
              type="date" 
              value={fechaFin} 
              onChange={(e) => setFechaFin(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs font-semibold text-slate-800 focus:border-blue-900 focus:outline-none" 
            />
          </div>
          {(fechaInicio || fechaFin) && (
            <button 
              onClick={() => { setFechaInicio(''); setFechaFin(''); }} 
              className="text-xs font-bold text-rose-600 hover:underline px-2 py-1 cursor-pointer"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-orange-50 text-orange-900 border border-orange-200 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Resumen rápido */}
      {!compacto && resultados.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Cumplen', valor: resumen.cumple, cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
            { label: 'En riesgo', valor: resumen.riesgo, cls: 'text-amber-600 bg-amber-50 border-amber-200' },
            { label: 'No cumplen', valor: resumen.nocumple, cls: 'text-rose-600 bg-rose-50 border-rose-200' },
            { label: 'Meses con REM', valor: meses >= 12 ? '12' : `≤ ${meses}`, cls: 'text-blue-950 bg-blue-50 border-blue-200' },
          ].map((k) => (
            <div key={k.label} className={`rounded-2xl border p-4 ${k.cls}`}>
              <div className="text-3xl font-black">{k.valor}</div>
              <div className="text-xs font-bold uppercase tracking-wider mt-1">{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {agrupados.length === 0 && !cargando && (
        <div className="h-40 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
          <BarChart3 size={36} className="text-slate-300 mb-3" />
          <p className="text-sm font-semibold">Sin resultados para {anio}{corte ? ` (corte ${corte})` : ''}.</p>
        </div>
      )}

      {/* Tablas por sección */}
      {agrupados.map((grupo) => (
        <div key={grupo.seccion} className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-widest text-blue-950">
            {SECCIONES_LABEL[grupo.seccion] || grupo.seccion}
          </h4>
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Ind.</th>
                    <th className="py-2.5 px-4">Detalle</th>
                    <th className="py-2.5 px-4">N / D</th>
                    <th className="py-2.5 px-4">Meta</th>
                    <th className="py-2.5 px-4">Resultado</th>
                    <th className="py-2.5 px-4">Cumplimiento</th>
                    <th className="py-2.5 px-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {grupo.items.map((r) => (
                    <tr 
                      key={`${r.indicador}`} 
                      onClick={() => setIndicadorSeleccionado(r)}
                      className="hover:bg-blue-50/50 transition cursor-pointer"
                      title="Haz clic para ver el desglose y celdas REM"
                    >
                      <td className="py-3 px-4 font-bold text-blue-950 whitespace-nowrap">{r.codigo}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 max-w-[260px] truncate" title={r.nombre}>{r.nombre}</div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {r.meta_codigo}
                          {r.programa ? ` · ${r.programa}` : ''}
                          {r.ponderacion ? ` · ${r.ponderacion}%` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 font-medium tabular-nums whitespace-nowrap">
                        {r.estado === 'SIN_CONFIGURAR' ? '—'
                          : `${r.numerador}${r.denominador !== null ? ` / ${r.denominador}` : ''}`}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700 tabular-nums">{r.meta_valor ?? '—'}</td>
                      <td className="py-3 px-4 font-black text-blue-950 tabular-nums">
                        {r.resultado !== null
                          ? `${r.resultado}${r.forma_calculo === 'PORCENTAJE' ? '%' : ''}`
                          : '—'}
                      </td>
                      <td className="py-3 px-4"><BarraCumplimiento {...(r.cumplimiento_pct !== null ? { pct: parseFloat(r.cumplimiento_pct) } : { pct: null })} /></td>
                      <td className="py-3 px-4"><BadgeEstado estado={r.estado} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}

      {resultados.some((r) => r.errores.length > 0) && (
        <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-xs text-orange-900">
          <p className="font-bold mb-1">Advertencias del cálculo:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {resultados.flatMap((r) => r.errores.slice(0, 2).map((e) => <li key={`${r.indicador}-${e}`}>{r.codigo}: {e}</li>))}
          </ul>
        </div>
      )}

      {/* Modal de Detalle de Indicador */}
      <ModalDetalleIndicador 
        isOpen={Boolean(indicadorSeleccionado)} 
        onClose={() => setIndicadorSeleccionado(null)} 
        indicador={indicadorSeleccionado} 
      />

    </div>
  );
}