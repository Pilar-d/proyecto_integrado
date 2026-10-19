import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
import bgImage from '../assets/cesfam.jpeg';
import logoImage from '../assets/logo.png';

export default function RecuperarPassword() {
  const [rut, setRut] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRecuperar = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!rut.trim()) {
      setError('Por favor ingrese su RUT institucional.');
      return;
    }

    // Simulamos el envío de correo de recuperación al sistema del CESFAM
    setEnviado(true);
  };

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col md:flex-row overflow-hidden m-0 p-0 bg-white">
      {/* Columna Izquierda: Imagen Institucional */}
      <div className="relative w-full md:w-3/5 h-1/3 md:h-full overflow-hidden bg-blue-950 flex flex-col justify-end p-8 md:p-16">
        <div className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-1000 scale-105" style={{ backgroundImage: `url(${bgImage})` }} />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-blue-950/90 via-blue-950/20 to-transparent" />
        <div className="relative z-10 text-white max-w-xl">
          <span className="inline-block px-3 py-1 rounded-full bg-lime-500 text-blue-950 font-bold text-xs uppercase tracking-wider mb-3 shadow-md">
            Soporte Técnico Informático
          </span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-none drop-shadow-md">
            CESFAM Santa Rosa
          </h2>
          <p className="text-slate-200 text-sm md:text-base mt-3 font-medium drop-shadow">
            Módulo de recuperación de credenciales y restablecimiento seguro de acceso a la plataforma de metas sanitarias.
          </p>
        </div>
      </div>

      {/* Columna Derecha: Formulario de Recuperación */}
      <div className="w-full md:w-2/5 h-2/3 md:h-full flex items-center justify-center bg-white p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          <div className="mb-6 text-center flex flex-col items-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white p-2 mb-4 shadow-md relative overflow-hidden border border-slate-100">
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-lime-500 rounded-bl-full z-10" />
              <span className="absolute -bottom-1 -left-1 w-4 h-4 bg-blue-500 rounded-tr-full z-10" />
              <img src={logoImage} alt="Logo" className="w-full h-full object-contain z-0" />
            </div>
            <h1 className="text-2xl font-black tracking-wider text-blue-950">RECUPERACIÓN</h1>
            <h2 className="text-sm font-bold tracking-widest text-slate-500 mt-0.5 uppercase">De Contraseña Institucional</h2>
          </div>

          {error && (
            <div className="rounded-xl bg-orange-50 p-4 text-sm text-orange-800 border border-orange-200 shadow-sm flex items-center gap-2">
              <ShieldAlert size={18} className="shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {enviado ? (
            <div className="space-y-6 text-center">
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                <CheckCircle2 size={40} className="text-emerald-600 mx-auto" />
                <h3 className="font-bold text-emerald-900 text-base">Solicitud Procesada</h3>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Si el RUT ingresado se encuentra registrado en el sistema, se han enviado las instrucciones de restablecimiento al correo institucional asociado.
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full rounded-xl bg-blue-950 py-3.5 text-white font-bold text-sm shadow-lg hover:bg-blue-900 transition flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} /> Volver al Inicio de Sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleRecuperar} className="space-y-4">
              <p className="text-xs text-slate-600 text-center font-medium">
                Ingrese su RUT institucional registrado para recibir un enlace de restablecimiento de contraseña.
              </p>

              <div className="text-left">
                <label className="block text-xs font-bold uppercase tracking-wider text-blue-950 mb-1.5">RUT Institucional</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-blue-600"><User size={18} /></span>
                  <input 
                    type="text" 
                    required 
                    value={rut} 
                    onChange={(e) => setRut(e.target.value)} 
                    placeholder="11111111-1" 
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-slate-900 text-sm focus:outline-none focus:border-blue-900" 
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{ backgroundColor: '#4da84d' }}
                className="w-full rounded-xl py-3.5 text-white font-bold text-sm shadow-lg hover:opacity-95 transition border-b-4 cursor-pointer"
              >
                Enviar Instrucciones
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Volver a Iniciar Sesión
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}