import { adapterMap, apply, invert, receptacleMap } from './maps';
import type { ResolvedCassetteEnd, ResolvedEnd, ResolvedLink, ResolvedOpticEnd } from './resolve';
import type { Arrival, DuplexPos, FibreTrace, Hop, Side } from './types';

// Walks one fibre from a source at one end to wherever it arrives at the other.
// Frames, following reference §3-1:
//   equipment  duplex port p, Position A or B (Tx = B, Rx = A)
//   front      cassette front port p, Position A or B as labelled on the adapter
//   internal   cassette internal MPO position I (after the rear adapter)
//   trunk      trunk plug position P at that end (left = trunk end 1)
//   optic      optic receptacle position R, looking in keyway up

export type Source =
  | { side: Side; at: 'equipment'; port: number; pos: DuplexPos }
  | { side: Side; at: 'optic'; pos: number };

const other = (side: Side): Side => (side === 'left' ? 'right' : 'left');
const flip = (pos: DuplexPos): DuplexPos => (pos === 'A' ? 'B' : 'A');
/** TIA-568-B.3 §6.4: at the equipment, Tx = Position B, Rx = Position A. */
export const equipmentRole = (pos: DuplexPos): 'tx' | 'rx' => (pos === 'B' ? 'tx' : 'rx');

export function slotOf(end: ResolvedCassetteEnd, port: number): number {
  return end.mount === 'inverted' ? end.ports + 1 - port : port;
}

/** Equipment position ↔ cassette front position through the port's cord. */
function throughCord(end: ResolvedCassetteEnd, port: number, pos: DuplexPos): DuplexPos {
  return end.cordFor(port).map === 'A-to-B' ? flip(pos) : pos;
}

/** Front adapters mounted B-A swap which internal fibre is presented as A. */
function frontToInternal(end: ResolvedCassetteEnd, port: number, pos: DuplexPos): number {
  const fp = end.def.frontMap[port - 1];
  const wired = end.frontOrientation === 'B-A' ? flip(pos) : pos;
  return wired === 'A' ? fp.A : fp.B;
}

function internalToFront(end: ResolvedCassetteEnd, internal: number): { port: number; pos: DuplexPos } | null {
  for (const fp of end.def.frontMap) {
    const wired: DuplexPos | null = fp.A === internal ? 'A' : fp.B === internal ? 'B' : null;
    if (wired) return { port: fp.port, pos: end.frontOrientation === 'B-A' ? flip(wired) : wired };
  }
  return null;
}

function rear(end: ResolvedCassetteEnd) {
  return adapterMap(end.def.rearAdapter, end.def.positions);
}

function opticRole(end: ResolvedOpticEnd, pos: number): { role: 'tx' | 'rx' | 'unused'; lane?: number } {
  for (const l of end.def.mpo?.lanes ?? []) {
    if (l.tx === pos) return { role: 'tx', lane: l.lane };
    if (l.rx === pos) return { role: 'rx', lane: l.lane };
  }
  return { role: 'unused' };
}

function opticPositions(end: ResolvedOpticEnd): number {
  if (!end.def.mpo) throw new Error(`${end.def.label} has no MPO lane map`);
  return end.def.mpo.positions;
}

export function trace(link: ResolvedLink, source: Source): FibreTrace {
  const hops: Hop[] = [];
  const near: ResolvedEnd = link[source.side];
  let p: number;

  // 1. Source → trunk plug at the near end.
  if (source.at === 'equipment') {
    if (near.kind !== 'cassette') throw new Error('Equipment source needs a cassette end');
    hops.push({ at: 'equipment', side: source.side, port: source.port, pos: source.pos, role: equipmentRole(source.pos) });
    const frontPos = throughCord(near, source.port, source.pos);
    hops.push({ at: 'front', side: source.side, port: source.port, pos: frontPos, slot: slotOf(near, source.port) });
    const internal = frontToInternal(near, source.port, frontPos);
    hops.push({ at: 'internal', side: source.side, pos: internal });
    p = apply(rear(near), internal);
  } else {
    if (near.kind !== 'mpoOptic') throw new Error('Optic source needs an optic end');
    hops.push({ at: 'optic', side: source.side, pos: source.pos, ...opticRole(near, source.pos) });
    p = apply(receptacleMap(opticPositions(near)), source.pos);
  }
  hops.push({ at: 'trunk', side: source.side, pos: p });

  // 2. Across the trunk. Left = end 1, so left→right uses the map as written.
  if (!link.trunk.litPositions.includes(p)) {
    return { hops, arrival: { kind: 'dark', side: source.side, pos: p } };
  }
  const farSide = other(source.side);
  const trunkMap = source.side === 'left' ? link.trunk.map : invert(link.trunk.map);
  p = apply(trunkMap, p);
  hops.push({ at: 'trunk', side: farSide, pos: p });

  // 3. Far end.
  const far = link[farSide];
  let arrival: Arrival;
  if (far.kind === 'mpoOptic') {
    const pos = apply(invert(receptacleMap(opticPositions(far))), p);
    const role = opticRole(far, pos);
    hops.push({ at: 'optic', side: farSide, pos, ...role });
    arrival = { kind: 'optic', side: farSide, pos, ...role };
  } else {
    const internal = apply(invert(rear(far)), p);
    hops.push({ at: 'internal', side: farSide, pos: internal });
    const front = internalToFront(far, internal);
    if (!front) {
      arrival = { kind: 'unterminated', side: farSide, pos: internal };
    } else {
      const slot = slotOf(far, front.port);
      hops.push({ at: 'front', side: farSide, port: front.port, pos: front.pos, slot });
      if (!far.patched.has(front.port)) {
        arrival = { kind: 'unpatched', side: farSide, port: front.port, pos: front.pos };
      } else {
        const eqPos = throughCord(far, front.port, front.pos);
        const role = equipmentRole(eqPos);
        hops.push({ at: 'equipment', side: farSide, port: front.port, pos: eqPos, role });
        arrival = { kind: 'equipment', side: farSide, port: front.port, pos: eqPos, role, slot };
      }
    }
  }
  return { hops, arrival };
}
