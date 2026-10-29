import { describe, expect, it } from 'vitest';
import { catalog } from '../data/catalog';
import { cassetteEnd, opticEnd, presets } from '../data/presets';
import { suggestFixes, type LinkConfig } from '../engine';
import { asksForLink, decodeLink, encodeLink } from './urlState';

const methodA = presets.find((p) => p.id === 'method-a')!.config;
const roundTrip = (c: LinkConfig) => decodeLink(encodeLink(c, presets), catalog, presets);

describe('link in the URL', () => {
  it('a preset is just its id', () => {
    expect(encodeLink(methodA, presets)).toBe('?p=method-a');
    for (const p of presets) expect(roundTrip(p.config)).toBe(p.config);
  });

  it('every fix the engine suggests survives the round trip', () => {
    for (const p of presets) {
      for (const f of suggestFixes(p.config, catalog)) expect(roundTrip(f.config)).toEqual(f.config);
    }
  });

  it('keeps every option a cassette end can carry', () => {
    const c: LinkConfig = {
      left: cassetteEnd('cas-a-12', 'lc-ab', {
        mount: 'inverted',
        frontOrientation: 'B-A',
        rearGender: 'F',
        fibre: 'SMF',
        polish: 'APC',
        equipment: 'sfp28-25g-lr',
        fec: 'RS',
        patchedPorts: [1, 2, 5],
        cordOverrides: { 3: 'lc-aa' },
      }),
      cable: { trunk: 'trunk-b-12', fibre: 'SMF', polish: 'APC', gender: ['M', 'F'] },
      right: opticEnd('qsfp28-100g-psm4', { fec: 'RS' }),
    };
    const url = encodeLink(c, presets);
    expect(url).toBe(
      '?a=cas-a-12~lc-ab~inv~BA~F~SMF~APC~eq:sfp28-25g-lr~fec:RS~ports:1.2.5~p3:lc-aa' +
        '&t=trunk-b-12~SMF~APC~MF&b=qsfp28-100g-psm4~fec:RS',
    );
    expect(decodeLink(url, catalog, presets)).toEqual(c);
  });

  it('a preset written out in full is recognised as the preset', () => {
    const full = '?a=cas-a-12~lc-ab&t=trunk-a-12~SMF~APC&b=cas-a-12~lc-aa';
    expect(decodeLink(full, catalog, presets)).toBe(methodA);
  });

  it('bad or unknown links give null so the app shows the default', () => {
    for (const bad of [
      '',
      '?p=no-such-preset',
      '?a=cas-a-12~lc-ab&t=trunk-a-12',
      '?a=cas-nope~lc-ab&t=trunk-a-12&b=cas-a-12~lc-aa',
      '?a=cas-a-12~lc-ab&t=trunk-nope&b=cas-a-12~lc-aa',
      '?a=cas-a-12~lc-ab~wobble&t=trunk-a-12&b=cas-a-12~lc-aa',
      '?a=cas-a-12&t=trunk-a-12&b=cas-a-12~lc-aa',
      '?a=cas-a-12~lc-ab&t=trunk-a-12~XYZ&b=cas-a-12~lc-aa',
    ]) {
      expect(decodeLink(bad, catalog, presets), bad).toBeNull();
    }
    expect(asksForLink('')).toBe(false);
    expect(asksForLink('?p=x')).toBe(true);
  });
});
