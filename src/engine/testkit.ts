// Shared helpers for engine tests. Not shipped in the app bundle.
import { catalog } from '../data/catalog';
import { cassetteEnd, opticEnd } from '../data/presets';
import { evaluateLink } from './evaluate';
import type { CableConfig, EndConfig, LinkConfig, LinkResult } from './types';

export { cassetteEnd, opticEnd };

export const SM = { fibre: 'SMF', polish: 'APC' } as const;
export const MM = { fibre: 'MMF', polish: 'UPC' } as const;

export function link(left: EndConfig, cable: CableConfig, right: EndConfig): LinkConfig {
  return { left, cable, right };
}

export function run(config: LinkConfig): LinkResult {
  return evaluateLink(config, catalog);
}

export const codes = (r: LinkResult) => r.issues.map((i) => i.code);
export const outcomes = (r: LinkResult) => r.channels.map((c) => c.outcome);
