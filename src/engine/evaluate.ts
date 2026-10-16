import { breakoutChannels, darkPorts, duplexChannels, parallelChannels } from './channels';
import { checkInterop, scopeIssues } from './interop';
import { blockingMechanical, mechanicalIssues } from './mechanical';
import { detectMethod, methodIssues } from './methods';
import { resolveLink, type ResolvedLink } from './resolve';
import type { Catalog, Channel, Described, Issue, LinkConfig, LinkResult, Mode, Sourced, Verdict } from './types';

function modeOf(link: ResolvedLink): Mode {
  const l = link.left.kind === 'cassette';
  const r = link.right.kind === 'cassette';
  if (l && r) return 'duplex';
  if (!l && !r) return 'parallel';
  return 'breakout';
}

function underReview(link: ResolvedLink): LinkResult['underReview'] {
  const parts: (Described & Sourced)[] = [link.trunk];
  for (const end of [link.left, link.right]) {
    if (end.kind === 'cassette') {
      parts.push(end.def, end.equipment);
      for (const p of end.patched) parts.push(end.cordFor(p));
    } else {
      parts.push(end.def);
    }
  }
  const seen = new Map<string, LinkResult['underReview'][number]>();
  for (const p of parts) if (!p.verified && !seen.has(p.id)) seen.set(p.id, { id: p.id, label: p.label, status: p.status });
  return [...seen.values()];
}

function interopIssues(link: ResolvedLink, mode: Mode): Issue[] {
  const { left, right } = link;
  if (mode === 'duplex' && left.kind === 'cassette' && right.kind === 'cassette') {
    return checkInterop(left.equipment, right.equipment, { fecA: left.fec, fecB: right.fec }).issues;
  }
  if (mode === 'parallel' && left.kind === 'mpoOptic' && right.kind === 'mpoOptic') {
    return checkInterop(left.def, right.def, { fecA: left.fec, fecB: right.fec }).issues;
  }
  const o = left.kind === 'mpoOptic' ? left : right.kind === 'mpoOptic' ? right : null;
  const k = left.kind === 'cassette' ? left : right.kind === 'cassette' ? right : null;
  if (!o || !k) return [];
  return checkInterop(o.def, k.equipment, { fecA: o.fec, fecB: k.fec }).issues;
}

function scope(link: ResolvedLink): Issue[] {
  const optics = [link.left, link.right].map((e) => (e.kind === 'cassette' ? e.equipment : e.def));
  const seen = new Set<string>();
  return optics.filter((o) => !seen.has(o.id) && seen.add(o.id)).flatMap(scopeIssues);
}

export function aggregate(channels: Channel[], issues: Issue[]): Verdict {
  if (issues.some((i) => i.severity === 'block')) return 'BLOCK';
  if (issues.some((i) => i.severity === 'fail') || channels.some((c) => c.verdict === 'FAIL')) return 'FAIL';
  if (issues.some((i) => i.severity === 'warn') || channels.some((c) => c.verdict === 'WARN')) return 'WARN';
  return 'PASS';
}

/** The engine entry point: evaluate a whole link. */
export function evaluateLink(config: LinkConfig, catalog: Catalog): LinkResult {
  const link = resolveLink(config, catalog);
  const mode = modeOf(link);
  const review = underReview(link);

  const blocking = blockingMechanical(link);
  if (blocking.length) {
    const issues = [...blocking, ...scope(link)];
    return { verdict: 'BLOCK', mode, method: null, channels: [], issues, darkPorts: [], underReview: review };
  }

  const channels = mode === 'duplex' ? duplexChannels(link) : mode === 'parallel' ? parallelChannels(link) : breakoutChannels(link);
  const lightOk = channels.length > 0 && channels.every((c) => c.outcome === 'tx-to-rx');
  const method = detectMethod(link, mode);
  const dark = darkPorts(link, channels);

  const issues: Issue[] = [
    ...mechanicalIssues(link),
    ...methodIssues(link, mode, method, lightOk),
    ...interopIssues(link, mode),
    ...scope(link),
  ];
  if (dark.length && mode === 'breakout') {
    const ports = dark.map((d) => d.port).join(', ');
    issues.push({ severity: 'note', code: 'dark-ports', message: `Cassette ports ${ports} carry no lane and stay dark.` });
  }
  return { verdict: aggregate(channels, issues), mode, method, channels, issues, darkPorts: dark, underReview: review };
}
