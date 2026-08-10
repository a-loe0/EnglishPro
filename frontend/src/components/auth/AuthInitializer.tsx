import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export default function AuthInitializer({ children }: AuthInitializerProps) {
  const { checkAuth } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setInitialized(true);
      }
    };
    init();
  }, [checkAuth]);

  // Show loading screen only during initial auth check
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F0F4FF' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div
              className="w-16 h-16 border-4 rounded-full animate-spin"
              style={{ borderColor: 'rgba(99,102,241,0.2)', borderTopColor: '#6366F1' }}
            />
          </div>
          <p style={{ color: '#6B7280', fontWeight: 500 }}>Loading EnglishPro...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
