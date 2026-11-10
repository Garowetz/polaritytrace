import { useEffect, useState } from 'react';
import { catalog } from '../data/catalog';
import type { Status } from '../engine/types';
import { Logo } from '../ui/Logo';
import { allPoints, reviewSections } from './parts';
import styles from './PartsPage.module.css';

const STATUS: Record<Status, { word: string; tone: string }> = {
  VERIFIED: { word: 'Verified', tone: styles.good },
  PARTIAL: { word: 'Partial', tone: styles.caution },
  UNVERIFIED: { word: 'Unverified', tone: styles.bad },
};

/** Every part the site knows about, numbered for review. Not linked from the main page except the footer. */
export function PartsPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  const sections = reviewSections(catalog);
  const points = allPoints(sections);
  const count = sections.reduce((n, s) => n + s.groups.reduce((m, g) => m + g.parts.length, 0), 0);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a className={styles.home} href={import.meta.env.BASE_URL}>
          <Logo className={styles.logo} />
          <span>Polarity Trace</span>
        </a>
        <button type="button" className={styles.toggle} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? 'Lab mode' : 'Light mode'}
        </button>
      </header>

      <h1 className={styles.title}>Parts list for review</h1>
      <p className={styles.lead}>
        All {count} parts the site uses, built from the same data as the drawing. Each part has a reference (1A, 2C …) and each point to
        check has its own number (1A-1 …).
      </p>

      <nav className={styles.toc} aria-label="Sections">
        {sections.map((s) => (
          <a key={s.number} href={`#s${s.number}`}>
            {s.number}. {s.title}
          </a>
        ))}
        <a href="#points">Points to review ({points.length})</a>
      </nav>

      {sections.map((s) => (
        <section key={s.number} id={`s${s.number}`} className={styles.section}>
          <h2>
            {s.number}. {s.title}
          </h2>
          {s.groups.map((g) => (
            <div key={g.title}>
              <h3 className={styles.group}>{g.title}</h3>
              <div className={styles.cards}>
                {g.parts.map((p) => (
                  <article key={p.id} id={p.ref} className={styles.card}>
                    <div className={styles.cardHead}>
                      <span className={styles.ref}>{p.ref}</span>
                      <h4>{p.label}</h4>
                      <span className={`${styles.status} ${STATUS[p.status].tone}`}>{STATUS[p.status].word}</span>
                    </div>
                    <p className={styles.summary}>{p.summary}</p>
                    <dl className={styles.facts}>
                      {p.facts.map((f, i) => (
                        <div key={i}>
                          <dt>{f.name}</dt>
                          <dd>{f.value}</dd>
                        </div>
                      ))}
                      <div>
                        <dt>Source</dt>
                        <dd>{p.source}</dd>
                      </div>
                    </dl>
                    {p.points.length > 0 && (
                      <ol className={styles.points}>
                        {p.points.map((pt) => (
                          <li key={pt.ref}>
                            <span className={styles.pointRef}>{pt.ref}</span> {pt.text}
                          </li>
                        ))}
                      </ol>
                    )}
                  </article>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}

      <section id="points" className={styles.section}>
        <h2>Points to review</h2>
        <p className={styles.lead}>The same points as above, in one list.</p>
        <ol className={styles.allPoints}>
          {points.map((pt) => (
            <li key={pt.ref}>
              <a className={styles.pointRef} href={`#${pt.partRef}`}>
                {pt.ref}
              </a>
              <span className={styles.pointPart}>{pt.part}</span>
              <span>{pt.text}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
