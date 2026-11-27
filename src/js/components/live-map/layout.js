// Where the app box, the AnyCable logo and the field of devices sit on the
// canvas. Two arrangements: side by side, or stacked top to bottom when the
// panel is narrow (live-map.scss decides which, through --live-map-layout).

// The logo is drawn from its 80 x 102 viewBox. Its cube body is centered 52
// units down, so the rest of the logo hangs below the center.
export const LOGO = { w: 80, h: 102, centerY: 52 };
export const logoBelowCenter = height =>
  height * ((LOGO.h - LOGO.centerY) / LOGO.h);

// Pills under the logo, measured from the bottom of the logo: the name and
// connection count, then the stream-history count.
export const PILL = { gap: 10, nameH: 42, historyY: 50, historyH: 22 };

// The field's label line sits above the field, inside this much room.
export const FIELD_LABEL_SPACE = 32;

const EDGE = 20; // canvas edge to the app box and to the field
const TOP = 12; // canvas top to the field label
const APP_H = 70;
const APP_W = { min: 156, max: 180, share: 0.22 }; // side by side
const APP_W_STACKED = { max: 220, share: 0.62 };
const HUB_H = { min: 72, max: 96, share: 0.2 }; // side by side
const HUB_H_STACKED = 64;
const FIELD_X_SHARE = 0.53; // the field starts just past the middle
const FIELD_MIN_H = 140;

const clamp = (min, value, max) => Math.max(min, Math.min(max, value));

export function computeLayout(W, H, stacked) {
  return stacked ? stackedLayout(W, H) : sideBySideLayout(W, H);
}

function sideBySideLayout(W, H) {
  const app = { w: Math.round(clamp(APP_W.min, W * APP_W.share, APP_W.max)) };
  Object.assign(app, { h: APP_H, x: EDGE, y: Math.round(H / 2 - APP_H / 2) });
  const appRight = app.x + app.w;
  const hub = {
    h: clamp(HUB_H.min, H * HUB_H.share, HUB_H.max),
    x: Math.round(appRight + (W / 2 - appRight) * 0.55),
    y: Math.round(H / 2 - 18), // a little above center, so the pills fit below
  };
  const fieldX = Math.round(W * FIELD_X_SHARE);
  const fieldY = TOP + FIELD_LABEL_SPACE;
  const field = {
    x: fieldX,
    y: fieldY,
    w: W - fieldX - EDGE,
    h: H - fieldY - 22,
  };
  return { stacked: false, app, hub, field };
}

function stackedLayout(W, H) {
  const appW = Math.round(Math.min(APP_W_STACKED.max, W * APP_W_STACKED.share));
  const app = { w: appW, h: APP_H, x: Math.round(W / 2 - appW / 2), y: 16 };
  const hub = { h: HUB_H_STACKED, x: Math.round(W / 2) };
  hub.y = app.y + app.h + 30 + hub.h / 2;
  // Below the logo: its pills, then the field's label line.
  const pillsTop = hub.y + logoBelowCenter(hub.h) + PILL.gap;
  const fieldY = Math.round(
    pillsTop + PILL.historyY + PILL.historyH + FIELD_LABEL_SPACE
  );
  const field = {
    x: 16,
    y: fieldY,
    w: W - 32,
    h: Math.max(FIELD_MIN_H, H - fieldY - 18),
  };
  return { stacked: true, app, hub, field };
}

// Where messages leave the app box: its right edge side by side, its bottom
// edge when stacked.
export function appOut({ stacked, app }) {
  return stacked
    ? { x: app.x + app.w / 2, y: app.y + app.h }
    : { x: app.x + app.w, y: app.y + app.h / 2 };
}
