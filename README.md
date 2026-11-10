# Proofgrade Codes

Scan a Glowforge Proofgrade sticker, or pick a material and make a code for it.

![Scan tab: camera, photo upload, and a pasted code](docs/scan.png)

## What it does

- Scan a sticker with the camera, or upload a photo of one.
- Paste a code if you already have it. Case matters.
- Browse the catalog. Filter by type and thickness, sort, and page 25 at a time.
- Make a code for a material. Copy it, download a PNG, or print it at 1.35 in (34 mm), the size of the code on the sheet.
- Open laser settings for cut, score, vector, and photo when the catalog has them.

![Materials list, filtered and paged](docs/materials.png)

![A material with its code, ready to copy, download, or print](docs/material.png)

On a phone the scan controls stay in reach.

![Scan tab on a phone](docs/scan-phone.png)

The catalog is the Glowforge materials list bundled with the app (113 entries).

## Run it

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080).
