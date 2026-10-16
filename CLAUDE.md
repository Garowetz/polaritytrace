# Polarity Trace: MPO polarity visualizer

Repo: `polarity-trace`. Intended domain: polaritytrace.com (polaritytrace.ca as a backup).

An interactive static website that shows how light travels from Tx to Rx through MPO trunks, cassettes, patch cords, harnesses and optics. The audience is a fibre manufacturer's sales team and their key customers.

## Owner
The owner works in sales, not engineering. Explain things plainly, give clear "how to run it" steps, and push back directly if something looks wrong.

## Non-negotiables
- **Correctness first.** All polarity logic lives in a pure engine module with unit tests. The UI only renders engine output.
- **Data-driven components.** Every trunk, cassette, cord and optic is defined in data files with `source` and `verified` fields. Never guess a pinout silently. Mark it unverified and tell the owner.
- **Unbranded.**
  - Use the colours and fonts from `/brand` only.
  - Never put the company name, logo or wordmark in the UI, metadata, PDF export or README.
- **No backend, nothing stored.** All state lives in the URL so links are shareable.
- **Mobile matters.** Shared links will often be opened on phones.

## Standards and references
- **`docs/polarity-reference.md` is the source of truth.** It holds the researched, cited maps with VERIFIED, PARTIAL or UNVERIFIED status. Data and tests come from it. Never contradict it silently.
- Polarity methods follow TIA-568 Methods A, B and C. Fibre colours follow TIA-598.
- Optic lane maps come from IEEE 802.3 and the relevant MSAs.
- Universal polarity cassette (Panduit-style) mapping: MPO 1,12,2,11,3,10,4,9,5,8,6,7 → LC 1–12. It is used with a Type B trunk and A-to-B duplex cords at both ends.
- MPO-16 has a different key offset and does not mate with MPO-12. Flag it whenever this happens.

## Defaults
- Cassettes are male (pinned) and trunks are female.
- Gender mismatches are a soft warning only.
- Polish: APC on singlemode MPO, UPC on multimode MPO, with per-optic exceptions (reference §6.0). A key-up/key-up adapter on APC is a BLOCK.
- Labels use `MPO-<positions> · <lit>F` (e.g. MPO-12 · 8F). Never show a bare "MPO-8".

## v1 scope
- Layout: [duplex cord + optics]? → End A (cassette or MPO optic) → one MPO cable → End B → [duplex cord + optics]?
- One MPO cable only. Cassettes have exactly one rear MPO. No conversion trunks, harnesses, two-trunk chains or SN/MDC yet.
- Public repo: never write the company name or any person's name into any file.

## Workflow
- Plan before building and wait for approval on the plan.
- Work in small steps and run tests before saying a step is done.
- Commit with clear messages. Deploy to GitHub Pages with GitHub Actions.

## Folders
- `/brand`: brand guide and assets (colours and fonts only)
- `/src/engine`: polarity engine plus tests
- `/src/data`: component definitions
- `/src/ui`: React components
