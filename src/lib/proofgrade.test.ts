import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { buildPayload, jsonIdToQr, parseProofgrade, prefixForJsonId, qrValueToJsonId } from "./proofgrade.ts";

const verified: { payload: string; jsonId: number; offset: 0 | 2 | 4 }[] = [
  { payload: "Glowforge:C:AKAASHH", jsonId: 10, offset: 0 },
  { payload: "Glowforge:C:AYAANtf", jsonId: 24, offset: 0 },
  { payload: "Glowforge:B:AaAAACW", jsonId: 26, offset: 0 },
  { payload: "Glowforge:C:AfAAC7M", jsonId: 31, offset: 0 },
  { payload: "Glowforge:C:AiACDTn", jsonId: 34, offset: 0 },
  { payload: "Glowforge:B:ApAAAR8", jsonId: 41, offset: 0 },
  { payload: "Glowforge:C:AvAAKJg", jsonId: 47, offset: 0 },
  { payload: "Glowforge:C:BnAAEKg", jsonId: 103, offset: 2 },
  { payload: "Glowforge:C:BoAAAC2", jsonId: 104, offset: 2 },
  { payload: "Glowforge:C:BpAABBK", jsonId: 105, offset: 2 },
  { payload: "Glowforge:C:BqAAAoU", jsonId: 106, offset: 2 },
  { payload: "Glowforge:C:AzAAA/w", jsonId: 51, offset: 0 },
  { payload: "Glowforge:C:CLAACuL", jsonId: 139, offset: 4 },
  { payload: "Glowforge:C:CTAADSN", jsonId: 147, offset: 4 },
  { payload: "Glowforge:C:CVAAAWS", jsonId: 149, offset: 4 },
];

test("decoded stickers land on the photographed catalog ids", () => {
  for (const row of verified) {
    const parsed = parseProofgrade(row.payload);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) continue;
    assert.equal(parsed.code.jsonId, row.jsonId, row.payload);
    assert.equal(parsed.code.offset, row.offset, row.payload);
    assert.equal(prefixForJsonId(row.jsonId), parsed.code.typePair + "A");
  }
});

test("B and C do not change the material", () => {
  const b = parseProofgrade("Glowforge:B:AaAAACW");
  const c = parseProofgrade("Glowforge:C:AaAAAZZ");
  assert.equal(b.ok && c.ok && b.code.jsonId === c.code.jsonId, true);
});

test("case distinguishes AVA from AvA", () => {
  const thick = parseProofgrade("Glowforge:C:AvAAAAA");
  const card = parseProofgrade("Glowforge:C:AVAAAAA");
  assert.equal(thick.ok && thick.code.jsonId, 47);
  assert.equal(card.ok && card.code.jsonId, 21);
});

test("generated codes round-trip and never collide", () => {
  const materials = JSON.parse(
    fs.readFileSync(new URL("../data/materials.json", import.meta.url), "utf8"),
  ) as { id: string }[];
  const seen = new Map<string, number>();
  for (const material of materials) {
    const id = Number(material.id.split(":")[1]);
    const mapped = jsonIdToQr(id);
    if (!mapped) {
      assert.equal(prefixForJsonId(id), null);
      continue;
    }
    assert.deepEqual(qrValueToJsonId(mapped.qr), { jsonId: id, offset: mapped.offset });
    const prefix = prefixForJsonId(id);
    assert.ok(prefix && prefix.endsWith("A") && prefix.length === 3);
    assert.equal(seen.has(prefix!), false, `collision ${prefix} on ${id} and ${seen.get(prefix!)}`);
    seen.set(prefix!, id);
    const payload = buildPayload("C", id, "AAAA");
    const parsed = parseProofgrade(payload!);
    assert.equal(parsed.ok && parsed.code.jsonId, id);
  }
  assert.equal(seen.size, materials.length);
  assert.deepEqual(jsonIdToQr(100), { qr: 100, offset: 0 });
  assert.deepEqual(jsonIdToQr(101), { qr: 105, offset: 0 });
  assert.deepEqual(jsonIdToQr(99999), { qr: 3843, offset: 0 });
});
