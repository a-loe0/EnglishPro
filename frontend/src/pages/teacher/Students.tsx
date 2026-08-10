import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout';
import { Card, Spinner } from '../../components/common';
import { teacherSidebarItems } from '../../config/teacherSidebar';

const StudentsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

interface Student {
  id: string;
  name: string;
  email: string;
  enrolledCourses: number;
  completedVideos: number;
  lastActive: string;
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder - would fetch from API
    setTimeout(() => {
      setStudents([]);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <DashboardLayout sidebarItems={teacherSidebarItems} title="Students">
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={teacherSidebarItems} title="Students">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Students</h2>
        <p className="text-gray-500 mt-1">{students.length} student{students.length !== 1 ? 's' : ''} enrolled</p>
      </div>

      {students.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <StudentsIcon />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No students yet</h3>
          <p className="text-gray-500">Students will appear here once they enroll in your courses</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled Courses</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed Videos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{student.name}</div>
                      <div className="text-sm text-gray-500">{student.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{student.enrolledCourses}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{student.completedVideos}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{student.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </DashboardLayout>
  );
}
