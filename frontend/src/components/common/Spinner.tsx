export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

const sizeStyles: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const colorStyles: Record<NonNullable<SpinnerProps['color']>, { circle: string; path: string }> = {
  primary: {
    circle: 'text-primary/20',
    path: 'text-primary',
  },
  white: {
    circle: 'text-white/20',
    path: 'text-white',
  },
  gray: {
    circle: 'text-gray-200',
    path: 'text-gray-600',
  },
};

export function Spinner({
  size = 'md',
  color = 'primary',
  className = '',
}: SpinnerProps) {
  const colors = colorStyles[color];

  return (
    <svg
      className={`animate-spin ${sizeStyles[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      aria-label="Loading"
    >
      <circle
        className={colors.circle}
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className={colors.path}
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Full page loading spinner
export interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="xl" />
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
}

// Inline loading state
export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = 'Loading...', className = '' }: LoadingStateProps) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-gray-500 text-sm">{message}</p>
      </div>
    </div>
  );
}

export default Spinner;
