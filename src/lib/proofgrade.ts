/** Proofgrade sticker codec.

A current sticker reads `Glowforge:<B|C>:<pair><A><serial>`.

`pair` is base 62 (A–Z, a–z, 0–9). The following `A` is padding on every
B and C code that was decoded. `serial` is four characters and changes per
physical sheet. The oldest version-A stickers are five characters with no pad.

The base-62 number is the catalog id, then shifted where Glowforge inserted
rows into this JSON:

- sticker ≤ 99 → catalog id = sticker          (+0)
- sticker 100–133 → catalog id = sticker + 2   (+2)
- sticker ≥ 134 → catalog id = sticker + 4     (+4)

That hits every sticker actually read: light plywoods are +2, and eco medium
white (`CLA`), eco thin teal, and eco medium black are +4. Everything checked
at id 47 or below is +0.

Ids 100 and 101 are not produced by those bands: 100 would be sent to missing
id 102, and 101 is already Light Basswood. Slate's id, 99999, does not fit in
two characters. Those three catalog rows take the free sticker numbers below.
*/
export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const PAIR_SPAN = 62 * 62;

/** Sticker numbers the bands do not give to any catalog row, reused so every JSON material has a code. */
export const ASSIGNED: { qr: number; jsonId: number; note: string }[] = [
  {
    qr: 100,
    jsonId: 100,
    note: "Copy paper takes sticker 100. The +2 band would have pointed that number at id 102, which is not in the catalog.",
  },
  {
    qr: 105,
    jsonId: 101,
    note: "5/32 in. cardboard cannot take sticker 101, because that number is Light Basswood. 105 was the next free number.",
  },
  {
    qr: 3843,
    jsonId: 99999,
    note: "Slate's id is 99999, which does not fit in two characters. It takes the last code, 99A.",
  },
];

const ASSIGNED_BY_QR = new Map(ASSIGNED.map((row) => [row.qr, row]));
const ASSIGNED_BY_ID = new Map(ASSIGNED.map((row) => [row.jsonId, row]));

export const ASSIGNED_IDS = new Set(ASSIGNED.map((row) => row.jsonId));

export type Offset = 0 | 2 | 4;

export type ParsedCode = {
  raw: string;
  version: string | null;
  typePair: string;
  pad: string | null;
  serial: string;
  prefix: string;
  qrValue: number;
  jsonId: number;
  offset: Offset;
};

export type ParseResult = { ok: true; code: ParsedCode } | { ok: false; message: string };

/** Stickers whose prefix was read from a photo, a phone scan, or a posted code. */
export const VERIFIED_IDS = new Set([10, 24, 26, 31, 34, 41, 47, 51, 103, 104, 105, 106, 139, 147, 149]);

export function qrValueToJsonId(qr: number): { jsonId: number; offset: Offset } {
  const assigned = ASSIGNED_BY_QR.get(qr);
  if (assigned) return { jsonId: assigned.jsonId, offset: 0 };
  if (qr <= 99) return { jsonId: qr, offset: 0 };
  if (qr <= 133) return { jsonId: qr + 2, offset: 2 };
  return { jsonId: qr + 4, offset: 4 };
}

/** Inverse of {@link qrValueToJsonId}. Null when the id does not fit in two characters and was not assigned a free code. */
export function jsonIdToQr(jsonId: number): { qr: number; offset: Offset } | null {
  if (!Number.isInteger(jsonId) || jsonId < 0) return null;
  const assigned = ASSIGNED_BY_ID.get(jsonId);
  if (assigned) return { qr: assigned.qr, offset: 0 };
  let qr: number;
  let offset: Offset;
  if (jsonId <= 99) {
    qr = jsonId;
    offset = 0;
  } else if (jsonId >= 102 && jsonId <= 135) {
    qr = jsonId - 2;
    offset = 2;
  } else if (jsonId >= 139) {
    qr = jsonId - 4;
    offset = 4;
  } else {
    return null;
  }
  if (qr < 0 || qr >= PAIR_SPAN) return null;
  if (ASSIGNED_BY_QR.has(qr)) return null;
  return { qr, offset };
}

export function encodePair(value: number): string | null {
  if (!Number.isInteger(value) || value < 0 || value >= PAIR_SPAN) return null;
  const hi = Math.floor(value / 62);
  const lo = value % 62;
  return ALPHABET[hi]! + ALPHABET[lo]!;
}

export function decodePair(pair: string): number | null {
  if (pair.length !== 2) return null;
  const hi = ALPHABET.indexOf(pair[0]!);
  const lo = ALPHABET.indexOf(pair[1]!);
  if (hi < 0 || lo < 0) return null;
  return hi * 62 + lo;
}

export function prefixForQr(qr: number): string | null {
  const pair = encodePair(qr);
  return pair ? pair + "A" : null;
}

export function prefixForJsonId(jsonId: number): string | null {
  const mapped = jsonIdToQr(jsonId);
  if (!mapped) return null;
  return prefixForQr(mapped.qr);
}

export function randomSerial(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]!).join("");
}

export function buildPayload(version: "B" | "C", jsonId: number, serial: string): string | null {
  const prefix = prefixForJsonId(jsonId);
  if (!prefix) return null;
  const body = serial.length === 4 && [...serial].every((ch) => ALPHABET.includes(ch) || ch === "/") ? serial : "AAAA";
  return `Glowforge:${version}:${prefix}${body}`;
}

/** What a raw (unshifted) encoding of this id would be read as. */
export function rawEncodingLandsOn(jsonId: number): number | null {
  if (jsonId < 0 || jsonId >= PAIR_SPAN) return null;
  const landed = qrValueToJsonId(jsonId).jsonId;
  return landed === jsonId ? null : landed;
}

export function explain(code: ParsedCode): string {
  const hi = ALPHABET.indexOf(code.typePair[0]!);
  const lo = ALPHABET.indexOf(code.typePair[1]!);
  const math = `${code.typePair[0]} is ${hi}, ${code.typePair[1]} is ${lo}. ${hi}×62 + ${lo} = ${code.qrValue}.`;
  const assigned = ASSIGNED_BY_QR.get(code.qrValue);
  if (assigned) return `${math} ${assigned.note}`;
  const shift = code.offset === 0 ? "add 0" : `add ${code.offset}`;
  return `${math} ${shift} → catalog ${code.jsonId}.`;
}

export function parseProofgrade(input: string): ParseResult {
  const trimmed = input.trim().replace(/\s+/g, "");
  if (!trimmed) return { ok: false, message: "Paste a sticker code, or scan one." };

  let version: string | null = null;
  let body = trimmed;
  const full = trimmed.match(/^glowforge:([A-Za-z]):([A-Za-z0-9/]+)$/i);
  if (full) {
    version = full[1]!.toUpperCase();
    body = full[2]!;
  } else if (!/^[A-Za-z0-9/]+$/.test(trimmed)) {
    return {
      ok: false,
      message: "That text is not a Proofgrade sticker. Expected Glowforge:C: plus the sticker characters.",
    };
  }

  let typePair: string;
  let pad: string | null;
  let serial: string;
  if (body.length === 7 || body.length === 6) {
    typePair = body.slice(0, 2);
    pad = body[2]!;
    serial = body.slice(3);
  } else if (body.length === 5) {
    typePair = body.slice(0, 2);
    pad = null;
    serial = body.slice(2);
  } else {
    return {
      ok: false,
      message: "The code after the version should be 7 characters (or 5 on the oldest stickers).",
    };
  }

  const qrValue = decodePair(typePair);
  if (qrValue == null) {
    return { ok: false, message: "The material code uses letters and digits only, and case matters." };
  }

  const { jsonId, offset } = qrValueToJsonId(qrValue);
  const prefix = pad == null ? typePair : typePair + pad;
  return {
    ok: true,
    code: {
      raw: version ? `Glowforge:${version}:${body}` : body,
      version,
      typePair,
      pad,
      serial,
      prefix,
      qrValue,
      jsonId,
      offset,
    },
  };
}
