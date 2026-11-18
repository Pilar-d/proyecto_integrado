// frontend/src/pages/ConfiguracionCuenta.tsx
import React, { useState } from 'react';
import api from '../api/axios';
import { User, Lock, Save, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function ConfiguracionCuenta() {
  const userName = localStorage.getItem('user_name') || '';
  const userEmail = localStorage.getItem('user_email') || '';
  const userRole = localStorage.getItem('user_role') || '';

  const [nombre, setNombre] = useState(userName);
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [cargando, setCargando] = useState(false);

  // Verificamos si el rol activo es Gestor / Administrador
  const esGestor = userRole === 'Gestor' || userRole === 'Administrador';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje({ texto: '', tipo: '' });

    if (passwordNueva && passwordNueva !== passwordConfirmar) {
      setMensaje({ texto: 'Las nuevas contraseñas no coinciden.', tipo: 'error' });
      return;
    }

    setCargando(true);
    try {
      // Simulación o llamada real al endpoint de actualización
      // await api.put('auth/perfil/', { nombre, password_actual: passwordActual, password_nueva: passwordNueva });
      
      const mensajeExito = esGestor 
        ? 'Cambios guardados y aplicados directamente con privilegios de Gestor.' 
        : 'Información y credenciales actualizadas exitosamente.';

      setMensaje({ texto: mensajeExito, tipo: 'exito' });
      setPasswordActual('');
      setPasswordNueva('');
      setPasswordConfirmar('');
      localStorage.setItem('user_name', nombre);
    } catch {
      setMensaje({ texto: 'Error al actualizar la cuenta. Verifique sus credenciales.', tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="w-full min-h-full bg-slate-50 p-6 md:p-8 space-y-6">
      
      {/* Cabecera del Módulo Centrada y sin icono */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center space-y-1">
        <h3 className="text-xl font-black text-blue-950">Configuración de Cuenta y Perfil</h3>
        <p className="text-sm font-medium text-slate-500 max-w-2xl">
          Gestione sus credenciales de acceso, revise su rol asignado y actualice su información personal.
        </p>
      </div>

      {mensaje.texto && (
        <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-2 ${mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'}`}>
          {mensaje.tipo === 'exito' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* Formulario de Configuración */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          
          {/* Alerta informativa para el Gestor */}
          {esGestor && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-3 text-blue-900 text-xs font-semibold">
              <ShieldAlert size={18} className="text-blue-600 shrink-0" />
              <span>Perfil con privilegios de <strong>Gestor de Información</strong>: Sus modificaciones se aplican de forma inmediata sin necesidad de aprobación administrativa previa.</span>
            </div>
          )}

          {/* Información General / Rol (No editable directamente) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Correo Electrónico (Institucional)</label>
              <input 
                type="email" 
                value={userEmail} 
                disabled 
                className="w-full rounded-xl border border-slate-200 bg-slate-100 p-3 text-sm font-semibold text-slate-500 cursor-not-allowed" 
              />
              <span className="text-[11px] text-slate-400 mt-1 block">El correo está asociado a sus credenciales de red.</span>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Rol Asignado en el Sistema</label>
              <input 
                type="text" 
                value={userRole} 
                disabled 
                className="w-full rounded-xl border border-slate-200 bg-slate-100 p-3 text-sm font-bold text-blue-950 cursor-not-allowed" 
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                {esGestor ? 'Acceso administrativo total habilitado.' : 'Los permisos son gestionados por el Administrador.'}
              </span>
            </div>
          </div>

          {/* Datos Personales */}
          <div className="space-y-4">
            <h4 className="font-bold text-blue-950 text-base flex flex-col items-center text-center justify-center gap-2">
              <User size={18} className="text-blue-600" />
              Datos Personales
            </h4>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Nombre Completo</label>
              <input 
                type="text" 
                value={nombre} 
                onChange={(e) => setNombre(e.target.value)} 
                required
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm font-semibold text-slate-800 focus:border-blue-900 focus:outline-none" 
              />
            </div>
          </div>

          {/* Cambio de Contraseña */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="font-bold text-blue-950 text-base flex flex-col items-center text-center justify-center gap-2">
              <Lock size={18} className="text-blue-600" />
              Cambiar Contraseña de Acceso
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Contraseña Actual (Requerida para cambios)</label>
                <input 
                  type="password" 
                  value={passwordActual} 
                  onChange={(e) => setPasswordActual(e.target.value)} 
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 focus:border-blue-900 focus:outline-none" 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Nueva Contraseña</label>
                  <input 
                    type="password" 
                    value={passwordNueva} 
                    onChange={(e) => setPasswordNueva(e.target.value)} 
                    placeholder="Mínimo 8 caracteres"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 focus:border-blue-900 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Confirmar Nueva Contraseña</label>
                  <input 
                    type="password" 
                    value={passwordConfirmar} 
                    onChange={(e) => setPasswordConfirmar(e.target.value)} 
                    placeholder="Repita la contraseña"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 focus:border-blue-900 focus:outline-none" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botón de Guardar */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={cargando}
              className="flex items-center gap-2 bg-blue-950 text-white px-6 py-3 rounded-xl font-bold text-sm shadow hover:bg-blue-900 transition cursor-pointer disabled:opacity-50"
            >
              <Save size={18} />
              {cargando ? 'Guardando...' : esGestor ? 'Guardar Cambios Directos' : 'Guardar Cambios'}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}