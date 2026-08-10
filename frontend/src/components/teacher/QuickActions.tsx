import { useNavigate } from 'react-router-dom';
import { Button } from '../common';

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Upload Video',
      icon: <VideoIcon className="w-5 h-5" />,
      onClick: () => navigate('/teacher/videos/upload'),
      variant: 'gradient' as const,
    },
    {
      label: 'New Course',
      icon: <PlusIcon className="w-5 h-5" />,
      onClick: () => navigate('/teacher/courses/new'),
      variant: 'secondary' as const,
    },
    {
      label: 'View Submissions',
      icon: <InboxIcon className="w-5 h-5" />,
      onClick: () => navigate('/teacher/submissions'),
      variant: 'secondary' as const,
    },
  ];

  return (
    <div className="bg-white rounded-card p-6 shadow-card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="flex flex-wrap gap-3">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant}
            size="md"
            leftIcon={action.icon}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );
}

export default QuickActions;
