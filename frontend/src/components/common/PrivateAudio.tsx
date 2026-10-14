import { useEffect, useState } from 'react';

interface Props {
  // Fetches the recording; called when the listener first presses play.
  load: () => Promise<Blob>;
  playLabel: string;
  errorLabel: string;
}

// Player for a recording that needs the signed-in session to download, which
// a plain <audio src> can't send.
export function PrivateAudio({ load, playLabel, errorLabel }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  if (url) return <audio controls autoPlay src={url} className="h-9 max-w-full" />;

  const play = async () => {
    setLoading(true);
    setFailed(false);
    try {
      setUrl(URL.createObjectURL(await load()));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={play}
        className="rounded-full border border-primary px-4 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
      >
        ▶ {playLabel}
      </button>
      {failed && (
        <span role="alert" className="text-sm text-red-600">
          {errorLabel}
        </span>
      )}
    </span>
  );
}
