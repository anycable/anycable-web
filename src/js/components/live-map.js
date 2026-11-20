// Hero illustration: a live map of connections.
//
// Your app broadcasts through the AnyCable server (the plug cube) to a field
// of client devices. Three scenarios show what the delivery guarantees mean in
// practice: a network drop (missed messages wait in stream history and replay
// on reconnect), an app deploy (connections stay open), and a launch spike
// (connections live outside the app process). A switch replays the same
// events on an in-process WebSocket server, where messages are lost.
//
// The traffic is simulated. It plays a short script on its own until the
// visitor presses a button. Rendering pauses while the hero is off screen.

const root = document.querySelector("[data-controller='live-map']");

if (root) initLiveMap(root);

function initLiveMap(root) {
  const q = (name) => root.querySelector(`[data-live-map-target='${name}']`);
  const cv = q('canvas');
  const ctx = cv.getContext('2d');
  const RM = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const RED = '246,67,67';
  const OK = '60,194,122';
  const INK = '238,235,239';
  const AMB = '224,160,48';
  const MUTE = '142,137,146';
  const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
  const PER = 13; // each dot stands for a group of connections

  let W = 0, H = 0, dpr = 1, narrow = false, grid = null;
  const app = { x: 0, y: 0, w: 160, h: 78 };
  const cube = { x: 0, y: 0, s: 40 };
  let field = { x: 0, y: 0, w: 0, h: 0 };
  let mode = 'any', hubMix = 1, kick = 0, clock = 0, acc = 0, tunA = 0, ver = 412;

  let seed = 11;
  const srnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const clients = [];
  const COLS = 16, ROWS = 12;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const order = srnd();
      clients.push({
        u: (c + 0.5 + (srnd() - 0.5) * 0.75) / COLS,
        v: (r + 0.5 + (srnd() - 0.5) * 0.75) / ROWS,
        kind: srnd() < 0.62 ? 0 : 1,
        order, x: 0, y: 0, on: true, active: order < 0.5, appear: 1,
        flash: 0, fc: RED, queue: 0, gap: 0, rx: 0, refused: false, back: -1,
      });
    }
  }

  const pulses = [], drops = [];
  let history = 0;
  let stats = { delivered: 0, replayed: 0, lost: 0 };
  let tunnelT = -1, tunnelLost = 0, deployT = -1, deployLost = 0, deployRc = 0, spikeT = -1, refusedCount = 0;
  const TUN = 4.5, DEP = 3.6, SPK = 9;
  const t0 = Date.now();

  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const pad = (n) => String(n).padStart(2, '0');
  const rgba = (c, a) => `rgba(${c},${a})`;
  function rr(x, y, w, h, rad) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, rad); else ctx.rect(x, y, w, h);
  }
  const inTunnel = (c) => (narrow ? c.u > 0.6 : c.v > 0.6);
  function spikeLevel() {
    if (spikeT < 0) return 0.5;
    const t = spikeT;
    if (t < 2) return 0.5 + 0.25 * t;
    if (t < 7) return 1;
    if (t < SPK) return 1 - 0.25 * (t - 7);
    return 0.5;
  }
  const activeList = () => clients.filter((c) => c.active);
  const onlineCount = () => clients.reduce((n, c) => n + (c.active && c.on ? 1 : 0), 0);
  const appOut = () => (narrow ? { x: app.x + app.w / 2, y: app.y + app.h } : { x: app.x + app.w, y: app.y + app.h / 2 });
  function hub() {
    const o = appOut();
    return { x: o.x + (cube.x - o.x) * hubMix, y: o.y + (cube.y - o.y) * hubMix };
  }

  function log(msg, cls) {
    const el = q('log');
    const line = document.createElement('div');
    const s = Math.floor((Date.now() - t0) / 1000);
    line.className = `live-map__log-line ${cls ? `live-map__log-line_${cls}` : ''}`;
    line.textContent = `[${pad(Math.floor(s / 60))}:${pad(s % 60)}] ${msg}`;
    el.insertBefore(line, el.firstChild);
    while (el.children.length > 2) el.removeChild(el.lastChild);
  }

  function layout() {
    const b = cv.getBoundingClientRect();
    W = b.width; H = b.height;
    if (!W || !H) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    narrow = W < 560;
    if (!narrow) {
      app.w = Math.max(132, Math.min(170, W * 0.2)); app.h = 84; app.x = 20; app.y = H * 0.52 - app.h / 2;
      cube.s = Math.max(28, Math.min(42, W * 0.045)); cube.x = W * 0.4; cube.y = H * 0.47;
      const top = Math.max(80, H * 0.17); // clear the switch and tally overlays
      field = { x: W * 0.57, y: top, w: W * 0.4, h: H - top - 24 };
    } else {
      app.w = Math.min(240, W * 0.7); app.h = 70; app.x = W / 2 - app.w / 2; app.y = 112;
      cube.s = 26; cube.x = W / 2; cube.y = app.y + app.h + 82;
      field = { x: W * 0.05, y: cube.y + 108, w: W * 0.9, h: Math.max(140, H - (cube.y + 108) - 18) };
    }
    clients.forEach((c) => { c.x = field.x + c.u * field.w; c.y = field.y + c.v * field.h; });
    pulses.length = 0; drops.length = 0;
    grid = document.createElement('canvas');
    grid.width = cv.width; grid.height = cv.height;
    const g = grid.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = rgba(INK, 0.07);
    for (let y = 11; y < H; y += 22) for (let x = 11; x < W; x += 22) g.fillRect(x, y, 1.2, 1.2);
  }

  // Messages
  function addPulse(p) {
    const dx = p.x1 - p.x0, dy = p.y1 - p.y0, b = p.bend || 0;
    p.cx = (p.x0 + p.x1) / 2 - dy * b; p.cy = (p.y0 + p.y1) / 2 + dx * b;
    p.t = 0; p.delay = p.delay || 0;
    pulses.push(p);
  }
  function at(p, t) {
    const a = 1 - t;
    return [a * a * p.x0 + 2 * a * t * p.cx + t * t * p.x1, a * a * p.y0 + 2 * a * t * p.cy + t * t * p.y1];
  }
  function sendTo(c, from, kind, delay) {
    addPulse({
      kind, target: c, x0: from.x, y0: from.y, x1: c.x, y1: c.y,
      dur: kind === 'replay' ? 0.36 + Math.random() * 0.2 : 0.5 + Math.random() * 0.35,
      bend: (Math.random() - 0.5) * 0.32, delay: delay || 0,
    });
  }
  function broadcast() {
    const list = activeList();
    if (!list.length) return;
    const k = 3 + Math.floor(Math.random() * 6), targets = [], o = appOut();
    for (let i = 0; i < k; i++) targets.push(list[Math.floor(Math.random() * list.length)]);
    if (mode === 'any') addPulse({ kind: 'up', targets, x0: o.x, y0: o.y, x1: cube.x, y1: cube.y, dur: 0.3, bend: 0 });
    else targets.forEach((t) => sendTo(t, o, t.on ? 'out' : 'doomed'));
  }
  function lose(x, y) {
    stats.lost++;
    if (tunnelT >= 0) tunnelLost++;
    if (deployT >= 0) deployLost++;
    drops.push({ x, y, vx: (Math.random() - 0.5) * 40, vy: -25 - Math.random() * 30, life: 1 });
  }
  function arrive(p) {
    const t = p.target;
    if (p.kind === 'up') {
      kick = 1;
      p.targets.forEach((x) => { if (x.on) sendTo(x, cube, 'out'); else { x.queue++; history++; } });
    } else if (p.kind === 'out') {
      if (t.on) { t.flash = 1; t.fc = RED; stats.delivered++; }
      else if (mode === 'any') { t.queue++; history++; }
      else lose(p.x1, p.y1);
    } else if (p.kind === 'replay') {
      t.flash = 1; t.fc = OK; stats.delivered++; stats.replayed++;
    }
  }

  // Scenarios
  function startTunnel() {
    if (tunnelT >= 0) return;
    tunnelT = 0; tunnelLost = 0;
    let n = 0;
    clients.forEach((c) => { if (c.active && inTunnel(c)) { c.on = false; n++; } });
    log(`subway: ${fmt(n * PER)} connections lose signal`, 'bad');
  }
  function endTunnel() {
    tunnelT = -1;
    let total = 0, i = 0;
    clients.forEach((c) => {
      if (!c.active || !inTunnel(c)) return;
      if (mode === 'ws' && deployT >= 0) return;
      c.on = true;
      if (mode === 'any' && c.queue > 0) {
        for (let k = 0; k < c.queue; k++) { sendTo(c, cube, 'replay', 0.04 * i + Math.random() * 0.25); i++; }
        total += c.queue; c.queue = 0;
      } else if (mode === 'ws') c.gap = 1;
    });
    if (mode === 'any') log(`signal back: replaying ${total} missed messages from stream history`, 'ok');
    else log(`signal back: ${tunnelLost} messages lost, no history to replay`, 'bad');
  }
  function startDeploy() {
    if (deployT >= 0) return;
    deployT = 0; deployLost = 0; deployRc = 0; ver++;
    if (mode === 'ws') {
      let n = 0;
      clients.forEach((c) => { if (c.active && c.on) { c.on = false; c.back = DEP * 0.55 + c.order * 1.1; n++; } });
      log(`deploy v${ver}: app restarts and drops all ${fmt(n * PER)} connections`, 'bad');
    } else {
      log(`deploy v${ver}: app restarts, AnyCable keeps ${fmt(onlineCount() * PER)} connections open`, 'ok');
    }
  }
  function endDeploy() {
    const wasWs = mode === 'ws';
    deployT = -1;
    clients.forEach((c) => { if (c.back >= 0) { c.back = -1; c.on = !(tunnelT >= 0 && inTunnel(c)); } });
    if (wasWs) log(`deploy done: ${deployLost} messages lost, ${fmt(deployRc * PER)} clients reconnected at once`, 'bad');
    else log('deploy done: 0 connections dropped, 0 messages lost', 'ok');
  }
  function startSpike() {
    if (spikeT >= 0) return;
    spikeT = 0; refusedCount = 0;
    if (mode === 'any') log('launch spike: connections double, about 18 KB each, outside your app', 'ok');
    else log('launch spike: connections double inside your app processes', 'bad');
  }
  function endSpike() {
    spikeT = -1;
    if (mode === 'ws' && refusedCount) log(`spike over: ${fmt(refusedCount * PER)} connection attempts timed out`, 'bad');
    else if (mode === 'any') log('spike over: every new connection accepted', 'ok');
    clients.forEach((c) => { c.refused = false; });
  }
  function setMode(m) {
    if (m === mode) return;
    mode = m;
    q('mode-any').setAttribute('aria-pressed', String(m === 'any'));
    q('mode-ws').setAttribute('aria-pressed', String(m === 'ws'));
    tunnelT = -1; deployT = -1; spikeT = -1; history = 0;
    pulses.length = 0; drops.length = 0;
    stats = { delivered: 0, replayed: 0, lost: 0 };
    clients.forEach((c) => { c.on = true; c.queue = 0; c.back = -1; c.refused = false; c.active = c.order < 0.5; });
    log(m === 'any' ? 'AnyCable: connections live in a separate Go server' : 'in-process WebSocket server: connections live inside your app', '');
  }

  // Autoplay script, until the visitor takes over
  let auto = true, autoT = 0, autoIdx = 0;
  const LOOP = 50;
  const script = [
    [2, startTunnel], [8.5, startDeploy], [13.5, startSpike], [24, () => setMode('ws')],
    [26, startTunnel], [32.5, startDeploy], [38, startSpike], [48, () => setMode('any')],
  ];
  function takeOver() {
    if (!auto) return;
    auto = false;
    q('auto').textContent = 'you are driving';
  }

  function update(dt) {
    clock += dt;
    if (auto) {
      autoT += dt;
      while (autoIdx < script.length && autoT >= script[autoIdx][0]) { script[autoIdx][1](); autoIdx++; }
      if (autoT >= LOOP) { autoT = 0; autoIdx = 0; }
    }
    hubMix += ((mode === 'any' ? 1 : 0) - hubMix) * Math.min(1, dt * 3);
    kick = Math.max(0, kick - dt * 3);
    tunA += ((tunnelT >= 0 ? 1 : 0) - tunA) * Math.min(1, dt * 5);
    if (tunnelT >= 0) { tunnelT += dt; if (tunnelT >= TUN) endTunnel(); }
    if (deployT >= 0) {
      deployT += dt;
      if (mode === 'ws') {
        clients.forEach((c) => {
          if (c.back >= 0 && deployT >= c.back) {
            c.back = -1;
            if (!(tunnelT >= 0 && inTunnel(c))) { c.on = true; c.gap = 1; deployRc++; }
          }
        });
      }
      if (deployT >= DEP) endDeploy();
    }
    if (spikeT >= 0) { spikeT += dt; if (spikeT >= SPK) endSpike(); }
    const lvl = spikeLevel();
    clients.forEach((c) => {
      const want = c.order < lvl;
      if (want && !c.active && !c.refused) {
        if (mode === 'ws' && spikeT >= 0 && Math.random() < 0.35) { c.refused = true; c.rx = 1; refusedCount++; }
        else { c.active = true; c.appear = 0; c.on = !(tunnelT >= 0 && inTunnel(c)) && !(mode === 'ws' && deployT >= 0); }
      } else if (!want && c.active) {
        c.active = false; history = Math.max(0, history - c.queue); c.queue = 0;
      }
      c.flash = Math.max(0, c.flash - dt * 2.2);
      c.gap = Math.max(0, c.gap - dt * 0.8);
      c.appear = Math.min(1, c.appear + dt * 2.5);
      c.rx = Math.max(0, c.rx - dt * 0.6);
    });
    acc += dt * 6 * (lvl / 0.5);
    while (acc >= 1) { acc -= 1; broadcast(); }
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      if (p.delay > 0) { p.delay -= dt; continue; }
      if (!p.started) { p.started = true; if (p.kind === 'replay') history = Math.max(0, history - 1); }
      p.t += dt / p.dur;
      if (p.kind === 'doomed' && p.t >= 0.62) { const pt = at(p, 0.62); lose(pt[0], pt[1]); pulses.splice(i, 1); continue; }
      if (p.t >= 1) { pulses.splice(i, 1); arrive(p); }
    }
    for (let j = drops.length - 1; j >= 0; j--) {
      const d = drops[j];
      d.vy += 140 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt * 0.9;
      if (d.life <= 0) drops.splice(j, 1);
    }
  }

  // Drawing
  function drawTunnel() {
    if (tunA < 0.01) return;
    const z = narrow
      ? { x: field.x + field.w * 0.6 - 4, y: field.y - 12, w: field.w * 0.4 + 14, h: field.h + 24 }
      : { x: field.x - 12, y: field.y + field.h * 0.6 - 4, w: field.w + 24, h: field.h * 0.4 + 16 };
    ctx.save();
    ctx.globalAlpha = tunA;
    rr(z.x, z.y, z.w, z.h, 10); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = rgba(INK, 0.05); ctx.lineWidth = 1; ctx.beginPath();
    for (let i = -z.h; i < z.w; i += 12) { ctx.moveTo(z.x + i, z.y + z.h); ctx.lineTo(z.x + i + z.h, z.y); }
    ctx.stroke(); ctx.restore();
    rr(z.x, z.y, z.w, z.h, 10); ctx.setLineDash([4, 4]); ctx.strokeStyle = rgba(RED, 0.5); ctx.stroke(); ctx.setLineDash([]);
    const left = tunnelT >= 0 ? Math.max(0, TUN - tunnelT).toFixed(1) : '0.0';
    const label = `NO SIGNAL · SUBWAY · ${left}s`;
    ctx.font = `600 10px ${MONO}`;
    const tw = ctx.measureText(label).width;
    rr(z.x + 8, z.y + z.h - 24, tw + 16, 18, 4); ctx.fillStyle = 'rgba(14,13,16,0.92)'; ctx.fill();
    ctx.fillStyle = rgba(RED, 1); ctx.fillText(label, z.x + 16, z.y + z.h - 11);
    ctx.restore();
  }
  function drawClient(c) {
    if (c.rx > 0.01 && !c.active) {
      ctx.strokeStyle = rgba(RED, c.rx); ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(c.x - 4, c.y - 4); ctx.lineTo(c.x + 4, c.y + 4); ctx.moveTo(c.x + 4, c.y - 4); ctx.lineTo(c.x - 4, c.y + 4);
      ctx.stroke();
      return;
    }
    if (!c.active) return;
    const sc = 0.5 + 0.5 * c.appear;
    const w = (c.kind ? 13 : 8) * sc, h = (c.kind ? 9 : 12) * sc, x = c.x - w / 2, y = c.y - h / 2;
    if (c.appear < 1) {
      ctx.strokeStyle = rgba(INK, 0.6 * (1 - c.appear)); ctx.lineWidth = 1; ctx.beginPath();
      ctx.arc(c.x, c.y, 6 + 14 * c.appear, 0, 6.283); ctx.stroke();
    }
    if (c.flash > 0.02) {
      ctx.fillStyle = rgba(c.fc, 0.28 * c.flash); ctx.beginPath();
      ctx.arc(c.x, c.y, 8 + 7 * (1 - c.flash), 0, 6.283); ctx.fill();
    }
    if (c.on) {
      rr(x, y, w, h, 2); ctx.fillStyle = rgba(INK, (0.4 + 0.5 * c.flash) * (0.4 + 0.6 * c.appear)); ctx.fill();
      if (c.flash > 0.25) { rr(x + 1.5, y + 1.5, w - 3, h - 3, 1); ctx.fillStyle = rgba(c.fc, c.flash); ctx.fill(); }
      if (c.kind) { ctx.fillStyle = rgba(INK, 0.35); ctx.fillRect(x - 1.5, y + h + 1, w + 3, 1.5); }
    } else {
      rr(x + 0.5, y + 0.5, w - 1, h - 1, 2); ctx.strokeStyle = rgba(MUTE, 0.6); ctx.lineWidth = 1; ctx.stroke();
    }
    if (c.queue > 0) { ctx.fillStyle = rgba(RED, 1); ctx.beginPath(); ctx.arc(x + w, y, 2.4, 0, 6.283); ctx.fill(); }
    if (c.gap > 0.02) {
      ctx.strokeStyle = rgba(RED, c.gap); ctx.lineWidth = 1.2; ctx.beginPath();
      ctx.arc(c.x, c.y, 8 + 10 * (1 - c.gap), 0, 6.283); ctx.stroke();
    }
  }
  function drawApp() {
    const { x, y, w, h } = app;
    const dep = deployT >= 0;
    rr(x, y, w, h, 9); ctx.fillStyle = '#1C1A1F'; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = dep ? rgba(AMB, 0.9) : rgba(INK, 0.18); ctx.stroke();
    ctx.fillStyle = rgba(INK, 1); ctx.font = `600 12px ${MONO}`;
    ctx.fillText(mode === 'any' ? 'your app' : 'your app + ws server', x + 12, y + 21);
    ctx.fillStyle = dep ? rgba(AMB, 1) : rgba(MUTE, 1); ctx.font = `400 9.5px ${MONO}`;
    ctx.fillText(dep ? `deploying v${ver}…` : 'rails · fastapi · node', x + 12, y + 37);
    const n = 4, gap = 4, bw = (w - 24 - gap * (n - 1)) / n, cur = dep ? Math.floor((deployT / DEP) * n) : -1;
    for (let i = 0; i < n; i++) {
      let col = rgba(INK, 0.28);
      if (dep && i === cur) col = rgba(AMB, 0.5 + 0.5 * Math.abs(Math.sin(clock * 9)));
      else if (dep && i < cur) col = rgba(OK, 0.7);
      ctx.fillStyle = col; ctx.fillRect(x + 12 + i * (bw + gap), y + 47, bw, 5);
    }
    const mem = mode === 'any' ? 0.2 : Math.min(0.97, 0.15 + ((0.85 * onlineCount()) / 192) * 1.15);
    ctx.fillStyle = rgba(MUTE, 1); ctx.font = `400 8.5px ${MONO}`; ctx.fillText('mem', x + 12, y + h - 10);
    const mx = x + 40, mw = w - 52;
    ctx.fillStyle = rgba(INK, 0.1); ctx.fillRect(mx, y + h - 16, mw, 5);
    ctx.fillStyle = mem > 0.8 ? rgba(RED, 1) : rgba(INK, 0.55); ctx.fillRect(mx, y + h - 16, mw * mem, 5);
  }
  function face(pts, fill) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.stroke();
  }
  function hole(o, e1, e2, a, b, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(o[0] + a * e1[0] + b * e2[0], o[1] + a * e1[1] + b * e2[1], rx, ry, 0, 0, 6.283);
    ctx.fill();
  }
  function drawCube() {
    const alpha = 0.1 + 0.9 * hubMix, s = cube.s * (1 + 0.07 * kick), x = cube.x;
    const y = cube.y + (RM ? 0 : Math.sin(clock * 1.6) * 3), k = 0.866 * s;
    ctx.save(); ctx.globalAlpha = alpha;
    if (kick > 0.02 && hubMix > 0.5) {
      ctx.strokeStyle = rgba(RED, 0.5 * kick); ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.arc(x, y + s * 0.25, s * 1.3 + (1 - kick) * 26, 0, 6.283); ctx.stroke();
    }
    [[-0.62, 0.69], [-0.24, 0.88]].forEach(([px, py]) => {
      rr(x + px * k - s * 0.07, y + py * s - 3, s * 0.14, s * 0.5, 2);
      ctx.fillStyle = '#2B282E'; ctx.fill(); ctx.strokeStyle = rgba(INK, 0.55); ctx.lineWidth = 1; ctx.stroke();
    });
    const T = [x, y - s], R = [x + k, y - s / 2], C = [x, y], L = [x - k, y - s / 2];
    const BL = [x - k, y + s / 2], B = [x, y + s], BR = [x + k, y + s / 2];
    face([L, C, B, BL], '#F64343');
    face([C, R, BR, B], '#B52A2A');
    face([L, T, R, C], '#FF7A6E');
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.beginPath();
    ctx.moveTo(L[0], L[1]); ctx.lineTo(T[0], T[1]); ctx.lineTo(R[0], R[1]); ctx.stroke();
    ctx.fillStyle = '#1A1012';
    const d = s * 0.075;
    hole(L, [k, -s / 2], [k, s / 2], 0.3, 0.7, d, d * 0.58);
    hole(L, [k, -s / 2], [k, s / 2], 0.7, 0.3, d, d * 0.58);
    hole(L, [k, s / 2], [0, s], 0.32, 0.42, d * 0.55, d * 1.2);
    hole(L, [k, s / 2], [0, s], 0.68, 0.42, d * 0.55, d * 1.2);
    hole(C, [k, -s / 2], [0, s], 0.25, 0.3, d * 0.8, d);
    hole(C, [k, -s / 2], [0, s], 0.5, 0.5, d * 0.8, d);
    hole(C, [k, -s / 2], [0, s], 0.75, 0.7, d * 0.8, d);
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.font = `600 12px ${MONO}`; ctx.fillStyle = rgba(INK, hubMix > 0.5 ? 1 : 0.35);
    ctx.fillText('AnyCable', x, cube.y + s * 1.85);
    ctx.font = `400 9.5px ${MONO}`; ctx.fillStyle = rgba(MUTE, 1);
    ctx.fillText(hubMix > 0.5 ? `go server · ${fmt(onlineCount() * PER)} conns` : 'not in use', x, cube.y + s * 1.85 + 15);
    ctx.textAlign = 'left';
  }
  function drawHistory() {
    if (history <= 0 || hubMix < 0.5) return;
    const n = Math.min(history, 28), x0 = cube.x + cube.s * 1.25, yb = cube.y + cube.s * 0.55;
    for (let i = 0; i < n; i++) { ctx.fillStyle = rgba(RED, 0.55 + 0.45 * (i / n)); ctx.fillRect(x0, yb - i * 4, 12, 3); }
    ctx.font = `600 9.5px ${MONO}`; ctx.fillStyle = rgba(RED, 1);
    ctx.fillText('history', x0 + 18, yb - 10);
    ctx.fillText(`${history} waiting`, x0 + 18, yb + 2);
  }
  function draw() {
    ctx.fillStyle = '#0E0D10'; ctx.fillRect(0, 0, W, H);
    if (grid) ctx.drawImage(grid, 0, 0, W, H);
    const h = hub();
    const gr = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, Math.max(180, W * 0.25));
    gr.addColorStop(0, rgba(RED, (0.14 + 0.1 * kick) * (0.35 + 0.65 * hubMix)));
    gr.addColorStop(1, rgba(RED, 0));
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    ctx.font = `400 9.5px ${MONO}`; ctx.fillStyle = rgba(MUTE, 1);
    ctx.fillText(`your users · each dot ≈ ${PER} connections`, field.x, field.y - 12);
    drawTunnel();
    ctx.lineWidth = 1; ctx.strokeStyle = rgba(INK, 0.055); ctx.beginPath();
    clients.forEach((c) => { if (c.active && c.on) { ctx.moveTo(h.x, h.y); ctx.lineTo(c.x, c.y); } });
    ctx.stroke();
    if (hubMix > 0.02) {
      const o = appOut();
      ctx.save(); ctx.globalAlpha = hubMix; ctx.strokeStyle = rgba(RED, 0.6); ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]); ctx.lineDashOffset = RM ? 0 : -clock * 30;
      ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(cube.x, cube.y); ctx.stroke(); ctx.restore();
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    pulses.forEach((p) => {
      if (p.delay > 0) return;
      const t = Math.min(1, p.t), ta = Math.max(0, t - 0.18), a = at(p, t), b = at(p, ta);
      const col = p.kind === 'replay' ? OK : p.kind === 'doomed' ? RED : '255,128,112';
      const lg = ctx.createLinearGradient(b[0], b[1], a[0], a[1]);
      lg.addColorStop(0, rgba(col, 0)); lg.addColorStop(1, rgba(col, 0.95));
      ctx.strokeStyle = lg; ctx.lineWidth = p.kind === 'up' ? 3 : 1.8;
      ctx.beginPath(); ctx.moveTo(b[0], b[1]);
      for (let s = 1; s <= 4; s++) { const pt = at(p, ta + ((t - ta) * s) / 4); ctx.lineTo(pt[0], pt[1]); }
      ctx.stroke();
      ctx.fillStyle = rgba(col, 0.22); ctx.beginPath(); ctx.arc(a[0], a[1], p.kind === 'up' ? 8 : 5.5, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.arc(a[0], a[1], p.kind === 'up' ? 2.6 : 1.7, 0, 6.283); ctx.fill();
    });
    ctx.restore();
    clients.forEach(drawClient);
    drops.forEach((d) => {
      ctx.strokeStyle = rgba(RED, Math.max(0, d.life)); ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(d.x - 3, d.y - 3); ctx.lineTo(d.x + 3, d.y + 3); ctx.moveTo(d.x + 3, d.y - 3); ctx.lineTo(d.x - 3, d.y + 3);
      ctx.stroke();
    });
    drawApp(); drawCube(); drawHistory();
  }

  let tallyT = 0;
  function updateTally(dt) {
    tallyT += dt;
    if (tallyT < 0.25) return;
    tallyT = 0;
    q('delivered').textContent = fmt(stats.delivered);
    q('replayed').textContent = fmt(stats.replayed);
    q('lost').textContent = fmt(stats.lost);
    q('lost').parentNode.classList.toggle('live-map__tally-item_bad', stats.lost > 0);
  }

  // Wiring
  const on = (name, fn) => q(name).addEventListener('click', () => { takeOver(); fn(); });
  on('tunnel', startTunnel);
  on('deploy', startDeploy);
  on('spike', startSpike);
  on('mode-any', () => setMode('any'));
  on('mode-ws', () => setMode('ws'));

  if (window.ResizeObserver) new ResizeObserver(layout).observe(cv);
  else window.addEventListener('resize', layout);
  layout();
  log(`simulated traffic: your app broadcasts to ${fmt(onlineCount() * PER)} connections`, '');

  let visible = true, running = false, last = 0;
  function frame(now) {
    if (!visible) { running = false; return; }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt); draw(); updateTally(dt);
    requestAnimationFrame(frame);
  }
  function start() {
    if (running) return;
    running = true; last = performance.now();
    requestAnimationFrame(frame);
  }
  if (window.IntersectionObserver) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) start();
    }).observe(root);
  }
  start();
}
