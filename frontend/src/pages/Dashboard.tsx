import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Redirect to role-specific dashboard
    if (user?.role === 'TEACHER') {
      navigate('/teacher/dashboard', { replace: true });
    } else {
      navigate('/student/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-gray-500 font-medium">Redirecting...</p>
      </div>
    </div>
  );
}
