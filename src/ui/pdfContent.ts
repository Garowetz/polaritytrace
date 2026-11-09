import type { Channel, ChannelOutcome, Fix, LinkResult } from '../engine';
import { OUTCOME, resultLine, SEVERITY_ORDER, SEVERITY_WORD, TONE, VERDICT_TEXT, verdictText, type PartsColumn, type Tone } from './describe';

// What goes on the one-page PDF, as plain data. savePdf.ts only places it.

export type PdfTone = Tone | 'none';

export interface PdfTable {
  head: string[];
  rows: { cells: string[]; tone: PdfTone }[];
}

export interface PdfContent {
  title: string;
  date: string;
  url: string;
  columns: PartsColumn[];
  check: { heading: string; verdict: { text: string; tone: PdfTone }; detail: string; table: PdfTable };
  /** Where each module port lands, when the check above is not already that map. */
  portMap: { names: { left: string; right: string }; table: PdfTable } | null;
  notes: { label: string; text: string }[];
}

const ROW_TONE: Record<ChannelOutcome, PdfTone> = { 'tx-to-rx': 'good', 'tx-to-tx': 'bad', split: 'caution', dark: 'none', mapped: 'none' };

interface Input {
  title: string;
  date: string;
  url: string;
  result: LinkResult;
  fixes: Fix[];
  columns: PartsColumn[];
  portMap: Channel[];
  endNames: { left: string; right: string };
  mapNames: { left: string; right: string };
}

export function pdfContent({ title, date, url, result, fixes, columns, portMap, endNames, mapNames }: Input): PdfContent {
  const v = verdictText(result);
  const line = resultLine(result);
  const mapRows = (chs: Channel[]) => chs.map((c) => ({ cells: [c.ends?.left ?? c.label, c.ends?.right ?? ''], tone: 'none' as const }));
  const table: PdfTable = v.map
    ? { head: [endNames.left, endNames.right], rows: mapRows(result.channels) }
    : {
        head: ['Channel', 'Result', 'Arrives at'],
        rows: result.channels.map((c) => ({
          cells: [c.label, OUTCOME[c.outcome].text, c.farPort !== undefined ? `Port ${c.farPort}` : ''],
          tone: ROW_TONE[c.outcome],
        })),
      };
  const issues = [...result.issues]
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    .slice(0, 4)
    .map((i) => ({ label: SEVERITY_WORD[i.severity], text: i.message }));
  const tries = fixes.slice(0, 3).map((f) => ({ label: 'Try this', text: `${f.message} Then it ${VERDICT_TEXT[f.verdict].text.toLowerCase()}.` }));
  const review = result.underReview.length
    ? [{ label: 'Under review', text: `${result.underReview.map((u) => u.label).join(', ')}. These parts rely on partial or derived data.` }]
    : [];
  return {
    title,
    date,
    url,
    columns,
    check: {
      heading: result.portMap ? 'Port map' : 'Channel check',
      verdict: { text: line.verdict.text, tone: v.map ? 'none' : (TONE[result.verdict] ?? 'none') },
      detail: line.detail,
      table,
    },
    portMap: !result.portMap && portMap.length ? { names: mapNames, table: { head: [mapNames.left, mapNames.right], rows: mapRows(portMap) } } : null,
    notes: [...issues, ...tries, ...review],
  };
}

// The PDF's built-in Helvetica covers Windows-1252 only; swap out the rest.
const SWAPS: [RegExp, string][] = [
  [/→/g, '->'],
  [/←/g, '<-'],
  [/−/g, '-'],
  [/[‹]/g, '<'],
  [/[›]/g, '>'],
  [/[✓✕⛔○]/g, ''],
];

export function pdfSafe(text: string): string {
  return SWAPS.reduce((s, [re, to]) => s.replace(re, to), text).replace(/[^\x20-\x7e -ÿ–—‘’“”•…€]/g, '?');
}
