import { useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './Picker.module.css';

export interface Tile {
  id: string;
  label: string;
  blurb: string;
  learnMore?: string;
  picture: ReactNode;
  underReview?: boolean;
  /** Short tag such as "MPO-16" or "Singlemode". */
  tag?: string;
}

export interface TileGroup {
  title: string;
  tiles: Tile[];
}

interface Props {
  title: string;
  groups: TileGroup[];
  selected: string;
  onPick: (id: string) => void;
  onClose: () => void;
}

/** A modal card of picture tiles. Esc, the close button or the backdrop closes it. */
export function Picker({ title, groups, selected, onPick, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (!d.open) d.showModal();
    // Start at the current choice.
    d.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
    d.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest' });
  }, []);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) ref.current?.close();
      }}
    >
      <div className={styles.sheet}>
        <header className={styles.head}>
          <h2 className={styles.title}>{title}</h2>
          <button type="button" className={styles.close} onClick={() => ref.current?.close()} aria-label="Close">
            ✕
          </button>
        </header>
        <div className={styles.body}>
          {groups
            .filter((g) => g.tiles.length)
            .map((g) => (
              <section key={g.title} className={styles.group}>
                {groups.length > 1 && <h3 className={styles.groupTitle}>{g.title}</h3>}
                <div className={styles.grid}>
                  {g.tiles.map((t) => {
                    const choose = () => {
                      onPick(t.id);
                      ref.current?.close();
                    };
                    return (
                      <div
                        key={t.id}
                        className={`${styles.tile} ${t.id === selected ? styles.selected : ''}`}
                        // The whole tile picks; "Learn more" and its text do not.
                        onClick={(e) => {
                          if (!(e.target as HTMLElement).closest('button, p')) choose();
                        }}
                      >
                        <button type="button" className={styles.choose} aria-pressed={t.id === selected} onClick={choose}>
                          <span className={styles.picture}>{t.picture}</span>
                          <span className={styles.tileHead}>
                            <span className={styles.tileLabel}>{t.label}</span>
                            {t.tag && <span className={styles.tag}>{t.tag}</span>}
                          </span>
                          <span className={styles.blurb}>{t.blurb}</span>
                          {t.underReview && <span className={styles.review}>Under review</span>}
                        </button>
                        {t.learnMore && (
                          <>
                            <button type="button" className={styles.more} aria-expanded={open === t.id} onClick={() => setOpen(open === t.id ? null : t.id)}>
                              {open === t.id ? 'Less' : 'Learn more'}
                            </button>
                            {open === t.id && <p className={styles.moreText}>{t.learnMore}</p>}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
        </div>
      </div>
    </dialog>
  );
}
