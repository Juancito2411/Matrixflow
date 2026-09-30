import React from 'react';
import { Bell, LogOut } from 'lucide-react';

interface HeaderProps {
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ title = 'Panel Principal' }) => {
  // Leemos el correo guardado en el login o mostramos un valor por defecto
  const userEmail = localStorage.getItem('userEmail') || 'Admin Demo';
  const userRole = localStorage.getItem('userRole') || 'Administrador';

  const handleLogout = () => {
    // 1. Limpiar completamente el almacenamiento
    localStorage.clear();
    sessionStorage.clear();

    // 2. Redirigir al login y recargar la página para destruir variables de memoria
    window.location.href = '/login';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h2 className="text-xl font-bold text-textMain">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Notificaciones */}
        <button 
          aria-label="Notificaciones"
          className="p-2 text-textMuted hover:text-textMain hover:bg-slate-100 rounded-full transition-colors relative"
        >
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full"></span>
        </button>

        <div className="h-6 w-px bg-slate-200" />

        {/* Perfil de Usuario Dinámico */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">
            {userEmail.substring(0, 2).toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-textMain leading-tight">{userEmail}</p>
            <p className="text-xs text-textMuted capitalize">{userRole}</p>
          </div>
        </div>

        {/* Botón Cerrar Sesión */}
        <button 
          onClick={handleLogout}
          title="Cerrar Sesión"
          className="p-2 text-textMuted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-2 cursor-pointer"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};