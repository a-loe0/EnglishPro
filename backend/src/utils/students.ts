// Builds the teacher's Students list from what students did on her lessons.
// Visitors who never gave a name are all called "Guest", so they are counted,
// not listed: the teacher cannot tell them apart anyway.

export interface StudentActivityRow {
  studentId: string;
  name: string;
  at: Date;
}

export interface WatchRow extends StudentActivityRow {
  completed: boolean;
}

export interface StudentSummary {
  id: string;
  name: string;
  lessonsWatched: number;
  lessonsCompleted: number;
  recordings: number;
  lastActive: string;
}

export interface StudentsResponse {
  students: StudentSummary[];
  guestCount: number;
}

export function summarizeStudents(
  watches: WatchRow[],
  recordings: StudentActivityRow[],
  guestName: string,
): StudentsResponse {
  const byId = new Map<string, StudentSummary & { last: Date }>();
  const guests = new Set<string>();

  const entry = (row: StudentActivityRow) => {
    if (row.name === guestName) {
      guests.add(row.studentId);
      return null;
    }
    let s = byId.get(row.studentId);
    if (!s) {
      s = { id: row.studentId, name: row.name, lessonsWatched: 0, lessonsCompleted: 0, recordings: 0, lastActive: '', last: row.at };
      byId.set(row.studentId, s);
    }
    if (row.at > s.last) s.last = row.at;
    return s;
  };

  for (const w of watches) {
    const s = entry(w);
    if (!s) continue;
    s.lessonsWatched += 1;
    if (w.completed) s.lessonsCompleted += 1;
  }
  for (const r of recordings) {
    const s = entry(r);
    if (s) s.recordings += 1;
  }

  const students = [...byId.values()]
    .sort((a, b) => b.last.getTime() - a.last.getTime())
    .map(({ last, ...s }) => ({ ...s, lastActive: last.toISOString() }));

  return { students, guestCount: guests.size };
}
