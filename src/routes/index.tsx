import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { MaterialView } from "@/components/material-view";
import { Scanner } from "@/components/scanner";
import {
  CATALOG,
  ROW_BY_ID,
  familiesFor,
  filterCatalog,
  thicknessesFor,
  type CatalogRow,
  type FamilyFilter,
  type SortKey,
} from "@/lib/catalog";
import { parseProofgrade, randomSerial, buildPayload, type ParsedCode } from "@/lib/proofgrade";

type Miss =
  | { kind: "unread"; raw: string; reason: string }
  | { kind: "missing"; raw: string; code: ParsedCode };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { code?: string } => ({
    code: typeof search.code === "string" && search.code.trim() ? search.code : undefined,
  }),
  component: Home,
});

const SORTS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "id", label: "Catalog id" },
  { key: "code", label: "Sticker code" },
  { key: "thickness", label: "Thickness" },
];

const PAGE_SIZE = 25;

function readShare(code: string | undefined): {
  version: "B" | "C";
  serial: string;
  selectedId: number | null;
  miss: Miss | null;
} {
  const empty = { version: "C" as const, serial: "AAAA", selectedId: null, miss: null };
  if (!code) return empty;
  const result = parseProofgrade(code);
  if (!result.ok) return { ...empty, miss: { kind: "unread", raw: code, reason: result.message } };
  const parsed = result.code;
  const version = parsed.version === "B" || parsed.version === "C" ? parsed.version : "C";
  const serial = parsed.serial.length >= 3 ? parsed.serial : "AAAA";
  const row = ROW_BY_ID.get(parsed.jsonId);
  if (!row) return { version, serial, selectedId: null, miss: { kind: "missing", raw: parsed.raw, code: parsed } };
  return { version, serial, selectedId: row.numericId, miss: null };
}

function Home() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const shared = readShare(search.code);
  const [mode, setMode] = useState<"scan" | "browse">("scan");
  const [version, setVersion] = useState<"B" | "C">(shared.version);
  const [serial, setSerial] = useState(shared.serial);
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState<FamilyFilter>("All");
  const [thickness, setThickness] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>("name");
  const [selectedId, setSelectedId] = useState<number | null>(shared.selectedId);
  const [scanned, setScanned] = useState<ParsedCode | null>(null);
  const [miss, setMiss] = useState<Miss | null>(shared.miss);
  const [jump, setJump] = useState(shared.selectedId != null || shared.miss ? 1 : 0);
  const [page, setPage] = useState(0);
  const detailRef = useRef<HTMLDivElement>(null);
  const missRef = useRef<HTMLDivElement>(null);
  const appliedCode = useRef(search.code);

  const rows = useMemo(
    () => filterCatalog(CATALOG, query, family, thickness, sort),
    [query, family, thickness, sort],
  );
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageStart = safePage * PAGE_SIZE;
  const pageRows = rows.slice(pageStart, pageStart + PAGE_SIZE);
  const selected = selectedId != null ? (ROW_BY_ID.get(selectedId) ?? null) : null;
  const thicknessChoices = useMemo(() => thicknessesFor(CATALOG, family, query), [family, query]);
  const familyChoices = useMemo(() => familiesFor(CATALOG, thickness, query), [thickness, query]);

  useEffect(() => {
    if (search.code === appliedCode.current) return;
    appliedCode.current = search.code;
    const next = readShare(search.code);
    setVersion(next.version);
    setSerial(next.serial);
    setSelectedId(next.selectedId);
    setScanned(null);
    setMiss(next.miss);
    if (next.selectedId != null || next.miss) reveal();
  }, [search.code]);

  useEffect(() => {
    if (selectedId == null) return;
    const payload = buildPayload(version, selectedId, serial);
    if (!payload || !payload.endsWith(serial) || payload === search.code) return;
    appliedCode.current = payload;
    void navigate({ to: "/", search: { code: payload }, replace: true, resetScroll: false });
  }, [navigate, search.code, selectedId, serial, version]);

  useEffect(() => {
    setPage(0);
  }, [query, family, thickness, sort]);

  useEffect(() => {
    if (thickness != null && !thicknessChoices.some((item) => Math.abs(item.mm - thickness) <= 0.0005)) {
      setThickness(null);
    }
  }, [thickness, thicknessChoices]);

  useEffect(() => {
    if (family !== "All" && !familyChoices.includes(family)) setFamily("All");
  }, [family, familyChoices]);

  useEffect(() => {
    if (jump === 0) return;
    const node = missRef.current ?? detailRef.current;
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [jump]);

  function reveal() {
    setJump((n) => n + 1);
  }

  function onCode(text: string) {
    const raw = text.trim();
    const result = parseProofgrade(text);
    if (!result.ok) {
      setScanned(null);
      setSelectedId(null);
      setMiss({ kind: "unread", raw, reason: result.message });
      reveal();
      return;
    }
    const code = result.code;
    setScanned(code);
    if (code.version === "B" || code.version === "C") setVersion(code.version);
    if (code.serial.length === 4 || code.serial.length === 3) setSerial(code.serial);
    const row = ROW_BY_ID.get(code.jsonId);
    if (!row) {
      setSelectedId(null);
      setMiss({ kind: "missing", raw: code.raw, code });
      reveal();
      return;
    }
    setMiss(null);
    setSelectedId(row.numericId);
    reveal();
  }

  function pick(row: CatalogRow) {
    setSelectedId(row.numericId);
    setScanned(null);
    setMiss(null);
    setSerial(randomSerial());
    reveal();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:py-10">
      <header className="flex flex-col gap-3">
        <p className="text-xs font-semibold tracking-widest text-accent uppercase">Glowforge materials</p>
        <h1 className="font-display text-4xl leading-tight font-semibold sm:text-5xl">Proofgrade Codes</h1>
        <p className="max-w-2xl text-base text-muted">
          Scan a sticker, or pick a material and make a code for it.
        </p>
      </header>

      <div className="flex gap-2" role="tablist" aria-label="Mode">
        <Tab active={mode === "scan"} onClick={() => setMode("scan")}>
          Scan
        </Tab>
        <Tab active={mode === "browse"} onClick={() => setMode("browse")}>
          Search
        </Tab>
      </div>

      {mode === "scan" ? <Scanner onCode={onCode} /> : null}

      {miss ? (
        <div ref={missRef} className="scroll-mt-4 rounded-2xl border-2 border-accent bg-surface p-4" role="alert">
          <p className="text-xs font-semibold tracking-widest text-accent uppercase">
            {miss.kind === "unread" ? "Could not read this code" : "Material not found"}
          </p>
          <h2 className="font-display mt-1 text-2xl leading-tight font-semibold">
            {miss.kind === "unread" ? "That scan is not a Proofgrade sticker." : "No material matches that sticker."}
          </h2>
          <p className="mt-3 text-sm text-muted">Code found</p>
          <p className="mt-1 break-all font-semibold tracking-wide">{miss.raw || "(empty)"}</p>
          <p className="mt-3 text-sm text-muted">
            {miss.kind === "unread" ? miss.reason : "This code is not in the materials list."}
          </p>
        </div>
      ) : null}

      {selected ? (
        <div
          ref={detailRef}
          className={
            scanned && scanned.jsonId === selected.numericId
              ? "scroll-mt-4 rounded-2xl ring-2 ring-accent ring-offset-4 ring-offset-bg"
              : "scroll-mt-4"
          }
        >
          <MaterialView
            row={selected}
            scanned={scanned && scanned.jsonId === selected.numericId ? scanned : null}
            version={version}
            serial={serial}
            onVersion={setVersion}
            onSerial={setSerial}
          />
        </div>
      ) : null}

      {mode === "browse" ? (
        <section className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Find a material</span>
            <span className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Draftboard, leather, maple"
                className="min-h-11 w-full rounded-xl border border-line bg-surface pr-3 pl-10"
              />
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <span className="text-muted">Type</span>
              <select
                value={family}
                onChange={(event) => setFamily(event.target.value as FamilyFilter)}
                className="min-h-11 rounded-xl border border-line bg-surface px-3 font-semibold"
              >
                {familyChoices.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <span className="text-muted">Thickness</span>
              <select
                value={thickness == null ? "all" : String(thickness)}
                onChange={(event) => setThickness(event.target.value === "all" ? null : Number(event.target.value))}
                className="min-h-11 rounded-xl border border-line bg-surface px-3 font-semibold"
              >
                <option value="all">All</option>
                {thicknessChoices.map((item) => (
                  <option key={item.mm} value={String(item.mm)}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <span className="text-muted">Sort</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
                className="min-h-11 rounded-xl border border-line bg-surface px-3 font-semibold"
              >
                {SORTS.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-sm text-muted">
              {rows.length} of {CATALOG.length}
            </p>
          </div>

          {pageCount > 1 ? (
            <Pager
              page={safePage}
              pageCount={pageCount}
              from={pageStart + 1}
              to={pageStart + pageRows.length}
              total={rows.length}
              onPage={setPage}
            />
          ) : null}

          <ul className="flex flex-col gap-1">
            {pageRows.map((row) => (
              <li key={row.numericId}>
                <button
                  type="button"
                  onClick={() => pick(row)}
                  className={
                    selectedId === row.numericId
                      ? "flex min-h-9 w-full items-baseline gap-3 rounded-lg border border-accent bg-surface px-3 py-1.5 text-left text-sm"
                      : "flex min-h-9 w-full items-baseline gap-3 rounded-lg border border-line bg-surface px-3 py-1.5 text-left text-sm"
                  }
                >
                  <span className="min-w-0 flex-1 truncate font-semibold">{row.name}</span>
                  <span className="shrink-0 text-xs text-muted">{row.thickness}</span>
                </button>
              </li>
            ))}
          </ul>
          {rows.length === 0 ? <p className="text-sm text-muted">Nothing matches that search.</p> : null}
          {pageCount > 1 ? (
            <Pager
              page={safePage}
              pageCount={pageCount}
              from={pageStart + 1}
              to={pageStart + pageRows.length}
              total={rows.length}
              onPage={setPage}
            />
          ) : null}
        </section>
      ) : null}

      <footer className="mt-auto flex flex-col gap-1 border-t border-line pt-4 text-sm text-muted">
        <p>
          Proofgrade Codes by{" "}
          <a
            href="https://x.com/scottcandy34"
            className="font-semibold text-ink underline decoration-line underline-offset-2"
          >
            @scottcandy34
          </a>
        </p>
        <p>
          <a
            href="https://github.com/scottcandy34/glowforge-proofgrade"
            className="inline-flex items-center gap-1.5 font-semibold text-ink underline decoration-line underline-offset-2"
          >
            Source code
            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 fill-current">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
            </svg>
          </a>
        </p>
        <p>
          Also part of{" "}
          <a href="https://maurisnulla.com" className="font-semibold text-ink underline decoration-line underline-offset-2">
            maurisnulla.com
          </a>
        </p>
        <p>
          Material names and laser settings are from{" "}
          <a href="https://glowforge.com/b/proofgrade" className="font-semibold text-ink underline decoration-line underline-offset-2">
            Glowforge Proofgrade
          </a>
          . Shop the{" "}
          <a
            href="https://shop.glowforge.com/collections/materials"
            className="font-semibold text-ink underline decoration-line underline-offset-2"
          >
            materials
          </a>
          .
        </p>
      </footer>
    </main>
  );
}

function Pager({
  page,
  pageCount,
  from,
  to,
  total,
  onPage,
}: {
  page: number;
  pageCount: number;
  from: number;
  to: number;
  total: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        aria-label="Previous page"
        disabled={page === 0}
        onClick={() => onPage(page - 1)}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line bg-surface disabled:opacity-40"
      >
        <ChevronLeft className="size-5" />
      </button>
      <p className="text-sm text-muted">
        {from}–{to} of {total}
        <span className="px-2">·</span>
        {page + 1} / {pageCount}
      </p>
      <button
        type="button"
        aria-label="Next page"
        disabled={page >= pageCount - 1}
        onClick={() => onPage(page + 1)}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line bg-surface disabled:opacity-40"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        active
          ? "min-h-11 rounded-full bg-ink px-5 text-sm font-semibold text-surface"
          : "min-h-11 rounded-full border border-line bg-surface px-5 text-sm font-semibold"
      }
    >
      {children}
    </button>
  );
}
