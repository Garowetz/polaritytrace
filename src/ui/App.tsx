import { useEffect, useMemo, useState } from 'react';
import { catalog } from '../data/catalog';
import { DEFAULT_PRESET, presets } from '../data/presets';
import { evaluateLink, walkSteps } from '../engine';
import styles from './App.module.css';
import { Canvas, type Focus } from './Canvas';
import { PresetBar, StepControls, VerdictStrip } from './Controls';
import { layoutLink } from './layout';
import { useMediaQuery } from './useMediaQuery';

type Theme = 'light' | 'dark';

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const STEP_MS = 2200;

export function App() {
  // Theme is per-session only: nothing is stored.
  const [theme, setTheme] = useState<Theme>(systemTheme);
  const [presetId, setPresetId] = useState(DEFAULT_PRESET);
  const [hover, setHover] = useState<Focus | null>(null);
  const [pinned, setPinned] = useState<Focus | null>(null);
  const [step, setStep] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);

  const vertical = useMediaQuery('(max-width: 760px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const preset = presets.find((p) => p.id === presetId) ?? presets[0];
  const result = useMemo(() => evaluateLink(preset.config, catalog), [preset]);
  const steps = useMemo(() => walkSteps(preset.config, catalog, result), [preset, result]);
  const geom = useMemo(() => layoutLink(preset.config, result, catalog, vertical ? 'vertical' : 'horizontal'), [preset, result, vertical]);

  // Play walks the steps on a timer, then returns to the whole link.
  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => {
      const next = step === null ? 0 : step + 1;
      if (next >= steps.length) {
        setPlaying(false);
        setStep(null);
      } else {
        setStep(next);
      }
    }, step === null ? 0 : STEP_MS);
    return () => window.clearTimeout(t);
  }, [playing, step, steps.length]);

  const pick = (id: string) => {
    setPresetId(id);
    setStep(null);
    setPlaying(false);
    setPinned(null);
  };

  const focus = hover ?? pinned;
  const focusedChannel =
    focus?.kind === 'channel' ? result.channels.find((c) => c.id === focus.id) : undefined;
  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  const stepHop = step === null ? null : steps[step]?.hop ?? null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Polarity Trace</h1>
          <p className={styles.subtitle}>Follow the light from Tx to Rx</p>
        </div>
        <button type="button" className={styles.themeToggle} onClick={() => setTheme(next)} aria-label={`Switch to ${next} mode`}>
          {theme === 'dark' ? 'Light mode' : 'Lab mode'}
        </button>
      </header>

      <main className={styles.main}>
        <PresetBar presets={presets} active={preset.id} onPick={pick} />
        <p className={styles.blurb}>{preset.blurb}</p>

        <section className={styles.stage} aria-label="Link diagram">
          <div className={styles.scroller}>
            <Canvas
              key={`${preset.id}-${geom.orientation}`}
              geom={geom}
              focus={focus}
              onHover={setHover}
              onPin={(f) => setPinned((cur) => (cur && cur.kind === f.kind && cur.id === f.id ? null : f))}
              stepHop={stepHop}
              animate={!reducedMotion}
            />
          </div>
          <p className={styles.focusLine} aria-live="polite">
            {focusedChannel
              ? `${focusedChannel.label}: ${focusedChannel.message}`
              : 'Hover or tap a fibre or connector position to follow its path.'}
          </p>
          <ul className={styles.legend} aria-label="Legend">
            <li><span className={`${styles.key} ${styles.keyOk}`} aria-hidden="true" /> Light lands on a receiver</li>
            <li><span className={`${styles.key} ${styles.keyBad}`} aria-hidden="true">✕</span> Light lands on a transmitter</li>
            <li><span className={`${styles.key} ${styles.keyTx}`} aria-hidden="true" /> Optic Tx position</li>
            <li>Numbers are MPO positions; P1… are duplex ports</li>
          </ul>
        </section>

        <StepControls
          steps={steps}
          index={step}
          playing={playing}
          onIndex={(i) => {
            setPlaying(false);
            setStep(i);
          }}
          onPlay={(p) => {
            if (p && step !== null && step >= steps.length - 1) setStep(null);
            setPlaying(p);
          }}
        />

        <VerdictStrip result={result} />
      </main>
    </div>
  );
}
