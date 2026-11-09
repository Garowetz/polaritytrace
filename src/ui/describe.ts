import type { DuplexCordDef, Fibre, LinkResult, Polish } from '../engine';
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

export const footprintLabel = (positions: number, lit: number) => `MPO-${positions} · ${lit}F`;
export const fibreWord = (f: Fibre) => (f === 'SMF' ? 'Singlemode' : 'Multimode');
export const polishWord = (p: Polish, f: Fibre) => (p === 'UPC' && f === 'MMF' ? 'PC/UPC' : p);
const genderWord = (g: 'M' | 'F') => (g === 'M' ? 'male' : 'female');

export function cassetteSpec(end: ResolvedCassetteEnd): string {
  const d = end.def;
  return `${footprintLabel(d.positions, d.litPositions.length)} ${polishWord(end.polish, end.fibre)} ${genderWord(end.rearGender)} → ${d.frontMap.length} × ${d.frontConnector}`;
}

export function trunkSpec(link: ResolvedLink): string {
  const t = link.trunk;
  return `${footprintLabel(t.positions, t.litPositions.length)} · ${fibreWord(link.fibre)} · ${polishWord(link.polish, link.fibre)} · ${link.trunkGender.join('/')}`;
}

export const cordSpec = (cord: DuplexCordDef) => `${cord.ends.cassette} to ${cord.ends.equipment} patch cords`;

function endLine(name: string, end: ResolvedEnd): string {
  if (end.kind === 'mpoOptic') return `${name}: ${end.def.label} (${end.def.connector}${end.def.fibre ? `, ${fibreWord(end.def.fibre)}` : ''})`;
  const parts = [`${end.def.label} (${cassetteSpec(end)})`];
  if (end.bare) {
    parts.push('nothing plugged in');
  } else {
    const ports = [...end.patched];
    const cords = [...new Set(ports.map((p) => end.cordFor(p).label))];
    const c = end.cordFor(ports[0] ?? 1);
    parts.push(`${cords.join(' and ')} patch cords (${c.ends.cassette} to ${c.ends.equipment})`);
    parts.push(end.equipment.generic ? 'equipment ports' : `${end.equipment.label} optics`);
  }
  if (end.mount === 'inverted') parts.push('mounted upside down');
  return `${name}: ${parts.join(', ')}`;
}

/** The parts list and result written under the drawing. */
export function summaryLines(link: ResolvedLink, result: LinkResult): string[] {
  const v = verdictText(result);
  const method = result.method ? METHOD_NAMES[result.method] : 'No standard method';
  const ok = result.channels.filter((c) => c.outcome === 'tx-to-rx').length;
  const count = !v.map && result.channels.length ? ` · ${ok} of ${result.channels.length} channels deliver Tx to Rx` : '';
  return [
    endLine('End A', link.left),
    `MPO cable: ${link.trunk.label} (${trunkSpec(link)})`,
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
