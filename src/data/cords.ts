import type { DuplexCordDef } from '../engine/types';

export const STANDARD_CORD_TOOLTIP =
  'The TIA standard duplex cord. Position A at one end arrives at position B at the other. ' +
  'Some sources call it "straight-through" (it looks straight laid flat), others "crossover". Same cord.';

export const cords: readonly DuplexCordDef[] = [
  {
    kind: 'duplexCord',
    id: 'lc-ab',
    label: 'A-to-B (standard)',
    blurb: 'Standard duplex cord: one built-in Tx/Rx cross.',
    learnMore: STANDARD_CORD_TOOLTIP,
    connector: 'LC',
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
    learnMore: 'TIA says A-to-A cords must be clearly identified by colour or labelling.',
    connector: 'LC',
    map: 'A-to-A',
    standard: false,
    source: 'polarity-reference §5.1, §3-1',
    verified: true,
    status: 'VERIFIED',
  },
];
