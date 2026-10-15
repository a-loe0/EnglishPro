import api from './api';

// A student's recording of one vocabulary word, and the teacher's reply.
export interface Submission {
  id: string;
  videoId: string;
  word: string;
  feedbackText: string | null;
  hasFeedbackAudio: boolean;
  reviewedAt: string | null;
  createdAt: string;
}

export interface TeacherSubmission extends Submission {
  student: { id: string; name: string };
  video: { id: string; title: string };
}

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
