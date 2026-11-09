import type { PartsColumn } from './describe';
import styles from './Parts.module.css';

/** The parts list as a card on the page: End A, the MPO cable and End B. */
export function PartsCard({ columns }: { columns: PartsColumn[] }) {
  return (
    <section className={styles.parts} aria-labelledby="parts-title">
      <h2 id="parts-title" className={styles.title}>
        Parts list
      </h2>
      <div className={styles.columns}>
        {columns.map((col) => (
          <div key={col.heading} className={styles.column}>
            <h3 className={styles.heading}>{col.heading}</h3>
            <dl className={styles.rows}>
              {col.rows.map((r) => (
                <div key={r.label} className={styles.row}>
                  <dt>{r.label}</dt>
                  <dd>{r.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
