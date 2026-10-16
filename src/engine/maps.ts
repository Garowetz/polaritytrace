import type { PolarityType, PosMap } from './types';

// Position-map helpers. Positions are 1-based; map[i - 1] is where i goes.

export const identity = (n: number): PosMap => Array.from({ length: n }, (_, i) => i + 1);

/** Type B single row: f(i) = N + 1 − i (reference §2.2, §2.5). */
export const reversed = (n: number): PosMap => Array.from({ length: n }, (_, i) => n - i);

/** Type C: 1↔2, 3↔4 … (reference §2.3). */
export const pairFlipped = (n: number): PosMap =>
  Array.from({ length: n }, (_, i) => (i % 2 === 0 ? i + 2 : i));

/** MPO-24 Type A: rows swap, order kept, f(i) = i ± 12 (reference §2.6). */
export const rowSwapped24: PosMap = Array.from({ length: 24 }, (_, i) => (i < 12 ? i + 13 : i - 11));

/** MPO-24 Type C: rows swap and adjacent pairs flip (reference §2.6). */
export const rowSwapPairFlip24: PosMap = rowSwapped24.map((p) => pairFlipped(24)[p - 1]);

export function apply(map: PosMap, i: number): number {
  const out = map[i - 1];
  if (out === undefined) throw new Error(`Position ${i} is outside a ${map.length}-position map`);
  return out;
}

export function invert(map: PosMap): PosMap {
  const inv = new Array<number>(map.length);
  map.forEach((to, i) => {
    inv[to - 1] = i + 1;
  });
  return inv;
}

export function isPermutation(map: PosMap): boolean {
  const seen = new Set(map);
  return seen.size === map.length && map.every((p) => p >= 1 && p <= map.length);
}

/**
 * MPO mating adapter (reference §3). Type A (key-up/key-down) keeps position.
 * Type B (key-up/key-up) reverses a single row. Two-row Type B adapters are
 * not defined in the reference, so they are refused rather than guessed.
 */
export function adapterMap(type: PolarityType, positions: number): PosMap {
  if (type === 'A') return identity(positions);
  if (type === 'B') {
    if (positions > 16) throw new Error('Two-row key-up/key-up adapters are not modelled (no reference map)');
    return reversed(positions);
  }
  throw new Error('There is no Type C mating adapter');
}

/**
 * A plug mated into an optic MPO receptacle transposes laterally:
 * receptacle i ↔ plug N + 1 − i (reference §3-1, rule 5). Single row only.
 */
export function receptacleMap(positions: number): PosMap {
  if (positions > 16) throw new Error('Two-row optic receptacles are not modelled in v1');
  return reversed(positions);
}

/** Parallel optic lanes: lane k Tx at k, Rx at N + 1 − k (reference §3-1 rule 4, §6.3). */
export function parallelLanes(lanes: number, positions: number) {
  return Array.from({ length: lanes }, (_, i) => ({ lane: i + 1, tx: i + 1, rx: positions - i }));
}
