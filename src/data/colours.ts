// TIA-598 fibre colour code (reference §10). The UI never relies on colour
// alone: position numbers are always shown too.

export interface FibreColour {
  name: string;
  hex: string;
  /** Tracer stripe colour for positions 13–24 of a 24F unit. */
  tracer?: { name: string; hex: string };
}

const BASE: readonly FibreColour[] = [
  { name: 'Blue', hex: '#1f6fd1' },
  { name: 'Orange', hex: '#f28c28' },
  { name: 'Green', hex: '#2e9e4f' },
  { name: 'Brown', hex: '#8b5a2b' },
  { name: 'Slate', hex: '#7a8a99' },
  { name: 'White', hex: '#f4f4f4' },
  { name: 'Red', hex: '#d62f2f' },
  { name: 'Black', hex: '#1a1a1a' },
  { name: 'Yellow', hex: '#f2d230' },
  { name: 'Violet', hex: '#8e44ad' },
  { name: 'Rose', hex: '#f4a6b7' },
  { name: 'Aqua', hex: '#3cc6c9' },
];

const BLACK_TRACER = { name: 'black tracer', hex: '#1a1a1a' };
const WHITE_TRACER = { name: 'white tracer', hex: '#f4f4f4' };

/** MPO-16 positions 13–16 (TIA-598-D-1). */
const MPO16_EXTRA: readonly FibreColour[] = [
  { name: 'Olive', hex: '#7a7a2a' },
  { name: 'Magenta', hex: '#d1309a' },
  { name: 'Tan', hex: '#d2b48c' },
  { name: 'Lime', hex: '#9acd32' },
];

export const colourSource = {
  source: 'polarity-reference §10',
  verified: true,
  status: 'VERIFIED',
  /** Fibre 20 tracer (white vs yellow) is PARTIAL; TIA-598-D white is the default. */
  note: 'Fibre 20 tracer is PARTIAL: TIA-598-D says white, yellow is allowed.',
} as const;

/**
 * Colour for a 1-based position. `positions` picks the scheme: MPO-16 uses
 * olive/magenta/tan/lime for 13–16; MPO-24 uses black tracers on 13–24.
 */
export function fibreColour(position: number, positions = 12): FibreColour {
  if (position < 1 || position > Math.max(positions, 12)) throw new Error(`No colour for position ${position}`);
  if (position <= 12) return BASE[position - 1];
  if (positions === 16) return MPO16_EXTRA[position - 13];
  const base = BASE[position - 13];
  return { ...base, tracer: position === 20 ? WHITE_TRACER : BLACK_TRACER };
}
