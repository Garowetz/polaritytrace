// Shared types for the polarity engine and the component data.
// The engine is pure: no React, no DOM, no globals. Every function takes
// plain data and returns plain data.

/** Reference status from docs/polarity-reference.md §1. */
export type Status = 'VERIFIED' | 'PARTIAL' | 'UNVERIFIED';

/** Every component carries where its data came from. */
export interface Sourced {
  /** Reference section(s) the data comes from, e.g. "polarity-reference §2.2". */
  source: string;
  /** true only when the reference marks the item VERIFIED. */
  verified: boolean;
  status: Status;
}

export interface Described {
  id: string;
  label: string;
  /** One-line plain-language description for the picker tile. */
  blurb: string;
  /** Optional longer explanation for "learn more". */
  learnMore?: string;
}

export type Fibre = 'MMF' | 'SMF';
export type Polish = 'UPC' | 'APC';
export type Gender = 'M' | 'F';
export type Footprint = 'MPO-12' | 'MPO-16' | 'MPO-24';
export type PolarityType = 'A' | 'B' | 'C';
/** Duplex position. Follows the key/latch, not left/right (reference §3-1). */
export type DuplexPos = 'A' | 'B';
/** The two ends of the link as drawn: Tx side on the left. */
export type Side = 'left' | 'right';

/** A position map over 1-based positions: map[i - 1] is where position i goes. */
export type PosMap = readonly number[];

export interface TrunkDef extends Described, Sourced {
  kind: 'trunk';
  footprint: Footprint;
  /** Physical positions in the connector (12, 16 or 24). */
  positions: number;
  /** Positions that carry a fibre. Stored separately, never derived (reference §1.1). */
  litPositions: readonly number[];
  polarity: PolarityType;
  /** End-1 position → end-2 position. */
  map: PosMap;
  /** Inline hint for the UI, e.g. "rows swap in 24F Type A". */
  hint?: string;
}

export type Transition = 'straight' | 'U1' | 'U2' | 'B2' | 'BN' | 'AF' | 'U1-row';

export interface FrontPort {
  port: number;
  /** Internal MPO position wired to duplex position A (front adapter A-B, upright). */
  A: number;
  /** Internal MPO position wired to duplex position B. */
  B: number;
}

export interface CassetteDef extends Described, Sourced {
  kind: 'cassette';
  footprint: Footprint;
  positions: number;
  litPositions: readonly number[];
  transition: Transition;
  /** Rear MPO adapter: Type A = key-up/key-down, Type B = key-up/key-up. */
  rearAdapter: PolarityType;
  /** Duplex connector on the front ports. CS follows LC polarity (reference §5.2). */
  frontConnector: DuplexConnector;
  frontMap: readonly FrontPort[];
  /** Only used as a known-bad test fixture; never offered in a picker. */
  fixtureOnly?: boolean;
}

export type CordMap = 'A-to-B' | 'A-to-A';
export type DuplexConnector = 'LC' | 'CS';

export interface DuplexCordDef extends Described, Sourced {
  kind: 'duplexCord';
  /** Connector at the cassette end and at the equipment end. */
  ends: { cassette: DuplexConnector; equipment: DuplexConnector };
  map: CordMap;
  /** A-to-B is the TIA standard cord. */
  standard: boolean;
}

export type OpticConnector = 'LC' | 'MPO-12' | 'MPO-16' | '2xMPO-12' | 'none';
export type Modulation = 'NRZ' | 'PAM4';
export type WavelengthScheme = 'single' | 'bidi2' | 'swdm4' | 'cwdm4' | 'lan-wdm4';
export type FecMode = 'none' | 'BASE-R' | 'RS' | 'KP4';

export interface Lane {
  lane: number;
  /** Receptacle position of this lane's transmitter (looking in, keyway up). */
  tx: number;
  /** Receptacle position of this lane's receiver. */
  rx: number;
}

export interface BreakoutTarget {
  /** interopGroup of the far-end optic. */
  group: string;
  /** How many far-end optics one parallel port feeds. */
  count: number;
  verdict: 'PASS' | 'WARN';
  /** Conditions in plain language (FEC, reach caps, switch mode). */
  note: string;
  status: Status;
}

export interface OpticDef extends Described, Sourced {
  kind: 'optic';
  /** Generic equipment port: Tx | Rx, no interop checks. */
  generic?: boolean;
  formFactor: string;
  /** Standard name, e.g. "100GBASE-SR4 (IEEE 802.3 Cl. 95)". */
  standard: string;
  connector: OpticConnector;
  /** Lane map for MPO optics, positions looking into the receptacle keyway up. */
  mpo?: { positions: number; lanes: readonly Lane[]; txLabel?: string; rxLabel?: string };
  fibre: Fibre | null;
  polish: Polish | null;
  speed: string;
  reach: string;
  laneRateGbps: number | null;
  modulation: Modulation | null;
  wavelengthScheme: WavelengthScheme | null;
  interopGroup: string;
  /** FEC the optic runs by default, only where the reference states one. */
  fec?: FecMode;
  breakout?: readonly BreakoutTarget[];
  /** Explicitly false for variants that cannot break out. */
  breakoutSupported?: boolean;
  /** Plain-language note on vendor-only modes, shown as a note. */
  vendorModeNote?: string;
  /** Shown in v1 pickers. Out-of-scope optics stay in data for interop checks. */
  inV1: boolean;
}

export interface Catalog {
  trunks: readonly TrunkDef[];
  cassettes: readonly CassetteDef[];
  cords: readonly DuplexCordDef[];
  optics: readonly OpticDef[];
}

// ---------------------------------------------------------------------------
// Link configuration (what the URL will encode)

export type Mount = 'upright' | 'inverted';
export type FrontOrientation = 'A-B' | 'B-A';

export interface CassetteEnd {
  kind: 'cassette';
  cassette: string;
  mount?: Mount;
  frontOrientation?: FrontOrientation;
  rearGender?: Gender;
  polish?: Polish;
  fibre?: Fibre;
  /** Cord used on every front port. */
  cord: string;
  /** Per-port cord override, keyed by printed port number. */
  cordOverrides?: Readonly<Record<number, string>>;
  /** Duplex optic id on each patched port, or the generic equipment port. */
  equipment: string;
  fec?: FecMode;
  /** Printed ports that are patched. Default: all. */
  patchedPorts?: readonly number[];
}

export interface OpticEnd {
  kind: 'mpoOptic';
  optic: string;
  fec?: FecMode;
}

export type EndConfig = CassetteEnd | OpticEnd;

export interface CableConfig {
  trunk: string;
  fibre?: Fibre;
  polish?: Polish;
  /** Gender of trunk end 1 (left) and end 2 (right). */
  gender?: readonly [Gender, Gender];
}

export interface LinkConfig {
  left: EndConfig;
  cable: CableConfig;
  right: EndConfig;
}

// ---------------------------------------------------------------------------
// Engine output

export type Severity = 'note' | 'warn' | 'fail' | 'block';
export type Verdict = 'PASS' | 'WARN' | 'FAIL' | 'BLOCK';

export interface Issue {
  severity: Severity;
  code: string;
  message: string;
  side?: Side;
}

/** One stop on a fibre's path, in the direction the light travels. */
export type Hop =
  | { at: 'equipment'; side: Side; port: number; pos: DuplexPos; role: 'tx' | 'rx' }
  | { at: 'front'; side: Side; port: number; pos: DuplexPos; slot: number }
  | { at: 'internal'; side: Side; pos: number }
  | { at: 'trunk'; side: Side; pos: number }
  | { at: 'optic'; side: Side; pos: number; role: 'tx' | 'rx' | 'unused'; lane?: number };

export type Arrival =
  | { kind: 'equipment'; side: Side; port: number; pos: DuplexPos; role: 'tx' | 'rx'; slot: number }
  | { kind: 'optic'; side: Side; pos: number; role: 'tx' | 'rx' | 'unused'; lane?: number }
  /** No fibre at this trunk position. */
  | { kind: 'dark'; side: Side; pos: number }
  /** Reaches a cassette MPO position with no front port wired to it. */
  | { kind: 'unterminated'; side: Side; pos: number }
  /** Reaches a front port with nothing patched. */
  | { kind: 'unpatched'; side: Side; port: number; pos: DuplexPos };

export interface FibreTrace {
  hops: Hop[];
  arrival: Arrival;
}

export type ChannelOutcome = 'tx-to-rx' | 'tx-to-tx' | 'split' | 'dark';

export interface Channel {
  id: string;
  /** Duplex port on the left, or parallel lane number. */
  label: string;
  verdict: Verdict;
  outcome: ChannelOutcome;
  /** Light leaving the left Tx. */
  forward: FibreTrace;
  /** Light leaving the right Tx back to the left. */
  back: FibreTrace;
  /** Far-end port (printed) for duplex and breakout channels. */
  farPort?: number;
  message: string;
}

export type Mode = 'duplex' | 'parallel' | 'breakout';

export type MethodId = 'A' | 'A-modified' | 'B' | 'C' | 'U1' | 'U2' | 'direct-B' | 'breakout-U';

export interface LinkResult {
  verdict: Verdict;
  mode: Mode;
  method: MethodId | null;
  channels: Channel[];
  issues: Issue[];
  /** Front ports that no light reaches, per side. */
  darkPorts: { side: Side; port: number }[];
  /** Components in this link that are not VERIFIED. */
  underReview: { id: string; label: string; status: Status }[];
}
