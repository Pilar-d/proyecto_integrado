import React, { useState } from 'react';
import { Users, UserPlus, Shield, CheckCircle2, XCircle, Key, Edit, Trash2, Monitor, Globe, Clock, X, Search } from 'lucide-react';

interface Usuario {
  id: number;
  rut: string;
  nombre: string;
  correo: string;
  rol: string;
  estado: 'Activo' | 'Inactivo';
  ultimoAcceso: string;
  ip: string;
  dispositivo: string;
}

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([
    { id: 1, rut: '11111111-1', nombre: 'Dra. Carmen Valdés', correo: 'carmen.valdes@salud.cl', rol: 'Directora', estado: 'Activo', ultimoAcceso: '2026-10-17 08:30', ip: '190.160.20.15', dispositivo: 'MacBook Pro / Chrome' },
    { id: 2, rut: '22222222-2', nombre: 'Mg. Roberto Soto', correo: 'roberto.soto@salud.cl', rol: 'Subdireccion', estado: 'Activo', ultimoAcceso: '2026-10-16 17:45', ip: '190.160.20.42', dispositivo: 'Windows 11 / Edge' },
    { id: 3, rut: '33333333-3', nombre: 'Dr. Esteban Tapia', correo: 'esteban.tapia@salud.cl', rol: 'Gestor', estado: 'Activo', ultimoAcceso: '2026-10-17 09:10', ip: '200.14.88.5', dispositivo: 'MacBook Pro / Safari' },
    { id: 4, rut: '44444444-4', nombre: 'Enf. Marcela Riquelme', correo: 'marcela.riquelme@salud.cl', rol: 'JefePrograma', estado: 'Inactivo', ultimoAcceso: '2026-09-28 14:20', ip: '190.160.21.88', dispositivo: 'Windows 10 / Chrome' },
  ]);

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

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setRut('');
    setNombre('');
    setCorreo('');
    setRol('Gestor');
    setEstado('Activo');
    setPassword('');
    setModalAbierto(true);
  };

  const abrirModalEditar = (user: Usuario) => {
    setModoEdicion(true);
    setUsuarioActualId(user.id);
    setRut(user.rut);
    setNombre(user.nombre);
    setCorreo(user.correo);
    setRol(user.rol);
    setEstado(user.estado);
    setPassword('');
    setModalAbierto(true);
  };

  const handleGuardarUsuario = (e: React.FormEvent) => {
    e.preventDefault();
    if (modoEdicion && usuarioActualId !== null) {
      setUsuarios(usuarios.map(u => u.id === usuarioActualId ? { ...u, rut, nombre, correo, rol, estado } : u));
      alert('Usuario actualizado correctamente.');
    } else {
      const nuevoUser: Usuario = {
        id: usuarios.length + 1,
        rut,
        nombre,
        correo,
        rol,
        estado,
        ultimoAcceso: 'Sin registros',
        ip: 'Registrada en 1er login',
        dispositivo: 'Pendiente de conexión'
      };
      setUsuarios([...usuarios, nuevoUser]);
      alert('Nuevo usuario incorporado exitosamente.');
    }
    setModalAbierto(false);
  };

  const toggleEstadoUsuario = (id: number) => {
    setUsuarios(usuarios.map(u => {
      if (u.id === id) {
        const nuevoEstado = u.estado === 'Activo' ? 'Inactivo' : 'Activo';
        return { ...u, estado: nuevoEstado };
      }
      return u;
    }));
  };

  const eliminarUsuario = (id: number) => {
    if (confirm('¿Está seguro de eliminar permanentemente a este usuario del sistema?')) {
      setUsuarios(usuarios.filter(u => u.id !== id));
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
      
      {/* Cabecera del Módulo Centrada y sin icono */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center space-y-3">
        <div className="space-y-1 max-w-2xl">
          <h3 className="text-xl font-black text-blue-950">Gestión de Usuarios y Roles Institucionales</h3>
          <p className="text-sm font-medium text-slate-500">
            Control de accesos, suspensión de cuentas, asignación de roles y auditoría de dispositivos de conexión.
          </p>
        </div>
        <button 
          onClick={abrirModalCrear}
          style={{ backgroundColor: '#2e6b46' }}
          className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:opacity-95 transition cursor-pointer mt-2"
        >
          <UserPlus size={16} /> Nuevo Usuario
        </button>
      </div>

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
            <option value="Directora">Directora</option>
            <option value="Subdireccion">Subdirección</option>
            <option value="Gestor">Gestor</option>
            <option value="JefePrograma">Jefe de Programa</option>
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
              <th className="py-3 px-4">Control de Sesión (IP / Dispositivo)</th>
              <th className="py-3 px-4 rounded-r-xl text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {usuariosFiltrados.length > 0 ? (
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
                      onClick={() => toggleEstadoUsuario(u.id)}
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
                        onClick={() => eliminarUsuario(u.id)}
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
                    <option value="Directora">Directora</option>
                    <option value="Subdireccion">Subdirección</option>
                    <option value="Gestor">Gestor</option>
                    <option value="JefePrograma">Jefe de Programa</option>
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
                  {modoEdicion ? 'Nueva Contraseña (Opcional)' : 'Contraseña Temporal'}
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
                  style={{ backgroundColor: '#2e6b46' }}
                  className="px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-md hover:opacity-95 transition cursor-pointer"
                >
                  {modoEdicion ? 'Guardar Cambios' : 'Registrar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}