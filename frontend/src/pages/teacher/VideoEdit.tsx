import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Button, Input, Card, Spinner } from '../../components/common';
import { videoService } from '../../services/videos';
import type { Video } from '../../services/videos';
import { courseService } from '../../services/courses';
import type { Course } from '../../services/courses';
import { teacherSidebarItems } from '../../config/teacherSidebar';

export default function VideoEdit() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!videoId) return;
      try {
        setLoading(true);
        const [videoData, coursesData] = await Promise.all([
          videoService.getById(videoId),
          courseService.getMyCourses(),
        ]);
        setVideo(videoData);
        setCourses(coursesData);
        setTitle(videoData.title);
        setDescription(videoData.description || '');
        setCourseId(videoData.courseId || '');
      } catch (err) {
        setError('Failed to load video');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [videoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoId || !title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await videoService.update(videoId, {
        title: title.trim(),
        description: description.trim() || undefined,
        courseId: courseId || undefined,
      });
      navigate(`/teacher/videos/${videoId}`);
    } catch (err) {
      setError('Failed to save changes');
      console.error('Error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout sidebarItems={teacherSidebarItems} title="Edit Video">
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!video) {
    return (
      <DashboardLayout sidebarItems={teacherSidebarItems} title="Edit Video">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">Video not found</p>
          <Button variant="secondary" onClick={() => navigate('/teacher/videos')}>
            Back to Videos
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={teacherSidebarItems} title="Edit Video">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(`/teacher/videos/${videoId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Video
        </button>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Edit Video</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Video title"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Video description"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value="">No course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => navigate(`/teacher/videos/${videoId}`)}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" isLoading={saving}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
