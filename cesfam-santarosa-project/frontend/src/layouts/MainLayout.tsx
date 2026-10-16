// frontend/src/layouts/MainLayout.tsx
import { useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, FileSpreadsheet, Users, ShieldCheck, LogOut, Menu, X } from 'lucide-react';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  
  // Roles oficiales: Directora | Subdireccion | Gestor | JefePrograma
  const userRole = localStorage.getItem('user_role') || 'SinRol';

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white fixed inset-0 m-0 p-0">
      
      {/* Menú Lateral (Sidebar) */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-slate-300 transition-all duration-300 flex flex-col shrink-0`}>
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
          <span className={`font-bold text-white ${!sidebarOpen && 'hidden'}`}>CESFAM Santa Rosa</span>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition">
            <LayoutDashboard size={20} />
            {sidebarOpen && <span>Dashboard General</span>}
          </Link>

          {/* Carga REM: solo Gestor y Subdirección (la Directora NO puede cargar REM, según requerimientos) */}
          {(userRole === 'Gestor' || userRole === 'Subdireccion') && (
            <Link to="/admin-rem" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition">
              <FileSpreadsheet size={20} />
              {sidebarOpen && <span>Carga y Gestión REM</span>}
            </Link>
          )}

          {/* Gestión de usuarios y bitácora: exclusivos del Gestor de Información */}
          {userRole === 'Gestor' && (
            <>
            <Link to="/usuarios" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition">
              <Users size={20} />
              {sidebarOpen && <span>Gestión de Usuarios</span>}
            </Link>

            <Link to="/audit" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition">
              <ShieldCheck size={20} />
              {sidebarOpen && <span>Bitácora de Auditoría</span>}
            </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition">
            <LogOut size={20} />
            {sidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Panel Derecho: Header + Contenido que ocupa el 100% real */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h2 className="text-base font-bold text-slate-800">Panel de Control Institucional</h2>
          <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold border border-emerald-200">
            Rol Activo: {userRole}
          </span>
        </header>

        {/* Contenido principal expandido al 100% sin padding externo */}
        <main className="flex-1 overflow-y-auto w-full bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
}