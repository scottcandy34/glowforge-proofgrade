# Almost Complete Database of Matching 3-Character Prefixes / Codes

## Overview
The most comprehensive existing resource is the **3char dataset** on Hugging Face by Brenner Cruvinel:

- **URL**: https://huggingface.co/datasets/brennercruvinel/3char
- **Pipeline**: https://github.com/brennercruvinel/3char-pipeline
- **Scale**: ~58–64 code systems, 750,000–800,000+ codes
- **Coverage**: Biology (amino acids, codons), computing (mnemonics, extensions, FourCC, HTTP), finance (currencies, tickers), language (ISO 639, BCP 47), transport (IATA airports, UN/LOCODE), writing/time (constellations, timezones), and more.
- **Key feature**: Tracks codes that appear in two or more systems (thousands of shared strings).

This is the closest thing to a near-complete, unified database of short fixed-width identifiers.

## Major Pure 3-Character Systems

| System | Authority | Pattern | Approx. Count | Example | Notes |
|--------|-----------|---------|---------------|---------|-------|
| IATA Airport | IATA | `^[A-Z]{3}$` | 9,000+ | JFK | Passenger-facing |
| ISO 4217 Currency | ISO/SIX | `^[A-Z]{3}$` | ~180 | USD | Often country + unit initial |
| ISO 639-2/3 Language | ISO/SIL | `^[a-z]{3}$` | 8,000+ | eng | Lowercase convention |
| Amino Acid 3-letter | IUPAC | `^[A-Z][a-z]{2}$` | 20 | Ala | Standard 20 |
| ICAO Airline | ICAO | `^[A-Z]{3}$` | 5,000+ | AAL | Airline designators |
| IAU Constellations | IAU | `^[A-Z]{3}$` | 88 | Ori | Orion, etc. |
| ISO 3166-1 alpha-3 | ISO | `^[A-Z]{3}$` | 249 | USA | Country codes |
| HTTP Status | IETF | `^[0-9]{3}$` | ~60 | 200 | Numeric |

## Notable Multi-System Collisions / Matches

| Code | Appearances | Notes |
|------|-------------|-------|
| CAR | IATA Airport (Caribou, ME); ISO 3166 (Central African Republic); chemistry/biology terms | Classic ambiguity |
| CAD | ISO 4217 (Canadian Dollar); IATA Airport (Cadillac, MI) | Currency vs airport |
| USD / EUR | Primarily currencies | Clear in context |
| USA | ISO 3166 alpha-3 | Country |
| ENG | Language (English) | |
| ALA | Amino acid (Alanine) | |
| JFK / NYC | Airport vs metro city code | Common in travel data |
| ORI | Constellation (Orion) | |

## Other Related Resources
- French Wikipedia: *Liste de sigles de trois caractères* (acronyms)
- Ham radio callsign prefixes (country prefixes, often 1–3 chars)
- Amateur lists of 3-letter gamertags / Minecraft names (availability-focused, not standardized)

## Recommendations
1. Use the Hugging Face `3char` dataset for any serious lookup, validation, or cross-system matching work. Load via `datasets` library.
2. The CSVs in this folder (`3char_systems_summary.csv`, `3char_notable_overlaps.csv`) give a quick practical starting point.
3. Context (domain, casing, surrounding data) is usually sufficient to disambiguate collisions.

**Snapshot note**: Dataset retrieval dates go up to ~2026-10; codes can be retired or reassigned (especially IATA).

