import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog';
import { cassetteEnd, opticEnd, presets } from '../data/presets';
import { evaluateLink, NO_EQUIPMENT, walkSteps, type EndConfig, type LinkConfig } from '../engine';
import { adapterKeys, layoutLink, type Orientation } from './layout';

const methodAConfig = () => presets.find((p) => p.id === 'method-a')!.config;

describe('layout', () => {
  it('key notes: opposite keys for a key-up/key-down adapter, same keys for key-up/key-up', () => {
    expect(adapterKeys('A', false)).toEqual({ module: 'up', cable: 'down' });
    expect(adapterKeys('B', false)).toEqual({ module: 'up', cable: 'up' });
    // Turning the cassette over turns its adapter over.
    expect(adapterKeys('A', true)).toEqual({ module: 'down', cable: 'up' });
    expect(adapterKeys('B', true)).toEqual({ module: 'down', cable: 'down' });
  });

  it('every cassette has a module outline that holds its rear adapter, apart from the cable', () => {
    const g = layoutLink(methodAConfig(), evaluateLink(methodAConfig(), catalog), catalog, 'horizontal');
    const trunk = g.boxes.find((b) => b.kind === 'trunk')!;
    for (const side of ['left', 'right'] as const) {
      const mod = g.boxes.find((b) => b.kind === 'cassette' && b.side === side)!;
      const ad = g.boxes.find((b) => b.kind === 'adapter' && b.side === side)!;
      expect(ad.x).toBeGreaterThan(mod.x);
      expect(ad.x + ad.w).toBeLessThan(mod.x + mod.w);
      expect(ad.h).toBeLessThan(mod.h);
      expect(trunk.h).toBeLessThan(mod.h);
      const gap = side === 'left' ? trunk.x - (mod.x + mod.w) : mod.x - (trunk.x + trunk.w);
      expect(gap).toBeGreaterThan(0);
      expect(ad.notes?.map((n) => n.text)).toEqual(['Module key up', 'Cable key down']);
    }
  });

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

  it('an end with nothing plugged in draws just the module, and fibres land on its front', () => {
    const c = methodAConfig();
    const config: LinkConfig = { ...c, right: { ...(c.right as Extract<EndConfig, { kind: 'cassette' }>), equipment: NO_EQUIPMENT } };
    const geom = layoutLink(config, evaluateLink(config, catalog), catalog, 'horizontal');
    const kinds = (side: string) => geom.boxes.filter((b) => b.side === side).map((b) => b.kind);
    expect(kinds('right')).not.toContain('cord');
    expect(kinds('right')).not.toContain('equipment');
    expect(kinds('left')).toContain('equipment');
    expect(geom.stations.some((s) => s.key === 'right:equipment')).toBe(false);
    // Connectors only at End A: 6 ports × 2 fibres × 2 ends of the cord.
    expect(geom.connectors).toHaveLength(24);
    const tx = geom.fibres.filter((f) => f.direction === 'forward');
    expect(tx).toHaveLength(6);
    expect(tx.every((f) => f.end === 'land')).toBe(true);
    expect(walkSteps(config, catalog, evaluateLink(config, catalog)).at(-1)?.title).toBe('Port map');
  });

  it('patch cords get a connector at each end of every fibre, and the cable gets two plugs', () => {
    const config = methodAConfig();
    const geom = layoutLink(config, evaluateLink(config, catalog), catalog, 'horizontal');
    expect(geom.connectors).toHaveLength(48);
    expect(geom.boxes.filter((b) => b.kind === 'plug')).toHaveLength(2);
    // The cable and its plugs are narrower than the modules.
    const cassette = geom.boxes.find((b) => b.kind === 'cassette')!;
    const cable = geom.boxes.find((b) => b.kind === 'trunk')!;
    expect(cable.h).toBeLessThan(cassette.h);
  });
});
