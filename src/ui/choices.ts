import { GENERIC_PORT } from '../data/optics';
import { cassetteEnd, opticEnd } from '../data/presets';
import type { CassetteEnd, Catalog, EndConfig, Fibre, LinkConfig, Side } from '../engine';

// What each picker offers, and how a choice changes the link. No polarity
// decisions here: the engine judges whatever the person builds.

export type PickerTarget = { what: 'part' | 'cord' | 'equipment'; side: Side } | { what: 'trunk' };

export const sideTitle = (s: Side) => (s === 'left' ? 'End A' : 'End B');

export const pickableCassettes = (c: Catalog) => c.cassettes.filter((x) => !x.fixtureOnly);
export const pickableMpoOptics = (c: Catalog) => c.optics.filter((o) => o.inV1 && o.mpo && !o.generic);
export const pickableEquipment = (c: Catalog) => c.optics.filter((o) => o.inV1 && !o.mpo);

const equipmentConnector = (c: Catalog, id: string) => c.optics.find((o) => o.id === id)?.connector ?? 'LC';

/** Cords whose ends fit this cassette front and this equipment. */
export function cordsFor(c: Catalog, cassette: string, equipment: string) {
  const front = c.cassettes.find((x) => x.id === cassette)?.frontConnector ?? 'LC';
  return c.cords.filter((x) => x.ends.cassette === front && x.ends.equipment === equipmentConnector(c, equipment));
}

/** Keep the current cord if it fits, else the fitting cord of the same kind (standard or A-to-A). */
export function fitCord(c: Catalog, current: string | undefined, cassette: string, equipment: string): string {
  const fits = cordsFor(c, cassette, equipment);
  if (current && fits.some((x) => x.id === current)) return current;
  const was = c.cords.find((x) => x.id === current);
  return (fits.find((x) => x.standard === (was?.standard ?? true)) ?? fits[0])?.id ?? 'lc-ab';
}

function fibreOf(c: Catalog, end: EndConfig): Fibre | null {
  const id = end.kind === 'mpoOptic' ? end.optic : end.equipment;
  return c.optics.find((o) => o.id === id)?.fibre ?? null;
}

/** Changing an end: an optic that needs a fibre type moves the cable to it. */
function withEnd(c: Catalog, config: LinkConfig, side: Side, end: EndConfig): LinkConfig {
  const next: LinkConfig = { ...config, [side]: end };
  const f = fibreOf(c, end);
  if (f && f !== (config.cable.fibre ?? 'SMF')) next.cable = { ...config.cable, fibre: f, polish: undefined };
  return next;
}

/** The id the picker should show as selected. */
export function selectedId(config: LinkConfig, t: PickerTarget): string {
  if (t.what === 'trunk') return config.cable.trunk;
  const end = config[t.side];
  if (t.what === 'part') return end.kind === 'cassette' ? end.cassette : end.optic;
  return end.kind === 'cassette' ? (t.what === 'cord' ? end.cord : end.equipment) : '';
}

export function applyChoice(c: Catalog, config: LinkConfig, t: PickerTarget, id: string): LinkConfig {
  if (t.what === 'trunk') return { ...config, cable: { ...config.cable, trunk: id } };
  const end = config[t.side];
  if (t.what === 'part') {
    if (c.optics.some((o) => o.id === id)) return withEnd(c, config, t.side, opticEnd(id));
    const prev: Partial<CassetteEnd> = end.kind === 'cassette' ? end : {};
    const equipment = prev.equipment ?? GENERIC_PORT;
    const next = cassetteEnd(id, fitCord(c, prev.cord, id, equipment), { equipment, ...(prev.mount ? { mount: prev.mount } : {}) });
    return withEnd(c, config, t.side, next);
  }
  if (end.kind !== 'cassette') return config;
  if (t.what === 'cord') return { ...config, [t.side]: { ...end, cord: id } };
  // New equipment: every port patched again, and a cord that fits it.
  const { patchedPorts: _all, ...rest } = end;
  return withEnd(c, config, t.side, { ...rest, equipment: id, cord: fitCord(c, end.cord, end.cassette, id) });
}
