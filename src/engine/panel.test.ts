import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog';
import { suggestFixes } from './fixes';
import { walkSteps } from './steps';
import { MM, SM, cassetteEnd as cas, codes, link, opticEnd, outcomes, run } from './testkit';
import type { AdapterType, PanelConfig } from './types';

// MPO adapter panel ends (plan-mpo-adapter-end.md): optic → MPO patch cord →
// adapter → trunk. Expected results come from reference §8.1 (P-ArrA/B/C) and
// §8.2 (F-3, F-4) and §3.1 (APC key-up/key-up).

const SR4 = 'qsfp28-100g-sr4';
const DR4 = 'qsfpdd-400g-dr4';
const SR8 = 'qsfpdd-400g-sr8';

const panel = (optic: string, cord: string, adapter: AdapterType, extra: Partial<PanelConfig> = {}) =>
  opticEnd(optic, { panel: { adapter, cord, ...extra } });

describe('§8.1 TIA array methods through adapter panels', () => {
  it('P-ArrA: Type A cord → key-up/key-down → Type A trunk → key-up/key-down → Type B cord', () => {
    for (const [optic, cable] of [
      [SR4, MM],
      [DR4, SM],
    ] as const) {
      const r = run(link(panel(optic, 'trunk-a-12', 'A'), { trunk: 'trunk-a-12', ...cable }, panel(optic, 'trunk-b-12', 'A')));
      expect(r.verdict, optic).toBe('PASS');
      expect(r.method, optic).toBe('array-A');
      expect(r.channels).toHaveLength(4);
      // Lane k Tx lands on lane k Rx at the far end.
      expect(r.channels.map((c) => c.forward.arrival)).toEqual(
        [12, 11, 10, 9].map((pos, i) => ({ kind: 'optic', side: 'right', pos, role: 'rx', lane: i + 1 })),
      );
    }
  });

  it('P-ArrA works with the Type B cord at either end', () => {
    const r = run(link(panel(SR4, 'trunk-b-12', 'A'), { trunk: 'trunk-a-12', ...MM }, panel(SR4, 'trunk-a-12', 'A')));
    expect(r.verdict).toBe('PASS');
    expect(r.method).toBe('array-A');
  });

  it('P-ArrB: Type B cords, key-up/key-up adapters, Type B trunk (multimode UPC)', () => {
    const r = run(link(panel(SR4, 'trunk-b-12', 'B'), { trunk: 'trunk-b-12', ...MM }, panel(SR4, 'trunk-b-12', 'B')));
    expect(r.verdict).toBe('PASS');
    expect(r.method).toBe('array-B');
  });

  it('P-ArrC: Type B cord → key-up/key-down → Type C trunk → key-up/key-down → Type C cord', () => {
    const r = run(link(panel(SR4, 'trunk-b-12', 'A'), { trunk: 'trunk-c-12', ...MM }, panel(SR4, 'trunk-c-12', 'A')));
    expect(r.verdict).toBe('PASS');
    expect(r.method).toBe('array-C');
  });

  it('Base-8 patch cords work like 12F ones', () => {
    const r = run(link(panel(SR4, 'trunk-a-8', 'A'), { trunk: 'trunk-a-12', ...MM }, panel(SR4, 'trunk-b-8', 'A')));
    expect(r.verdict).toBe('PASS');
  });

  it('MPO-16: SR8 (APC on multimode, reference §6.0) over Type A cord, Type A trunk and Type B cord', () => {
    const MM_APC = { fibre: 'MMF', polish: 'APC' } as const;
    const r = run(link(panel(SR8, 'trunk-a-16', 'A'), { trunk: 'trunk-a-16', ...MM_APC }, panel(SR8, 'trunk-b-16', 'A')));
    expect(r.verdict).toBe('PASS');
    expect(r.channels).toHaveLength(8);
  });

  it('the trace passes through both cord plugs at each panel', () => {
    const r = run(link(panel(SR4, 'trunk-a-12', 'A'), { trunk: 'trunk-a-12', ...MM }, panel(SR4, 'trunk-b-12', 'A')));
    expect(r.channels[0].forward.hops.map((h) => h.at)).toEqual(['optic', 'cord', 'cord', 'trunk', 'trunk', 'cord', 'cord', 'optic']);
  });
});

describe('§8.2 known-bad combinations still fail through panels', () => {
  it('F-3: Type A cords at both ends of a Type A trunk (even inversions)', () => {
    const r = run(link(panel(SR4, 'trunk-a-12', 'A'), { trunk: 'trunk-a-12', ...MM }, panel(SR4, 'trunk-a-12', 'A')));
    expect(r.verdict).toBe('FAIL');
    expect(new Set(outcomes(r))).toEqual(new Set(['tx-to-tx']));
    expect(r.method).toBeNull();
  });

  it('F-4: Type C cords at both ends of a Type A trunk (pair flip)', () => {
    const r = run(link(panel(SR4, 'trunk-c-12', 'A'), { trunk: 'trunk-a-12', ...MM }, panel(SR4, 'trunk-c-12', 'A')));
    expect(r.verdict).toBe('FAIL');
  });

  it('Type B cords at both ends with key-up/key-down adapters and a Type B trunk: three flips work, but it is not a TIA set', () => {
    const r = run(link(panel(SR4, 'trunk-b-12', 'A'), { trunk: 'trunk-b-12', ...MM }, panel(SR4, 'trunk-b-12', 'A')));
    expect(new Set(outcomes(r))).toEqual(new Set(['tx-to-rx']));
    expect(r.verdict).toBe('WARN');
    expect(codes(r)).toContain('mixed-method');
  });
});

describe('a panel at one end only', () => {
  it('direct optic one end, panel the other: one Type B element passes, flagged as mixed', () => {
    const r = run(link(opticEnd(SR4), { trunk: 'trunk-a-12', ...MM }, panel(SR4, 'trunk-b-12', 'A')));
    expect(new Set(outcomes(r))).toEqual(new Set(['tx-to-rx']));
    expect(r.method).toBeNull();
    expect(r.method).not.toBe('direct-B');
  });

  it("owner's example: SR4 → Type A cord → panel → Type B trunk → U2 module → A-to-A cords → duplex optics", () => {
    for (const cassette of ['cas-u1-12', 'cas-u2-12']) {
      const r = run(link(panel(SR4, 'trunk-a-12', 'A'), { trunk: 'trunk-b-12', ...MM }, cas(cassette, 'lc-aa', { equipment: 'sfp28-25g-sr' })));
      expect(r.mode, cassette).toBe('breakout');
      expect(new Set(outcomes(r)), cassette).toEqual(new Set(['tx-to-rx']));
      expect(r.method, cassette).toBe('breakout-U');
      expect(codes(r), cassette).not.toContain('mixed-method');
    }
  });

  it('breakout through a panel with A-to-B cords fails the same way BO-03 does', () => {
    const r = run(link(panel(SR4, 'trunk-a-12', 'A'), { trunk: 'trunk-b-12', ...MM }, cas('cas-u2-12', 'lc-ab', { equipment: 'sfp28-25g-sr' })));
    expect(r.verdict).toBe('FAIL');
  });

  it('a panel on End B mirrors End A', () => {
    const r = run(link(cas('cas-u1-12', 'lc-aa', { equipment: 'sfp28-25g-sr' }), { trunk: 'trunk-b-12', ...MM }, panel(SR4, 'trunk-a-12', 'A')));
    expect(new Set(outcomes(r))).toEqual(new Set(['tx-to-rx']));
    expect(r.method).toBe('breakout-U');
  });
});

describe('mechanical checks at a panel', () => {
  it('§3.1: APC through a key-up/key-up panel adapter is a BLOCK', () => {
    const r = run(link(panel(DR4, 'trunk-b-12', 'B'), { trunk: 'trunk-b-12', ...SM }, panel(DR4, 'trunk-b-12', 'B')));
    expect(r.verdict).toBe('BLOCK');
    expect(codes(r)).toContain('apc-key-up-up');
  });

  it('patch cord footprint must match the trunk', () => {
    const r = run(link(panel(SR4, 'trunk-a-16', 'A'), { trunk: 'trunk-a-12', ...MM }, panel(SR4, 'trunk-b-12', 'A')));
    expect(r.verdict).toBe('BLOCK');
    expect(r.issues.find((i) => i.code === 'footprint')?.message).toMatch(/MPO-16 has a different key offset/);
  });

  it('patch cord footprint must match the optic', () => {
    const r = run(link(panel(SR8, 'trunk-a-12', 'A'), { trunk: 'trunk-a-12', fibre: 'MMF', polish: 'APC' }, panel(SR4, 'trunk-b-12', 'A')));
    expect(r.verdict).toBe('BLOCK');
    expect(r.issues.find((i) => i.code === 'footprint')?.message).toMatch(/optic is MPO-16; its patch cord is MPO-12/);
  });

  it('two-row key-up/key-up adapters are refused, not guessed', () => {
    const SR10 = 'cfp-100g-sr10';
    const r = run(link(panel(SR10, 'trunk-a-24', 'B'), { trunk: 'trunk-a-24', ...MM }, panel(SR10, 'trunk-a-24', 'A')));
    expect(r.verdict).toBe('BLOCK');
    expect(codes(r)).toContain('unsupported-adapter');
  });

  it('default genders (cord unpinned at the optic, pinned at the panel; trunk female) give no gender notes', () => {
    const r = run(link(panel(SR4, 'trunk-a-12', 'A'), { trunk: 'trunk-a-12', ...MM }, panel(SR4, 'trunk-b-12', 'A')));
    expect(codes(r)).not.toContain('gender');
  });

  it('gender mismatches are notes only', () => {
    const r = run(
      link(panel(SR4, 'trunk-a-12', 'A', { cordGender: ['M', 'F'] }), { trunk: 'trunk-a-12', ...MM }, panel(SR4, 'trunk-b-12', 'A')),
    );
    expect(r.verdict).toBe('PASS');
    const notes = r.issues.filter((i) => i.code === 'gender');
    expect(notes).toHaveLength(2);
    expect(notes.every((n) => n.severity === 'note')).toBe(true);
  });
});

describe('fixes and steps for panel ends', () => {
  it('F-3 is fixed by swapping one patch cord to Type B', () => {
    const cfg = link(panel(SR4, 'trunk-a-12', 'A'), { trunk: 'trunk-a-12', ...MM }, panel(SR4, 'trunk-a-12', 'A'));
    const fixes = suggestFixes(cfg, catalog);
    expect(fixes[0].verdict).toBe('PASS');
    expect(fixes[0].message).toMatch(/MPO patch cord from Type A patch cord to Type B patch cord/);
  });

  it('APC key-up/key-up is fixed by a key-up/key-down adapter', () => {
    const cfg = link(panel(DR4, 'trunk-a-12', 'B'), { trunk: 'trunk-a-12', ...SM }, panel(DR4, 'trunk-b-12', 'A'));
    const fixes = suggestFixes(cfg, catalog);
    expect(fixes.map((f) => f.message)).toContain('Use a key-up/key-down adapter in the End A panel.');
  });

  it('the step captions name the cord and the panel adapter', () => {
    const cfg = link(panel(SR4, 'trunk-a-12', 'A'), { trunk: 'trunk-a-12', ...MM }, panel(SR4, 'trunk-b-12', 'A'));
    const titles = walkSteps(cfg, catalog, run(cfg)).map((s) => s.title);
    expect(titles).toContain('Patch cord plugs into the optic');
    expect(titles).toContain('Key-up/key-down panel adapter (Type A)');
    expect(titles).toContain('End B MPO patch cord: Type B cord');
    expect(titles.at(-1)).toBe('Every channel');
  });
});
