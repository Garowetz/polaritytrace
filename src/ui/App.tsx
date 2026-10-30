import { useEffect, useMemo, useState } from 'react';
import { catalog } from '../data/catalog';
import { DEFAULT_PRESET, presets } from '../data/presets';
import { evaluateLink, suggestFixes, UnknownComponentError, walkSteps, type LinkConfig } from '../engine';
import styles from './App.module.css';
import { Canvas, type Focus } from './Canvas';
import { Builder, pickerForBox, presetFor } from './Builder';
import type { PickerTarget } from './choices';
import { StepControls, VerdictStrip } from './Controls';
import { layoutLink } from './layout';
import { Logo } from './Logo';
import { asksForLink, decodeLink, encodeLink } from './urlState';
import { useMediaQuery } from './useMediaQuery';

type Theme = 'light' | 'dark';

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const STEP_MS = 2200;

const defaultConfig = () => (presets.find((p) => p.id === DEFAULT_PRESET) ?? presets[0]).config;

export function App() {
  // Theme is per-session only: nothing is stored.
  const [theme, setTheme] = useState<Theme>(systemTheme);
  // The link comes from the URL when there is a usable one.
  const [config, setConfig] = useState<LinkConfig>(() => decodeLink(window.location.search, catalog, presets) ?? defaultConfig());
  const [badLink, setBadLink] = useState(
    () => asksForLink(window.location.search) && !decodeLink(window.location.search, catalog, presets),
  );
  const [hover, setHover] = useState<Focus | null>(null);
  const [pinned, setPinned] = useState<Focus | null>(null);
  const [step, setStep] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [picker, setPicker] = useState<PickerTarget | null>(null);

  const vertical = useMediaQuery('(max-width: 760px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Keep the URL in step with the link, without adding browser history.
  useEffect(() => {
    const url = window.location.pathname + encodeLink(config, presets) + window.location.hash;
    window.history.replaceState(null, '', url);
  }, [config]);

  const preset = presetFor(presets, config);
  const configKey = JSON.stringify(config);
  const result = useMemo(() => evaluateLink(config, catalog), [config]);
  const steps = useMemo(() => walkSteps(config, catalog, result), [config, result]);
  const fixes = useMemo(() => (result.verdict === 'PASS' ? [] : suggestFixes(config, catalog)), [config, result]);
  const geom = useMemo(() => layoutLink(config, result, catalog, vertical ? 'vertical' : 'horizontal'), [config, result, vertical]);

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

  const change = (c: LinkConfig) => {
    // A part the catalog does not know is refused, never drawn.
    try {
      evaluateLink(c, catalog);
    } catch (e) {
      if (e instanceof UnknownComponentError) return;
      throw e;
    }
    setConfig(c);
    setBadLink(false);
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
        <div className={styles.brand}>
          <Logo className={styles.logo} />
          <div>
            <h1 className={styles.title}>Polarity Trace</h1>
            <p className={styles.subtitle}>Follow the light from Tx to Rx</p>
          </div>
        </div>
        <button type="button" className={styles.themeToggle} onClick={() => setTheme(next)} aria-label={`Switch to ${next} mode`}>
          {theme === 'dark' ? 'Light mode' : 'Lab mode'}
        </button>
      </header>

      <main className={styles.main}>
        <Builder catalog={catalog} config={config} onChange={change} presets={presets} activePreset={preset?.id ?? null} picker={picker} onPicker={setPicker} />
        {badLink && (
          <p className={styles.blurb} role="status">
            That shared link uses a part this site does not know, so the default link is shown.
          </p>
        )}
        {preset && <p className={styles.blurb}>{preset.blurb}</p>}

        <section className={styles.stage} aria-label="Link diagram">
          <div className={styles.scroller}>
            <Canvas
              key={`${configKey}-${geom.orientation}`}
              geom={geom}
              focus={focus}
              onHover={setHover}
              onPin={(f) => setPinned((cur) => (cur && cur.kind === f.kind && cur.id === f.id ? null : f))}
              stepHop={stepHop}
              animate={!reducedMotion}
              onBox={(b) => setPicker(pickerForBox(b.kind, b.side))}
            />
          </div>
          <p className={styles.focusLine} aria-live="polite">
            {focusedChannel
              ? `${focusedChannel.label}: ${focusedChannel.message}`
              : focus?.kind === 'channel' && focus.id.startsWith('unlit:')
                ? geom.fibres.find((f) => f.id === focus.id)?.label
                : 'Hover or tap a fibre or connector position to follow its path.'}
          </p>
          <ul className={styles.legend} aria-label="Legend">
            <li><span className={`${styles.key} ${styles.keyOk}`} aria-hidden="true" /> Light lands on a receiver</li>
            <li><span className={`${styles.key} ${styles.keyBad}`} aria-hidden="true">✕</span> Light lands on a transmitter</li>
            <li><span className={`${styles.key} ${styles.keyTx}`} aria-hidden="true" /> Optic Tx position</li>
            <li>Small numbers are MPO positions; bold numbers are cassette ports</li>
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

        <VerdictStrip
          result={result}
          fixes={fixes}
          onApply={change}
          pinned={pinned?.kind === 'channel' ? pinned.id : null}
          onPin={(id) => setPinned((cur) => (cur?.kind === 'channel' && cur.id === id ? null : { kind: 'channel', id }))}
        />
      </main>
    </div>
  );
}
