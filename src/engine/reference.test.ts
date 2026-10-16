import { describe, expect, it } from 'vitest';
import { MM, SM, cassetteEnd as cas, codes, link, opticEnd as optic, outcomes, run } from './testkit';

// Expected end-to-end results from docs/polarity-reference.md §8.
// Test names start with the reference ID so a failure points at the row.

describe('§8.1 expected PASS', () => {
  it('P-A: Method A, A-to-B one end, A-to-A the other', () => {
    const r = run(link(cas('cas-a-12', 'lc-ab'), { trunk: 'trunk-a-12', ...SM }, cas('cas-a-12', 'lc-aa')));
    expect(r.verdict).toBe('PASS');
    expect(r.method).toBe('A');
    expect(r.channels).toHaveLength(6);
    expect(r.channels.map((c) => c.farPort)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(codes(r)).toContain('a-to-a-method-a');
  });

  it('P-B: Method B, far cassette inverted (P-MB-INV)', () => {
    const r = run(link(cas('cas-b-12', 'lc-ab'), { trunk: 'trunk-b-12', ...MM }, cas('cas-b-12', 'lc-ab', { mount: 'inverted' })));
    expect(r.verdict).toBe('PASS');
    expect(r.method).toBe('B');
    // Panel position p → p, but the printed label reads 7 − p.
    expect(r.channels.map((c) => c.farPort)).toEqual([6, 5, 4, 3, 2, 1]);
  });

  it('P-B: Method B, B1/B2 pair (P-MB-B1B2, PARTIAL)', () => {
    const r = run(link(cas('cas-b-12', 'lc-ab'), { trunk: 'trunk-b-12', ...MM }, cas('cas-b2-12', 'lc-ab')));
    expect(r.verdict).toBe('PASS');
    expect(r.channels.map((c) => c.farPort)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(r.underReview.map((u) => u.id)).toContain('cas-b2-12');
  });

  it('P-C: Method C, Type C trunk, A-to-B both ends', () => {
    const r = run(link(cas('cas-a-12', 'lc-ab'), { trunk: 'trunk-c-12', ...SM }, cas('cas-a-12', 'lc-ab')));
    expect(r.verdict).toBe('PASS');
    expect(r.method).toBe('C');
  });

  it('P-U1: universal U1, Type B trunk, A-to-B both ends, port p → p', () => {
    const r = run(link(cas('cas-u1-12', 'lc-ab'), { trunk: 'trunk-b-12', ...SM }, cas('cas-u1-12', 'lc-ab')));
    expect(r.verdict).toBe('PASS');
    expect(r.method).toBe('U1');
    expect(r.channels.map((c) => c.farPort)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('P-U2 / P-U2-12: U2, Type B trunk, Type B adapters, UPC', () => {
    const r = run(link(cas('cas-u2-12', 'lc-ab'), { trunk: 'trunk-b-12', ...MM }, cas('cas-u2-12', 'lc-ab')));
    expect(r.verdict).toBe('PASS');
    expect(r.method).toBe('U2');
    expect(r.channels.map((c) => c.farPort)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('P-Direct12: SR4, DR4 and PSM4 each pass over a single Type B cable', () => {
    for (const [id, cable] of [
      ['qsfp28-100g-sr4', MM],
      ['qsfpdd-400g-dr4', SM],
      ['qsfp28-100g-psm4', SM],
    ] as const) {
      const r = run(link(optic(id), { trunk: 'trunk-b-12', ...cable }, optic(id)));
      expect(r.verdict, id).toBe('PASS');
      expect(r.channels, id).toHaveLength(4);
      // Tx {1–4} lands on Rx {12–9}, lane k on lane k.
      expect(r.channels.map((c) => c.forward.arrival), id).toEqual(
        [12, 11, 10, 9].map((pos, i) => ({ kind: 'optic', side: 'right', pos, role: 'rx', lane: i + 1 })),
      );
    }
  });

  it('P-Direct12: works over a Base-8 Type B trunk too', () => {
    expect(run(link(optic('qsfp28-100g-sr4'), { trunk: 'trunk-b-8', ...MM }, optic('qsfp28-100g-sr4'))).verdict).toBe('PASS');
  });

  it('P-SR4.2: 400G SR4.2 BiDi direct, Type B, UPC: TR k lands on RT k', () => {
    const r = run(link(optic('qsfpdd-400g-sr4.2'), { trunk: 'trunk-b-12', ...MM }, optic('qsfpdd-400g-sr4.2')));
    expect(r.verdict).toBe('PASS');
  });
});

describe('§8.2 / §8.4 expected FAIL, WARN, BLOCK', () => {
  it('F-1: Method A with A-to-B cords at both ends', () => {
    const r = run(link(cas('cas-a-12', 'lc-ab'), { trunk: 'trunk-a-12', ...SM }, cas('cas-a-12', 'lc-ab')));
    expect(r.verdict).toBe('FAIL');
    expect(new Set(outcomes(r))).toEqual(new Set(['tx-to-tx']));
  });

  it('F-2: Method A with A-to-A cords at both ends', () => {
    const r = run(link(cas('cas-a-12', 'lc-aa'), { trunk: 'trunk-a-12', ...SM }, cas('cas-a-12', 'lc-aa')));
    expect(r.verdict).toBe('FAIL');
    expect(new Set(outcomes(r))).toEqual(new Set(['tx-to-tx']));
  });

  it('F-3: Type A trunk directly between two SR4 optics', () => {
    const r = run(link(optic('qsfp28-100g-sr4'), { trunk: 'trunk-a-12', ...MM }, optic('qsfp28-100g-sr4')));
    expect(r.verdict).toBe('FAIL');
    expect(new Set(outcomes(r))).toEqual(new Set(['tx-to-tx']));
  });

  it('F-4: Type C trunk between two SR4 optics', () => {
    const r = run(link(optic('qsfp28-100g-sr4'), { trunk: 'trunk-c-12', ...MM }, optic('qsfp28-100g-sr4')));
    expect(r.verdict).toBe('FAIL');
  });

  it('F-5 (revised) / MB-01: two identical upright Method B cassettes → WARN, port p → 7 − p', () => {
    const r = run(link(cas('cas-b-12', 'lc-ab'), { trunk: 'trunk-b-12', ...MM }, cas('cas-b-12', 'lc-ab')));
    expect(r.verdict).toBe('WARN');
    expect(new Set(outcomes(r))).toEqual(new Set(['tx-to-rx']));
    expect(r.channels.map((c) => c.farPort)).toEqual([6, 5, 4, 3, 2, 1]);
    expect(r.channels.every((c) => c.verdict === 'WARN')).toBe(true);
  });

  it('F-6: U1 at one end, Type A cassette at the other, Type B trunk → split pairs', () => {
    const r = run(link(cas('cas-u1-12', 'lc-ab'), { trunk: 'trunk-b-12', ...SM }, cas('cas-a-12', 'lc-ab')));
    expect(r.verdict).toBe('FAIL');
    expect(outcomes(r)).toContain('split');
  });

  it('F-8: universal cassettes with a Type A trunk', () => {
    const r = run(link(cas('cas-u1-12', 'lc-ab'), { trunk: 'trunk-a-12', ...SM }, cas('cas-u1-12', 'lc-ab')));
    expect(r.verdict).toBe('FAIL');
  });

  it('F-9: U1 for breakout with A-to-B cords (see BO-01)', () => {
    const r = run(link(optic('qsfp28-100g-sr4'), { trunk: 'trunk-b-12', ...MM }, cas('cas-u1-12', 'lc-ab', { equipment: 'sfp28-25g-sr' })));
    expect(r.verdict).toBe('FAIL');
  });

  it('F-10: MPO-16 optic into an MPO-12 trunk → BLOCK, does not mate', () => {
    const r = run(link(optic('qsfpdd-400g-sr8'), { trunk: 'trunk-b-12', ...MM, polish: 'APC' }, optic('qsfpdd-400g-sr8')));
    expect(r.verdict).toBe('BLOCK');
    expect(codes(r)).toContain('footprint');
    expect(r.issues.find((i) => i.code === 'footprint')?.message).toMatch(/MPO-16 .* does not mate with MPO-12/);
  });

  it('F-10: MPO-16 cassette on an MPO-12 trunk → BLOCK', () => {
    const r = run(link(cas('cas-u1-16', 'lc-ab'), { trunk: 'trunk-b-12', ...SM }, cas('cas-u1-12', 'lc-ab')));
    expect(r.verdict).toBe('BLOCK');
  });

  it('F-11 / F-12: gender mismatches are a note and do not change the verdict', () => {
    const maleTrunk = run(link(cas('cas-u1-12', 'lc-ab'), { trunk: 'trunk-b-12', ...SM, gender: ['M', 'F'] }, cas('cas-u1-12', 'lc-ab')));
    expect(maleTrunk.verdict).toBe('PASS');
    expect(maleTrunk.issues.filter((i) => i.code === 'gender')).toEqual([expect.objectContaining({ severity: 'note', side: 'left' })]);

    const femaleCassette = run(link(cas('cas-u1-12', 'lc-ab', { rearGender: 'F' }), { trunk: 'trunk-b-12', ...SM }, cas('cas-u1-12', 'lc-ab')));
    expect(femaleCassette.verdict).toBe('PASS');
    expect(codes(femaleCassette)).toContain('gender');

    // F-12: a male trunk end into a (pinned) transceiver.
    const maleIntoOptic = run(link(optic('qsfp28-100g-sr4'), { trunk: 'trunk-b-12', ...MM, gender: ['M', 'F'] }, optic('qsfp28-100g-sr4')));
    expect(maleIntoOptic.verdict).toBe('PASS');
    expect(codes(maleIntoOptic)).toContain('gender');
  });

  it('F-13 / F-APC-1: key-up/key-up adapter with APC → BLOCK', () => {
    const r = run(link(cas('cas-b-12', 'lc-ab'), { trunk: 'trunk-b-12', ...SM }, cas('cas-b-12', 'lc-ab', { mount: 'inverted' })));
    expect(r.verdict).toBe('BLOCK');
    expect(codes(r)).toContain('apc-key-up-up');
  });

  it('F-APC-2: U2 preset with polish = APC → BLOCK', () => {
    const r = run(link(cas('cas-u2-12', 'lc-ab'), { trunk: 'trunk-b-12', ...SM }, cas('cas-u2-12', 'lc-ab')));
    expect(r.verdict).toBe('BLOCK');
  });

  it('F-APC-3: APC mated to UPC → BLOCK', () => {
    const r = run(link(cas('cas-u1-12', 'lc-ab', { polish: 'UPC' }), { trunk: 'trunk-b-12', ...SM }, cas('cas-u1-12', 'lc-ab')));
    expect(r.verdict).toBe('BLOCK');
    expect(codes(r)).toContain('polish-mismatch');

    const optics = run(link(optic('qsfp28-100g-sr4'), { trunk: 'trunk-b-12', fibre: 'MMF', polish: 'APC' }, optic('qsfp28-100g-sr4')));
    expect(optics.verdict).toBe('BLOCK');
  });

  it('APC is fine with a Type B trunk: the reversal is inside the cable (§3.1)', () => {
    const r = run(link(optic('qsfpdd-400g-dr4'), { trunk: 'trunk-b-12', ...SM }, optic('qsfpdd-400g-dr4')));
    expect(r.verdict).toBe('PASS');
  });

  it('F-U1U2-MIX: U1 one end, U2 the other → WARN mixed methods (UPC); BLOCK on APC', () => {
    const upc = run(link(cas('cas-u1-12', 'lc-ab'), { trunk: 'trunk-b-12', ...MM }, cas('cas-u2-12', 'lc-ab')));
    expect(upc.verdict).toBe('WARN');
    expect(new Set(outcomes(upc))).toEqual(new Set(['tx-to-rx']));
    expect(codes(upc)).toContain('mixed-method');

    const apc = run(link(cas('cas-u1-12', 'lc-ab'), { trunk: 'trunk-b-12', ...SM }, cas('cas-u2-12', 'lc-ab')));
    expect(apc.verdict).toBe('BLOCK');
  });

  it('F-SR1.2-SRBD: 100G SR1.2 ↔ 40/100G SR BiDi → FAIL (non-interoperable optics)', () => {
    const r = run(
      link(
        cas('cas-u1-12', 'lc-ab', { equipment: 'qsfp28-100g-sr1.2' }),
        { trunk: 'trunk-b-12', ...MM },
        cas('cas-u1-12', 'lc-ab', { equipment: 'qsfp-40-100g-srbd' }),
      ),
    );
    expect(r.verdict).toBe('FAIL');
    expect(new Set(outcomes(r))).toEqual(new Set(['tx-to-rx']));
    expect(codes(r)).toContain('interop');
  });

  it('Modified Method A: one pair-flipped (AF) cassette lets Method A use standard cords (§4.2)', () => {
    const r = run(link(cas('cas-a-12', 'lc-ab'), { trunk: 'trunk-a-12', ...SM }, cas('cas-af-12', 'lc-ab')));
    expect(r.verdict).toBe('PASS');
    expect(r.method).toBe('A-modified');
  });
});

describe('§8.3 / §8.4 provisional: derived 16F and 24F maps (failures here point at data, not logic)', () => {
  it('P-U1-16: U1-16 both ends, Type B 16F trunk → port p → p', () => {
    const r = run(link(cas('cas-u1-16', 'lc-ab'), { trunk: 'trunk-b-16', ...SM }, cas('cas-u1-16', 'lc-ab')));
    expect(r.verdict).toBe('PASS');
    expect(r.channels.map((c) => c.farPort)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('P-U1-24: U1-24 both ends, Type B 24F trunk → port p → p', () => {
    const r = run(link(cas('cas-u1-24', 'lc-ab'), { trunk: 'trunk-b-24', ...SM }, cas('cas-u1-24', 'lc-ab')));
    expect(r.verdict).toBe('PASS');
    expect(r.channels.map((c) => c.farPort)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('P-U1-24-16F: MPO-24 · 16F cassette both ends, Type B 24F trunk → 8 ports p → p', () => {
    const r = run(link(cas('cas-u1-24-16f', 'lc-ab'), { trunk: 'trunk-b-24', ...SM }, cas('cas-u1-24-16f', 'lc-ab')));
    expect(r.verdict).toBe('PASS');
    expect(r.channels.map((c) => c.farPort)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  // The reference row says FAIL, but its own trace (§4.3a b) lands Tx on Rx at
  // port 13 − p. Light OK + wrong port is WARN everywhere else (§4.5 tool rule,
  // F-5 revised), so the engine applies that rule. Raised with the owner.
  it('F-U1-24-A: U1-24 with a 24F Type A trunk → port p → 13 − p (WARN: port renumbering)', () => {
    const r = run(link(cas('cas-u1-24', 'lc-ab'), { trunk: 'trunk-a-24', ...SM }, cas('cas-u1-24', 'lc-ab')));
    expect(r.verdict).toBe('WARN');
    expect(r.channels.map((c) => c.farPort)).toEqual([12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
    expect(new Set(outcomes(r))).toEqual(new Set(['tx-to-rx']));
  });

  it('F-U1-24ROW: per-row 24F pairing with a Type B 24F trunk → port p → p + 6', () => {
    const r = run(link(cas('cas-u1-24-row', 'lc-ab'), { trunk: 'trunk-b-24', ...SM }, cas('cas-u1-24-row', 'lc-ab')));
    expect(['WARN', 'FAIL']).toContain(r.verdict);
    expect(r.channels.map((c) => c.farPort)).toEqual([7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6]);
  });

  it('F-24STRAIGHT: straight 24F cassettes, 24F Type A trunk → FAIL, no crossover, port p → p + 6', () => {
    const r = run(link(cas('cas-a-24', 'lc-ab'), { trunk: 'trunk-a-24', ...SM }, cas('cas-a-24', 'lc-ab')));
    expect(r.verdict).toBe('FAIL');
    expect(r.channels.map((c) => c.farPort)).toEqual([7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6]);
    expect(new Set(outcomes(r))).toEqual(new Set(['tx-to-tx']));
  });

  it('§4.5 straight 24F, Type B 24F trunk → port p → 13 − p, crossed', () => {
    const r = run(link(cas('cas-a-24', 'lc-ab'), { trunk: 'trunk-b-24', ...SM }, cas('cas-a-24', 'lc-ab')));
    expect(r.channels.map((c) => c.farPort)).toEqual([12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
    expect(new Set(outcomes(r))).toEqual(new Set(['tx-to-rx']));
  });
});

describe('dark fibres', () => {
  it('12F cassettes over a Base-8 trunk: ports on positions 5–8 are dark', () => {
    const r = run(link(cas('cas-u1-12', 'lc-ab'), { trunk: 'trunk-b-8', ...SM }, cas('cas-u1-12', 'lc-ab')));
    expect(r.verdict).toBe('FAIL');
    // U1 port 5 = MPO 5 + 8, port 6 = MPO 6 + 7.
    expect(r.channels.filter((c) => c.outcome === 'dark').map((c) => c.label)).toEqual(['Port 5', 'Port 6']);
  });

  it('only patched ports become channels', () => {
    const r = run(link(cas('cas-u1-12', 'lc-ab', { patchedPorts: [1, 2] }), { trunk: 'trunk-b-12', ...SM }, cas('cas-u1-12', 'lc-ab')));
    expect(r.channels.map((c) => c.label)).toEqual(['Port 1', 'Port 2']);
    expect(r.verdict).toBe('PASS');
  });
});

describe('media checks', () => {
  it('IO-16: multimode optics on singlemode fibre → FAIL', () => {
    const r = run(link(optic('qsfp28-100g-sr4'), { trunk: 'trunk-b-12', fibre: 'SMF', polish: 'UPC' }, optic('qsfp28-100g-sr4')));
    expect(r.verdict).toBe('FAIL');
    expect(codes(r)).toContain('fibre-type');
  });

  it('a duplex singlemode optic on a multimode cassette → FAIL', () => {
    const r = run(link(cas('cas-u1-12', 'lc-ab', { equipment: 'sfp-10g-lr' }), { trunk: 'trunk-b-12', ...MM }, cas('cas-u1-12', 'lc-ab', { equipment: 'sfp-10g-lr' })));
    expect(codes(r)).toContain('fibre-type');
    expect(r.verdict).toBe('FAIL');
  });

  it('a duplex optic cannot plug straight into the MPO trunk', () => {
    const r = run(link(optic('sfp-10g-sr'), { trunk: 'trunk-b-12', ...MM }, optic('sfp-10g-sr')));
    expect(r.verdict).toBe('BLOCK');
    expect(codes(r)).toContain('unsupported-connector');
  });
});
