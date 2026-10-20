// frontend/src/pages/ComentariosProgramas.tsx
import React, { useState } from 'react';
import { MessageSquare, Send, Calendar, User } from 'lucide-react';

export default function ComentariosProgramas() {
  const [comentarios, setComentarios] = useState([
    { id: 1, programa: 'Programa Adulto Mayor', autor: 'Enf. Marcela Riquelme (Jefe Programa)', texto: 'Se observa un incremento en controles cardiovasculares gracias a operativos sabatinos.', fecha: '2026-10-15 10:30' },
    { id: 2, programa: 'Programa Odontológico', autor: 'Dr. Esteban Tapia (Jefe Programa)', texto: 'Meta de alta odontológica infantil en riesgo por rotación de personal en Sector Azul.', fecha: '2026-10-14 16:45' }
  ]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [programaSeleccionado, setProgramaSeleccionado] = useState('Programa Adulto Mayor');

  const userRole = localStorage.getItem('user_role') || 'Directora';
  const userName = localStorage.getItem('user_name') || 'Funcionario';

  const handleEnviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;

    const item = {
      id: Date.now(),
      programa: programaSeleccionado,
      autor: `${userName} (${userRole})`,
      texto: nuevoComentario,
      fecha: new Date().toLocaleString()
    };

    setComentarios([item, ...comentarios]);
    setNuevoComentario('');
  };

  return (
    <div className="w-full min-h-full bg-slate-50 p-6 md:p-8 space-y-6">
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-xl font-black text-blue-950">Módulo de Comentarios y Observaciones Clínicas</h3>
        <p className="text-sm text-slate-500">Registro oficial de anotaciones por programa y meta evaluativa accesible para Dirección y Subdirección[cite: 7].</p>
      </div>

      {/* Formulario exclusivo para Jefe de Programa (o lectura para Directora/Subdirección) */}
      {userRole === 'JefePrograma' && (
        <form onSubmit={handleEnviar} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h4 className="font-bold text-blue-950 text-sm uppercase">Redactar Nueva Observación</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Programa / Meta Asociada</label>
              <select value={programaSeleccionado} onChange={(e) => setProgramaSeleccionado(e.target.value)} className="w-full rounded-xl border border-slate-300 p-2 text-sm bg-slate-50">
                <option value="Programa Adulto Mayor">Programa Adulto Mayor</option>
                <option value="Programa Odontológico">Programa Odontológico</option>
                <option value="Programa Infancia / Control Sano">Programa Infancia / Control Sano</option>
                <option value="Salud Mental Transversal">Salud Mental Transversal</option>
              </select>
            </div>
          </div>
          <div>
            <textarea rows={3} value={nuevoComentario} onChange={(e) => setNuevoComentario(e.target.value)} placeholder="Escriba aquí el análisis o justificación de cumplimiento de meta..." className="w-full rounded-xl border border-slate-300 p-3 text-sm bg-slate-50 focus:outline-none" required />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="flex items-center gap-2 bg-blue-950 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow hover:bg-blue-900 transition">
              <Send size={16} /> Publicar Comentario
            </button>
          </div>
        </form>
      )}

      {/* Historial de Comentarios visibles en todos los roles */}
      <div className="space-y-4">
        <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Historial de Comentarios Institucionales</h4>
        {comentarios.map((c) => (
          <div key={c.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-blue-950 text-sm flex items-center gap-2">
                <MessageSquare size={16} className="text-emerald-600" /> {c.programa}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar size={12} /> {c.fecha}
              </span>
            </div>
            <p className="text-sm text-slate-700 font-medium">{c.texto}</p>
            <div className="text-xs font-semibold text-slate-500 flex items-center gap-1 pt-1">
              <User size={12} /> Registrado por: <span className="text-blue-900 font-bold">{c.autor}</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}