import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog';
import { cassetteEnd, opticEnd, presets } from '../data/presets';
import { evaluateLink, walkSteps, type EndConfig, type LinkConfig } from '../engine';
import { layoutLink, type Orientation } from './layout';

describe('layout', () => {
  it('draws every fibre, including ones no light enters (Rx wired to Rx)', () => {
    const c: LinkConfig = {
      left: cassetteEnd('cas-a-12', 'lc-ab'),
      cable: { trunk: 'trunk-a-12', fibre: 'SMF', polish: 'APC' },
      right: cassetteEnd('cas-u1-12', 'lc-aa'),
    };
    const g = layoutLink(c, evaluateLink(c, catalog), catalog, 'horizontal');
    const trunkPositions = new Set(g.fibres.flatMap((f) => f.slotIds.filter((id) => id.startsWith('left:trunk|'))));
    expect(trunkPositions.size).toBe(12);
    const unlit = g.fibres.filter((f) => f.direction === 'unlit');
    expect(unlit.map((f) => f.slotIds[0]).sort()).toEqual(['left:equipment|1A', 'left:equipment|2A', 'left:equipment|3A']);
    for (const f of unlit) expect(f.slotIds[f.slotIds.length - 1]).toMatch(/^right:equipment\|\dA$/);
  });

  it('a working link has no unlit fibres', () => {
    for (const p of presets.filter((x) => x.expect === 'PASS')) {
      const g = layoutLink(p.config, evaluateLink(p.config, catalog), catalog, 'horizontal');
      expect(g.fibres.filter((f) => f.direction === 'unlit').map((f) => f.id), p.id).toEqual([]);
    }
  });

  for (const orientation of ['horizontal', 'vertical'] as Orientation[]) {
    for (const p of presets) {
      it(`${orientation}: ${p.id} draws every hop of every fibre inside the canvas`, () => {
        const result = evaluateLink(p.config, catalog);
        const g = layoutLink(p.config, result, catalog, orientation);
        expect(g.fibres.filter((f) => f.direction !== 'unlit').length).toBe(result.channels.length * 2);
        for (const f of g.fibres) {
          expect(f.points.length, f.id).toBe(f.slotIds.length);
          for (const pt of f.points) {
            expect(pt.x).toBeGreaterThanOrEqual(0);
            expect(pt.y).toBeGreaterThanOrEqual(0);
            expect(pt.x).toBeLessThanOrEqual(g.width);
            expect(pt.y).toBeLessThanOrEqual(g.height);
          }
        }
        for (const b of g.boxes) {
          expect(b.x, b.id).toBeGreaterThanOrEqual(0);
          expect(b.x + b.w, b.id).toBeLessThanOrEqual(g.width);
          expect(b.y + b.h, b.id).toBeLessThanOrEqual(g.height);
        }
      });
    }
  }

  it('stations run left to right in link order', () => {
    const p = presets.find((x) => x.id === 'method-a')!;
    const g = layoutLink(p.config, evaluateLink(p.config, catalog), catalog, 'horizontal');
    expect(g.stations.map((s) => s.key)).toEqual([
      'left:equipment',
      'left:front',
      'left:internal',
      'left:trunk',
      'right:trunk',
      'right:internal',
      'right:front',
      'right:equipment',
    ]);
    const xs = g.stations.map((s) => s.slots[0].x);
    expect([...xs].sort((a, b) => a - b)).toEqual(xs);
  });

  it('every combination the pickers can make evaluates, lays out and steps without throwing', () => {
    const ends: EndConfig[] = [
      ...catalog.cassettes.filter((c) => !c.fixtureOnly).map((c) => cassetteEnd(c.id, c.frontConnector === 'CS' ? 'cs-lc-ab' : 'lc-ab')),
      ...catalog.optics.filter((o) => o.inV1 && o.mpo && !o.generic).map((o) => opticEnd(o.id)),
    ];
    let n = 0;
    for (const left of ends) {
      for (const right of ends) {
        for (const t of catalog.trunks) {
          const config: LinkConfig = { left, cable: { trunk: t.id, fibre: n % 2 ? 'MMF' : 'SMF' }, right };
          const result = evaluateLink(config, catalog);
          const g = layoutLink(config, result, catalog, n % 3 ? 'horizontal' : 'vertical');
          expect(g.width, JSON.stringify(config)).toBeGreaterThan(0);
          expect(walkSteps(config, catalog, result).length).toBeGreaterThan(0);
          n++;
        }
      }
    }
    expect(n).toBeGreaterThan(1000);
  });
});
