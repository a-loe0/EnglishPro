import { useEffect, useRef, useState } from 'react';

export interface Recording {
  blob: Blob;
  // Extension matches what the browser recorded; the server converts either.
  filename: string;
}

// Microphone recording as a start/stop toggle. `onRecorded` gets the finished
// clip; `onError` fires when the microphone can't be used.
export function useAudioRecorder(onRecorded: (recording: Recording) => void, onError: () => void) {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  // Always call the latest handlers, without restarting a recording in progress.
  const handlers = useRef({ onRecorded, onError });
  useEffect(() => {
    handlers.current = { onRecorded, onError };
  });

  // Release the microphone if the page is left mid-recording.
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

  const start = async () => {
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
        // Safari records mp4, other browsers webm.
        handlers.current.onRecorded({
          blob: new Blob(chunks, { type }),
          filename: type.includes('mp4') ? 'recording.m4a' : 'recording.webm',
        });
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      handlers.current.onError();
    }
  };

  const toggle = () => {
    if (recording) recorderRef.current?.stop();
    else start();
  };

  return { recording, toggle };
}

// Holds one recorded clip plus a URL to preview it, releasing the URL when the
// clip is replaced, cleared, or the component goes away.
export function useClip() {
  const [clip, setClipState] = useState<(Recording & { url: string }) | null>(null);
  const urlRef = useRef<string | null>(null);

  const setClip = (recording: Recording | null) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = recording ? URL.createObjectURL(recording.blob) : null;
    setClipState(recording && urlRef.current ? { ...recording, url: urlRef.current } : null);
  };

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  return [clip, setClip] as const;
}
