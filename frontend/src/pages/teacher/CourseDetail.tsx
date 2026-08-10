import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Button, Card, Spinner } from '../../components/common';
import { courseService } from '../../services/courses';
import type { CourseWithVideos } from '../../services/courses';
import { videoService } from '../../services/videos';
import { teacherSidebarItems } from '../../config/teacherSidebar';

const VideosIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseWithVideos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourse() {
      if (!courseId) return;
      try {
        setLoading(true);
        const data = await courseService.getById(courseId, true);
        setCourse(data as CourseWithVideos);
      } catch (err) {
        setError('Failed to load course');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [courseId]);

  if (loading) {
    return (
      <DashboardLayout sidebarItems={teacherSidebarItems} title="Course">
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !course) {
    return (
      <DashboardLayout sidebarItems={teacherSidebarItems} title="Course">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error || 'Course not found'}</p>
          <Button variant="secondary" onClick={() => navigate('/teacher/courses')}>
            Back to Courses
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={teacherSidebarItems} title={course.title}>
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/teacher/courses')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Courses
        </button>

        {/* Course Header */}
        <Card className="p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
              {course.description && (
                <p className="text-gray-600">{course.description}</p>
              )}
              <p className="text-sm text-gray-400 mt-2">
                Created {new Date(course.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Button variant="secondary" onClick={() => navigate(`/teacher/courses/${course.id}/edit`)}>
              Edit
            </Button>
          </div>
        </Card>

        {/* Videos Section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Videos ({course.videos?.length || 0})
          </h2>
          <Button variant="gradient" onClick={() => navigate('/teacher/videos/upload')}>
            Add Video
          </Button>
        </div>

        {!course.videos || course.videos.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <VideosIcon />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No videos yet</h3>
            <p className="text-gray-500 mb-6">Add videos to this course</p>
            <Button variant="gradient" onClick={() => navigate('/teacher/videos/upload')}>
              Upload Video
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {course.videos.map((video) => (
              <Card
                key={video.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/teacher/videos/${video.id}`)}
              >
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  <img
                    src={videoService.getThumbnailUrl(video.id)}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  {video.duration && (
                    <span className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                      {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{video.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {new Date(video.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
