import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, CheckCircle2, XCircle, Edit, Trash2, 
  Monitor, Globe, Clock, X, Search, RefreshCw, AlertTriangle 
} from 'lucide-react';
import api from '../api/axios';

interface RolItem {
  id: number;
  nombre_rol: string;
  descripcion: string;
}

interface UsuarioUI {
  id: number;
  rut: string;
  nombre: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: string;
  rol_id: number;
  estado: 'Activo' | 'Inactivo';
  ultimoAcceso: string;
  ip: string;
  dispositivo: string;
}

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioUI[]>([]);
  const [roles, setRoles] = useState<RolItem[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  // Estados de búsqueda y filtros
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [filtroRol, setFiltroRol] = useState('Todos');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  // Estados para modales y formularios
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [usuarioActualId, setUsuarioActualId] = useState<number | null>(null);

  // Campos del formulario
  const [rut, setRut] = useState('');
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [rol, setRol] = useState('Gestor');
  const [estado, setEstado] = useState<'Activo' | 'Inactivo'>('Activo');
  const [password, setPassword] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Cargar usuarios y roles reales desde los endpoints del Backend
  const cargarDatos = async () => {
    setCargando(true);
    setError('');
    try {
      const [resUsers, resRoles] = await Promise.all([
        api.get('usuarios/'),
        api.get('roles/')
      ]);

      if (resRoles.data) {
        setRoles(resRoles.data);
      }

      if (resUsers.data) {
        const formateados: UsuarioUI[] = resUsers.data.map((u: any) => ({
          id: u.id,
          rut: u.rut,
          nombre: `${u.nombres || ''} ${u.apellidos || ''}`.trim() || u.username,
          nombres: u.nombres || '',
          apellidos: u.apellidos || '',
          correo: u.email || u.correo || '',
          rol: u.rol_detalle?.nombre_rol || 'Gestor',
          rol_id: u.rol || 3,
          estado: u.estado ? 'Activo' : 'Inactivo',
          ultimoAcceso: u.last_login ? new Date(u.last_login).toLocaleString('es-CL') : 'Registrado recientemente',
          ip: '127.0.0.1 (Local)',
          dispositivo: 'Navegador Web / SES'
        }));
        setUsuarios(formateados);
      }
    } catch (err: any) {
      console.error('Error al cargar usuarios o roles:', err);
      if (err.response?.status === 403) {
        setError('Acceso denegado: Se requieren privilegios de Gestor para administrar usuarios.');
      } else {
        setError('No se pudo conectar con el endpoint de usuarios en el servidor.');
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setUsuarioActualId(null);
    setRut('');
    setNombre('');
    setCorreo('');
    setRol('Gestor');
    setEstado('Activo');
    setPassword('');
    setError('');
    setModalAbierto(true);
  };

  const abrirModalEditar = (user: UsuarioUI) => {
    setModoEdicion(true);
    setUsuarioActualId(user.id);
    setRut(user.rut);
    setNombre(user.nombre);
    setCorreo(user.correo);
    setRol(user.rol);
    setEstado(user.estado);
    setPassword('');
    setError('');
    setModalAbierto(true);
  };

  const handleGuardarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError('');

    // Separar nombres y apellidos
    const partes = nombre.trim().split(' ');
    const nombres = partes[0] || nombre;
    const apellidos = partes.slice(1).join(' ') || '.';

    // Obtener ID del rol seleccionado
    const rolEncontrado = roles.find(r => r.nombre_rol.toLowerCase() === rol.toLowerCase());
    const rol_id = rolEncontrado ? rolEncontrado.id : 3;

    try {
      if (modoEdicion && usuarioActualId !== null) {
        const payload: any = {
          rut,
          nombres,
          apellidos,
          email: correo,
          rol: rol_id,
          estado: estado === 'Activo'
        };
        if (password.trim() !== '') {
          payload.password = password;
        }

        await api.patch(`usuarios/${usuarioActualId}/`, payload);
        setMensajeExito(`Usuario '${nombres} ${apellidos}' actualizado correctamente.`);
      } else {
        const payload: any = {
          rut,
          nombres,
          apellidos,
          email: correo,
          rol: rol_id,
          estado: estado === 'Activo',
          password: password || 'cesfam2026'
        };

        await api.post('usuarios/', payload);
        setMensajeExito(`Nuevo usuario '${nombres} ${apellidos}' incorporado a PostgreSQL.`);
      }

      setModalAbierto(false);
      cargarDatos();
      setTimeout(() => setMensajeExito(''), 4000);
    } catch (err: any) {
      console.error('Error al guardar usuario:', err);
      const data = err.response?.data;
      if (data) {
        const msgs = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(' | ');
        setError(`Error del servidor: ${msgs}`);
      } else {
        setError('Error al procesar la solicitud en el endpoint de usuarios.');
      }
    } finally {
      setGuardando(false);
    }
  };

  const toggleEstadoUsuario = async (user: UsuarioUI) => {
    const nuevoEstadoBool = user.estado !== 'Activo';
    try {
      await api.patch(`usuarios/${user.id}/`, { estado: nuevoEstadoBool });
      setUsuarios(prev => prev.map(u => u.id === user.id ? { ...u, estado: nuevoEstadoBool ? 'Activo' : 'Inactivo' } : u));
    } catch (err) {
      console.error('Error al alternar estado:', err);
      alert('No se pudo cambiar el estado del usuario.');
    }
  };

  const eliminarUsuario = async (user: UsuarioUI) => {
    if (!confirm(`¿Está seguro de eliminar permanentemente a '${user.nombre}' (${user.rut}) de la base de datos?`)) {
      return;
    }

    try {
      await api.delete(`usuarios/${user.id}/`);
      setUsuarios(prev => prev.map(u => u.id).filter(id => id !== user.id).map(id => usuarios.find(u => u.id === id)!));
      setMensajeExito(`Usuario '${user.nombre}' eliminado de la base de datos.`);
      cargarDatos();
      setTimeout(() => setMensajeExito(''), 4000);
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      alert('Error al intentar eliminar el usuario.');
    }
  };

  // Filtrado avanzado de usuarios
  const usuariosFiltrados = usuarios.filter(u => {
    const coincideTexto = u.nombre.toLowerCase().includes(busquedaTexto.toLowerCase()) || u.rut.toLowerCase().includes(busquedaTexto.toLowerCase());
    const coincideRol = filtroRol === 'Todos' || u.rol === filtroRol;
    const coincideEstado = filtroEstado === 'Todos' || u.estado === filtroEstado;
    return coincideTexto && coincideRol && coincideEstado;
  });

  return (
    <div className="w-full min-h-full bg-slate-50 p-6 md:p-8 space-y-6">
      
      {/* Cabecera del Módulo */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center space-y-3">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-xl font-black text-blue-950">Gestión de Usuarios y Roles Institucionales</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              PostgreSQL
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500">
            Control de accesos RBAC, suspensión de cuentas, asignación de roles y persistencia directa en base de datos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={abrirModalCrear}
            style={{ backgroundColor: '#2e6b46' }}
            className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:opacity-95 transition cursor-pointer"
          >
            <UserPlus size={16} /> Nuevo Usuario
          </button>
          <button
            onClick={cargarDatos}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            title="Refrescar datos desde endpoint"
          >
            <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Alertas */}
      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-sm">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-sm">
          <AlertTriangle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Búsqueda por Funcionario / RUT */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><Search size={16} /></span>
          <input 
            type="text" 
            value={busquedaTexto} 
            onChange={(e) => setBusquedaTexto(e.target.value)} 
            placeholder="Buscar por nombre o RUT..." 
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-slate-900 text-sm focus:outline-none" 
          />
        </div>

        {/* Filtro por Rol */}
        <div>
          <select 
            value={filtroRol} 
            onChange={(e) => setFiltroRol(e.target.value)} 
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-semibold text-slate-800 focus:outline-none"
          >
            <option value="Todos">Todos los Roles</option>
            {roles.map(r => (
              <option key={r.id} value={r.nombre_rol}>{r.nombre_rol}</option>
            ))}
          </select>
        </div>

        {/* Filtro por Estado de Acceso */}
        <div>
          <select 
            value={filtroEstado} 
            onChange={(e) => setFiltroEstado(e.target.value)} 
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-semibold text-slate-800 focus:outline-none"
          >
            <option value="Todos">Todos los Estados de Acceso</option>
            <option value="Activo">Activos</option>
            <option value="Inactivo">Inactivos (Suspendidos)</option>
          </select>
        </div>

      </div>

      {/* Tabla de Usuarios Registrados */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
              <th className="py-3 px-4 rounded-l-xl">Funcionario / RUT</th>
              <th className="py-3 px-4">Correo Institucional</th>
              <th className="py-3 px-4">Rol Asignado</th>
              <th className="py-3 px-4 text-center">Estado de Acceso</th>
              <th className="py-3 px-4">Control de Sesión</th>
              <th className="py-3 px-4 rounded-r-xl text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {cargando ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm font-semibold text-slate-400">
                  Cargando usuarios desde PostgreSQL...
                </td>
              </tr>
            ) : usuariosFiltrados.length > 0 ? (
              usuariosFiltrados.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-4 px-4">
                    <p className="font-bold text-slate-900">{u.nombre}</p>
                    <p className="text-xs text-slate-500 font-mono">{u.rut}</p>
                  </td>
                  <td className="py-4 px-4 text-slate-700 font-medium">{u.correo}</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-900 px-3 py-1 rounded-full font-bold text-xs border border-blue-200">
                      <Shield size={12} className="text-blue-600" /> {u.rol}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button 
                      onClick={() => toggleEstadoUsuario(u)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer border ${
                        u.estado === 'Activo' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      }`}
                      title="Haga clic para cambiar estado (Activar / Suspender)"
                    >
                      {u.estado === 'Activo' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      {u.estado}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-xs text-slate-600 space-y-1">
                    <p className="flex items-center gap-1 font-medium"><Clock size={12} className="text-slate-400" /> {u.ultimoAcceso}</p>
                    <p className="flex items-center gap-1"><Globe size={12} className="text-slate-400" /> IP: {u.ip}</p>
                    <p className="flex items-center gap-1"><Monitor size={12} className="text-slate-400" /> {u.dispositivo}</p>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => abrirModalEditar(u)}
                        className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl transition cursor-pointer"
                        title="Modificar datos / contraseña / estado"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => eliminarUsuario(u)}
                        className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl transition cursor-pointer"
                        title="Eliminar usuario"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm font-medium text-slate-400">
                  No se encontraron usuarios que coincidan con los filtros de búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal CRUD (Crear / Editar Usuario con selector de Estado) */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-6 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h4 className="font-black text-blue-950 text-lg flex items-center gap-2">
                <Users className="text-emerald-600" size={20} />
                {modoEdicion ? 'Modificar Usuario Institucional' : 'Incorporar Nuevo Usuario'}
              </h4>
              <button onClick={() => setModalAbierto(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGuardarUsuario} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">RUT Institucional</label>
                  <input 
                    type="text" 
                    required 
                    value={rut} 
                    onChange={(e) => setRut(e.target.value)} 
                    placeholder="12345678-9" 
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Nombre Completo</label>
                  <input 
                    type="text" 
                    required 
                    value={nombre} 
                    onChange={(e) => setNombre(e.target.value)} 
                    placeholder="Ej. Dr. Juan Pérez" 
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 focus:outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Correo Electrónico de Acceso</label>
                <input 
                  type="email" 
                  required 
                  value={correo} 
                  onChange={(e) => setCorreo(e.target.value)} 
                  placeholder="funcionario@salud.cl" 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 focus:outline-none" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Rol Institucional</label>
                  <select 
                    value={rol} 
                    onChange={(e) => setRol(e.target.value)} 
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900 focus:outline-none"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.nombre_rol}>{r.nombre_rol}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Estado de Acceso</label>
                  <select 
                    value={estado} 
                    onChange={(e) => setEstado(e.target.value as 'Activo' | 'Inactivo')} 
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900 focus:outline-none"
                  >
                    <option value="Activo">Activo (Permitir acceso)</option>
                    <option value="Inactivo">Inactivo (Suspendido)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {modoEdicion ? 'Nueva Contraseña (Dejar vacío para no cambiar)' : 'Contraseña Temporal'}
                </label>
                <input 
                  type="password" 
                  {...(!modoEdicion ? { required: true } : {})}
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
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
                  disabled={guardando}
                  style={{ backgroundColor: '#2e6b46' }}
                  className="px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-md hover:opacity-95 transition cursor-pointer disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : modoEdicion ? 'Guardar Cambios' : 'Registrar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
