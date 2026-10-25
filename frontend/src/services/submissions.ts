import api from './api';

// A follow-up after the teacher's first reply, from either side.
export interface Message {
  id: string;
  fromTeacher: boolean;
  text: string | null;
  hasAudio: boolean;
  createdAt: string;
}

// The most messages one recording's conversation can hold (matches the backend).
export const MAX_MESSAGES = 20;

// A student's recording (of one vocabulary word, or of the whole lesson when
// `word` is empty), the teacher's reply, and any back-and-forth after it.
export interface Submission {
  id: string;
  videoId: string;
  word: string;
  feedbackText: string | null;
  hasFeedbackAudio: boolean;
  // Last time the teacher replied; null while she has something to answer.
  reviewedAt: string | null;
  createdAt: string;
  messages: Message[];
  // The teacher replied since the student last looked.
  unread: boolean;
}

// The teacher has given her first reply, so the conversation can go on.
export const teacherReplied = (s: Submission) => !!s.feedbackText || s.hasFeedbackAudio;

export interface TeacherSubmission extends Submission {
  student: { id: string; name: string };
  video: { id: string; title: string };
}

// Lets the menu badge refresh after something is sent or read.
export const PRONUNCIATION_CHANGED = 'pronunciation:changed';
export const announcePronunciationChange = () => window.dispatchEvent(new Event(PRONUNCIATION_CHANGED));

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };

export const submissionService = {
  async send(videoId: string, word: string, audio: Blob, filename: string): Promise<Submission> {
    const formData = new FormData();
    formData.append('videoId', videoId);
    formData.append('word', word);
    formData.append('audio', audio, filename);
    const response = await api.post('/submissions', formData, multipart);
    return response.data;
  },

  async mine(): Promise<Submission[]> {
    const response = await api.get('/submissions/mine');
    return response.data.data;
  },

  async list(status: 'pending' | 'reviewed'): Promise<{ data: TeacherSubmission[]; pendingCount: number }> {
    const response = await api.get('/submissions', { params: { status } });
    return response.data;
  },

  async sendFeedback(id: string, text: string, audio?: { blob: Blob; filename: string }): Promise<Submission> {
    const formData = new FormData();
    formData.append('text', text);
    if (audio) formData.append('audio', audio.blob, audio.filename);
    const response = await api.put(`/submissions/${id}/feedback`, formData, multipart);
    return response.data;
  },

  async sendMessage(id: string, text: string, audio?: { blob: Blob; filename: string }): Promise<Submission> {
    const formData = new FormData();
    formData.append('text', text);
    if (audio) formData.append('audio', audio.blob, audio.filename);
    const response = await api.post(`/submissions/${id}/messages`, formData, multipart);
    return response.data;
  },

  async markSeen(id: string): Promise<void> {
    await api.post(`/submissions/${id}/seen`);
  },

  // Number for the Pronunciation menu item: unread replies for a student,
  // recordings waiting for the teacher.
  async badge(): Promise<number> {
    const response = await api.get('/submissions/badge');
    return response.data.count;
  },

  async fetchMessageAudio(id: string, messageId: string): Promise<Blob> {
    const response = await api.get(`/submissions/${id}/messages/${messageId}/audio`, { responseType: 'blob' });
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/submissions/${id}`);
  },

  // Recordings are private, so they are fetched with the session rather than
  // linked to directly.
  async fetchAudio(id: string, kind: 'student' | 'feedback'): Promise<Blob> {
    const response = await api.get(`/submissions/${id}/${kind === 'student' ? 'audio' : 'feedback-audio'}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default submissionService;
