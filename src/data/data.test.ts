import { describe, expect, it } from 'vitest';
import { evaluateLink } from '../engine/evaluate';
import { catalog } from './catalog';
import { fibreColour } from './colours';
import { DEFAULT_PRESET, presets } from './presets';

const all = [...catalog.trunks, ...catalog.cassettes, ...catalog.cords, ...catalog.optics];

describe('component data', () => {
  it('ids are unique', () => {
    const ids = all.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every part has a source, and verified is true only for VERIFIED', () => {
    for (const x of all) {
      expect(x.source, x.id).toMatch(/polarity-reference §/);
      expect(x.verified, x.id).toBe(x.status === 'VERIFIED');
    }
  });

  it('labels never show a bare "MPO-8"', () => {
    for (const x of all) expect(`${x.label} ${x.blurb}`, x.id).not.toMatch(/MPO-8(?!\d)/);
  });

  it('MPO optics have one Tx and one Rx position per lane, inside the connector', () => {
    for (const o of catalog.optics) {
      if (!o.mpo) continue;
      const used = o.mpo.lanes.flatMap((l) => [l.tx, l.rx]);
      expect(new Set(used).size, o.id).toBe(used.length);
      for (const p of used) expect(p >= 1 && p <= o.mpo.positions, o.id).toBe(true);
    }
  });

  it('SR4-family lanes: Tx on 1–4, Rx on 12–9 (reference §6.2)', () => {
    const sr4 = catalog.optics.find((o) => o.id === 'qsfp28-100g-sr4')!;
    expect(sr4.mpo?.lanes).toEqual([
      { lane: 1, tx: 1, rx: 12 },
      { lane: 2, tx: 2, rx: 11 },
      { lane: 3, tx: 3, rx: 10 },
      { lane: 4, tx: 4, rx: 9 },
    ]);
  });
});

describe('colours (TIA-598, reference §10)', () => {
  it('1–12 in order', () => {
    expect(Array.from({ length: 12 }, (_, i) => fibreColour(i + 1).name)).toEqual([
      'Blue', 'Orange', 'Green', 'Brown', 'Slate', 'White', 'Red', 'Black', 'Yellow', 'Violet', 'Rose', 'Aqua',
    ]);
  });
  it('MPO-16 13–16 are olive, magenta, tan, lime', () => {
    expect([13, 14, 15, 16].map((p) => fibreColour(p, 16).name)).toEqual(['Olive', 'Magenta', 'Tan', 'Lime']);
  });
  it('MPO-24 13–24 carry a black tracer, fibre 20 a white one', () => {
    expect(fibreColour(13, 24).tracer?.name).toBe('black tracer');
    expect(fibreColour(20, 24)).toMatchObject({ name: 'Black', tracer: { name: 'white tracer' } });
  });
});

describe('presets', () => {
  it('the default preset exists and is a working Method A link', () => {
    const p = presets.find((x) => x.id === DEFAULT_PRESET)!;
    const r = evaluateLink(p.config, catalog);
    expect(r.verdict).toBe('PASS');
    expect(r.method).toBe('A');
  });

  for (const p of presets) {
    it(`${p.id} → ${p.expect}`, () => {
      const r = evaluateLink(p.config, catalog);
      expect(r.verdict).toBe(p.expect);
      expect(r.underReview.length > 0).toBe(Boolean(p.underReview));
    });
  }
});
