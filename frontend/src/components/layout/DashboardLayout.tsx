import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth';
import { Avatar, LanguageToggle } from '../common';

export interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: number;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebarItems: SidebarItem[];
  title?: string;
}

export function DashboardLayout({ children, sidebarItems, title }: DashboardLayoutProps) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-bg-light">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 px-4 flex items-center justify-between">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <MenuIcon className="w-6 h-6 text-gray-600" />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <span className="font-bold text-lg text-gray-900">EnglishPro</span>
        </Link>
        <Avatar name={user?.name || ''} src={authService.getAvatarUrl(user?.avatarUrl)} size="sm" />
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50
          transition-all duration-300 flex flex-col
          ${sidebarCollapsed ? 'w-20' : 'w-64'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            {!sidebarCollapsed && (
              <span className="font-bold text-lg text-gray-900">EnglishPro</span>
            )}
          </Link>
          <button
            onClick={() => {
              setSidebarCollapsed(!sidebarCollapsed);
              setMobileMenuOpen(false);
            }}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronIcon
              className={`w-5 h-5 text-gray-400 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
            />
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100"
          >
            <XIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                      ${isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                    `}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-sm font-medium">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="bg-accent text-white text-xs font-medium px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute top-0 right-0 w-2 h-2 bg-accent rounded-full" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-100 p-4">
          {sidebarCollapsed ? (
            <button
              onClick={handleLogout}
              className="w-full p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Sign out"
            >
              <LogoutIcon className="w-5 h-5 text-gray-400 mx-auto" />
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <Avatar name={user?.name || ''} src={authService.getAvatarUrl(user?.avatarUrl)} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Sign out"
              >
                <LogoutIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`
          min-h-screen pt-16 lg:pt-0 transition-all duration-300
          ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}
        `}
      >
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
          {!title && <div />}
          <LanguageToggle />
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

// Icons
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}

export default DashboardLayout;
