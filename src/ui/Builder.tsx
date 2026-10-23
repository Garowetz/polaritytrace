import type { ReactNode } from 'react';
import type { Preset } from '../data/presets';
import type { CableConfig, Catalog, Fibre, LinkConfig, Polish, Side } from '../engine';
import styles from './Builder.module.css';
import { applyChoice, cordsFor, pickableCassettes, pickableEquipment, pickableMpoOptics, selectedId, sideTitle, type PickerTarget } from './choices';
import { CassetteMini, CordMini, OpticMini, TrunkMini } from './MiniDiagram';
import { Picker, type TileGroup } from './Picker';

// Three independent parts: End A, the MPO cable, End B. Each part opens a
// card of picture tiles. Every change is a new LinkConfig; the engine decides
// what works.

interface Props {
  catalog: Catalog;
  config: LinkConfig;
  onChange: (c: LinkConfig) => void;
  presets: readonly Preset[];
  activePreset: string | null;
  picker: PickerTarget | null;
  onPicker: (t: PickerTarget | null) => void;
}

const sameConfig = (a: LinkConfig, b: LinkConfig) => JSON.stringify(a) === JSON.stringify(b);
export const presetFor = (presets: readonly Preset[], c: LinkConfig) => presets.find((p) => sameConfig(p.config, c)) ?? null;

const fibreName = (f: Fibre | null) => (f === 'SMF' ? 'Singlemode' : f === 'MMF' ? 'Multimode' : '');
const footprintLabel = (positions: number, lit: number) => `MPO-${positions} · ${lit}F`;

export function Builder({ catalog, config, onChange, presets, activePreset, picker, onPicker }: Props) {
  const nameOf = (t: PickerTarget): { label: string; sub: string; review: boolean } => {
    if (t.what === 'trunk') {
      const tr = catalog.trunks.find((x) => x.id === config.cable.trunk)!;
      return { label: tr.label, sub: footprintLabel(tr.positions, tr.litPositions.length), review: !tr.verified };
    }
    const end = config[t.side];
    if (t.what === 'part') {
      if (end.kind === 'mpoOptic') {
        const o = catalog.optics.find((x) => x.id === end.optic)!;
        return { label: o.label, sub: `MPO optic · ${o.connector}`, review: !o.verified };
      }
      const c = catalog.cassettes.find((x) => x.id === end.cassette)!;
      return { label: c.label, sub: `${footprintLabel(c.positions, c.litPositions.length)} → ${c.frontMap.length} × ${c.frontConnector}`, review: !c.verified };
    }
    if (end.kind !== 'cassette') return { label: '', sub: '', review: false };
    if (t.what === 'cord') {
      const c = catalog.cords.find((x) => x.id === end.cord)!;
      return { label: c.label, sub: `${c.ends.cassette} to ${c.ends.equipment}`, review: !c.verified };
    }
    const o = catalog.optics.find((x) => x.id === end.equipment)!;
    return { label: o.generic ? 'Equipment port' : `${o.label} optics`, sub: o.generic ? 'Tx | Rx' : `${o.formFactor} · ${fibreName(o.fibre)}`, review: !o.verified };
  };

  const endCard = (side: Side) => {
    const end = config[side];
    return (
      <Card title={sideTitle(side)}>
        <PartButton field="Part" {...nameOf({ what: 'part', side })} onClick={() => onPicker({ what: 'part', side })} />
        {end.kind === 'cassette' && (
          <>
            <PartButton field="Patch cords" {...nameOf({ what: 'cord', side })} onClick={() => onPicker({ what: 'cord', side })} />
            <PartButton field="Plugged into" {...nameOf({ what: 'equipment', side })} onClick={() => onPicker({ what: 'equipment', side })} />
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={end.mount === 'inverted'}
                onChange={(e) => onChange({ ...config, [side]: { ...end, mount: e.target.checked ? 'inverted' : undefined } })}
              />
              Mounted upside down
            </label>
          </>
        )}
      </Card>
    );
  };

  return (
    <section className={styles.builder} aria-label="Build the link">
      <div className={styles.examples}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Examples</span>
          <select
            value={activePreset ?? ''}
            onChange={(e) => {
              const p = presets.find((x) => x.id === e.target.value);
              if (p) onChange(p.config);
            }}
          >
            {!activePreset && <option value="">Your own link</option>}
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.mistake ? '⚠ ' : ''}
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.parts}>
        {endCard('left')}
        <CableCard config={config} onChange={onChange} trunk={nameOf({ what: 'trunk' })} onPick={() => onPicker({ what: 'trunk' })} />
        {endCard('right')}
      </div>

      {picker && (
        <Picker
          key={JSON.stringify(picker)}
          {...pickerContent(catalog, config, picker)}
          selected={selectedId(config, picker)}
          onPick={(id) => onChange(applyChoice(catalog, config, picker, id))}
          onClose={() => onPicker(null)}
        />
      )}
    </section>
  );
}

function pickerContent(catalog: Catalog, config: LinkConfig, t: PickerTarget): { title: string; groups: TileGroup[] } {
  if (t.what === 'trunk') {
    const prints = [...new Set(catalog.trunks.map((x) => x.footprint))];
    return {
      title: 'Choose the MPO cable',
      groups: prints.map((fp) => ({
        title: fp === 'MPO-16' ? 'MPO-16 (does not mate with MPO-12)' : fp,
        tiles: catalog.trunks
          .filter((x) => x.footprint === fp)
          .map((x) => ({
            id: x.id,
            label: x.label,
            blurb: x.blurb,
            learnMore: [x.hint, x.learnMore].filter(Boolean).join(' ') || undefined,
            tag: footprintLabel(x.positions, x.litPositions.length),
            underReview: !x.verified,
            picture: <TrunkMini trunk={x} />,
          })),
      })),
    };
  }
  const where = sideTitle(t.side);
  if (t.what === 'part') {
    return {
      title: `Choose ${where}`,
      groups: [
        {
          title: 'Cassettes and modules',
          tiles: pickableCassettes(catalog).map((x) => ({
            id: x.id,
            label: x.label,
            blurb: x.blurb,
            learnMore: x.learnMore,
            tag: footprintLabel(x.positions, x.litPositions.length),
            underReview: !x.verified,
            picture: <CassetteMini cassette={x} />,
          })),
        },
        {
          title: 'MPO optics, plugged straight into the cable',
          tiles: pickableMpoOptics(catalog).map((x) => ({
            id: x.id,
            label: x.label,
            blurb: x.blurb,
            learnMore: x.learnMore,
            tag: `${x.connector} · ${fibreName(x.fibre)}`,
            underReview: !x.verified,
            picture: <OpticMini optic={x} />,
          })),
        },
      ],
    };
  }
  const end = config[t.side];
  if (end.kind !== 'cassette') return { title: where, groups: [] };
  if (t.what === 'cord') {
    return {
      title: `${where} patch cords`,
      groups: [
        {
          title: 'Patch cords',
          tiles: cordsFor(catalog, end.cassette, end.equipment).map((x) => ({
            id: x.id,
            label: x.label,
            blurb: x.blurb,
            learnMore: x.learnMore,
            tag: `${x.ends.cassette} to ${x.ends.equipment}`,
            underReview: !x.verified,
            picture: <CordMini cord={x} />,
          })),
        },
      ],
    };
  }
  return {
    title: `What ${where} plugs into`,
    groups: [
      {
        title: 'Equipment',
        tiles: pickableEquipment(catalog).map((x) => ({
          id: x.id,
          label: x.generic ? 'Equipment port' : `${x.label} optics`,
          blurb: x.blurb,
          learnMore: x.learnMore,
          tag: x.generic ? 'Tx | Rx' : fibreName(x.fibre),
          underReview: !x.verified,
          picture: <OpticMini optic={x} />,
        })),
      },
    ],
  };
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className={styles.card}>
      <legend className={styles.cardTitle}>{title}</legend>
      {children}
    </fieldset>
  );
}

function PartButton({ field, label, sub, review, onClick }: { field: string; label: string; sub: string; review: boolean; onClick: () => void }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{field}</span>
      <button type="button" className={styles.part} onClick={onClick} aria-haspopup="dialog" aria-label={`${field}: ${label}. Change`}>
        <span className={styles.partText}>
          <span className={styles.partLabel}>
            {label}
            {review ? ' *' : ''}
          </span>
          {sub && <span className={styles.partSub}>{sub}</span>}
        </span>
        <span className={styles.chevron} aria-hidden="true">
          ›
        </span>
      </button>
    </div>
  );
}

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className={styles.field} role="radiogroup" aria-label={label}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={styles.segmented}>
        {options.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={o.value === value} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CableCard({
  config,
  onChange,
  trunk,
  onPick,
}: {
  config: LinkConfig;
  onChange: (c: LinkConfig) => void;
  trunk: { label: string; sub: string; review: boolean };
  onPick: () => void;
}) {
  const cable = config.cable;
  const fibre = cable.fibre ?? 'SMF';
  const set = (c: CableConfig) => onChange({ ...config, cable: c });
  type PolishChoice = Polish | 'usual';
  return (
    <Card title="MPO cable">
      <PartButton field="Trunk" {...trunk} onClick={onPick} />
      <Segmented<Fibre>
        label="Fibre"
        value={fibre}
        options={[
          { value: 'SMF', label: 'Singlemode' },
          { value: 'MMF', label: 'Multimode' },
        ]}
        onChange={(f) => set({ ...cable, fibre: f, polish: undefined })}
      />
      <Segmented<PolishChoice>
        label="Polish"
        value={cable.polish ?? 'usual'}
        options={[
          { value: 'usual', label: `Usual (${fibre === 'SMF' ? 'APC' : 'UPC'})` },
          { value: 'APC', label: 'APC' },
          { value: 'UPC', label: 'UPC' },
        ]}
        onChange={(p) => set({ ...cable, polish: p === 'usual' ? undefined : p })}
      />
    </Card>
  );
}

/** Which picker a component drawn on the canvas opens. */
export function pickerForBox(kind: string, side: Side | undefined): PickerTarget | null {
  if (kind === 'trunk') return { what: 'trunk' };
  if (!side) return null;
  if (kind === 'cord') return { what: 'cord', side };
  if (kind === 'equipment') return { what: 'equipment', side };
  return { what: 'part', side };
}

