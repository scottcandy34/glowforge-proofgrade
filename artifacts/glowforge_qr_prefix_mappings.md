# Glowforge Proofgrade QR prefixes

Payload format, confirmed on every code below:

```
Glowforge:<version>:<TT><S>
```

- `version` is `A` (early, 5 characters), `B`, or `C` (current). The material prefix did not change between B and C on the sheets that were scanned both ways.
- `TT` is a **2-character material type**. A third character follows it and is `A` on every B and C code found.
- `S` is a **3-character per-sheet serial**. Same material, different physical sheet → same `TTA`, different serial. The QR does not contain speed or power. The app looks the whole string up in Glowforge's cloud.

Alphabet, base 62, `A=0 … Z=25`, `a=26 … z=51`, `0=52 … 9=61`:

```
value = index(char0)*62 + index(char1)
prefix = alphabet[value // 62] + alphabet[value % 62] + "A"
```

For the original catalog this value **is** the numeric id in the materials JSON (`Glowforge:31` → `AfA`). That holds for every sheet checked with JSON id ≤ 47. It does **not** hold for the Light plywoods or the Eco acrylics that were actually decoded: those QR values are 2, then 4, below the JSON id. Do not apply the formula blindly past id 47.

Case matters. `AvA` (thick draftboard, id 47) is not `AVA` (the formula's code for id 21, cardboard). `AfA` (medium black acrylic) is not `AFA` (frosted acrylic).

## Decoded from a photo, a phone scan, or a posted code

13 material types. No public list covers the rest of the 113 JSON rows. Glowforge never published one, and almost nobody posts a scan next to the printed name.

| Prefix | QR value | JSON id | Material | Evidence | Example payload |
|---|---:|---:|---|---|---|
| `AKA` | 10 | 10 | Walnut Hardwood | photo: Medium Walnut Hardwood label, colormecrafty.net | `Glowforge:C:AKAASHH` |
| `AYA` | 24 | 24 | Basswood Hardwood | photo: Basswood Hardwood / Medium Basswood Hardwood labels | `Glowforge:C:AYAANtf` |
| `AaA` | 26 | 26 | Medium Cherry Plywood | forum: Medium Cherry Plywood, Glowforge forum | `Glowforge:B:AaAAACW` |
| `AfA` | 31 | 31 | Medium Black Acrylic | user: Medium Black Acrylic, user scans | `Glowforge:C:AfAAC7M` |
| `AiA` | 34 | 34 | Medium Draftboard | user: Medium Draftboard, user scans | `Glowforge:C:AiACDTn` |
| `ApA` | 41 | 41 | Medium Clear Blue Acrylic | forum: Clear / fluorescent blue acrylic, Glowforge forum | `Glowforge:B:ApAAAR8` |
| `AvA` | 47 | 47 | Thick Draftboard | user: Thick Draftboard, user scans | `Glowforge:C:AvAAKJg` |
| `BnA` | 101 | 103 | Light Basswood Plywood | photo: Light Basswood Plywood label | `Glowforge:C:BnAAEKg` |
| `BoA` | 102 | 104 | Light Cherry Plywood | photo: Light Cherry Plywood label | `Glowforge:C:BoAAAC2` |
| `BpA` | 103 | 105 | Light Maple Plywood | photo: Light Maple Plywood label | `Glowforge:C:BpAABBK` |
| `BqA` | 104 | 106 | Light Walnut Plywood | photo: Light Walnut Plywood label | `Glowforge:C:BqAAAoU` |
| `CTA` | 143 | 147 | Eco Thin Teal Acrylic | photo: Eco Thin Teal Acrylic label | `Glowforge:C:CTAADSN` |
| `CVA` | 145 | 149 | Eco Medium Black Acrylic | user: Eco Medium Black Acrylic, user scans | `Glowforge:C:CVAAAWS` |

JSON id minus QR value is 0 on the first seven, **+2** on all four Light plywoods (ids 103–106), and **+4** on the two Eco acrylics (ids 147 and 149). The two non-sheet presets sitting just in front of the Light plywoods in this JSON are id 100 Copy Paper and id 101 Corrugated Cardboard 5/32". That is the right count to explain the +2, but it is an inference, not another scan. The extra +2 before the Eco colors is not identified.

## Same formula, not photographed (JSON id ≤ 47)

Every id in this range that *was* checked matched `base62(id)+"A"`. These are the remaining rows at or below 47. Treat them as the best prediction, not as scanned codes.

| JSON id | Predicted prefix | Material |
|---:|---|---|
| 1 | `ABA` | Clear Acrylic, 1/8" |
| 2 | `ACA` | Thick Clear Acrylic |
| 3 | `ADA` | Thick Cherry Plywood |
| 4 | `AEA` | Thick Walnut Plywood |
| 5 | `AFA` | Medium Frosted Acrylic |
| 6 | `AGA` | Medium Teal Acrylic |
| 7 | `AHA` | Chipboard |
| 8 | `AIA` | Cherry Hardwood |
| 9 | `AJA` | Maple Hardwood |
| 11 | `ALA` | Thin Draftboard |
| 12 | `AMA` | Medium Maple Plywood |
| 13 | `ANA` | Thick Maple Plywood |
| 14 | `AOA` | Medium Natural Leather |
| 15 | `APA` | Thick Natural Leather |
| 16 | `AQA` | Maple Veneer |
| 17 | `ARA` | Walnut Veneer |
| 18 | `ASA` | Cherry Veneer |
| 19 | `ATA` | Medium Blue Acrylic |
| 20 | `AUA` | Medium Lavender Acrylic |
| 21 | `AVA` | Corrugated Cardboard, 1/8" |
| 25 | `AZA` | Red Oak Hardwood |
| 27 | `AbA` | Medium Walnut Plywood |
| 28 | `AcA` | Poplar Hardwood |
| 29 | `AdA` | Medium Aspen Hardwood |
| 30 | `AeA` | Medium Ash Hardwood |
| 32 | `AgA` | Medium White Acrylic |
| 33 | `AhA` | Medium Purple Acrylic |
| 35 | `AjA` | Thin Natural Leather |
| 36 | `AkA` | Medium Red Acrylic |
| 37 | `AlA` | Medium Green Acrylic |
| 38 | `AmA` | Medium Orange Acrylic |
| 40 | `AoA` | Medium Yellow Acrylic |
| 42 | `AqA` | Medium Fluorescent Green Acrylic |
| 44 | `AsA` | Medium Fluorescent Pink Acrylic |

## Do not trust the formula here

JSON id > 47, excluding the 13 verified rows above. `prefix_if_json_id` is what the early-catalog formula would print. The photographed Light and Eco sheets prove that column is already wrong by the time the id reaches 103.

| JSON id | Formula prefix (unverified) | Material |
|---:|---|---|
| 48 | `AwA` | Medium Basswood Plywood |
| 49 | `AxA` | Thick Basswood Plywood |
| 51 | `AzA` | Thick Black Acrylic |
| 52 | `A0A` | Thick Green Acrylic |
| 53 | `A1A` | Thick White Acrylic |
| 54 | `A2A` | Thick Blue Acrylic |
| 55 | `A3A` | Thick Red Acrylic |
| 56 | `A4A` | Thick Orange Acrylic |
| 57 | `A5A` | Thick Yellow Acrylic |
| 58 | `A6A` | Thick Purple Acrylic |
| 59 | `A7A` | Thick Teal Acrylic |
| 60 | `A8A` | MacBook Pro® |
| 61 | `A9A` | Medium Glass Green Acrylic |
| 62 | `BAA` | Thick Fluorescent Green Acrylic |
| 63 | `BBA` | Thick Fluorescent Pink Acrylic |
| 64 | `BCA` | Medium Glass Green Acrylic |
| 81 | `BTA` | Silver iPhone 7® |
| 82 | `BUA` | Gold iPhone 7® |
| 84 | `BWA` | Black iPhone 7® |
| 85 | `BXA` | Rose Gold iPhone 7® |
| 86 | `BYA` | Just Black Google Pixel 2® |
| 87 | `BZA` | Kinda Blue Google Pixel 2® |
| 88 | `BaA` | Clearly White Google Pixel 2® |
| 89 | `BbA` | Magnesium Microsoft Surface 2® |
| 90 | `BcA` | Dark Titanium Microsoft Surface RT® |
| 92 | `BeA` | Medium Pine Softwood |
| 93 | `BfA` | Medium Pine Softwood |
| 100 | `BmA` | Copy Paper |
| 101 | `BnA` | Corrugated Cardboard, 5/32" |
| 123 | `B9A` | Thin Clear Red Acrylic |
| 124 | `CAA` | Thin White Acrylic |
| 125 | `CBA` | Thin Black Acrylic |
| 127 | `CDA` | Medium Ebony Black Leather |
| 128 | `CEA` | Medium Espresso Brown Leather |
| 130 | `CGA` | Thick Ebony Black Leather |
| 131 | `CHA` | Thick Espresso Brown Leather |
| 133 | `CJA` | Thin White Taskboard |
| 135 | `CLA` | Medium White Taskboard |
| 139 | `CPA` | Eco Medium White Acrylic |
| 140 | `CQA` | Eco Medium Clear Acrylic |
| 141 | `CRA` | Eco Thick Clear Acrylic |
| 142 | `CSA` | Eco Medium Blue Acrylic |
| 143 | `CTA` | Eco Thin Black Acrylic |
| 144 | `CUA` | Eco Thin Red Acrylic |
| 145 | `CVA` | Eco Thin Green Acrylic |
| 146 | `CWA` | Eco Thin Orange Acrylic |
| 148 | `CYA` | Eco Thin Purple Acrylic |
| 152 | `CcA` | Eco Medium Orange Acrylic |
| 172 | `CwA` | Eco Red Iron-On |
| 173 | `CxA` | Eco Black Iron-On |
| 174 | `CyA` | Eco Blue Iron-On |
| 175 | `CzA` | Eco Green Iron-on |
| 178 | `C2A` | Eco White Iron-On |
| 190 | `DEA` | Eco Shimmer Titanium Iron On |
| 191 | `DFA` | Eco Shimmer Gold Iron On |
| 192 | `DGA` | Eco Shimmer Pink Iron-On |
| 193 | `DHA` | Eco Pastel Pink Iron-On |
| 194 | `DIA` | Eco Pastel Blue Iron-On |
| 195 | `DJA` | Eco Pastel Beige Iron-On |
| 199 | `DNA` | Medium Matte Black Acrylic |
| 200 | `DOA` | 80 lb Cardstock |
| 201 | `DPA` | Eco Medium Yellow Acrylic |
| 202 | `DQA` | Eco Medium Glass Green Acrylic |
| 204 | `DSA` | Eco Thick Black Acrylic |
| 205 | `DTA` | Sticker Paper |
| 99999 | `(id does not fit in 2 base62 chars)` | Slate |

Id 99999 (Slate) cannot be a 3-character prefix. 62² is 3844.

Phone and laptop rows (MacBook, iPhone 7, Pixel, Surface) share this id space in the app, but they are engrave targets, not Proofgrade sheet stickers.

## Sources

- User scans: medium black acrylic, medium draftboard, thick draftboard, eco medium black acrylic.
- Forum post [Non-proofgrade settings memory backdoor?](https://community.glowforge.com/t/non-proofgrade-settings-memory-backdoor/21509): `Glowforge:B:AaAAACW`, `AaAABCU` (medium cherry plywood, identical settings), `Glowforge:B:ApAAAR8` (fluorescent / clear blue acrylic). Same thread: the 6 characters are a database id, not the cut settings.
- Photos decoded with zxing: [Whiskey & Whit, Glowforge Aura](https://whiskeyandwhit.com/glowforgeaura/) (basswood hardwood `AYA`, eco thin teal `CTA`, light cherry `BoA`, light maple `BpA`, light basswood `BnA`); [Color Me Crafty review](https://colormecrafty.net/glowforge-aura-review/) (walnut hardwood `AKA`, basswood hardwood `AYA`, light basswood `BnA`); [Country Chic Cottage Aura guide](https://www.thecountrychiccottage.net/glowforge-aura/) (light maple `BpA`, light walnut `BqA`).

Full machine-readable copy: `glowforge_qr_prefix_mappings.csv`.
