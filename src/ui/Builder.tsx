import type { ReactNode } from 'react';
import type { Preset } from '../data/presets';
import { defaultPolish, NO_EQUIPMENT, type CableConfig, type Catalog, type Fibre, type LinkConfig, type Polish, type Side } from '../engine';
import styles from './Builder.module.css';
import { applyChoice, cordsFor, pickableCassettes, pickableEquipment, pickableMpoOptics, selectedId, sideTitle, type PickerTarget } from './choices';
import { frontCount } from './describe';
import { CassetteMini, CordMini, NoneMini, OpticMini, TrunkMini } from './MiniDiagram';
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
      const flipped = end.mount === 'inverted' ? ' · Upside down' : '';
      return { label: c.label, sub: `${footprintLabel(c.positions, c.litPositions.length)} → ${frontCount(c)} × ${c.frontConnector}${flipped}`, review: !c.verified };
    }
    if (end.kind !== 'cassette') return { label: '', sub: '', review: false };
    if (t.what === 'cord') {
      const c = catalog.cords.find((x) => x.id === end.cord)!;
      return { label: c.label, sub: `${c.ends.cassette} to ${c.ends.equipment}`, review: !c.verified };
    }
    if (end.equipment === NO_EQUIPMENT) return { label: 'None', sub: 'Module only', review: false };
    const o = catalog.optics.find((x) => x.id === end.equipment)!;
    return { label: o.generic ? 'Equipment port' : `${o.label} optics`, sub: o.generic ? 'Tx | Rx' : `${o.formFactor} · ${fibreName(o.fibre)}`, review: !o.verified };
  };

  const endCard = (side: Side) => {
    const end = config[side];
    return (
      <Card title={sideTitle(side)}>
        <PartButton field={end.kind === 'cassette' ? 'Module' : 'Optic'} {...nameOf({ what: 'part', side })} onClick={() => onPicker({ what: 'part', side })} />
        {end.kind === 'cassette' && (
          <>
            <Segmented<Polish>
              label="Front polish"
              value={end.frontPolish ?? 'UPC'}
              options={(['UPC', 'APC'] as const).map((p) => ({ value: p, label: p === 'UPC' && (end.fibre ?? config.cable.fibre) === 'MMF' ? 'PC/UPC' : p }))}
              onChange={(p) => onChange({ ...config, [side]: { ...end, frontPolish: p === 'UPC' ? undefined : p } })}
            />
            {end.equipment !== NO_EQUIPMENT && (
              <PartButton field="Patch cords" {...nameOf({ what: 'cord', side })} onClick={() => onPicker({ what: 'cord', side })} />
            )}
            <PartButton field="Plugged into" {...nameOf({ what: 'equipment', side })} onClick={() => onPicker({ what: 'equipment', side })} />
          </>
        )}
      </Card>
    );
  };

  // Upside down belongs with the module itself, so it sits in the module picker.
  const mountSetting = (side: Side) => {
    const end = config[side];
    if (end.kind !== 'cassette') return undefined;
    return (
      <div className={styles.mountRow}>
        <Segmented<'upright' | 'inverted'>
          label="How it is mounted"
          value={end.mount === 'inverted' ? 'inverted' : 'upright'}
          options={[
            { value: 'upright', label: 'Right way up' },
            { value: 'inverted', label: 'Upside down' },
          ]}
          onChange={(m) => onChange({ ...config, [side]: { ...end, mount: m === 'inverted' ? 'inverted' : undefined } })}
          hint="Upside down flips the module over in the panel: its MPO key faces the other way and its port numbers run in reverse. Method B needs one end flipped."
        />
      </div>
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
          extra={picker.what === 'part' ? mountSetting(picker.side) : undefined}
          selected={selectedId(config, picker)}
          onPick={(id) => onChange(applyChoice(catalog, config, picker, id))}
          onClose={() => onPicker(null)}
        />
      )}
    </section>
  );
}

// The module picker, most used first.
const CASSETTE_GROUPS: { title: string; ids: string[] }[] = [
  { title: 'Most used', ids: ['cas-a-12', 'cas-b-12', 'cas-u1-12', 'cas-u1-8'] },
  { title: 'MPO-16 and MPO-24 modules', ids: ['cas-u1-16', 'cas-u1-16-cs', 'cas-u1-24', 'cas-u1-24-16f', 'cas-a-24'] },
  { title: 'Other and vendor-specific', ids: ['cas-u2-12', 'cas-b2-12', 'cas-bn-12', 'cas-af-12'] },
];
const rank = (ids: string[], id: string) => (ids.includes(id) ? ids.indexOf(id) : ids.length);

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
        ...CASSETTE_GROUPS.map((g, i) => ({
          title: g.title,
          tiles: pickableCassettes(catalog)
            // Anything not named in a group lands in the last one.
            .filter((x) => g.ids.includes(x.id) || (i === CASSETTE_GROUPS.length - 1 && !CASSETTE_GROUPS.some((h) => h.ids.includes(x.id))))
            .sort((x, y) => rank(g.ids, x.id) - rank(g.ids, y.id))
            .map((x) => ({
              id: x.id,
              label: x.label,
              blurb: x.blurb,
              learnMore: x.learnMore,
              badge: `${x.litPositions.length}F`,
              tag: `${footprintLabel(x.positions, x.litPositions.length)} rear → ${frontCount(x)} × ${x.frontConnector} front`,
              underReview: !x.verified,
              picture: <CassetteMini cassette={x} />,
            })),
        })),
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
      {
        title: 'Nothing',
        tiles: [
          {
            id: NO_EQUIPMENT,
            label: 'None',
            blurb: 'Just the module, with no patch cords or equipment. Shows where each port lands.',
            tag: 'Module only',
            underReview: false,
            picture: <NoneMini />,
          },
        ],
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

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  hint?: string;
}) {
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
      {hint && <span className={styles.hint}>{hint}</span>}
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
  const usual = defaultPolish(fibre);
  // The normal polish for the fibre comes first; picking it leaves the polish
  // unset so it keeps following the fibre.
  const polishName = (p: Polish) => (p === 'UPC' && fibre === 'MMF' ? 'PC/UPC' : p);
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
      <Segmented<Polish>
        label="Polish"
        value={cable.polish ?? usual}
        options={[usual, usual === 'APC' ? 'UPC' : 'APC'].map((p) => ({ value: p as Polish, label: polishName(p as Polish) }))}
        onChange={(p) => set({ ...cable, polish: p === usual ? undefined : p })}
        hint={`${fibre === 'SMF' ? 'Singlemode' : 'Multimode'} MPO is normally ${polishName(usual)}.`}
      />
    </Card>
  );
}

/** Which picker a component drawn on the canvas opens. */
export function pickerForBox(kind: string, side: Side | undefined): PickerTarget | null {
  if (kind === 'trunk' || kind === 'plug') return { what: 'trunk' };
  if (!side) return null;
  if (kind === 'cord') return { what: 'cord', side };
  if (kind === 'equipment') return { what: 'equipment', side };
  return { what: 'part', side };
}

