import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Lock, User, Plus } from 'lucide-react';
import bgImage from '../assets/cesfam.jpeg'; // Tu imagen de fondo desde assets
import logoImage from '../assets/logo.png'; // Cambia 'tu-logo.png' por el nombre real de tu archivo


export default function Login() {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await api.post('token/', {
        username: rut.trim(),
        password: password
      });

      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user_role', 'Gestor');

      navigate('/dashboard');
    } catch (err: any) {
      console.error("Error en login:", err.response || err);
      setError('Credenciales inválidas. Verifique su RUT y contraseña.');
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col md:flex-row overflow-hidden m-0 p-0 bg-white">
      
      {/* ================= COLUMNA IZQUIERDA: IMAGEN INSTITUCIONAL ================= */}
      <div className="relative w-full md:w-3/5 h-1/3 md:h-full overflow-hidden bg-blue-950 flex flex-col justify-end p-8 md:p-16">
        {/* Imagen de fondo con opacidad aclarada y sin filtros oscuros excesivos */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
        
        {/* Capa de gradiente sutil solo en la parte inferior para que resalte el texto superpuesto */}
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-blue-950/90 via-blue-950/20 to-transparent" />

        {/* Texto institucional sobre la imagen */}
        <div className="relative z-10 text-white max-w-xl">
          <span className="inline-block px-3 py-1 rounded-full bg-lime-500 text-blue-950 font-bold text-xs uppercase tracking-wider mb-3 shadow-md">
            Atención Primaria de Salud
          </span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-none drop-shadow-md">
            CESFAM Santa Rosa
          </h2>
          <p className="text-slate-200 text-sm md:text-base mt-3 font-medium drop-shadow">
            Plataforma centralizada de gestión, procesamiento y monitoreo de indicadores de cumplimiento de metas sanitarias.
          </p>
        </div>
      </div>

      {/* ================= COLUMNA DERECHA: FORMULARIO DE LOGIN ================= */}
      <div className="w-full md:w-2/5 h-2/3 md:h-full flex items-center justify-center bg-white p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          
          {/* Cabecera del formulario */}
          <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white p-2 mb-4 shadow-md relative overflow-hidden border border-slate-100">
            {/* Detalles decorativos en las esquinas */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-lime-500 rounded-bl-full z-10" />
            <span className="absolute -bottom-1 -left-1 w-4 h-4 bg-blue-500 rounded-tr-full z-10" />
            
            {/* Imagen de logo integrada */}
            <img 
              src={logoImage} 
              alt="Logo Institucional" 
              className="w-full h-full object-contain z-0" 
            />
          </div>

            <h1 className="text-2xl font-black tracking-wider text-lime-600">
              CESFAM
            </h1>
            <h2 className="text-xl font-bold tracking-widest text-blue-950 mt-0.5">
              SANTA ROSA
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
              Ingrese a su cuenta institucional
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-orange-50 p-4 text-sm text-orange-800 border border-orange-200 shadow-sm flex items-center gap-3">
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-blue-950 mb-1.5">
                RUT Institucional
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-blue-600">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  required
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  placeholder="12345678-9"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 text-sm focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 focus:outline-none transition"
                />
              </div>
            </div>

            <div className="text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-blue-950 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-blue-600">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 text-sm focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 focus:outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-950 py-3.5 text-white font-bold text-sm shadow-lg shadow-blue-950/20 hover:bg-blue-900 focus:ring-4 focus:ring-blue-900/20 transition-all duration-200 border-b-4"
            >
              Iniciar Sesión
            </button>
          </form>

          <div className="text-center text-xs text-slate-400 border-t border-slate-100 pt-4 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-lime-500"></span>
            Área de Salud Municipal • Temuco
          </div>
        </div>
      </div>
    </div>
  );
}
