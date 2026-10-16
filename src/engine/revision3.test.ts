import { describe, expect, it } from 'vitest';
import { MM, cassetteEnd as cas, codes, link, opticEnd as optic, outcomes, run } from './testkit';
import type { EndConfig, LinkConfig } from './types';

// Revision 3 unit-test channels, docs/polarity-reference.md §3-4.

const SR4 = optic('qsfp28-100g-sr4');
const B = { trunk: 'trunk-b-12', ...MM };
const A = { trunk: 'trunk-a-12', ...MM };
const u = (id: string, cord: string) => cas(id, cord, { equipment: 'sfp28-25g-sr', patchedPorts: [1, 2, 3, 4] });

/** Build both orientations (optic left, optic right) so direction never matters. */
function both(o: EndConfig, cable: typeof A, k: EndConfig): LinkConfig[] {
  return [link(o, cable, k), link(k, cable, o)];
}

describe('§3-1 breakout: SR4 → trunk → cassette → duplex cord → duplex optic', () => {
  it('BO-01: Type B trunk, U1, A-to-B → FAIL (Tx→Tx)', () => {
    for (const cfg of both(SR4, B, u('cas-u1-12', 'lc-ab'))) {
      const r = run(cfg);
      expect(r.verdict).toBe('FAIL');
      expect(new Set(outcomes(r))).toEqual(new Set(['tx-to-tx']));
    }
  });

  it('BO-02: Type B trunk, U1, A-to-A → PASS + WARN (non-standard cord)', () => {
    for (const cfg of both(SR4, B, u('cas-u1-12', 'lc-aa'))) {
      const r = run(cfg);
      expect(r.verdict).toBe('WARN');
      expect(new Set(outcomes(r))).toEqual(new Set(['tx-to-rx']));
      expect(codes(r)).toContain('non-standard-cord');
      expect(codes(r)).not.toContain('mixed-method');
    }
  });

  it('BO-03: Type B trunk, U2, A-to-B → FAIL (Tx→Tx)', () => {
    for (const cfg of both(SR4, B, u('cas-u2-12', 'lc-ab'))) {
      const r = run(cfg);
      expect(r.verdict).toBe('FAIL');
      expect(new Set(outcomes(r))).toEqual(new Set(['tx-to-tx']));
    }
  });

  it('BO-04: Type B trunk, U2, A-to-A → PASS + WARN', () => {
    for (const cfg of both(SR4, B, u('cas-u2-12', 'lc-aa'))) {
      const r = run(cfg);
      expect(r.verdict).toBe('WARN');
      expect(new Set(outcomes(r))).toEqual(new Set(['tx-to-rx']));
      expect(codes(r)).toContain('non-standard-cord');
    }
  });

  it('BO-05: Type A trunk, U1, A-to-B → PASS + WARN (mixed method)', () => {
    for (const cfg of both(SR4, A, u('cas-u1-12', 'lc-ab'))) {
      const r = run(cfg);
      expect(r.verdict).toBe('WARN');
      expect(new Set(outcomes(r))).toEqual(new Set(['tx-to-rx']));
      expect(codes(r)).toContain('mixed-method');
    }
  });

  it('BO-06: Type A trunk, U2, A-to-B → PASS + WARN (mixed method)', () => {
    for (const cfg of both(SR4, A, u('cas-u2-12', 'lc-ab'))) {
      const r = run(cfg);
      expect(r.verdict).toBe('WARN');
      expect(codes(r)).toContain('mixed-method');
    }
  });

  it('BO-07: Type A trunk, U1/U2, A-to-A → FAIL', () => {
    for (const id of ['cas-u1-12', 'cas-u2-12']) {
      for (const cfg of both(SR4, A, u(id, 'lc-aa'))) expect(run(cfg).verdict, id).toBe('FAIL');
    }
  });

  it('BO-08: any trunk, straight cassette (Type A or B adapter), any cord → FAIL (lane split)', () => {
    for (const trunk of [A, B]) {
      for (const id of ['cas-a-12', 'cas-b-12']) {
        for (const cord of ['lc-ab', 'lc-aa']) {
          for (const cfg of both(SR4, trunk, u(id, cord))) {
            const r = run(cfg);
            expect(r.verdict, `${trunk.trunk} ${id} ${cord}`).toBe('FAIL');
            expect(outcomes(r).every((o) => o !== 'tx-to-rx'), `${trunk.trunk} ${id} ${cord}`).toBe(true);
          }
        }
      }
    }
  });

  it('BO-09: in every PASS case lane k ↔ port k and ports 5–6 are dark', () => {
    const passing = [
      ...both(SR4, B, u('cas-u1-12', 'lc-aa')),
      ...both(SR4, B, u('cas-u2-12', 'lc-aa')),
      ...both(SR4, A, u('cas-u1-12', 'lc-ab')),
      ...both(SR4, A, u('cas-u2-12', 'lc-ab')),
    ];
    for (const cfg of passing) {
      const r = run(cfg);
      expect(r.channels.map((c) => c.farPort)).toEqual([1, 2, 3, 4]);
      expect(r.darkPorts.map((d) => d.port)).toEqual([5, 6]);
    }
  });

  it('BO-02 trace matches §3-1 case (a)(i) step by step', () => {
    const r = run(link(SR4, B, u('cas-u1-12', 'lc-aa')));
    const lane2 = r.channels[1];
    expect(lane2.forward.hops).toEqual([
      { at: 'optic', side: 'left', pos: 2, role: 'tx', lane: 2 },
      { at: 'trunk', side: 'left', pos: 11 }, // R k → P 13 − k
      { at: 'trunk', side: 'right', pos: 2 }, // Type B trunk
      { at: 'internal', side: 'right', pos: 2 }, // Type A rear adapter
      { at: 'front', side: 'right', port: 2, pos: 'A', slot: 2 }, // U1: port k, Position A
      { at: 'equipment', side: 'right', port: 2, pos: 'A', role: 'rx' }, // A-to-A → optic A = Rx
    ]);
    // Return: far optic Tx (B) → cassette B = I 13 − k → … → SR4 Rx lane k.
    expect(lane2.back.arrival).toEqual({ kind: 'optic', side: 'left', pos: 11, role: 'rx', lane: 2 });
  });
});

describe('§3-2 Method B variants', () => {
  const B1 = cas('cas-b-12', 'lc-ab');

  it('MB-01: identical upright straight cassettes → WARN (port p → 7 − p)', () => {
    const r = run(link(B1, B, cas('cas-b-12', 'lc-ab')));
    expect(r.verdict).toBe('WARN');
    expect(r.channels.map((c) => c.farPort)).toEqual([6, 5, 4, 3, 2, 1]);
  });

  it('MB-02: far cassette inverted → PASS', () => {
    expect(run(link(B1, B, cas('cas-b-12', 'lc-ab', { mount: 'inverted' }))).verdict).toBe('PASS');
  });

  it('MB-03: B1 + B2 (11,12,9,10 …) → PASS, p → p', () => {
    const r = run(link(B1, B, cas('cas-b2-12', 'lc-ab')));
    expect(r.verdict).toBe('PASS');
    expect(r.channels.map((c) => c.farPort)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('MB-04: B1 + plain reversal (12 … 1), A-B front adapters → FAIL (Tx→Tx)', () => {
    const r = run(link(B1, B, cas('cas-bn-12', 'lc-ab')));
    expect(r.verdict).toBe('FAIL');
    expect(new Set(outcomes(r))).toEqual(new Set(['tx-to-tx']));
  });

  it('MB-05: B1 + plain reversal, B-A front adapters → PASS', () => {
    const r = run(link(B1, B, cas('cas-bn-12', 'lc-ab', { frontOrientation: 'B-A' })));
    expect(r.verdict).toBe('PASS');
    expect(r.channels.map((c) => c.farPort)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('MB-06: B1 + B2 over a Type A trunk → FAIL (port 7 − p, even inversions)', () => {
    const r = run(link(B1, A, cas('cas-b2-12', 'lc-ab')));
    expect(r.verdict).toBe('FAIL');
    expect(r.channels.map((c) => c.farPort)).toEqual([6, 5, 4, 3, 2, 1]);
    expect(new Set(outcomes(r))).toEqual(new Set(['tx-to-tx']));
  });
});
