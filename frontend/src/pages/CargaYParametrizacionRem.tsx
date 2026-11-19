import React, { useState, useEffect } from 'react';
import { 
  Upload, FileSpreadsheet, Settings, CheckCircle2, AlertTriangle, 
  Save, RefreshCw, Users, Database, Layers, ArrowRight, ShieldCheck, 
  Check, Info, Target, Search, Edit3, X, FileText
} from 'lucide-react';
import api from '../api/axios';
import { 
  useMetasYCeldasQuery, 
  usePoblacionQuery, 
  useMutacionParametrizarMeta, 
  useMutacionPoblacion, 
  useMutacionUploadRem 
} from '../api/queries';

interface DenominadorInfo {
  id: number;
  indicador_id: number;
  codigo: string;
  meta_codigo: string;
  nombre: string;
  descripcion: string;
  origen: string;
  valor: string;
  rem_celda: string;
}

interface IndicadorParamInfo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  meta_codigo: string;
  meta_nombre: string;
  seccion: string;
  programa: string | null;
  forma_calculo: string;
  orientacion: string;
  formula_display: string;
  ponderacion: string;
  meta_valor: string;
  num_hoja: string;
  num_celda: string;
  num_descripcion: string;
  den_origen: string;
  den_valor_fijo: string;
  den_hoja: string;
  den_celda: string;
  den_descripcion: string;
}

interface DetalleErrorRem {
  hoja: string;
  fila: string | number;
  columna: string;
  celda: string;
  tipo: string;
  valor?: string;
  mensaje: string;
}

export default function CargaYParametrizacionRem() {
  // Pestañas del Módulo: 'poblacion' | 'metas_celdas' | 'carga'
  const [pestañaActiva, setPestañaActiva] = useState<'poblacion' | 'metas_celdas' | 'carga'>('poblacion');

  // Año evaluativo global
  const [anioPoblacion, setAnioPoblacion] = useState('2026');

  // ==========================================
  // ESTADOS PESTAÑA 1: POBLACIÓN Y DENOMINADORES
  // ==========================================
  const [cargandoPoblacion, setCargandoPoblacion] = useState(false);
  const [guardandoPoblacion, setGuardandoPoblacion] = useState(false);
  const [exitoPoblacion, setExitoPoblacion] = useState('');
  const [errorPoblacion, setErrorPoblacion] = useState('');
  const [actualizadoEn, setActualizadoEn] = useState('');

  const [poblacion, setPoblacion] = useState({
    poblacion_total: '28500',
    mujeres_20_64: '5226',
    hombres_20_64: '4800',
    adultos_mayores_65: '3200',
    mujeres_25_64_pap: '5393',
    ninos_12_23_meses: '350',
    adolescentes_10_19: '2100',
    prevalencia_dm2: '2280',
    prevalencia_hta: '4200',
    ninos_menores_3_caries: '480',
  });

  const [denominadores, setDenominadores] = useState<DenominadorInfo[]>([]);

  // ==========================================
  // ESTADOS PESTAÑA 2: PARAMETRIZACIÓN METAS Y CELDAS
  // ==========================================
  const [indicadoresParam, setIndicadoresParam] = useState<IndicadorParamInfo[]>([]);
  const [cargandoMetas, setCargandoMetas] = useState(false);
  const [busquedaMetas, setBusquedaMetas] = useState('');
  const [filtroSeccion, setFiltroSeccion] = useState('Todas');
  const [modalMetaAbierto, setModalMetaAbierto] = useState(false);
  const [metaSeleccionada, setMetaSeleccionada] = useState<IndicadorParamInfo | null>(null);
  const [formMeta, setFormMeta] = useState({
    meta_valor: '',
    ponderacion: '',
    forma_calculo: 'PORCENTAJE',
    orientacion: 'MAYOR_MEJOR',
    num_hoja: '',
    num_celda: '',
    num_descripcion: ''
  });
  const [guardandoMeta, setGuardandoMeta] = useState(false);
  const [mensajeExitoMeta, setMensajeExitoMeta] = useState('');
  const [mensajeErrorMeta, setMensajeErrorMeta] = useState('');

  // ==========================================
  // ESTADOS PESTAÑA 3: CARGA ARCHIVOS REM
  // ==========================================
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargandoArchivo, setCargandoArchivo] = useState(false);
  const [resultadoArchivo, setResultadoArchivo] = useState<any>(null);
  const [errorArchivo, setErrorArchivo] = useState('');
  const [erroresDetalle, setErroresDetalle] = useState<DetalleErrorRem[]>([]);
  const [advertenciasDetalle, setAdvertenciasDetalle] = useState<DetalleErrorRem[]>([]);

  const [parametros, setParametros] = useState({
    hojaRem: 'REM A24',
    celdaEstablecimiento: 'B4',
    celdaMes: 'C2',
    filaInicioDatos: 12,
    columnaIndicador: 'D'
  });

  // Mutaciones de datos con TanStack Query
  const mutacionMeta = useMutacionParametrizarMeta();
  const mutacionPoblacion = useMutacionPoblacion();
  const mutacionUploadRem = useMutacionUploadRem();

  // Cargar datos de población y denominadores
  const cargarPoblacion = async (anio: string) => {
    setCargandoPoblacion(true);
    setErrorPoblacion('');
    try {
      const res = await api.get('param/poblacion/', { params: { anio } });
      if (res.data) {
        if (res.data.poblacion) {
          setPoblacion(res.data.poblacion);
          setActualizadoEn(res.data.poblacion.actualizado_en || '');
        } else {
          setPoblacion({
            poblacion_total: res.data.poblacion_total || '28500',
            mujeres_20_64: res.data.mujeres_20_64 || '5226',
            hombres_20_64: res.data.hombres_20_64 || '4800',
            adultos_mayores_65: res.data.adultos_mayores_65 || '3200',
            mujeres_25_64_pap: res.data.mujeres_25_64_pap || '5393',
            ninos_12_23_meses: res.data.ninos_12_23_meses || '350',
            adolescentes_10_19: res.data.adolescentes_10_19 || '2100',
            prevalencia_dm2: res.data.prevalencia_dm2 || '2280',
            prevalencia_hta: res.data.prevalencia_hta || '4200',
            ninos_menores_3_caries: res.data.ninos_menores_3_caries || '480',
          });
          setActualizadoEn(res.data.actualizado_en || '');
        }
        if (res.data.denominadores) {
          setDenominadores(res.data.denominadores);
        }
      }
    } catch (err: any) {
      console.error('Error al cargar población:', err);
      setErrorPoblacion('No se pudo cargar la información de población desde el servidor.');
    } finally {
      setCargandoPoblacion(false);
    }
  };

  // Cargar matriz completa de metas y celdas
  const cargarMetasYCeldas = async (anio: string) => {
    setCargandoMetas(true);
    try {
      const res = await api.get('param/parametrizar-metas-celdas/', { params: { anio } });
      if (res.data?.indicadores) {
        setIndicadoresParam(res.data.indicadores);
      }
    } catch (err) {
      console.error('Error al cargar parámetros de metas y celdas:', err);
    } finally {
      setCargandoMetas(false);
    }
  };

  useEffect(() => {
    cargarPoblacion(anioPoblacion);
    cargarMetasYCeldas(anioPoblacion);
  }, [anioPoblacion]);

  // Manejo de población
  const handlePoblacionChange = (campo: string, valor: string) => {
    setPoblacion(prev => ({ ...prev, [campo]: valor }));
    setExitoPoblacion('');
  };

  const handleGuardarPoblacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoPoblacion(true);
    setErrorPoblacion('');
    setExitoPoblacion('');

    try {
      const res = await mutacionPoblacion.mutateAsync({
        anio: parseInt(anioPoblacion, 10),
        poblacion: poblacion
      });
      setExitoPoblacion(res?.message || 'Población y denominadores actualizados con éxito.');
      if (res?.denominadores) {
        setDenominadores(res.denominadores);
      }
      cargarPoblacion(anioPoblacion);
    } catch (err: any) {
      console.error('Error al guardar población:', err);
      setErrorPoblacion(err.response?.data?.error || 'Error al guardar los datos de población en el servidor.');
    } finally {
      setGuardandoPoblacion(false);
    }
  };

  // Manejo de Modal Parametrización Metas y Celdas
  const abrirModalEditarMeta = (item: IndicadorParamInfo) => {
    setMetaSeleccionada(item);
    setMensajeErrorMeta('');
    setFormMeta({
      meta_valor: item.meta_valor || '',
      ponderacion: item.ponderacion || '',
      forma_calculo: item.forma_calculo || 'PORCENTAJE',
      orientacion: item.orientacion || 'MAYOR_MEJOR',
      num_hoja: item.num_hoja || 'REM A24',
      num_celda: item.num_celda || '',
      num_descripcion: item.num_descripcion || ''
    });
    setModalMetaAbierto(true);
  };

  const handleGuardarMetaYCeldas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metaSeleccionada) return;

    setGuardandoMeta(true);
    setMensajeErrorMeta('');
    try {
      const res = await mutacionMeta.mutateAsync({
        indicador_id: metaSeleccionada.id,
        anio: parseInt(anioPoblacion, 10),
        meta_valor: formMeta.meta_valor,
        ponderacion: formMeta.ponderacion,
        forma_calculo: formMeta.forma_calculo,
        orientacion: formMeta.orientacion,
        num_hoja: formMeta.num_hoja,
        num_celda: formMeta.num_celda,
        num_descripcion: formMeta.num_descripcion
      });

      setMensajeExitoMeta(res?.message || 'Parámetros actualizados con éxito.');
      setModalMetaAbierto(false);
      cargarMetasYCeldas(anioPoblacion);
      setTimeout(() => setMensajeExitoMeta(''), 4000);
    } catch (err: any) {
      console.error('Error al parametrizar meta y celda:', err);
      const msg = err.response?.data?.error || 'Error al guardar los parámetros de celda y meta en el servidor.';
      setMensajeErrorMeta(msg);
    } finally {
      setGuardandoMeta(false);
    }
  };

  // Manejo de carga de archivos REM
  const handleParamChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setParametros({ ...parametros, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
      setErrorArchivo('');
      setErroresDetalle([]);
      setAdvertenciasDetalle([]);
      setResultadoArchivo(null);
    }
  };

  const handleProcesar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo) {
      setErrorArchivo('Por favor seleccione o arrastre un archivo REM en formato Excel.');
      return;
    }

    setCargandoArchivo(true);
    setErrorArchivo('');
    setErroresDetalle([]);
    setAdvertenciasDetalle([]);
    setResultadoArchivo(null);

    const formData = new FormData();
    formData.append('file', archivo);
    formData.append('parametros', JSON.stringify(parametros));

    try {
      const res = await mutacionUploadRem.mutateAsync(formData);
      setResultadoArchivo({
        status: 'success',
        filename: res.filename || archivo.name,
        registrosProcesados: res.hojas ? `${res.hojas} hojas REM procesadas` : 'Planilla procesada',
        establecimiento: res.establecimiento || 'CESFAM Santa Rosa (210450)',
        periodo: res.periodo || 'Año 2026',
      });
      if (res.advertencias) {
        setAdvertenciasDetalle(res.advertencias);
      }
    } catch (err: any) {
      console.error('Error al subir REM:', err);
      setErrorArchivo(err.response?.data?.error || 'Error al procesar el archivo REM en el servidor.');
      if (err.response?.data?.errores_detalle) {
        setErroresDetalle(err.response.data.errores_detalle);
      }
      if (err.response?.data?.advertencias) {
        setAdvertenciasDetalle(err.response.data.advertencias);
      }
    } finally {
      setCargandoArchivo(false);
    }
  };

  // Filtrado de la pestaña de Metas y Celdas
  const indicadoresFiltrados = indicadoresParam.filter(ind => {
    const coincideTexto = ind.codigo.toLowerCase().includes(busquedaMetas.toLowerCase()) || 
                          ind.nombre.toLowerCase().includes(busquedaMetas.toLowerCase()) ||
                          ind.meta_codigo.toLowerCase().includes(busquedaMetas.toLowerCase());
    const coincideSeccion = filtroSeccion === 'Todas' || ind.seccion === filtroSeccion;
    return coincideTexto && coincideSeccion;
  });

  return (
    <div className="w-full min-h-full bg-slate-50 p-6 md:p-8 space-y-6">
      
      {/* Cabecera del Módulo */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-blue-950">Parametrización y Carga REM</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              PostgreSQL
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500">
            Administre las coordenadas de celdas REM, las metas comprometidas y las poblaciones objetivo para el cálculo de cumplimiento.
          </p>
        </div>

        {/* Selector de Pestañas (3 Pestañas Integradas) */}
        <div className="flex p-1 bg-slate-100 rounded-xl self-start md:self-auto border border-slate-200 flex-wrap gap-1">
          <button
            onClick={() => setPestañaActiva('poblacion')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              pestañaActiva === 'poblacion'
                ? 'bg-white text-blue-950 shadow-sm'
                : 'text-slate-600 hover:text-blue-950'
            }`}
          >
            <Users size={15} className={pestañaActiva === 'poblacion' ? 'text-blue-600' : ''} />
            <span>Población y Denominadores</span>
          </button>
          
          <button
            onClick={() => setPestañaActiva('metas_celdas')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              pestañaActiva === 'metas_celdas'
                ? 'bg-white text-blue-950 shadow-sm'
                : 'text-slate-600 hover:text-blue-950'
            }`}
          >
            <Target size={15} className={pestañaActiva === 'metas_celdas' ? 'text-blue-600' : ''} />
            <span>Metas y Celdas REM</span>
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          </button>

          <button
            onClick={() => setPestañaActiva('carga')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              pestañaActiva === 'carga'
                ? 'bg-white text-blue-950 shadow-sm'
                : 'text-slate-600 hover:text-blue-950'
            }`}
          >
            <FileSpreadsheet size={15} className={pestañaActiva === 'carga' ? 'text-blue-600' : ''} />
            <span>Carga de Archivos REM</span>
          </button>
        </div>
      </div>

      {/* Alerta de éxito global para metas */}
      {mensajeExitoMeta && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-sm">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{mensajeExitoMeta}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 1: POBLACIÓN Y DENOMINADORES PARA CÁLCULO DE METAS (Requerimiento) */}
      {/* ========================================================================= */}
      {pestañaActiva === 'poblacion' && (
        <div className="space-y-6">
          
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-400 shrink-0" />
                <h4 className="font-black text-sm uppercase tracking-wider">
                  Incorporación de Denominador y Población para Cálculo de Metas
                </h4>
              </div>
              <p className="text-xs text-blue-100 max-w-3xl leading-relaxed">
                El sistema extrae las actividades realizadas (<strong>Numerador</strong>) desde los libros REM Serie A. 
                Los campos a continuación permiten ingresar la <strong>Población Inscrita Validada por FONASA</strong> y prevalencias 
                oficiales del CESFAM Santa Rosa, las cuales actúan automáticamente como el <strong>Denominador</strong> en las fórmulas de cumplimiento.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl backdrop-blur-sm self-end md:self-auto shrink-0">
              <span className="text-xs font-bold text-slate-200">Año Evaluativo:</span>
              <select
                value={anioPoblacion}
                onChange={(e) => setAnioPoblacion(e.target.value)}
                className="bg-blue-950 text-white font-bold text-xs rounded-lg px-2.5 py-1 border border-white/20 focus:outline-none"
              >
                <option value="2026">2026 (Vigente)</option>
                <option value="2025">2025</option>
              </select>
            </div>
          </div>

          {exitoPoblacion && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-sm">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{exitoPoblacion}</span>
            </div>
          )}

          {errorPoblacion && (
            <div className="bg-rose-50 border border-rose-200 text-rose-900 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-sm">
              <AlertTriangle size={18} className="text-rose-600 shrink-0" />
              <span>{errorPoblacion}</span>
            </div>
          )}

          <form onSubmit={handleGuardarPoblacion} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-2.5 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                  <h5 className="font-bold text-blue-950 text-xs uppercase tracking-wider">
                    Población General y Adultos
                  </h5>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Población Total FONASA (Universal)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={poblacion.poblacion_total}
                        onChange={(e) => handlePoblacionChange('poblacion_total', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                        placeholder="Ej: 28500"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">hab.</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Denominador para IAAPS 3, 5 y 16</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Mujeres de 20 a 64 años (EMPA)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={poblacion.mujeres_20_64}
                        onChange={(e) => handlePoblacionChange('mujeres_20_64', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                        placeholder="Ej: 5226"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">mujeres</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Denominador IAAPS 6.1.A</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Hombres de 20 a 64 años (EMPA)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={poblacion.hombres_20_64}
                        onChange={(e) => handlePoblacionChange('hombres_20_64', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                        placeholder="Ej: 4800"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">hombres</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Denominador IAAPS 6.1.B</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Adultos Mayores (65 años y más)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={poblacion.adultos_mayores_65}
                        onChange={(e) => handlePoblacionChange('adultos_mayores_65', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                        placeholder="Ej: 3200"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">personas</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Denominador IAAPS 6.2 (EMPAM)</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-2.5 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600"></div>
                  <h5 className="font-bold text-blue-950 text-xs uppercase tracking-wider">
                    Infancia, Adolescencia y Mujer
                  </h5>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Mujeres 25 a 64 años (PAP)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={poblacion.mujeres_25_64_pap}
                        onChange={(e) => handlePoblacionChange('mujeres_25_64_pap', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                        placeholder="Ej: 5393"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">mujeres</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Denominador Meta Comunal 2 (PAP)</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Niños de 12 a 23 meses (DSM)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={poblacion.ninos_12_23_meses}
                        onChange={(e) => handlePoblacionChange('ninos_12_23_meses', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                        placeholder="Ej: 350"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">niños</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Denominador IAAPS 7 (Desarrollo Psicomotor)</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Adolescentes de 10 a 19 años
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={poblacion.adolescentes_10_19}
                        onChange={(e) => handlePoblacionChange('adolescentes_10_19', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                        placeholder="Ej: 2100"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">jóvenes</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Denominador IAAPS 8 y 13</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Niños menores de 3 años (Salud Bucal)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={poblacion.ninos_menores_3_caries}
                        onChange={(e) => handlePoblacionChange('ninos_menores_3_caries', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                        placeholder="Ej: 480"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">niños</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Denominador IAAPS 17 (Caries Dental)</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-2.5 flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                    <h5 className="font-bold text-blue-950 text-xs uppercase tracking-wider">
                      Prevalencia Crónicos (PSCV)
                    </h5>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Población Diabética Estimada (DM2 15+)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={poblacion.prevalencia_dm2}
                          onChange={(e) => handlePoblacionChange('prevalencia_dm2', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition"
                          placeholder="Ej: 2280"
                        />
                        <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">pacientes</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Denominador IAAPS 14 y Meta Comunal 4a</span>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Población Hipertensa Estimada (HTA 15+)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={poblacion.prevalencia_hta}
                          onChange={(e) => handlePoblacionChange('prevalencia_hta', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition"
                          placeholder="Ej: 4200"
                        />
                        <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">pacientes</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Denominador IAAPS 15 y Meta Comunal 5</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <button
                    type="submit"
                    disabled={guardandoPoblacion}
                    style={{ backgroundColor: '#1e3a8a' }}
                    className="w-full flex items-center justify-center gap-2 text-white py-3 rounded-xl font-bold text-xs shadow-md hover:bg-blue-900 transition cursor-pointer disabled:opacity-50"
                  >
                    {guardandoPoblacion ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                    {guardandoPoblacion ? 'Guardando Población...' : 'Guardar Población y Sincronizar Denominadores'}
                  </button>
                  {actualizadoEn && (
                    <p className="text-[11px] text-slate-400 text-center font-medium">
                      Última actualización: {actualizadoEn}
                    </p>
                  )}
                </div>

              </div>

            </div>
          </form>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Database size={18} className="text-blue-600" />
                <h4 className="font-bold text-blue-950 text-sm">
                  Matriz de Denominadores Incorporados para el Cálculo de Metas
                </h4>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {denominadores.length} indicadores alimentados por población FONASA
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Indicador</th>
                    <th className="py-3 px-4">Meta Asociada</th>
                    <th className="py-3 px-4">Nombre de la Meta / Indicador</th>
                    <th className="py-3 px-4">Población Objetivo (Denominador)</th>
                    <th className="py-3 px-4 text-right">Valor Asignado</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {denominadores.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        Cargando denominadores sincronizados...
                      </td>
                    </tr>
                  ) : (
                    denominadores.map((d) => (
                      <tr key={`${d.id}-${d.codigo}`} className="hover:bg-blue-50/40 transition">
                        <td className="py-3 px-4 font-black text-blue-950 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[11px]">
                            {d.codigo}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-700 whitespace-nowrap">
                          {d.meta_codigo}
                        </td>
                        <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={d.nombre}>
                          {d.nombre}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {d.descripcion}
                        </td>
                        <td className="py-3 px-4 font-black text-blue-950 tabular-nums text-right text-sm">
                          {d.valor ? Number(d.valor).toLocaleString('es-CL') : '—'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check size={12} /> Sincronizado
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: PARAMETRIZACIÓN DE METAS Y CELDAS REM (RF-04 y RF-11)          */}
      {/* ========================================================================= */}
      {pestañaActiva === 'metas_celdas' && (
        <div className="space-y-6">

          {/* Banner de Explicación de Parametrización */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Target size={20} className="text-blue-600" />
                <h4 className="font-bold text-blue-950 text-sm uppercase tracking-wider">
                  Calibración de Fórmulas, Metas Comprometidas y Celdas REM
                </h4>
              </div>
              <p className="text-xs text-slate-500 max-w-3xl">
                Ajuste flexible de las coordenadas Excel (Hoja y Celda) para cada actividad clínica del REM Serie A (RF-11), 
                así como las metas anuales esperadas y ponderaciones institucionales (RF-04).
              </p>
            </div>
            <button
              onClick={() => cargarMetasYCeldas(anioPoblacion)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer self-end md:self-auto shrink-0"
            >
              <RefreshCw size={14} className={cargandoMetas ? 'animate-spin' : ''} />
              <span>Actualizar Tabla</span>
            </button>
          </div>

          {/* Filtros y Buscador */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative md:col-span-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={busquedaMetas}
                onChange={(e) => setBusquedaMetas(e.target.value)}
                placeholder="Buscar por código de meta, indicador o nombre..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <select
                value={filtroSeccion}
                onChange={(e) => setFiltroSeccion(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="Todas">Todas las Secciones</option>
                <option value="RISS">Estrategia RISS</option>
                <option value="PRODUCCION">Producción</option>
                <option value="IMPACTO">Impacto</option>
                <option value="COMUNAL">Metas Comunales (Ley 19.813)</option>
              </select>
            </div>
          </div>

          {/* Tabla de Parametrización de Metas y Celdas */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Meta / Sección</th>
                    <th className="py-3 px-4">Indicador</th>
                    <th className="py-3 px-4 text-center">Meta Anual</th>
                    <th className="py-3 px-4 text-center">Pond.</th>
                    <th className="py-3 px-4">Celda REM Numerador</th>
                    <th className="py-3 px-4">Denominador</th>
                    <th className="py-3 px-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {cargandoMetas ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 font-semibold">
                        Cargando catálogo de metas y celdas desde PostgreSQL...
                      </td>
                    </tr>
                  ) : indicadoresFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No se encontraron indicadores para el filtro aplicado.
                      </td>
                    </tr>
                  ) : (
                    indicadoresFiltrados.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-black text-blue-950 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 border border-blue-200 font-bold">
                            {item.codigo}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="font-bold text-slate-800">{item.meta_codigo}</p>
                          <span className="text-[10px] text-slate-400 uppercase">{item.seccion}</span>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="font-semibold text-slate-900 truncate" title={item.nombre}>{item.nombre}</p>
                          <p className="text-[10px] text-slate-400 truncate" title={item.formula_display}>{item.formula_display}</p>
                        </td>
                        <td className="py-3 px-4 text-center font-black text-blue-950">
                          {item.meta_valor ? `${item.meta_valor}${item.forma_calculo === 'PORCENTAJE' ? '%' : ''}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-600">
                          {item.ponderacion ? `${item.ponderacion}%` : '—'}
                        </td>
                        <td className="py-3 px-4">
                          {item.num_hoja && item.num_celda ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-mono font-bold text-[11px] border border-emerald-200">
                              <FileText size={12} /> {item.num_hoja}!{item.num_celda}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Sin celda REM asignada</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-[11px]">
                          {item.den_valor_fijo ? (
                            <span className="font-semibold text-blue-950">
                              Población ({Number(item.den_valor_fijo).toLocaleString('es-CL')})
                            </span>
                          ) : item.den_hoja && item.den_celda ? (
                            <span className="font-mono font-semibold text-emerald-800">
                              {item.den_hoja}!{item.den_celda}
                            </span>
                          ) : (
                            <span className="text-slate-400">Directo / No aplica</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => abrirModalEditarMeta(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition cursor-pointer"
                            title="Editar coordenadas de celdas o valor de meta"
                          >
                            <Edit3 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal de Calibración de Celdas y Meta */}
          {modalMetaAbierto && metaSeleccionada && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5 border border-slate-200 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-black text-blue-950 text-sm flex items-center gap-2">
                      <Settings className="text-blue-600" size={18} />
                      Parametrizar {metaSeleccionada.codigo} - {metaSeleccionada.meta_codigo}
                    </h4>
                    <p className="text-xs text-slate-500 truncate max-w-sm">{metaSeleccionada.nombre}</p>
                  </div>
                  <button onClick={() => setModalMetaAbierto(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleGuardarMetaYCeldas} className="space-y-4 text-xs">
                  {mensajeErrorMeta && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold">
                      <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                      <span>{mensajeErrorMeta}</span>
                    </div>
                  )}

                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-blue-950">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-bold text-[11px] uppercase tracking-wider">Fórmula Oficial MINSAL:</p>
                      <span className="px-2 py-0.5 rounded bg-blue-100/80 text-blue-800 font-bold text-[9px] uppercase tracking-wider border border-blue-200">
                        Evaluador Seguro: simpleeval
                      </span>
                    </div>
                    <p className="font-medium text-[11px] leading-relaxed">{metaSeleccionada.formula_display}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Meta Comprometida Anual</label>
                      <input
                        type="text"
                        value={formMeta.meta_valor}
                        onChange={(e) => setFormMeta({ ...formMeta, meta_valor: e.target.value })}
                        placeholder="Ej: 27.00"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-bold text-slate-900 focus:outline-none focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Ponderación (%)</label>
                      <input
                        type="text"
                        value={formMeta.ponderacion}
                        onChange={(e) => setFormMeta({ ...formMeta, ponderacion: e.target.value })}
                        placeholder="Ej: 4.00"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-bold text-slate-900 focus:outline-none focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Forma de Cálculo (Fórmula)</label>
                      <select
                        value={formMeta.forma_calculo}
                        onChange={(e) => setFormMeta({ ...formMeta, forma_calculo: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-semibold text-slate-900 focus:outline-none focus:bg-white"
                      >
                        <option value="PORCENTAJE">Porcentaje (N / D × 100)</option>
                        <option value="TASA">Tasa (N / D × 10.000)</option>
                        <option value="RAZON">Razón (N / D)</option>
                        <option value="VALOR">Valor directo (solo N)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Orientación de la Meta</label>
                      <select
                        value={formMeta.orientacion}
                        onChange={(e) => setFormMeta({ ...formMeta, orientacion: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-semibold text-slate-900 focus:outline-none focus:bg-white"
                      >
                        <option value="MAYOR_MEJOR">Mayor es mejor (≥ meta)</option>
                        <option value="MENOR_MEJOR">Menor es mejor (≤ meta)</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-3">
                    <h5 className="font-black text-blue-950 text-[11px] uppercase tracking-wider">
                      Ubicación de Celdas REM para Numerador (RF-11)
                    </h5>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Hoja Excel REM</label>
                        <input
                          type="text"
                          value={formMeta.num_hoja}
                          onChange={(e) => setFormMeta({ ...formMeta, num_hoja: e.target.value })}
                          placeholder="Ej: REM A02 o A24"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-semibold text-slate-900 focus:outline-none focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Celda o Fórmula</label>
                        <input
                          type="text"
                          value={formMeta.num_celda}
                          onChange={(e) => setFormMeta({ ...formMeta, num_celda: e.target.value })}
                          placeholder="Ej: D14 o H11:X11 o D11-F11"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-semibold text-slate-900 focus:outline-none focus:bg-white"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Evaluado de forma segura con <strong>simpleeval</strong> (soporta celdas, rangos y sumas/restas).
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Descripción de la Actividad</label>
                      <input
                        type="text"
                        value={formMeta.num_descripcion}
                        onChange={(e) => setFormMeta({ ...formMeta, num_descripcion: e.target.value })}
                        placeholder="Ej: Conteo de atenciones realizadas en el mes"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:outline-none focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setModalMetaAbierto(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={guardandoMeta}
                      style={{ backgroundColor: '#1e3a8a' }}
                      className="px-5 py-2 rounded-xl text-white font-bold text-xs shadow hover:bg-blue-900 transition cursor-pointer disabled:opacity-50"
                    >
                      {guardandoMeta ? 'Guardando...' : 'Guardar Coordenadas y Meta'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 3: CARGA Y PROCESAMIENTO DE ARCHIVOS REM (Serie A Excel)          */}
      {/* ========================================================================= */}
      {pestañaActiva === 'carga' && (
        <div className="space-y-6">

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <Users size={18} />
              </div>
              <div>
                <p className="font-bold text-emerald-950">Denominadores Oficiales Activos (Año 2026)</p>
                <p className="text-emerald-700 font-medium">
                  Población Inscrita: <strong>{Number(poblacion.poblacion_total).toLocaleString('es-CL')} inscritos</strong> ({denominadores.length} denominadores sincronizados).
                </p>
              </div>
            </div>
            <button
              onClick={() => setPestañaActiva('poblacion')}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>Ver o Editar Población</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {errorArchivo && (
            <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-900 border border-rose-200 shadow-sm flex items-center gap-2">
              <AlertTriangle size={18} className="text-rose-600 shrink-0" />
              <span className="font-semibold">{errorArchivo}</span>
            </div>
          )}

          {/* Tabla de Errores por Fila y Columna */}
          {erroresDetalle.length > 0 && (
            <div className="bg-white border-2 border-rose-300 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                  <AlertTriangle className="text-rose-600 shrink-0" size={18} />
                  <span>Inconsistencias Detectadas por Fila y Columna ({erroresDetalle.length} errores)</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 uppercase">
                  Rechazo de Planilla
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3">Hoja REM</th>
                      <th className="py-2.5 px-3 text-center">Fila</th>
                      <th className="py-2.5 px-3 text-center">Columna</th>
                      <th className="py-2.5 px-3 text-center">Celda</th>
                      <th className="py-2.5 px-3">Tipo Error</th>
                      <th className="py-2.5 px-3">Mensaje y Causa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {erroresDetalle.map((err, idx) => (
                      <tr key={idx} className="hover:bg-rose-50/40 transition">
                        <td className="py-2.5 px-3 font-black text-blue-950 whitespace-nowrap">
                          {err.hoja}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                          {err.fila}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                          {err.columna}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-rose-700">
                          <span className="px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200">
                            {err.celda}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 uppercase">
                            {err.tipo}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium leading-relaxed">
                          {err.mensaje}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Advertencias no bloqueantes */}
          {advertenciasDetalle.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                <span>Observaciones y Advertencias de Validación ({advertenciasDetalle.length})</span>
              </div>
              <ul className="text-xs text-amber-800 list-disc list-inside space-y-1">
                {advertenciasDetalle.map((adv, idx) => (
                  <li key={idx}>
                    <strong>Hoja {adv.hoja}:</strong> {adv.mensaje}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5 lg:col-span-1">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                <Settings size={18} className="text-blue-600" />
                <h4 className="font-bold text-blue-950 text-sm uppercase tracking-wider">Parametrización de Celdas Base</h4>
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

            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6 lg:col-span-2 flex flex-col justify-between">
              
              <form onSubmit={handleProcesar} className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-blue-950 text-sm uppercase tracking-wider">Carga de Archivo REM</h4>
                  <p className="text-xs text-slate-500 mt-0.5">El sistema validará el archivo utilizando los parámetros configurados en el panel izquierdo.</p>
                </div>

                <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 transition rounded-2xl p-8 text-center bg-slate-50/50 flex flex-col items-center justify-center relative cursor-pointer">
                  <input 
                    type="file" 
                    accept=".xlsx, .xls, .xlsm, .csv" 
                    onChange={handleFileChange} 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                  />
                  <Upload size={36} className="text-blue-600 mb-3" />
                  <p className="text-sm font-bold text-slate-800">
                    {archivo ? archivo.name : 'Haga clic o arrastre su archivo REM aquí'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Formatos compatibles: .xlsx, .xlsm, .xls (MINSAL Serie A)</p>
                </div>

                <div className="flex justify-end">
                  <button 
                    type="submit" 
                    disabled={cargandoArchivo}
                    style={{ backgroundColor: '#2e6b46' }}
                    className="flex items-center gap-2 text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-md hover:opacity-95 transition cursor-pointer disabled:opacity-50"
                  >
                    {cargandoArchivo ? <RefreshCw className="animate-spin" size={18} /> : <Upload size={18} />}
                    {cargandoArchivo ? 'Procesando Planilla...' : 'Procesar Archivo REM'}
                  </button>
                </div>
              </form>

              {resultadoArchivo && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3 mt-4">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                    <CheckCircle2 size={20} className="text-emerald-600" />
                    Planilla Procesada e Integrada Exitosamente
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-emerald-800 font-medium">
                    <p>📁 Archivo: <span className="font-bold">{resultadoArchivo.filename}</span></p>
                    <p>🏥 Establecimiento: <span className="font-bold">{resultadoArchivo.establecimiento}</span></p>
                    <p>📊 Registros: <span className="font-bold">{resultadoArchivo.registrosProcesados}</span></p>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
