import type { ResolvedCassetteEnd, ResolvedLink } from './resolve';
import type { CassetteDef, Issue, MethodId, Mode, Side } from './types';

// Recognises which TIA method a link is built as (reference §8.1, TIA FOTC
// component sets) and adds the method-level warnings: mixed methods and
// non-standard A-to-A cords.

const straightA = (c: CassetteDef) => c.transition === 'straight' && c.rearAdapter === 'A';
const methodBFront = (c: CassetteDef) => c.rearAdapter === 'B' && ['straight', 'B2', 'BN'].includes(c.transition);
const isU1 = (c: CassetteDef) => c.transition === 'U1' && c.rearAdapter === 'A';
const isU2 = (c: CassetteDef) => c.transition === 'U2' && c.rearAdapter === 'B';
const sideName = (s: Side) => (s === 'left' ? 'End A' : 'End B');

export function detectMethod(link: ResolvedLink, mode: Mode): MethodId | null {
  const t = link.trunk.polarity;
  if (mode === 'parallel') return t === 'B' ? 'direct-B' : null;
  if (mode === 'breakout') {
    const k = (link.left.kind === 'cassette' ? link.left : link.right) as ResolvedCassetteEnd;
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
        mode === 'breakout'
          ? ' Through a trunk, U1 and U2 cassettes both need A-to-A cords for breakout.'
          : '';
      issues.push({
        severity: 'warn',
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
