import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthInitializer from './components/auth/AuthInitializer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ToastContainer, ErrorBoundary } from './components/common';
import { LanguageProvider } from './i18n';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import VideoUpload from './pages/teacher/VideoUpload';
import TeacherVideos from './pages/teacher/Videos';
import TeacherVideoDetail from './pages/teacher/VideoDetail';
import TeacherVideoEdit from './pages/teacher/VideoEdit';
import TeacherCourses from './pages/teacher/Courses';
import TeacherCourseNew from './pages/teacher/CourseNew';
import TeacherCourseDetail from './pages/teacher/CourseDetail';
import TeacherCourseEdit from './pages/teacher/CourseEdit';
import TeacherAnalytics from './pages/teacher/Analytics';
import TeacherSettings from './pages/teacher/Settings';
import TeacherStudents from './pages/teacher/Students';
import VideoWatch from './pages/student/VideoWatch';
import StudentAnalytics from './pages/student/Analytics';
import StudentCourses from './pages/student/Courses';
import StudentCourseDetail from './pages/student/CourseDetail';
import StudentLessons from './pages/student/Lessons';
import StudentSettings from './pages/student/Settings';

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <BrowserRouter>
          <ToastContainer />
          <AuthInitializer>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Generic dashboard redirect */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Student routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/watch/:videoId"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <VideoWatch />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/progress"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/courses"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/courses/:courseId"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentCourseDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/lessons"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentLessons />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/settings"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentSettings />
              </ProtectedRoute>
            }
          />

          {/* Teacher routes */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/videos"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherVideos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/videos/upload"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <VideoUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/videos/:videoId"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherVideoDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/videos/:videoId/edit"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherVideoEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/courses"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/courses/new"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherCourseNew />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/courses/:courseId"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherCourseDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/courses/:courseId/edit"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherCourseEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/analytics"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/settings"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/students"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherStudents />
              </ProtectedRoute>
            }
          />
          {/* Catch-all redirect to home */}
          <Route path="*" element={<Home />} />
        </Routes>
        </AuthInitializer>
        </BrowserRouter>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
