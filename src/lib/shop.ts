import type { CatalogRow } from "@/lib/catalog";

const SHOP = "https://shop.glowforge.com";

const PRODUCTS: { handle: string; words: string[] }[] = [
  { handle: "unmasked-draftboard™", words: ["unmasked", "draftboard"] },
  { handle: "fluorescent-pink-acrylic-cast-translucent-glossy", words: ["fluorescent", "pink", "acrylic"] },
  { handle: "fluorescent-green-acrylic-cast-translucent-glossy", words: ["fluorescent", "green", "acrylic"] },
  { handle: "glass-green-acrylic-cast-transparent-glossy", words: ["glass", "green", "acrylic"] },
  { handle: "clear-blue-acrylic-cast-translucent-glossy", words: ["clear", "blue", "acrylic"] },
  { handle: "frosted-acrylic-cast-translucent-glossy", words: ["frosted", "acrylic"] },
  { handle: "black-acrylic-cast-matte-glossy", words: ["matte", "black", "acrylic"] },
  { handle: "black-acrylic-cast-opaque-glossy", words: ["black", "acrylic"] },
  { handle: "white-acrylic-cast-opaque-glossy", words: ["white", "acrylic"] },
  { handle: "red-acrylic-cast-opaque-glossy", words: ["red", "acrylic"] },
  { handle: "blue-acrylic-cast-opaque-glossy", words: ["blue", "acrylic"] },
  { handle: "teal-acrylic-cast-opaque-glossy", words: ["teal", "acrylic"] },
  { handle: "green-acrylic-cast-opaque-glossy", words: ["green", "acrylic"] },
  { handle: "purple-acrylic-cast-opaque-glossy", words: ["purple", "acrylic"] },
  { handle: "orange-acrylic-cast-opaque-glossy", words: ["orange", "acrylic"] },
  { handle: "yellow-acrylic-cast-opaque-glossy", words: ["yellow", "acrylic"] },
  { handle: "clear-acrylic-cast-transparent-glossy", words: ["clear", "acrylic"] },
  { handle: "maple-plywood-finished", words: ["maple", "plywood"] },
  { handle: "cherry-plywood-finished", words: ["cherry", "plywood"] },
  { handle: "walnut-plywood-finished", words: ["walnut", "plywood"] },
  { handle: "basswood-plywood", words: ["basswood", "plywood"] },
  { handle: "maple-hardwood-finished", words: ["maple", "hardwood"] },
  { handle: "cherry-hardwood-finished", words: ["cherry", "hardwood"] },
  { handle: "walnut-hardwood-finished", words: ["walnut", "hardwood"] },
  { handle: "basswood-hardwood-finished", words: ["basswood", "hardwood"] },
  { handle: "poplar-hardwood-finished", words: ["poplar", "hardwood"] },
  { handle: "red-oak-hardwood-finished", words: ["red", "oak", "hardwood"] },
  { handle: "ash-hardwood-finished", words: ["ash", "hardwood"] },
  { handle: "maple-veneer-with-3m-tape-finished", words: ["maple", "veneer"] },
  { handle: "cherry-veneer-with-3m-tape-finished", words: ["cherry", "veneer"] },
  { handle: "walnut-veneer-with-3m-tape-finished", words: ["walnut", "veneer"] },
  { handle: "natural-leather", words: ["leather"] },
  { handle: "draftboard", words: ["draftboard"] },
  { handle: "eco-iron-on-black", words: ["black", "iron-on"] },
  { handle: "eco-iron-on-white", words: ["white", "iron-on"] },
  { handle: "eco-iron-on-mix-shimmer-titanium-gold-pink", words: ["shimmer", "iron-on"] },
  { handle: "eco-iron-on-mix-pastel-pink-blue-beige", words: ["pastel", "iron-on"] },
  { handle: "eco-iron-on-mix-red-blue-green", words: ["mix", "iron-on"] },
];

function productHandle(name: string): string | null {
  const iron = ironOnHandle(name);
  if (iron) return iron;
  const text = name.toLowerCase().replaceAll("iron on", "iron-on");
  let best: { handle: string; score: number } | null = null;
  for (const product of PRODUCTS) {
    if (!product.words.every((word) => text.includes(word))) continue;
    if (!best || product.words.length > best.score) best = { handle: product.handle, score: product.words.length };
  }
  return best?.handle ?? null;
}

function ironOnHandle(name: string): string | null {
  const text = name.toLowerCase().replaceAll("iron on", "iron-on");
  if (!text.includes("iron-on")) return null;
  if (text.includes("shimmer") || text.includes("titanium") || text.includes("rose") || text.includes("gold")) {
    return "eco-iron-on-mix-shimmer-titanium-gold-pink";
  }
  if (text.includes("pastel") || text.includes("beige")) return "eco-iron-on-mix-pastel-pink-blue-beige";
  if (text.includes("black")) return "eco-iron-on-black";
  if (text.includes("white")) return "eco-iron-on-white";
  if (text.includes("red") || text.includes("blue") || text.includes("green")) {
    return "eco-iron-on-mix-red-blue-green";
  }
  return "eco-iron-on-mix-red-blue-green";
}

function ecoAcrylic(row: CatalogRow): boolean {
  const text = `${row.name} ${row.thickness}`.toLowerCase();
  return text.includes("eco") && !text.includes("iron");
}

/** One in-stock sheet of each thickness, preferring the 12×20 in size. */
const VARIANTS: Record<string, Partial<Record<string, number>>> = {
  "unmasked-draftboard™": { "medium-115": 68145049633137 },
  draftboard: { medium: 20442192248930, thick: 39434532126818 },
  "fluorescent-pink-acrylic-cast-translucent-glossy": { medium: 39434531962978, thick: 39434531995746 },
  "fluorescent-green-acrylic-cast-translucent-glossy": { medium: 39434532061282, thick: 39434532094050 },
  "glass-green-acrylic-cast-transparent-glossy": { medium: 39434531831906, thick: 39434531864674 },
  "clear-blue-acrylic-cast-translucent-glossy": { medium: 39434530586722 },
  "frosted-acrylic-cast-translucent-glossy": { medium: 62539285397873 },
  "black-acrylic-cast-matte-glossy": { medium: 31549579067490 },
  "black-acrylic-cast-opaque-glossy": { medium: 39434532618338, thick: 39434532716642, "eco-thin": 40406241116258 },
  "white-acrylic-cast-opaque-glossy": { medium: 39434530783330, thick: 39434530816098 },
  "red-acrylic-cast-opaque-glossy": { medium: 39434531176546, thick: 39434531209314, "eco-thin": 40406241443938 },
  "blue-acrylic-cast-opaque-glossy": { medium: 39434532552802, thick: 39434532585570 },
  "teal-acrylic-cast-opaque-glossy": { medium: 39434530979938, thick: 39434531078242, "eco-thin": 40406241771618 },
  "green-acrylic-cast-opaque-glossy": { medium: 39434531733602, thick: 39434531766370, "eco-thin": 40406242033762 },
  "purple-acrylic-cast-opaque-glossy": { medium: 39434531274850, thick: 39434531307618, "eco-thin": 40406242197602 },
  "orange-acrylic-cast-opaque-glossy": { medium: 39434531373154, thick: 39434531405922, "eco-thin": 40406241902690 },
  "yellow-acrylic-cast-opaque-glossy": { medium: 39434530652258, thick: 39434530685026 },
  "clear-acrylic-cast-transparent-glossy": { medium: 39434532290658, thick: 39434532323426 },
  "maple-plywood-finished": { light: 39451629191266, medium: 20442193559650, thick: 39434531569762 },
  "cherry-plywood-finished": { light: 39451630010466, medium: 20442191528034, thick: 39434532421730 },
  "walnut-plywood-finished": { light: 39451632173154, medium: 20442194739298, thick: 39434530881634 },
  "basswood-plywood": { light: 39451626274914, thick: 39434532749410 },
  "maple-hardwood-finished": { medium: 20442193264738 },
  "cherry-hardwood-finished": { medium: 20442191429730 },
  "walnut-hardwood-finished": { medium: 20442194640994 },
  "basswood-hardwood-finished": { medium: 20442190938210 },
  "poplar-hardwood-finished": { medium: 20442193690722 },
  "red-oak-hardwood-finished": { medium: 20442194313314 },
  "ash-hardwood-finished": { medium: 20442190872674 },
  "natural-leather": { thin: 40406240624738, medium: 39434531504226, thick: 63554641461617 },
};

function thicknessKey(row: CatalogRow): string | null {
  const text = row.thickness.trim().toLowerCase();
  const name = row.name.toLowerCase();
  if (name.includes("unmasked")) return "medium-115";
  if (text === "light") return "light";
  if (text === "thick" || text === "eco thick") return "thick";
  if (text === "eco thin" || (text === "thin" && name.includes("acrylic"))) return "eco-thin";
  if (text === "thin") return "thin";
  if (text.startsWith("medium") || text.startsWith("eco medium")) return "medium";
  return null;
}

function variantFor(row: CatalogRow, handle: string): number | undefined {
  const variants = VARIANTS[handle];
  if (!variants) return undefined;
  const key = thicknessKey(row);
  // The shop's only eco acrylic choice is "Eco Thin", sold on some colors.
  if (ecoAcrylic(row) && variants["eco-thin"]) return variants["eco-thin"];
  return key ? variants[key] : undefined;
}

/** Shop product for this material, or null when Glowforge does not sell it. */
export function shopUrl(row: CatalogRow): string | null {
  const handle = productHandle(row.name);
  if (!handle) return null;
  const variant = variantFor(row, handle);
  const path = `${SHOP}/products/${encodeURIComponent(handle)}`;
  return variant ? `${path}?variant=${variant}` : path;
}
