import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog';
import { panelEnd, presets } from '../data/presets';
import { evaluateLink, type LinkConfig } from '../engine';
import { pickerForBox } from './Builder';
import { applyChoice, PANEL_TILE, panelCordsFor, selectedId } from './choices';
import { decodeLink, encodeLink } from './urlState';

// Adapter panel ends in the URL and the pickers (plan-mpo-adapter-end.md, steps 3–4).

const methodA = presets.find((p) => p.id === 'method-a')!.config;
const sr4Direct = presets.find((p) => p.id === 'sr4-direct')!.config;
const roundTrip = (c: LinkConfig) => decodeLink(encodeLink(c, presets), catalog, presets);

describe('adapter panels in the URL', () => {
  it('a panel end survives the round trip, with and without cord genders', () => {
    const c: LinkConfig = {
      left: { ...panelEnd('qsfp28-100g-sr4', 'trunk-a-12', 'A'), fec: 'RS' },
      cable: { trunk: 'trunk-a-12', fibre: 'MMF', polish: 'UPC' },
      right: { kind: 'mpoOptic', optic: 'qsfp28-100g-sr4', panel: { adapter: 'B', cord: 'trunk-b-8', cordGender: ['M', 'F'] } },
    };
    const url = encodeLink(c, presets);
    expect(url).toContain('pn:A:trunk-a-12');
    expect(url).toContain('pn:B:trunk-b-8~pg:MF');
    expect(roundTrip(c)).toEqual(c);
  });

  it('old links without a panel still open unchanged', () => {
    expect(decodeLink('?a=qsfp28-100g-sr4&t=trunk-b-8~MMF~UPC&b=qsfp28-100g-sr4', catalog, presets)).toEqual(sr4Direct);
  });

  it('bad panel tokens make the link unusable rather than guessed', () => {
    for (const b of ['qsfp28-100g-sr4~pn:C:trunk-a-12', 'qsfp28-100g-sr4~pg:MF', 'qsfp28-100g-sr4~pn:A:no-such-cord']) {
      expect(decodeLink(`?a=qsfp28-100g-sr4&t=trunk-a-12~MMF~UPC&b=${b}`, catalog, presets), b).toBeNull();
    }
  });

  it('the panel presets are just their ids', () => {
    for (const id of ['array-method-a', 'array-method-b', 'array-method-c', 'mistake-array-type-a-cords', 'sr4-panel-breakout']) {
      const p = presets.find((x) => x.id === id)!;
      expect(encodeLink(p.config, presets)).toBe(`?p=${id}`);
    }
  });
});

describe('adapter panels in the pickers', () => {
  it('choosing a panel in place of a module gives an MPO optic that fits the cable and a Type A patch cord', () => {
    const c = applyChoice(catalog, methodA, { what: 'part', side: 'right' }, PANEL_TILE.A);
    expect(c.right.kind).toBe('mpoOptic');
    if (c.right.kind !== 'mpoOptic') return;
    expect(c.right.panel).toEqual({ adapter: 'A', cord: 'trunk-a-12' });
    const optic = catalog.optics.find((o) => o.id === (c.right as { optic: string }).optic)!;
    expect(optic.connector).toBe('MPO-12');
    expect(selectedId(c, { what: 'part', side: 'right' })).toBe(PANEL_TILE.A);
    expect(selectedId(c, { what: 'cord', side: 'right' })).toBe('trunk-a-12');
    expect(() => evaluateLink(c, catalog)).not.toThrow();
  });

  it('choosing a panel at an optic end keeps the optic; the patch cord matches the trunk fibre count', () => {
    const c = applyChoice(catalog, sr4Direct, { what: 'part', side: 'left' }, PANEL_TILE.A);
    expect(c.left).toEqual(panelEnd('qsfp28-100g-sr4', 'trunk-a-8', 'A'));
  });

  it('switching the adapter keeps the patch cord', () => {
    const start = presets.find((p) => p.id === 'array-method-a')!.config;
    const c = applyChoice(catalog, start, { what: 'part', side: 'right' }, PANEL_TILE.B);
    expect(c.right).toEqual(panelEnd('qsfp28-100g-sr4', 'trunk-b-12', 'B'));
  });

  it('a plain MPO optic tile removes the panel', () => {
    const start = presets.find((p) => p.id === 'array-method-a')!.config;
    const c = applyChoice(catalog, start, { what: 'part', side: 'left' }, 'qsfp28-100g-sr4');
    expect(c.left).toEqual({ kind: 'mpoOptic', optic: 'qsfp28-100g-sr4' });
  });

  it('the patch cord picker sets the cord; the optic picker refits the cord to the new footprint', () => {
    const start = presets.find((p) => p.id === 'array-method-a')!.config;
    const cord = applyChoice(catalog, start, { what: 'cord', side: 'left' }, 'trunk-b-12');
    expect(cord.left).toEqual(panelEnd('qsfp28-100g-sr4', 'trunk-b-12', 'A'));
    const sr8 = applyChoice(catalog, start, { what: 'equipment', side: 'left' }, 'qsfpdd-400g-sr8');
    expect(sr8.left).toEqual(panelEnd('qsfpdd-400g-sr8', 'trunk-a-16', 'A'));
    expect(panelCordsFor(catalog, 'qsfpdd-400g-sr8').every((t) => t.footprint === 'MPO-16')).toBe(true);
  });

  it('tapping the drawing opens the right picker at a panel end', () => {
    const c = presets.find((p) => p.id === 'array-method-a')!.config;
    expect(pickerForBox('mpoCord', 'left', c)).toEqual({ what: 'cord', side: 'left' });
    expect(pickerForBox('optic', 'left', c)).toEqual({ what: 'equipment', side: 'left' });
    expect(pickerForBox('adapter', 'left', c)).toEqual({ what: 'part', side: 'left' });
    expect(pickerForBox('optic', 'left', sr4Direct)).toEqual({ what: 'part', side: 'left' });
  });
});
