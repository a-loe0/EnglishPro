import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout';
import { Card, Button } from '../../components/common';
import {
  ProgressChart,
  CompletionDonut,
  TrendCard,
} from '../../components/analytics';
import { analyticsService, type TeacherAnalytics } from '../../services/analytics';
import { teacherSidebarItems } from '../../config/teacherSidebar';

const CoursesIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const VideosIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

export default function TeacherAnalyticsPage() {
  const [analytics, setAnalytics] = useState<TeacherAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await analyticsService.getTeacherAnalytics();
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (error) {
    return (
      <DashboardLayout sidebarItems={teacherSidebarItems} title="Analytics">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={teacherSidebarItems} title="Analytics">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Analytics Overview</h2>
        <p className="text-gray-500">Track your teaching performance and student engagement</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <TrendCard
          title="Total Students"
          value={analytics?.overview.totalStudents ?? 0}
          icon={<UsersIcon />}
          color="#6366F1"
        />
        <TrendCard
          title="Total Videos"
          value={analytics?.overview.totalVideos ?? 0}
          icon={<VideosIcon />}
          color="#EC4899"
        />
        <TrendCard
          title="Total Courses"
          value={analytics?.overview.totalCourses ?? 0}
          icon={<CoursesIcon />}
          color="#10B981"
        />
        <TrendCard
          title="Watch Time"
          value={formatTime(analytics?.overview.totalWatchTime ?? 0)}
          icon={<ClockIcon />}
          color="#F59E0B"
        />
        <TrendCard
          title="Total Views"
          value={analytics?.overview.totalViews ?? 0}
          icon={<EyeIcon />}
          color="#8B5CF6"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ProgressChart
          data={analytics?.trends.map((t) => ({ date: t.date, value: t.views })) ?? []}
          title="Daily Views"
          color="#6366F1"
          height={250}
        />
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Videos</h3>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-8" />
                  <div className="h-4 bg-gray-200 rounded flex-1" />
                  <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {analytics?.topVideos.slice(0, 5).map((video, index) => (
                <div
                  key={video.videoId}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50"
                >
                  <span className="text-lg font-bold text-gray-400 w-6">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{video.title}</p>
                    <p className="text-sm text-gray-500">{video.views} views</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-primary">
                      {video.completionRate}%
                    </span>
                    <p className="text-xs text-gray-500">completion</p>
                  </div>
                </div>
              ))}
              {(!analytics?.topVideos || analytics.topVideos.length === 0) && (
                <p className="text-gray-500 text-center py-4">No video data yet</p>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Completion & Student Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <CompletionDonut
          completed={analytics?.studentProgress.reduce((sum, s) => sum + s.completedVideos, 0) ?? 0}
          total={analytics?.studentProgress.reduce((sum, s) => sum + s.totalVideos, 0) ?? 1}
          title="Overall Completion"
          primaryColor="#6366F1"
        />

        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Students by Progress</h3>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="h-4 bg-gray-200 rounded flex-1" />
                  <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {analytics?.studentProgress.slice(0, 10).map((student, index) => (
                <div
                  key={student.studentId}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50"
                >
                  <span className="text-lg font-bold text-gray-400 w-6">
                    {index + 1}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {student.avatarUrl ? (
                      <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-primary font-medium">
                        {student.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{student.name}</p>
                    <p className="text-sm text-gray-500">
                      {student.completedVideos} of {student.totalVideos} videos
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-primary">
                      {student.totalVideos > 0
                        ? Math.round((student.completedVideos / student.totalVideos) * 100)
                        : 0}%
                    </span>
                    <p className="text-xs text-gray-500">complete</p>
                  </div>
                </div>
              ))}
              {(!analytics?.studentProgress || analytics.studentProgress.length === 0) && (
                <p className="text-gray-500 text-center py-4">No student progress data yet</p>
              )}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

// Additional icons
function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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
