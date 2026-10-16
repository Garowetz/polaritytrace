import type { FecMode, Issue, OpticDef } from './types';

// Optic-to-optic interoperability (reference §3-3). Separate from polarity:
// light can land perfectly and the link still won't come up.

export interface InteropResult {
  verdict: 'PASS' | 'WARN' | 'FAIL';
  issues: Issue[];
}

const isParallel = (o: OpticDef) => o.connector !== 'LC' && o.connector !== 'none';
const isBidi = (o: OpticDef) => o.wavelengthScheme === 'bidi2';
const fibreName = (f: string | null) => (f === 'MMF' ? 'multimode' : 'singlemode');

function mismatchReason(a: OpticDef, b: OpticDef): string {
  if (a.fibre && b.fibre && a.fibre !== b.fibre) return `${fibreName(a.fibre)} and ${fibreName(b.fibre)} optics cannot work together`;
  if (isBidi(a) !== isBidi(b)) return 'BiDi and non-BiDi optics do not interoperate';
  if (isBidi(a) && isBidi(b)) return 'these two BiDi families do not interoperate';
  if (a.wavelengthScheme && b.wavelengthScheme && a.wavelengthScheme !== b.wavelengthScheme) {
    return `they use different wavelength schemes (${a.wavelengthScheme} vs ${b.wavelengthScheme})`;
  }
  if (a.modulation && b.modulation && a.modulation !== b.modulation) return 'NRZ and PAM4 lanes do not interoperate';
  if (a.laneRateGbps && b.laneRateGbps && a.laneRateGbps !== b.laneRateGbps) {
    return `their lane rates differ (${a.laneRateGbps}G vs ${b.laneRateGbps}G per lane)`;
  }
  return 'they are not listed as interoperable';
}

function fail(a: OpticDef, b: OpticDef, extra: Issue[] = []): InteropResult {
  return {
    verdict: 'FAIL',
    issues: [{ severity: 'fail', code: 'interop', message: `${a.label} and ${b.label} will not link: ${mismatchReason(a, b)}.` }, ...extra],
  };
}

export interface InteropOptions {
  fecA?: FecMode;
  fecB?: FecMode;
}

export function checkInterop(a: OpticDef, b: OpticDef, opts: InteropOptions = {}): InteropResult {
  if (a.generic || b.generic) return { verdict: 'PASS', issues: [] };

  const fecA = opts.fecA ?? a.fec;
  const fecB = opts.fecB ?? b.fec;
  const fecIssues: Issue[] =
    fecA && fecB && fecA !== fecB
      ? [{ severity: 'fail', code: 'fec', message: `FEC mismatch (${fecA} vs ${fecB}). Use the same FEC mode at both ends.` }]
      : [];
  const withFec = (r: InteropResult): InteropResult =>
    fecIssues.length ? { verdict: 'FAIL', issues: [...r.issues, ...fecIssues] } : r;

  // Duplex ↔ duplex, or parallel ↔ parallel of the same kind: same group.
  if (isParallel(a) === isParallel(b) && a.interopGroup === b.interopGroup && a.connector === b.connector) {
    return withFec({ verdict: 'PASS', issues: [] });
  }

  // Breakout: a parallel optic feeding several smaller optics.
  const feeds = (x: OpticDef, y: OpticDef) => x.breakout?.some((t) => t.group === y.interopGroup) ?? false;
  let pair: [OpticDef, OpticDef] | null = null;
  if (isParallel(a) && !isParallel(b)) pair = [a, b];
  else if (isParallel(b) && !isParallel(a)) pair = [b, a];
  else if (isParallel(a) && isParallel(b)) pair = feeds(a, b) ? [a, b] : feeds(b, a) ? [b, a] : null;
  if (pair) {
    const [p, d] = pair;
    if (p.breakoutSupported === false) {
      return {
        verdict: 'FAIL',
        issues: [{ severity: 'fail', code: 'interop', message: `${p.label} does not support breakout. Check the optic's datasheet.` }],
      };
    }
    const target = p.breakout?.find((t) => t.group === d.interopGroup);
    if (target) {
      const issues: Issue[] = [
        target.verdict === 'WARN'
          ? { severity: 'warn', code: 'interop-platform', message: target.note }
          : { severity: 'note', code: 'interop-conditions', message: target.note },
      ];
      return withFec({ verdict: target.verdict, issues });
    }
    const vendor: Issue[] = p.vendorModeNote ? [{ severity: 'note', code: 'vendor-mode', message: p.vendorModeNote }] : [];
    return fail(p, d, vendor);
  }
  return fail(a, b);
}

/** Optics outside v1 scope stay in the data but are flagged (reference §3-5 R3-O5, owner scope note). */
export function scopeIssues(o: OpticDef): Issue[] {
  if (o.inV1) return [];
  const why = o.connector === '2xMPO-12' ? 'Twin-MPO optics are' : 'This optic is';
  return [{ severity: 'warn', code: 'scope', message: `${why} outside the scope of this version (${o.label}).` }];
}
