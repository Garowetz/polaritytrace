import type {
  CassetteDef,
  Catalog,
  DuplexCordDef,
  FecMode,
  Fibre,
  FrontOrientation,
  Gender,
  LinkConfig,
  EndConfig,
  Mount,
  OpticDef,
  Polish,
  Side,
  TrunkDef,
} from './types';

// Turns a LinkConfig (ids + options, what the URL stores) into resolved
// component definitions with every default filled in.

export class UnknownComponentError extends Error {
  constructor(kind: string, id: string) {
    super(`Unknown ${kind}: ${id}`);
    this.name = 'UnknownComponentError';
  }
}

export interface ResolvedCassetteEnd {
  kind: 'cassette';
  side: Side;
  def: CassetteDef;
  ports: number;
  mount: Mount;
  frontOrientation: FrontOrientation;
  rearGender: Gender;
  polish: Polish;
  fibre: Fibre;
  cordFor: (port: number) => DuplexCordDef;
  equipment: OpticDef;
  fec?: FecMode;
  patched: ReadonlySet<number>;
}

export interface ResolvedOpticEnd {
  kind: 'mpoOptic';
  side: Side;
  def: OpticDef;
  fec?: FecMode;
}

export type ResolvedEnd = ResolvedCassetteEnd | ResolvedOpticEnd;

export interface ResolvedLink {
  left: ResolvedEnd;
  right: ResolvedEnd;
  trunk: TrunkDef;
  fibre: Fibre;
  polish: Polish;
  /** Trunk end genders: [left, right]. */
  trunkGender: readonly [Gender, Gender];
}

/** Polish default: APC on singlemode MPO, UPC on multimode MPO (reference §6.0). */
export const defaultPolish = (fibre: Fibre): Polish => (fibre === 'SMF' ? 'APC' : 'UPC');

function find<T extends { id: string }>(list: readonly T[], id: string, kind: string): T {
  const hit = list.find((x) => x.id === id);
  if (!hit) throw new UnknownComponentError(kind, id);
  return hit;
}

function resolveEnd(end: EndConfig, side: Side, cable: { fibre: Fibre; polish: Polish }, catalog: Catalog): ResolvedEnd {
  if (end.kind === 'mpoOptic') {
    return { kind: 'mpoOptic', side, def: find(catalog.optics, end.optic, 'optic'), fec: end.fec };
  }
  const def = find(catalog.cassettes, end.cassette, 'cassette');
  const cord = find(catalog.cords, end.cord, 'cord');
  const overrides = new Map<number, DuplexCordDef>();
  for (const [port, id] of Object.entries(end.cordOverrides ?? {})) {
    overrides.set(Number(port), find(catalog.cords, id, 'cord'));
  }
  const ports = def.frontMap.length;
  const patched = new Set(end.patchedPorts ?? def.frontMap.map((f) => f.port));
  return {
    kind: 'cassette',
    side,
    def,
    ports,
    mount: end.mount ?? 'upright',
    frontOrientation: end.frontOrientation ?? 'A-B',
    rearGender: end.rearGender ?? 'M',
    polish: end.polish ?? cable.polish,
    fibre: end.fibre ?? cable.fibre,
    cordFor: (port) => overrides.get(port) ?? cord,
    equipment: find(catalog.optics, end.equipment, 'optic'),
    fec: end.fec,
    patched,
  };
}

export function resolveLink(config: LinkConfig, catalog: Catalog): ResolvedLink {
  const trunk = find(catalog.trunks, config.cable.trunk, 'trunk');
  const fibre = config.cable.fibre ?? 'SMF';
  const polish = config.cable.polish ?? defaultPolish(fibre);
  const cable = { fibre, polish };
  return {
    left: resolveEnd(config.left, 'left', cable, catalog),
    right: resolveEnd(config.right, 'right', cable, catalog),
    trunk,
    fibre,
    polish,
    trunkGender: config.cable.gender ?? ['F', 'F'],
  };
}
