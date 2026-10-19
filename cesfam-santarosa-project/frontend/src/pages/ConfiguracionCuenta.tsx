// frontend/src/pages/ConfiguracionCuenta.tsx
import React, { useState } from 'react';
import { UserCheck, Lock, Shield, Mail, Phone, Building, Save, CheckCircle2 } from 'lucide-react';

export default function ConfiguracionCuenta() {
  const userName = localStorage.getItem('user_name') || 'Funcionario CESFAM';
  const userRole = localStorage.getItem('user_role') || 'Gestor';
  const userPhoto = localStorage.getItem('user_photo') || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150';

  const [passActual, setPassActual] = useState('');
  const [passNuevo, setPassNuevo] = useState('');
  const [passConfirmar, setPassConfirmar] = useState('');
  const [mensaje, setMensaje] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCambiarPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);

    if (passNuevo !== passConfirmar) {
      setMensaje({ type: 'error', text: 'Las nuevas contraseñas no coinciden.' });
      return;
    }

    if (passNuevo.length < 6) {
      setMensaje({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    // Simulación de cambio de contraseña exitoso
    setMensaje({ type: 'success', text: 'Contraseña actualizada exitosamente.' });
    setPassActual('');
    setPassNuevo('');
    setPassConfirmar('');
  };

  const handleSolicitarCambio = () => {
    alert('Se ha enviado una notificación al Gestor de Información (Administrador) solicitando la actualización de sus datos de cuenta.');
  };

  return (
    <div className="w-full min-h-full bg-slate-50 p-6 md:p-8 space-y-6">
      
      {/* Cabecera del Módulo */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center gap-4">
        <div>
          <h3 className="text-xl font-black text-blue-950">Configuración de Cuenta y Perfil</h3>
          <p className="text-sm font-medium text-slate-500">
            Gestione sus credenciales de acceso, revise su rol asignado y solicite actualizaciones de cuenta
          </p>
        </div>
      </div>

      {/* Alerta de Estado */}
      {mensaje && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border shadow-sm ${
          mensaje.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-orange-50 text-orange-900 border-orange-200'
        }`}>
          <CheckCircle2 size={20} className={mensaje.type === 'success' ? 'text-emerald-600' : 'text-orange-600'} />
          <span className="text-sm font-semibold">{mensaje.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Información de la Cuenta */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 md:col-span-1 text-center">
          <div className="relative inline-block mx-auto">
            <img src={userPhoto} alt="Foto de perfil" className="w-28 h-28 rounded-full object-cover mx-auto border-4 border-emerald-500 shadow-md" />
            <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>

          <div className="space-y-1">
            <h4 className="text-lg font-bold text-slate-900">{userName}</h4>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-900 font-bold text-xs border border-blue-200">
              <Shield size={12} className="text-blue-600" /> Rol: {userRole}
            </span>
          </div>

          <div className="border-t border-slate-100 pt-4 text-left space-y-3 text-xs text-slate-600">
            <p className="flex items-center gap-2"><Building size={15} className="text-slate-400" /> CESFAM Santa Rosa • Temuco</p>
            <p className="flex items-center gap-2"><Mail size={15} className="text-slate-400" /> funcionario.santarosa@salud.cl</p>
            <p className="flex items-center gap-2"><Phone size={15} className="text-slate-400" /> +56 9 1234 5678</p>
          </div>

          <button 
            onClick={handleSolicitarCambio}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Solicitar Cambio de Datos
          </button>
        </div>

        {/* Columna Derecha: Formulario de Cambio de Contraseña */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6 md:col-span-2">
          <div className="border-b border-slate-100 pb-4">
            <h4 className="font-bold text-blue-950 text-base flex flex-col items-center text-center justify-center gap-2">
              <Lock size={18} className="text-blue-600" /> Cambiar Contraseña de Acceso
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Asegúrese de utilizar una contraseña segura que combine letras, números y símbolos.
            </p>
          </div>

          <form onSubmit={handleCambiarPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Contraseña Actual</label>
              <input 
                type="password" 
                required 
                value={passActual} 
                onChange={(e) => setPassActual(e.target.value)} 
                placeholder="••••••••" 
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-900 focus:outline-none focus:border-blue-900" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Nueva Contraseña</label>
              <input 
                type="password" 
                required 
                value={passNuevo} 
                onChange={(e) => setPassNuevo(e.target.value)} 
                placeholder="••••••••" 
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-900 focus:outline-none focus:border-blue-900" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Confirmar Nueva Contraseña</label>
              <input 
                type="password" 
                required 
                value={passConfirmar} 
                onChange={(e) => setPassConfirmar(e.target.value)} 
                placeholder="••••••••" 
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-900 focus:outline-none focus:border-blue-900" 
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                style={{ backgroundColor: '#2e6b46' }}
                className="flex items-center gap-2 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:opacity-95 transition cursor-pointer"
              >
                <Save size={18} /> Guardar Nueva Contraseña
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}