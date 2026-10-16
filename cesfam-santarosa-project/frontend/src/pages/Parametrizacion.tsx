// frontend/src/pages/Parametrizacion.tsx
// RF-04 / RF-11: Administración de metas, indicadores, fórmulas, celdas REM
// y valores anuales. Todo configurable sin cambios de programación.
import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import {
  Settings2, Plus, Save, Trash2, Pencil, X, Target, Sigma, MapPin,
  CheckCircle2, AlertTriangle, RefreshCw, ChevronRight,
} from 'lucide-react';

// ---------- Tipos ----------
interface Programa { id: number; nombre: string; descripcion: string; activo: boolean }
interface IndicadorResumen {
  id: number; codigo: string; nombre: string;
  forma_calculo: string; orientacion: string;
  formula_display: string; ponderacion: string | null; vigente: boolean;
}
interface Componente {
  id: number; tipo: string; descripcion: string; origen: string;
  rem_hoja: string; rem_celda: string; valor_fijo: string | null; activo: boolean;
}
interface ValorAnual { id: number; anio: number; valor: string; comentario: string }
interface Indicador extends IndicadorResumen {
  meta: number; descripcion: string; componentes: Componente[]; valores: ValorAnual[];
}
interface Meta {
  id: number; codigo: string; nombre: string; descripcion: string;
  seccion: string; programa: number | null; programa_nombre: string | null;
  vigente: boolean; indicadores: IndicadorResumen[];
}

const SECCIONES = [
  { value: 'RISS', label: 'Estrategia RISS' },
  { value: 'PRODUCCION', label: 'Producción' },
  { value: 'IMPACTO', label: 'Impacto' },
  { value: 'COMUNAL', label: 'Metas Comunales' },
];

const FORMAS = [
  { value: 'PORCENTAJE', label: 'Porcentaje (N/D × 100)' },
  { value: 'TASA', label: 'Tasa por 10.000 (N/D × 10.000)' },
  { value: 'RAZON', label: 'Razón (N/D)' },
  { value: 'VALOR', label: 'Valor directo (solo numerador)' },
];

const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm text-slate-900 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 focus:outline-none transition';
const labelCls = 'block text-[11px] font-bold uppercase tracking-wider text-blue-950 mb-1.5';
const btnPrimary = 'flex items-center gap-2 bg-blue-950 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:bg-blue-900 transition border-b-4 border-orange-500';
const btnGhost = 'flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-xs transition';

export default function Parametrizacion() {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroSeccion, setFiltroSeccion] = useState('');
  const [metaSel, setMetaSel] = useState<Meta | null>(null);
  const [indSel, setIndSel] = useState<Indicador | null>(null);
  const [mensaje, setMensaje] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [cargando, setCargando] = useState(false);

  const cargarMetas = async () => {
    setCargando(true);
    try {
      const [rm, rp] = await Promise.all([
        api.get('param/metas/'),
        api.get('param/programas/'),
      ]);
      setMetas(rm.data);
      setProgramas(rp.data);
    } catch {
      setMensaje({ type: 'error', text: 'No se pudo cargar la parametrización de metas.' });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarMetas(); }, []);

  const metasFiltradas = useMemo(() => {
    return metas.filter((m) => {
      const okBusqueda = !busqueda ||
        m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        m.codigo.toLowerCase().includes(busqueda.toLowerCase());
      const okSeccion = !filtroSeccion || m.seccion === filtroSeccion;
      return okBusqueda && okSeccion;
    });
  }, [metas, busqueda, filtroSeccion]);

  const seleccionarMeta = (m: Meta) => {
    setMetaSel(m);
    setIndSel(null);
  };

  const seleccionarIndicador = async (i: IndicadorResumen) => {
    try {
      const res = await api.get(`param/indicadores/${i.id}/`);
      setIndSel(res.data);
    } catch {
      setMensaje({ type: 'error', text: 'No se pudo cargar el indicador.' });
    }
  };

  return (
    <div className="w-full min-h-full bg-white p-6 md:p-8 space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-950 text-lime-400 shadow-md">
            <Settings2 size={26} />
          </div>
          <div>
            <h3 className="text-xl font-black text-blue-950">Parametrización de Metas e Indicadores</h3>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Defina metas, indicadores, fórmulas, valores anuales y la celda del REM donde
              vive cada dato. Cambios normativos no requieren reprogramación.
            </p>
          </div>
        </div>
        <button onClick={cargarMetas} className={btnGhost}>
          <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {mensaje && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 border shadow-sm ${
          mensaje.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
            : 'bg-orange-50 text-orange-900 border-orange-200'
        }`}>
          {mensaje.type === 'success'
            ? <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
            : <AlertTriangle size={20} className="text-orange-600 shrink-0" />}
          <span className="text-sm font-semibold">{mensaje.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* ============ Columna izquierda: listado de metas ============ */}
        <div className="xl:col-span-5 space-y-4">
          <NuevaMetaForm
            programas={programas}
            onCreada={(m) => { cargarMetas(); seleccionarMeta(m); }}
            onError={(t) => setMensaje({ type: 'error', text: t })}
          />

          <div className="flex gap-3">
            <input
              placeholder="Buscar por código o nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={inputCls}
            />
            <select value={filtroSeccion} onChange={(e) => setFiltroSeccion(e.target.value)} className={inputCls + ' max-w-[180px]'}>
              <option value="">Todas las secciones</option>
              {SECCIONES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Código</th>
                  <th className="py-2.5 px-4">Meta</th>
                  <th className="py-2.5 px-4">Ind.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {metasFiltradas.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => seleccionarMeta(m)}
                    className={`cursor-pointer transition ${metaSel?.id === m.id ? 'bg-blue-50' : 'hover:bg-slate-50/80'}`}
                  >
                    <td className="py-3 px-4 font-bold text-blue-950 whitespace-nowrap">{m.codigo}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 max-w-[280px] truncate">{m.nombre}</div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {SECCIONES.find((s) => s.value === m.seccion)?.label || '—'}
                        {m.programa_nombre ? ` · ${m.programa_nombre}` : ' · Transversal'}
                        {!m.vigente && ' · No vigente'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-bold">{m.indicadores.length}</td>
                  </tr>
                ))}
                {metasFiltradas.length === 0 && (
                  <tr><td colSpan={3} className="py-6 text-center text-slate-400 text-sm">Sin metas que coincidan.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ============ Columna derecha: detalle meta / indicador ============ */}
        <div className="xl:col-span-7 space-y-5">
          {!metaSel && (
            <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
              <Target size={40} className="mb-3 text-slate-300" />
              <p className="text-sm font-semibold">Seleccione una meta de la lista para ver sus indicadores.</p>
            </div>
          )}

          {metaSel && !indSel && (
            <DetalleMeta
              meta={metaSel}
              onSelectIndicador={seleccionarIndicador}
              onIndicadorCreado={() => {
                api.get('param/metas/').then((r) => {
                  setMetas(r.data);
                  const m = r.data.find((x: Meta) => x.id === metaSel.id);
                  if (m) setMetaSel(m);
                });
              }}
              onError={(t) => setMensaje({ type: 'error', text: t })}
              onOk={(t) => setMensaje({ type: 'success', text: t })}
            />
          )}

          {metaSel && indSel && (
            <EditorIndicador
              indicador={indSel}
              meta={metaSel}
              onRecargar={() => seleccionarIndicador(indSel)}
              onVolver={() => setIndSel(null)}
              onError={(t) => setMensaje({ type: 'error', text: t })}
              onOk={(t) => setMensaje({ type: 'success', text: t })}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== Nueva meta ====================
function NuevaMetaForm({ programas, onCreada, onError }: {
  programas: Programa[];
  onCreada: (m: Meta) => void;
  onError: (t: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [seccion, setSeccion] = useState('COMUNAL');
  const [programa, setPrograma] = useState('');
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setGuardando(true);
    try {
      const res = await api.post('param/metas/', {
        codigo, nombre, seccion, programa: programa || null,
      });
      onCreada(res.data);
      setAbierto(false);
      setCodigo(''); setNombre('');
    } catch (e: any) {
      onError(e.response?.data ? JSON.stringify(e.response.data) : 'Error al crear la meta.');
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto) {
    return (
      <button onClick={() => setAbierto(true)} className={btnPrimary}>
        <Plus size={16} /> Nueva Meta
      </button>
    );
  }

  return (
    <div className="border border-blue-100 bg-blue-50/40 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-black text-blue-950 text-sm uppercase tracking-wide">Nueva Meta</h4>
        <button onClick={() => setAbierto(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Código</label>
          <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ej: IAAPS-20" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Sección</label>
          <select value={seccion} onChange={(e) => setSeccion(e.target.value)} className={inputCls}>
            {SECCIONES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Nombre</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre de la meta" className={inputCls} />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Programa (vacío = transversal)</label>
          <select value={programa} onChange={(e) => setPrograma(e.target.value)} className={inputCls}>
            <option value="">Transversal</option>
            {programas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={guardar} disabled={!codigo || !nombre || guardando} className={btnPrimary + ' disabled:opacity-50'}>
          <Save size={14} /> {guardando ? 'Guardando...' : 'Crear Meta'}
        </button>
      </div>
    </div>
  );
}

// ==================== Detalle de meta + sus indicadores ====================
function DetalleMeta({ meta, onSelectIndicador, onIndicadorCreado, onError, onOk }: {
  meta: Meta;
  onSelectIndicador: (i: IndicadorResumen) => void;
  onIndicadorCreado: () => void;
  onError: (t: string) => void;
  onOk: (t: string) => void;
}) {
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [forma, setForma] = useState('PORCENTAJE');
  const [ponderacion, setPonderacion] = useState('');
  const [guardando, setGuardando] = useState(false);

  const crearIndicador = async () => {
    setGuardando(true);
    try {
      await api.post('param/indicadores/', {
        meta: meta.id, codigo, nombre,
        forma_calculo: forma,
        ponderacion: ponderacion || null,
      });
      setCodigo(''); setNombre(''); setPonderacion('');
      onIndicadorCreado();
      onOk(`Indicador ${codigo} creado en ${meta.codigo}.`);
    } catch (e: any) {
      onError(e.response?.data ? JSON.stringify(e.response.data) : 'Error al crear el indicador.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-950 text-white rounded-2xl p-5 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-lime-400">{meta.codigo}</span>
            <h4 className="text-lg font-black mt-1">{meta.nombre}</h4>
            {meta.descripcion && <p className="text-slate-300 text-xs mt-1 max-w-2xl">{meta.descripcion}</p>}
          </div>
        </div>
      </div>

      <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/60 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-2.5 px-4">Código</th>
              <th className="py-2.5 px-4">Indicador</th>
              <th className="py-2.5 px-4">Ponderación</th>
              <th className="py-2.5 px-4">Vigente</th>
              <th className="py-2.5 px-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {meta.indicadores.map((i) => (
              <tr key={i.id} className="hover:bg-slate-50/80 transition">
                <td className="py-3 px-4 font-bold text-blue-950 whitespace-nowrap">{i.codigo}</td>
                <td className="py-3 px-4 font-semibold text-slate-800 max-w-[280px] truncate">{i.nombre}</td>
                <td className="py-3 px-4 text-slate-600 font-bold">{i.ponderacion ? `${i.ponderacion}%` : '—'}</td>
                <td className="py-3 px-4">
                  {i.vigente
                    ? <span className="text-emerald-600 font-bold text-xs">Sí</span>
                    : <span className="text-rose-500 font-bold text-xs">No</span>}
                </td>
                <td className="py-3 px-4 text-right">
                  <button onClick={() => onSelectIndicador(i)} className="bg-slate-100 hover:bg-blue-950 hover:text-white text-blue-950 font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 ml-auto">
                    Configurar <ChevronRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {meta.indicadores.length === 0 && (
              <tr><td colSpan={5} className="py-5 text-center text-slate-400 text-sm">Esta meta aún no tiene indicadores.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Nuevo indicador */}
      <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/40">
        <h4 className="font-black text-blue-950 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
          <Plus size={16} /> Nuevo Indicador para {meta.codigo}
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className={labelCls}>Código</label>
            <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ej: 6.1.C" className={inputCls} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Nombre</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del indicador" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Forma de cálculo</label>
            <select value={forma} onChange={(e) => setForma(e.target.value)} className={inputCls}>
              {FORMAS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Ponderación IAAPS (%)</label>
            <input value={ponderacion} onChange={(e) => setPonderacion(e.target.value)} placeholder="Ej: 6" className={inputCls} />
          </div>
          <div className="flex items-end">
            <button onClick={crearIndicador} disabled={!codigo || !nombre || guardando} className={btnPrimary + ' disabled:opacity-50'}>
              <Save size={14} /> {guardando ? 'Guardando...' : 'Agregar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Editor de indicador ====================
function EditorIndicador({ indicador, meta, onRecargar, onVolver, onError, onOk }: {
  indicador: Indicador;
  meta: Meta;
  onRecargar: () => void;
  onVolver: () => void;
  onError: (t: string) => void;
  onOk: (t: string) => void;
}) {
  const [nombre, setNombre] = useState(indicador.nombre);
  const [forma, setForma] = useState(indicador.forma_calculo);
  const [orientacion, setOrientacion] = useState(indicador.orientacion || 'MAYOR_MEJOR');
  const [formula, setFormula] = useState(indicador.formula_display || '');
  const [ponderacion, setPonderacion] = useState(indicador.ponderacion || '');
  const [vigente, setVigente] = useState(indicador.vigente);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setGuardando(true);
    try {
      await api.patch(`param/indicadores/${indicador.id}/`, {
        nombre, forma_calculo: forma, orientacion,
        formula_display: formula,
        ponderacion: ponderacion || null, vigente,
      });
      onRecargar();
      onOk(`Indicador ${indicador.codigo} actualizado.`);
    } catch (e: any) {
      onError(e.response?.data ? JSON.stringify(e.response.data) : 'Error al guardar el indicador.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <button onClick={onVolver} className={btnGhost}>
          <ChevronRight size={14} className="rotate-180" /> Volver a {meta.codigo}
        </button>
        <button onClick={guardar} disabled={guardando} className={btnPrimary}>
          <Save size={14} /> {guardando ? 'Guardando...' : 'Guardar Indicador'}
        </button>
      </div>

      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-md">
        <span className="text-[11px] font-bold uppercase tracking-widest text-lime-400">
          {meta.codigo} · Indicador {indicador.codigo}
        </span>
        <h4 className="text-lg font-black mt-1">{indicador.nombre}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">Nombre</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-sm text-white focus:border-lime-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">Forma de cálculo</label>
            <select value={forma} onChange={(e) => setForma(e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-sm text-white focus:border-lime-500 focus:outline-none">
              {FORMAS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">Ponderación IAAPS (%)</label>
            <input value={ponderacion} onChange={(e) => setPonderacion(e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-sm text-white focus:border-lime-500 focus:outline-none" />
          </div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input type="checkbox" checked={vigente} onChange={(e) => setVigente(e.target.checked)} className="w-5 h-5 accent-lime-500" />
              Vigente
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">Orientación de la meta</label>
            <select value={orientacion} onChange={(e) => setOrientacion(e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-sm text-white focus:border-lime-500 focus:outline-none">
              <option value="MAYOR_MEJOR">Mayor es mejor (coberturas)</option>
              <option value="MENOR_MEJOR">Menor es mejor (derivaciones, hospitalizaciones)</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              <Sigma size={13} /> Fórmula oficial (texto)
            </label>
            <textarea value={formula} onChange={(e) => setFormula(e.target.value)} rows={2}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-sm text-white focus:border-lime-500 focus:outline-none" />
          </div>
        </div>
      </div>

      <ComponentesPanel indicador={indicador} onRecargar={onRecargar} onError={onError} onOk={onOk} />
      <ValoresPanel indicador={indicador} onRecargar={onRecargar} onError={onError} onOk={onOk} />
    </div>
  );
}

// ==================== Componentes de dato (celdas REM) ====================
function ComponentesPanel({ indicador, onRecargar, onError, onOk }: {
  indicador: Indicador;
  onRecargar: () => void;
  onError: (t: string) => void;
  onOk: (t: string) => void;
}) {
  const vacio = { tipo: 'NUMERADOR', descripcion: '', origen: 'REM', rem_hoja: '', rem_celda: '', valor_fijo: '' };
  const [form, setForm] = useState<typeof vacio>({ ...vacio });
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setGuardando(true);
    const payload: Record<string, unknown> = {
      indicador: indicador.id,
      tipo: form.tipo,
      descripcion: form.descripcion,
      origen: form.origen,
      rem_hoja: form.origen === 'REM' ? form.rem_hoja : '',
      rem_celda: form.origen === 'REM' ? form.rem_celda : '',
      valor_fijo: form.origen === 'VALOR_FIJO' ? form.valor_fijo : null,
    };
    try {
      if (editandoId) {
        await api.put(`param/componentes/${editandoId}/`, payload);
        onOk('Componente de dato actualizado.');
      } else {
        await api.post('param/componentes/', payload);
        onOk('Componente de dato agregado.');
      }
      setForm({ ...vacio });
      setEditandoId(null);
      onRecargar();
    } catch (e: any) {
      const d = e.response?.data;
      onError(d ? (typeof d === 'object' ? Object.values(d).flat().join(' ') : String(d)) : 'Error al guardar el componente.');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id: number) => {
    try {
      await api.delete(`param/componentes/${id}/`);
      onOk('Componente eliminado.');
      if (editandoId === id) { setEditandoId(null); setForm({ ...vacio }); }
      onRecargar();
    } catch {
      onError('No se pudo eliminar el componente.');
    }
  };

  const editar = (c: Componente) => {
    setEditandoId(c.id);
    setForm({
      tipo: c.tipo,
      descripcion: c.descripcion,
      origen: c.origen,
      rem_hoja: c.rem_hoja,
      rem_celda: c.rem_celda,
      valor_fijo: c.valor_fijo || '',
    });
  };

  return (
    <div className="border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
      <h4 className="font-black text-blue-950 text-sm uppercase tracking-wide flex items-center gap-2">
        <MapPin size={16} /> Origen de los datos (celdas del REM)
      </h4>

      {indicador.componentes.length > 0 ? (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/60">
              <th className="py-2.5 px-3">Tipo</th>
              <th className="py-2.5 px-3">Descripción</th>
              <th className="py-2.5 px-3">Origen</th>
              <th className="py-2.5 px-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {indicador.componentes.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/80">
                <td className="py-2.5 px-3">
                  <span className={`font-bold text-xs px-2 py-1 rounded-full ${c.tipo === 'NUMERADOR' ? 'bg-lime-100 text-lime-800' : 'bg-orange-100 text-orange-800'}`}>
                    {c.tipo}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-medium text-slate-700 max-w-[220px] truncate">{c.descripcion}</td>
                <td className="py-2.5 px-3 font-mono text-xs font-bold text-blue-950 whitespace-nowrap">
                  {c.origen === 'REM' ? `${c.rem_hoja}!${c.rem_celda}` : `Fijo: ${c.valor_fijo}`}
                </td>
                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                  <button onClick={() => editar(c)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-950"><Pencil size={14} /></button>
                  <button onClick={() => eliminar(c.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-xs text-slate-400 font-medium bg-slate-50 rounded-xl p-3">
          Sin datos de origen configurados. Agregue al menos el numerador (y denominador si la fórmula lo requiere).
        </p>
      )}

      {/* Formulario agregar / editar componente */}
      <div className="border-t border-dashed border-slate-200 pt-4">
        <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-3 flex items-center gap-2">
          {editandoId ? <><Pencil size={13} /> Editando componente #{editandoId}</> : <><Plus size={13} /> Agregar componente de dato</>}
          {editandoId && (
            <button onClick={() => { setEditandoId(null); setForm({ ...vacio }); }} className="ml-auto text-slate-400 hover:text-slate-700"><X size={14} /></button>
          )}
        </h5>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className={inputCls}>
            <option value="NUMERADOR">Numerador</option>
            <option value="DENOMINADOR">Denominador</option>
          </select>
          <select value={form.origen} onChange={(e) => setForm({ ...form, origen: e.target.value })} className={inputCls}>
            <option value="REM">Celda del REM</option>
            <option value="VALOR_FIJO">Valor fijo</option>
          </select>
          <input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción del dato" className={inputCls + ' md:col-span-2'} />
          {form.origen === 'REM' ? (
            <>
              <input value={form.rem_hoja} onChange={(e) => setForm({ ...form, rem_hoja: e.target.value.toUpperCase() })} placeholder="Hoja (A02)" className={inputCls + ' font-mono'} />
              <input value={form.rem_celda} onChange={(e) => setForm({ ...form, rem_celda: e.target.value.toUpperCase() })} placeholder="Celda (D14 o D11-F11)" className={inputCls + ' font-mono'} />
            </>
          ) : (
            <>
              <input value={form.valor_fijo} onChange={(e) => setForm({ ...form, valor_fijo: e.target.value })} placeholder="Valor fijo (ej: 4215)" className={inputCls + ' md:col-span-2'} />
            </>
          )}
        </div>
        <div className="flex justify-end mt-3">
          <button onClick={guardar} disabled={!form.descripcion || guardando} className={btnPrimary + ' disabled:opacity-50'}>
            <Save size={14} /> {guardando ? 'Guardando...' : editandoId ? 'Actualizar componente' : 'Agregar componente'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== Valores anuales (meta esperada) ====================
function ValoresPanel({ indicador, onRecargar, onError, onOk }: {
  indicador: Indicador;
  onRecargar: () => void;
  onError: (t: string) => void;
  onOk: (t: string) => void;
}) {
  const [anio, setAnio] = useState('');
  const [valor, setValor] = useState('');
  const [comentario, setComentario] = useState('');
  const [guardando, setGuardando] = useState(false);

  const agregar = async () => {
    setGuardando(true);
    try {
      await api.post('param/valores/', {
        indicador: indicador.id, anio, valor, comentario,
      });
      setAnio(''); setValor(''); setComentario('');
      onOk(`Meta ${anio} registrada para ${indicador.codigo}.`);
      onRecargar();
    } catch (e: any) {
      const d = e.response?.data;
      onError(d ? (typeof d === 'object' ? Object.values(d).flat().join(' ') : String(d)) : 'Error al registrar el valor.');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id: number) => {
    try {
      await api.delete(`param/valores/${id}/`);
      onOk('Valor anual eliminado.');
      onRecargar();
    } catch {
      onError('No se pudo eliminar el valor.');
    }
  };

  return (
    <div className="border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
      <h4 className="font-black text-blue-950 text-sm uppercase tracking-wide flex items-center gap-2">
        <Target size={16} /> Valores esperados por año
      </h4>

      {indicador.valores.length > 0 ? (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/60">
              <th className="py-2.5 px-3">Año</th>
              <th className="py-2.5 px-3">Meta</th>
              <th className="py-2.5 px-3">Comentario</th>
              <th className="py-2.5 px-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {indicador.valores.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50/80">
                <td className="py-2.5 px-3 font-bold text-slate-800">{v.anio}</td>
                <td className="py-2.5 px-3 font-black text-blue-950">{v.valor}</td>
                <td className="py-2.5 px-3 text-slate-500 text-xs">{v.comentario || '—'}</td>
                <td className="py-2.5 px-3 text-right">
                  <button onClick={() => eliminar(v.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-xs text-slate-400 font-medium bg-slate-50 rounded-xl p-3">
          Sin valores esperados registrados. Ej: para 6.1.A en 2026 la meta nacional es 27 (%).
        </p>
      )}

      <div className="border-t border-dashed border-slate-200 pt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className={labelCls}>Año</label>
            <input value={anio} onChange={(e) => setAnio(e.target.value)} placeholder="2026" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Valor esperado</label>
            <input value={valor} onChange={(e) => setValor(e.target.value)} placeholder="27" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Comentario</label>
            <input value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Meta nacional 2026" className={inputCls} />
          </div>
          <div className="flex items-end">
            <button onClick={agregar} disabled={!anio || !valor || guardando} className={btnPrimary + ' disabled:opacity-50'}>
              <Plus size={14} /> {guardando ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
