import type { CableConfig, CassetteEnd, Catalog, EndConfig, FecMode, LinkConfig } from '../engine';
import { evaluateLink } from '../engine';
import { GENERIC_PORT } from '../data/optics';
import type { Preset } from '../data/presets';

// The whole link lives in the query string so a link can be shared.
//   ?p=method-a                                   a preset, unchanged
//   ?a=cas-a-12~lc-ab&t=trunk-a-12~SMF~APC&b=…    anything else
// Each part is ~-separated tokens: the part id first (then the cord for a
// cassette), then only the options that differ from the defaults. Ids can
// contain dots, so ~ is the separator. Anything unreadable gives null and the
// app falls back to the default link.

const FIBRES = ['SMF', 'MMF'] as const;
const POLISHES = ['APC', 'UPC'] as const;
const FECS: readonly FecMode[] = ['none', 'BASE-R', 'RS', 'KP4'];
const has = <T extends string>(list: readonly T[], v: string): v is T => (list as readonly string[]).includes(v);

function encodeEnd(end: EndConfig): string {
  if (end.kind === 'mpoOptic') return [end.optic, end.fec && `fec:${end.fec}`].filter(Boolean).join('~');
  const t: (string | undefined | false)[] = [end.cassette, end.cord];
  if (end.mount === 'inverted') t.push('inv');
  if (end.frontOrientation === 'B-A') t.push('BA');
  t.push(end.rearGender, end.fibre, end.polish);
  if (end.equipment !== GENERIC_PORT) t.push(`eq:${end.equipment}`);
  if (end.fec) t.push(`fec:${end.fec}`);
  if (end.patchedPorts) t.push(`ports:${end.patchedPorts.join('.')}`);
  for (const [port, cord] of Object.entries(end.cordOverrides ?? {})) t.push(`p${port}:${cord}`);
  return t.filter(Boolean).join('~');
}

function encodeCable(c: CableConfig): string {
  return [c.trunk, c.fibre, c.polish, c.gender?.join('')].filter(Boolean).join('~');
}

function decodeEnd(s: string, catalog: Catalog): EndConfig | null {
  const [id, ...rest] = s.split('~');
  if (catalog.optics.some((o) => o.id === id && o.mpo)) {
    if (rest.length === 0) return { kind: 'mpoOptic', optic: id };
    const fec = rest.length === 1 && rest[0].startsWith('fec:') ? rest[0].slice(4) : '';
    return has(FECS, fec) ? { kind: 'mpoOptic', optic: id, fec } : null;
  }
  const [cord, ...opts] = rest;
  if (!cord) return null;
  const end: CassetteEnd = { kind: 'cassette', cassette: id, cord, equipment: GENERIC_PORT };
  const overrides: Record<number, string> = {};
  for (const o of opts) {
    const [k, v = ''] = o.split(/:(.*)/s);
    if (o === 'inv') end.mount = 'inverted';
    else if (o === 'BA') end.frontOrientation = 'B-A';
    else if (o === 'M' || o === 'F') end.rearGender = o;
    else if (has(FIBRES, o)) end.fibre = o;
    else if (has(POLISHES, o)) end.polish = o;
    else if (k === 'eq' && v) end.equipment = v;
    else if (k === 'fec' && has(FECS, v)) end.fec = v;
    else if (k === 'ports' && /^\d+(\.\d+)*$/.test(v)) end.patchedPorts = v.split('.').map(Number);
    else if (/^p\d+$/.test(k) && v) overrides[Number(k.slice(1))] = v;
    else return null;
  }
  if (Object.keys(overrides).length) end.cordOverrides = overrides;
  return end;
}

function decodeCable(s: string): CableConfig | null {
  const [trunk, ...opts] = s.split('~');
  if (!trunk) return null;
  const cable: CableConfig = { trunk };
  for (const o of opts) {
    if (has(FIBRES, o)) cable.fibre = o;
    else if (has(POLISHES, o)) cable.polish = o;
    else if (/^[MF]{2}$/.test(o)) cable.gender = [o[0] as 'M' | 'F', o[1] as 'M' | 'F'];
    else return null;
  }
  return cable;
}

const encodeFull = (c: LinkConfig) => `?a=${encodeEnd(c.left)}&t=${encodeCable(c.cable)}&b=${encodeEnd(c.right)}`;

// Compared by encoding, so key order and unset options do not matter.
const presetOf = (config: LinkConfig, presets: readonly Preset[]) =>
  presets.find((p) => encodeFull(p.config) === encodeFull(config));

export function encodeLink(config: LinkConfig, presets: readonly Preset[]): string {
  const preset = presetOf(config, presets);
  return preset ? `?p=${preset.id}` : encodeFull(config);
}

/** The link in a query string, or null when it is missing or not usable. */
export function decodeLink(search: string, catalog: Catalog, presets: readonly Preset[]): LinkConfig | null {
  const q = new URLSearchParams(search);
  let config: LinkConfig | null = null;
  const p = q.get('p');
  if (p) {
    config = presets.find((x) => x.id === p)?.config ?? null;
  } else {
    const [a, t, b] = [q.get('a'), q.get('t'), q.get('b')];
    if (!a || !t || !b) return null;
    const left = decodeEnd(a, catalog);
    const cable = decodeCable(t);
    const right = decodeEnd(b, catalog);
    config = left && cable && right ? { left, cable, right } : null;
  }
  if (!config) return null;
  // Unknown parts make the engine throw: treat as unusable.
  try {
    evaluateLink(config, catalog);
  } catch {
    return null;
  }
  // A preset written out in full still shows as that preset.
  return presetOf(config, presets)?.config ?? config;
}

/** True when the query string tries to describe a link at all. */
export const asksForLink = (search: string) => ['p', 'a', 't', 'b'].some((k) => new URLSearchParams(search).has(k));
