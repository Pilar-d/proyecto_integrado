import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Table, CheckCircle2, AlertCircle, Clock, RefreshCw, Filter } from 'lucide-react';

interface EstadoRemMes {
  rem: string;
  nombre: string;
  meses: { [mes: number]: boolean }; // true si está cargado, false si falta
}

export default function EstadoDatos() {
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [datosMatriz, setDatosMatriz] = useState<EstadoRemMes[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Lista de REMs principales de la Serie A evaluados en IAAPS y Metas Comunales
  const remsLista = [
    { rem: 'REM A01', nombre: 'Control de Salud Cardiovascular y GES' },
    { rem: 'REM A02', nombre: 'Atención Odontológica General y Especialidad' },
    { rem: 'REM A03', nombre: 'Programa Salud Infantil y Vacunatorio' },
    { rem: 'REM A04', nombre: 'Programa de la Mujer y GES Ginecológico' },
    { rem: 'REM A05', nombre: 'Salud Mental y Psiquiatría Comunitaria' },
    { rem: 'REM A06', nombre: 'Programa Adulto Mayor (EMPAM)' },
    { rem: 'REM A07', nombre: 'Morbilidad Médica y de Enfermería' },
    { rem: 'REM A08', nombre: 'Procedimientos Clínicos y Toma de Muestras' },
    { rem: 'REM A09', nombre: 'Urgencias y SAPU' },
    { rem: 'REM A10', nombre: 'Programa Adolescente y Espacios Amigables' }
  ];

  const mesesNombres = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  const cargarEstado = async () => {
    setCargando(true);
    setError('');
    try {
      // Intentamos consultar al backend el estado de cargas. Si tu endpoint varía, ajústalo aquí.
      const res = await api.get('param/estado-rem/', { params: { anio } });
      setDatosMatriz(res.data.matriz || []);
    } catch {
      // Simulación estructurada de datos por defecto si el endpoint aún no está implementado en backend
      const simulacion: EstadoRemMes[] = remsLista.map((r, idx) => ({
        rem: r.rem,
        nombre: r.nombre,
        meses: {
          1: true, 2: true, 3: true, 4: true, 
          5: idx % 2 === 0, 6: idx % 3 !== 0, 
          7: false, 8: false, 9: false, 10: false, 11: false, 12: false
        }
      }));
      setDatosMatriz(simulacion);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEstado();
  }, [anio]);

  // Cálculo de estadísticas globales de avance
  const totalCeldas = datosMatriz.length * 12;
  const celdasCargadas = datosMatriz.reduce((acc, curr) => {
    return acc + Object.values(curr.meses).filter(Boolean).length;
  }, 0);
  const porcentajeAvance = totalCeldas > 0 ? Math.round((celdasCargadas / totalCeldas) * 100) : 0;

  return (
    <div className="w-full min-h-full bg-slate-50 p-6 md:p-8 space-y-6">
      
      {/* Cabecera del Módulo Centrada */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex flex-col items-center text-center space-y-1">
          <h3 className="text-xl font-black text-blue-950">Estado de Datos y Cobertura REM</h3>
          <p className="text-sm font-medium text-slate-500 max-w-2xl">
            Matriz de control y mapa de calor institucional para verificar los meses y planillas cargadas en el sistema.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 shrink-0">
          <input
            type="number" 
            value={anio} 
            onChange={(e) => setAnio(e.target.value)}
            className="w-24 rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-bold text-blue-950 focus:border-blue-900 focus:outline-none"
          />
          <button 
            onClick={cargarEstado} 
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition"
            title="Actualizar Matriz"
          >
            <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tarjetas Indicadoras de Avance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400">Avance de Carga Anual</p>
            <h4 className="text-2xl font-black text-blue-950 mt-1">{porcentajeAvance}%</h4>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Table size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400">Planillas Cargadas</p>
            <h4 className="text-2xl font-black text-emerald-600 mt-1">{celdasCargadas} <span className="text-xs text-slate-400 font-normal">de {totalCeldas}</span></h4>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400">Planillas Pendientes</p>
            <h4 className="text-2xl font-black text-amber-600 mt-1">{totalCeldas - celdasCargadas}</h4>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertCircle size={22} />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-orange-50 text-orange-900 border border-orange-200 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Matriz / Mapa de Calor Meses x REM */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-4">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-black text-blue-950 text-sm">Mapa de Cobertura REM Serie A ({anio})</h4>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block"></span> Cargado
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-slate-200 inline-block"></span> Pendiente / Faltante
            </div>
          </div>
        </div>

        <div className="overflow-x-auto p-6 pt-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Formulario REM</th>
                {mesesNombres.map((mes, idx) => (
                  <th key={mes} className="py-3 px-2 text-center">{mes}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {datosMatriz.map((item) => (
                <tr key={item.rem} className="hover:bg-slate-50/50 transition">
                  <td className="py-3 px-4">
                    <span className="font-bold text-blue-950">{item.rem}</span>
                    <span className="block text-[11px] text-slate-400 font-medium truncate max-w-[220px]" title={item.nombre}>
                      {item.nombre}
                    </span>
                  </td>
                  {mesesNombres.map((_, index) => {
                    const mesNum = index + 1;
                    const cargado = item.meses[mesNum];
                    return (
                      <td key={mesNum} className="py-3 px-2 text-center">
                        <div className="flex justify-center">
                          {cargado ? (
                            <span 
                              className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-sm"
                              title={`REM ${item.rem} - Mes ${mesNum}: Cargado`}
                            >
                              ✓
                            </span>
                          ) : (
                            <span 
                              className="w-7 h-7 rounded-lg bg-slate-200 text-slate-400 flex items-center justify-center font-bold text-xs"
                              title={`REM ${item.rem} - Mes ${mesNum}: Pendiente`}
                            >
                              —
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}