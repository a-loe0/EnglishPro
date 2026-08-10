import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Button, Input, Card } from '../../components/common';
import { VideoUploader, TranscodeProgress } from '../../components/teacher';
import { videoService } from '../../services/videos';
import type { Video } from '../../services/videos';
import { courseService } from '../../services/courses';
import type { Course } from '../../services/courses';
import { teacherSidebarItems } from '../../config/teacherSidebar';

type Step = 'upload' | 'details' | 'processing' | 'complete';

export default function VideoUpload() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('upload');
  const [tempId, setTempId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [createdVideo, setCreatedVideo] = useState<Video | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');

  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await courseService.getMyCourses();
        setCourses(data);
      } catch (err) {
        console.error('Failed to load courses:', err);
      }
    }
    loadCourses();
  }, []);

  const handleUploadComplete = (id: string, file: File) => {
    setTempId(id);
    setUploadedFile(file);
    setTitle(file.name.replace(/\.[^/.]+$/, '')); // Set default title from filename
    setStep('details');
  };

  const handleCreateVideo = async () => {
    if (!tempId || !title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const video = await videoService.create({
        tempId,
        title: title.trim(),
        description: description.trim() || undefined,
        courseId: courseId || undefined,
      });

      setCreatedVideo(video);
      setStep('processing');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create video';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessingComplete = () => {
    setStep('complete');
  };

  return (
    <DashboardLayout sidebarItems={teacherSidebarItems} title="Upload Video">
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {['Upload', 'Details', 'Processing', 'Complete'].map((label, index) => {
              const stepOrder: Step[] = ['upload', 'details', 'processing', 'complete'];
              const currentIndex = stepOrder.indexOf(step);
              const isActive = index <= currentIndex;
              const isCurrent = index === currentIndex;

              return (
                <div key={label} className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                    ${isActive ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}
                    ${isCurrent ? 'ring-4 ring-primary/20' : ''}
                  `}>
                    {index + 1}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                    {label}
                  </span>
                  {index < 3 && (
                    <div className={`w-12 h-0.5 mx-4 ${index < currentIndex ? 'bg-primary' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="p-6">
          {step === 'upload' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload your video</h2>
              <VideoUploader
                onUploadComplete={handleUploadComplete}
                onError={(msg) => setError(msg)}
              />
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Video details</h2>

              {uploadedFile && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <VideoIcon className="w-10 h-10 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                  <CheckIcon className="w-5 h-5 text-green-500" />
                </div>
              )}

              <div>
                <Input
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter video title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter video description"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course (optional)
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

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setStep('upload')}>
                  Back
                </Button>
                <Button
                  variant="gradient"
                  onClick={handleCreateVideo}
                  isLoading={loading}
                  disabled={!title.trim()}
                >
                  Create Video
                </Button>
              </div>
            </div>
          )}

          {step === 'processing' && createdVideo && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Processing video</h2>
              <p className="text-gray-500">
                Your video is being transcoded into multiple quality options. This may take a few minutes.
              </p>
              <TranscodeProgress
                videoId={createdVideo.id}
                onComplete={handleProcessingComplete}
                onError={(msg) => setError(msg)}
              />
            </div>
          )}

          {step === 'complete' && createdVideo && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <CheckIcon className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Upload complete!</h2>
                <p className="text-gray-500 mt-2">
                  Your video "{createdVideo.title}" is now ready for viewing.
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <Button variant="secondary" onClick={() => navigate('/teacher/videos')}>
                  View All Videos
                </Button>
                <Button
                  variant="gradient"
                  onClick={() => {
                    setStep('upload');
                    setTempId(null);
                    setUploadedFile(null);
                    setCreatedVideo(null);
                    setTitle('');
                    setDescription('');
                    setCourseId('');
                  }}
                >
                  Upload Another
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
