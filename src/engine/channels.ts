import type { ResolvedCassetteEnd, ResolvedLink, ResolvedOpticEnd } from './resolve';
import { slotOf, trace } from './trace';
import type { Arrival, Channel, DuplexPos, FibreTrace, Side } from './types';

// Builds per-channel verdicts from fibre traces (reference §8 algorithm).

function describeArrival(a: Arrival): string {
  switch (a.kind) {
    case 'dark':
      return `there is no fibre at trunk position ${a.pos}`;
    case 'unterminated':
      return `cassette MPO position ${a.pos} is not wired to any front port`;
    case 'unpatched':
      return `front port ${a.port} has nothing patched`;
    case 'equipment':
      return `port ${a.port} ${a.role === 'tx' ? 'Tx' : 'Rx'} (position ${a.pos})`;
    case 'optic':
      return `optic position ${a.pos} (${a.role === 'unused' ? 'unused' : `lane ${a.lane} ${a.role === 'tx' ? 'Tx' : 'Rx'}`})`;
  }
}

const sideName = (s: Side) => (s === 'left' ? 'End A' : 'End B');

/** Cassette at both ends: one channel per patched port on the left. */
export function duplexChannels(link: ResolvedLink): Channel[] {
  const left = link.left as ResolvedCassetteEnd;
  const channels: Channel[] = [];
  for (const port of [...left.patched].sort((a, b) => a - b)) {
    const forward = trace(link, { side: 'left', at: 'equipment', port, pos: 'B' });
    const a = forward.arrival;
    const base = { id: `port-${port}`, label: `Port ${port}`, forward };
    if (a.kind !== 'equipment') {
      const back = trace(link, { side: 'left', at: 'equipment', port, pos: 'A' });
      channels.push({ ...base, back, verdict: 'FAIL', outcome: 'dark', message: `Port ${port} Tx goes nowhere: ${describeArrival(a)}.` });
      continue;
    }
    const back = trace(link, { side: 'right', at: 'equipment', port: a.port, pos: 'B' });
    const b = back.arrival;
    const farPort = a.port;
    if (a.role === 'tx') {
      channels.push({ ...base, back, farPort, verdict: 'FAIL', outcome: 'tx-to-tx', message: `Port ${port} Tx lands on far port ${farPort} Tx. No link.` });
    } else if (b.kind !== 'equipment' || b.port !== port || b.role !== 'rx') {
      channels.push({
        ...base,
        back,
        farPort,
        verdict: 'FAIL',
        outcome: b.kind === 'equipment' ? 'split' : 'dark',
        message: `Port ${port} is split: its Tx reaches far port ${farPort}, but far port ${farPort} Tx reaches ${describeArrival(b)}.`,
      });
    } else {
      const nearSlot = slotOf(left, port);
      const farSlot = a.slot;
      if (nearSlot !== farSlot) {
        channels.push({
          ...base,
          back,
          farPort,
          verdict: 'WARN',
          outcome: 'tx-to-rx',
          message: `Light works, but port ${port} arrives at far port ${farPort}. Patching by port number will go wrong.`,
        });
      } else {
        const relabel = farPort !== port ? ` The far cassette is upside down, so its printed label reads ${farPort}.` : '';
        channels.push({ ...base, back, farPort, verdict: 'PASS', outcome: 'tx-to-rx', message: `Port ${port} Tx reaches far port ${farPort} Rx.${relabel}` });
      }
    }
  }
  return channels;
}

/** MPO optic at both ends: one channel per lane of the left optic. */
export function parallelChannels(link: ResolvedLink): Channel[] {
  const left = link.left as ResolvedOpticEnd;
  const right = link.right as ResolvedOpticEnd;
  return (left.def.mpo?.lanes ?? []).map((lane) => {
    const forward = trace(link, { side: 'left', at: 'optic', pos: lane.tx });
    const a = forward.arrival;
    const base = { id: `lane-${lane.lane}`, label: `Lane ${lane.lane}`, forward };
    const farLane = a.kind === 'optic' && a.lane ? right.def.mpo?.lanes.find((l) => l.lane === a.lane) : undefined;
    const back: FibreTrace = farLane
      ? trace(link, { side: 'right', at: 'optic', pos: farLane.tx })
      : trace(link, { side: 'right', at: 'optic', pos: right.def.mpo?.lanes[lane.lane - 1]?.tx ?? lane.tx });
    const b = back.arrival;
    if (a.kind !== 'optic' || a.role === 'unused') {
      return { ...base, back, verdict: 'FAIL', outcome: 'dark', message: `Lane ${lane.lane} Tx reaches ${describeArrival(a)}.` } satisfies Channel;
    }
    if (a.role === 'tx') {
      return { ...base, back, verdict: 'FAIL', outcome: 'tx-to-tx', message: `Lane ${lane.lane} Tx lands on far ${describeArrival(a)}. No link.` } satisfies Channel;
    }
    if (b.kind !== 'optic' || b.role !== 'rx') {
      return { ...base, back, verdict: 'FAIL', outcome: 'split', message: `Return light reaches ${describeArrival(b)}.` } satisfies Channel;
    }
    if (a.lane !== lane.lane || b.lane !== lane.lane) {
      return { ...base, back, verdict: 'WARN', outcome: 'tx-to-rx', message: `Tx reaches Rx, but lane ${lane.lane} arrives on lane ${a.lane}.` } satisfies Channel;
    }
    return { ...base, back, verdict: 'PASS', outcome: 'tx-to-rx', message: `Lane ${lane.lane} Tx reaches far lane ${lane.lane} Rx, and back.` } satisfies Channel;
  });
}

/** MPO optic at one end, cassette at the other: one channel per optic lane. */
export function breakoutChannels(link: ResolvedLink): Channel[] {
  const opticSide: Side = link.left.kind === 'mpoOptic' ? 'left' : 'right';
  const cassSide: Side = opticSide === 'left' ? 'right' : 'left';
  const optic = link[opticSide] as ResolvedOpticEnd;
  return (optic.def.mpo?.lanes ?? []).map((lane) => {
    const forward = trace(link, { side: opticSide, at: 'optic', pos: lane.tx });
    const a = forward.arrival;
    const base = { id: `lane-${lane.lane}`, label: `Lane ${lane.lane}`, forward };
    if (a.kind !== 'equipment') {
      const back = trace(link, { side: opticSide, at: 'optic', pos: lane.rx });
      return { ...base, back, verdict: 'FAIL', outcome: 'dark', message: `Lane ${lane.lane} Tx reaches ${describeArrival(a)}.` } satisfies Channel;
    }
    const farPort = a.port;
    const back = trace(link, { side: cassSide, at: 'equipment', port: farPort, pos: 'B' });
    const b = back.arrival;
    if (a.role === 'tx') {
      return {
        ...base,
        back,
        farPort,
        verdict: 'FAIL',
        outcome: 'tx-to-tx',
        message: `Lane ${lane.lane} Tx lands on the Tx of the duplex optic on ${sideName(cassSide)} port ${farPort}. No link.`,
      } satisfies Channel;
    }
    if (b.kind !== 'optic' || b.role !== 'rx' || b.lane !== lane.lane) {
      return {
        ...base,
        back,
        farPort,
        verdict: 'FAIL',
        outcome: 'split',
        message: `Lane ${lane.lane} reaches port ${farPort}, but port ${farPort} Tx returns to ${describeArrival(b)}.`,
      } satisfies Channel;
    }
    return {
      ...base,
      back,
      farPort,
      verdict: 'PASS',
      outcome: 'tx-to-rx',
      message: `Lane ${lane.lane} Tx reaches port ${farPort} Rx, and port ${farPort} Tx returns to lane ${lane.lane} Rx.`,
    } satisfies Channel;
  });
}

/** Front ports that no channel's light reaches. */
export function darkPorts(link: ResolvedLink, channels: Channel[]): { side: Side; port: number }[] {
  const out: { side: Side; port: number }[] = [];
  for (const side of ['left', 'right'] as const) {
    const end = link[side];
    if (end.kind !== 'cassette') continue;
    const lit = new Set<number>();
    for (const c of channels) {
      for (const t of [c.forward, c.back]) {
        for (const h of t.hops) if (h.at === 'front' && h.side === side) lit.add(h.port);
      }
    }
    for (const fp of end.def.frontMap) if (!lit.has(fp.port)) out.push({ side, port: fp.port });
  }
  return out;
}

/** Front fibre number as printed: port p's A is 2p−1 and its B is 2p. */
export const frontNumber = (port: number, pos: DuplexPos) => 2 * port - (pos === 'A' ? 1 : 0);

/** The same fibre walked the other way, so a receive fibre is drawn arriving. */
function reversed(t: FibreTrace, link: ResolvedLink): FibreTrace {
  const hops = [...t.hops].reverse();
  const h = hops[hops.length - 1];
  const arrival: Arrival =
    h.at === 'equipment'
      ? { kind: 'equipment', side: h.side, port: h.port, pos: h.pos, role: h.role, slot: slotOf(link[h.side] as ResolvedCassetteEnd, h.port) }
      : h.at === 'optic'
        ? { kind: 'optic', side: h.side, pos: h.pos, role: h.role, lane: h.lane }
        : { kind: 'dark', side: h.side, pos: 0 };
  return { hops, arrival };
}

function landing(a: Arrival): string {
  return a.kind === 'unpatched' ? `${sideName(a.side)} port ${frontNumber(a.port, a.pos)}` : describeArrival(a);
}

const mapped = (t: FibreTrace) => (t.arrival.kind === 'unpatched' ? 'mapped' : 'dark');

/**
 * At least one cassette end has nothing plugged in, so there is no Tx/Rx pair
 * to check. Each channel shows where light from the other end lands, or, when
 * both ends are bare, where each End A front port arrives at End B.
 */
export function mapChannels(link: ResolvedLink): Channel[] {
  const bare = (s: Side) => link[s].kind === 'cassette' && (link[s] as ResolvedCassetteEnd).bare;
  const src: Side | null = !bare('left') ? 'left' : !bare('right') ? 'right' : null;

  if (src === null) {
    const left = link.left as ResolvedCassetteEnd;
    return left.def.frontMap.flatMap(({ port }) =>
      (['A', 'B'] as const).map((pos) => {
        const n = frontNumber(port, pos);
        const forward = trace(link, { side: 'left', at: 'front', port, pos });
        return {
          id: `fibre-${n}`,
          label: `Port ${n}`,
          forward,
          back: { hops: [], arrival: forward.arrival },
          verdict: 'PASS',
          outcome: mapped(forward),
          message: `End A port ${n} arrives at ${landing(forward.arrival)}.`,
        } satisfies Channel;
      }),
    );
  }

  const near = link[src];
  const sources =
    near.kind === 'mpoOptic'
      ? (near.def.mpo?.lanes ?? []).map((l) => ({
          id: `lane-${l.lane}`,
          label: `Lane ${l.lane}`,
          tx: { side: src, at: 'optic', pos: l.tx } as const,
          rx: { side: src, at: 'optic', pos: l.rx } as const,
        }))
      : [...near.patched]
          .sort((a, b) => a - b)
          .map((port) => ({
            id: `port-${port}`,
            label: `Port ${port}`,
            tx: { side: src, at: 'equipment', port, pos: 'B' } as const,
            rx: { side: src, at: 'equipment', port, pos: 'A' } as const,
          }));
  return sources.map((s) => {
    const forward = trace(link, s.tx);
    const back = reversed(trace(link, s.rx), link);
    const from = back.hops[0];
    const rxFrom = from?.at === 'front' ? `${sideName(from.side)} port ${frontNumber(from.port, from.pos)}` : 'nowhere';
    const who = src === 'left' ? s.label : `${sideName(src)} ${s.label.toLowerCase()}`;
    return {
      id: s.id,
      label: s.label,
      forward,
      back,
      verdict: 'PASS',
      outcome: mapped(forward),
      message: `${who} Tx lands on ${landing(forward.arrival)}. Its Rx is fed from ${rxFrom}.`,
    } satisfies Channel;
  });
}
