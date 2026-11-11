import { useEffect, useRef, useState } from "react";
import { Camera, ScanLine } from "lucide-react";

export function Scanner({
  onCode,
  busy,
}: {
  onCode: (text: string) => void;
  busy?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paste, setPaste] = useState("");

  useEffect(() => {
    if (!cameraOn) return;
    const video = videoRef.current;
    if (!video) return;
    let dead = false;
    void (async () => {
      try {
        const { BrowserQRCodeReader } = await import("@zxing/browser");
        if (dead) return;
        const reader = new BrowserQRCodeReader();
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          video,
          (result, _err, controls) => {
            if (!result || dead) return;
            dead = true;
            controls.stop();
            setCameraOn(false);
            onCode(result.getText());
          },
        );
        if (dead) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
      } catch {
        if (!dead) {
          setError("The camera didn't start. Paste the code instead.");
          setCameraOn(false);
        }
      }
    })();
    return () => {
      dead = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [cameraOn, onCode]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setCameraOn(true);
          }}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-on-accent"
        >
          <ScanLine className="size-4" />
          Scan
        </button>
      </div>

      {cameraOn ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-ink">
          <video ref={videoRef} className="aspect-square w-full max-w-sm object-cover" muted playsInline autoPlay />
          <div className="bg-surface p-3">
            <button
              type="button"
              onClick={() => setCameraOn(false)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold"
            >
              <Camera className="size-4" />
              Stop camera
            </button>
          </div>
        </div>
      ) : null}

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          onCode(paste);
        }}
      >
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
          <span className="text-muted">Or paste the code. Case matters.</span>
          <input
            value={paste}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder="Glowforge:C:BnAAEKg"
            onChange={(event) => setPaste(event.target.value)}
            className="min-h-11 rounded-xl border border-line bg-surface px-3"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="min-h-11 self-end rounded-full border border-line bg-surface px-5 text-sm font-semibold sm:mb-0"
        >
          Look up
        </button>
      </form>

      {error ? <p className="text-sm font-medium text-accent">{error}</p> : null}
    </section>
  );
}
