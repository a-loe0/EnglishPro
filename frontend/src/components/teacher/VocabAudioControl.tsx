import { useEffect, useRef, useState } from 'react';
import { videoService } from '../../services/videos';
import { useTranslation } from '../../i18n';

interface Props {
  videoId: string;
  // Filename of the saved recording, if the word has one.
  audio?: string;
  onChange: (audio: string | undefined) => void;
  // Names the word for screen readers, e.g. "English word 2".
  label: string;
}

const buttonClass =
  'rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50';

// Record or upload the teacher's pronunciation of one vocabulary word.
export function VocabAudioControl({ videoId, audio, onChange, label }: Props) {
  const t = useTranslation();
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Release the microphone if the teacher leaves mid-recording.
  useEffect(
    () => () => {
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = null;
        recorder.stop();
      }
      recorder?.stream.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  const upload = async (file: Blob, filename: string) => {
    setUploading(true);
    setError(null);
    try {
      onChange(await videoService.uploadVocabAudio(videoId, file, filename));
    } catch (err: unknown) {
      const apiMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(apiMessage || t('lpAudioFailed'));
    } finally {
      setUploading(false);
    }
  };

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        const type = recorder.mimeType || 'audio/webm';
        // Safari records mp4, other browsers webm; the server converts either.
        upload(new Blob(chunks, { type }), type.includes('mp4') ? 'recording.m4a' : 'recording.webm');
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError(t('lpMicFailed'));
    }
  };

  const toggleRecording = () => {
    if (recording) recorderRef.current?.stop();
    else startRecording();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={recording}
          aria-label={`${recording ? t('lpStopRecording') : t('lpRecord')}: ${label}`}
          disabled={uploading}
          onClick={toggleRecording}
          className={recording ? 'rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700' : buttonClass}
        >
          {recording ? `■ ${t('lpStopRecording')}` : `🎙 ${t('lpRecord')}`}
        </button>
        <button
          type="button"
          aria-label={`${t('lpUploadAudio')}: ${label}`}
          disabled={uploading || recording}
          onClick={() => fileRef.current?.click()}
          className={buttonClass}
        >
          ⬆ {t('lpUploadAudio')}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*,.m4a,.mp3,.wav,.webm,.mp4"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            // Clear the input so picking the same file again still fires.
            e.target.value = '';
            if (file) upload(file, file.name);
          }}
        />
        {uploading && <span className="text-sm text-gray-500">{t('lpAudioUploading')}</span>}
        {audio && !uploading && (
          <>
            <audio controls preload="none" src={videoService.getVocabAudioUrl(videoId, audio)} className="h-8 max-w-[14rem]" />
            <button type="button" onClick={() => onChange(undefined)} className="text-sm text-red-600 hover:underline">
              {t('lpRemoveAudio')}
            </button>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
