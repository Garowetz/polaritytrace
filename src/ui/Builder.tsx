import type { ReactNode } from 'react';
import { cassetteEnd, opticEnd, type Preset } from '../data/presets';
import { GENERIC_PORT } from '../data/optics';
import type { CableConfig, CassetteEnd, Catalog, EndConfig, Fibre, LinkConfig, Polish, Side } from '../engine';
import styles from './Builder.module.css';

// Three independent pickers: End A, the MPO cable, End B. Every change is a
// new LinkConfig; the engine decides what works.

interface Props {
  catalog: Catalog;
  config: LinkConfig;
  onChange: (c: LinkConfig) => void;
  presets: readonly Preset[];
  activePreset: string | null;
}

const sameConfig = (a: LinkConfig, b: LinkConfig) => JSON.stringify(a) === JSON.stringify(b);
export const presetFor = (presets: readonly Preset[], c: LinkConfig) => presets.find((p) => sameConfig(p.config, c)) ?? null;

export function Builder({ catalog, config, onChange, presets, activePreset }: Props) {
  const setEnd = (side: Side, end: EndConfig) => onChange({ ...config, [side]: end });
  const fibreOf = (end: EndConfig): Fibre | null => {
    const id = end.kind === 'mpoOptic' ? end.optic : end.equipment;
    return catalog.optics.find((o) => o.id === id)?.fibre ?? null;
  };
  // Picking an optic that needs a fibre type moves the cable to it.
  const setEndFollowFibre = (side: Side, end: EndConfig) => {
    const f = fibreOf(end);
    const next = { ...config, [side]: end };
    if (f && f !== config.cable.fibre) next.cable = { ...config.cable, fibre: f, polish: undefined };
    onChange(next);
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
        <EndPicker title="End A" catalog={catalog} end={config.left} onChange={(e) => setEndFollowFibre('left', e)} onTweak={(e) => setEnd('left', e)} />
        <CablePicker catalog={catalog} cable={config.cable} onChange={(cable) => onChange({ ...config, cable })} />
        <EndPicker title="End B" catalog={catalog} end={config.right} onChange={(e) => setEndFollowFibre('right', e)} onTweak={(e) => setEnd('right', e)} />
      </div>
    </section>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className={styles.card}>
      <legend className={styles.cardTitle}>{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

interface EndProps {
  title: string;
  catalog: Catalog;
  end: EndConfig;
  /** A change of part (may move the cable's fibre type). */
  onChange: (e: EndConfig) => void;
  /** A change that keeps the part (cord, mount). */
  onTweak: (e: EndConfig) => void;
}

function EndPicker({ title, catalog, end, onChange, onTweak }: EndProps) {
  const cassettes = catalog.cassettes.filter((c) => !c.fixtureOnly);
  const mpoOptics = catalog.optics.filter((o) => o.inV1 && o.mpo && !o.generic);
  const duplexOptics = catalog.optics.filter((o) => o.inV1 && !o.mpo);
  const value = end.kind === 'cassette' ? `cas:${end.cassette}` : `opt:${end.optic}`;

  const cas = end.kind === 'cassette' ? catalog.cassettes.find((c) => c.id === end.cassette) : undefined;
  const equipmentConnector = (id: string) => catalog.optics.find((o) => o.id === id)?.connector ?? 'LC';
  const cordsFor = (front: string, equipment: string) =>
    catalog.cords.filter((c) => c.ends.cassette === front && c.ends.equipment === equipmentConnector(equipment));
  // Keep the same kind of cord (standard or A-to-A) when the connector changes.
  const fitCord = (current: string | undefined, front: string, equipment: string) => {
    const fits = cordsFor(front, equipment);
    if (fits.some((c) => c.id === current)) return current!;
    const was = catalog.cords.find((c) => c.id === current);
    return (fits.find((c) => c.standard === (was?.standard ?? true)) ?? fits[0])?.id ?? 'lc-ab';
  };

  const pickPart = (v: string) => {
    const [kind, id] = [v.slice(0, 3), v.slice(4)];
    if (kind === 'opt') return onChange(opticEnd(id));
    const def = catalog.cassettes.find((c) => c.id === id)!;
    const prev: Partial<CassetteEnd> = end.kind === 'cassette' ? end : {};
    const equipment = prev.equipment ?? GENERIC_PORT;
    onChange(cassetteEnd(id, fitCord(prev.cord, def.frontConnector, equipment), { equipment, ...(prev.mount ? { mount: prev.mount } : {}) }));
  };

  return (
    <Card title={title}>
      <Field label="Part">
        <select value={value} onChange={(e) => pickPart(e.target.value)}>
          <optgroup label="Cassettes">
            {cassettes.map((c) => (
              <option key={c.id} value={`cas:${c.id}`}>
                {c.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="MPO optics (plugged straight in)">
            {mpoOptics.map((o) => (
              <option key={o.id} value={`opt:${o.id}`}>
                {o.label} · {o.connector}
              </option>
            ))}
          </optgroup>
        </select>
      </Field>
      {end.kind === 'cassette' && cas && (
        <>
          <Field label="Patch cords">
            <select value={end.cord} onChange={(e) => onTweak({ ...end, cord: e.target.value })}>
              {cordsFor(cas.frontConnector, end.equipment).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Plugged into">
            <select
              value={end.equipment}
              onChange={(e) => {
                const equipment = e.target.value;
                const { patchedPorts: _drop, ...rest } = end;
                onChange({ ...rest, equipment, cord: fitCord(end.cord, cas.frontConnector, equipment) });
              }}
            >
              {duplexOptics.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.generic ? 'Equipment port (Tx | Rx)' : `${o.label} optics`}
                </option>
              ))}
            </select>
          </Field>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={end.mount === 'inverted'}
              onChange={(e) => onTweak({ ...end, mount: e.target.checked ? 'inverted' : undefined })}
            />
            Mounted upside down
          </label>
        </>
      )}
    </Card>
  );
}

function CablePicker({ catalog, cable, onChange }: { catalog: Catalog; cable: CableConfig; onChange: (c: CableConfig) => void }) {
  const groups = [...new Set(catalog.trunks.map((t) => t.positions))];
  const fibre = cable.fibre ?? 'SMF';
  return (
    <Card title="MPO cable">
      <Field label="Trunk">
        <select value={cable.trunk} onChange={(e) => onChange({ ...cable, trunk: e.target.value })}>
          {groups.map((n) => (
            <optgroup key={n} label={`MPO-${n}`}>
              {catalog.trunks
                .filter((t) => t.positions === n)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label} · MPO-{t.positions} · {t.litPositions.length}F
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </Field>
      <div className={styles.row}>
        <Field label="Fibre">
          <select value={fibre} onChange={(e) => onChange({ ...cable, fibre: e.target.value as Fibre, polish: undefined })}>
            <option value="SMF">Singlemode</option>
            <option value="MMF">Multimode</option>
          </select>
        </Field>
        <Field label="Polish">
          <select value={cable.polish ?? ''} onChange={(e) => onChange({ ...cable, polish: (e.target.value || undefined) as Polish | undefined })}>
            <option value="">Usual ({fibre === 'SMF' ? 'APC' : 'UPC'})</option>
            <option value="APC">APC</option>
            <option value="UPC">UPC</option>
          </select>
        </Field>
      </div>
    </Card>
  );
}
