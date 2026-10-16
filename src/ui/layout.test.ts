import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog';
import { presets } from '../data/presets';
import { evaluateLink } from '../engine';
import { layoutLink, type Orientation } from './layout';

describe('layout', () => {
  for (const orientation of ['horizontal', 'vertical'] as Orientation[]) {
    for (const p of presets) {
      it(`${orientation}: ${p.id} draws every hop of every fibre inside the canvas`, () => {
        const result = evaluateLink(p.config, catalog);
        const g = layoutLink(p.config, result, catalog, orientation);
        expect(g.fibres.length).toBe(result.channels.length * 2);
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
});
