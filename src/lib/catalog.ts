import raw from "@/data/materials.json";
import {
  ASSIGNED_IDS,
  VERIFIED_IDS,
  jsonIdToQr,
  prefixForQr,
  rawEncodingLandsOn,
  type Offset,
} from "@/lib/proofgrade";

export type LaserOp = {
  power?: number | null;
  speed?: number | null;
  passes?: number | null;
  focal_offset?: number | null;
  scangap?: number | null;
  uses?: string[] | null;
  outcome?: { name?: string | null; dev_id?: string | null } | null;
};

export type TubeSettings = {
  description?: string | null;
  tube_type?: string | null;
  cut_setting?: LaserOp | null;
  score_settings?: LaserOp[] | null;
  vector_engrave_settings?: LaserOp[] | null;
  bitmap_engrave_settings?: LaserOp[] | null;
};

export type Material = {
  id: string;
  title?: string | number | null;
  sku?: string | number | null;
  nominal_thickness?: number | null;
  thickness_name?: string | null;
  variety?: {
    name?: string | null;
    common_name?: string | null;
    type_name?: string | null;
    thumbnails?: string[] | null;
  } | null;
  settings?: TubeSettings[] | null;
};

export type Confidence = "verified" | "rule" | "assigned" | "none";

export type CatalogRow = {
  material: Material;
  numericId: number;
  name: string;
  family: string;
  thickness: string;
  mm: number | null;
  sku: string;
  qr: number | null;
  prefix: string | null;
  offset: Offset | null;
  confidence: Confidence;
  /** Catalog id a raw (unshifted) code for this row would be read as, if different. */
  rawLandsOn: number | null;
  thumb: string | null;
};

function isMaterial(value: unknown): value is Material {
  return !!value && typeof value === "object" && typeof (value as Material).id === "string";
}

export function loadMaterials(value: unknown): Material[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isMaterial);
}

export function numericId(material: Material): number {
  const n = Number(material.id.split(":")[1]);
  return Number.isFinite(n) ? n : -1;
}

export function materialName(material: Material): string {
  const common = material.variety?.common_name?.trim();
  if (common) return common;
  const typeName = material.variety?.type_name?.trim();
  if (typeName) return typeName;
  if (typeof material.title === "string" && material.title.trim()) return material.title.trim();
  return material.id;
}

export function familyOf(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("iphone") || n.includes("pixel") || n.includes("macbook") || n.includes("surface")) {
    return "Device";
  }
  if (n.includes("iron-on") || n.includes("iron on")) return "Iron-on";
  if (n.includes("eco")) return "Eco";
  if (n.includes("leather")) return "Leather";
  if (n.includes("veneer")) return "Veneer";
  if (n.includes("plywood")) return "Plywood";
  if (n.includes("acrylic")) return "Acrylic";
  if (
    n.includes("draftboard") ||
    n.includes("chipboard") ||
    n.includes("taskboard") ||
    n.includes("cardboard") ||
    n.includes("paper") ||
    n.includes("cardstock") ||
    n.includes("sticker")
  ) {
    return "Sheet goods";
  }
  if (n.includes("hardwood") || n.includes("softwood") || n.includes("slate") || n.includes("wood")) {
    return "Wood";
  }
  return "Other";
}

function toRow(material: Material): CatalogRow {
  const id = numericId(material);
  const name = materialName(material);
  const mapped = jsonIdToQr(id);
  const mm = typeof material.nominal_thickness === "number" ? material.nominal_thickness : null;
  return {
    material,
    numericId: id,
    name,
    family: familyOf(name),
    thickness: material.thickness_name?.trim() || "—",
    mm,
    sku: material.sku == null ? "" : String(material.sku).trim(),
    qr: mapped?.qr ?? null,
    prefix: mapped ? prefixForQr(mapped.qr) : null,
    offset: mapped?.offset ?? null,
    confidence: !mapped ? "none" : VERIFIED_IDS.has(id) ? "verified" : ASSIGNED_IDS.has(id) ? "assigned" : "rule",
    rawLandsOn: mapped ? null : rawEncodingLandsOn(id),
    thumb: material.variety?.thumbnails?.[0] ?? null,
  };
}

export const CATALOG: CatalogRow[] = loadMaterials(raw).map(toRow).sort((a, b) => a.numericId - b.numericId);

export const ROW_BY_ID = new Map(CATALOG.map((row) => [row.numericId, row]));

export type ThicknessChoice = { mm: number; label: string };

function formatMeasure(mm: number): string {
  const inches = (mm / 25.4).toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
  const millimeters = String(Math.round(mm * 1000) / 1000);
  return `${inches} in · ${millimeters} mm`;
}

/** Each real thickness in the catalog, thinnest first. */
export const THICKNESSES: ThicknessChoice[] = (() => {
  const seen = new Set<number>();
  const choices: ThicknessChoice[] = [];
  for (const row of CATALOG) {
    if (row.mm == null) continue;
    const mm = Math.round(row.mm * 1000) / 1000;
    if (seen.has(mm)) continue;
    seen.add(mm);
    choices.push({ mm, label: formatMeasure(mm) });
  }
  choices.sort((a, b) => a.mm - b.mm);
  return choices;
})();

export const FAMILIES = [
  "All",
  "Acrylic",
  "Plywood",
  "Wood",
  "Eco",
  "Leather",
  "Veneer",
  "Sheet goods",
  "Iron-on",
  "Device",
  "Other",
] as const;

export type FamilyFilter = (typeof FAMILIES)[number];

export type SortKey = "name" | "id" | "code" | "thickness";

function matchesQuery(row: CatalogRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return `${row.name} ${row.family} ${row.thickness}`.toLowerCase().includes(q);
}

function sameThickness(mm: number | null, thickness: number): boolean {
  return mm != null && Math.abs(mm - thickness) <= 0.0005;
}

/** Thicknesses still available for the selected type and search. */
export function thicknessesFor(rows: CatalogRow[], family: FamilyFilter, query: string): ThicknessChoice[] {
  const seen = new Set<number>();
  const choices: ThicknessChoice[] = [];
  for (const row of rows) {
    if (family !== "All" && row.family !== family) continue;
    if (!matchesQuery(row, query)) continue;
    if (row.mm == null) continue;
    const mm = Math.round(row.mm * 1000) / 1000;
    if (seen.has(mm)) continue;
    seen.add(mm);
    choices.push({ mm, label: formatMeasure(mm) });
  }
  choices.sort((a, b) => a.mm - b.mm);
  return choices;
}

/** Types still available for the selected thickness and search. All stays first. */
export function familiesFor(rows: CatalogRow[], thickness: number | null, query: string): FamilyFilter[] {
  const present = new Set<string>();
  for (const row of rows) {
    if (thickness != null && !sameThickness(row.mm, thickness)) continue;
    if (!matchesQuery(row, query)) continue;
    present.add(row.family);
  }
  return FAMILIES.filter((item) => item === "All" || present.has(item));
}

export function filterCatalog(
  rows: CatalogRow[],
  query: string,
  family: FamilyFilter,
  thickness: number | null,
  sort: SortKey,
): CatalogRow[] {
  const filtered = rows.filter((row) => {
    if (family !== "All" && row.family !== family) return false;
    if (thickness != null && !sameThickness(row.mm, thickness)) return false;
    return matchesQuery(row, query);
  });
  filtered.sort((a, b) => {
    if (sort === "id") return a.numericId - b.numericId;
    if (sort === "code") {
      if (a.qr == null && b.qr == null) return a.numericId - b.numericId;
      if (a.qr == null) return 1;
      if (b.qr == null) return -1;
      return a.qr - b.qr || a.numericId - b.numericId;
    }
    if (sort === "thickness") {
      const am = a.mm ?? Number.POSITIVE_INFINITY;
      const bm = b.mm ?? Number.POSITIVE_INFINITY;
      return am - bm || a.name.localeCompare(b.name);
    }
    return a.name.localeCompare(b.name) || a.numericId - b.numericId;
  });
  return filtered;
}

export function tubeSettings(row: CatalogRow, tube: string): TubeSettings | null {
  return row.material.settings?.find((s) => s.tube_type === tube) ?? null;
}

export function tubeTypes(row: CatalogRow): string[] {
  const types = (row.material.settings ?? []).map((s) => s.tube_type).filter((t): t is string => !!t);
  return [...new Set(types)];
}
