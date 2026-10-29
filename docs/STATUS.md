# Status

Updated 2026-10-23. Read this first when starting a new session, then `CLAUDE.md` and `docs/polarity-reference.md`.

## Where we are

Live site: https://garowetz.github.io/polaritytrace/ (branch `main`). Work happens on `dev`; `main` is updated only when the owner says "publish".

| Step | What | State |
|---|---|---|
| 1 | Plan | Done |
| 2 | Polarity engine, component data, tests | Done |
| 3 | Link canvas with light animation | Done |
| 4 | Pickers, verdict panel with fixes | Done (live) |
| 5 | Link saved in the URL (done), PDF export (next) | **In progress** |
| 6 | Polish: animation, mobile, accessibility | Later |

What the site does today:
- **Pick parts:** End A, the MPO cable and End B are picked independently. Each end is a cassette (with patch cords, what it plugs into, and upside-down mounting) or an MPO optic.
- **Tile cards:** each part opens a card of picture tiles. Tapping a part in the diagram opens its card.
- **Examples menu:** holds the presets, including the "common mistake" ones.
- **The diagram:** every fibre is drawn in TIA colours. Hover or tap a fibre to highlight its path, and Play steps through the link with captions. The layout runs horizontally on desktop and vertically on phones. There is also a lab (dark) mode.
- **Verdict panel:** the overall verdict, a channel-by-channel table, the issues found, and one-tap "Try this" fixes.
- **Shareable links:** the URL always holds the current link. A preset is `?p=method-a`; anything else is `?a=<end A>&t=<cable>&b=<end B>`, e.g. `?a=cas-a-12~lc-ab&t=trunk-a-12~SMF~APC&b=cas-u1-12~lc-aa`. A bad or unknown link falls back to the default with a short note.
- **Tests:** 185 engine, data and UI-logic tests, all passing.

## Decisions made

- **Pickers:** pick End A, the cable and End B independently, not whole-link presets.
- **Drag and drop:** skipped. Tapping a part does the same job and works on phones.
- **Cassette drawing:** the cassette front draws A above B, so a straight cassette draws straight and the cord shows any flip.
- **MPO-16 for 800G is in v1:** 800G DR8 and SR8, plus 400G SR8.
- **Twin-MPO 800G optics:** out of v1.
- **F-U1-24-A:** WARN rather than FAIL. Light lands on Rx at port 13−p; accepted.

## Open questions

1. **8-port CS module (MPO-16) wiring.**
   - The site currently assumes universal-style pairing: port p = MPO p and 17−p. With that, 800G DR8 breakout to 8 × 100G DR works through a Type B trunk with CS-to-LC A-to-A cords.
   - The owner suggested assuming "1 to 1, 2 to 2". If that means straight wiring (port 1 = MPO 1 and 2), **DR8 breakout fails with every cord and either trunk**: a DR8 lane transmits on position k and receives on 17−k. Straight wiring only works module-to-module (Method A style).
   - Waiting on the product drawing, or on the owner's reading of "1 to 1": MPO fibre to CS fibre, or lane to port. The straight-wiring change is drafted and kept aside (git stash "cs-16 straight wiring").
2. **Research, for the separate research chat:**
   - R3-O8 (Juniper)
   - the R3-O2 U2 TIA statement
   - MPO-24 adapter row swap
   - confirming F-U1-24-A

## Under discussion (owner feedback, 2026-10-28)

- **Visual update done (2026-10-28):** module outline holds its rear MPO; rear MPO and cable a little narrower than the module; key notes below each adapter ("Module key up" / "Cable key down", flipped when a cassette is mounted upside down); gaps where cords and the cable meet a module; card titles (End A / MPO cable / End B) are dark pill labels inside the cards. Unused MPO positions were already hollow dots.
- **Fibres no light enters are now drawn** grey and dashed (e.g. Rx wired to Rx in Type A → Type A trunk → Universal). Blocked links with mismatched MPO sizes still draw nothing; the owner agrees that's right.
- **Polarity Maps (plain-text part format):** draft spec in `docs/polarity-maps.md` ([Module], [Assembly], [Cord] blocks). Open: what key up / key down should mean in it. The owner finds key up/down confusing, so it needs a plain explanation first. The parser is not built yet.

## Next: Step 5 (rest)

- **PDF export:** a one-page PDF with the diagram as vector graphics, the component list, the verdict table and the share link.
- **Custom domain:** get ready for one later (polaritytrace.com).
