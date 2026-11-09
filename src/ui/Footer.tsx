import styles from './Footer.module.css';

export type Look = 'a' | 'b';

/** Plain site footer: who made it, what it is based on, and a word of caution. */
export function Footer({ look, onLook }: { look: Look; onLook: (l: Look) => void }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.cols}>
        <div>
          <p className={styles.name}>Polarity Trace</p>
          <p>Follow the light from Tx to Rx through MPO trunks, cassettes and patch cords.</p>
        </div>
        <div>
          <p>Based on TIA-568 polarity methods and TIA-598 fibre colours.</p>
          <p>A reference tool. Check against the manufacturer's drawings before installing.</p>
        </div>
        <div>
          <p>Nothing is stored. Your link holds the whole design, so it can be shared.</p>
          <p>Updated {__BUILD_DATE__}</p>
        </div>
      </div>
      <div className={styles.bottom}>
        <p>© {new Date().getFullYear()} Polarity Trace. All rights reserved.</p>
        {/* Trial only: switch between the two page layouts being compared. */}
        <p className={styles.look}>
          Layout trial:{' '}
          {(['a', 'b'] as const).map((l) => (
            <button key={l} type="button" aria-pressed={look === l} onClick={() => onLook(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </p>
      </div>
    </footer>
  );
}
