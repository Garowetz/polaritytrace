import { describe, expect, it } from 'vitest';
import { cassettes } from '../data/cassettes';
import { trunks } from '../data/trunks';
import { adapterMap, apply, invert, isPermutation, pairFlipped, receptacleMap, reversed, rowSwapPairFlip24, rowSwapped24 } from './maps';

// The maps must match the tables in docs/polarity-reference.md exactly.

const trunk = (id: string) => trunks.find((t) => t.id === id)!;
const cassette = (id: string) => cassettes.find((c) => c.id === id)!;
const lcOrder = (id: string) => cassette(id).frontMap.flatMap((f) => [f.A, f.B]);

describe('trunk maps (reference §2)', () => {
  it('§2.1 Type A 12F: 1→1', () => expect(trunk('trunk-a-12').map).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]));
  it('§2.2 Type B 12F: 1→12', () => expect(trunk('trunk-b-12').map).toEqual([12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]));
  it('§2.3 Type C 12F: pair flip', () => expect(trunk('trunk-c-12').map).toEqual([2, 1, 4, 3, 6, 5, 8, 7, 10, 9, 12, 11]));

  it('§2.4 Base-8 maps lit positions onto lit positions', () => {
    for (const id of ['trunk-a-8', 'trunk-b-8', 'trunk-c-8']) {
      const t = trunk(id);
      for (const p of t.litPositions) expect(t.litPositions).toContain(apply(t.map, p));
    }
  });

  it('§2.5 MPO-16 Type B: f(i) = 17 − i', () => expect(trunk('trunk-b-16').map).toEqual(reversed(16)));

  it('§2.6 MPO-24 Type A swaps rows: 1→13, 13→1', () => {
    expect(apply(rowSwapped24, 1)).toBe(13);
    expect(apply(rowSwapped24, 12)).toBe(24);
    expect(apply(rowSwapped24, 13)).toBe(1);
  });
  it('§2.6 MPO-24 Type B: 1→24', () => expect(apply(trunk('trunk-b-24').map, 1)).toBe(24));
  it('§2.6 MPO-24 Type C: rows 1–12 → 14,13,16,15 …; 13–24 → 2,1,4,3 …', () => {
    expect(rowSwapPairFlip24.slice(0, 12)).toEqual([14, 13, 16, 15, 18, 17, 20, 19, 22, 21, 24, 23]);
    expect(rowSwapPairFlip24.slice(12)).toEqual([2, 1, 4, 3, 6, 5, 8, 7, 10, 9, 12, 11]);
  });

  it('every trunk map is a permutation and an involution', () => {
    for (const t of trunks) {
      expect(isPermutation(t.map), t.id).toBe(true);
      expect(invert(t.map), t.id).toEqual(t.map);
    }
  });
});

describe('adapters and receptacles (reference §3, §3-1)', () => {
  it('Type A adapter keeps position; Type B reverses', () => {
    expect(adapterMap('A', 12)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
    expect(adapterMap('B', 12)).toEqual(reversed(12));
  });
  it('two-row key-up/key-up adapters are refused, not guessed', () => {
    expect(() => adapterMap('B', 24)).toThrow();
  });
  it('rule 5: plug in an optic receptacle maps i ↔ 13 − i', () => {
    expect(apply(receptacleMap(12), 1)).toBe(12);
    expect(apply(receptacleMap(12), 4)).toBe(9);
  });
});

describe('cassette transitions (reference §4, §3-2)', () => {
  it('§4.1 Type A: MPO n → LC n', () => expect(lcOrder('cas-a-12')).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]));
  it('§4.3 U1: MPO 1,12,2,11,3,10,4,9,5,8,6,7 → LC 1–12', () =>
    expect(lcOrder('cas-u1-12')).toEqual([1, 12, 2, 11, 3, 10, 4, 9, 5, 8, 6, 7]));
  it('§4.4 U2: 12,1,11,2,10,3,9,4,8,5,7,6', () => expect(lcOrder('cas-u2-12')).toEqual([12, 1, 11, 2, 10, 3, 9, 4, 8, 5, 7, 6]));
  it('§4.4 U2 position = 13 − U1 position', () => {
    expect(lcOrder('cas-u2-12')).toEqual(lcOrder('cas-u1-12').map((p) => 13 - p));
  });
  it('§3-2 B2: 11,12,9,10,7,8,5,6,3,4,1,2', () => expect(lcOrder('cas-b2-12')).toEqual([11, 12, 9, 10, 7, 8, 5, 6, 3, 4, 1, 2]));
  it('§4.2 AF: 2,1,4,3 …', () => expect(lcOrder('cas-af-12')).toEqual(pairFlipped(12)));
  it('§3-1 convention: U1 port p A = MPO p, B = MPO 13 − p', () => {
    for (const f of cassette('cas-u1-12').frontMap) {
      expect(f.A).toBe(f.port);
      expect(f.B).toBe(13 - f.port);
    }
  });
  it('§4.3a U1-16 and U1-24 pair p with N + 1 − p', () => {
    for (const f of cassette('cas-u1-16').frontMap) expect(f.B).toBe(17 - f.A);
    for (const f of cassette('cas-u1-24').frontMap) expect(f.B).toBe(25 - f.A);
  });
  it('every cassette wires each lit position to at most one front fibre', () => {
    for (const c of cassettes) {
      const used = c.frontMap.flatMap((f) => [f.A, f.B]);
      expect(new Set(used).size, c.id).toBe(used.length);
      for (const p of used) expect(c.litPositions, c.id).toContain(p);
    }
  });
});
