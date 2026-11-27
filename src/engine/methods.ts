import { adapterMap, apply, identity, pairFlipped, reversed } from './maps';
import type { ResolvedCassetteEnd, ResolvedLink, ResolvedOpticEnd, ResolvedPanel } from './resolve';
import type { CassetteDef, Issue, MethodId, Mode, PolarityType, PosMap, Side } from './types';

// Recognises which TIA method a link is built as (reference §8.1, TIA FOTC
// component sets) and adds the method-level warnings: mixed methods and
// non-standard A-to-A cords.

const straightA = (c: CassetteDef) => c.transition === 'straight' && c.rearAdapter === 'A';
const methodBFront = (c: CassetteDef) => c.rearAdapter === 'B' && ['straight', 'B2', 'BN'].includes(c.transition);
const isU1 = (c: CassetteDef) => c.transition === 'U1' && c.rearAdapter === 'A';
const isU2 = (c: CassetteDef) => c.transition === 'U2' && c.rearAdapter === 'B';
const isStacked = (c: CassetteDef) => c.transition === 'stacked' && c.rearAdapter === 'A';
const sideName = (s: Side) => (s === 'left' ? 'End A' : 'End B');

const panelOf = (link: ResolvedLink, s: Side): ResolvedPanel | undefined =>
  link[s].kind === 'mpoOptic' ? (link[s] as ResolvedOpticEnd).panel : undefined;

/**
 * TIA array methods (reference §8.1 P-ArrA/B/C): an adapter panel and patch
 * cord at both ends. The parts must match the TIA component sets exactly.
 */
function arrayMethod(t: PolarityType, l: ResolvedPanel, r: ResolvedPanel): MethodId | null {
  const cords = [l.cord.polarity, r.cord.polarity].sort().join('');
  const adapters = l.adapter + r.adapter;
  if (t === 'A' && adapters === 'AA' && cords === 'AB') return 'array-A';
  if (t === 'B' && adapters === 'BB' && cords === 'BB') return 'array-B';
  if (t === 'C' && adapters === 'AA' && cords === 'BC') return 'array-C';
  return null;
}

const same = (a: PosMap, b: PosMap) => a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * What a patch cord, panel adapter and trunk add up to, seen from the optic,
 * as a single-row cable type. Null when it matches none (or on MPO-24).
 */
function effectiveType(link: ResolvedLink, panel: ResolvedPanel, side: Side): PolarityType | null {
  const n = link.trunk.positions;
  if (n > 16 || panel.cord.positions !== n) return null;
  const trunk = (i: number) => (side === 'left' ? apply(link.trunk.map, i) : link.trunk.map.indexOf(i) + 1);
  const total = identity(n).map((i) => trunk(apply(adapterMap(panel.adapter, n), apply(panel.cord.map, i))));
  if (same(total, identity(n))) return 'A';
  if (same(total, reversed(n))) return 'B';
  if (same(total, pairFlipped(n))) return 'C';
  return null;
}

export function detectMethod(link: ResolvedLink, mode: Mode): MethodId | null {
  const t = link.trunk.polarity;
  // Two-row MPO-24 optics (SR10) pair each lane top over bottom, so the
  // row-swapping Type A 24F cable is the straight-through recipe (reference §6.9).
  const twoRow = link.trunk.positions === 24;
  const pl = panelOf(link, 'left');
  const pr = panelOf(link, 'right');
  if (mode === 'parallel') {
    if (pl && pr) return arrayMethod(t, pl, pr);
    // A panel at one end only is not a TIA set.
    if (pl || pr) return null;
    return t === 'B' ? 'direct-B' : t === 'A' && twoRow ? 'direct-A24' : null;
  }
  if (mode === 'breakout') {
    const kSide: Side = link.left.kind === 'cassette' ? 'left' : 'right';
    const k = link[kSide] as ResolvedCassetteEnd;
    const panel = panelOf(link, kSide === 'left' ? 'right' : 'left');
    // Through a panel, the cord, adapter and trunk together must act as the
    // Type B cable the universal breakout expects.
    if (panel) {
      const eff = effectiveType(link, panel, kSide === 'left' ? 'right' : 'left');
      return eff === 'B' && (isU1(k.def) || isU2(k.def)) ? 'breakout-U' : null;
    }
    if (t === 'A' && twoRow && isStacked(k.def)) return 'breakout-A24';
    return t === 'B' && (isU1(k.def) || isU2(k.def)) ? 'breakout-U' : null;
  }
  const L = (link.left as ResolvedCassetteEnd).def;
  const R = (link.right as ResolvedCassetteEnd).def;
  if (t === 'A' && straightA(L) && straightA(R)) return 'A';
  if (t === 'A' && ((L.transition === 'AF' && straightA(R)) || (R.transition === 'AF' && straightA(L)))) return 'A-modified';
  if (t === 'B' && methodBFront(L) && methodBFront(R)) return 'B';
  if (t === 'C' && straightA(L) && straightA(R)) return 'C';
  if (t === 'B' && isU1(L) && isU1(R)) return 'U1';
  if (t === 'B' && isU2(L) && isU2(R)) return 'U2';
  return null;
}

export const METHOD_NAMES: Record<MethodId, string> = {
  A: 'TIA Method A',
  'A-modified': 'Modified Method A (pair-flipped cassette)',
  B: 'TIA Method B',
  C: 'TIA Method C',
  U1: 'TIA Method U1 (universal)',
  U2: 'TIA Method U2 (universal)',
  'direct-B': 'Direct parallel link, Type B',
  'breakout-U': 'Breakout through a universal cassette',
  'direct-A24': 'Direct parallel link, MPO-24 Type A (rows swap)',
  'breakout-A24': 'Breakout over an MPO-24 Type A cable',
  'array-A': 'TIA Method A (parallel, adapter panels)',
  'array-B': 'TIA Method B (parallel, adapter panels)',
  'array-C': 'TIA Method C (parallel, adapter panels)',
};

export function methodIssues(link: ResolvedLink, mode: Mode, method: MethodId | null, lightOk: boolean): Issue[] {
  const issues: Issue[] = [];
  for (const side of ['left', 'right'] as const) {
    const end = link[side];
    if (end.kind !== 'cassette') continue;
    const usesAA = [...end.patched].some((p) => end.cordFor(p).map === 'A-to-A');
    if (!usesAA) continue;
    if (method === 'A') {
      issues.push({
        severity: 'note',
        code: 'a-to-a-method-a',
        side,
        message: `The ${sideName(side)} A-to-A cords are what Method A needs at one end. TIA says to label them clearly.`,
      });
    } else {
      const why =
        method === 'breakout-A24'
          ? " Which fibre of each module port is A is assumed (top row); check the module's drawing."
          : mode === 'breakout'
            ? ' Through a trunk, U1 and U2 cassettes both need A-to-A cords for breakout.'
            : '';
      issues.push({
        // Owner's call: A-to-A at one end is normal practice, so a note, not a warning.
        severity: 'note',
        code: 'non-standard-cord',
        side,
        message: `Non-standard A-to-A cords at ${sideName(side)}. Label them clearly so they are not swapped for standard cords.${why}`,
      });
    }
  }
  if (method === null && lightOk) {
    issues.push({
      severity: 'warn',
      code: 'mixed-method',
      message:
        'The light lands correctly, but this link mixes parts from different polarity methods. ' +
        'TIA and test-equipment makers advise against mixing methods: it is easy to get wrong when parts are replaced.',
    });
  }
  return issues;
}
