// The map's colours and fonts live in CSS custom properties on the panel
// (live-map.scss), so the canvas and the HTML around it share one palette.
// Each colour token is an "R G B" triplet, usable in CSS as rgb(var(--x))
// and here through rgba().

const COLORS = {
  ink: 'ink',
  mute: 'mute',
  bg: 'bg',
  panel: 'panel',
  panelDown: 'panel-down',
  red: 'red',
  ok: 'ok',
  amber: 'amber',
  badText: 'bad-text',
};

export function readTheme(el) {
  const style = getComputedStyle(el);
  const token = name => style.getPropertyValue(`--live-map-${name}`).trim();
  const theme = { mono: token('mono'), sans: token('sans') };
  for (const [key, name] of Object.entries(COLORS)) theme[key] = token(name);
  return theme;
}

export const rgba = (rgb, alpha) => `rgb(${rgb} / ${alpha})`;
