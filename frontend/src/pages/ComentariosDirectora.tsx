// frontend/src/pages/ComentariosDirectora.tsx
import React, { useState } from 'react';
import { MessageSquare, Search, Filter, Calendar, Clock, User, Shield, AlertCircle, CheckCircle2, Plus, X, Tag } from 'lucide-react';

interface ComentarioClinico {
  id: number;
  programa: string;
  sector: string;
  emitidoPor: string;
  rolEmisor: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  categoria: string;
  mensaje: string;
  fecha: string;
  hora: string;
  estado: 'Pendiente' | 'Revisado' | 'Resuelto';
}

export default function ComentariosDirectora() {
  const [comentarios, setComentarios] = useState<ComentarioClinico[]>([
    {
      id: 1,
      programa: 'Programa Odontológico',
      sector: 'Sector Norte',
      emitidoPor: 'Dr. Esteban Tapia',
      rolEmisor: 'Gestor / Odontólogo',
      prioridad: 'Alta',
      categoria: 'Cumplimiento de Metas GES',
      mensaje: 'Brecha del 15% en cobertura de atención de 6 años debido a retraso en insumos de rayos X. Se solicita revisión presupuestaria urgente.',
      fecha: '2026-10-17',
      hora: '09:15',
      estado: 'Pendiente'
    },
    {
      id: 2,
      programa: 'Programa Cardiovascular',
      sector: 'Sector Sur',
      emitidoPor: 'Enf. Marcela Riquelme',
      rolEmisor: 'Jefe de Programa',
      prioridad: 'Media',
      categoria: 'Inasistencia a Controles',
      mensaje: 'Alto índice de pacientes citados que no se presentan a control de hipertensión arterial. Se coordinará estrategia de llamadas de refuerzo.',
      fecha: '2026-10-16',
      hora: '14:30',
      estado: 'Revisado'
    },
    {
      id: 3,
      programa: 'Salud Infantil',
      sector: 'Sector Centro',
      emitidoPor: 'Dra. Carmen Valdés',
      rolEmisor: 'Directora',
      prioridad: 'Baja',
      categoria: 'Optimización de Agenda',
      mensaje: 'Excelente rendimiento en vacunación escolar superando la meta mensual en un 108%. Felicitaciones al equipo de enfermería.',
      fecha: '2026-10-15',
      hora: '11:00',
      estado: 'Resuelto'
    }
  ]);

  // Estados de búsqueda y filtros
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [filtroPrograma, setFiltroPrograma] = useState('Todos');
  const [filtroSector, setFiltroSector] = useState('Todos');
  const [filtroEmisor, setFiltroEmisor] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');

  // Estado del Modal para Crear Comentario
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevoPrograma, setNuevoPrograma] = useState('Programa Odontológico');
  const [nuevoSector, setNuevoSector] = useState('Sector Norte');
  const [nuevaPrioridad, setNuevaPrioridad] = useState<'Alta' | 'Media' | 'Baja'>('Media');
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [nuevoMensaje, setNuevoMensaje] = useState('');

  const handleCrearComentario = (e: React.FormEvent) => {
    e.preventDefault();
    const ahora = new Date();
    const fechaActual = ahora.toISOString().split('T')[0];
    const horaActual = ahora.toTimeString().slice(0, 5);

    const nuevo: ComentarioClinico = {
      id: comentarios.length + 1,
      programa: nuevoPrograma,
      sector: nuevoSector,
      emitidoPor: 'Funcionario Actual (Directora/Gestor)',
      rolEmisor: 'Dirección / Supervisión',
      prioridad: nuevaPrioridad,
      categoria: nuevaCategoria || 'Seguimiento General',
      mensaje: nuevoMensaje,
      fecha: fechaActual,
      hora: horaActual,
      estado: 'Pendiente'
    };

    setComentarios([nuevo, ...comentarios]);
    setNuevoMensaje('');
    setNuevaCategoria('');
    setModalAbierto(false);
    alert('Comentario clínico registrado y enviado exitosamente.');
  };

  // Filtrado avanzado
  const comentariosFiltrados = comentarios.filter(c => {
    const coincideTexto = c.mensaje.toLowerCase().includes(busquedaTexto.toLowerCase()) || c.categoria.toLowerCase().includes(busquedaTexto.toLowerCase());
    const coincidePrograma = filtroPrograma === 'Todos' || c.programa === filtroPrograma;
    const coincideSector = filtroSector === 'Todos' || c.sector === filtroSector;
    const coincideEmisor = !filtroEmisor || c.emitidoPor.toLowerCase().includes(filtroEmisor.toLowerCase());
    const coincideFecha = !filtroFecha || c.fecha === filtroFecha;
    return coincideTexto && coincidePrograma && coincideSector && coincideEmisor && coincideFecha;
  });

  return (
    <div className="w-full min-h-full bg-slate-50 p-6 md:p-8 space-y-6">
      
      {/* Cabecera del Módulo Centrada y sin icono */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center space-y-3">
        <div className="space-y-1 max-w-2xl">
          <h3 className="text-xl font-black text-blue-950">Observaciones y Comentarios Clínicos</h3>
          <p className="text-sm font-medium text-slate-500">
            Panel de lectura y seguimiento directivo sobre el rendimiento de metas por área y programa.
          </p>
        </div>
        <button 
          onClick={() => setModalAbierto(true)}
          style={{ backgroundColor: '#2e6b46' }}
          className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:opacity-95 transition cursor-pointer mt-2"
        >
          <Plus size={16} /> Emitir Nuevo Comentario
        </button>
      </div>

      {/* Barra de Búsqueda y Filtros Avanzados */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-5 gap-4">
        
        {/* Búsqueda por texto / categoría */}
        <div className="relative md:col-span-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><Search size={16} /></span>
          <input 
            type="text" 
            value={busquedaTexto} 
            onChange={(e) => setBusquedaTexto(e.target.value)} 
            placeholder="Buscar en mensajes..." 
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-slate-900 text-sm focus:outline-none" 
          />
        </div>

        {/* Filtro por Programa */}
        <div>
          <select 
            value={filtroPrograma} 
            onChange={(e) => setFiltroPrograma(e.target.value)} 
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-semibold text-slate-800 focus:outline-none"
          >
            <option value="Todos">Todos los Programas</option>
            <option value="Programa Odontológico">Programa Odontológico</option>
            <option value="Programa Cardiovascular">Programa Cardiovascular</option>
            <option value="Salud Infantil">Salud Infantil</option>
          </select>
        </div>

        {/* Filtro por Sector */}
        <div>
          <select 
            value={filtroSector} 
            onChange={(e) => setFiltroSector(e.target.value)} 
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-semibold text-slate-800 focus:outline-none"
          >
            <option value="Todos">Todos los Sectores</option>
            <option value="Sector Norte">Sector Norte</option>
            <option value="Sector Sur">Sector Sur</option>
            <option value="Sector Centro">Sector Centro</option>
          </select>
        </div>

        {/* Filtro por Emitido Por */}
        <div>
          <input 
            type="text" 
            value={filtroEmisor} 
            onChange={(e) => setFiltroEmisor(e.target.value)} 
            placeholder="Emitido por..." 
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm text-slate-900 focus:outline-none" 
          />
        </div>

        {/* Filtro por Fecha */}
        <div>
          <input 
            type="date" 
            value={filtroFecha} 
            onChange={(e) => setFiltroFecha(e.target.value)} 
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm text-slate-900 focus:outline-none" 
          />
        </div>

      </div>

      {/* Listado Detallado de Comentarios Clínicos */}
      <div className="space-y-4">
        {comentariosFiltrados.length > 0 ? (
          comentariosFiltrados.map((c) => (
            <div key={c.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4 hover:border-slate-300 transition">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-blue-950 text-white font-bold text-xs px-3 py-1 rounded-lg">
                    {c.programa}
                  </span>
                  <span className="bg-emerald-50 text-emerald-800 font-bold text-xs px-3 py-1 rounded-lg border border-emerald-200">
                    {c.sector}
                  </span>
                  <span className={`font-bold text-xs px-3 py-1 rounded-lg border ${
                    c.prioridad === 'Alta' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    c.prioridad === 'Media' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    Prioridad: {c.prioridad}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1"><Calendar size={13} className="text-slate-400" /> {c.fecha}</span>
                  <span className="flex items-center gap-1"><Clock size={13} className="text-slate-400" /> {c.hora}</span>
                </div>
              </div>

              {/* Categoría y Cuerpo del Mensaje */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                  <Tag size={14} className="text-blue-600" />
                  <span>{c.categoria}</span>
                </div>
                <p className="text-sm text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {c.mensaje}
                </p>
              </div>

              {/* Pie de tarjeta con Emisor y Estado */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <User size={14} className="text-slate-400" />
                  <span className="font-bold text-slate-900">{c.emitidoPor}</span>
                  <span className="text-slate-400">({c.rolEmisor})</span>
                </div>

                <div>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold text-xs ${
                    c.estado === 'Resuelto' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    c.estado === 'Revisado' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    Estado: {c.estado}
                  </span>
                </div>
              </div>

            </div>
          ))
        ) : (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center text-slate-400 text-sm font-medium">
            No se encontraron comentarios clínicos con los filtros especificados.
          </div>
        )}
      </div>

      {/* Modal para Emitir Nuevo Comentario */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-6 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h4 className="font-black text-blue-950 text-lg flex items-center gap-2">
                <MessageSquare className="text-emerald-600" size={20} />
                Emitir Nuevo Comentario Clínico
              </h4>
              <button onClick={() => setModalAbierto(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCrearComentario} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Programa de Salud</label>
                  <select 
                    value={nuevoPrograma} 
                    onChange={(e) => setNuevoPrograma(e.target.value)} 
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900 focus:outline-none"
                  >
                    <option value="Programa Odontológico">Programa Odontológico</option>
                    <option value="Programa Cardiovascular">Programa Cardiovascular</option>
                    <option value="Salud Infantil">Salud Infantil</option>
                    <option value="Salud Mental">Salud Mental</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Sector Asignado</label>
                  <select 
                    value={nuevoSector} 
                    onChange={(e) => setNuevoSector(e.target.value)} 
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900 focus:outline-none"
                  >
                    <option value="Sector Norte">Sector Norte</option>
                    <option value="Sector Sur">Sector Sur</option>
                    <option value="Sector Centro">Sector Centro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Prioridad</label>
                  <select 
                    value={nuevaPrioridad} 
                    onChange={(e) => setNuevaPrioridad(e.target.value as 'Alta' | 'Media' | 'Baja')} 
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900 focus:outline-none"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Categoría de Observación</label>
                  <input 
                    type="text" 
                    required
                    value={nuevaCategoria} 
                    onChange={(e) => setNuevaCategoria(e.target.value)} 
                    placeholder="Ej. Cumplimiento GES / Insumos" 
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 focus:outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Mensaje o Detalle Clínico</label>
                <textarea 
                  required
                  rows={4}
                  value={nuevoMensaje} 
                  onChange={(e) => setNuevoMensaje(e.target.value)} 
                  placeholder="Redacte la observación directiva o reporte de rendimiento..." 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 focus:outline-none" 
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setModalAbierto(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  style={{ backgroundColor: '#2e6b46' }}
                  className="px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-md hover:opacity-95 transition cursor-pointer"
                >
                  Enviar Comentario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}