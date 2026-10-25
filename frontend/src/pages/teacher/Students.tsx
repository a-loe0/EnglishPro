import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Spinner } from '../../components/common';
import { teacherSidebarItems } from '../../config/teacherSidebar';
import { dashboardService, type TeacherStudents } from '../../services/dashboard';

const StudentsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

const th = 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
const td = 'px-6 py-4 whitespace-nowrap text-gray-600';

// Everyone who watched a lesson or sent a recording. Students give their name
// the first time they send a recording; until then they are anonymous visitors.
export default function Students() {
  const [data, setData] = useState<TeacherStudents | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    dashboardService
      .getTeacherStudents()
      .then(setData)
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
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

  const students = data?.students ?? [];
  const guestCount = data?.guestCount ?? 0;
  const visitorsLine =
    guestCount > 0 &&
    `${students.length > 0 ? '+ ' : ''}${guestCount} visitor${guestCount !== 1 ? 's' : ''} watched lessons without giving a name.`;

  return (
    <DashboardLayout sidebarItems={teacherSidebarItems} title="Students">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Students</h2>
        <p className="text-gray-500 mt-1">
          {students.length + guestCount} student{students.length + guestCount !== 1 ? 's' : ''} used your lessons.
          Students give their name the first time they send you a recording.
        </p>
      </div>

      {failed ? (
        <Card className="p-8 text-center">
          <p role="alert" className="text-red-600">
            Could not load students. Please try again.
          </p>
        </Card>
      ) : students.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
            <StudentsIcon />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No named students yet</h3>
          <p className="text-gray-500">Students appear here when they watch a lesson or send a recording.</p>
          {visitorsLine && <p className="text-gray-500 mt-2">{visitorsLine}</p>}
        </Card>
      ) : (
        <>
          <Card padding="none" className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className={th}>Student</th>
                  <th className={th}>Lessons Watched</th>
                  <th className={th}>Completed</th>
                  <th className={th}>Recordings</th>
                  <th className={th}>Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{student.name}</td>
                    <td className={td}>{student.lessonsWatched}</td>
                    <td className={td}>{student.lessonsCompleted}</td>
                    <td className={td}>
                      {student.recordings > 0 ? (
                        <Link to="/teacher/pronunciation" className="text-primary hover:underline">
                          {student.recordings}
                        </Link>
                      ) : (
                        0
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{formatDate(student.lastActive)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          {visitorsLine && <p className="text-sm text-gray-500 mt-4">{visitorsLine}</p>}
        </>
      )}
    </DashboardLayout>
  );
}
