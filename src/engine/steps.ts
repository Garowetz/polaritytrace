import { METHOD_NAMES } from './methods';
import { resolveLink, type ResolvedCassetteEnd, type ResolvedLink, type ResolvedOpticEnd } from './resolve';
import type { Catalog, Hop, LinkConfig, LinkResult, PolarityType, Side } from './types';

// Captions for the play/step control. Each step follows channel 1's real
// trace through one component, so the numbers in the text are engine output,
// never hand-written.

export interface Step {
  /** Index into the first channel's forward hops; the light is drawn up to here. -1 = whole link. */
  hop: number;
  title: string;
  text: string;
}

const Side_ = (s: Side) => (s === 'left' ? 'End A' : 'End B');
const adapterName = (t: PolarityType) =>
  t === 'B' ? 'Key-up/key-up rear adapter (Type B)' : 'Key-up/key-down rear adapter (Type A)';
const roleText = (role: 'tx' | 'rx' | 'unused', lane?: number) =>
  role === 'unused' ? 'an unused position' : `lane ${lane} ${role === 'rx' ? 'Rx ✓' : 'Tx ✕'}`;

function startStep(link: ResolvedLink, h: Hop): Step {
  if (h.at === 'equipment') {
    const end = link[h.side] as ResolvedCassetteEnd;
    return {
      hop: 0,
      title: `${end.equipment.label}, port ${h.port}`,
      text: `Light starts at port ${h.port} Tx. The TIA rule: at the equipment, Tx is position B and Rx is position A.`,
    };
  }
  if (h.at === 'optic') {
    const end = link[h.side] as ResolvedOpticEnd;
    const n = end.def.mpo?.lanes.length ?? 0;
    return {
      hop: 0,
      title: end.def.label,
      text: `Lane ${h.lane} transmits from position ${h.pos}. Lanes 1–${n} transmit on positions 1–${n} and receive on the mirror-image positions.`,
    };
  }
  return { hop: 0, title: 'Start', text: 'Light enters the link.' };
}

function stepFor(link: ResolvedLink, prev: Hop, cur: Hop, i: number): Step {
  const cas = (s: Side) => link[s] as ResolvedCassetteEnd;
  const opt = (s: Side) => link[s] as ResolvedOpticEnd;
  if (prev.at === 'equipment' && cur.at === 'front') {
    const cord = cas(prev.side).cordFor(prev.port);
    return { hop: i, title: `${Side_(prev.side)} patch cord: ${cord.label}`, text: `Equipment position ${prev.pos} arrives at cassette port ${cur.port}, position ${cur.pos}.` };
  }
  if (prev.at === 'front' && cur.at === 'internal') {
    const end = cas(prev.side);
    const flipped = end.frontOrientation === 'B-A' ? ' Its front adapters are mounted B-A.' : '';
    return { hop: i, title: end.def.label, text: `Port ${prev.port} position ${prev.pos} is wired to internal MPO position ${cur.pos}.${flipped}` };
  }
  if (prev.at === 'internal' && cur.at === 'trunk') {
    return { hop: i, title: adapterName(cas(prev.side).def.rearAdapter), text: `Cassette MPO position ${prev.pos} meets trunk position ${cur.pos}.` };
  }
  if (prev.at === 'optic' && cur.at === 'trunk') {
    return {
      hop: i,
      title: 'Trunk plugs into the optic',
      text: `The two connector faces meet face to face, so optic position ${prev.pos} meets trunk position ${cur.pos}.`,
    };
  }
  if (prev.at === 'trunk' && cur.at === 'trunk') {
    const hint = link.trunk.hint ? ` (${link.trunk.hint.toLowerCase()})` : '';
    return { hop: i, title: link.trunk.label, text: `Position ${prev.pos} arrives at position ${cur.pos} at the far end${hint}.` };
  }
  if (prev.at === 'trunk' && cur.at === 'internal') {
    return { hop: i, title: adapterName(cas(cur.side).def.rearAdapter), text: `Trunk position ${prev.pos} meets cassette MPO position ${cur.pos}.` };
  }
  if (prev.at === 'trunk' && cur.at === 'optic') {
    return {
      hop: i,
      title: `Trunk plugs into the ${opt(cur.side).def.label}`,
      text: `Trunk position ${prev.pos} meets optic position ${cur.pos}: ${roleText(cur.role, cur.lane)}.`,
    };
  }
  if (prev.at === 'internal' && cur.at === 'front') {
    return { hop: i, title: cas(cur.side).def.label, text: `Internal MPO position ${prev.pos} is wired to port ${cur.port}, position ${cur.pos}.` };
  }
  if (prev.at === 'front' && cur.at === 'equipment') {
    const end = cas(cur.side);
    const cord = end.cordFor(cur.port);
    const lands = cur.role === 'rx' ? 'Rx ✓' : 'Tx ✕ (light meets a transmitter)';
    return { hop: i, title: `${Side_(cur.side)} patch cord: ${cord.label}`, text: `Cassette position ${prev.pos} arrives at ${end.equipment.label} port ${cur.port}, position ${cur.pos}: ${lands}.` };
  }
  return { hop: i, title: 'Next', text: '' };
}

export function walkSteps(config: LinkConfig, catalog: Catalog, result: LinkResult): Step[] {
  const first = result.channels[0];
  if (!first) {
    const block = result.issues.find((x) => x.severity === 'block');
    return [{ hop: -1, title: 'Cannot be built', text: block?.message ?? 'No light path to show.' }];
  }
  const link = resolveLink(config, catalog);
  const hops = first.forward.hops;
  const steps: Step[] = [startStep(link, hops[0])];
  for (let i = 1; i < hops.length; i++) steps.push(stepFor(link, hops[i - 1], hops[i], i));

  const a = first.forward.arrival;
  if (a.kind === 'dark' || a.kind === 'unterminated' || a.kind === 'unpatched') {
    steps[steps.length - 1] = { ...steps[steps.length - 1], text: `${steps[steps.length - 1].text} ${first.message}`.trim() };
  }
  const ok = result.channels.filter((c) => c.outcome === 'tx-to-rx').length;
  const method = result.method ? `${METHOD_NAMES[result.method]}. ` : '';
  steps.push({
    hop: -1,
    title: 'Every channel',
    text: `${method}${ok} of ${result.channels.length} channels deliver Tx to Rx, in both directions.`,
  });
  return steps;
}
