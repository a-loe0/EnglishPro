import { summarizeStudents } from '../../../src/utils/students';

const day = (d: number) => new Date(Date.UTC(2026, 9, d));

describe('summarizeStudents', () => {
  it('lists named students with their activity and counts guests', () => {
    const result = summarizeStudents(
      [
        { studentId: 'amy', name: 'Amy Lin', at: day(1), completed: true },
        { studentId: 'amy', name: 'Amy Lin', at: day(3), completed: false },
        { studentId: 'bo', name: 'Bo Chen', at: day(2), completed: false },
        { studentId: 'g1', name: 'Guest', at: day(4), completed: true },
        { studentId: 'g1', name: 'Guest', at: day(4), completed: false },
        { studentId: 'g2', name: 'Guest', at: day(4), completed: false },
      ],
      [
        { studentId: 'bo', name: 'Bo Chen', at: day(5) },
        { studentId: 'bo', name: 'Bo Chen', at: day(5) },
      ],
      'Guest',
    );

    expect(result.guestCount).toBe(2);
    // Most recently active first.
    expect(result.students.map((s) => s.id)).toEqual(['bo', 'amy']);
    expect(result.students[0]).toMatchObject({ lessonsWatched: 1, lessonsCompleted: 0, recordings: 2, lastActive: day(5).toISOString() });
    expect(result.students[1]).toMatchObject({ lessonsWatched: 2, lessonsCompleted: 1, recordings: 0, lastActive: day(3).toISOString() });
  });

  it('lists a student who only sent a recording', () => {
    const result = summarizeStudents([], [{ studentId: 'cy', name: 'Cy', at: day(1) }], 'Guest');
    expect(result.students).toHaveLength(1);
    expect(result.students[0].lessonsWatched).toBe(0);
  });

  it('is empty with no activity', () => {
    expect(summarizeStudents([], [], 'Guest')).toEqual({ students: [], guestCount: 0 });
  });
});
