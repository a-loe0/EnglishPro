import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from '../components/layout';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/common';
import {
  StatsOverview,
  ContinueWatching,
  CourseProgressList,
} from '../components/student';
import { progressService } from '../services/progress';
import type { Progress, ProgressSummary, CourseProgress } from '../services/progress';
import { studentSidebarItems } from '../config/studentSidebar';
import { useTranslation } from '../i18n';

// Icons for Quick Actions
const CoursesIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const LessonsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ProgressIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const t = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [continueWatching, setContinueWatching] = useState<Progress[]>([]);
  const [courses, setCourses] = useState<CourseProgress[]>([]);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summaryData, continueData, coursesData] = await Promise.all([
        progressService.getSummary(),
        progressService.getContinueWatching(4),
        progressService.getCoursesProgress(),
      ]);

      setSummary(summaryData);
      setContinueWatching(continueData);
      setCourses(coursesData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data when component mounts or when navigating back to this page
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, location.key]);

  // Refetch data when window regains focus (user returns from another tab)
  useEffect(() => {
    const handleFocus = () => {
      loadDashboardData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadDashboardData]);

  return (
    <DashboardLayout sidebarItems={studentSidebarItems} title={t('dashboard')}>
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          {t('welcomeBack')}, {user?.name?.split(' ')[0] || 'Student'}!
        </h2>
        <p className="text-gray-500">{t('continueJourney')}</p>
      </div>

      {/* Stats Overview */}
      <div className="mb-8">
        <StatsOverview summary={summary} isLoading={isLoading} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Continue Watching */}
        <ContinueWatching videos={continueWatching} isLoading={isLoading} />
      </div>

      {/* Course Progress */}
      <div className="mt-6">
        <CourseProgressList courses={courses} isLoading={isLoading} />
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-xl shadow-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('quickActions')}</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="gradient"
            leftIcon={<CoursesIcon />}
            onClick={() => navigate('/student/courses')}
          >
            {t('myCourses')}
          </Button>
          <Button
            variant="secondary"
            leftIcon={<LessonsIcon />}
            onClick={() => navigate('/student/lessons')}
          >
            {t('lessons')}
          </Button>
          <Button
            variant="ghost"
            leftIcon={<ProgressIcon />}
            onClick={() => navigate('/student/progress')}
          >
            {t('checkProgress')}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
