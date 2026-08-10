export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
};

const dotVariantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-gray-500',
  primary: 'bg-primary',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
};

const sizeStyles: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        font-medium rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${dotVariantStyles[variant]}`}
        />
      )}
      {children}
    </span>
  );
}

// Status Badge for common use cases
export type StatusType = 'pending' | 'processing' | 'completed' | 'failed' | 'active' | 'inactive';

const statusConfig: Record<StatusType, { variant: BadgeProps['variant']; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  processing: { variant: 'info', label: 'Processing' },
  completed: { variant: 'success', label: 'Completed' },
  failed: { variant: 'error', label: 'Failed' },
  active: { variant: 'success', label: 'Active' },
  inactive: { variant: 'default', label: 'Inactive' },
};

export interface StatusBadgeProps {
  status: StatusType;
  size?: BadgeProps['size'];
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  size = 'md',
  showDot = true,
  className = '',
}: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      size={size}
      dot={showDot}
      className={className}
    >
      {config.label}
    </Badge>
  );
}

// Notification Badge (counter)
export interface NotificationBadgeProps {
  count: number;
  max?: number;
  className?: string;
}

export function NotificationBadge({
  count,
  max = 99,
  className = '',
}: NotificationBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count;

  return (
    <span
      className={`
        inline-flex items-center justify-center
        min-w-5 h-5 px-1.5
        text-xs font-bold text-white
        bg-red-500 rounded-full
        ${className}
      `}
    >
      {displayCount}
    </span>
  );
}

export default Badge;
