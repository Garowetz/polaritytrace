import { useEffect, useMemo, useRef, useState } from 'react';
import { catalog } from '../data/catalog';
import { DEFAULT_PRESET, presets } from '../data/presets';
import { evaluateLink, modulePortMap, NO_EQUIPMENT, resolveLink, suggestFixes, UnknownComponentError, walkSteps, type LinkConfig } from '../engine';
import styles from './App.module.css';
import { Canvas, type Focus } from './Canvas';
import { Builder, pickerForBox, presetFor } from './Builder';
import type { PickerTarget } from './choices';
import { StepControls, VerdictStrip } from './Controls';
import { partsColumns } from './describe';
import { Footer, type Look } from './Footer';
import { layoutLink } from './layout';
import { Logo } from './Logo';
import { PartsCard } from './Parts';
import { savePicture } from './savePicture';
import { asksForLink, decodeLink, encodeLink } from './urlState';
import { useMediaQuery } from './useMediaQuery';

type Theme = 'light' | 'dark';

const STEP_MS = 2200;

// Layout trial: ?look=b shows the second design of the area under the drawing.
const initialLook = (): Look => (new URLSearchParams(window.location.search).get('look') === 'b' ? 'b' : 'a');

/** True while the element is at least partly on screen. */
function useOnScreen(ref: React.RefObject<HTMLElement | null>): boolean {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return on;
}

const defaultConfig = () => (presets.find((p) => p.id === DEFAULT_PRESET) ?? presets[0]).config;

export function App() {
  // Lab (dark) mode by default. Theme is per-session only: nothing is stored.
  const [theme, setTheme] = useState<Theme>('dark');
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
  const [look, setLook] = useState<Look>(initialLook);

  const vertical = useMediaQuery('(max-width: 760px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Keep the URL in step with the link, without adding browser history.
  useEffect(() => {
    const q = encodeLink(config, presets);
    const trial = look === 'b' ? `${q ? '&' : '?'}look=b` : '';
    const url = window.location.pathname + q + trial + window.location.hash;
    window.history.replaceState(null, '', url);
  }, [config, look]);

  const preset = presetFor(presets, config);
  const configKey = JSON.stringify(config);
  const result = useMemo(() => evaluateLink(config, catalog), [config]);
  const steps = useMemo(() => walkSteps(config, catalog, result), [config, result]);
  const fixes = useMemo(() => (result.verdict === 'PASS' ? [] : suggestFixes(config, catalog)), [config, result]);
  const geom = useMemo(() => layoutLink(config, result, catalog, vertical ? 'vertical' : 'horizontal'), [config, result, vertical]);
  const portMap = useMemo(() => modulePortMap(config, catalog), [config]);
  const columns = useMemo(() => partsColumns(resolveLink(config, catalog)), [config]);
  const stageRef = useRef<HTMLElement>(null);
  const stepperRef = useRef<HTMLElement>(null);
  const stageOnScreen = useOnScreen(stageRef);
  const stepperOnScreen = useOnScreen(stepperRef);
  // While stepping, keep the controls in reach when the step box scrolls away.
  const floating = (playing || step !== null) && stageOnScreen && !stepperOnScreen;
  const bare = (s: 'left' | 'right') => {
    const e = config[s];
    return e.kind === 'cassette' && e.equipment === NO_EQUIPMENT;
  };
  const endNames = { left: bare('left') ? 'Module A' : 'End A', right: bare('right') ? 'Module B' : 'End B' };
  const mapNames = { left: config.left.kind === 'cassette' ? 'Module A' : 'End A', right: config.right.kind === 'cassette' ? 'Module B' : 'End B' };
  const save = () => {
    const stage = stageRef.current;
    const svg = stage?.querySelector('svg');
    if (!stage || !svg) return;
    void savePicture(svg, getComputedStyle(stage).backgroundColor, `Polarity Trace · ${window.location.href}`, 'polarity-trace.png');
  };

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

  const stepControls = {
    steps,
    index: step,
    playing,
    onIndex: (i: number | null) => {
      setPlaying(false);
      setStep(i);
    },
    onPlay: (p: boolean) => {
      if (p && step !== null && step >= steps.length - 1) setStep(null);
      setPlaying(p);
    },
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

        <div className={styles.viewer}>
          <section className={`${styles.stage} ${look === 'b' ? styles.stageB : ''}`} aria-label="Link diagram" ref={stageRef}>
            {look === 'b' && (
              <div className={styles.overlay}>
                <button type="button" className={styles.toolButton} onClick={() => stepControls.onPlay(!playing)} aria-label={playing ? 'Pause' : 'Play the light step by step'}>
                  <span aria-hidden="true">{playing ? '❚❚' : '▶'}</span> {playing ? 'Pause' : 'Play'}
                </button>
                <button type="button" className={styles.toolButton} onClick={save}>
                  <span aria-hidden="true">⤓</span> Save picture
                </button>
              </div>
            )}
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
                sheet={look === 'a' ? 'export' : 'show'}
              />
            </div>
            <p className={styles.focusLine} aria-live="polite">
              {focusedChannel
                ? `${focusedChannel.label}: ${focusedChannel.message}`
                : focus?.kind === 'channel' && focus.id.startsWith('unlit:')
                  ? geom.fibres.find((f) => f.id === focus.id)?.label
                  : 'Tap a fibre or a port number to follow its path.'}
            </p>
            <div className={styles.toolbar}>
              <ul className={styles.legend} aria-label="Legend">
                <li><span className={`${styles.key} ${styles.keyOk}`} aria-hidden="true" /> Lands on a receiver</li>
                <li><span className={`${styles.key} ${styles.keyBad}`} aria-hidden="true">✕</span> Lands on a transmitter</li>
                <li><span className={`${styles.key} ${styles.keyTx}`} aria-hidden="true" /> Optic Tx position</li>
                <li><span className={styles.keyNum} aria-hidden="true">12</span> Small: MPO position · Bold: module port</li>
              </ul>
              {look === 'a' && (
                <button type="button" className={styles.toolButton} onClick={save}>
                  <span aria-hidden="true">⤓</span> Save picture
                </button>
              )}
            </div>
          </section>

          <StepControls ref={stepperRef} {...stepControls} />
        </div>
        {floating && <StepControls {...stepControls} floating />}

        <VerdictStrip
          result={result}
          fixes={fixes}
          onApply={change}
          pinned={pinned?.kind === 'channel' ? pinned.id : null}
          endNames={endNames}
          portMap={portMap}
          mapNames={mapNames}
          onPin={(id) => setPinned((cur) => (cur?.kind === 'channel' && cur.id === id ? null : { kind: 'channel', id }))}
        />
        {look === 'a' && <PartsCard columns={columns} />}
      </main>
      <Footer look={look} onLook={setLook} />
    </div>
  );
}
