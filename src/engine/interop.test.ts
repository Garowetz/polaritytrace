import { describe, expect, it } from 'vitest';
import { optics } from '../data/optics';
import { checkInterop, scopeIssues } from './interop';

// Optic interoperability, docs/polarity-reference.md §3-3 / §3-4 (IO-01 … IO-16).

const o = (id: string) => {
  const hit = optics.find((x) => x.id === id);
  if (!hit) throw new Error(`no optic ${id}`);
  return hit;
};
const verdict = (a: string, b: string, opts = {}) => checkInterop(o(a), o(b), opts).verdict;

describe('§3-4 interop channels', () => {
  it('IO-01: 40G SR4 → 4 × 10G SR, breakout on → PASS', () => {
    const r = checkInterop(o('qsfp-40g-sr4'), o('sfp-10g-sr'));
    expect(r.verdict).toBe('PASS');
    expect(r.issues[0].message).toMatch(/100 m OM3 \/ 150 m OM4/);
  });

  it('IO-02: 40G SR4 no-breakout variant → FAIL', () => expect(verdict('qsfp-40g-sr4-nobreakout', 'sfp-10g-sr')).toBe('FAIL'));

  it('IO-03: 100G SR4 → 4 × 25G SR with RS-FEC both ends → PASS', () => {
    expect(verdict('qsfp28-100g-sr4', 'sfp28-25g-sr', { fecA: 'RS', fecB: 'RS' })).toBe('PASS');
  });

  it('IO-04: 100G SR4 → 25G SR with FEC mismatched → FAIL', () => {
    const r = checkInterop(o('qsfp28-100g-sr4'), o('sfp28-25g-sr'), { fecB: 'none' });
    expect(r.verdict).toBe('FAIL');
    expect(r.issues.map((i) => i.code)).toContain('fec');
  });

  it('IO-05: 100G SR4 → 4 × 10G SR → FAIL', () => expect(verdict('qsfp28-100g-sr4', 'sfp-10g-sr')).toBe('FAIL'));

  it('IO-06: 400G DR4 → 100G DR / FR1 / LR1 → PASS (≤ 500 m)', () => {
    for (const d of ['qsfp28-100g-dr', 'qsfp28-100g-fr1', 'qsfp28-100g-lr1']) {
      const r = checkInterop(o('qsfpdd-400g-dr4'), o(d));
      expect(r.verdict, d).toBe('PASS');
      expect(r.issues[0].message, d).toMatch(/500 m/);
    }
  });

  it('IO-07: 400G DR4 → 100G CWDM4 / LR4 / PSM4 → FAIL', () => {
    for (const d of ['qsfp28-100g-cwdm4', 'qsfp28-100g-lr4', 'qsfp28-100g-psm4']) expect(verdict('qsfpdd-400g-dr4', d), d).toBe('FAIL');
  });

  it('IO-08: 400G SR4.2 → 100G SR1.2 → PASS', () => expect(verdict('qsfpdd-400g-sr4.2', 'qsfp28-100g-sr1.2')).toBe('PASS'));

  it('IO-09: 400G SR4.2 → 40/100G SR BiDi → FAIL, with the vendor-mode note', () => {
    const r = checkInterop(o('qsfpdd-400g-sr4.2'), o('qsfp-40-100g-srbd'));
    expect(r.verdict).toBe('FAIL');
    expect(r.issues.map((i) => i.code)).toContain('vendor-mode');
  });

  it('IO-10: 400G SR4.2 ↔ 400G SR4 (802.3db) → FAIL', () => expect(verdict('qsfpdd-400g-sr4.2', 'qsfpdd-400g-sr4')).toBe('FAIL'));

  // The reference expects a scope WARN here because MPO-16 was out of v1. The
  // owner brought MPO-16 into v1 (2026-10-16), so the interop verdict alone is
  // PASS and only twin-MPO optics keep the scope flag.
  it('IO-11: 400G SR8 → 8 × 50G SR / 2 × 200G SR4 → PASS; MPO-16 is now in scope', () => {
    expect(verdict('qsfpdd-400g-sr8', 'sfp56-50g-sr')).toBe('PASS');
    expect(verdict('qsfpdd-400g-sr8', 'qsfp56-200g-sr4')).toBe('PASS');
    expect(scopeIssues(o('qsfpdd-400g-sr8'))).toEqual([]);
    expect(scopeIssues(o('osfp-800g-2xdr4'))).toEqual([expect.objectContaining({ severity: 'warn', code: 'scope' })]);
  });

  it('800G DR8 → 8 × 100G DR / FR1 → PASS; → 100G CWDM4 → FAIL', () => {
    expect(verdict('osfp-800g-dr8', 'qsfp28-100g-dr')).toBe('PASS');
    expect(verdict('osfp-800g-dr8', 'qsfp28-100g-fr1')).toBe('PASS');
    expect(verdict('osfp-800g-dr8', 'qsfp28-100g-cwdm4')).toBe('FAIL');
  });

  it('800G SR8 → 8 × 100G SR1 → PASS; → 25G SR → FAIL', () => {
    expect(verdict('osfp-800g-sr8', 'qsfp28-100g-sr1')).toBe('PASS');
    expect(verdict('osfp-800g-sr8', 'sfp28-25g-sr')).toBe('FAIL');
  });

  it('IO-12: 400G SR4 (802.3db) → 4 × 100G SR1 → PASS', () => expect(verdict('qsfpdd-400g-sr4', 'qsfp28-100g-sr1')).toBe('PASS'));

  it('IO-13: 800G 2 × DR4 → 8 × 100G DR / FR1 or 2 × 400G DR4 → PASS', () => {
    for (const d of ['qsfp28-100g-dr', 'qsfp28-100g-fr1', 'qsfpdd-400g-dr4', 'qsfpdd-400g-xdr4']) {
      expect(verdict('osfp-800g-2xdr4', d), d).toBe('PASS');
    }
  });

  it('IO-14: 800G DR4 with 200G lanes → 100G DR → FAIL', () => {
    const r = checkInterop(o('osfp-800g-dr4-200g'), o('qsfp28-100g-dr'));
    expect(r.verdict).toBe('FAIL');
    expect(r.issues[0].message).toMatch(/lane rates differ/);
  });

  it('IO-15: 100G PSM4 → 4 × 25G LR → WARN (platform-specific)', () => {
    expect(verdict('qsfp28-100g-psm4', 'sfp28-25g-lr')).toBe('WARN');
  });

  it('IO-16: SR ↔ SWDM4 and NRZ ↔ PAM4 → FAIL', () => {
    expect(verdict('sfp28-25g-sr', 'qsfp28-100g-swdm4')).toBe('FAIL');
    expect(verdict('qsfp28-100g-sr4', 'qsfp28-100g-swdm4')).toBe('FAIL');
    const nrzPam4 = checkInterop(o('sfp28-25g-sr'), o('sfp56-50g-sr'));
    expect(nrzPam4.verdict).toBe('FAIL');
    expect(nrzPam4.issues[0].message).toMatch(/NRZ and PAM4/);
  });

  it('40G SR4 → 10G LR → FAIL (850 nm multimode vs 1310 nm singlemode)', () => {
    const r = checkInterop(o('qsfp-40g-sr4'), o('sfp-10g-lr'));
    expect(r.verdict).toBe('FAIL');
    expect(r.issues[0].message).toMatch(/multimode and singlemode/);
  });

  it('100G DR/FR/LR (PAM4) ↔ CWDM4/LR4 (NRZ) → FAIL', () => {
    expect(verdict('qsfp28-100g-dr', 'qsfp28-100g-cwdm4')).toBe('FAIL');
    expect(verdict('qsfp28-100g-fr1', 'qsfp28-100g-lr4')).toBe('FAIL');
  });

  it('BiDi ↔ non-BiDi → FAIL', () => expect(verdict('qsfp28-100g-sr1.2', 'qsfp28-100g-sr1')).toBe('FAIL'));

  it('same optic both ends → PASS; generic equipment port never fails interop', () => {
    expect(verdict('sfp-10g-sr', 'sfp-10g-sr')).toBe('PASS');
    expect(verdict('generic-duplex', 'qsfpdd-400g-dr4')).toBe('PASS');
  });

  it('interop is symmetric', () => {
    for (const a of optics) for (const b of optics) expect(verdict(a.id, b.id), `${a.id} ↔ ${b.id}`).toBe(verdict(b.id, a.id));
  });
});
