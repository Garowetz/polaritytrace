import type { CassetteDef, DuplexCordDef, Fibre, LinkResult, OpticDef, Polish } from '../engine';
import { METHOD_NAMES } from '../engine';
import type { ResolvedCassetteEnd, ResolvedEnd, ResolvedLink } from '../engine/resolve';

// Plain-language specs for each part, so the drawing carries everything
// someone needs when it is copied out of the site.

export const VERDICT_TEXT: Record<LinkResult['verdict'], { icon: string; text: string }> = {
  PASS: { icon: '✓', text: 'Works' },
  WARN: { icon: '!', text: 'Works, with warnings' },
  FAIL: { icon: '✕', text: 'Does not work' },
  BLOCK: { icon: '⛔', text: 'Cannot be built' },
};

/** With nothing plugged in at an end there is no polarity to pass or fail. */
export function verdictText(result: LinkResult): { icon: string; text: string; map: boolean } {
  const map = result.portMap && (result.verdict === 'PASS' || result.verdict === 'WARN');
  return map ? { icon: '→', text: 'Port map', map } : { ...VERDICT_TEXT[result.verdict], map };
}

/** Colour of the verdict word in the result line. */
export type Tone = 'good' | 'caution' | 'bad';
const TONE: Partial<Record<LinkResult['verdict'], Tone>> = { PASS: 'good', WARN: 'caution', FAIL: 'bad', BLOCK: 'bad' };

export const fibreWord = (f: Fibre) => (f === 'SMF' ? 'Singlemode' : 'Multimode');
const genderWord = (g: 'M' | 'F') => (g === 'M' ? 'Male' : 'Female');

// Written the way docs/polarity-maps.md writes parts (Front: LC/UPC,
// MPO/APC-12F-Down), with spaces round the hyphens so it reads easily.
const mpo = (polish: Polish, positions: number) => `MPO/${polish} - ${positions}F`;
const usedNote = (lit: number, positions: number) => (lit < positions ? `, ${lit} fibres used` : '');

/** Front connectors as counted on the module: one per LC, one per duplex CS. */
export function frontCount(def: CassetteDef): number {
  return def.frontConnector === 'CS' ? def.frontMap.length : def.frontMap.length * 2;
}

/** The size label used on the drawing, e.g. MPO-12 · 8F. */
export const mpoSize = (positions: number, lit: number) => `MPO-${positions} · ${lit}F`;

/** The short facts on the drawing; the full specs go in the parts list. */
export const cassetteShort = (def: CassetteDef) => `${frontCount(def)} × ${def.frontConnector}`;
export const trunkShort = (link: ResolvedLink) => mpoSize(link.trunk.positions, link.trunk.litPositions.length);
export function opticShort(def: OpticDef): string {
  return def.mpo ? mpoSize(def.mpo.positions, def.mpo.lanes.length * 2) : def.connector;
}

/** Two lines: the front, then the rear MPO. */
export function cassetteSpec(end: ResolvedCassetteEnd): string[] {
  const d = end.def;
  const key = d.rearAdapter === 'B' ? 'Up' : 'Down';
  return [
    `Front: ${frontCount(d)} × ${d.frontConnector}/${end.frontPolish}`,
    `${mpo(end.polish, d.positions)} - ${key} - ${genderWord(end.rearGender)}${usedNote(d.litPositions.length, d.positions)}`,
  ];
}

export function trunkSpec(link: ResolvedLink): string {
  const t = link.trunk;
  return `${mpo(link.polish, t.positions)} - ${link.trunkGender.join('/')} · ${fibreWord(link.fibre)}${usedNote(t.litPositions.length, t.positions)}`;
}

/** The module end of the cord matches the module front; the other end the equipment. */
export const cordSpec = (cord: DuplexCordDef, end: ResolvedCassetteEnd) =>
  `Ends: ${cord.ends.cassette}/${end.frontPolish} to ${cord.ends.equipment}/${end.equipment.polish ?? 'UPC'}`;

export function opticSpec(def: OpticDef): string {
  const n = def.mpo?.positions;
  const conn = n && def.polish ? mpo(def.polish, n) : def.connector;
  return def.fibre ? `${conn} · ${fibreWord(def.fibre)}` : conn;
}

/** One end, one fact per line. */
function endLines(name: string, end: ResolvedEnd): string[] {
  if (end.kind === 'mpoOptic') return [`${name}: ${end.def.label}`, opticSpec(end.def)];
  const lines = [`${name}: ${end.def.label}${end.mount === 'inverted' ? ', mounted upside down' : ''}`, ...cassetteSpec(end)];
  if (end.bare) {
    lines.push('Plugged into: nothing');
  } else {
    const ports = [...end.patched];
    const cords = [...new Set(ports.map((p) => end.cordFor(p).label))];
    lines.push(`Patch cords: ${cords.join(' and ')}`, cordSpec(end.cordFor(ports[0] ?? 1), end));
    lines.push(`Plugged into: ${end.equipment.generic ? 'equipment ports' : `${end.equipment.label} optics`}`);
  }
  return lines;
}

export interface Summary {
  left: string[];
  middle: string[];
  right: string[];
  result: string;
  /** The verdict word inside `result`, and its colour (none for a port map). */
  verdict: { text: string; tone?: Tone };
}

/** The parts list and result written under the drawing: End A, the cable and End B, then the result. */
export function summaryLines(link: ResolvedLink, result: LinkResult): Summary {
  const v = verdictText(result);
  const method = result.method ? METHOD_NAMES[result.method] : 'No standard method';
  const ok = result.channels.filter((c) => c.outcome === 'tx-to-rx').length;
  const count = !v.map && result.channels.length ? ` · ${ok} of ${result.channels.length} channels deliver Tx to Rx` : '';
  return {
    left: endLines('End A', link.left),
    middle: [`MPO cable: ${link.trunk.label}`, trunkSpec(link)],
    right: endLines('End B', link.right),
    result: `Result: ${v.text} · ${method}${count}`,
    verdict: { text: v.text, tone: v.map ? undefined : TONE[result.verdict] },
  };
}

/** Breaks text into lines of at most `max` characters, at spaces. */
export function wrap(text: string, max: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && line.length + 1 + word.length > max) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}
