import { METHOD_NAMES, type ChannelOutcome, type Fix, type LinkConfig, type LinkResult, type Step } from '../engine';
import styles from './Controls.module.css';

const VERDICT_TEXT: Record<LinkResult['verdict'], { icon: string; text: string }> = {
  PASS: { icon: '✓', text: 'Works' },
  WARN: { icon: '!', text: 'Works, with warnings' },
  FAIL: { icon: '✕', text: 'Does not work' },
  BLOCK: { icon: '⛔', text: 'Cannot be built' },
};

const SEVERITY_ORDER = { block: 0, fail: 1, warn: 2, note: 3 } as const;

const OUTCOME: Record<ChannelOutcome, { icon: string; text: string }> = {
  'tx-to-rx': { icon: '✓', text: 'Tx reaches Rx' },
  'tx-to-tx': { icon: '✕', text: 'Tx hits Tx' },
  split: { icon: '!', text: 'Only one direction works' },
  dark: { icon: '○', text: 'No light' },
};

interface VerdictProps {
  result: LinkResult;
  fixes: Fix[];
  onApply: (c: LinkConfig) => void;
  /** The channel highlighted on the diagram, if any. */
  pinned: string | null;
  onPin: (channelId: string) => void;
}

export function VerdictStrip({ result, fixes, onApply, pinned, onPin }: VerdictProps) {
  const v = VERDICT_TEXT[result.verdict];
  const ok = result.channels.filter((c) => c.outcome === 'tx-to-rx').length;
  const issues = [...result.issues].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]).slice(0, 4);
  return (
    <section className={`${styles.verdict} ${styles[`v_${result.verdict}`]}`} aria-live="polite">
      <div className={styles.verdictHead}>
        <span className={styles.badge}>
          <span aria-hidden="true">{v.icon}</span> {v.text}
        </span>
        <span className={styles.meta}>
          {result.method ? METHOD_NAMES[result.method] : 'No standard method'}
          {result.channels.length > 0 && ` · ${ok} of ${result.channels.length} channels deliver Tx to Rx`}
        </span>
      </div>
      {result.channels.length > 0 && (
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
              <span className={styles.sev}>{i.severity === 'note' ? 'Note' : i.severity === 'warn' ? 'Warning' : i.severity === 'fail' ? 'Fails' : 'Blocked'}</span>
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
}

export function StepControls({ steps, index, playing, onIndex, onPlay }: StepProps) {
  const last = steps.length - 1;
  const shown = steps[index ?? last];
  const pos = index ?? last;
  return (
    <section className={styles.stepper} aria-label="Step through the link">
      <div className={styles.caption} aria-live="polite">
        <span className={styles.stepCount}>{index === null ? 'Whole link' : `Step ${pos + 1} of ${steps.length}`}</span>
        <strong className={styles.stepTitle}>{shown?.title}</strong>
        <span className={styles.stepText}>{shown?.text}</span>
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
        <button type="button" className={styles.all} onClick={() => onIndex(null)} disabled={index === null}>
          Show all
        </button>
      </div>
    </section>
  );
}
