import React, { useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FileSpreadsheet, Users, ShieldCheck, 
  Settings, LogOut, Menu, X, FileText, MessageSquare, UserCheck, Table, History 
} from 'lucide-react';
import logoImage from '../assets/logo.png';

export default function DisenoPrincipal() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  const userRole = localStorage.getItem('user_role') || 'Directora';
  const userName = localStorage.getItem('user_name') || 'Funcionario';
  const userPhoto = localStorage.getItem('user_photo') || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white fixed inset-0 m-0 p-0">
      
      {/* Menú Lateral con Hamburguesa y Foto de Rol */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-blue-950 text-slate-300 transition-all duration-300 flex flex-col shrink-0`}>        
        <div className={`flex h-16 items-center px-4 border-b border-slate-800 ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
          <div className={`flex items-center gap-2 overflow-hidden ${!sidebarOpen && 'hidden'}`}>
            <img src={logoImage} alt="Logo" className="w-8 h-8 object-contain bg-white rounded-lg p-1 shrink-0" />
            <span className="font-bold text-white text-xs truncate">CESFAM Santa Rosa</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white cursor-pointer">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Apartado de Datos de Cuenta, Foto y Rol del Funcionario */}
        {sidebarOpen && (
          <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-blue-900/60">
            <img src={userPhoto} alt="Perfil" className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500 shrink-0" />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{userName}</p>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold uppercase mt-0.5">
                Rol: {userRole}
              </span>
            </div>
          </div>
        )}

        {/* Módulos Filtrados por Rol */}
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          {(userRole === 'Directora' || userRole === 'Subdireccion' || userRole === 'Gestor') && (
            <Link 
              to="/dashboard" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${sidebarOpen ? 'justify-start' : 'justify-center'} ${location.pathname === '/dashboard' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <LayoutDashboard size={18} className="shrink-0" />
              {sidebarOpen && <span className="truncate">Dashboard General</span>}
            </Link>
          )}

          {(userRole === 'Subdireccion' || userRole === 'Gestor') && (
            <Link 
              to="/admin-rem" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${sidebarOpen ? 'justify-start' : 'justify-center'} ${location.pathname === '/admin-rem' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <FileSpreadsheet size={18} className="shrink-0" />
              {sidebarOpen && <span className="truncate">Carga y Gestión REM</span>}
            </Link>
          )}

          {(userRole === 'Subdireccion' || userRole === 'Gestor') && (
            <Link 
              to="/estado-datos" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${sidebarOpen ? 'justify-start' : 'justify-center'} ${location.pathname === '/estado-datos' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <Table size={18} className="shrink-0" />
              {sidebarOpen && <span className="truncate">Estado de Datos</span>}
            </Link>
          )}
          
          <Link 
            to="/reportes" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${sidebarOpen ? 'justify-start' : 'justify-center'} ${location.pathname === '/reportes' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <FileText size={18} className="shrink-0" />
            {sidebarOpen && <span className="truncate">Reportes y Programas</span>}
          </Link>

          {(userRole === 'Directora' || userRole === 'Subdireccion' || userRole === 'Gestor') && (
            <Link 
              to="/historico" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${sidebarOpen ? 'justify-start' : 'justify-center'} ${location.pathname === '/historico' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <History size={18} className="shrink-0" />
              {sidebarOpen && <span className="truncate">Comparativo Histórico</span>}
            </Link>
          )}

          {userRole === 'Gestor' && (
            <Link 
              to="/usuarios" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${sidebarOpen ? 'justify-start' : 'justify-center'} ${location.pathname === '/usuarios' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <Users size={18} className="shrink-0" />
              {sidebarOpen && <span className="truncate">Gestión de Usuarios</span>}
            </Link>
          )}
          

          {userRole === 'Gestor' && (
            <Link 
              to="/audit" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${sidebarOpen ? 'justify-start' : 'justify-center'} ${location.pathname === '/audit' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <ShieldCheck size={18} className="shrink-0" />
              {sidebarOpen && <span className="truncate">Bitácora de Auditoría</span>}
            </Link>
          )}

          <Link 
            to="/comentarios-programas" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${sidebarOpen ? 'justify-start' : 'justify-center'} ${location.pathname === '/comentarios-programas' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <MessageSquare size={18} className="shrink-0" />
            {sidebarOpen && <span className="truncate">Comentarios Clínicos</span>}
          </Link>
        </nav>

        {/* Configuraciones de Cuenta y Botón Cerrar Sesión */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link to="/configuracion-cuenta" className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition text-xs font-semibold">
            <UserCheck size={16} />
            {sidebarOpen && <span>Mi Cuenta - Configuración</span>}
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition text-xs font-semibold cursor-pointer">
            <LogOut size={16} />
            {sidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Panel Principal */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h2 className="text-base font-bold text-slate-800"></h2>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full font-bold border border-emerald-200">
              Rol Activo: {userRole}
            </span>
            <img src={logoImage} alt="Logo Esquina" className="w-8 h-8 object-contain" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}