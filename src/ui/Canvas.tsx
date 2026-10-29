import { useMemo } from 'react';
import styles from './Canvas.module.css';
import type { BoxGeom, FibreGeom, LinkGeom, SlotGeom, StationGeom } from './layout';

export type Focus = { kind: 'channel'; id: string } | { kind: 'slot'; id: string };

interface Props {
  geom: LinkGeom;
  focus: Focus | null;
  onHover: (f: Focus | null) => void;
  onPin: (f: Focus) => void;
  /** Hop index the step control has reached, or null for the whole link. */
  stepHop: number | null;
  animate: boolean;
  /** Tapping a drawn component opens its picker. */
  onBox?: (box: BoxGeom) => void;
}

const PULSE_SECONDS = 3.2;

export function Canvas({ geom, focus, onHover, onPin, stepHop, animate, onBox }: Props) {
  const lit = useMemo(() => {
    if (!focus) return null;
    if (focus.kind === 'channel') return new Set([focus.id]);
    return new Set(geom.fibres.filter((f) => f.slotIds.includes(focus.id)).map((f) => f.channelId));
  }, [focus, geom]);

  const stepping = stepHop !== null && stepHop >= 0;
  const visible = stepping ? geom.fibres.filter((f) => f.direction === 'forward') : geom.fibres;
  const pathOf = (f: FibreGeom) => (stepping ? f.prefixes[Math.min(stepHop!, f.prefixes.length - 1)] : f.d);
  const done = (f: FibreGeom) => !stepping || stepHop! >= f.points.length - 1;
  const current = stepping
    ? new Set(visible.map((f) => f.slotIds[Math.min(stepHop!, f.slotIds.length - 1)]))
    : null;

  const v = geom.orientation === 'vertical';
  return (
    <svg
      className={`${styles.canvas} ${v ? styles.vertical : styles.horizontal}`}
      viewBox={`0 0 ${geom.width} ${geom.height}`}
      role="group"
      aria-label="Link diagram. Each fibre is a coloured path from a transmitter to where its light arrives."
      onClick={(e) => {
        if (e.target === e.currentTarget) onHover(null);
      }}
    >
      <defs>
        <filter id="pt-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {geom.boxes.map((b) => (
        <BoxShape key={b.id} box={b} onBox={onBox} />
      ))}

      <g className={lit ? styles.focusing : undefined}>
        {visible.map((f) => {
          const on = !lit || lit.has(f.channelId);
          return (
            <g
              key={f.id}
              className={`${styles.fibre} ${on ? styles.on : styles.off} ${f.direction === 'unlit' ? styles.darkFibre : ''}`}
              tabIndex={0}
              role="button"
              aria-label={`${f.colourName} fibre. ${f.label}`}
              onPointerEnter={() => onHover({ kind: 'channel', id: f.channelId })}
              onPointerLeave={() => onHover(null)}
              onFocus={() => onHover({ kind: 'channel', id: f.channelId })}
              onBlur={() => onHover(null)}
              onClick={(e) => {
                e.stopPropagation();
                onPin({ kind: 'channel', id: f.channelId });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onPin({ kind: 'channel', id: f.channelId });
                }
              }}
            >
              <path d={pathOf(f)} className={styles.casing} />
              <path d={pathOf(f)} className={styles.core} style={f.direction === 'unlit' ? undefined : { stroke: f.colour }} />
              <path d={pathOf(f)} className={styles.hit} />
            </g>
          );
        })}
      </g>

      {animate && (
        <g className={styles.pulses} aria-hidden="true">
          {visible.map((f, i) =>
            f.direction !== 'unlit' && (!lit || lit.has(f.channelId)) ? (
              <circle key={`${f.id}:${stepHop ?? 'all'}`} r={4.5} className={styles.pulse} style={{ fill: f.colour }}>
                <animateMotion
                  dur={`${stepping ? 1.4 : PULSE_SECONDS}s`}
                  repeatCount="indefinite"
                  path={pathOf(f)}
                  begin={`-${((i * 0.37) % PULSE_SECONDS).toFixed(2)}s`}
                />
              </circle>
            ) : null,
          )}
        </g>
      )}

      {/* Labels sit above the pulses so moving light never covers text. */}
      {geom.boxes.map((b) => (
        <BoxLabel key={b.id} box={b} vertical={v} onBox={onBox} />
      ))}

      {geom.stations.map((s) => (
        <Station key={s.key} station={s} vertical={v} current={current} onHover={onHover} onPin={onPin} />
      ))}

      <g aria-hidden="true">
        {visible.map((f) => {
          if (f.direction === 'unlit' || !done(f) || (lit && !lit.has(f.channelId))) return null;
          const p = f.points[f.points.length - 1];
          if (!p) return null;
          return <Arrival key={f.id} x={p.x} y={p.y} end={f.end} />;
        })}
      </g>
    </svg>
  );
}

const NAMES: Record<BoxGeom['kind'], string> = {
  equipment: 'equipment',
  optic: 'optic',
  cord: 'patch cords',
  cassette: 'cassette',
  adapter: 'cassette',
  trunk: 'MPO cable',
};

function boxHandlers(box: BoxGeom, onBox?: (b: BoxGeom) => void) {
  if (!onBox) return {};
  return {
    role: 'button',
    tabIndex: 0,
    'aria-label': `Change the ${NAMES[box.kind]}: ${box.label}`,
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      onBox(box);
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onBox(box);
      }
    },
  };
}

function BoxShape({ box, onBox }: { box: BoxGeom; onBox?: (b: BoxGeom) => void }) {
  return (
    <g className={`${styles.box} ${styles[`box_${box.kind}`]} ${box.underReview ? styles.review : ''} ${onBox ? styles.pickable : ''}`} {...boxHandlers(box, onBox)}>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={box.kind === 'trunk' ? 16 : 12} />
    </g>
  );
}

function BoxLabel({ box, vertical, onBox }: { box: BoxGeom; vertical: boolean; onBox?: (b: BoxGeom) => void }) {
  const pillW = Math.max(box.label.length, (box.sub ?? '').length) * 6.4 + 18;
  return (
    <g className={`${styles.box} ${styles[`box_${box.kind}`]}`}>
      {box.notes?.map((n) => (
        <g key={n.text} className={styles.note}>
          <path d={`M${n.tick[0].x} ${n.tick[0].y} L${n.tick[1].x} ${n.tick[1].y}`} />
          <text x={n.x} y={n.y} textAnchor={n.anchor} dominantBaseline="central">
            {n.text}
          </text>
        </g>
      ))}
      {box.kind !== 'adapter' ? (
        <g
          className={`${styles.boxLabel} ${onBox ? styles.pickable : ''}`}
          transform={`translate(${box.labelAt.x} ${box.labelAt.y})`}
          onClick={(e) => {
            e.stopPropagation();
            onBox?.(box);
          }}
        >
          {vertical && <rect x={-pillW / 2} y={-15} width={pillW} height={box.sub ? 34 : 22} rx={8} className={styles.pill} />}
          <text textAnchor="middle" className={styles.labelMain}>
            {box.label}
            {box.underReview ? ' *' : ''}
          </text>
          {box.sub && (
            <text textAnchor="middle" y={14} className={styles.labelSub}>
              {box.sub}
            </text>
          )}
        </g>
      ) : null}
    </g>
  );
}

function Station({
  station,
  vertical,
  current,
  onHover,
  onPin,
}: {
  station: StationGeom;
  vertical: boolean;
  current: Set<string> | null;
  onHover: (f: Focus | null) => void;
  onPin: (f: Focus) => void;
}) {
  const off = 13 * station.labelDir;
  const anchor = vertical ? 'middle' : station.labelDir > 0 ? 'start' : 'end';
  const at = (s: SlotGeom, extra = 0) => (vertical ? { x: s.x, y: s.y + off + Math.sign(off) * extra } : { x: s.x + off + Math.sign(off) * extra, y: s.y });
  const showNumbers = station.kind === 'trunk' || station.kind === 'optic';
  const ports = station.kind === 'front' || station.kind === 'equipment';

  return (
    <g className={styles.station}>
      {station.slots.map((s) => {
        const label = at(s);
        return (
          <g
            key={s.id}
            className={`${styles.slot} ${s.lit ? '' : styles.unlit} ${s.role ? styles[`role_${s.role}`] : ''} ${current?.has(s.id) ? styles.current : ''}`}
            onPointerEnter={() => onHover({ kind: 'slot', id: s.id })}
            onPointerLeave={() => onHover(null)}
            onClick={(e) => {
              e.stopPropagation();
              onPin({ kind: 'slot', id: s.id });
            }}
          >
            <circle cx={s.x} cy={s.y} r={7.5} className={styles.slotHit} />
            <circle cx={s.x} cy={s.y} r={3.6} className={styles.dot} />
            {showNumbers && (
              <text x={label.x} y={label.y} textAnchor={anchor} dominantBaseline="central" className={styles.posLabel}>
                {s.label}
              </text>
            )}
            {station.kind === 'equipment' && (
              <text x={label.x} y={label.y} textAnchor={anchor} dominantBaseline="central" className={styles.roleLabel}>
                {s.label}
              </text>
            )}
          </g>
        );
      })}
      {ports &&
        [...new Set(station.slots.map((s) => s.port))].map((port) => {
          const pair = station.slots.filter((s) => s.port === port);
          const mid = { x: (pair[0].x + pair[pair.length - 1].x) / 2, y: (pair[0].y + pair[pair.length - 1].y) / 2 } as SlotGeom;
          const p = at(mid, station.kind === 'equipment' ? 22 : 0);
          return (
            <text key={port} x={p.x} y={p.y} textAnchor={anchor} dominantBaseline="central" className={styles.portLabel}>
              {port}
            </text>
          );
        })}
    </g>
  );
}

function Arrival({ x, y, end }: { x: number; y: number; end: FibreGeom['end'] }) {
  if (end === 'rx') return <circle cx={x} cy={y} r={7.5} className={styles.arriveOk} />;
  if (end === 'tx') {
    return (
      <g className={styles.arriveBad}>
        <circle cx={x} cy={y} r={8} />
        <path d={`M${x - 4} ${y - 4} L${x + 4} ${y + 4} M${x + 4} ${y - 4} L${x - 4} ${y + 4}`} />
      </g>
    );
  }
  return <circle cx={x} cy={y} r={7} className={styles.arriveDark} />;
}
