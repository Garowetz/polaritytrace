# Status

Updated 2026-11-10. Read this first when starting a new session, then `CLAUDE.md` and `docs/polarity-reference.md`.

## Where we are

Live site: https://garowetz.github.io/polaritytrace/ (branch `main`). Work happens on `dev`; `main` is updated only when the owner says "publish". Last publish: 2026-11-10 at 8734090 (PDF export, parts review page, A-to-A as a note, Type B naming).

| Step | What | State |
|---|---|---|
| 1 | Plan | Done |
| 2 | Polarity engine, component data, tests | Done |
| 3 | Link canvas with light animation | Done |
| 4 | Pickers, verdict panel with fixes | Done |
| 5 | Link saved in the URL, visual rounds, PDF export | Done |
| 6 | Polish: animation, mobile, accessibility | Later |

## What the site does today

- **Build the link:** End A, the MPO cable and End B are picked independently. Each end is a module (with front polish, patch cords and what it plugs into) or an MPO optic. An Examples menu holds the presets, including the "common mistake" ones.
- **Picker cards:** each part opens a card of picture tiles; tapping a part in the drawing opens its card. The module picker shows the fibre count as a bold badge and groups modules: Most used (Type A, U1, U1 8F), MPO-16 and MPO-24, then other and vendor-specific (Type B cassette is there). "How it is mounted" (Right way up / Upside down) sits at the top of the module picker; the End card shows "· Upside down" when set.
- **The drawing:** every fibre in TIA-598 colours; hover or tap a fibre or port number to follow its path. Horizontal on desktop, vertical and centred on phones, with the key notes either side. Short labels on the drawing (`12F · Singlemode`, `MPO-12 · 12F`, `LC to LC`); full specs live in the parts list. Opens in lab (dark) mode.
- **Follow the light:** Play steps through the link with captions; ‹ › move one step. On phones the step box sits above the drawing, and a fixed-height floating bar appears at the bottom while stepping.
- **Layouts (owner's pick):** desktop is look A (clean drawing, legend and Save in a toolbar underneath, a Parts list card on the page). Phones are look B (parts table drawn into the drawing like a title block, Play and Save on its top-right corner).
- **Channel check:** a coloured verdict banner (TIA green works, TIA orange works with warnings, brand coral does not work), Channels / Port map tabs (the module-to-module port map is always available), issues and one-tap "Try this" fixes.
- **Plugged into: None:** an end can be just the module; the result is then a port map rather than pass/fail.
- **Save picture:** a PNG with the parts table, the result and the share link. On phones it asks Wide (the desktop drawing, made off screen; best for email and slides) or Tall (as on the phone).
- **Save PDF:** one US Letter landscape page, always in light colours: header with the link's name and date, the wide drawing as vector graphics, then three columns: parts list; channel check (verdict pill, one row per channel, notes, Try this fixes, under review); module port map and a QR code plus the address, both clickable. Desktop has a Save PDF button beside Save picture; on phones the Save menu offers Wide, Tall or PDF. jsPDF, svg2pdf.js and qrcode-generator load only when a PDF is made. Content lives in `src/ui/pdfContent.ts` (tested), placement in `src/ui/savePdf.ts`. Text uses the PDF's built-in Helvetica, so `pdfSafe` swaps characters it lacks (→ becomes ->).
- **Shareable links:** the URL always holds the link. A preset is `?p=method-a`; anything else is `?a=<end A>&t=<cable>&b=<end B>`, e.g. `?a=cas-a-12~lc-ab~inv&t=trunk-a-12~SMF~APC&b=cas-a-12~lc-aa`. Bad links fall back to the default with a note.
- **Footer:** name and tagline, TIA basis, "check against the manufacturer's drawings" disclaimer, "© <year> Polarity Trace. All rights reserved." and the build date. No personal or company names (owner's decision).
- **Parts review page:** `parts.html`, linked quietly from the footer ("Parts list"), hidden from search engines. Every part from the data in four numbered sections (1 Modules, 2 Equipment, 3 MPO cables, 4 Patch cords), each part with a reference (1A …), facts, status, source and numbered review points (1A-1 …), plus one list of all points. Content in `src/review/parts.ts` (tested); extra points per part in its `NOTES`. Letters shift if a part is added.
- **Tests:** 206 engine, data and UI-logic tests, all passing.

## Decisions made

- Pick End A, the cable and End B independently, not whole-link presets. No drag and drop; tapping does the job and works on phones.
- Module fronts are numbered per connector (1–12, matching TIA-598 colours and MPO positions); the CS module front count stays per port (8 × CS). Equipment ports stay duplex 1–6 with Tx/Rx.
- Cassette labels show fibre count and SM/MM; connector types (LC, CS) belong on the cords.
- MPO-16 for 800G is in v1 (800G DR8/SR8, 400G SR8). Twin-MPO 800G optics are out of v1.
- F-U1-24-A is WARN rather than FAIL (light lands on Rx at port 13−p).
- Verdict colours: TIA green, TIA orange and brand coral (owner-approved, noted in CLAUDE.md).
- Parts are named by Type (Type A/B cassette, Type B trunk); Methods are whole links (TIA Method A/B). The owner's range is Type A modules for standard links and U1 for breakout; modules are not flipped, so the hint no longer points at Method B.
- Non-standard A-to-A cords are a NOTE, not a warning (owner, 2026-11-10): rolling cords at one end is expected. Breakout presets now read Works. Recorded in the reference doc §3-1.
- Copyright reads "Polarity Trace" only. The owner tried their own name and removed it; never add personal or company names to the repo.

## Open questions

1. **8-port CS module (MPO-16) wiring.** The site assumes universal-style pairing (port p = MPO p and 17−p), so 800G DR8 breakout to 8 × 100G DR works through a Type B trunk with CS-to-LC A-to-A cords. If "1 to 1, 2 to 2" means straight wiring, DR8 breakout fails with every cord and trunk. Waiting on the product drawing or the owner's reading. The straight-wiring change is kept in git stash "cs-16 straight wiring".
2. **Key up / key down.** The owner finds it confusing; it needs a plain explanation before it goes into Polarity Maps or onto the drawing (key bumps on the plugs wait on this).
3. **Research, for the separate research chat:** R3-O8 (Juniper), the R3-O2 U2 TIA statement, MPO-24 adapter row swap, confirming F-U1-24-A.

## Next steps

1. **Owner review** of the parts list: answer the review points by number. The footer link stays until the owner asks to remove it.
2. **Custom domain:** get ready for polaritytrace.com (polaritytrace.ca as backup).
3. **Polarity Maps parser:** draft plain-text part format in `docs/polarity-maps.md` ([Module], [Assembly], [Cord]); parser not built.
4. **CS module wiring** once question 1 is answered.
5. **Step 6 polish:** animation, mobile, accessibility.

## History of visual rounds (all published 2026-11-09)

1. Module outline holds its rear MPO; key notes; gaps where cords and cable meet a module; card title pills; unlit fibres grey and dashed.
2. Zip-cord patch cords; tighter fibres into a smaller rear MPO; cable jacket with MPO plugs; polish buttons per fibre type.
3. Port numbers inside the module; per-end front polish (`fp:APC`); spec-style labels; parts list by end; two-sided port map.
4. Lab mode by default; short labels on the drawing; bigger text; coloured verdict.
5. Channel check with Port map tab; footer; phone drawing centred; floating step bar; layout trial A/B.
6. B on phones, A on desktop; Wide/Tall save on phones; "Follow the light"; fixed floating bar.
7. Module picker badges, grouping and mounting; footer relayout; verdict pill fits on phones.
