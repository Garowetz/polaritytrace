import type { CassetteEnd, LinkConfig, OpticEnd } from '../engine/types';
import { GENERIC_PORT } from './optics';

// One-tap starting points. Each preset states what the engine should say about
// it, and the tests hold every preset to that.

export interface Preset {
  id: string;
  label: string;
  blurb: string;
  config: LinkConfig;
  expect: 'PASS' | 'WARN' | 'FAIL';
  /** A deliberately broken example. */
  mistake?: boolean;
  /** Relies on a part that is not VERIFIED. */
  underReview?: boolean;
}

export const cassetteEnd = (cassette: string, cord: string, extra: Partial<CassetteEnd> = {}): CassetteEnd => ({
  kind: 'cassette',
  cassette,
  cord,
  equipment: GENERIC_PORT,
  ...extra,
});

export const opticEnd = (optic: string, extra: Partial<OpticEnd> = {}): OpticEnd => ({ kind: 'mpoOptic', optic, ...extra });

const SM = { fibre: 'SMF', polish: 'APC' } as const;
const MM = { fibre: 'MMF', polish: 'UPC' } as const;

export const DEFAULT_PRESET = 'method-a';

export const presets: readonly Preset[] = [
  {
    id: 'method-a',
    label: 'TIA Method A',
    blurb: 'Type A cassettes, Type A trunk, a standard cord at one end and an A-to-A cord at the other.',
    config: {
      left: cassetteEnd('cas-a-12', 'lc-ab'),
      cable: { trunk: 'trunk-a-12', ...SM },
      right: cassetteEnd('cas-a-12', 'lc-aa'),
    },
    expect: 'PASS',
  },
  {
    id: 'mistake-method-a-standard-cords',
    label: 'Common mistake: Method A with standard cords at both ends',
    blurb: 'Two built-in crosses cancel out, so Tx lands on Tx.',
    config: {
      left: cassetteEnd('cas-a-12', 'lc-ab'),
      cable: { trunk: 'trunk-a-12', ...SM },
      right: cassetteEnd('cas-a-12', 'lc-ab'),
    },
    expect: 'FAIL',
    mistake: true,
  },
  {
    id: 'method-b',
    label: 'TIA Method B',
    blurb: 'Key-up/key-up cassettes over a Type B trunk, one cassette upside down. UPC only.',
    config: {
      left: cassetteEnd('cas-b-12', 'lc-ab'),
      cable: { trunk: 'trunk-b-12', ...MM },
      right: cassetteEnd('cas-b-12', 'lc-ab', { mount: 'inverted' }),
    },
    expect: 'PASS',
  },
  {
    id: 'method-b-b1b2',
    label: 'Method B with a far-end (B2) cassette',
    blurb: 'A matched pair: no cassette is turned over and port 1 arrives at port 1.',
    config: {
      left: cassetteEnd('cas-b-12', 'lc-ab'),
      cable: { trunk: 'trunk-b-12', ...MM },
      right: cassetteEnd('cas-b2-12', 'lc-ab'),
    },
    expect: 'PASS',
    underReview: true,
  },
  {
    id: 'method-c',
    label: 'TIA Method C',
    blurb: 'Type A cassettes and standard cords at both ends; the pair flip is in the Type C trunk.',
    config: {
      left: cassetteEnd('cas-a-12', 'lc-ab'),
      cable: { trunk: 'trunk-c-12', ...SM },
      right: cassetteEnd('cas-a-12', 'lc-ab'),
    },
    expect: 'PASS',
  },
  {
    id: 'universal-u1',
    label: 'Universal polarity (U1)',
    blurb: 'The same universal cassette and standard cords at both ends of a Type B trunk. Works on APC.',
    config: {
      left: cassetteEnd('cas-u1-12', 'lc-ab'),
      cable: { trunk: 'trunk-b-12', ...SM },
      right: cassetteEnd('cas-u1-12', 'lc-ab'),
    },
    expect: 'PASS',
  },
  {
    id: 'universal-u2',
    label: 'Universal polarity (U2)',
    blurb: 'Mirror-paired universal cassettes with key-up/key-up adapters. UPC only.',
    config: {
      left: cassetteEnd('cas-u2-12', 'lc-ab'),
      cable: { trunk: 'trunk-b-12', ...MM },
      right: cassetteEnd('cas-u2-12', 'lc-ab'),
    },
    expect: 'PASS',
  },
  {
    id: 'sr4-direct',
    label: '100G SR4 direct',
    blurb: 'Two parallel optics joined by one Type B MPO cable.',
    config: {
      left: opticEnd('qsfp28-100g-sr4'),
      cable: { trunk: 'trunk-b-8', ...MM },
      right: opticEnd('qsfp28-100g-sr4'),
    },
    expect: 'PASS',
  },
  {
    id: 'sr4-breakout',
    label: '100G SR4 to 4 × 25G breakout',
    blurb: 'SR4 → Type B trunk → universal cassette → A-to-A cords → four 25G SR optics.',
    config: {
      left: opticEnd('qsfp28-100g-sr4'),
      cable: { trunk: 'trunk-b-12', ...MM },
      right: cassetteEnd('cas-u1-12', 'lc-aa', { equipment: 'sfp28-25g-sr', patchedPorts: [1, 2, 3, 4] }),
    },
    expect: 'WARN',
    underReview: true,
  },
  {
    id: 'mistake-sr4-breakout-standard-cords',
    label: 'Common mistake: SR4 breakout with standard cords',
    blurb: 'Through a trunk, a universal cassette with standard cords puts Tx on Tx.',
    config: {
      left: opticEnd('qsfp28-100g-sr4'),
      cable: { trunk: 'trunk-b-12', ...MM },
      right: cassetteEnd('cas-u1-12', 'lc-ab', { equipment: 'sfp28-25g-sr', patchedPorts: [1, 2, 3, 4] }),
    },
    expect: 'FAIL',
    mistake: true,
    underReview: true,
  },
  {
    id: 'dr4-breakout',
    label: '400G DR4 to 4 × 100G DR breakout',
    blurb: 'Singlemode APC: DR4 → Type B trunk → universal cassette → A-to-A cords → four 100G DR.',
    config: {
      left: opticEnd('qsfpdd-400g-dr4'),
      cable: { trunk: 'trunk-b-12', ...SM },
      right: cassetteEnd('cas-u1-12', 'lc-aa', { equipment: 'qsfp28-100g-dr', patchedPorts: [1, 2, 3, 4] }),
    },
    expect: 'WARN',
  },
  {
    id: '800g-dr8-direct',
    label: '800G DR8 direct (MPO-16)',
    blurb: 'Two 800G DR8 optics joined by one MPO-16 Type B cable.',
    config: {
      left: opticEnd('osfp-800g-dr8'),
      cable: { trunk: 'trunk-b-16', ...SM },
      right: opticEnd('osfp-800g-dr8'),
    },
    expect: 'PASS',
    underReview: true,
  },
  {
    id: '800g-dr8-breakout',
    label: '800G DR8 to 8 × 100G DR breakout',
    blurb: 'DR8 → MPO-16 Type B trunk → 8-port CS module → CS-to-LC A-to-A cords → eight 100G DR.',
    config: {
      left: opticEnd('osfp-800g-dr8'),
      cable: { trunk: 'trunk-b-16', ...SM },
      right: cassetteEnd('cas-u1-16-cs', 'cs-lc-aa', { equipment: 'qsfp28-100g-dr' }),
    },
    expect: 'WARN',
    underReview: true,
  },
  {
    id: 'mistake-800g-dr8-breakout-standard-cords',
    label: 'Common mistake: 800G DR8 breakout with standard cords',
    blurb: 'Through a trunk, a universal-style module with standard cords puts Tx on Tx.',
    config: {
      left: opticEnd('osfp-800g-dr8'),
      cable: { trunk: 'trunk-b-16', ...SM },
      right: cassetteEnd('cas-u1-16-cs', 'cs-lc-ab', { equipment: 'qsfp28-100g-dr' }),
    },
    expect: 'FAIL',
    mistake: true,
    underReview: true,
  },
];
