import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog';
import { walkSteps } from './steps';
import { MM, SM, cassetteEnd as cas, link, opticEnd as optic, run } from './testkit';

const steps = (cfg: Parameters<typeof run>[0]) => walkSteps(cfg, catalog, run(cfg));

describe('step captions', () => {
  it('Method A walks every component of channel 1, then sums up', () => {
    const s = steps(link(cas('cas-a-12', 'lc-ab'), { trunk: 'trunk-a-12', ...SM }, cas('cas-a-12', 'lc-aa')));
    expect(s.map((x) => x.title)).toEqual([
      'Equipment port, port 1',
      'End A patch cord: A-to-B (standard)',
      'Type A cassette',
      'Key-up/key-down rear adapter (Type A)',
      'Type A trunk',
      'Key-up/key-down rear adapter (Type A)',
      'Type A cassette',
      'End B patch cord: A-to-A',
      'Every channel',
    ]);
    expect(s[7].text).toMatch(/Rx ✓/);
    expect(s[8].text).toBe('TIA Method A. 6 of 6 channels deliver Tx to Rx, in both directions.');
  });

  it('the trunk caption quotes the real map: "Type B trunk: position 1 arrives at position 12"', () => {
    const s = steps(link(optic('qsfp28-100g-sr4'), { trunk: 'trunk-b-12', ...MM }, optic('qsfp28-100g-sr4')));
    expect(s[1].text).toMatch(/optic position 1 meets trunk position 12/);
    expect(s[2]).toMatchObject({ title: 'Type B trunk', text: 'Position 12 arrives at position 1 at the far end.' });
    expect(s[3].text).toMatch(/lane 1 Rx ✓/);
  });

  it('a Tx→Tx failure says so at the last hop', () => {
    const s = steps(link(cas('cas-a-12', 'lc-ab'), { trunk: 'trunk-a-12', ...SM }, cas('cas-a-12', 'lc-ab')));
    expect(s[s.length - 2].text).toMatch(/Tx ✕/);
    expect(s[s.length - 1].text).toMatch(/0 of 6/);
  });

  it('a blocked link gives one step with the reason', () => {
    const s = steps(link(optic('osfp-800g-dr8'), { trunk: 'trunk-b-12', ...SM }, optic('osfp-800g-dr8')));
    expect(s).toHaveLength(1);
    expect(s[0].text).toMatch(/MPO-16/);
  });
});
