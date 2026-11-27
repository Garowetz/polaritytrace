# Plan: MPO adapter panel end

Status: approved by the owner 2026-11-27. Steps 1–4 are built and tested (engine, URL, presets, pickers, plus the basic drawing); steps 5–6 are next.

## What it adds

A third kind of end, so a link can be:

```
MPO optic → MPO patch cord → MPO adapter → MPO cable → End B (any kind)
```

End B can be anything the site offers today: a breakout module with duplex cords
and optics, a bare MPO optic, or another adapter panel. That covers the owner's
example (optic → MPO cord → adapter → main cable → breakout module → duplex
cord → optic) and the three TIA parallel-optic ("array") methods.

## Why it is well grounded

- The adapter map is already in the engine (`adapterMap` in `src/engine/maps.ts`,
  reference §3, VERIFIED for 12F, PARTIAL for 16F).
- MPO patch cords are the same Type A / B / C maps as the trunks
  (`src/data/trunks.ts`), so no new pinout data is needed.
- Reference §8.1 already lists the expected results:
  - P-ArrA: Type A cord → key-up/key-down adapter → Type A trunk → key-up/key-down
    adapter → **Type B** cord. Pass.
  - P-ArrB: Type B cord → key-up/key-up adapter → Type B trunk → key-up/key-up
    adapter → Type B cord. Pass, multimode (UPC) only.
  - P-ArrC: Type B cord → key-up/key-down adapter → Type C trunk →
    key-up/key-down adapter → Type C cord. Pass.
  - F-3 and F-4 (Type A or Type C straight between parallel optics) must still fail.
- Reference §3.1 already says APC through key-up/key-up is a BLOCK, and that
  parallel Method B cannot be built in APC.

## Scope change (needs the owner's OK)

`CLAUDE.md` and reference "v1 scope" say: one MPO cable per link, no MPO
equipment cords between an optic and a trunk. This plan lifts that rule for one
case only: **one MPO patch cord and one adapter between an MPO optic and the
cable, at either end**. Still out: two trunks in a chain, more than one adapter
per end, conversion cords (24F → 2×12F and the like), harnesses, key-changeable
adapters.

## Design

### Engine (data model)

Keep the existing optic end and give it an optional panel, rather than a new end
kind. Every code path that handles an MPO optic end keeps working, and a plain
optic end is just "no panel".

```ts
interface OpticEnd {
  kind: 'mpoOptic';
  optic: string;
  fec?: FecMode;
  /** MPO adapter panel and patch cord between the optic and the cable. */
  panel?: {
    adapter: 'A' | 'B';          // key-up/key-down | key-up/key-up
    cord: string;                // a trunk id used as the patch cord (Type A/B/C, fibre count)
    cordGender?: [Gender, Gender]; // [optic side, panel side]; default [F, M]
  };
}
```

- **Trace** (`src/engine/trace.ts`): between the optic receptacle and the trunk
  plug, add two hops: through the cord (end 1 = optic side), then through the
  adapter. The far end runs the same steps in reverse. New hop kinds `cord` and
  `adapter` so the steps list and drawing can show them.
- **Lit fibres:** a cord with fewer lit fibres than the optic uses goes dark at
  the cord, like the trunk does today.
- **Footprint:** cord, trunk and optic must share a footprint. MPO-16 meeting
  MPO-12 gets the existing flag.
- **Mechanical checks** (`src/engine/mechanical.ts`):
  - BLOCK: key-up/key-up adapter when the cable or cord is APC (extend the
    existing cassette rule to panels).
  - Note only: gender. Optics are pinned, so the cord end at the optic should be
    unpinned. At the adapter, exactly one of the cord and trunk ends should be
    pinned. Default cord is unpinned at the optic, pinned at the panel, so it
    works with the default female trunk.
  - The cord takes the cable's fibre type and polish.
- **Methods** (`src/engine/methods.ts`): name the link "TIA Method A / B / C
  (parallel)" when it matches P-ArrA, P-ArrB or P-ArrC.
- **Fixes** (`src/engine/fixes.ts`): offer the one-part swaps a person would
  make: change one cord to Type B (Method A), or change the adapter type.

### Data

- Patch cords reuse the trunk definitions. The UI calls them "MPO patch cord"
  instead of "trunk". No new `source` / `verified` entries needed. Adapter
  status comes from reference §3 (16F key-up/key-up stays PARTIAL; two-row
  key-up/key-up already throws and stays out).
- Presets (`src/data/presets.ts`): add "Parallel Method A (SR4)", "Parallel
  Method C (SR4)" and, multimode only, "Parallel Method B (SR4)". Add one mixed
  preset matching the owner's example: SR4 → cord → adapter → Type B trunk →
  breakout module → duplex cords → 4 duplex optics, using whichever module the
  reference already passes for that channel.
- Common-mistake preset: Type A cords at both ends of a Type A trunk (fails,
  even inversions).

### UI

- **End picker:** a new group "MPO adapter panel" with two tiles: key-up/key-down
  and key-up/key-up (the second greyed out on APC, with the reason). The new
  section panels already separate it from the modules.
- **Cord slot:** when the end is a panel, the cord picker lists MPO patch cords
  (Type A / B / C, at the cable's fibre count) instead of duplex cords.
- **Plugged into:** only MPO optics are offered for a panel end.
- **Drawing** (`src/ui/layout.ts`, `Canvas.tsx`): draw the optic, then the cord,
  then a small adapter block, then the cable, in the same TIA-598 colours. Check
  the phone (vertical) layout as well as desktop.
- **URL state** (`src/ui/urlState.ts`): add the panel to the optic end's token,
  for example `sr4~p:A:trunk-b-12`. Old links without it still open unchanged.
- **Parts list and PDF:** list the adapter and the patch cord as their own
  lines.

## Steps (each ends with tests passing)

1. Engine: `panel` on the optic end, resolve, trace hops. Tests for P-ArrA,
   P-ArrB, P-ArrC, F-3 and F-4 with a panel, MPO-16 and footprint mismatch.
2. Mechanical checks, method naming and fixes. Tests for the APC BLOCK, gender
   notes and each fix.
3. URL state and presets. Round-trip tests; old links still parse.
4. Pickers: panel tiles, MPO cord list, optic-only equipment.
5. Drawing, steps list, parts list, PDF. Check all screen sizes, both themes.
6. Update reference "v1 scope", `CLAUDE.md` and `docs/STATUS.md`.

## Owner's answers (2026-11-27)

1. Lift the "one MPO cable only" rule for this case: **yes**.
2. Panels at both ends at once: **yes**.
3. Default patch cord when a panel is first chosen: **Type A**.
4. Patch cord genders: **unpinned at the optic, pinned at the panel** (the
   default in the engine). The pin could instead be on the main trunk in
   practice; that is a gender note only, so it can change later without
   touching the polarity logic.

## Built so far

- Steps 1 and 2: `panel` on the optic end (`src/engine/types.ts`), resolve,
  trace hops `cord`, the APC / footprint / two-row / gender checks, method
  names `array-A`, `array-B`, `array-C`, breakout through a panel recognised as
  `breakout-U` when cord + adapter + trunk act as a Type B cable, fixes (swap the
  patch cord or the adapter) and step captions. Tests: `src/engine/panel.test.ts`.
- Steps 3 and 4: the URL token `pn:<adapter>:<cord>` (and `pg:<genders>`) on an
  optic end; presets "TIA Method A / B / C, parallel (adapter panels)", the
  "Type A patch cords at both panels" mistake, and "100G SR4 through a panel to
  4 × 25G breakout"; an "MPO adapter panel" group in the End picker, an MPO
  patch cord picker and an MPO optic picker for panel ends. A new panel gets an
  optic that fits the cable and a Type A patch cord. Tests:
  `src/ui/panel-ui.test.ts`.
- Pulled forward from step 5 so the site never shows a panel wrongly: the
  drawing has the adapter (with key notes), the patch cord and both of its
  plugs, on desktop and phone.
- Still to do (step 5): the parts list and PDF do not yet list the adapter and
  patch cord as their own lines; key-up/key-up is not greyed out on APC (the
  verdict blocks it and the fix offers key-up/key-down instead).
- Step 6: reference "v1 scope" and `CLAUDE.md`.
