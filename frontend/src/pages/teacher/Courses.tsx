import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Button, Card, Spinner } from '../../components/common';
import { courseService } from '../../services/courses';
import type { Course } from '../../services/courses';
import { teacherSidebarItems } from '../../config/teacherSidebar';

const CoursesIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

export default function Courses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);
        const data = await courseService.getMyCourses();
        setCourses(data);
      } catch (err) {
        setError('Failed to load courses');
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  if (loading) {
    return (
      <DashboardLayout sidebarItems={teacherSidebarItems} title="My Courses">
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={teacherSidebarItems} title="My Courses">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Courses</h2>
          <p className="text-gray-500 mt-1">{courses.length} course{courses.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="gradient" onClick={() => navigate('/teacher/courses/new')}>
          New Course
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {courses.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <CoursesIcon />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses yet</h3>
          <p className="text-gray-500 mb-6">Create your first course to organize your videos</p>
          <Button variant="gradient" onClick={() => navigate('/teacher/courses/new')}>
            Create Course
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/teacher/courses/${course.id}`)}
            >
              <h3 className="font-semibold text-gray-900 mb-2">{course.title}</h3>
              {course.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{course.description}</p>
              )}
              <div className="text-sm text-gray-400">
                <span>{course.videoCount || 0} videos</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
