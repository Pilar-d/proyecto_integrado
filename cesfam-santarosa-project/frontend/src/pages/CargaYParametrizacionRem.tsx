import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Settings, CheckCircle2, AlertTriangle, Save, RefreshCw } from 'lucide-react';
import api from '../api/axios';

export default function CargaYParametrizacionRem() {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [error, setError] = useState('');

  // Estados de parametrización de celdas para el procesamiento del Excel
  const [parametros, setParametros] = useState({
    hojaRem: 'REM A24',
    celdaEstablecimiento: 'B4',
    celdaMes: 'C2',
    filaInicioDatos: 12,
    columnaIndicador: 'D'
  });

  const handleParamChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setParametros({
      ...parametros,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
      setError('');
    }
  };

  const handleProcesar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo) {
      setError('Por favor seleccione o arrastre un archivo REM en formato Excel.');
      return;
    }

    setCargando(true);
    setError('');
    setResultado(null);

    const formData = new FormData();
    formData.append('file', archivo);
    formData.append('parametros', JSON.stringify(parametros));

    try {
      // Simulación de procesamiento con parámetros integrados
      setTimeout(() => {
        setResultado({
          status: 'success',
          filename: archivo.name,
          registrosProcesados: 1420,
          establecimiento: 'CESFAM Santa Rosa (210450)',
          periodo: 'Octubre 2026'
        });
        setCargando(false);
      }, 1500);
    } catch (err: any) {
      setError('Error al procesar el archivo REM con las coordenadas especificadas.');
      setCargando(false);
    }
  };

  return (
    <div className="w-full min-h-full bg-slate-50 p-6 md:p-8 space-y-6">
      
      {/* Cabecera del Módulo Centrada y sin icono */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center space-y-2">
        <div className="space-y-1 max-w-2xl">
            <h3 className="text-xl font-black text-blue-950">Carga y Parametrización de Planillas REM</h3>
            <p className="text-sm font-medium text-slate-500">
            Configure las coordenadas del libro Excel y cargue la información oficial del MINSAL para su procesamiento inmediato.
            </p>
        </div>
        </div>

      {error && (
        <div className="rounded-xl bg-orange-50 p-4 text-sm text-orange-800 border border-orange-200 shadow-sm flex items-center gap-2">
          <AlertTriangle size={18} className="shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Parametrización de Celdas (Requisito previo al procesamiento) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5 lg:col-span-1">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Settings size={18} className="text-blue-600" />
            <h4 className="font-bold text-blue-950 text-sm uppercase tracking-wider">Parametrización de Celdas</h4>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nombre de la Hoja Excel</label>
              <input 
                type="text" 
                name="hojaRem" 
                value={parametros.hojaRem} 
                onChange={handleParamChange} 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-semibold text-slate-900 focus:outline-none" 
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Celda Código Establecimiento</label>
              <input 
                type="text" 
                name="celdaEstablecimiento" 
                value={parametros.celdaEstablecimiento} 
                onChange={handleParamChange} 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-semibold text-slate-900 focus:outline-none" 
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Celda Periodo / Mes</label>
              <input 
                type="text" 
                name="celdaMes" 
                value={parametros.celdaMes} 
                onChange={handleParamChange} 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-semibold text-slate-900 focus:outline-none" 
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Fila Inicio Datos</label>
                <input 
                  type="number" 
                  name="filaInicioDatos" 
                  value={parametros.filaInicioDatos} 
                  onChange={handleParamChange} 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-semibold text-slate-900 focus:outline-none" 
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Columna Indicador</label>
                <input 
                  type="text" 
                  name="columnaIndicador" 
                  value={parametros.columnaIndicador} 
                  onChange={handleParamChange} 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-semibold text-slate-900 focus:outline-none" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Zona de Carga y Procesamiento */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6 lg:col-span-2 flex flex-col justify-between">
          
          <form onSubmit={handleProcesar} className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="font-bold text-blue-950 text-sm uppercase tracking-wider">Carga de Archivo REM</h4>
              <p className="text-xs text-slate-500 mt-0.5">El sistema validará el archivo utilizando los parámetros configurados en el panel izquierdo.</p>
            </div>

            {/* Drag & Drop Input */}
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 transition rounded-2xl p-8 text-center bg-slate-50/50 flex flex-col items-center justify-center relative cursor-pointer">
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileChange} 
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
              />
              <Upload size={36} className="text-blue-600 mb-3" />
              <p className="text-sm font-bold text-slate-800">
                {archivo ? archivo.name : 'Haga clic o arrastre su archivo REM aquí'}
              </p>
              <p className="text-xs text-slate-400 mt-1">Formatos compatibles: .xlsx, .xls (Minvu / Minsal)</p>
            </div>

            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={cargando}
                style={{ backgroundColor: '#2e6b46' }}
                className="flex items-center gap-2 text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-md hover:opacity-95 transition cursor-pointer disabled:opacity-50"
              >
                {cargando ? <RefreshCw className="animate-spin" size={18} /> : <Upload size={18} />}
                {cargando ? 'Procesando Planilla...' : 'Procesar Archivo REM'}
              </button>
            </div>
          </form>

          {/* Resultado del Procesamiento */}
          {resultado && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3 mt-4">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 size={20} className="text-emerald-600" />
                Planilla Procesada e Integrada Exitosamente
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-emerald-800 font-medium">
                <p>📁 Archivo: <span className="font-bold">{resultado.filename}</span></p>
                <p>🏥 Establecimiento: <span className="font-bold">{resultado.establecimiento}</span></p>
                <p>📊 Registros: <span className="font-bold">{resultado.registrosProcesados} filas</span></p>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}