import { fibreColour } from '../data/colours';
import { frontNumber, resolveLink, trace, type Catalog, type ChannelOutcome, type FibreTrace, type Hop, type LinkConfig, type LinkResult, type PolarityType, type Side } from '../engine';
import type { ResolvedEnd } from '../engine/resolve';

// Pure geometry: turns engine output into points and paths. No React here, and
// no polarity decisions: every fibre path is exactly the engine's hop list.

export type Orientation = 'horizontal' | 'vertical';
export type StationKey = `${Side}:${Hop['at']}`;

export interface Point {
  x: number;
  y: number;
}

export interface SlotGeom extends Point {
  /** Unique across the drawing: "left:trunk|12". */
  id: string;
  label: string;
  /** Port number for duplex slots. */
  port?: number;
  role?: 'tx' | 'rx' | 'unused';
  lit: boolean;
}

export interface StationGeom {
  key: StationKey;
  slots: SlotGeom[];
  /** Which way labels sit from the slots, along the link: −1 = before, 1 = after. */
  labelDir: -1 | 1;
  kind: Hop['at'];
}

export type BoxKind = 'equipment' | 'optic' | 'cord' | 'cassette' | 'adapter' | 'trunk' | 'plug';

export interface BoxGeom {
  id: string;
  kind: BoxKind;
  side?: Side;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub?: string;
  labelAt: Point;
  underReview: boolean;
  /** Small notes drawn below the box (horizontal) or beside it (vertical). */
  notes?: { x: number; y: number; text: string; anchor: 'start' | 'end'; tick: Point[] }[];
}

export interface FibreGeom {
  id: string;
  channelId: string;
  /** 'unlit': a fibre no transmitter feeds (e.g. Rx wired to Rx), drawn grey. */
  direction: 'forward' | 'back' | 'unlit';
  colour: string;
  colourName: string;
  /** Full path in light direction. */
  d: string;
  /** prefixes[i] = path through hops 0..i, for the step control. */
  prefixes: string[];
  points: Point[];
  slotIds: string[];
  outcome: ChannelOutcome;
  /** 'land': arrives at a bare front port (port map). */
  end: 'rx' | 'tx' | 'dark' | 'land';
  label: string;
}

/** A patch-cord connector body (LC, SC …) around one fibre. */
export interface ConnectorGeom {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LinkGeom {
  orientation: Orientation;
  width: number;
  height: number;
  stations: StationGeom[];
  boxes: BoxGeom[];
  connectors: ConnectorGeom[];
  fibres: FibreGeom[];
}

const PITCH = 22;
// Fibres pack closer at the module's rear MPO and through the cable, so they
// read as one MPO, but not so close that the moving light dots touch.
const TIGHT = 0.62;
const ALONG = { margin: 120, cord: 230, cassette: 180, adapter: 100, trunk: 320 };
const TOP = 104; // room for component labels above (horizontal)
const GUTTER = 24;
// How far each kind of box reaches past the outer fibres. The rear MPO and the
// cable are a little narrower than the module, so they read as smaller parts.
const PAD: Record<BoxKind, number> = { equipment: 18, optic: 18, cord: 18, cassette: 24, adapter: 10, trunk: 7, plug: 12 };
// The MPO plug at each end of the cable, and the jacket between them.
const PLUG = 40;
// Patch cords: each connector body, and how close the two fibres of a duplex
// cord run in the zip cord between them.
const CONN = 24;
const CONN_ACROSS = 11;
// The module-side connectors stand off the module so its port numbers show in the gap.
const FRONT_ROOM = 34;
const ZIP = 3;
const FAN = 24;
// Gap where a cord or the cable meets a module, so each part reads on its own.
const GAP = 8;
// How far the cable box runs past its end positions.
const TRUNK_OVERHANG = 6;
// Room beside the vertical drawing for the key notes.
const NOTE_ROOM = 112;

type Key = 'up' | 'down';
/** Which way the key points on each side of a cassette's rear adapter. */
export function adapterKeys(adapter: PolarityType, inverted: boolean): { module: Key; cable: Key } {
  // Type A (key-up/key-down): the two keys face opposite ways.
  // Type B (key-up/key-up): both face the same way.
  // Turning the cassette over turns the adapter over too.
  const keys: { module: Key; cable: Key } = adapter === 'B' ? { module: 'up', cable: 'up' } : { module: 'up', cable: 'down' };
  if (!inverted) return keys;
  const flipKey = (k: Key): Key => (k === 'up' ? 'down' : 'up');
  return { module: flipKey(keys.module), cable: flipKey(keys.cable) };
}

const slotKey = (h: Hop) => (h.at === 'equipment' || h.at === 'front' ? `${h.port}${h.pos}` : `${h.pos}`);
export const slotId = (h: Hop) => `${h.side}:${h.at}|${slotKey(h)}`;
const footprintLabel = (positions: number, lit: number) => `MPO-${positions} · ${lit}F`;

interface RawSlot {
  key: string;
  label: string;
  port?: number;
  role?: SlotGeom['role'];
  lit: boolean;
  /** Across position in pitch units. */
  u: number;
}

// Duplex pairs sit close together, with a wider gap between ports.
const PAIR = 0.75;
const PORT_STEP = 2.2;

function duplexSlots(ports: number[], equipment: boolean): RawSlot[] {
  const out: RawSlot[] = [];
  ports.forEach((port, k) => {
    // Cassette front: A above B, so A (odd fibre) lines up with the lower MPO
    // position and a straight cassette draws straight. Equipment: Tx (B)
    // above Rx (A), so a standard A-to-B cord draws straight and an A-to-A
    // cord shows its flip.
    const order = equipment ? (['B', 'A'] as const) : (['A', 'B'] as const);
    order.forEach((pos, j) => {
      out.push({
        key: `${port}${pos}`,
        // Module fronts number every connector: 1, 2, 3 … Equipment ports are duplex.
        label: equipment ? (pos === 'B' ? 'Tx' : 'Rx') : `${frontNumber(port, pos)}`,
        port,
        role: equipment ? (pos === 'B' ? 'tx' : 'rx') : undefined,
        lit: true,
        u: k * PORT_STEP + j * PAIR,
      });
    });
  });
  return out;
}

function positionSlots(n: number, lit: readonly number[], roleOf?: (p: number) => SlotGeom['role']): RawSlot[] {
  return Array.from({ length: n }, (_, i) => ({ key: `${i + 1}`, label: `${i + 1}`, role: roleOf?.(i + 1), lit: lit.includes(i + 1), u: i }));
}

function opticRole(end: ResolvedEnd, p: number): SlotGeom['role'] {
  if (end.kind !== 'mpoOptic') return undefined;
  for (const l of end.def.mpo?.lanes ?? []) {
    if (l.tx === p) return 'tx';
    if (l.rx === p) return 'rx';
  }
  return 'unused';
}

export function layoutLink(config: LinkConfig, result: LinkResult, catalog: Catalog, orientation: Orientation): LinkGeom {
  const link = resolveLink(config, catalog);
  const trunk = link.trunk;

  // 1. Stations along the link. Each end is placed by its distance outward
  //    from its trunk end; dir = −1 on the left, +1 on the right.
  type Raw = { key: StationKey; along: number; slots: RawSlot[]; labelDir: -1 | 1; kind: Hop['at'] };
  type Keys = ReturnType<typeof adapterKeys>;
  type BoxSpec = { kind: BoxKind; side?: Side; a0: number; a1: number; label: string; sub?: string; underReview: boolean; keys?: Keys };
  const endParts = (side: Side) => {
    const end = link[side];
    const st: { kind: Hop['at']; dist: number; slots: RawSlot[]; labelOut: boolean }[] = [];
    const bx: { kind: BoxKind; d0: number; d1: number; label: string; sub?: string; underReview: boolean; keys?: Keys }[] = [];
    if (end.kind === 'cassette') {
      const ports = end.def.frontMap.map((f) => f.port);
      const patched = ports.filter((p) => end.patched.has(p));
      const dInt = ALONG.adapter;
      const dFront = dInt + ALONG.cassette;
      const dEq = dFront + ALONG.cord;
      st.push(
        { kind: 'internal', dist: dInt, slots: positionSlots(end.def.positions, end.def.litPositions), labelOut: false },
        { kind: 'front', dist: dFront, slots: duplexSlots(ports, false), labelOut: true },
      );
      // Nothing plugged in: just the module.
      if (!end.bare) st.push({ kind: 'equipment', dist: dEq, slots: duplexSlots(patched, true), labelOut: true });
      const cord = end.cordFor(patched[0] ?? 1);
      const eqLabel = patched.length > 1 && !end.equipment.generic ? `${end.equipment.label} × ${patched.length}` : end.equipment.label;
      bx.push(
        {
          kind: 'adapter',
          d0: TRUNK_OVERHANG + GAP + 10,
          d1: dInt - 16,
          label: end.def.rearAdapter === 'B' ? 'Key-up/key-up' : 'Key-up/key-down',
          underReview: false,
          keys: adapterKeys(end.def.rearAdapter, end.mount === 'inverted'),
        },
        {
          kind: 'cassette',
          // The module outline holds its rear MPO adapter.
          d0: TRUNK_OVERHANG + GAP,
          d1: dFront + 10,
          label: end.def.label,
          sub: `${footprintLabel(end.def.positions, end.def.litPositions.length)} → ${ports.length} × ${end.def.frontConnector}`,
          underReview: !end.def.verified,
        },
      );
      if (!end.bare) {
        bx.push(
          { kind: 'cord', d0: dFront + 10 + GAP, d1: dEq - 10, label: cord.label, sub: 'patch cords', underReview: !cord.verified },
          {
            kind: 'equipment',
            d0: dEq - 10,
            d1: dEq + 76,
            label: eqLabel,
            sub: end.equipment.generic ? 'Tx | Rx' : end.equipment.formFactor,
            underReview: !end.equipment.verified,
          },
        );
      }
    } else {
      const n = end.def.mpo?.positions ?? trunk.positions;
      const all = Array.from({ length: n }, (_, i) => i + 1);
      const dOpt = ALONG.adapter + 20;
      st.push({ kind: 'optic', dist: dOpt, slots: positionSlots(n, all, (p) => opticRole(end, p)), labelOut: true });
      bx.push({ kind: 'optic', d0: dOpt - 10, d1: dOpt + 86, label: end.def.label, sub: `${end.def.connector} · ${end.def.fibre ?? ''}`.trim(), underReview: !end.def.verified });
    }
    const reach = Math.max(...bx.map((b) => b.d1));
    return { st, bx, reach };
  };

  const L = endParts('left');
  const R = endParts('right');
  const trunkL = ALONG.margin + L.reach;
  const trunkR = trunkL + ALONG.trunk;
  const total = trunkR + R.reach + ALONG.margin;

  const raw: Raw[] = [];
  const boxSpecs: BoxSpec[] = [];
  const place = (side: Side, parts: ReturnType<typeof endParts>, anchor: number, dir: -1 | 1) => {
    for (const s of parts.st) {
      raw.push({ key: `${side}:${s.kind}` as StationKey, along: anchor + dir * s.dist, slots: s.slots, labelDir: (s.labelOut ? dir : -dir) as -1 | 1, kind: s.kind });
    }
    for (const b of parts.bx) boxSpecs.push({ kind: b.kind, side, a0: anchor + dir * b.d0, a1: anchor + dir * b.d1, label: b.label, sub: b.sub, underReview: b.underReview, keys: b.keys });
  };
  place('left', L, trunkL, -1);
  const trunkSlots = () => positionSlots(trunk.positions, trunk.litPositions);
  raw.push({ key: 'left:trunk', along: trunkL, slots: trunkSlots(), labelDir: 1, kind: 'trunk' });
  raw.push({ key: 'right:trunk', along: trunkR, slots: trunkSlots(), labelDir: -1, kind: 'trunk' });
  // The cable: an MPO plug at each end and the jacket between them.
  boxSpecs.push(
    { kind: 'trunk', a0: trunkL + PLUG, a1: trunkR - PLUG, label: trunk.label, sub: footprintLabel(trunk.positions, trunk.litPositions.length), underReview: !trunk.verified },
    { kind: 'plug', a0: trunkL - TRUNK_OVERHANG, a1: trunkL + PLUG, label: trunk.label, underReview: !trunk.verified },
    { kind: 'plug', a0: trunkR + TRUNK_OVERHANG, a1: trunkR - PLUG, label: trunk.label, underReview: !trunk.verified },
  );
  place('right', R, trunkR, 1);
  raw.sort((x, y) => x.along - y.along);

  // 2. Across positions: centre every station on the widest one. The rear
  //    MPO and the cable use the tighter pitch.
  const pitchOf = (s: Raw) => (s.kind === 'internal' || s.kind === 'trunk' ? PITCH * TIGHT : PITCH);
  const span = (s: Raw) => Math.max(...s.slots.map((x) => x.u)) * pitchOf(s);
  const extent = Math.max(...raw.map(span));
  const tightHalf = Math.max(...raw.filter((s) => pitchOf(s) < PITCH).map(span)) / 2;
  const map = (along: number, across: number): Point =>
    orientation === 'horizontal' ? { x: along, y: TOP + across } : { x: GUTTER + across, y: along - ALONG.margin + 70 };

  // Where each slot sits as (along, across), for the cord drawing.
  const at = new Map<string, { along: number; across: number }>();
  const stations: StationGeom[] = raw.map((s) => {
    const off = (extent - span(s)) / 2;
    return {
      key: s.key,
      labelDir: s.labelDir,
      kind: s.kind,
      slots: s.slots.map((x) => {
        const id = `${s.key}|${x.key}`;
        const across = off + x.u * pitchOf(s);
        at.set(id, { along: s.along, across });
        return { ...map(s.along, across), id, label: x.label, port: x.port, role: x.role, lit: x.lit };
      }),
    };
  });
  const slotById = new Map(stations.flatMap((s) => s.slots.map((x) => [x.id, x] as const)));

  // Labels above the drawing alternate height so neighbours never collide.
  // Adapters carry their key notes below instead.
  const labelled = boxSpecs.filter((b) => b.kind !== 'adapter' && b.kind !== 'plug').sort((x, y) => Math.min(x.a0, x.a1) - Math.min(y.a0, y.a1));
  // Adapters draw after (on top of) the module outline that holds them, and
  // the plugs on top of the cable jacket.
  const onTop = (b: BoxSpec) => Number(b.kind === 'adapter' || b.kind === 'plug');
  boxSpecs.sort((x, y) => onTop(x) - onTop(y));
  const boxes: BoxGeom[] = boxSpecs.map((b, i) => {
    const pad = PAD[b.kind];
    const lo = Math.min(b.a0, b.a1);
    const hi = Math.max(b.a0, b.a1);
    // The rear MPO and the cable are only as wide as their tighter fibres.
    const half = b.kind === 'adapter' || b.kind === 'trunk' || b.kind === 'plug' ? tightHalf : extent / 2;
    const p0 = map(lo, extent / 2 - half - pad);
    const p1 = map(hi, extent / 2 + half + pad);
    const mid = (lo + hi) / 2;
    const order = Math.max(0, labelled.indexOf(b));
    // Vertical: end boxes carry their label at the outer edge, clear of the
    // Tx/Rx and port labels; the rest sit mid-box on an opaque pill.
    const outer = b.a1 - Math.sign(b.a1 - b.a0) * 24;
    const labelAt =
      orientation === 'horizontal'
        ? { x: mid, y: TOP - PAD.cassette - 18 - (order % 2) * 34 }
        : map(b.kind === 'equipment' || b.kind === 'optic' ? outer : mid, extent / 2);
    return {
      id: `${b.side ?? 'mid'}-${b.kind}-${i}`,
      kind: b.kind,
      side: b.side,
      x: Math.min(p0.x, p1.x),
      y: Math.min(p0.y, p1.y),
      w: Math.abs(p1.x - p0.x),
      h: Math.abs(p1.y - p0.y),
      label: b.label,
      sub: b.sub,
      labelAt,
      underReview: b.underReview,
      notes: b.keys ? keyNotes(b.a1, b.a0, b.keys, pad) : undefined,
    };
  });

  // Key notes: one at the module side of the adapter (a1), one at the cable
  // side (a0), each running away from the adapter so they read as two parts.
  function keyNotes(moduleEdge: number, cableEdge: number, keys: Keys, pad: number): NonNullable<BoxGeom['notes']> {
    const towardModule = Math.sign(moduleEdge - cableEdge);
    const note = (edge: number, text: string, away: number) => {
      if (orientation === 'horizontal') {
        const y0 = TOP + extent + pad;
        return { x: edge, y: y0 + 22, text, anchor: (away < 0 ? 'end' : 'start') as 'start' | 'end', tick: [{ x: edge, y: y0 }, { x: edge, y: y0 + 12 }] };
      }
      const x0 = GUTTER + extent + pad;
      const p = map(edge, 0);
      return { x: x0 + 18, y: p.y, text, anchor: 'start' as const, tick: [{ x: x0, y: p.y }, { x: x0 + 12, y: p.y }] };
    };
    return [
      note(moduleEdge, `Module key ${keys.module}`, towardModule),
      note(cableEdge, `Cable key ${keys.cable}`, -towardModule),
    ];
  }

  // 3. Patch cords. Each fibre leaves the module through its own connector,
  //    the pair runs close together as a zip cord, then splits again into the
  //    connectors at the equipment. An A-to-A cord crosses at that split.
  const rect = (a0: number, a1: number, across: number, h: number): ConnectorGeom => {
    const p = map(Math.min(a0, a1), across - h / 2);
    const q = map(Math.max(a0, a1), across + h / 2);
    return { x: Math.min(p.x, q.x), y: Math.min(p.y, q.y), w: Math.abs(q.x - p.x), h: Math.abs(q.y - p.y) };
  };
  const cordWay = (h: Extract<Hop, { at: 'front' }>, e: Extract<Hop, { at: 'equipment' }>) => {
    const f = at.get(slotId(h));
    const q = at.get(slotId(e));
    const a = at.get(`${h.side}:front|${h.port}A`);
    const b = at.get(`${h.side}:front|${h.port}B`);
    if (!f || !q || !a || !b) return [];
    const sgn = Math.sign(q.along - f.along);
    const zip = (a.across + b.across) / 2 + (h.pos === 'A' ? -ZIP : ZIP);
    const out = f.along + sgn * (FRONT_ROOM + CONN);
    const inn = q.along - sgn * (10 + GAP + CONN);
    return [
      map(out, f.across),
      map(out + sgn * FAN, zip),
      map(inn - sgn * FAN, zip),
      map(inn, q.across),
    ];
  };
  const connectors: ConnectorGeom[] = [];
  for (const side of ['left', 'right'] as const) {
    const end = link[side];
    if (end.kind !== 'cassette' || end.bare) continue;
    for (const port of end.patched) {
      for (const pos of ['A', 'B'] as const) {
        const f = at.get(`${side}:front|${port}${pos}`);
        const q = at.get(`${side}:equipment|${port}${pos}`);
        if (!f || !q) continue;
        const sgn = Math.sign(q.along - f.along);
        connectors.push(rect(f.along + sgn * FRONT_ROOM, f.along + sgn * (FRONT_ROOM + CONN), f.across, CONN_ACROSS));
        connectors.push(rect(q.along - sgn * (10 + GAP), q.along - sgn * (10 + GAP + CONN), q.across, CONN_ACROSS));
      }
    }
  }

  // 4. Fibres: one per traced direction of every channel.
  const fibres: FibreGeom[] = [];
  const addFibre = (t: FibreTrace, id: string, channelId: string, direction: FibreGeom['direction'], outcome: ChannelOutcome, label: string) => {
    if (t.hops.length < 2) return;
    const ids = t.hops.map(slotId);
    const points = ids.map((id) => slotById.get(id)).filter((p): p is SlotGeom => Boolean(p));
    // The drawn path also passes through the cord shape. route[k] holds the
    // path up to hop k, so the step control still moves hop by hop.
    const route: Point[] = [];
    const upTo: number[] = [];
    t.hops.forEach((h, k) => {
      const prev = t.hops[k - 1];
      if (prev && prev.side === h.side) {
        if (prev.at === 'front' && h.at === 'equipment') route.push(...cordWay(prev, h));
        if (prev.at === 'equipment' && h.at === 'front') route.push(...cordWay(h, prev).reverse());
      }
      const p = slotById.get(ids[k]);
      if (p) route.push(p);
      upTo.push(route.length);
    });
    const trunkHops = t.hops.filter((h): h is Extract<Hop, { at: 'trunk' }> => h.at === 'trunk');
    const trunkHop = trunkHops.find((h) => h.side === 'left') ?? trunkHops[0];
    const colour = trunkHop ? fibreColour(trunkHop.pos, trunk.positions) : { name: 'Unknown', hex: '#80a5d9' };
    const prefixes = upTo.filter((n) => n > 0).map((n) => pathThrough(route.slice(0, n), orientation));
    const arr = t.arrival;
    const end: FibreGeom['end'] =
      (arr.kind === 'equipment' || arr.kind === 'optic') && arr.role !== 'unused' ? arr.role : arr.kind === 'unpatched' && outcome === 'mapped' ? 'land' : 'dark';
    fibres.push({
      id,
      channelId,
      direction,
      colour: colour.hex,
      colourName: colour.tracer ? `${colour.name} with ${colour.tracer.name}` : colour.name,
      d: prefixes[prefixes.length - 1] ?? '',
      prefixes,
      points,
      slotIds: ids,
      outcome,
      end,
      label,
    });
  };
  for (const ch of result.channels) {
    for (const direction of ['forward', 'back'] as const) {
      addFibre(ch[direction], `${ch.id}:${direction}`, ch.id, direction, ch.outcome, `${ch.label}${direction === 'back' ? ' return' : ''}: ${ch.message}`);
    }
  }

  // Fibres no light enters are still real glass: trace them from each
  // receiver that nothing reached, so every fibre is drawn.
  const reached = new Set(fibres.flatMap((f) => [f.slotIds[0], f.slotIds[f.slotIds.length - 1]]));
  if (result.channels.length) {
    for (const st of stations) {
      if (st.kind !== 'equipment' && st.kind !== 'optic') continue;
      const side = st.key.startsWith('left') ? 'left' : 'right';
      for (const slot of st.slots) {
        if (slot.role !== 'rx' || reached.has(slot.id)) continue;
        const key = slot.id.split('|')[1];
        const t =
          st.kind === 'equipment'
            ? trace(link, { side, at: 'equipment', port: Number(key.slice(0, -1)), pos: key.slice(-1) as 'A' | 'B' })
            : trace(link, { side, at: 'optic', pos: Number(key) });
        const id = `unlit:${slot.id}`;
        addFibre(t, id, id, 'unlit', 'dark', `${side === 'left' ? 'End A' : 'End B'} ${slot.port ? `port ${slot.port} ` : `position ${key} `}Rx: no transmitter feeds this fibre, so no light reaches it.`);
        const f = fibres[fibres.length - 1];
        reached.add(f.slotIds[0]).add(f.slotIds[f.slotIds.length - 1]);
      }
    }
  }

  const width = orientation === 'horizontal' ? total : GUTTER * 2 + extent + NOTE_ROOM;
  const height = orientation === 'horizontal' ? TOP + extent + 56 : total - 2 * ALONG.margin + 140;
  return { orientation, width, height, stations, boxes, connectors, fibres };
}

/** Smooth path through points: each hop is an S-curve along the link. */
export function pathThrough(points: Point[], orientation: Orientation): string {
  if (!points.length) return '';
  const f = (n: number) => Math.round(n * 10) / 10;
  let d = `M${f(points[0].x)} ${f(points[0].y)}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1];
    const q = points[i];
    if (orientation === 'horizontal') {
      const m = (q.x - p.x) / 2;
      d += ` C${f(p.x + m)} ${f(p.y)} ${f(q.x - m)} ${f(q.y)} ${f(q.x)} ${f(q.y)}`;
    } else {
      const m = (q.y - p.y) / 2;
      d += ` C${f(p.x)} ${f(p.y + m)} ${f(q.x)} ${f(q.y - m)} ${f(q.x)} ${f(q.y)}`;
    }
  }
  return d;
}
