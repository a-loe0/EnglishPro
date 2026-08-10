import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Spinner } from '../../components/common';
import { studentSidebarItems } from '../../config/studentSidebar';
import { courseService, type Course } from '../../services/courses';
import { useTranslation } from '../../i18n';

export default function StudentCourses() {
  const navigate = useNavigate();
  const t = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const data = await courseService.list();
        setCourses(data.data);
      } catch (error) {
        console.error('Failed to load courses:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  if (loading) {
    return (
      <DashboardLayout sidebarItems={studentSidebarItems} title={t('myCourses')}>
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={studentSidebarItems} title={t('myCourses')}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{t('myCourses')}</h2>
        <p className="text-gray-500 mt-1">{courses.length} {t('coursesEnrolled')}</p>
      </div>

      {courses.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noCoursesYet')}</h3>
          <p className="text-gray-500">{t('noCourseDescription')}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/student/courses/${course.id}`)}
            >
              <h3 className="font-semibold text-gray-900 mb-2">{course.title}</h3>
              {course.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{course.description}</p>
              )}
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>{course.videoCount || 0} {t('videosLabel')}</span>
                {course.teacher && (
                  <span>{course.teacher.name}</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
