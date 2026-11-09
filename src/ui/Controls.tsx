import { forwardRef, useState } from 'react';
import { type Channel, type Fix, type LinkConfig, type LinkResult, type Step } from '../engine';
import styles from './Controls.module.css';
import { OUTCOME, resultLine, SEVERITY_ORDER, SEVERITY_WORD, VERDICT_TEXT, verdictText } from './describe';

interface VerdictProps {
  result: LinkResult;
  fixes: Fix[];
  onApply: (c: LinkConfig) => void;
  /** The channel highlighted on the diagram, if any. */
  pinned: string | null;
  /** Column headings for a port map, e.g. Module A and Module B. */
  endNames: { left: string; right: string };
  /** Where each module port lands, shown on its own tab beside the channels. */
  portMap: Channel[];
  /** Column headings for that tab. */
  mapNames: { left: string; right: string };
  onPin: (channelId: string) => void;
}

/** A port map table: one row per fibre, a pill for each end. */
function MapTable({ channels, names, pinned, onPin }: { channels: Channel[]; names: { left: string; right: string }; pinned?: string | null; onPin?: (id: string) => void }) {
  const pill = (c: Channel, text: string) =>
    onPin ? (
      <button type="button" className={styles.rowButton} aria-pressed={pinned === c.id} onClick={() => onPin(c.id)}>
        {text}
      </button>
    ) : (
      <span className={styles.rowPill}>{text}</span>
    );
  return (
    <table className={styles.channels}>
      <caption className={styles.srOnly}>Where each port lands at the other end.</caption>
      <thead>
        <tr>
          <th scope="col">{names.left}</th>
          <th scope="col">{names.right}</th>
          <th scope="col" className={styles.detailCol}>What happens</th>
        </tr>
      </thead>
      <tbody>
        {channels.map((c) => (
          <tr key={c.id} className={`${styles.o_mapped} ${pinned === c.id ? styles.pinnedRow : ''}`}>
            <th scope="row">{pill(c, c.ends?.left ?? c.label)}</th>
            <td>{pill(c, c.ends?.right ?? '')}</td>
            <td className={styles.detailCol}>{c.message}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function VerdictStrip({ result, fixes, onApply, pinned, onPin, endNames, portMap, mapNames }: VerdictProps) {
  const v = verdictText(result);
  const map = v.map;
  const line = resultLine(result);
  const [tab, setTab] = useState<'channels' | 'map'>('channels');
  const tabs = !result.portMap && portMap.length > 0;
  const showMap = tabs && tab === 'map';
  const issues = [...result.issues].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]).slice(0, 4);
  return (
    <section className={styles.verdict} aria-labelledby="check-title">
      <h2 id="check-title" className={styles.sectionTitle}>
        {result.portMap ? 'Port map' : 'Channel check'}
      </h2>
      <p className={styles.sectionLead}>
        {result.portMap
          ? 'Nothing is plugged in at one end, so this shows where each module port lands. Tap a row to highlight it on the drawing.'
          : 'Each channel from End A to End B, and where each module port lands. Tap a channel to highlight it on the drawing.'}
      </p>
      <div className={`${styles.banner} ${styles[`b_${line.verdict.tone ?? 'none'}`]}`} aria-live="polite">
        <span className={styles.badge}>
          <span aria-hidden="true">{v.icon}</span> {v.text}
        </span>
        <span className={styles.meta}>{line.detail}</span>
      </div>
      {tabs && (
        <div className={styles.tabs} role="tablist" aria-label="Channel check views">
          <button type="button" role="tab" aria-selected={!showMap} className={styles.tab} onClick={() => setTab('channels')}>
            Channels
          </button>
          <button type="button" role="tab" aria-selected={showMap} className={styles.tab} onClick={() => setTab('map')}>
            Port map
          </button>
        </div>
      )}
      {showMap && <MapTable channels={portMap} names={mapNames} />}
      {!showMap && map && <MapTable channels={result.channels} names={endNames} pinned={pinned} onPin={onPin} />}
      {!showMap && !map && result.channels.length > 0 && (
        <table className={styles.channels}>
          <caption className={styles.srOnly}>Every channel. Select a row to highlight it on the diagram.</caption>
          <thead>
            <tr>
              <th scope="col">Channel</th>
              <th scope="col">Result</th>
              <th scope="col" className={styles.detailCol}>What happens</th>
            </tr>
          </thead>
          <tbody>
            {result.channels.map((c) => (
              <tr key={c.id} className={`${styles[`o_${c.outcome.replace(/-/g, '')}`]} ${pinned === c.id ? styles.pinnedRow : ''}`}>
                <th scope="row">
                  <button type="button" className={styles.rowButton} aria-pressed={pinned === c.id} onClick={() => onPin(c.id)}>
                    {c.label}
                  </button>
                </th>
                <td>
                  <span className={styles.outcomeIcon} aria-hidden="true">
                    {OUTCOME[c.outcome].icon}
                  </span>{' '}
                  {OUTCOME[c.outcome].text}
                </td>
                <td className={styles.detailCol}>{c.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {issues.length > 0 && (
        <ul className={styles.issues}>
          {issues.map((i, k) => (
            <li key={k} className={styles[`s_${i.severity}`]}>
              <span className={styles.sev}>{SEVERITY_WORD[i.severity]}</span>
              {i.message}
            </li>
          ))}
        </ul>
      )}
      {fixes.length > 0 && (
        <div className={styles.fixes}>
          <span className={styles.fixesTitle}>Try this</span>
          {fixes.map((f, k) => (
            <button key={k} type="button" className={styles.fix} onClick={() => onApply(f.config)}>
              {f.message}
              <span className={styles.fixVerdict}>
                {' '}
                → {VERDICT_TEXT[f.verdict].text.toLowerCase()}
                {f.underReview ? ' *' : ''}
              </span>
            </button>
          ))}
        </div>
      )}
      {result.underReview.length > 0 && (
        <p className={styles.review}>
          <span aria-hidden="true">*</span> Under review: {result.underReview.map((u) => u.label).join(', ')}. These parts rely on partial or derived data.
        </p>
      )}
    </section>
  );
}

interface StepProps {
  steps: Step[];
  index: number | null;
  playing: boolean;
  onIndex: (i: number | null) => void;
  onPlay: (p: boolean) => void;
  /** Pinned to the bottom of the screen while the step box is scrolled away. */
  floating?: boolean;
}

export const StepControls = forwardRef<HTMLElement, StepProps>(function StepControls({ steps, index, playing, onIndex, onPlay, floating }, ref) {
  const last = steps.length - 1;
  const shown = index === null ? null : steps[index];
  return (
    <section ref={ref} className={`${styles.stepper} ${floating ? styles.floating : ''}`} aria-label={floating ? 'Step controls' : 'Step through the link'}>
      <div className={styles.caption} aria-live="polite">
        <span className={styles.stepCount}>
          {floating && shown ? `Step ${index! + 1} of ${steps.length}` : `Follow the light${shown ? ` · Step ${index! + 1} of ${steps.length}` : ''}`}
        </span>
        <strong className={styles.stepTitle}>{shown ? shown.title : 'Press ▶ to trace the light one step at a time'}</strong>
        {!floating && (
          <span className={styles.stepText}>
            {shown ? shown.text : 'It travels from each transmitter through the cords, modules and cable to where it lands. Use ‹ › to move a step yourself.'}
          </span>
        )}
      </div>
      <div className={styles.buttons}>
        <button type="button" onClick={() => onIndex(Math.max(0, (index ?? 1) - 1))} disabled={index === 0} aria-label="Previous step">
          ‹
        </button>
        <button type="button" className={styles.play} onClick={() => onPlay(!playing)} aria-label={playing ? 'Pause' : 'Play the light step by step'}>
          {playing ? '❚❚' : '▶'}
        </button>
        <button type="button" onClick={() => onIndex(index === null ? 0 : Math.min(last, index + 1))} disabled={index === last} aria-label="Next step">
          ›
        </button>
        {!floating && (
          <button type="button" className={styles.all} onClick={() => onIndex(null)} disabled={index === null}>
            Show all
          </button>
        )}
      </div>
    </section>
  );
});
