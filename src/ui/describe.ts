import type { DuplexCordDef, Fibre, LinkResult, OpticDef, Polish } from '../engine';
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

export const fibreWord = (f: Fibre) => (f === 'SMF' ? 'Singlemode' : 'Multimode');
const genderWord = (g: 'M' | 'F') => (g === 'M' ? 'male' : 'female');

// Written the way docs/polarity-maps.md writes parts (Front: LC/UPC,
// MPO: MPO/APC-12F-Down), spelled out a little more.
const mpo = (polish: Polish, positions: number) => `MPO/${polish}-${positions}F`;
const usedNote = (lit: number, positions: number) => (lit < positions ? `, ${lit} fibres used` : '');

/** Two lines: the front, then the rear MPO. */
export function cassetteSpec(end: ResolvedCassetteEnd): string[] {
  const d = end.def;
  const key = d.rearAdapter === 'B' ? 'Up' : 'Down';
  return [
    `Front: ${d.frontMap.length} × ${d.frontConnector}/${end.frontPolish}`,
    `MPO: ${mpo(end.polish, d.positions)}-${key}, ${genderWord(end.rearGender)}${usedNote(d.litPositions.length, d.positions)}`,
  ];
}

export function trunkSpec(link: ResolvedLink): string {
  const t = link.trunk;
  return `MPO: ${mpo(link.polish, t.positions)}-${link.trunkGender.join('/')}, ${fibreWord(link.fibre).toLowerCase()}${usedNote(t.litPositions.length, t.positions)}`;
}

/** The module end of the cord matches the module front; the other end the equipment. */
export const cordSpec = (cord: DuplexCordDef, end: ResolvedCassetteEnd) =>
  `Ends: ${cord.ends.cassette}/${end.frontPolish} to ${cord.ends.equipment}/${end.equipment.polish ?? 'UPC'}`;

export function opticSpec(def: OpticDef): string {
  const n = def.mpo?.positions;
  const conn = n && def.polish ? `MPO: ${mpo(def.polish, n)}` : def.connector;
  return def.fibre ? `${conn}, ${fibreWord(def.fibre).toLowerCase()}` : conn;
}

function endLine(name: string, end: ResolvedEnd): string {
  if (end.kind === 'mpoOptic') return `${name}: ${end.def.label} · ${opticSpec(end.def)}`;
  const parts = [end.def.label, ...cassetteSpec(end)];
  if (end.bare) {
    parts.push('Plugged into: nothing');
  } else {
    const ports = [...end.patched];
    const cords = [...new Set(ports.map((p) => end.cordFor(p).label))];
    parts.push(`Patch cords: ${cords.join(' and ')}, ${cordSpec(end.cordFor(ports[0] ?? 1), end)}`);
    parts.push(`Plugged into: ${end.equipment.generic ? 'equipment ports' : `${end.equipment.label} optics`}`);
  }
  if (end.mount === 'inverted') parts.push('mounted upside down');
  return `${name}: ${parts.join(' · ')}`;
}

/** The parts list and result written under the drawing. */
export function summaryLines(link: ResolvedLink, result: LinkResult): string[] {
  const v = verdictText(result);
  const method = result.method ? METHOD_NAMES[result.method] : 'No standard method';
  const ok = result.channels.filter((c) => c.outcome === 'tx-to-rx').length;
  const count = !v.map && result.channels.length ? ` · ${ok} of ${result.channels.length} channels deliver Tx to Rx` : '';
  return [
    endLine('End A', link.left),
    `MPO cable: ${link.trunk.label} · ${trunkSpec(link)}`,
    endLine('End B', link.right),
    `Result: ${v.text} · ${method}${count}`,
  ];
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
