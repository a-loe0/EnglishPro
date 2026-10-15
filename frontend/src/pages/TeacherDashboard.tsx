import { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout';
import { teacherSidebarItems } from '../config/teacherSidebar';
import { useAuthStore } from '../store/authStore';
import { Spinner } from '../components/common';
import {
  StatCard,
  ActivityFeed,
  QuickActions,
  TopVideos,
} from '../components/teacher';
import { dashboardService } from '../services/dashboard';
import type { TeacherDashboard as TeacherDashboardData } from '../services/dashboard';

// Icons for sidebar
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

const StudentsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

export default function TeacherDashboard() {
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sidebarItems = teacherSidebarItems;

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const data = await dashboardService.getTeacherDashboard();
        setDashboard(data);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <DashboardLayout sidebarItems={sidebarItems} title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !dashboard) {
    return (
      <DashboardLayout sidebarItems={sidebarItems} title="Dashboard">
        <div className="text-center py-12">
          <p className="text-red-500">{error || 'Failed to load dashboard'}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Dashboard">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h2>
        <p className="text-gray-500">Here's what's happening with your courses today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Active Courses"
          value={dashboard.stats.totalCourses}
          icon={<CoursesIcon />}
          color="primary"
        />
        <StatCard
          title="Total Students"
          value={dashboard.stats.totalStudents}
          icon={<StudentsIcon />}
          color="accent"
        />
        <StatCard
          title="Total Views"
          value={dashboard.stats.totalViews}
          icon={<EyeIcon />}
          color="success"
        />
        <StatCard
          title="Videos Uploaded"
          value={dashboard.stats.totalVideos}
          icon={<VideosIcon />}
          color="warning"
        />
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <StatCard
          title="Total Watch Time"
          value={dashboard.stats.totalWatchTime}
          suffix="minutes"
          icon={<ClockIcon />}
          color="primary"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <QuickActions />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <ActivityFeed activities={dashboard.recentActivity} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <TopVideos videos={dashboard.topVideos} />
        </div>
      </div>
    </DashboardLayout>
  );
}

function ClockIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
