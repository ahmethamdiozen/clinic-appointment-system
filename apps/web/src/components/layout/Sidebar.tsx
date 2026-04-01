import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  UserRound,
  Stethoscope,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/appointments', label: 'Appointments', icon: Calendar },
  { to: '/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/patients', label: 'Patients', icon: UserRound },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span className="text-base font-semibold text-slate-900">DentaBook</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-slate-100 px-3 py-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
