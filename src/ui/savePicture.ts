// Saves the diagram as a PNG. The drawing is styled by the page's CSS, so each
// element's computed style is copied onto a clone first; animation and tap
// targets are left out.

const PROPS = [
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'paint-order',
  'opacity',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'letter-spacing',
  'text-anchor',
  'dominant-baseline',
  'display',
  'visibility',
];

const SCALE = 2;

/** A copy of the drawing that carries its own styles, with animation and tap targets left out. */
export function styledClone(svg: SVGSVGElement): SVGSVGElement {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const from = [svg, ...svg.querySelectorAll('*')];
  const to = [clone, ...clone.querySelectorAll('*')];
  from.forEach((el, i) => {
    const cs = getComputedStyle(el);
    const target = to[i] as SVGElement;
    target.setAttribute('style', PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';'));
    target.removeAttribute('class');
  });
  clone.querySelectorAll('[data-export="skip"]').forEach((el) => el.remove());
  return clone;
}

export async function savePicture(svg: SVGSVGElement, background: string, footer: string, filename: string): Promise<void> {
  const clone = styledClone(svg);
  // Parts kept off the page but always in the picture, such as the parts table.
  clone.querySelectorAll<SVGElement>('[data-export="show"]').forEach((el) => el.style.setProperty('display', 'inline'));

  // The whole drawing, room at the bottom for the link, and a solid background.
  const vb = svg.viewBox.baseVal;
  const h = Number(svg.dataset.fullHeight ?? vb.height) + 26;
  clone.setAttribute('viewBox', `0 0 ${vb.width} ${h}`);
  clone.setAttribute('width', `${vb.width}`);
  clone.setAttribute('height', `${h}`);
  const NS = 'http://www.w3.org/2000/svg';
  const bg = document.createElementNS(NS, 'rect');
  bg.setAttribute('width', '100%');
  bg.setAttribute('height', '100%');
  bg.setAttribute('fill', background);
  clone.insertBefore(bg, clone.firstChild);
  const text = document.createElementNS(NS, 'text');
  text.setAttribute('x', '24');
  text.setAttribute('y', `${h - 12}`);
  text.setAttribute('style', `font: 11px Arial, sans-serif; fill: ${getComputedStyle(svg).color}`);
  text.textContent = footer;
  clone.appendChild(text);

  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = vb.width * SCALE;
    canvas.height = h * SCALE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(SCALE, SCALE);
    ctx.drawImage(img, 0, 0);
    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!png) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(png);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  } finally {
    URL.revokeObjectURL(url);
  }
}
