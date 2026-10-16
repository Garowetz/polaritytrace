# Build prompt: Polarity Trace, an interactive MPO polarity visualizer

Paste everything below the line into Claude Code as your first message.

---

I want to build **Polarity Trace**, an interactive website that shows how light travels through a fibre link, from the transmitter on the left to the receiver on the right. It covers MPO trunks, cassettes, patch cords, harnesses and optics. The goal is to help salespeople and customers understand polarity and order the right parts. This is not a design tool for fibre engineers.

Read `CLAUDE.md`, `docs/polarity-reference.md` and everything in `/brand` before starting. `docs/polarity-reference.md` is the researched, cited source of truth for every mapping and pinout. **Plan first and show me the plan before writing code.**

## Who it's for

- Our internal sales team and colleagues, and selected key customers.
- It may later go public on its own domain.
- It must be understandable to a non-engineer and correct enough that an engineer trusts it.

## Core experience

1. **A link canvas.** The link is laid out left to right as a chain of components. Default chain:
   Optic/Equipment → Patch cord → Cassette → MPO trunk → Cassette → Patch cord → Optic/Equipment.
   - Segments can be added or removed: a trunk on its own, a direct optic-to-optic MPO, an optic on one end and a cassette on the other, extra trunks with MPO adapters, and breakout harnesses.
   - Drag and drop is welcome for adding, reordering or swapping components.
2. **Follow the light.**
   - Each fibre is drawn as its own path in TIA-598 colours (blue, orange, green, brown, slate, white, red, black, yellow, violet, rose, aqua).
   - Animated pulses travel from every Tx to wherever that fibre ends up.
   - Hovering or tapping a fibre, port or position highlights its full end-to-end path and dims everything else.
   - A play/step control walks the light through one component at a time, with a short caption of what happens at each step. For example: "Type B trunk: position 1 arrives at position 12."
3. **Click any component to change it.**
   - Clicking opens a polished pop-over card, not a native dropdown.
   - The card shows the options as visual tiles. Each tile has an icon or illustration, a one-line description and a "learn more" expansion.
   - Example: clicking the trunk shows Type A, Type B and Type C tiles, each with a mini-diagram of its fibre mapping.
4. **Verdict panel.**
   - For every channel, it shows whether Tx lands on Rx (✅) or Tx lands on Tx (❌), plus dark or unused fibres.
   - When a channel fails, it suggests the simplest fix, such as "Swap the right-hand patch cord from A-to-A to A-to-B" or "Use a Type B trunk".
5. **Presets.** One-tap starting points:
   - TIA Method A, TIA Method B, TIA Method C, and Universal polarity, each with duplex LC at both ends.
   - 400G SR8 direct (MPO-16)
   - 100G SR4 direct
   - 40G/100G SR4 to 4× duplex breakout
   - 24F trunk to 2×12F and 3×8F
6. **Share.**
   - The full configuration is encoded in the URL (hash or query), so copying the link reproduces the exact view.
   - **Export to PDF** produces a clean one-page sheet with the diagram as vector, the component list, the verdict table and the share URL.
   - Nothing is stored server-side. There are no accounts and no backend.

## Components to model (data-driven)

Define every component in data files (JSON or TS), not hard-coded in UI logic. That way new parts can be added later. Include a `source` and `verified` field on each pinout.

**MPO trunks.**
- Polarity: Type A (key up to key down, 1→1), Type B (key up to key up, 1→12 reversed), and Type C (pair-flipped, 1→2, 2→1, and so on).
- Fibre counts:
  - 8F (MPO-12 footprint, positions 1–4 and 9–12 lit)
  - 12F
  - 16F (MPO-16, single row of 16, with a different key offset that does **not** mate with MPO-12. Flag this.)
  - 24F (MPO-24, 2×12, fully lit)
  - 24F footprint carrying 16 lit fibres
  - Please support every sensible combination, including conversion/breakout trunks: 24F→2×12F, 24F→3×8F, 16F→2×8F.
- Pin gender is shown as a label. Default: cassettes are male (pinned) and trunks are female. If two males or two females are mated, show a soft warning. It is informational, not the focus.

**Cassettes (MPO to duplex LC).**
- Type A / Method A cassette.
- Type B / Method B cassette.
- Type C usage (Method C uses Type A-style cassettes with a Type C trunk).
- **Universal polarity cassette (Panduit-style).**
  - Internal mapping: MPO 1→LC1, 12→LC2, 2→LC3, 11→LC4, 3→LC5, 10→LC6, 4→LC7, 9→LC8, 5→LC9, 8→LC10, 6→LC11, 7→LC12.
  - It is used with a Type B trunk and the same standard A-to-B duplex patch cords at both ends.
  - This is the configuration I most want to explain well.
  - Verify this against Panduit's published documentation and tell me if anything differs.
- Variants for 8F (4 duplex ports), 12F (6), 16F (8) and 24F (12).

**Patch cords and harnesses.**
- Duplex LC A-to-B (crossover, the standard cord) and A-to-A (straight).
- Duplex CS cords.
- MPO-to-MPO equipment cords in Type A, B and C.
- MPO-to-duplex breakout harnesses (fan-outs).

**Optics.** Show each as a generic form factor with its connector and lane map. No vendor part numbers.
- Duplex LC: SFP+/SFP28 SR/LR, and QSFP28 LR4/CWDM4.
- MPO-12 parallel optics:
  - 40G QSFP+ SR4, 100G QSFP28 SR4, PSM4 (8 of 12 lit)
  - 400G QSFP-DD/OSFP DR4 (singlemode)
- MPO-16: 400G QSFP-DD SR8, and 800G SR8 variants.
- Dual CS: QSFP-DD 2×FR4/2×LR4 style.
- BiDi (e.g. SR4.2) as a duplex LC example.
- Each optic card explains in plain language what it is, typical speed and reach, the fibre type (MM/SM), and which positions transmit vs receive.
- **Verify Tx/Rx lane assignments against IEEE 802.3 / MSA documents.** Mark anything you can't confirm as `verified: false` and list those for me.

## Correctness comes first

- **Build every component data file from `docs/polarity-reference.md`.**
  - Items marked VERIFIED there get `verified: true`.
  - PARTIAL or UNVERIFIED items get `verified: false` and show a small "under review" badge in the UI.
  - Do not override the reference file with your own knowledge. If you think it's wrong, tell me.
- Turn the expected PASS and FAIL tables in section 8 of the reference file into the unit tests.
- Use the reference file's labelling choices. In particular, the standard duplex cord is labelled "A-to-B (standard)", with a tooltip explaining that some sources call it straight-through and others call it crossover.
- Universal (U1) cassettes use a Type A (key-up/key-down) rear adapter with a Type B trunk.
- SN and MDC use vertical polarity, so they must not be treated like LC. CS behaves like LC.
- Show an APC warning for any key-up/key-up adapter.
- Build the polarity engine as a pure, framework-free module before any UI. It takes a chain of components and returns, for every Tx, the position where the light ends up.
- Write unit tests that prove:
  - TIA Methods A, B and C and the Universal method all deliver Tx→Rx on every channel with their standard patch cords.
  - Known-bad combinations fail. For example: Method A with A-to-B cords on both ends, MPO-16 mated to MPO-12, and a Type A trunk direct between two SR4 optics.
- The UI only renders what the engine returns. It never decides polarity itself.

## Look and feel

- It should be very polished and visually impressive, more like a product showcase than a reference chart.
- Use smooth animation, depth, glowing light pulses, a dark "lab" mode plus a light mode, and tactile hover states.
- Use the colours and typography from `/brand`, **but do not use the company name, logo or wordmark anywhere.** The site is called **Polarity Trace**. Use that name in the page title, header, PDF export and README. The intended domain is polaritytrace.com (polaritytrace.ca as a backup), so set it up to accept a custom domain later.
- It must work well on a phone, which will be a common way customers open a shared link. On narrow screens the chain can scroll horizontally or stack, with the same tap interactions.
- Keep it accessible: keyboard navigation, focus states, and colour-blind-safe signalling. Never rely on fibre colour alone; also show position numbers.

## Tech and hosting

- Static site, no backend. Hosted on **GitHub Pages** from this repo with a GitHub Actions deploy workflow. It should be easy to point a custom domain at later.
- Suggested stack (push back if you have a better idea): Vite + React + TypeScript, SVG for the diagram, Framer Motion for animation, and client-side vector PDF export (e.g. jsPDF + svg2pdf).
- Keep dependencies modest. The site should load fast on a phone.

## Deliverables, in order

1. A plan, folder structure and data model. Stop for my approval.
2. The polarity engine, component data and passing tests, plus a list of anything unverified.
3. A basic canvas with the light animation working for the presets.
4. Pop-over component pickers, drag and drop, and the verdict panel with fixes.
5. URL encoding, PDF export and GitHub Pages deploy.
6. A polish pass: animation, mobile and accessibility.

After each step, tell me how to run it locally and what to look at.
