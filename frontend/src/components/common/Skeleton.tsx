export interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  lines = 1,
}: SkeletonProps) {
  const baseStyles = 'animate-pulse bg-gray-200';

  const variantStyles = {
    rectangular: 'rounded-card',
    circular: 'rounded-full',
    text: 'rounded',
  };

  const style: React.CSSProperties = {
    width: width ?? (variant === 'text' ? '100%' : undefined),
    height: height ?? (variant === 'text' ? '1em' : undefined),
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseStyles} ${variantStyles[variant]}`}
            style={{
              ...style,
              width: index === lines - 1 ? '75%' : '100%',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={style}
    />
  );
}

// Pre-built skeleton patterns
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-card p-6 shadow-card">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1">
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={16} className="mt-2" />
        </div>
      </div>
      <Skeleton variant="text" lines={3} height={14} />
    </div>
  );
}

export function VideoCardSkeleton() {
  return (
    <div className="bg-white rounded-card overflow-hidden shadow-card">
      <Skeleton variant="rectangular" height={180} className="w-full" />
      <div className="p-4">
        <Skeleton variant="text" width="80%" height={20} />
        <Skeleton variant="text" width="60%" height={14} className="mt-2" />
        <div className="flex items-center gap-2 mt-4">
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="text" width={100} height={14} />
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-4 py-3">
          <Skeleton variant="text" height={16} width={index === 0 ? '70%' : '50%'} />
        </td>
      ))}
    </tr>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1">
        <Skeleton variant="text" width="50%" height={16} />
        <Skeleton variant="text" width="30%" height={12} className="mt-1" />
      </div>
      <Skeleton variant="rectangular" width={80} height={32} />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-card p-6 shadow-card">
      <Skeleton variant="text" width="40%" height={14} />
      <Skeleton variant="text" width="60%" height={32} className="mt-2" />
      <Skeleton variant="text" width="50%" height={12} className="mt-4" />
    </div>
  );
}

export default Skeleton;
