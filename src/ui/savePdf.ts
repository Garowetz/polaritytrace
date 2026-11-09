import type { jsPDF } from 'jspdf';
import { pdfSafe, type PdfContent, type PdfTable, type PdfTone } from './pdfContent';
import { styledClone } from './savePicture';

// One US Letter landscape page: header, the drawing as vector, then the parts
// list, the channel check and the port map side by side, with a QR code for
// the share link. The libraries load only when someone saves a PDF.

const W = 792;
const H = 612;
const M = 32;
const BOTTOM = H - 44;

// Brand colours, printed on white whatever the page theme.
const INK = '#1b304a';
const MUTED = '#5f6e80';
const RULE = '#d9dde3';
const BAND = '#f0ebe8';
const TONES: Record<PdfTone, string> = { good: '#2e9e4f', caution: '#f28c28', bad: '#dd5e57', none: MUTED };

export async function savePdf(svg: SVGSVGElement, content: PdfContent, filename: string): Promise<void> {
  const doc = await buildPdf(svg, content);
  doc.save(filename);
}

export async function buildPdf(svg: SVGSVGElement, c: PdfContent): Promise<jsPDF> {
  const [{ jsPDF }, { svg2pdf }, { default: qrcode }] = await Promise.all([import('jspdf'), import('svg2pdf.js'), import('qrcode-generator')]);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
  doc.setProperties({ title: `Polarity Trace · ${pdfSafe(c.title)}`, subject: 'MPO polarity check', creator: 'Polarity Trace' });

  // Header.
  doc.setFont('helvetica', 'bold').setFontSize(15).setTextColor(INK);
  doc.text('POLARITY TRACE', M, M + 12, { charSpace: 1.2 });
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(MUTED);
  doc.text(pdfSafe(c.title), M, M + 26);
  doc.setFontSize(9).text(c.date, W - M, M + 12, { align: 'right' });
  rule(doc, M + 34);

  // The drawing, scaled to the width or to its share of the height.
  const drawing = pdfDrawing(svg);
  const vb = svg.viewBox.baseVal;
  const s = Math.min((W - 2 * M) / vb.width, 220 / vb.height);
  const dw = vb.width * s;
  const dh = vb.height * s;
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-100000px;top:0';
  host.appendChild(drawing);
  document.body.appendChild(host);
  try {
    await svg2pdf(drawing, doc, { x: (W - dw) / 2, y: M + 42, width: dw, height: dh });
  } finally {
    host.remove();
  }

  // Three columns under the drawing.
  const top = M + 42 + dh + 14;
  rule(doc, top - 7);
  parts(doc, c, M, top, 218);
  check(doc, c, M + 236, top, 300);
  const qrTop = BOTTOM - 112;
  if (c.portMap) portMap(doc, c.portMap, M + 556, top, W - M - (M + 556), qrTop - 12);
  qr(doc, qrcode, c.url, W - M - 172, qrTop, 172);

  // Footer.
  rule(doc, H - 34);
  doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(MUTED);
  doc.text("A reference tool based on TIA-568 polarity methods and TIA-598 fibre colours. Check against the manufacturer's drawings before installing.", M, H - 22);
  doc.text(`© ${new Date().getFullYear()} Polarity Trace`, W - M, H - 22, { align: 'right' });
  return doc;
}

/** The styled drawing, ready for svg2pdf: light, plain colours and no hidden parts. */
function pdfDrawing(svg: SVGSVGElement): SVGSVGElement {
  const clone = styledClone(svg);
  clone.querySelectorAll('[data-export="show"]').forEach((el) => el.remove());
  const vb = svg.viewBox.baseVal;
  clone.setAttribute('width', `${vb.width}`);
  clone.setAttribute('height', `${vb.height}`);
  const probe = colourProbe();
  clone.querySelectorAll<SVGElement>('*').forEach((el) => {
    const st = el.style;
    for (const [paint, alpha] of [['fill', 'fill-opacity'], ['stroke', 'stroke-opacity']] as const) {
      const v = st.getPropertyValue(paint);
      if (!v || v === 'none' || v.startsWith('url(')) continue;
      const { rgb, a } = probe(v);
      st.setProperty(paint, rgb);
      st.setProperty(alpha, String((Number(st.getPropertyValue(alpha)) || 1) * a));
    }
    st.setProperty('font-family', 'helvetica');
    st.removeProperty('letter-spacing');
    if (el.tagName === 'text' || el.tagName === 'tspan') {
      el.childNodes.forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) n.textContent = pdfSafe(n.textContent ?? '');
      });
    }
  });
  // svg2pdf does not know paint-order, so a halo drawn under text becomes its own copy.
  clone.querySelectorAll<SVGTextElement>('text').forEach((t) => {
    if (!t.style.getPropertyValue('paint-order').startsWith('stroke')) return;
    const sw = parseFloat(t.style.getPropertyValue('stroke-width'));
    if (!sw || t.style.getPropertyValue('stroke') === 'none') return;
    const halo = t.cloneNode(true) as SVGTextElement;
    halo.style.setProperty('fill', 'none');
    t.parentNode?.insertBefore(halo, t);
    t.style.setProperty('stroke', 'none');
  });
  return clone;
}

/** Turns any CSS colour (color-mix included) into rgb plus alpha, by painting one pixel. */
function colourProbe(): (css: string) => { rgb: string; a: number } {
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
  ctx.canvas.width = ctx.canvas.height = 1;
  const seen = new Map<string, { rgb: string; a: number }>();
  return (css) => {
    const hit = seen.get(css);
    if (hit) return hit;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    const out = { rgb: `rgb(${r}, ${g}, ${b})`, a: a / 255 };
    seen.set(css, out);
    return out;
  };
}

function rule(doc: jsPDF, y: number) {
  doc.setDrawColor(RULE).setLineWidth(0.75).line(M, y, W - M, y);
}

function heading(doc: jsPDF, text: string, x: number, y: number, w: number): number {
  doc.setFillColor(BAND).rect(x, y, w, 15, 'F');
  doc.setFont('helvetica', 'bold').setFontSize(7.5).setTextColor(INK);
  doc.text(pdfSafe(text).toUpperCase(), x + 6, y + 10.2, { charSpace: 0.6 });
  return y + 15 + 10;
}

/** Wrapped text; returns the next line's baseline, or stops at the bottom. */
function para(doc: jsPDF, text: string, x: number, y: number, w: number, lead: number): number {
  for (const line of doc.splitTextToSize(pdfSafe(text), w) as string[]) {
    if (y > BOTTOM) return y;
    doc.text(line, x, y);
    y += lead;
  }
  return y;
}

function parts(doc: jsPDF, c: PdfContent, x: number, y: number, w: number) {
  const LABEL = 62;
  for (const col of c.columns) {
    y = heading(doc, col.heading, x, y, w);
    for (const row of col.rows) {
      doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(MUTED);
      doc.text(pdfSafe(row.label), x + 6, y);
      doc.setFontSize(8).setTextColor(INK);
      y = para(doc, row.value, x + 6 + LABEL, y, w - LABEL - 10, 10);
    }
    y += 4;
  }
}

function check(doc: jsPDF, c: PdfContent, x: number, y: number, w: number) {
  y = heading(doc, c.check.heading, x, y, w);
  // The verdict pill, then the method and count beside it.
  const word = pdfSafe(c.check.verdict.text).toUpperCase();
  doc.setFont('helvetica', 'bold').setFontSize(8);
  const pw = doc.getTextWidth(word) + word.length * 0.6 + 16;
  doc.setFillColor(TONES[c.check.verdict.tone]).roundedRect(x, y - 9, pw, 15, 7.5, 7.5, 'F');
  doc.setTextColor('#ffffff').text(word, x + 8, y + 1.5, { charSpace: 0.6 });
  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(INK);
  y = Math.max(para(doc, c.check.detail, x + pw + 8, y + 1.5, w - pw - 8, 10), y + 14) + 6;
  y = table(doc, c.check.table, x, y, w, [70, 130, 100]);
  y += 6;
  for (const n of c.notes) {
    if (y > BOTTOM) break;
    doc.setFont('helvetica', 'bold').setFontSize(7.5).setTextColor(n.label === 'Try this' ? INK : MUTED);
    doc.text(pdfSafe(n.label), x, y);
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(INK);
    y = para(doc, n.text, x + 58, y, w - 58, 10) + 3;
  }
}

/** Rows of a table; the first column bold, a coloured dot by any toned result. */
function table(doc: jsPDF, t: PdfTable, x: number, y: number, w: number, widths: number[]): number {
  doc.setFont('helvetica', 'bold').setFontSize(7).setTextColor(MUTED);
  let cx = x;
  t.head.forEach((h, i) => {
    doc.text(pdfSafe(h).toUpperCase(), cx, y, { charSpace: 0.4 });
    cx += widths[i];
  });
  doc.setDrawColor(RULE).setLineWidth(0.5).line(x, y + 3.5, x + w, y + 3.5);
  y += 13;
  for (const r of t.rows) {
    if (y > BOTTOM) break;
    cx = x;
    r.cells.forEach((cell, i) => {
      doc.setFont('helvetica', i === 0 ? 'bold' : 'normal').setFontSize(8).setTextColor(INK);
      let tx = cx;
      if (i === 1 && r.tone !== 'none') {
        doc.setFillColor(TONES[r.tone]).circle(cx + 2.5, y - 2.6, 2.5, 'F');
        tx += 9;
      }
      doc.text(pdfSafe(cell), tx, y);
      cx += widths[i];
    });
    y += 11;
  }
  return y;
}

/** Module to module, split into side-by-side runs when it is long. */
function portMap(doc: jsPDF, pm: NonNullable<PdfContent['portMap']>, x: number, y: number, w: number, bottom: number) {
  y = heading(doc, 'Port map', x, y, w);
  doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(MUTED);
  const per = Math.max(1, Math.floor((bottom - y - 12) / 10));
  const runs = Math.ceil(pm.table.rows.length / per);
  // Side by side there is room for the numbers only, so "Port" moves to the caption.
  const short = (s: string) => (runs > 1 ? s.replace(/^Ports? /, '') : s);
  const rows = pm.table.rows.map((r) => r.cells.map((c) => pdfSafe(short(c))));
  doc.text(pdfSafe(`${pm.names.left} -> ${pm.names.right}${runs > 1 ? ', port numbers' : ', module to module'}`), x, y);
  y += 12;
  const rw = w / runs;
  doc.setFont('helvetica', 'bold').setFontSize(7.5);
  const lw = Math.max(...rows.map((r) => doc.getTextWidth(r[0])));
  rows.forEach((r, i) => {
    const rx = x + Math.floor(i / per) * rw;
    const ry = y + (i % per) * 10;
    doc.setFont('helvetica', 'bold').setFontSize(7.5).setTextColor(INK);
    doc.text(r[0], rx + lw, ry, { align: 'right' });
    doc.setFont('helvetica', 'normal').setTextColor(MUTED);
    doc.text('->', rx + lw + 4, ry);
    doc.setTextColor(INK).text(r[1], rx + lw + 16, ry);
  });
}

type QrFactory = typeof import('qrcode-generator');

/** The share link as a QR code drawn in squares, with the address under it; both open the link. */
function qr(doc: jsPDF, qrcode: QrFactory, url: string, x: number, y: number, w: number) {
  const code = qrcode(0, 'M');
  code.addData(url);
  code.make();
  const n = code.getModuleCount();
  const size = 76;
  const cell = size / n;
  doc.setFillColor(INK);
  for (let r = 0; r < n; r++) {
    for (let col = 0; col < n; ) {
      if (!code.isDark(r, col)) {
        col++;
        continue;
      }
      let run = 1;
      while (col + run < n && code.isDark(r, col + run)) run++;
      // A hair of overlap so neighbouring squares print without gaps.
      doc.rect(x + col * cell, y + r * cell, run * cell + 0.05, cell + 0.05, 'F');
      col += run;
    }
  }
  doc.link(x, y, size, size, { url });
  const tx = x + size + 10;
  doc.setFont('helvetica', 'bold').setFontSize(8).setTextColor(INK);
  doc.text('Open this link', tx, y + 9);
  doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(MUTED);
  doc.text(doc.splitTextToSize('Scan with a phone to see the light move, or select the address below.', w - size - 10) as string[], tx, y + 21, { lineHeightFactor: 1.3 });
  doc.setFontSize(6.5).setTextColor(INK);
  const lines = doc.splitTextToSize(url, w) as string[];
  // Long addresses have no spaces, so break them by width.
  const wrapped = lines.flatMap((l) => breakWord(doc, l, w));
  doc.text(wrapped, x, y + size + 12, { lineHeightFactor: 1.25 });
  doc.link(x, y + size + 5, w, wrapped.length * 8.2, { url });
}

function breakWord(doc: jsPDF, s: string, w: number): string[] {
  const out: string[] = [];
  let cur = '';
  for (const ch of s) {
    if (doc.getTextWidth(cur + ch) > w && cur) {
      out.push(cur);
      cur = ch;
    } else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}
