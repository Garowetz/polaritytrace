import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog';
import { cassetteEnd, opticEnd, presets } from '../data/presets';
import { evaluateLink } from './evaluate';
import { apply, receptacleMap } from './maps';
import type { LinkConfig } from './types';

// 100GBASE-SR10 on MPO-24 (reference §6.9) and the 20-fibre breakout module
// (§4.3a(d)). Receptacle rows mirror in place; Type B 24F is i → 25 − i.

const MM = { fibre: 'MMF', polish: 'UPC' } as const;
const run = (c: LinkConfig) => evaluateLink(c, catalog);
const codes = (r: ReturnType<typeof run>) => r.issues.map((i) => i.code);
const preset = (id: string) => presets.find((p) => p.id === id)!.config;
const breakout = (trunk: string, cord: string): LinkConfig => ({
  left: opticEnd('cfp-100g-sr10'),
  cable: { trunk, ...MM },
  right: cassetteEnd('cas-sr10-24', cord, { equipment: 'sfp-10g-sr' }),
});

describe('two-row optic receptacle', () => {
  it('mirrors each row in place: 1 ↔ 12, 13 ↔ 24, rows never swap', () => {
    const m = receptacleMap(24);
    expect([1, 2, 11, 12, 13, 14, 23, 24].map((i) => apply(m, i))).toEqual([12, 11, 2, 1, 24, 23, 14, 13]);
  });
});

describe('100G SR10 on MPO-24', () => {
  it('direct over a Type B 24F cable: every lane Tx → Rx', () => {
    const r = run(preset('sr10-direct'));
    expect(r.verdict).toBe('PASS');
    expect(r.channels).toHaveLength(10);
    expect(new Set(r.channels.map((c) => c.outcome))).toEqual(new Set(['tx-to-rx']));
  });

  it('breakout: Type B 24F cable, 20F module, A-to-A cords → PASS, lane p → port p, ten ports lit', () => {
    const r = run(breakout('trunk-b-24', 'lc-aa'));
    expect(r.verdict).toBe('PASS');
    expect(new Set(r.channels.map((c) => c.outcome))).toEqual(new Set(['tx-to-rx']));
    expect(r.channels.map((c) => c.farPort)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(r.darkPorts).toEqual([]);
    expect(codes(r)).toContain('non-standard-cord');
  });

  it('breakout with standard A-to-B cords puts Tx on Tx', () => {
    const r = run(breakout('trunk-b-24', 'lc-ab'));
    expect(r.verdict).toBe('FAIL');
    expect(new Set(r.channels.map((c) => c.outcome))).toEqual(new Set(['tx-to-tx']));
  });

  it('breakout through a Type A 24F cable reverses the ports: lane p → port 11 − p, WARN', () => {
    const r = run(breakout('trunk-a-24', 'lc-aa'));
    expect(r.verdict).toBe('WARN');
    expect(r.channels.map((c) => c.farPort)).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
  });

  it('will not mate with an MPO-12 cable', () => {
    expect(codes(run(breakout('trunk-b-12', 'lc-aa')))).toContain('footprint');
  });
});
