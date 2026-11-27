import { GENERIC_PORT } from '../data/optics';
import { cassetteEnd, opticEnd } from '../data/presets';
import { NO_EQUIPMENT, type AdapterType, type CassetteEnd, type Catalog, type EndConfig, type Fibre, type LinkConfig, type OpticEnd, type Side } from '../engine';

// What each picker offers, and how a choice changes the link. No polarity
// decisions here: the engine judges whatever the person builds.

export type PickerTarget = { what: 'part' | 'cord' | 'equipment'; side: Side } | { what: 'trunk' };

export const sideTitle = (s: Side) => (s === 'left' ? 'End A' : 'End B');

export const pickableCassettes = (c: Catalog) => c.cassettes.filter((x) => !x.fixtureOnly);
export const pickableMpoOptics = (c: Catalog) => c.optics.filter((o) => o.inV1 && o.mpo && !o.generic);
export const pickableEquipment = (c: Catalog) => c.optics.filter((o) => o.inV1 && !o.mpo);

const equipmentConnector = (c: Catalog, id: string) => c.optics.find((o) => o.id === id)?.connector ?? 'LC';

/** Tile ids for the two adapter panels in the End picker. */
export const PANEL_TILE: Record<AdapterType, string> = { A: 'panel:A', B: 'panel:B' };
const panelAdapter = (id: string): AdapterType | null => (id === PANEL_TILE.A ? 'A' : id === PANEL_TILE.B ? 'B' : null);

/** MPO patch cords that fit this optic: cable definitions of the optic's footprint. */
export function panelCordsFor(c: Catalog, optic: string) {
  const fp = equipmentConnector(c, optic);
  return c.trunks.filter((t) => t.footprint === fp);
}

/**
 * Keep the patch cord if it fits the optic, else one of the same type (Type A
 * for a new panel, owner's choice 2026-11-27), at the trunk's fibre count when
 * it can be.
 */
export function fitPanelCord(c: Catalog, current: string | undefined, optic: string, trunk: string): string {
  const fits = panelCordsFor(c, optic);
  const was = c.trunks.find((t) => t.id === current);
  if (was && fits.includes(was)) return was.id;
  const polarity = was?.polarity ?? 'A';
  const cable = c.trunks.find((t) => t.id === trunk);
  const lit = was?.litPositions.length ?? cable?.litPositions.length;
  const same = fits.filter((t) => t.polarity === polarity);
  return (same.find((t) => t.litPositions.length === lit) ?? same[0] ?? fits[0])?.id ?? 'trunk-a-12';
}

/** An MPO optic that fits the cable, for a panel chosen in place of a module. */
function opticForCable(c: Catalog, config: LinkConfig): string {
  const trunk = c.trunks.find((t) => t.id === config.cable.trunk);
  const fibre = config.cable.fibre ?? 'SMF';
  const optics = pickableMpoOptics(c);
  return (
    optics.find((o) => o.connector === trunk?.footprint && o.fibre === fibre) ??
    optics.find((o) => o.connector === trunk?.footprint) ??
    optics[0]
  ).id;
}

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
  if (t.what === 'part') return end.kind === 'cassette' ? end.cassette : end.panel ? PANEL_TILE[end.panel.adapter] : end.optic;
  if (end.kind === 'mpoOptic') return end.panel ? (t.what === 'cord' ? end.panel.cord : end.optic) : '';
  return t.what === 'cord' ? end.cord : end.equipment;
}

export function applyChoice(c: Catalog, config: LinkConfig, t: PickerTarget, id: string): LinkConfig {
  if (t.what === 'trunk') return { ...config, cable: { ...config.cable, trunk: id } };
  const end = config[t.side];
  const adapter = panelAdapter(id);
  if (t.what === 'part' && adapter) {
    // An adapter panel: keep the optic and patch cord if there already are some.
    const optic = end.kind === 'mpoOptic' ? end.optic : opticForCable(c, config);
    const cord = fitPanelCord(c, end.kind === 'mpoOptic' ? end.panel?.cord : undefined, optic, config.cable.trunk);
    const keep: Partial<OpticEnd> = end.kind === 'mpoOptic' && end.fec ? { fec: end.fec } : {};
    const gender = end.kind === 'mpoOptic' && end.panel?.cordGender ? { cordGender: end.panel.cordGender } : {};
    return withEnd(c, config, t.side, opticEnd(optic, { ...keep, panel: { adapter, cord, ...gender } }));
  }
  if (end.kind === 'mpoOptic' && end.panel && t.what !== 'part') {
    if (t.what === 'cord') return { ...config, [t.side]: { ...end, panel: { ...end.panel, cord: id } } };
    // A new optic behind the panel: the patch cord follows its footprint.
    const panel = { ...end.panel, cord: fitPanelCord(c, end.panel.cord, id, config.cable.trunk) };
    return withEnd(c, config, t.side, opticEnd(id, { panel }));
  }
  if (t.what === 'part') {
    if (c.optics.some((o) => o.id === id)) return withEnd(c, config, t.side, opticEnd(id));
    const prev: Partial<CassetteEnd> = end.kind === 'cassette' ? end : {};
    const equipment = prev.equipment ?? GENERIC_PORT;
    const keep = { ...(prev.mount ? { mount: prev.mount } : {}), ...(prev.frontPolish ? { frontPolish: prev.frontPolish } : {}) };
    const next = cassetteEnd(id, fitCord(c, prev.cord, id, equipment), { equipment, ...keep });
    return withEnd(c, config, t.side, next);
  }
  if (end.kind !== 'cassette') return config;
  if (t.what === 'cord') return { ...config, [t.side]: { ...end, cord: id } };
  // New equipment: every port patched again, and a cord that fits it.
  const { patchedPorts: _all, ...rest } = end;
  // Nothing plugged in: keep the cord so it comes back if equipment is picked again.
  if (id === NO_EQUIPMENT) return { ...config, [t.side]: { ...rest, equipment: id } };
  return withEnd(c, config, t.side, { ...rest, equipment: id, cord: fitCord(c, end.cord, end.cassette, id) });
}
