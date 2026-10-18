import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog';
import { suggestFixes } from './fixes';
import { MM, SM, cassetteEnd as cas, link, opticEnd as optic, run } from './testkit';

describe('fix suggestions', () => {
  it('a passing link gets no suggestions', () => {
    expect(suggestFixes(link(cas('cas-u1-12', 'lc-ab'), { trunk: 'trunk-b-12', ...SM }, cas('cas-u1-12', 'lc-ab')), catalog)).toEqual([]);
  });

  it('F-1 (Method A, standard cords both ends): first fix swaps the End B cords to A-to-A', () => {
    const fixes = suggestFixes(link(cas('cas-a-12', 'lc-ab'), { trunk: 'trunk-a-12', ...SM }, cas('cas-a-12', 'lc-ab')), catalog);
    expect(fixes[0].message).toBe('Swap the End B patch cords from A-to-B (standard) to A-to-A.');
    expect(fixes[0].verdict).toBe('PASS');
    expect(run(fixes[0].config).verdict).toBe('PASS');
  });

  it('BO-01 (U1 breakout with standard cords): suggests A-to-A cords on the cassette side', () => {
    const fixes = suggestFixes(
      link(optic('qsfp28-100g-sr4'), { trunk: 'trunk-b-12', ...MM }, cas('cas-u1-12', 'lc-ab', { equipment: 'sfp28-25g-sr', patchedPorts: [1, 2, 3, 4] })),
      catalog,
    );
    expect(fixes[0].message).toBe('Swap the End B patch cords from A-to-B (standard) to A-to-A.');
    expect(fixes[0].verdict).toBe('WARN');
  });

  it('F-APC-2 (U2 on APC): suggests universal U1 cassettes, which work on APC', () => {
    const fixes = suggestFixes(link(cas('cas-u2-12', 'lc-ab'), { trunk: 'trunk-b-12', ...SM }, cas('cas-u2-12', 'lc-ab')), catalog, 10);
    expect(fixes.map((f) => f.message)).toContain('Use a Universal cassette (U1) at both ends.');
    expect(fixes.every((f) => f.verdict !== 'BLOCK')).toBe(true);
  });

  it('MB-01 (Method B, both upright): suggests turning a cassette over', () => {
    const fixes = suggestFixes(link(cas('cas-b-12', 'lc-ab'), { trunk: 'trunk-b-12', ...MM }, cas('cas-b-12', 'lc-ab')), catalog);
    expect(fixes[0].message).toMatch(/upside down/);
    expect(fixes[0].verdict).toBe('PASS');
  });

  it('every suggested fix really improves the verdict', () => {
    const broken = link(cas('cas-u1-12', 'lc-ab'), { trunk: 'trunk-a-12', ...SM }, cas('cas-u1-12', 'lc-ab'));
    for (const f of suggestFixes(broken, catalog, 20)) expect(['PASS', 'WARN']).toContain(run(f.config).verdict);
  });
});
