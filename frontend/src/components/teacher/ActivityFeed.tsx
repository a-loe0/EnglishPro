import { Avatar } from '../common';
import type { ActivityItem } from '../../services/dashboard';

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
}

export function ActivityFeed({ activities, maxItems = 10 }: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems);

  if (displayActivities.length === 0) {
    return (
      <div className="bg-white rounded-card p-6 shadow-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="text-center py-8 text-gray-500">
          <ActivityIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-card p-6 shadow-card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {displayActivities.map((activity) => (
          <div key={activity.id} className="flex gap-3">
            <Avatar
              name={activity.studentName}
              src={activity.studentAvatarUrl}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                <span className="font-medium">{activity.studentName}</span>{' '}
                <span className="text-gray-600">{activity.message}</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatRelativeTime(activity.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default ActivityFeed;
