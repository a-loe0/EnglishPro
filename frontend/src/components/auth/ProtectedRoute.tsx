import { useCallback, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('TEACHER' | 'STUDENT')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, checkAuth } = useAuthStore();
  const location = useLocation();
  const [guestFailed, setGuestFailed] = useState(false);

  // Student pages are open to everyone; only teacher pages need a sign-in.
  const teacherOnly = !!allowedRoles && !allowedRoles.includes('STUDENT');
  const needsGuest = !isAuthenticated && !teacherOnly;

  const startGuest = useCallback(() => {
    checkAuth().finally(() => setGuestFailed(true));
  }, [checkAuth]);

  // Reached with no session (e.g. right after a teacher signs out): continue
  // as a guest instead of asking the visitor to sign in.
  useEffect(() => {
    if (needsGuest) startGuest();
  }, [needsGuest, startGuest]);

  if (needsGuest && guestFailed && !isLoading) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-gray-600 font-medium">We couldn't load your lessons. Please check your connection.</p>
          <button
            onClick={() => {
              setGuestFailed(false);
              startGuest();
            }}
            className="h-10 px-6 bg-gradient-to-r from-primary to-accent text-white font-medium rounded-lg"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while checking authentication
  if (isLoading || needsGuest) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Teacher pages: redirect to login if not signed in with a real account
  if (!isAuthenticated || (teacherOnly && user?.isGuest)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if allowedRoles is specified
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user role
    const redirectPath = user.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
