import type { DuplexCordDef } from '../engine/types';

export const STANDARD_CORD_TOOLTIP =
  'The TIA standard duplex cord. Position A at one end arrives at position B at the other. ' +
  'Some sources call it "straight-through" (it looks straight laid flat), others "crossover". Same cord.';

const AA_NOTE = 'TIA says A-to-A cords must be clearly identified by colour or labelling.';

// CS follows LC polarity: horizontal A/B, same A-to-B rule (reference §5.2).
const CS_SOURCE = 'polarity-reference §5.1, §5.2 (CS like LC: PARTIAL)';

export const cords: readonly DuplexCordDef[] = [
  {
    kind: 'duplexCord',
    id: 'lc-ab',
    label: 'A-to-B (standard)',
    blurb: 'Standard duplex cord: one built-in Tx/Rx cross.',
    learnMore: STANDARD_CORD_TOOLTIP,
    ends: { cassette: 'LC', equipment: 'LC' },
    map: 'A-to-B',
    standard: true,
    source: 'polarity-reference §5.1, §1 terms',
    verified: true,
    status: 'VERIFIED',
  },
  {
    kind: 'duplexCord',
    id: 'lc-aa',
    label: 'A-to-A',
    blurb: 'Non-standard cord: no cross. Only for one end of Method A, or breakout through a trunk.',
    learnMore: AA_NOTE,
    ends: { cassette: 'LC', equipment: 'LC' },
    map: 'A-to-A',
    standard: false,
    source: 'polarity-reference §5.1, §3-1',
    verified: true,
    status: 'VERIFIED',
  },
  {
    kind: 'duplexCord',
    id: 'cs-lc-ab',
    label: 'CS-to-LC, A-to-B (standard)',
    blurb: 'CS at the module, LC at the optic. Standard cord: one built-in Tx/Rx cross.',
    learnMore: STANDARD_CORD_TOOLTIP,
    ends: { cassette: 'CS', equipment: 'LC' },
    map: 'A-to-B',
    standard: true,
    source: CS_SOURCE,
    verified: false,
    status: 'PARTIAL',
  },
  {
    kind: 'duplexCord',
    id: 'cs-lc-aa',
    label: 'CS-to-LC, A-to-A',
    blurb: 'CS at the module, LC at the optic. Non-standard cord: no cross.',
    learnMore: AA_NOTE,
    ends: { cassette: 'CS', equipment: 'LC' },
    map: 'A-to-A',
    standard: false,
    source: CS_SOURCE,
    verified: false,
    status: 'PARTIAL',
  },
  {
    kind: 'duplexCord',
    id: 'cs-ab',
    label: 'CS-to-CS, A-to-B (standard)',
    blurb: 'CS at both ends. Standard cord: one built-in Tx/Rx cross.',
    learnMore: STANDARD_CORD_TOOLTIP,
    ends: { cassette: 'CS', equipment: 'CS' },
    map: 'A-to-B',
    standard: true,
    source: CS_SOURCE,
    verified: false,
    status: 'PARTIAL',
  },
  {
    kind: 'duplexCord',
    id: 'cs-aa',
    label: 'CS-to-CS, A-to-A',
    blurb: 'CS at both ends. Non-standard cord: no cross.',
    learnMore: AA_NOTE,
    ends: { cassette: 'CS', equipment: 'CS' },
    map: 'A-to-A',
    standard: false,
    source: CS_SOURCE,
    verified: false,
    status: 'PARTIAL',
  },
];
