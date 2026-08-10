import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from '../common';
import type { CourseProgress } from '../../services/progress';
import { useTranslation } from '../../i18n';

interface CourseProgressListProps {
  courses: CourseProgress[];
  isLoading?: boolean;
}

export function CourseProgressList({ courses, isLoading }: CourseProgressListProps) {
  const navigate = useNavigate();
  const t = useTranslation();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 border border-gray-100 rounded-lg animate-pulse">
              <div className="flex justify-between mb-2">
                <div className="h-5 bg-gray-200 rounded w-40" />
                <div className="h-5 bg-gray-200 rounded w-16" />
              </div>
              <div className="h-2 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (courses.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('myCourses')}</h3>
        </div>
        <div className="text-center py-8">
          <BookIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t('noCoursesEnrolledYet')}</p>
          <Button
            variant="gradient"
            size="sm"
            className="mt-4"
            onClick={() => navigate('/student/courses')}
          >
            {t('browseCourses')}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('myCourses')}</h3>
        <Button variant="ghost" size="sm" onClick={() => navigate('/student/courses')}>
          {t('viewAll')}
        </Button>
      </div>
      <div className="space-y-4">
        {courses.slice(0, 4).map((course) => (
          <div
            key={course.courseId}
            className="p-4 border border-gray-100 rounded-lg hover:border-primary/30 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => navigate(`/student/courses/${course.courseId}`)}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 truncate flex-1 mr-2">
                {course.courseTitle}
              </h4>
              {course.progressPercentage === 100 ? (
                <Badge variant="success">{t('complete')}</Badge>
              ) : (
                <span className="text-sm font-medium text-primary">
                  {Math.round(course.progressPercentage)}%
                </span>
              )}
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all ${
                  course.progressPercentage === 100 ? 'bg-green-500' : 'bg-primary'
                }`}
                style={{ width: `${course.progressPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {course.completedVideos} {t('ofVideos')} {course.totalVideos} {t('videosCompletedLabel')}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

export default CourseProgressList;
