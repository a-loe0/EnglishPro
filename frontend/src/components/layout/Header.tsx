import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth';
import { Button, Avatar, Dropdown, LanguageToggle } from '../common';

interface NavItem {
  label: string;
  href: string;
  requiresAuth?: boolean;
  roles?: ('TEACHER' | 'STUDENT')[];
}

interface HeaderProps {
  transparent?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Courses', href: '/courses', requiresAuth: true },
  { label: 'My Dashboard', href: '/dashboard', requiresAuth: true },
];

export function Header({ transparent = false }: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const filteredNavItems = navItems.filter((item) => {
    if (item.requiresAuth && !isAuthenticated) return false;
    if (item.roles && user && !item.roles.includes(user.role)) return false;
    return true;
  });

  const userMenuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
    },
    { id: 'profile', label: 'Profile' },
    { id: 'settings', label: 'Settings' },
    { id: 'divider', label: '', divider: true },
    { id: 'logout', label: 'Sign out', danger: true },
  ];

  const handleMenuSelect = (itemId: string) => {
    switch (itemId) {
      case 'dashboard':
        navigate(user?.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'logout':
        handleLogout();
        break;
    }
  };

  return (
    <header
      className={`
        sticky top-0 z-50 w-full
        ${transparent ? 'bg-transparent' : 'bg-white/80 backdrop-blur-md shadow-sm'}
        transition-colors duration-200
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="font-bold text-xl text-gray-900 group-hover:text-primary transition-colors">
              EnglishGoPro
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`
                  text-sm font-medium transition-colors
                  ${location.pathname === item.href
                    ? 'text-primary'
                    : 'text-gray-600 hover:text-primary'}
                `}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageToggle />
            {isAuthenticated && user ? (
              <Dropdown
                trigger={
                  <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Avatar name={user.name} src={authService.getAvatarUrl(user.avatarUrl)} size="sm" />
                    <span className="text-sm font-medium text-gray-700">{user.name}</span>
                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                  </button>
                }
                items={userMenuItems}
                onSelect={handleMenuSelect}
                align="right"
              />
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Sign in
                </Button>
                <Button variant="gradient" size="sm" onClick={() => navigate('/register')}>
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <XIcon className="w-6 h-6 text-gray-600" />
            ) : (
              <MenuIcon className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col gap-2">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${location.pathname === item.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-600 hover:bg-gray-100'}
                  `}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-4 pt-4 border-t border-gray-100 px-4 flex flex-col gap-4">
              <div className="flex justify-center">
                <LanguageToggle />
              </div>
              {isAuthenticated && user ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar name={user.name} src={authService.getAvatarUrl(user.avatarUrl)} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" fullWidth onClick={handleLogout}>
                    Sign out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button variant="ghost" fullWidth onClick={() => navigate('/login')}>
                    Sign in
                  </Button>
                  <Button variant="gradient" fullWidth onClick={() => navigate('/register')}>
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// Icons
function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

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

export default Header;
