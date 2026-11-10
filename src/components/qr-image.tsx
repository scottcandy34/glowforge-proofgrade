import { useEffect, useState } from "react";

export function QrImage({ text, label, marked = false }: { text: string; label: string; marked?: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    setFailed(false);
    const style = getComputedStyle(document.documentElement);
    const dark = style.getPropertyValue("--color-ink").trim();
    const light = style.getPropertyValue("--color-surface").trim();
    void import("qrcode")
      .then((mod) => {
        const fn = mod.toDataURL ?? mod.default?.toDataURL;
        if (!fn) throw new Error("QR encoder missing");
        return fn(text, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 640,
          color: dark && light ? { dark, light } : undefined,
        });
      })
      .then((next) => {
        if (live) setUrl(next);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [text]);

  if (failed) {
    return <p className="text-sm text-muted">Could not draw that code.</p>;
  }
  if (!url) {
    return <div className="size-56 animate-pulse rounded-xl bg-chip" aria-hidden="true" />;
  }
  return (
    <img
      src={url}
      alt={label}
      width={224}
      height={224}
      data-generated-qr={marked ? "true" : undefined}
      className="size-56 rounded-xl border border-line bg-surface"
    />
  );
}
