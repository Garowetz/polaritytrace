import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog';
import { allPoints, letters, reviewSections } from './parts';

const sections = reviewSections(catalog);
const parts = sections.flatMap((s) => s.groups.flatMap((g) => g.parts));

describe('the parts review page', () => {
  it('has the four main sections in order', () => {
    expect(sections.map((s) => `${s.number} ${s.title}`)).toEqual(['1 Modules', '2 Equipment', '3 MPO cables', '4 Patch cords']);
  });

  it('lists every part once, leaving out test-only modules', () => {
    const ids = parts.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const expected = [...catalog.cassettes.filter((c) => !c.fixtureOnly), ...catalog.optics, ...catalog.trunks, ...catalog.cords];
    expect(ids.sort()).toEqual(expected.map((x) => x.id).sort());
  });

  it('numbers parts within each section and points within each part', () => {
    const modules = sections[0].groups.flatMap((g) => g.parts);
    expect(modules[0]).toMatchObject({ ref: '1A', id: 'cas-a-12' });
    expect(modules.map((p) => p.ref)).toEqual(modules.map((_, i) => `1${letters(i)}`));
    const cs = parts.find((p) => p.id === 'cas-u1-16-cs')!;
    expect(cs.points.map((p) => p.ref)).toEqual([`${cs.ref}-1`, `${cs.ref}-2`, `${cs.ref}-3`]);
  });

  it('flags every part that is not verified', () => {
    for (const p of parts.filter((x) => x.status !== 'VERIFIED')) expect(p.points.length, p.id).toBeGreaterThan(0);
    expect(allPoints(sections).length).toBe(parts.reduce((n, p) => n + p.points.length, 0));
  });

  it('runs letters past Z', () => {
    expect([letters(0), letters(25), letters(26), letters(27)]).toEqual(['A', 'Z', 'AA', 'AB']);
  });
});
