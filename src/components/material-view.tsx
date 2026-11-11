import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronRight, Copy, Download, Printer, Share2 } from "lucide-react";
import { QrImage } from "@/components/qr-image";
import { tubeSettings, tubeTypes, type CatalogRow, type LaserOp } from "@/lib/catalog";
import { shopUrl } from "@/lib/shop";
import { buildPayload, randomSerial, type ParsedCode } from "@/lib/proofgrade";

function isFramed(): boolean {
  return window.parent !== window;
}

function copyText(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "0";
  area.style.width = "1px";
  area.style.height = "1px";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.focus();
  area.select();
  area.setSelectionRange(0, area.value.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, data] = dataUrl.split(",");
  const mime = /data:(.*?);/.exec(meta)?.[1] ?? "image/png";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

type OpKey = "cut" | "score" | "vector" | "photo";

const OPS: { key: OpKey; label: string }[] = [
  { key: "cut", label: "Cut" },
  { key: "score", label: "Score" },
  { key: "vector", label: "Vector" },
  { key: "photo", label: "Photo" },
];

function num(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return String(value);
}

function isDefault(op: LaserOp): boolean {
  return Array.isArray(op.uses) && op.uses.includes("default");
}

function OpTable({ rows }: { rows: LaserOp[] }) {
  if (!rows.length) return <p className="text-sm text-muted">None in this catalog.</p>;
  const showFocus = rows.some((row) => row.focal_offset != null);
  const showGap = rows.some((row) => row.scangap != null);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-muted">
          <tr className="border-b border-line">
            <th className="py-2 pr-3 font-medium">Result</th>
            <th className="py-2 pr-3 font-medium">Power</th>
            <th className="py-2 pr-3 font-medium">Speed</th>
            <th className="py-2 pr-3 font-medium">Passes</th>
            {showGap ? <th className="py-2 pr-3 font-medium">Gap</th> : null}
            {showFocus ? <th className="py-2 pr-3 font-medium">Focus</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.outcome?.dev_id ?? "op"}-${index}`} className="border-b border-line last:border-0">
              <td className="py-2 pr-3">
                <span className="font-medium">{row.outcome?.name || "Cut"}</span>
                {isDefault(row) ? <span className="ml-2 text-xs font-semibold text-accent">Default</span> : null}
              </td>
              <td className="py-2 pr-3 tabular-nums">{num(row.power)}</td>
              <td className="py-2 pr-3 tabular-nums">{num(row.speed)}</td>
              <td className="py-2 pr-3 tabular-nums">{num(row.passes)}</td>
              {showGap ? <td className="py-2 pr-3 tabular-nums">{num(row.scangap)}</td> : null}
              {showFocus ? <td className="py-2 pr-3 tabular-nums">{num(row.focal_offset)}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MaterialView({
  row,
  scanned,
  version,
  serial,
  onVersion,
  onSerial,
}: {
  row: CatalogRow;
  scanned: ParsedCode | null;
  version: "B" | "C";
  serial: string;
  onVersion: (version: "B" | "C") => void;
  onSerial: (serial: string) => void;
}) {
  const tubes = tubeTypes(row);
  const [tube, setTube] = useState(tubes.includes("pro") ? "pro" : (tubes[0] ?? "basic"));
  const [op, setOp] = useState<OpKey>("cut");
  const [copied, setCopied] = useState<"copied" | "selected" | null>(null);
  const [shared, setShared] = useState<"shared" | "copied" | null>(null);
  const [saveUrl, setSaveUrl] = useState<string | null>(null);
  const codeRef = useRef<HTMLParagraphElement>(null);
  const [thumbOk, setThumbOk] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [printUrl, setPrintUrl] = useState<string | null>(null);
  useEffect(() => {
    setThumbOk(true);
    setSettingsOpen(false);
  }, [row.numericId]);
  const activeTube = tubes.includes(tube) ? tube : (tubes[0] ?? tube);
  const settings = tubeSettings(row, activeTube);
  const payload = buildPayload(version, row.numericId, serial);
  useEffect(() => {
    if (!payload) {
      setPrintUrl(null);
      return;
    }
    let live = true;
    void import("qrcode")
      .then((qr) => {
        const draw = qr.toDataURL ?? qr.default?.toDataURL;
        if (!draw) return;
        return draw(payload, {
          errorCorrectionLevel: "M",
          margin: 0,
          width: 900,
          color: { dark: "#000000", light: "#ffffff" },
        });
      })
      .then((url) => {
        if (live && url) setPrintUrl(url);
      });
    return () => {
      live = false;
    };
  }, [payload]);
  const rows = useMemo(() => {
    if (!settings) return [];
    if (op === "cut") return settings.cut_setting ? [settings.cut_setting] : [];
    if (op === "score") return settings.score_settings ?? [];
    if (op === "vector") return settings.vector_engrave_settings ?? [];
    return settings.bitmap_engrave_settings ?? [];
  }, [op, settings]);

  async function copyPayload() {
    if (!payload) return;
    const mark = (state: "copied" | "selected") => {
      setCopied(state);
      window.setTimeout(() => setCopied(null), state === "copied" ? 1600 : 2400);
    };
    const selectCode = () => {
      const node = codeRef.current;
      if (!node) return;
      const range = document.createRange();
      range.selectNodeContents(node);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    };
    if (!isFramed() && copyText(payload)) {
      mark("copied");
      return;
    }
    if (isFramed()) selectCode();
    let selectedCopy = false;
    if (isFramed()) {
      try {
        selectedCopy = document.execCommand("copy");
      } catch {
        selectedCopy = false;
      }
    }
    if (selectedCopy) {
      mark("copied");
      return;
    }
    try {
      await navigator.clipboard.writeText(payload);
      mark("copied");
      return;
    } catch {
      /* The preview frame blocks the clipboard. */
    }
    selectCode();
    mark("selected");
  }

  function pageUrl(): string {
    const url = new URL(window.location.href);
    if (payload) url.searchParams.set("code", payload);
    return url.toString();
  }

  async function sharePage() {
    if (!payload) return;
    const url = pageUrl();
    const mark = (state: "shared" | "copied") => {
      setShared(state);
      window.setTimeout(() => setShared(null), 1600);
    };
    if (!isFramed() && navigator.share) {
      try {
        await navigator.share({ title: row.name, text: payload, url });
        mark("shared");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    const copiedLink =
      copyText(url) || (await navigator.clipboard.writeText(url).then(() => true).catch(() => false));
    if (copiedLink) mark("copied");
  }

  function fileName() {
    return `proofgrade-${row.prefix ?? row.numericId}.png`;
  }

  async function download() {
    const src = printUrl ?? document.querySelector<HTMLImageElement>('[data-generated-qr="true"]')?.src;
    if (!src) return;
    const name = fileName();
    if (!isFramed()) {
      triggerDownload(src, name);
      return;
    }
    const blob = src.startsWith("data:") ? dataUrlToBlob(src) : await fetch(src).then((res) => res.blob());
    const file = new File([blob], name, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: row.name });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    const blobUrl = URL.createObjectURL(blob);
    const popup = window.open(blobUrl, "_blank", "noopener,noreferrer");
    if (!popup) setSaveUrl(blobUrl);
    else window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  }

  function printThisPage() {
    const sheet = document.querySelector<HTMLElement>(".sheet-print");
    if (!sheet) return;
    const placeholder = document.createComment("sheet-print");
    sheet.before(placeholder);
    document.body.appendChild(sheet);
    document.body.classList.add("printing");
    let restored = false;
    const restore = () => {
      if (restored) return;
      restored = true;
      document.body.classList.remove("printing");
      placeholder.replaceWith(sheet);
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  }

  function printCode() {
    printThisPage();
  }

  const orderUrl = shopUrl(row);

  return (
    <article
      className={
        scanned ? "rounded-2xl border-2 border-accent bg-surface" : "rounded-2xl border border-line bg-surface"
      }
    >
      <header className="flex items-start gap-4 border-b border-line p-4">
        {row.thumb && thumbOk ? (
          <img
            src={row.thumb}
            alt=""
            width={64}
            height={64}
            className="size-16 shrink-0 rounded-xl object-cover"
            onError={() => setThumbOk(false)}
          />
        ) : (
          <div className="size-16 shrink-0 rounded-xl bg-chip" aria-hidden="true" />
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-widest text-muted uppercase">
            {row.family}
            {scanned ? " · Scanned" : null}
          </p>
          <h2 className="font-display text-2xl leading-tight font-semibold">{row.name}</h2>
          <p className="font-display text-xl leading-tight font-semibold text-accent">
            {row.thickness}
            {row.mm != null ? ` · ${Math.round(row.mm * 100) / 100} mm` : ""}
          </p>
          <p className="text-sm text-muted">id {row.numericId}</p>
        </div>
      </header>

      <div className="flex flex-col gap-4 p-4">
        {scanned ? (
          <div className="rounded-xl bg-chip px-3 py-3">
            <p className="text-sm font-semibold tracking-wide">{scanned.raw}</p>
          </div>
        ) : null}

        {payload ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {payload ? <QrImage text={payload} label={`QR code for ${row.name}, ${payload}`} marked /> : null}
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {(["C", "B"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onVersion(item)}
                    className={
                      version === item
                        ? "min-h-11 rounded-full bg-ink px-4 text-sm font-semibold text-surface"
                        : "min-h-11 rounded-full border border-line bg-surface px-4 text-sm font-semibold"
                    }
                  >
                    Version {item}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => onSerial(randomSerial())}
                  className="min-h-11 rounded-full border border-line px-4 text-sm font-semibold"
                >
                  New serial
                </button>
              </div>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-muted">Serial, 4 characters, case-sensitive</span>
                <input
                  value={serial}
                  maxLength={4}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  onChange={(event) => onSerial(event.target.value.slice(0, 4))}
                  className="min-h-11 rounded-xl border border-line bg-bg px-3 font-semibold tracking-widest"
                />
              </label>
              {payload ? (
                <div className="flex flex-wrap items-center gap-2">
                  <p ref={codeRef} className="min-w-0 flex-1 text-sm font-semibold break-all tracking-wide">
                    {payload}
                  </p>
                  <button
                    type="button"
                    onClick={() => void copyPayload()}
                    className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold"
                  >
                    {copied === "copied" ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {copied === "copied" ? "Copied" : "Copy"}
                  </button>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void download()}
                  disabled={!payload}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold disabled:opacity-50"
                >
                  <Download className="size-4" />
                  Download PNG
                </button>
                <button
                  type="button"
                  onClick={printCode}
                  disabled={!printUrl}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold disabled:opacity-50"
                >
                  <Printer className="size-4" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => void sharePage()}
                  disabled={!payload}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold disabled:opacity-50"
                >
                  {shared ? <Check className="size-4" /> : <Share2 className="size-4" />}
                  {shared === "copied" ? "Link copied" : shared === "shared" ? "Shared" : "Share"}
                </button>
              </div>
              <p className="text-sm text-muted">Prints at 1.35 in (34 mm) across the code itself. Use 100% scale.</p>
              {copied === "selected" ? (
                <p className="text-sm text-muted">The code is highlighted. Copy it from there.</p>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">No code for this material.</p>
        )}

        <button
          type="button"
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen((open) => !open)}
          className="flex min-h-11 w-full items-center gap-2 text-left text-sm font-semibold"
        >
          {settingsOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          Laser settings
        </button>
        {settingsOpen ? (
          tubes.length ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {tubes.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTube(item)}
                    className={
                      activeTube === item
                        ? "min-h-11 rounded-full bg-ink px-4 text-sm font-semibold text-surface"
                        : "min-h-11 rounded-full border border-line px-4 text-sm font-semibold"
                    }
                  >
                    {item === "pro" ? "Pro" : item === "basic" ? "Basic" : item}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {OPS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setOp(item.key)}
                    className={
                      op === item.key
                        ? "min-h-11 rounded-full bg-chip px-4 text-sm font-semibold text-accent"
                        : "min-h-11 rounded-full px-4 text-sm font-semibold text-muted"
                    }
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {settings?.description ? <p className="text-sm text-muted">{settings.description}</p> : null}
              <OpTable rows={rows} />
              <p className="text-xs text-muted">Power and speed are the catalog numbers. The sticker itself does not store them.</p>
            </div>
          ) : (
            <p className="text-sm text-muted">This entry has no cut settings. It is a preset, not a sheet.</p>
          )
        ) : null}
        {row.sku ? <p className="text-xs text-muted">SKU {row.sku}</p> : null}
        {orderUrl ? (
          <a
            href={orderUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-on-accent"
          >
            Order more
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center rounded-full bg-chip px-4 text-sm font-semibold text-muted"
          >
            Order more
          </button>
        )}
      </div>
      {printUrl ? (
        <div className="sheet-print" aria-hidden="true">
          <img src={printUrl} alt="" />
          <p>{row.name}</p>
        </div>
      ) : null}
      {saveUrl ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-4">
            <p className="font-semibold">Save the code</p>
            <p className="mt-1 text-sm text-muted">Press and hold the image, then save it.</p>
            <img src={saveUrl} alt="" className="mx-auto mt-4 size-56 bg-white" />
            <button
              type="button"
              onClick={() => setSaveUrl(null)}
              className="mt-4 min-h-11 w-full rounded-full bg-ink text-sm font-semibold text-surface"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
