import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from '../components/layout';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/common';
import {
  StatsOverview,
  ContinueWatching,
} from '../components/student';
import { progressService } from '../services/progress';
import type { Progress, ProgressSummary } from '../services/progress';
import { studentSidebarItems } from '../config/studentSidebar';
import { useTranslation } from '../i18n';

// Icons for Quick Actions
const MicIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-14 0m7 7v4m-4 0h8M12 15a4 4 0 004-4V6a4 4 0 00-8 0v5a4 4 0 004 4z" />
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

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summaryData, continueData] = await Promise.all([
        progressService.getSummary(),
        progressService.getContinueWatching(4),
      ]);

      setSummary(summaryData);
      setContinueWatching(continueData);
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

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-xl shadow-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('quickActions')}</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="gradient"
            leftIcon={<LessonsIcon />}
            onClick={() => navigate('/student/lessons')}
          >
            {t('lessons')}
          </Button>
          <Button
            variant="secondary"
            leftIcon={<MicIcon />}
            onClick={() => navigate('/student/pronunciation')}
          >
            {t('pnTitle')}
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
