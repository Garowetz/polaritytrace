import { describe, expect, it } from 'vitest';
import { SM, cassetteEnd as cas, codes, link, opticEnd as optic, outcomes, run } from './testkit';

// MPO-16 for 800G (owner decision 2026-10-16). Same algebra as the MPO-12
// revision 3 cases, with N = 16: lane k Tx at k, Rx at 17 − k (reference §6.3),
// receptacle i ↔ plug 17 − i (§3-1 rule 5), Type B 16F trunk f(i) = 17 − i (§2.5).

const DR8 = optic('osfp-800g-dr8');
const B16 = { trunk: 'trunk-b-16', ...SM };
const A16 = { trunk: 'trunk-a-16', ...SM };
const module = (cord: string) => cas('cas-u1-16-cs', cord, { equipment: 'qsfp28-100g-dr' });

describe('800G DR8 on MPO-16', () => {
  it('direct over a Type B 16F cable → PASS, Tx 1–8 lands on Rx 16–9', () => {
    const r = run(link(DR8, B16, DR8));
    expect(r.verdict).toBe('PASS');
    expect(r.channels).toHaveLength(8);
    expect(r.channels.map((c) => (c.forward.arrival.kind === 'optic' ? c.forward.arrival.pos : 0))).toEqual([16, 15, 14, 13, 12, 11, 10, 9]);
  });

  it('direct over a Type A 16F cable → FAIL (Tx on Tx)', () => {
    const r = run(link(DR8, A16, DR8));
    expect(r.verdict).toBe('FAIL');
    expect(new Set(outcomes(r))).toEqual(new Set(['tx-to-tx']));
  });

  it('into an MPO-12 trunk → BLOCK, does not mate', () => {
    const r = run(link(DR8, { trunk: 'trunk-b-12', ...SM }, DR8));
    expect(r.verdict).toBe('BLOCK');
    expect(codes(r)).toContain('footprint');
  });

  it('breakout through a Type B 16F trunk and the CS module with standard cords → FAIL (Tx→Tx)', () => {
    for (const cfg of [link(DR8, B16, module('cs-lc-ab')), link(module('cs-lc-ab'), B16, DR8)]) {
      const r = run(cfg);
      expect(r.verdict).toBe('FAIL');
      expect(new Set(outcomes(r))).toEqual(new Set(['tx-to-tx']));
    }
  });

  it('same with A-to-A cords → PASS + WARN, lane k ↔ port k, all 8 ports lit', () => {
    for (const cfg of [link(DR8, B16, module('cs-lc-aa')), link(module('cs-lc-aa'), B16, DR8)]) {
      const r = run(cfg);
      expect(r.verdict).toBe('WARN');
      expect(new Set(outcomes(r))).toEqual(new Set(['tx-to-rx']));
      expect(r.channels.map((c) => c.farPort)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      expect(r.darkPorts).toEqual([]);
      expect(codes(r)).toContain('non-standard-cord');
    }
  });

  it('module to module over a Type B 16F trunk with standard cords → PASS, port p → p', () => {
    const r = run(link(cas('cas-u1-16-cs', 'cs-ab'), B16, cas('cas-u1-16-cs', 'cs-ab')));
    expect(r.verdict).toBe('PASS');
    expect(r.channels.map((c) => c.farPort)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe('duplex connector fit', () => {
  it('an LC cord on the CS module → BLOCK', () => {
    const r = run(link(DR8, B16, cas('cas-u1-16-cs', 'lc-aa', { equipment: 'qsfp28-100g-dr' })));
    expect(r.verdict).toBe('BLOCK');
    expect(codes(r)).toContain('duplex-connector');
  });

  it('a CS-to-CS cord into an LC optic → BLOCK', () => {
    const r = run(link(DR8, B16, cas('cas-u1-16-cs', 'cs-aa', { equipment: 'qsfp28-100g-dr' })));
    expect(r.verdict).toBe('BLOCK');
  });

  it('the generic equipment port takes any duplex connector', () => {
    expect(run(link(cas('cas-u1-16-cs', 'cs-ab'), B16, cas('cas-u1-16-cs', 'cs-lc-ab'))).verdict).toBe('PASS');
  });
});
