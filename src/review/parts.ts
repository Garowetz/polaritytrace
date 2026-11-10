import type { CassetteDef, Catalog, DuplexCordDef, OpticDef, PosMap, Status, TrunkDef } from '../engine/types';
import { fibreWord, frontCount, mpoSize } from '../ui/describe';

// The parts review page as plain data: every part the site uses, grouped and
// numbered (1A, 1B …) so the owner can point at one, with numbered review
// points (1A-1 …) wherever something is assumed, derived or unverified.

export interface ReviewPart {
  ref: string;
  id: string;
  label: string;
  summary: string;
  facts: { name: string; value: string }[];
  status: Status;
  source: string;
  points: { ref: string; text: string }[];
}

export interface ReviewSection {
  number: number;
  title: string;
  groups: { title: string; parts: ReviewPart[] }[];
}

/** Points the data alone cannot say. Keyed by part id. */
const NOTES: Record<string, string[]> = {
  'cas-a-12': ['Our standard module. Used at both ends of Method A with A-to-B cords at one end and A-to-A at the other.'],
  'cas-b-12': [
    'Not in our range. Kept so a competitor\'s Method B link can be checked: TIA builds it by mounting one module upside down.',
    'Key-up/key-up rear adapter, so it cannot be built in APC (singlemode). Keep it in the picker under "Other", or remove it?',
  ],
  'cas-b2-12': ['Vendor alternative to flipping a module. The wiring comes from one competitor datasheet only.'],
  'cas-bn-12': ['A competitor drawing. As a far-end Method B module it only works with B-A front adapters. Keep it?'],
  'cas-u1-12': ['Our breakout and universal module. Same module and A-to-B cords at both ends; A-to-A cords for breakout through a trunk.'],
  'cas-u2-12': ['Not in our range. Key-up/key-up rear adapter, so it cannot be built in APC. Keep it?'],
  'cas-af-12': ['Vendor variant. Keep it?'],
  'cas-u1-8': ['Wiring from competitor sources only. Check against our own Base-8 U1 drawing.'],
  'cas-u1-16': ['Wiring derived by extending U1 to 16 fibres. No published TIA transition. Check against a product drawing.'],
  'cas-u1-16-cs': [
    'Our 8-port CS module. The site assumes universal-style wiring (port p = MPO p and 17−p), so 800G DR8 breakout works.',
    'If the module is wired straight ("1 to 1, 2 to 2"), DR8 breakout fails with every cord and trunk. Waiting on the product drawing.',
  ],
  'cas-u1-24': [
    'Wiring derived (port p = MPO p and 25−p). Check against a product drawing.',
    'With a Type A 24F trunk the light lands on port 13−p, so the site shows it as a warning, not a failure.',
  ],
  'cas-u1-24-16f': ['Wiring derived. Check against a product drawing, or remove if we do not sell it.'],
  'cas-a-24': ['Renumbers ports across the link (rows swap in a 24F trunk). Needs a matched far end.'],
  'trunk-c-12': ['Method C only. Not suitable for parallel optics: the pair flip sends Tx onto Tx.'],
  'trunk-b-24': ['Two-row map (1→24) from one competitor table. Confirm against TIA-568.3-E.'],
  'trunk-c-24': ['Two-row map (1→14) from one competitor table. Confirm against TIA-568.3-E.'],
  'trunk-a-16': ['16F map derived from the 12F rule. No non-competitor table found.'],
  'trunk-b-16': ['16F map derived from the 12F rule (1→16). No non-competitor table found.'],
  'lc-aa': ['Shown as a Note, not a warning (owner decision 2026-11-10): rolling the cords at one end is expected with our system.'],
  'cs-lc-ab': ['Assumes CS follows the LC A/B rule. Confirm with a CS cord drawing.'],
  'cs-lc-aa': ['Assumes CS follows the LC A/B rule. Confirm with a CS cord drawing.'],
  'cs-ab': ['Assumes CS follows the LC A/B rule. Confirm with a CS cord drawing.'],
  'cs-aa': ['Assumes CS follows the LC A/B rule. Confirm with a CS cord drawing.'],
};

const STATUS_POINT: Record<Exclude<Status, 'VERIFIED'>, string> = {
  PARTIAL: 'Partly verified: one source, or a source that is not a standard.',
  UNVERIFIED: 'Not verified: derived or assumed. Needs a drawing or a standard to confirm.',
};

/** 0 → A, 25 → Z, 26 → AA. */
export function letters(i: number): string {
  return i < 26 ? String.fromCharCode(65 + i) : letters(Math.floor(i / 26) - 1) + letters(i % 26);
}

const keyWord = (t: 'A' | 'B' | 'C') => (t === 'B' ? 'key-up/key-up (Type B)' : 'key-up/key-down (Type A)');

/** "1→12, 2→11 …" over the lit positions only. */
const mapText = (map: PosMap, lit: readonly number[]) => lit.map((p) => `${p}→${map[p - 1]}`).join(', ');

function moduleFacts(d: CassetteDef): ReviewPart['facts'] {
  return [
    { name: 'Rear', value: `${mpoSize(d.positions, d.litPositions.length)}, ${keyWord(d.rearAdapter)} adapter` },
    { name: 'Front', value: `${frontCount(d)} × ${d.frontConnector} (${d.frontMap.length} duplex ports)` },
    { name: 'Wiring', value: d.frontMap.map((f) => `P${f.port}: ${f.A}+${f.B}`).join(', ') },
  ];
}

function equipmentFacts(o: OpticDef): ReviewPart['facts'] {
  const facts = [
    { name: 'Type', value: `${o.formFactor} · ${o.standard}` },
    {
      name: 'Connector',
      value: [o.mpo ? mpoSize(o.mpo.positions, o.mpo.lanes.length * 2) : o.connector, o.fibre && fibreWord(o.fibre), o.polish]
        .filter(Boolean)
        .join(' · '),
    },
  ];
  if (!o.generic) facts.push({ name: 'Speed', value: `${o.speed}, reach ${o.reach}` });
  if (o.mpo) {
    facts.push({
      name: 'Lanes',
      value: `Tx on ${o.mpo.lanes.map((l) => l.tx).join(', ')}; Rx on ${o.mpo.lanes.map((l) => l.rx).join(', ')}`,
    });
  }
  if (o.breakout?.length) facts.push({ name: 'Breakout', value: o.breakout.map((b) => b.note).join(' ') });
  if (o.breakoutSupported === false) facts.push({ name: 'Breakout', value: 'Not supported.' });
  return facts;
}

function cableFacts(t: TrunkDef): ReviewPart['facts'] {
  return [
    { name: 'Size', value: mpoSize(t.positions, t.litPositions.length) },
    { name: 'Polarity', value: `Type ${t.polarity}` },
    { name: 'Fibre map', value: mapText(t.map, t.litPositions) },
  ];
}

function cordFacts(c: DuplexCordDef): ReviewPart['facts'] {
  return [
    { name: 'Ends', value: `${c.ends.cassette} at the module, ${c.ends.equipment} at the equipment` },
    { name: 'Polarity', value: `${c.map}${c.standard ? ' (TIA standard)' : ' (non-standard)'}` },
  ];
}

type Def = CassetteDef | OpticDef | TrunkDef | DuplexCordDef;

function factsFor(d: Def): ReviewPart['facts'] {
  switch (d.kind) {
    case 'cassette':
      return moduleFacts(d);
    case 'optic':
      return equipmentFacts(d);
    case 'trunk':
      return cableFacts(d);
    case 'duplexCord':
      return cordFacts(d);
  }
}

function section(number: number, title: string, groups: { title: string; defs: Def[] }[]): ReviewSection {
  let i = 0;
  return {
    number,
    title,
    groups: groups
      .filter((g) => g.defs.length)
      .map((g) => ({
        title: g.title,
        parts: g.defs.map((d) => {
          const ref = `${number}${letters(i++)}`;
          const notes = [
            ...(d.status === 'VERIFIED' ? [] : [STATUS_POINT[d.status]]),
            ...(d.kind === 'optic' && !d.inV1 ? ['Not shown in the picker (out of v1). Kept so breakout and speed checks know about it.'] : []),
            ...(NOTES[d.id] ?? []),
          ];
          return {
            ref,
            id: d.id,
            label: d.label,
            summary: d.blurb,
            facts: factsFor(d),
            status: d.status,
            source: d.source.replace(/polarity-reference/g, 'Reference'),
            points: notes.map((text, n) => ({ ref: `${ref}-${n + 1}`, text })),
          };
        }),
      })),
  };
}

export function reviewSections(catalog: Catalog): ReviewSection[] {
  const modules = catalog.cassettes.filter((c) => !c.fixtureOnly);
  const optics = catalog.optics;
  const parallel = (n: number) => optics.filter((o) => o.inV1 && o.mpo?.positions === n);
  return [
    section(1, 'Modules', [
      { title: 'MPO-12 · 12F', defs: modules.filter((c) => c.positions === 12 && c.litPositions.length === 12) },
      { title: 'MPO-12 · 8F', defs: modules.filter((c) => c.positions === 12 && c.litPositions.length === 8) },
      { title: 'MPO-16', defs: modules.filter((c) => c.positions === 16) },
      { title: 'MPO-24', defs: modules.filter((c) => c.positions === 24) },
    ]),
    section(2, 'Equipment', [
      { title: 'Generic port', defs: optics.filter((o) => o.generic) },
      { title: 'Duplex optics', defs: optics.filter((o) => o.inV1 && !o.generic && !o.mpo) },
      { title: 'Parallel optics, MPO-12', defs: parallel(12) },
      { title: 'Parallel optics, MPO-16', defs: parallel(16) },
      { title: 'Not in the picker', defs: optics.filter((o) => !o.inV1) },
    ]),
    section(3, 'MPO cables', [
      { title: 'MPO-12 · 12F', defs: catalog.trunks.filter((t) => t.positions === 12 && t.litPositions.length === 12) },
      { title: 'MPO-12 · 8F', defs: catalog.trunks.filter((t) => t.positions === 12 && t.litPositions.length === 8) },
      { title: 'MPO-16', defs: catalog.trunks.filter((t) => t.positions === 16) },
      { title: 'MPO-24', defs: catalog.trunks.filter((t) => t.positions === 24) },
    ]),
    section(4, 'Patch cords', [
      { title: 'LC', defs: catalog.cords.filter((c) => c.ends.cassette === 'LC') },
      { title: 'CS', defs: catalog.cords.filter((c) => c.ends.cassette === 'CS') },
    ]),
  ];
}

/** Everything that needs a look, in page order. */
export const allPoints = (sections: ReviewSection[]) =>
  sections.flatMap((s) => s.groups.flatMap((g) => g.parts.flatMap((p) => p.points.map((pt) => ({ ...pt, part: p.label, partRef: p.ref })))));
