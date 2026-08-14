import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-bg-light to-accent/5 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <span className="font-bold text-xl text-gray-900 group-hover:text-primary transition-colors">
            EnglishGoPro
          </span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Title */}
          {(title || subtitle) && (
            <div className="text-center mb-8">
              {title && <h1 className="text-3xl font-bold text-gray-900">{title}</h1>}
              {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
            </div>
          )}

          {/* Card */}
          <div className="bg-white rounded-card shadow-lg p-8">{children}</div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} EnglishGoPro. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default AuthLayout;
