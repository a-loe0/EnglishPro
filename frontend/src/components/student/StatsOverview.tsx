import { Card } from '../common';
import type { ProgressSummary } from '../../services/progress';
import { useTranslation } from '../../i18n';

interface StatsOverviewProps {
  summary: ProgressSummary | null;
  isLoading?: boolean;
}

export function StatsOverview({ summary, isLoading }: StatsOverviewProps) {
  const t = useTranslation();

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const stats = [
    {
      label: t('completed'),
      value: summary?.completedVideos ?? 0,
      color: 'text-green-500',
      bgColor: 'bg-green-100',
      icon: <CheckIcon />,
    },
    {
      label: t('inProgress'),
      value: summary?.inProgressVideos ?? 0,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      icon: <PlayIcon />,
    },
    {
      label: t('watchTime'),
      value: formatTime(summary?.totalWatchTimeSeconds ?? 0),
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      icon: <ClockIcon />,
    },
    {
      label: t('avgProgress'),
      value: `${Math.round(summary?.averageProgress ?? 0)}%`,
      color: 'text-video-thumb',
      bgColor: 'bg-video-thumb/10',
      icon: <ChartIcon />,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-lg" />
            </div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg ${stat.bgColor} ${stat.color}`}>
              {stat.icon}
            </div>
          </div>
          <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
          <div className="text-sm text-gray-500">{stat.label}</div>
        </Card>
      ))}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

export default StatsOverview;
