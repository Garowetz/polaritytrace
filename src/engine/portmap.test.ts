import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog';
import { modulePortMap } from './evaluate';
import { suggestFixes } from './fixes';
import { cassetteEnd, link, opticEnd, run, SM } from './testkit';
import { NO_EQUIPMENT } from './types';

// "Plugged into: None": the end is just the module. With no transmitter there
// is no polarity to check, so the result is a port map.

const bare = (cassette: string) => cassetteEnd(cassette, 'lc-ab', { equipment: NO_EQUIPMENT });
const trunkA = { trunk: 'trunk-a-12', ...SM };
const trunkB = { trunk: 'trunk-b-12', ...SM };

describe('port map when nothing is plugged in', () => {
  it('both ends bare: one row per front fibre, port 1 lands on port 1 in Method A', () => {
    const r = run(link(bare('cas-a-12'), trunkA, bare('cas-a-12')));
    expect(r.portMap).toBe(true);
    expect(r.method).toBe('A');
    expect(r.channels).toHaveLength(12);
    expect(r.channels.every((c) => c.outcome === 'mapped')).toBe(true);
    expect(r.channels[0].message).toBe('End A port 1 arrives at End B port 1.');
    expect(r.channels[0].ends).toEqual({ left: 'Port 1', right: 'Port 1' });
    expect(r.channels[11].message).toBe('End A port 12 arrives at End B port 12.');
    expect(r.issues.map((i) => i.code)).toContain('port-map');
    expect(suggestFixes(link(bare('cas-a-12'), trunkA, bare('cas-a-12')), catalog)).toEqual([]);
  });

  it('a Type B trunk between Type A modules reverses the ports', () => {
    const r = run(link(bare('cas-a-12'), trunkB, bare('cas-a-12')));
    expect(r.channels[0].message).toBe('End A port 1 arrives at End B port 12.');
    expect(r.channels[0].ends).toEqual({ left: 'Port 1', right: 'Port 12' });
  });

  it('one end bare: the other end shows where its Tx lands and where its Rx comes from', () => {
    const r = run(link(cassetteEnd('cas-a-12', 'lc-ab'), trunkA, bare('cas-a-12')));
    expect(r.portMap).toBe(true);
    expect(r.channels).toHaveLength(6);
    // A-to-B cord: equipment Tx (B) enters front position A, which is fibre 1.
    expect(r.channels[0].message).toBe('Port 1 Tx lands on End B port 1. Its Rx is fed from End B port 2.');
    expect(r.channels[0].ends).toEqual({ left: 'Port 1', right: 'Ports 1 & 2' });
    expect(r.channels[0].back.arrival).toMatchObject({ kind: 'equipment', side: 'left', port: 1, role: 'rx' });
    expect(r.issues.find((i) => i.code === 'port-map')?.message).toMatch(/at End B/);
  });

  it('works from End B too, and from an MPO optic', () => {
    const fromB = run(link(bare('cas-a-12'), trunkA, cassetteEnd('cas-a-12', 'lc-ab')));
    expect(fromB.channels[0].message).toMatch(/^End B port 1 Tx lands on End A port/);
    const optic = run(link(opticEnd('qsfp28-100g-psm4'), trunkB, bare('cas-u1-12')));
    expect(optic.portMap).toBe(true);
    expect(optic.channels).toHaveLength(4);
    expect(optic.channels[0].message).toMatch(/^Lane 1 Tx lands on End B port \d+\. Its Rx is fed from End B port \d+\.$/);
  });

  it('mechanical blocks still apply (MPO-16 module on an MPO-12 trunk)', () => {
    const r = run(link(bare('cas-a-12'), trunkA, bare('cas-u1-16')));
    expect(r.verdict).toBe('BLOCK');
  });
});

describe('the module port map alongside a full link', () => {
  it('maps module to module even with cords and equipment plugged in', () => {
    const full = link(cassetteEnd('cas-a-12', 'lc-ab'), trunkB, cassetteEnd('cas-a-12', 'lc-ab'));
    const map = modulePortMap(full, catalog);
    expect(map).toHaveLength(12);
    expect(map[0].ends).toEqual({ left: 'Port 1', right: 'Port 12' });
  });

  it('is empty when both ends are MPO optics', () => {
    const r = link(opticEnd('qsfp28-100g-sr4'), { trunk: 'trunk-b-12', fibre: 'MMF', polish: 'UPC' }, opticEnd('qsfp28-100g-sr4'));
    expect(modulePortMap(r, catalog)).toEqual([]);
  });
});
