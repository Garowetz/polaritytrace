import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog';
import { presets } from '../data/presets';
import { evaluateLink, resolveLink } from '../engine';
import { summaryLines, wrap } from './describe';

describe('the parts list under the drawing', () => {
  it('names every part with its spec, and the result', () => {
    const config = presets.find((p) => p.id === 'method-a')!.config;
    const lines = summaryLines(resolveLink(config, catalog), evaluateLink(config, catalog));
    expect(lines).toEqual([
      'End A: Type A cassette (MPO-12 · 12F APC male → 6 × LC), A-to-B (standard) patch cords (LC to LC), equipment ports',
      'MPO cable: Type A trunk (MPO-12 · 12F · Singlemode · APC · F/F)',
      'End B: Type A cassette (MPO-12 · 12F APC male → 6 × LC), A-to-A patch cords (LC to LC), equipment ports',
      'Result: Works · TIA Method A · 6 of 6 channels deliver Tx to Rx',
    ]);
  });

  it('wraps long lines at spaces', () => {
    expect(wrap('one two three four', 9)).toEqual(['one two', 'three', 'four']);
  });
});
