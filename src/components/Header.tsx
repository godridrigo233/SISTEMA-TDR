import React from 'react';
import { NavLink } from 'react-router-dom';
import { Building2, LogOut, User as UserIcon, LayoutDashboard, Users, PlusCircle, FileText, UserPlus, UserCircle } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function Header({ user, onLogout }: HeaderProps) {
  const rol = (user as any)?.rol;

  const navItems: NavItem[] = [
    { to: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  ];

  if (rol === 'CONTRATANTE') {
    navItems.push({ to: '/tdrs/nuevo', label: 'Nuevo TdR', icon: PlusCircle });
    navItems.push({ to: '/mi-perfil', label: 'Mi Perfil', icon: UserCircle });
  }
  if (rol === 'CONTRATANTE' || rol === 'ADMINISTRADOR') {
    navItems.push({ to: '/locadores', label: 'Locadores', icon: Users });
  }
  if (rol === 'ADMINISTRADOR') {
    navItems.push({ to: '/contratantes', label: 'Contratantes', icon: UserPlus });
  }
  if (rol === 'ADMINISTRATIVO' || rol === 'ADMINISTRADOR') {
    navItems.push({ to: '/formato', label: 'Formato Base TdR', icon: FileText });
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <NavLink to="/dashboard" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-900 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-tight">Sistema de Gestión de TdR</h1>
              <p className="text-xs text-gray-500">Términos de Referencia</p>
            </div>
          </NavLink>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <UserIcon className="w-4 h-4 text-gray-600" />
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user.nombre}</p>
                <p className="text-xs text-gray-500">{rol}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Salir</span>
            </button>
          </div>
        </div>

        <nav className="flex items-center gap-1 -mb-px overflow-x-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                  isActive
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                }`
              }
              end={to === '/dashboard'}
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
