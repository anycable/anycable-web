import logoSvg from '../../../images/logo.svg?raw';

// Leg colours for the dark panel: the dark parts of the plug turn light and
// the mid-grey parts stay mid-grey, so the plug keeps its shading.
const LEG_LIGHT = '#D8D2DB';
const LEG_MID = '#8A838F';
const TOP_FACE = '#FFFFFF';

// The site logo is drawn for a white page: its top face is left transparent
// and its plug legs are black. On the dark panel the top face gets filled and
// the legs turn light, so the mark reads exactly as it does on the site.
export function logoForDarkPanel() {
  const doc = new DOMParser().parseFromString(logoSvg, 'image/svg+xml');
  const svg = doc.documentElement;
  svg.removeAttribute('class');
  svg.setAttribute('width', '160');
  svg.setAttribute('height', '204');
  svg.querySelectorAll("g[id='Leg'] [fill]").forEach(el => {
    const black = el.getAttribute('fill').toUpperCase() === '#000000';
    el.setAttribute('fill', black ? LEG_LIGHT : LEG_MID);
  });
  const group = svg.querySelector("g[id='Group']");
  const top = doc.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  top.setAttribute('points', '0 20 40 0 80 20 40 40');
  top.setAttribute('fill', TOP_FACE);
  group.insertBefore(top, group.firstChild);
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    new XMLSerializer().serializeToString(svg)
  )}`;
  return img;
}
