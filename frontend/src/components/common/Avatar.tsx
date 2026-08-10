import { useState } from 'react';

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeStyles: Record<NonNullable<AvatarProps['size']>, { container: string; text: string }> = {
  xs: { container: 'h-6 w-6', text: 'text-xs' },
  sm: { container: 'h-8 w-8', text: 'text-sm' },
  md: { container: 'h-10 w-10', text: 'text-base' },
  lg: { container: 'h-12 w-12', text: 'text-lg' },
  xl: { container: 'h-16 w-16', text: 'text-xl' },
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getColorFromName(name?: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ];

  if (!name) return colors[0];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  className = '',
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const styles = sizeStyles[size];
  const showFallback = !src || imageError;

  return (
    <div
      className={`
        relative inline-flex items-center justify-center
        rounded-full overflow-hidden flex-shrink-0
        ${styles.container}
        ${showFallback ? getColorFromName(name) : 'bg-gray-200'}
        ${className}
      `}
    >
      {showFallback ? (
        <span className={`font-medium text-white ${styles.text}`}>
          {getInitials(name)}
        </span>
      ) : (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}

// Avatar Group
export interface AvatarGroupProps {
  avatars: Array<{
    src?: string | null;
    name?: string;
  }>;
  max?: number;
  size?: AvatarProps['size'];
  className?: string;
}

export function AvatarGroup({
  avatars,
  max = 4,
  size = 'md',
  className = '',
}: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;
  const styles = sizeStyles[size];

  return (
    <div className={`flex -space-x-2 ${className}`}>
      {visibleAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          name={avatar.name}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={`
            relative inline-flex items-center justify-center
            rounded-full bg-gray-100 ring-2 ring-white
            ${styles.container}
          `}
        >
          <span className={`font-medium text-gray-600 ${styles.text}`}>
            +{remainingCount}
          </span>
        </div>
      )}
    </div>
  );
}

export default Avatar;
