import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog';
import { presets } from '../data/presets';
import { evaluateLink, resolveLink } from '../engine';
import { summaryLines, wrap } from './describe';

describe('the parts list under the drawing', () => {
  it('names every part with its spec, and the result', () => {
    const config = presets.find((p) => p.id === 'method-a')!.config;
    const lines = summaryLines(resolveLink(config, catalog), evaluateLink(config, catalog));
    expect(lines).toEqual({
      left: [
        'End A: Type A cassette',
        'Front: 12 × LC/UPC',
        'Rear: MPO/APC - 12F - Down - Male',
        'Patch cords: A-to-B (standard)',
        'Cord ends: LC/UPC to LC/UPC',
        'Plugged into: equipment ports',
      ],
      middle: ['MPO cable: Type A trunk', 'Spec: MPO/APC - 12F - F/F · Singlemode'],
      right: [
        'End B: Type A cassette',
        'Front: 12 × LC/UPC',
        'Rear: MPO/APC - 12F - Down - Male',
        'Patch cords: A-to-A',
        'Cord ends: LC/UPC to LC/UPC',
        'Plugged into: equipment ports',
      ],
      result: 'Result: Works · TIA Method A · 6 of 6 channels deliver Tx to Rx',
      verdict: { text: 'Works', tone: 'good' },
    });
  });

  it('wraps long lines at spaces', () => {
    expect(wrap('one two three four', 9)).toEqual(['one two', 'three', 'four']);
  });
});
