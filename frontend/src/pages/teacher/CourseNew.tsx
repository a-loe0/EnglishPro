import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Button, Input, Card } from '../../components/common';
import { courseService } from '../../services/courses';
import { teacherSidebarItems } from '../../config/teacherSidebar';

export default function CourseNew() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const course = await courseService.create({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      navigate(`/teacher/courses/${course.id}`);
    } catch (err) {
      setError('Failed to create course');
      console.error('Error creating course:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout sidebarItems={teacherSidebarItems} title="New Course">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/teacher/courses')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Courses
        </button>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Course</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Course Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Business English Fundamentals"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what students will learn in this course"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => navigate('/teacher/courses')}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" isLoading={loading}>
                Create Course
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
