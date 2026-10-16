import { useEffect, useState } from 'react';
import styles from './App.module.css';

type Theme = 'light' | 'dark';

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Placeholder shell. The link canvas replaces the demo fibre in step 3.
export function App() {
  // Theme is per-session only: nothing is stored.
  const [theme, setTheme] = useState<Theme>(systemTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const next: Theme = theme === 'dark' ? 'light' : 'dark';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Polarity Trace</h1>
          <p className={styles.subtitle}>Follow the light from Tx to Rx</p>
        </div>
        <button
          type="button"
          className={styles.themeToggle}
          onClick={() => setTheme(next)}
          aria-label={`Switch to ${next} mode`}
        >
          {theme === 'dark' ? 'Light mode' : 'Lab mode'}
        </button>
      </header>

      <main className={styles.main}>
        <section className={styles.stage} aria-label="Preview">
          <svg className={styles.fibre} viewBox="0 0 600 120" role="img" aria-label="A light pulse travelling along a fibre from Tx to Rx">
            <text x="20" y="66" className={styles.endLabel}>Tx</text>
            <path id="demo-fibre" d="M60 60 C200 60 220 30 300 30 S420 90 540 60" className={styles.path} />
            <circle r="6" className={styles.pulse}>
              <animateMotion dur="2.4s" repeatCount="indefinite" rotate="auto">
                <mpath href="#demo-fibre" />
              </animateMotion>
            </circle>
            <text x="552" y="66" className={styles.endLabel}>Rx</text>
          </svg>
          <p className={styles.note}>Setup complete. The link canvas arrives in step 3.</p>
        </section>
      </main>
    </div>
  );
}
