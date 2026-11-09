import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog';
import { presets } from '../data/presets';
import { evaluateLink, modulePortMap, NO_EQUIPMENT, resolveLink, suggestFixes, type LinkConfig } from '../engine';
import { partsColumns } from './describe';
import { pdfContent, pdfSafe } from './pdfContent';

const names = { left: 'End A', right: 'End B' };
const modules = { left: 'Module A', right: 'Module B' };

function content(config: LinkConfig) {
  const result = evaluateLink(config, catalog);
  return pdfContent({
    title: 'Test',
    date: '9 November 2026',
    url: 'https://example.test/?p=x',
    result,
    fixes: result.verdict === 'PASS' ? [] : suggestFixes(config, catalog),
    columns: partsColumns(resolveLink(config, catalog)),
    portMap: modulePortMap(config, catalog),
    endNames: names,
    mapNames: modules,
  });
}

const preset = (id: string) => presets.find((p) => p.id === id)!.config;

describe('the PDF sheet', () => {
  it('lists every channel of a working Method A link, with the module port map beside it', () => {
    const c = content(preset('method-a'));
    expect(c.check.heading).toBe('Channel check');
    expect(c.check.verdict).toEqual({ text: 'Works', tone: 'good' });
    expect(c.check.table.head).toEqual(['Channel', 'Result', 'Arrives at']);
    expect(c.check.table.rows).toHaveLength(6);
    expect(c.check.table.rows[0]).toEqual({ cells: ['Port 1', 'Tx reaches Rx', 'Port 1'], tone: 'good' });
    expect(c.portMap?.table.head).toEqual(['Module A', 'Module B']);
    expect(c.portMap?.table.rows).toHaveLength(12);
    expect(c.columns.map((col) => col.heading)).toEqual(['End A', 'MPO cable', 'End B']);
    expect(c.notes.filter((n) => n.label === 'Try this')).toEqual([]);
  });

  it('marks failing channels and carries the suggested fixes', () => {
    const c = content(preset('mistake-method-a-standard-cords'));
    expect(c.check.verdict.tone).toBe('bad');
    expect(c.check.table.rows.every((r) => r.tone === 'bad')).toBe(true);
    expect(c.notes.some((n) => n.label === 'Try this')).toBe(true);
  });

  it('shows the port map itself when nothing is plugged in, with no second map', () => {
    const base = preset('method-a');
    const config: LinkConfig = { ...base, right: { ...base.right, equipment: NO_EQUIPMENT } as LinkConfig['right'] };
    const c = content(config);
    expect(c.check.heading).toBe('Port map');
    expect(c.check.verdict.tone).toBe('none');
    expect(c.check.table.head).toEqual(['End A', 'End B']);
    expect(c.portMap).toBeNull();
  });
});

describe('text for the PDF font', () => {
  it('swaps characters the built-in font lacks and keeps the ones it has', () => {
    expect(pdfSafe('Port 1 → Port 12')).toBe('Port 1 -> Port 12');
    expect(pdfSafe('17−p')).toBe('17-p');
    expect(pdfSafe('12 × LC · MPO-12 — ok')).toBe('12 × LC · MPO-12 — ok');
    expect(pdfSafe('✓ Works')).toBe(' Works');
  });
});
