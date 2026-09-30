import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, Store, Package, ShoppingCart, 
  Boxes, ArrowRightLeft, Grid, Calculator, History, FileBarChart, Settings 
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Empresa', path: '/empresa', icon: Building2 },
  { name: 'Sucursales', path: '/sucursales', icon: Store },
  { name: 'Productos', path: '/productos', icon: Package },
  { name: 'Ventas', path: '/ventas', icon: ShoppingCart },
  { name: 'Inventario', path: '/inventario', icon: Boxes },
  { name: 'Vectores', path: '/vectores', icon: ArrowRightLeft },
  { name: 'Matrices', path: '/matrices', icon: Grid },
  { name: 'Operaciones', path: '/operaciones', icon: Calculator },
  { name: 'Historial', path: '/historial', icon: History },
  { name: 'Reportes', path: '/reportes', icon: FileBarChart },
  { name: 'Configuración', path: '/configuracion', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-sidebar text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-wider text-accent">MATRIXFLOW</h1>
        <p className="text-xs text-textMuted mt-1">Enterprise Analytics</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-primary text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};