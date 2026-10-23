import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog';
import { presets } from '../data/presets';
import { evaluateLink } from '../engine';
import { applyChoice, cordsFor, pickableCassettes, pickableEquipment, pickableMpoOptics, selectedId } from './choices';

const methodA = presets.find((p) => p.id === 'method-a')!.config;

describe('picker choices', () => {
  it('every picker offer is a part the engine knows', () => {
    for (const c of pickableCassettes(catalog)) {
      expect(() => evaluateLink(applyChoice(catalog, methodA, { what: 'part', side: 'left' }, c.id), catalog)).not.toThrow();
    }
    for (const o of [...pickableMpoOptics(catalog), ...pickableEquipment(catalog)]) {
      const what = o.mpo ? 'part' : 'equipment';
      expect(() => evaluateLink(applyChoice(catalog, methodA, { what, side: 'right' }, o.id), catalog)).not.toThrow();
    }
  });

  it('a CS module gets a CS cord of the same kind', () => {
    const c = applyChoice(catalog, methodA, { what: 'part', side: 'right' }, 'cas-u1-16-cs');
    expect(c.right.kind === 'cassette' && c.right.cord).toBe('cs-lc-aa');
    expect(cordsFor(catalog, 'cas-u1-16-cs', 'generic-duplex').every((x) => x.ends.cassette === 'CS')).toBe(true);
  });

  it('a multimode optic moves the cable to multimode with the usual polish', () => {
    const c = applyChoice(catalog, methodA, { what: 'part', side: 'left' }, 'qsfp28-100g-sr4');
    expect(c.cable.fibre).toBe('MMF');
    expect(c.cable.polish).toBeUndefined();
    expect(selectedId(c, { what: 'part', side: 'left' })).toBe('qsfp28-100g-sr4');
  });

  it('changing what a cassette plugs into patches every port again', () => {
    const breakout = presets.find((p) => p.id === 'sr4-breakout')!.config;
    const c = applyChoice(catalog, breakout, { what: 'equipment', side: 'right' }, 'generic-duplex');
    expect(c.right.kind === 'cassette' && c.right.patchedPorts).toBeUndefined();
  });
});
