// Draws the live map's model (sim.js) onto the canvas each frame.

import { rgba } from './theme.js';
import { LOGO, PILL, logoBelowCenter, appOut } from './layout.js';
import { PER, TUNNEL_TOP, RATE_WINDOW_S, fmt, pointOnPulse } from './sim.js';

const TAU = Math.PI * 2;
const GRID_STEP = 24;
// The field label: its baseline sits this far above the field, on a backing
// box of this height.
const FIELD_LABEL = { baseline: 16, boxTop: 29, boxH: 18 };
const DEVICE = { phone: { w: 7, h: 11 }, laptop: { w: 12, h: 8 } };

export function createRenderer(ctx, sim, { theme: T, logo, reducedMotion }) {
  let W = 0;
  let H = 0;
  let grid = null;
  const tone = { ok: T.ok, amber: T.amber };
  const pulseColor = {
    replay: T.ok,
    doomed: T.red,
    rc: T.amber,
    up: T.ink,
    out: T.ink,
  };
  // Motion that reduced-motion visitors don't get: shakes, bobbing, dashes.
  const wobble = (freq, amp) =>
    reducedMotion ? 0 : Math.sin(sim.clock * freq) * amp;

  function resize(width, height, dpr) {
    W = width;
    H = height;
    grid = document.createElement('canvas');
    grid.width = Math.round(W * dpr);
    grid.height = Math.round(H * dpr);
    const g = grid.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = rgba(T.ink, 0.06);
    const half = GRID_STEP / 2;
    for (let y = half; y < H; y += GRID_STEP)
      for (let x = half; x < W; x += GRID_STEP)
        g.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);
  }

  // Primitives
  // Firefox 110 and 111 run the container query but lack roundRect.
  function rr(x, y, w, h, radius) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, radius);
    else ctx.rect(x, y, w, h);
  }
  function pill(x, y, w, h, fill, stroke) {
    rr(x, y, w, h, h / 2);
    ctx.fillStyle = fill;
    ctx.fill();
    if (!stroke) return;
    ctx.lineWidth = 1;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
  function circle(x, y, r, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
  function ring(x, y, r, stroke, width) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.stroke();
  }
  // A red X: a lost message or a refused reconnect.
  function cross(x, y, r, alpha) {
    ctx.strokeStyle = rgba(T.red, alpha);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - r, y - r);
    ctx.lineTo(x + r, y + r);
    ctx.moveTo(x + r, y - r);
    ctx.lineTo(x - r, y + r);
    ctx.stroke();
  }
  // Sets the font and returns the text, shrunk and then cut if needed to fit.
  function fit(text, maxW, weight, size, family) {
    let s = size;
    ctx.font = `${weight} ${s}px ${family}`;
    while (ctx.measureText(text).width > maxW && s > 8) {
      s -= 0.5;
      ctx.font = `${weight} ${s}px ${family}`;
    }
    if (ctx.measureText(text).width <= maxW) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(`${t}…`).width > maxW)
      t = t.slice(0, -1);
    return `${t}…`;
  }
  const running = name => (sim.running?.name === name ? sim.running : null);

  // The subway: a hatched zone over the bottom of the field.
  function tunnelZone() {
    const f = sim.geo.field;
    return {
      x: f.x - 10,
      y: f.y + f.h * TUNNEL_TOP - 6,
      w: f.w + 20,
      h: f.h * (1 - TUNNEL_TOP) + 16,
    };
  }
  function drawTunnel() {
    const z = tunnelZone();
    ctx.save();
    ctx.globalAlpha = sim.tunnelFade;
    rr(z.x, z.y, z.w, z.h, 10);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = rgba(T.ink, 0.045);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -z.h; i < z.w; i += 12) {
      ctx.moveTo(z.x + i, z.y + z.h);
      ctx.lineTo(z.x + i + z.h, z.y);
    }
    ctx.stroke();
    ctx.restore();
    rr(z.x + 0.5, z.y + 0.5, z.w - 1, z.h - 1, 10);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = rgba(T.red, 0.55);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
  function drawTunnelLabel() {
    const z = tunnelZone();
    const run = running('tunnel');
    const left = run ? Math.max(0, run.duration - run.t) : 0;
    ctx.save();
    ctx.globalAlpha = sim.tunnelFade;
    const label = fit(`No signal · subway · ${left.toFixed(1)} s`, z.w - 40, 500, 10.5, T.mono);
    const tw = ctx.measureText(label).width;
    pill(z.x + 10, z.y + z.h - 30, tw + 20, 20, rgba(T.bg, 0.94), rgba(T.red, 0.5));
    ctx.fillStyle = rgba(T.red, 1);
    ctx.textBaseline = 'middle';
    ctx.fillText(label, z.x + 20, z.y + z.h - 20);
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  // Devices
  function drawClient(c) {
    const { w, h } = DEVICE[c.kind];
    const x = c.x - w / 2;
    const y = c.y - h / 2;
    if (c.flash > 0.02)
      circle(c.x, c.y, 8 + 7 * (1 - c.flash), rgba(tone[c.tone], 0.26 * c.flash));
    if (c.on) drawOnline(c, x, y, w, h);
    else {
      rr(x + 0.5, y + 0.5, w - 1, h - 1, 2);
      ctx.strokeStyle = rgba(T.mute, 0.6);
      ctx.lineWidth = 1;
      ctx.stroke();
      if (c.rx > 0.01) cross(c.x, c.y, 3.5, c.rx); // a refused reconnect
    }
    if (c.queue > 0) circle(x + w, y, 2.4, rgba(T.red, 1)); // waiting in history
    if (c.gap > 0.02) ring(c.x, c.y, 8 + 10 * (1 - c.gap), rgba(T.red, c.gap), 1.2);
  }
  function drawOnline(c, x, y, w, h) {
    rr(x, y, w, h, 2);
    ctx.fillStyle = rgba(T.ink, 0.38 + 0.5 * c.flash);
    ctx.fill();
    if (c.flash > 0.25) {
      rr(x + 1.5, y + 1.5, w - 3, h - 3, 1);
      ctx.fillStyle = rgba(tone[c.tone], c.flash);
      ctx.fill();
    }
    if (c.kind === 'laptop') {
      ctx.fillStyle = rgba(T.ink, 0.32);
      ctx.fillRect(x - 1.5, y + h + 1, w + 3, 1.5);
    }
  }

  // The app box
  function appStatus(ws) {
    if (ws && sim.appDown >= 0) return { text: 'out of memory', color: T.red };
    if (running('deploy')) return { text: `deploying v${sim.ver}…`, color: T.amber };
    const storm = running('storm');
    if (storm && ws)
      return {
        text: `connect × ${fmt(storm.calls * PER)}`,
        color: sim.appLoad > 0.8 ? T.red : T.amber,
      };
    if (storm) return { text: '0 connect calls', color: T.ok };
    return { text: ws ? '+ websocket server' : 'any backend', color: T.mute };
  }
  function appBorder(down, strain, blink) {
    if (down) return rgba(T.red, 0.5 + 0.5 * blink);
    if (strain > 0) return rgba(T.red, 0.5 + 0.4 * strain);
    if (running('deploy')) return rgba(T.amber, 0.9);
    return rgba(T.ink, 0.16);
  }
  // Four instance bars; a deploy restarts them one at a time.
  function drawInstances(x, y, inner, down, blink) {
    const n = 4;
    const gap = 4;
    const bw = (inner - gap * (n - 1)) / n;
    const deploy = running('deploy');
    const current = deploy ? Math.floor((deploy.t / deploy.duration) * n) : -1;
    for (let i = 0; i < n; i++) {
      let color = rgba(T.ink, 0.22);
      if (down) color = rgba(T.red, 0.3 + 0.5 * blink);
      else if (i === current) color = rgba(T.amber, 0.5 + 0.5 * blink);
      else if (i < current) color = rgba(T.ok, 0.75);
      rr(x + i * (bw + gap), y, bw, 5, 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
  function drawApp() {
    const { app } = sim.geo;
    const ws = sim.mode === 'ws';
    const down = ws && sim.appDown >= 0;
    const inner = app.w - 28;
    const blink = Math.abs(Math.sin(sim.clock * 9));
    // An overloaded or crashed app shakes.
    const overload = Math.max(0, (sim.appLoad - 0.8) / 0.2);
    let strain = 0;
    if (down) strain = 0.6;
    else if (ws) strain = overload;
    const x = app.x + wobble(53, 1.8 * strain);
    const y = app.y + wobble(41, 0.9 * strain);
    rr(x, y, app.w, app.h, 10);
    ctx.fillStyle = rgba(down ? T.panelDown : T.panel, 1);
    ctx.fill();
    ctx.lineWidth = down ? 1.5 : 1;
    ctx.strokeStyle = appBorder(down, strain, blink);
    ctx.stroke();
    ctx.fillStyle = rgba(T.ink, down ? 0.55 : 1);
    ctx.fillText(fit('Your app', inner, 400, 14, T.sans), x + 14, y + 24);
    const status = appStatus(ws);
    ctx.fillStyle = rgba(status.color, 1);
    ctx.fillText(fit(status.text, inner, 400, 10.5, T.mono), x + 14, y + 41);
    drawInstances(x + 14, y + 52, inner, down, blink);
  }

  // The AnyCable hub: logo, name pill, history pill
  function drawHubLogo() {
    const { hub } = sim.geo;
    const hh = hub.h;
    const hw = hh * (LOGO.w / LOGO.h);
    const scale = 1 + 0.06 * sim.kick;
    // Under a reconnect storm the logo trembles and a load ring fills.
    const strain = Math.max(0, (sim.hubLoad - 0.55) / 0.45);
    const cx = hub.x;
    const cy = hub.y + wobble(1.6, 2.5);
    const shown = sim.hubMix > 0.5;
    ctx.save();
    ctx.globalAlpha = 0.12 + 0.88 * sim.hubMix;
    if (shown && sim.hubLoad > 0.02) drawLoadRing(cx, cy, hh * 0.66);
    if (shown && sim.kick > 0.02)
      ring(cx, cy, hh * 0.62 + (1 - sim.kick) * 26, rgba(T.ink, 0.35 * sim.kick), 1.5);
    if (logo.complete && logo.naturalWidth)
      ctx.drawImage(
        logo,
        cx + wobble(57, 1.4 * strain) - (hw * scale) / 2,
        cy - hh * scale * (LOGO.centerY / LOGO.h),
        hw * scale,
        hh * scale
      );
    ctx.restore();
  }
  function drawLoadRing(cx, cy, r) {
    const alpha = Math.min(1, sim.hubLoad * 4);
    ring(cx, cy, r, rgba(T.ink, 0.1 * alpha), 3);
    ctx.strokeStyle = rgba(sim.hubLoad > 0.75 ? T.red : T.amber, 0.9 * alpha);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + sim.hubLoad * TAU);
    ctx.stroke();
    ctx.lineCap = 'butt';
  }
  function hubSubLabel() {
    if (sim.hubMix <= 0.5) return { text: 'not in use', color: T.mute };
    const rate = (sim.rcTimes.length / RATE_WINDOW_S) * PER;
    if (running('storm') && rate > 0)
      return { text: `${fmt(rate)} reconnects/s`, color: T.amber };
    return { text: `${fmt(sim.onlineCount() * PER)} connections`, color: T.mute };
  }
  // Name and live count under the logo, on a solid pill so traffic lines
  // never run through the text.
  function drawHubLabels() {
    const { hub, app, field, stacked } = sim.geo;
    const top = hub.y + logoBelowCenter(hub.h) + PILL.gap;
    const maxW = stacked ? W - 40 : Math.min(200, field.x - (app.x + app.w) - 16);
    const name = fit('AnyCable', maxW - 24, 400, 14, T.sans);
    const nameFont = ctx.font;
    const nameW = ctx.measureText(name).width;
    const sub = hubSubLabel();
    const subText = fit(sub.text, maxW - 24, 400, 10.5, T.mono);
    const subFont = ctx.font;
    const bw = Math.max(nameW, ctx.measureText(subText).width) + 24;
    rr(hub.x - bw / 2, top, bw, PILL.nameH, 8);
    ctx.fillStyle = rgba(T.bg, 0.92);
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = rgba(T.ink, 0.1);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.font = nameFont;
    ctx.fillStyle = rgba(T.ink, sim.hubMix > 0.5 ? 1 : 0.4);
    ctx.fillText(name, hub.x, top + 18);
    ctx.font = subFont;
    ctx.fillStyle = rgba(sub.color, 1);
    ctx.fillText(subText, hub.x, top + 33);
    ctx.textAlign = 'left';
    if (sim.history > 0 && sim.hubMix > 0.5) drawHistoryPill(hub.x, top, maxW);
  }
  function drawHistoryPill(cx, top, maxW) {
    const label = fit(`${fmt(sim.history * PER)} in history`, maxW - 30, 500, 10.5, T.mono);
    const lw = ctx.measureText(label).width + 30;
    const y = top + PILL.historyY;
    const mid = y + PILL.historyH / 2;
    pill(cx - lw / 2, y, lw, PILL.historyH, rgba(T.bg, 1));
    pill(cx - lw / 2, y, lw, PILL.historyH, rgba(T.red, 0.16), rgba(T.red, 0.55));
    circle(cx - lw / 2 + 12, mid, 3, rgba(T.red, 1));
    ctx.fillStyle = rgba(T.badText, 1);
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx - lw / 2 + 21, mid + 0.5);
    ctx.textBaseline = 'alphabetic';
  }

  // The field label doubles as the storm's progress line. It is drawn over
  // the traffic, on a solid backing, since reconnects cross it on phones.
  function fieldLabel() {
    const storm = running('storm');
    if (!storm) return { text: 'Your users · 1 dot = 100 connections', color: T.mute };
    const back = sim.clients.reduce((k, c) => k + (c.inStorm && c.on ? 1 : 0), 0);
    const down = sim.mode === 'ws' && sim.appDown >= 0;
    return {
      text: `${down ? 'App down' : 'Reconnect storm'} · ${fmt(back * PER)} of ${fmt(storm.total * PER)} back`,
      color: down ? T.red : T.amber,
    };
  }
  function drawFieldLabel() {
    const { field } = sim.geo;
    const label = fieldLabel();
    const text = fit(label.text, field.w, 400, 10.5, T.mono);
    ctx.fillStyle = rgba(T.bg, 0.9);
    ctx.fillRect(
      field.x - 4,
      field.y - FIELD_LABEL.boxTop,
      ctx.measureText(text).width + 8,
      FIELD_LABEL.boxH
    );
    ctx.fillStyle = rgba(label.color, 1);
    ctx.fillText(text, field.x, field.y - FIELD_LABEL.baseline);
  }

  // Background, links and messages
  function drawBackground(h) {
    ctx.fillStyle = rgba(T.bg, 1);
    ctx.fillRect(0, 0, W, H);
    if (grid) ctx.drawImage(grid, 0, 0, W, H);
    const glow = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, Math.max(180, W * 0.26));
    glow.addColorStop(0, rgba(T.red, (0.15 + 0.1 * sim.kick) * (0.35 + 0.65 * sim.hubMix)));
    glow.addColorStop(1, rgba(T.red, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
  }
  function drawLinks(h) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = rgba(T.ink, 0.05);
    ctx.beginPath();
    for (const c of sim.clients) {
      if (!c.on) continue;
      ctx.moveTo(h.x, h.y);
      ctx.lineTo(c.x, c.y);
    }
    ctx.stroke();
    if (sim.hubMix <= 0.02) return;
    // The app's link to AnyCable, dashes running toward the hub.
    const o = appOut(sim.geo);
    const { hub } = sim.geo;
    ctx.save();
    ctx.globalAlpha = sim.hubMix;
    ctx.strokeStyle = rgba(T.red, 0.65);
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.lineDashOffset = reducedMotion ? 0 : -sim.clock * 30;
    ctx.beginPath();
    ctx.moveTo(o.x, o.y);
    ctx.lineTo(hub.x, hub.y);
    ctx.stroke();
    ctx.restore();
  }
  function drawPulse(p) {
    const t = Math.min(1, p.t);
    const tail = Math.max(0, t - 0.18);
    const head = pointOnPulse(p, t);
    const back = pointOnPulse(p, tail);
    const color = pulseColor[p.kind];
    const big = p.kind === 'up';
    const trail = ctx.createLinearGradient(back[0], back[1], head[0], head[1]);
    trail.addColorStop(0, rgba(color, 0));
    trail.addColorStop(1, rgba(color, 0.95));
    ctx.strokeStyle = trail;
    ctx.lineWidth = big ? 3 : 1.8;
    ctx.beginPath();
    ctx.moveTo(back[0], back[1]);
    for (let s = 1; s <= 4; s++) ctx.lineTo(...pointOnPulse(p, tail + ((t - tail) * s) / 4));
    ctx.stroke();
    circle(head[0], head[1], big ? 8 : 5.5, rgba(color, 0.22));
    circle(head[0], head[1], big ? 2.6 : 1.7, 'rgba(255,255,255,0.95)');
  }

  function draw() {
    const h = sim.hubPos();
    drawBackground(h);
    if (sim.tunnelFade > 0.01) drawTunnel();
    drawLinks(h);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of sim.pulses) if (p.delay <= 0) drawPulse(p);
    ctx.restore();
    sim.clients.forEach(drawClient);
    for (const d of sim.drops) cross(d.x, d.y, 3, Math.max(0, d.life));
    drawFieldLabel();
    if (sim.tunnelFade > 0.01) drawTunnelLabel();
    drawApp();
    drawHubLogo();
    drawHubLabels();
  }

  return { resize, draw };
}
