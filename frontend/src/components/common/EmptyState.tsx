import type { ReactNode } from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'gradient';
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      {icon && (
        <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      )}
      {action && (
        <Button
          variant={action.variant || 'gradient'}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Pre-built empty states
export function NoVideosState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      }
      title="No videos yet"
      description="Upload your first video to get started with your course content."
      action={onAction ? { label: 'Upload Video', onClick: onAction } : undefined}
    />
  );
}

export function NoCoursesState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      }
      title="No courses available"
      description="Create your first course to organize your video lessons."
      action={onAction ? { label: 'Create Course', onClick: onAction } : undefined}
    />
  );
}

export function NoSubmissionsState({ isTeacher = false }: { isTeacher?: boolean }) {
  return (
    <EmptyState
      icon={
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      }
      title={isTeacher ? 'No pending submissions' : 'No submissions yet'}
      description={
        isTeacher
          ? "You're all caught up! No submissions are waiting for review."
          : 'Record and submit your speaking practice to receive feedback from your teacher.'
      }
    />
  );
}

export function NoResultsState({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      title="No results found"
      description={
        query
          ? `We couldn't find anything matching "${query}". Try different keywords.`
          : 'No matching results. Try adjusting your search or filters.'
      }
    />
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-red-400">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      }
      title="Something went wrong"
      description={message || 'An error occurred while loading the data. Please try again.'}
      action={onRetry ? { label: 'Try Again', onClick: onRetry, variant: 'secondary' } : undefined}
    />
  );
}

export default EmptyState;
