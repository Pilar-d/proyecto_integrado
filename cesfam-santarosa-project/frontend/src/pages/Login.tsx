// frontend/src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import bgImage from '../assets/cesfam.jpeg';
import logoImage from '../assets/logo.png';

export default function Login() {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Credenciales de prueba simuladas para cada rol
    const usuariosPrueba: Record<string, { rol: string; nombre: string; foto: string }> = {
      '11111111-1': { rol: 'Directora', nombre: 'Dra. Carmen Valdés', foto: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150' },
      '22222222-2': { rol: 'Subdireccion', nombre: 'Mg. Roberto Soto', foto: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150' },
      '33333333-3': { rol: 'Gestor', nombre: 'Gdi. Juan Pérez', foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
      '44444444-4': { rol: 'JefePrograma', nombre: 'Enf. Marcela Riquelme', foto: 'https://images.unsplash.com/photo-1594824813574-724bc2754643?w=150' },
    };

    const usuarioEncontrado = usuariosPrueba[rut.trim()];

    if (usuarioEncontrado) {
      // Guardar sesión simulada
      localStorage.setItem('access_token', 'token_falso_jwt_123456');
      localStorage.setItem('user_role', usuarioEncontrado.rol);
      localStorage.setItem('user_name', usuarioEncontrado.nombre);
      localStorage.setItem('user_photo', usuarioEncontrado.foto);

      // Redirigir según rol
      navigate('/dashboard');
    } else {
      setError('Credenciales inválidas. Pruebe con los RUTs de prueba autorizados.');
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col md:flex-row overflow-hidden m-0 p-0 bg-white">
      
      {/* Columna Izquierda: Imagen Institucional */}
      <div className="relative w-full md:w-3/5 h-1/3 md:h-full overflow-hidden bg-blue-950 flex flex-col justify-end items-center text-center p-8 md:p-16">
        <div className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-1000 scale-105" style={{ backgroundImage: `url(${bgImage})` }} />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-blue-950/90 via-blue-950/20 to-transparent" />
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

      {/* Columna Derecha: Formulario de Inicio de Sesión */}
      <div className="w-full md:w-2/5 h-2/3 md:h-full flex items-center justify-center bg-white p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          
          {/* Logo y Encabezado */}
          <div className="mb-6 text-center flex flex-col items-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white p-2 mb-4 shadow-md relative overflow-hidden border border-slate-100">
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-lime-500 rounded-bl-full z-10" />
              <span className="absolute -bottom-1 -left-1 w-4 h-4 bg-blue-500 rounded-tr-full z-10" />
              <img src={logoImage} alt="Logo" className="w-full h-full object-contain z-0" />
            </div>
            <h1 className="text-2xl font-black tracking-wider text-lime-600">CESFAM</h1>
            <h2 className="text-xl font-bold tracking-widest text-blue-950 mt-0.5">SANTA ROSA</h2>
            <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Ingrese con su cuenta institucional</p>
          </div>

          {/* Alerta de Error */}
          {error && (
            <div className="rounded-xl bg-orange-50 p-4 text-sm text-orange-800 border border-orange-200 shadow-sm">
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Campo RUT */}
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-slate-900 text-sm focus:outline-none" 
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div className="text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-blue-950 mb-1.5">Contraseña</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-blue-600"><Lock size={18} /></span>
                <input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-slate-900 text-sm focus:outline-none" 
                />
              </div>
            </div>

            {/* Botón Iniciar Sesión (#2e6b46) */}
            <button
              type="submit"
              style={{ backgroundColor: '#4da84d' }}
              className="w-full rounded-xl py-3.5 text-white font-bold text-sm shadow-lg hover:opacity-95 transition border-b-4 cursor-pointer mt-2"
            >
              Iniciar Sesión
            </button>
            
            {/* Enlace de recuperación de contraseña */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => navigate('/recuperar-password')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer">
                ¿Olvidó su contraseña?
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}