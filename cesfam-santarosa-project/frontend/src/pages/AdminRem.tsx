// frontend/src/pages/AdminRem.tsx
import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Upload, CheckCircle2, FileSpreadsheet, History, RefreshCw } from 'lucide-react';

const MESES = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

interface RemArchivo {
  id: number;
  periodo_mes: number;
  periodo_year: number;
  archivo_nombre: string;
  establecimiento: string;
  hojas_rem: number;
  estado: 'VALIDO' | 'RECHAZADO' | 'REEMPLAZADO';
  observaciones: string;
  fecha_carga: string;
  usuario: string;
}

const ESTADO_ESTILO: Record<string, string> = {
  VALIDO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  RECHAZADO: 'bg-rose-50 text-rose-600 border-rose-200',
  REEMPLAZADO: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function AdminRem() {
  const [file, setFile] = useState<File | null>(null);
  const [periodoMes, setPeriodoMes] = useState('1');
  const [periodoYear, setPeriodoYear] = useState('2026');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [historial, setHistorial] = useState<RemArchivo[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const cargarHistorial = async () => {
    setCargandoHistorial(true);
    try {
      const res = await api.get('rem/archivos/');
      setHistorial(res.data.resultados || []);
    } catch {
      // Si falla la consulta, el historial queda vacío (no bloquea la carga)
    } finally {
      setCargandoHistorial(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('periodo_mes', periodoMes);
    formData.append('periodo_year', periodoYear);

    setLoading(true);
    setMessage(null);

    try {
      const res = await api.post('rem/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const d = res.data;
      setMessage({
        type: 'success',
        text: `${d.mensaje} Período ${d.periodo} · ${d.hojas_rem} hojas REM · ${d.establecimiento}`
          + (d.recarga ? ' (reemplaza la carga anterior)' : ''),
      });
      setFile(null);
      cargarHistorial();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error al procesar el archivo.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-full bg-white p-6 md:p-8 space-y-6">
      
      {/* Cabecera de la sección */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-950 text-lime-400 shadow-md">
            <FileSpreadsheet size={26} />
          </div>
          <div>
            <h3 className="text-xl font-black text-blue-950">Carga y Validación de Reportes REM</h3>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Suba la planilla Serie A oficial (.xlsx / .xlsm). El sistema valida automáticamente
              el período, el establecimiento y las hojas del reporte.
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 border shadow-sm ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : 'bg-orange-50 text-orange-900 border-orange-200'
        }`}>
          <CheckCircle2 size={22} className={`shrink-0 ${message.type === 'success' ? 'text-emerald-600' : 'text-orange-600'}`} />
          <span className="text-sm font-semibold">{message.text}</span>
        </div>
      )}

      {/* Formulario de carga */}
      <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-blue-950 mb-2">Mes del Período</label>
          <select 
            value={periodoMes} 
            onChange={(e) => setPeriodoMes(e.target.value)} 
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-slate-900 text-sm focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 focus:outline-none transition"
          >
            {MESES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-blue-950 mb-2">Año</label>
          <input 
            type="number" 
            value={periodoYear} 
            onChange={(e) => setPeriodoYear(e.target.value)} 
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-slate-900 text-sm focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 focus:outline-none transition" 
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-blue-950 mb-2">Archivo Excel REM (.xlsx / .xlsm)</label>
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-slate-50/50 hover:bg-slate-50 hover:border-blue-900 transition group">
            <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
              <div className="p-3 rounded-full bg-blue-950/5 text-blue-950 group-hover:scale-110 transition-transform mb-2">
                <FileSpreadsheet className="w-8 h-8 text-blue-950" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {file ? <span className="text-blue-950 font-bold">{file.name}</span> : <><span className="text-lime-600 font-bold">Haga clic para seleccionar</span> o arrastre el archivo aquí</>}
              </p>
              <p className="text-xs text-slate-400 mt-1">Formatos permitidos: .xlsx, .xlsm (planilla oficial MINSAL - DEIS)</p>
            </div>
            <input type="file" accept=".xlsx, .xlsm" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        <div className="md:col-span-2 flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={loading || !file} 
            className="flex items-center gap-2 bg-blue-950 text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-950/20 hover:bg-blue-900 focus:ring-4 focus:ring-blue-900/20 transition-all duration-200 border-b-4 border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={18} />
            {loading ? 'Procesando Planilla...' : 'Cargar y Procesar REM'}
          </button>
        </div>
      </form>

      {/* Historial de cargas */}
      <div className="border-t border-slate-100 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 text-blue-950">
              <History size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-blue-950">Historial de Cargas REM</h3>
              <p className="text-xs font-medium text-slate-500">Cargas válidas, reemplazadas y rechazadas, con el funcionario responsable.</p>
            </div>
          </div>
          <button 
            onClick={cargarHistorial}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-xs transition"
          >
            <RefreshCw size={14} className={cargandoHistorial ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4 rounded-l-xl">Período</th>
                <th className="py-3 px-4">Archivo</th>
                <th className="py-3 px-4">Hojas REM</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Funcionario</th>
                <th className="py-3 px-4">Fecha de Carga</th>
                <th className="py-3 px-4 rounded-r-xl">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {historial.length === 0 && !cargandoHistorial && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400 text-sm font-medium">
                    Aún no hay planillas REM cargadas.
                  </td>
                </tr>
              )}
              {historial.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                    {String(r.periodo_mes).padStart(2, '0')}-{r.periodo_year}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium max-w-[240px] truncate">{r.archivo_nombre}</td>
                  <td className="py-3.5 px-4 text-slate-700 font-semibold">{r.hojas_rem || '—'}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold text-xs border ${ESTADO_ESTILO[r.estado] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {r.estado}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium text-xs whitespace-nowrap">{r.usuario}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium text-xs whitespace-nowrap">
                    {new Date(r.fecha_carga).toLocaleString('es-CL')}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium text-xs max-w-[280px] truncate" title={r.observaciones}>
                    {r.observaciones || '—'}
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
