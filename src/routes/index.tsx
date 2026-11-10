import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { MaterialView } from "@/components/material-view";
import { Scanner } from "@/components/scanner";
import {
  CATALOG,
  FAMILIES,
  ROW_BY_ID,
  THICKNESSES,
  filterCatalog,
  type CatalogRow,
  type FamilyFilter,
  type SortKey,
} from "@/lib/catalog";
import { parseProofgrade, type ParsedCode } from "@/lib/proofgrade";

type Miss =
  | { kind: "unread"; raw: string; reason: string }
  | { kind: "missing"; raw: string; code: ParsedCode };

export const Route = createFileRoute("/")({ component: Home });

const SORTS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "id", label: "Catalog id" },
  { key: "code", label: "Sticker code" },
  { key: "thickness", label: "Thickness" },
];

const PAGE_SIZE = 25;

function Home() {
  const [mode, setMode] = useState<"scan" | "browse">("scan");
  const [version, setVersion] = useState<"B" | "C">("C");
  const [serial, setSerial] = useState("AAAA");
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState<FamilyFilter>("All");
  const [thickness, setThickness] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>("name");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [scanned, setScanned] = useState<ParsedCode | null>(null);
  const [miss, setMiss] = useState<Miss | null>(null);
  const [jump, setJump] = useState(0);
  const [page, setPage] = useState(0);
  const detailRef = useRef<HTMLDivElement>(null);
  const missRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(
    () => filterCatalog(CATALOG, query, family, thickness, sort),
    [query, family, thickness, sort],
  );
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageStart = safePage * PAGE_SIZE;
  const pageRows = rows.slice(pageStart, pageStart + PAGE_SIZE);
  const selected = selectedId != null ? (ROW_BY_ID.get(selectedId) ?? null) : null;

  useEffect(() => {
    setPage(0);
  }, [query, family, thickness, sort]);

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
    setSerial((current) => (current.length >= 3 ? current : "AAAA"));
    reveal();
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:py-10">
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
          Materials
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
                {FAMILIES.map((item) => (
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
                {THICKNESSES.map((item) => (
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
