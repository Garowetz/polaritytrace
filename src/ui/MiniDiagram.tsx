import { fibreColour } from '../data/colours';
import type { CassetteDef, DuplexCordDef, OpticDef, TrunkDef } from '../engine';
import styles from './Picker.module.css';

// Small pictures for picker tiles, drawn straight from the data files.

const W = 132;
const H = 52;
const Y0 = 9;
const Y1 = H - 9;

const xs = (n: number, pad = 8) => (i: number) => pad + ((W - 2 * pad) * (i - 1)) / Math.max(1, n - 1);

function Frame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <svg className={styles.mini} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {children}
    </svg>
  );
}

const Dot = ({ x, y, kind = 'plain' }: { x: number; y: number; kind?: 'plain' | 'tx' | 'rx' | 'off' }) => (
  <circle cx={x} cy={y} r={2.2} className={styles[`dot_${kind}`]} />
);

export function TrunkMini({ trunk }: { trunk: TrunkDef }) {
  const n = trunk.positions;
  const x = xs(n);
  return (
    <Frame label={`${trunk.label}: end 1 positions on top, end 2 below`}>
      {trunk.litPositions.map((p) => (
        <line key={p} x1={x(p)} y1={Y0} x2={x(trunk.map[p - 1])} y2={Y1} stroke={fibreColour(p, n).hex} className={styles.wire} />
      ))}
      {Array.from({ length: n }, (_, i) => (
        <g key={i}>
          <Dot x={x(i + 1)} y={Y0} kind={trunk.litPositions.includes(i + 1) ? 'plain' : 'off'} />
          <Dot x={x(i + 1)} y={Y1} kind={trunk.litPositions.includes(i + 1) ? 'plain' : 'off'} />
        </g>
      ))}
    </Frame>
  );
}

export function CassetteMini({ cassette }: { cassette: CassetteDef }) {
  const n = cassette.positions;
  const x = xs(n);
  const ports = cassette.frontMap.length;
  // Front pairs: A and B close together under each port.
  const portX = (k: number) => 10 + ((W - 20) * (k + 0.5)) / ports;
  const pairX = (k: number, j: number) => portX(k) + (j ? 2.6 : -2.6);
  return (
    <Frame label={`${cassette.label}: MPO positions on top, duplex ports below`}>
      {cassette.frontMap.map((f, k) =>
        [f.A, f.B].map((pos, j) => <line key={`${k}${j}`} x1={x(pos)} y1={Y0} x2={pairX(k, j)} y2={Y1} stroke={fibreColour(pos, n).hex} className={styles.wire} />),
      )}
      {Array.from({ length: n }, (_, i) => (
        <Dot key={i} x={x(i + 1)} y={Y0} kind={cassette.litPositions.includes(i + 1) ? 'plain' : 'off'} />
      ))}
      {cassette.frontMap.map((_, k) => (
        <rect key={k} x={portX(k) - 5.5} y={Y1 - 3.5} width={11} height={7} rx={2} className={styles.port} />
      ))}
    </Frame>
  );
}

export function OpticMini({ optic }: { optic: OpticDef }) {
  if (!optic.mpo) {
    // Duplex optic or equipment port: one Tx, one Rx.
    return (
      <Frame label={`${optic.label}: one transmitter and one receiver`}>
        <rect x={W / 2 - 22} y={H / 2 - 12} width={44} height={24} rx={6} className={styles.port} />
        <Dot x={W / 2 - 8} y={H / 2} kind="tx" />
        <Dot x={W / 2 + 8} y={H / 2} kind="rx" />
        <text x={W / 2 - 8} y={H / 2 + 22} textAnchor="middle" className={styles.miniText}>Tx</text>
        <text x={W / 2 + 8} y={H / 2 + 22} textAnchor="middle" className={styles.miniText}>Rx</text>
      </Frame>
    );
  }
  const n = optic.mpo.positions;
  const x = xs(n);
  const role = (p: number) => (optic.mpo!.lanes.some((l) => l.tx === p) ? 'tx' : optic.mpo!.lanes.some((l) => l.rx === p) ? 'rx' : 'off');
  return (
    <Frame label={`${optic.label}: transmit positions filled, receive positions open`}>
      <rect x={3} y={H / 2 - 9} width={W - 6} height={18} rx={5} className={styles.port} />
      {Array.from({ length: n }, (_, i) => (
        <Dot key={i} x={x(i + 1)} y={H / 2} kind={role(i + 1)} />
      ))}
      <text x={x(1)} y={H - 4} className={styles.miniText}>1</text>
      <text x={x(n)} y={H - 4} textAnchor="end" className={styles.miniText}>{n}</text>
    </Frame>
  );
}

export function CordMini({ cord }: { cord: DuplexCordDef }) {
  const cross = cord.map === 'A-to-B';
  const a = 50;
  const b = 82;
  return (
    <Frame label={cross ? 'A at one end arrives at B at the other' : 'A at one end arrives at A at the other'}>
      <line x1={a} y1={Y0} x2={cross ? b : a} y2={Y1} stroke="#80a5d9" className={styles.wire} />
      <line x1={b} y1={Y0} x2={cross ? a : b} y2={Y1} stroke="#f28c28" className={styles.wire} />
      {[a, b].map((x, j) => (
        <g key={x}>
          <Dot x={x} y={Y0} />
          <Dot x={x} y={Y1} />
          <text x={x + (j ? 7 : -7)} y={Y0 + 3} textAnchor={j ? 'start' : 'end'} className={styles.miniText}>{j ? 'B' : 'A'}</text>
          <text x={x + (j ? 7 : -7)} y={Y1 + 3} textAnchor={j ? 'start' : 'end'} className={styles.miniText}>{j ? 'B' : 'A'}</text>
        </g>
      ))}
    </Frame>
  );
}
