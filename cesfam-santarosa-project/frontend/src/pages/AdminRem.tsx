// frontend/src/pages/AdminRem.tsx
import React, { useState } from 'react';
import api from '../api/axios';
import { Upload, CheckCircle2, AlertTriangle, FileSpreadsheet } from 'lucide-react';

export default function AdminRem() {
  const [file, setFile] = useState<File | null>(null);
  const [periodoMes, setPeriodoMes] = useState('08');
  const [periodoYear, setPeriodoYear] = useState('2026');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      await api.post('rem/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage({ type: 'success', text: 'Archivo REM cargado y procesado exitosamente.' });
      setFile(null);
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
              Suba la planilla Excel oficial (.xlsx). El sistema validará automáticamente las celdas y coordenadas.
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
          {message.type === 'success' ? <CheckCircle2 size={22} className="text-emerald-600 shrink-0" /> : <AlertTriangle size={22} className="text-orange-600 shrink-0" />}
          <span className="text-sm font-semibold">{message.text}</span>
        </div>
      )}

      {/* Formulario de carga expandido al 100% */}
      <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-blue-950 mb-2">Mes del Periodo</label>
          <select 
            value={periodoMes} 
            onChange={(e) => setPeriodoMes(e.target.value)} 
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-slate-900 text-sm focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 focus:outline-none transition"
          >
            <option value="08">Agosto</option>
            <option value="09">Septiembre</option>
            <option value="10">Octubre</option>
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
          <label className="block text-xs font-bold uppercase tracking-wider text-blue-950 mb-2">Archivo Excel REM (.xlsx)</label>
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-slate-50/50 hover:bg-slate-50 hover:border-blue-900 transition group">
            <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
              <div className="p-3 rounded-full bg-blue-950/5 text-blue-950 group-hover:scale-110 transition-transform mb-2">
                <FileSpreadsheet className="w-8 h-8 text-blue-950" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {file ? <span className="text-blue-950 font-bold">{file.name}</span> : <><span className="text-lime-600 font-bold">Haga clic para seleccionar</span> o arrastre el archivo aquí</>}
              </p>
              <p className="text-xs text-slate-400 mt-1">Formatos permitidos: .xlsx, .xls</p>
            </div>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="hidden" />
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

    </div>
  );
}