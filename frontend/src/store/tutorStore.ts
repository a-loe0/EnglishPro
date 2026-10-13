import { create } from 'zustand';
import type { TutorLesson } from '../services/tutor';

// The lesson the student is currently viewing, so the tutor widget (mounted
// once in the dashboard layout) can teach from it.
interface TutorState {
  lesson: TutorLesson | null;
  setLesson: (lesson: TutorLesson | null) => void;
}

export const useTutorStore = create<TutorState>((set) => ({
  lesson: null,
  setLesson: (lesson) => set({ lesson }),
}));
