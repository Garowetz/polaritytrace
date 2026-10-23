import { evaluateLink } from './evaluate';
import type { CassetteEnd, Catalog, EndConfig, Footprint, LinkConfig, Side, Verdict } from './types';

// Suggests the simplest change that makes a failing link work. Tries one change
// at a time (cords first, then mounting, trunk, cassettes) and ranks the ones
// that pass. Pure: it only calls evaluateLink.

export interface Fix {
  message: string;
  config: LinkConfig;
  verdict: Verdict;
  /** Rough effort: 1 = swap a cord … 5 = replace both cassettes. */
  cost: number;
  /** The fix relies on a part that is not VERIFIED. */
  underReview: boolean;
}

const RANK: Record<Verdict, number> = { PASS: 0, WARN: 1, FAIL: 2, BLOCK: 3 };
const hand = (s: Side) => (s === 'left' ? 'End A' : 'End B');

function withEnd(config: LinkConfig, side: Side, patch: Partial<CassetteEnd>): LinkConfig {
  const end = config[side];
  if (end.kind !== 'cassette') return config;
  return { ...config, [side]: { ...end, ...patch } };
}

function footprintOf(end: EndConfig, catalog: Catalog): Footprint | undefined {
  if (end.kind === 'cassette') return catalog.cassettes.find((c) => c.id === end.cassette)?.footprint;
  const c = catalog.optics.find((o) => o.id === end.optic)?.connector;
  return c === 'MPO-12' || c === 'MPO-16' ? c : undefined;
}

interface Candidate {
  message: string;
  config: LinkConfig;
  cost: number;
}

function candidates(config: LinkConfig, catalog: Catalog): Candidate[] {
  const out: Candidate[] = [];
  const name = <T extends { id: string; label: string }>(list: readonly T[], id: string) => list.find((x) => x.id === id)?.label ?? id;
  const sides: Side[] = ['right', 'left'];

  for (const side of sides) {
    const end = config[side];
    if (end.kind !== 'cassette') continue;
    for (const cord of catalog.cords) {
      if (cord.id === end.cord && !end.cordOverrides) continue;
      out.push({
        message: `Swap the ${hand(side)} patch cords from ${name(catalog.cords, end.cord)} to ${cord.label}.`,
        config: withEnd(config, side, { cord: cord.id, cordOverrides: undefined }),
        cost: 1,
      });
    }
  }

  const l = config.left;
  const r = config.right;
  if (l.kind === 'cassette' && r.kind === 'cassette') {
    for (const cord of catalog.cords) {
      if (cord.id === l.cord || cord.id === r.cord) continue;
      const both = withEnd(withEnd(config, 'left', { cord: cord.id, cordOverrides: undefined }), 'right', { cord: cord.id, cordOverrides: undefined });
      out.push({ message: `Use ${cord.label} patch cords at both ends.`, config: both, cost: 2 });
    }
  }

  for (const side of sides) {
    const end = config[side];
    if (end.kind !== 'cassette') continue;
    const inverted = (end.mount ?? 'upright') === 'inverted';
    out.push({
      message: inverted ? `Mount the ${hand(side)} cassette the right way up.` : `Turn the ${hand(side)} cassette upside down (inverted mount).`,
      config: withEnd(config, side, { mount: inverted ? 'upright' : 'inverted' }),
      cost: 2,
    });
  }

  const trunk = catalog.trunks.find((t) => t.id === config.cable.trunk);
  // A cable whose footprint differs from both ends can only be fixed by a
  // cable of the ends' footprint; otherwise keep the footprint and fibre count.
  const endPrints = sides.map((s) => footprintOf(config[s], catalog)).filter((f): f is Footprint => Boolean(f));
  const misfit = trunk ? endPrints.length > 0 && endPrints.every((f) => f !== trunk.footprint) : false;
  for (const t of catalog.trunks) {
    if (!trunk || t.id === trunk.id) continue;
    const same = t.footprint === trunk.footprint && t.litPositions.length === trunk.litPositions.length;
    if (!(same || (misfit && endPrints.includes(t.footprint)))) continue;
    const label = same ? t.label : `${t.label} (${t.footprint})`;
    out.push({ message: `Use a ${label} instead of the ${trunk.label}.`, config: { ...config, cable: { ...config.cable, trunk: t.id } }, cost: 3 });
  }

  for (const side of sides) {
    const end = config[side];
    if (end.kind !== 'cassette') continue;
    const current = catalog.cassettes.find((c) => c.id === end.cassette);
    if (!current) continue;
    for (const c of catalog.cassettes) {
      const same = c.footprint === current.footprint && c.frontMap.length === current.frontMap.length;
      const fitsTrunk = trunk !== undefined && current.footprint !== trunk.footprint && c.footprint === trunk.footprint;
      if (c.fixtureOnly || c.id === current.id || !(same || fitsTrunk)) continue;
      out.push({ message: `Replace the ${hand(side)} cassette with a ${c.label}.`, config: withEnd(config, side, { cassette: c.id }), cost: 4 });
      if (l.kind === 'cassette' && r.kind === 'cassette' && side === 'right') {
        const both = withEnd(withEnd(config, 'left', { cassette: c.id }), 'right', { cassette: c.id });
        out.push({ message: `Use a ${c.label} at both ends.`, config: both, cost: 5 });
      }
    }
  }
  return out;
}

export function suggestFixes(config: LinkConfig, catalog: Catalog, limit = 3): Fix[] {
  const base = evaluateLink(config, catalog);
  if (base.verdict === 'PASS') return [];
  const fixes: Fix[] = [];
  const seen = new Set<string>();
  for (const c of candidates(config, catalog)) {
    if (seen.has(c.message)) continue;
    seen.add(c.message);
    const result = evaluateLink(c.config, catalog);
    if (RANK[result.verdict] >= RANK[base.verdict] || RANK[result.verdict] > RANK.WARN) continue;
    const newReview = result.underReview.some((u) => !base.underReview.some((b) => b.id === u.id));
    fixes.push({ message: c.message, config: c.config, verdict: result.verdict, cost: c.cost, underReview: newReview });
  }
  fixes.sort((a, b) => RANK[a.verdict] - RANK[b.verdict] || Number(a.underReview) - Number(b.underReview) || a.cost - b.cost);
  return fixes.slice(0, limit);
}
