import type { ResolvedEnd, ResolvedLink } from './resolve';
import type { Footprint, Gender, Issue, Polish, Side } from './types';

// Mechanical and media checks (reference §3.1, §7, §1.1, §3-3).
// Gender is a note only (owner decision); footprint and polish mismatches BLOCK.

const sideName = (s: Side) => (s === 'left' ? 'End A' : 'End B');

/** Footprint of whatever plugs into the trunk at this end. */
function endFootprint(end: ResolvedEnd): Footprint | 'twin' | 'duplex' {
  if (end.kind === 'cassette') return end.def.footprint;
  const c = end.def.connector;
  if (c === 'MPO-12' || c === 'MPO-16') return c;
  if (c === '2xMPO-12') return 'twin';
  return 'duplex';
}

function endGender(end: ResolvedEnd): Gender {
  // Transceiver MPO ports are pinned (reference §7).
  return end.kind === 'cassette' ? end.rearGender : 'M';
}

function endPolish(end: ResolvedEnd): Polish | null {
  return end.kind === 'cassette' ? end.polish : end.def.polish;
}

const familyOf = (f: Footprint) => (f === 'MPO-16' ? 'MPO-16' : 'MPO-12/24');

/** Issues that stop tracing: the parts cannot be plugged together at all. */
export function blockingMechanical(link: ResolvedLink): Issue[] {
  const issues: Issue[] = [];
  for (const side of ['left', 'right'] as const) {
    const end = link[side];
    const fp = endFootprint(end);
    if (fp === 'duplex') {
      issues.push({ severity: 'block', code: 'unsupported-connector', side, message: `The ${sideName(side)} optic is a duplex optic. It needs a cassette and patch cord, not a direct MPO connection.` });
    } else if (fp === 'twin') {
      issues.push({ severity: 'block', code: 'unsupported-connector', side, message: `The ${sideName(side)} optic has two MPO ports. Twin-MPO optics are not modelled in this version.` });
    } else if (fp !== link.trunk.footprint) {
      const msg =
        familyOf(fp) !== familyOf(link.trunk.footprint)
          ? `MPO-16 has a different key offset and does not mate with MPO-12. ${sideName(side)} is ${fp}; the trunk is ${link.trunk.footprint}.`
          : `${sideName(side)} is ${fp} but the trunk is ${link.trunk.footprint}. They do not mate.`;
      issues.push({ severity: 'block', code: 'footprint', side, message: msg });
    }
  }
  return issues;
}

export function mechanicalIssues(link: ResolvedLink): Issue[] {
  const issues: Issue[] = [];
  for (const side of ['left', 'right'] as const) {
    const end = link[side];
    const idx = side === 'left' ? 0 : 1;
    const trunkGender = link.trunkGender[idx];
    const g = endGender(end);
    if (g === trunkGender) {
      issues.push({
        severity: 'note',
        code: 'gender',
        side,
        message:
          g === 'M'
            ? `Male-to-male at ${sideName(side)}: two pinned MPOs cannot mate. Order the trunk with an unpinned (female) end there.`
            : `Female-to-female at ${sideName(side)}: no guide pins, so the fibres won't align. One side must be pinned (male).`,
      });
    }

    const polish = endPolish(end);
    if (polish && polish !== link.polish) {
      issues.push({ severity: 'block', code: 'polish-mismatch', side, message: `APC cannot mate with UPC: ${sideName(side)} is ${polish} but the trunk is ${link.polish}.` });
    }
    if (end.kind === 'cassette' && end.def.rearAdapter === 'B' && (end.polish === 'APC' || link.polish === 'APC')) {
      issues.push({
        severity: 'block',
        code: 'apc-key-up-up',
        side,
        message: `APC angles cannot mate key-up/key-up. The ${sideName(side)} cassette has a key-up/key-up rear adapter, so this needs UPC (multimode flat polish).`,
      });
    }

    if (end.kind === 'cassette') {
      const cassetteSide = new Set<string>();
      const equipmentSide = new Set<string>();
      for (const port of end.patched) {
        const cord = end.cordFor(port);
        if (cord.ends.cassette !== end.def.frontConnector) cassetteSide.add(cord.label);
        if (!end.equipment.generic && cord.ends.equipment !== end.equipment.connector) equipmentSide.add(cord.label);
      }
      for (const label of cassetteSide) {
        issues.push({ severity: 'block', code: 'duplex-connector', side, message: `The ${label} cord does not fit the ${sideName(side)} cassette: its front ports are ${end.def.frontConnector}.` });
      }
      for (const label of equipmentSide) {
        issues.push({ severity: 'block', code: 'duplex-connector', side, message: `The ${label} cord does not fit the ${sideName(side)} optic: it takes ${end.equipment.connector}.` });
      }
    }

    const mpoFibre = end.kind === 'cassette' ? end.fibre : end.def.fibre;
    if (mpoFibre && mpoFibre !== link.fibre) {
      issues.push({ severity: 'fail', code: 'fibre-type', side, message: fibreMessage(mpoFibre, link.fibre, side) });
    }
    if (end.kind === 'cassette' && end.equipment.fibre && end.equipment.fibre !== end.fibre) {
      issues.push({ severity: 'fail', code: 'fibre-type', side, message: fibreMessage(end.equipment.fibre, end.fibre, side) });
    }
  }
  return issues;
}

function fibreMessage(part: string, cable: string, side: Side): string {
  const name = (f: string) => (f === 'MMF' ? 'multimode' : 'singlemode');
  return `Fibre type mismatch at ${sideName(side)}: ${name(part)} part on ${name(cable)} fibre.`;
}
