import { useId } from 'react';

// The Polarity Trace mark: two blue strands cross from Tx to Rx (the polarity
// flip) and orange strands sit in the sides.
// public/favicon.svg is the same drawing; keep the two in step.

const OVER = 'M4 52 H16 L48 12 H60';
const UNDER = 'M4 12 H16 L48 52 H60';

export function Logo({ className }: { className?: string }) {
  const cut = useId();
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <mask id={cut} maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
        <rect width="64" height="64" fill="#fff" />
        <path d={OVER} stroke="#000" strokeWidth="14" fill="none" />
      </mask>
      <g fill="none" strokeWidth="6" strokeLinejoin="round">
        <path d="M4 22 H12 L20 32 L12 42 H4 M60 22 H52 L44 32 L52 42 H60" stroke="#F28C28" />
        <path d={UNDER} stroke="#80A5D9" mask={`url(#${cut})`} />
        <path d={OVER} stroke="#80A5D9" />
      </g>
    </svg>
  );
}
