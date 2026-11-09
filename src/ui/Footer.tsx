import styles from './Footer.module.css';

/** Plain site footer: who made it, what it is based on, and a word of caution. */
export function Footer() {
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
      </div>
      <div className={styles.bottom}>
        <p>© {new Date().getFullYear()} Polarity Trace. All rights reserved.</p>
        <p>Updated {__BUILD_DATE__}</p>
      </div>
    </footer>
  );
}
