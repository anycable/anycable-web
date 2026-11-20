// Hero illustration: a live map of connections.
//
// Your app broadcasts through the AnyCable server (drawn with the real AnyCable
// logo) to a field of client devices; one dot stands for 100 connections.
// Three scenarios show what the delivery guarantees mean in practice: a
// network drop (missed messages wait in stream history and replay on
// reconnect), an app deploy (connections stay open), and a launch-day spike
// (connections live outside the app process). A switch replays the same
// events on an in-process WebSocket server, where messages are lost.
//
// The traffic is simulated. A short script plays on its own until the visitor
// presses a button. Rendering pauses while the hero is off screen, and with
// reduced motion the script does not autoplay.

import logoSvg from '../../images/logo.svg?raw';

const root = document.querySelector("[data-controller='live-map']");

if (root) initLiveMap(root);

// The site logo is drawn for a white page: its top face is left transparent
// and its plug legs are black. On the dark panel the top face gets filled and
// the legs turn light, so the mark reads exactly as it does on the site.
function logoForDarkPanel() {
  const doc = new DOMParser().parseFromString(logoSvg, 'image/svg+xml');
  const svg = doc.documentElement;
  svg.removeAttribute('class');
  svg.setAttribute('width', '160');
  svg.setAttribute('height', '204');
  svg.querySelectorAll("g[id='Leg'] [fill]").forEach(el => {
    const fill = el.getAttribute('fill').toUpperCase();
    el.setAttribute('fill', fill === '#000000' ? '#D8D2DB' : '#8A838F');
  });
  const group = svg.querySelector("g[id='Group']");
  const top = doc.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  top.setAttribute('points', '0 20 40 0 80 20 40 40');
  top.setAttribute('fill', '#FFFFFF');
  group.insertBefore(top, group.firstChild);
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    new XMLSerializer().serializeToString(svg)
  )}`;
  return img;
}

function initLiveMap(root) {
  const q = name => root.querySelector(`[data-live-map-target='${name}']`);
  const cv = q('canvas');
  const ctx = cv.getContext('2d');
  const RM = !!(
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const logo = logoForDarkPanel();

  const RED = '246,67,67';
  const OK = '74,210,138';
  const INK = '238,235,239';
  const AMB = '236,170,60';
  const MUTE = '150,144,155';
  const BG = '14,13,16';
  const MONO = "'Martian Mono', ui-monospace, 'SF Mono', Menlo, monospace";
  const SANS = "'Stem', Arial, sans-serif";
  const PER = 100; // connections per dot
  const N = 200; // dots at full load; half of them are online at rest

  let W = 0,
    H = 0,
    dpr = 1,
    narrow = false,
    grid = null;
  const app = { x: 0, y: 0, w: 0, h: 0 };
  const hubP = { x: 0, y: 0, h: 80 }; // logo center and drawn height
  let field = { x: 0, y: 0, w: 0, h: 0 };
  let mode = 'any',
    hubMix = 1,
    kick = 0,
    clock = 0,
    acc = 0,
    tunA = 0,
    ver = 412;

  // Device positions: an R2 low-discrepancy sequence spreads them evenly in
  // any aspect ratio. A fixed shuffle gives each one its turn to come online,
  // so exactly half are online at rest: 100 dots, 10,000 connections.
  let seed = 7;
  const srnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const rank = Array.from({ length: N }, (_, i) => i);
  for (let i = N - 1; i > 0; i--) {
    const j = Math.floor(srnd() * (i + 1));
    [rank[i], rank[j]] = [rank[j], rank[i]];
  }
  const clients = [];
  for (let i = 0; i < N; i++) {
    const u = (0.5 + 0.754877666 * (i + 1)) % 1;
    const v = (0.5 + 0.569840291 * (i + 1)) % 1;
    const order = (rank[i] + 0.5) / N;
    clients.push({
      u: 0.03 + 0.94 * u,
      v: 0.04 + 0.92 * v,
      kind: srnd() < 0.62 ? 0 : 1,
      order,
      x: 0,
      y: 0,
      on: true,
      active: order < 0.5,
      appear: 1,
      flash: 0,
      fc: RED,
      queue: 0,
      gap: 0,
      rx: 0,
      refused: false,
      back: -1,
    });
  }

  const pulses = [],
    drops = [];
  let history = 0;
  let stats = { delivered: 0, replayed: 0, lost: 0 };
  let tunnelT = -1,
    tunnelLost = 0,
    deployT = -1,
    deployLost = 0,
    deployRc = 0,
    spikeT = -1,
    refusedCount = 0;
  const TUN = 4.5,
    DEP = 3.6,
    SPK = 9;
  const t0 = Date.now();

  const fmt = n => Math.round(n).toLocaleString('en-US');
  const pad = n => String(n).padStart(2, '0');
  const rgba = (c, a) => `rgba(${c},${a})`;
  function rr(x, y, w, h, rad) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, rad);
    else ctx.rect(x, y, w, h);
  }
  // Sets the font and returns the text shortened, if needed, to fit maxW.
  function fit(text, maxW, weight, size, family) {
    let s = size;
    const set = () => {
      ctx.font = `${weight} ${s}px ${family}`;
      ctx.fontStretch = family === MONO ? 'semi-condensed' : 'normal';
    };
    set();
    while (ctx.measureText(text).width > maxW && s > 8) {
      s -= 0.5;
      set();
    }
    if (ctx.measureText(text).width <= maxW) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(`${t}…`).width > maxW)
      t = t.slice(0, -1);
    return `${t}…`;
  }
  const inTunnel = c => c.v > 0.6;
  function spikeLevel() {
    if (spikeT < 0) return 0.5;
    const t = spikeT;
    if (t < 2) return 0.5 + 0.25 * t;
    if (t < 7) return 1;
    if (t < SPK) return 1 - 0.25 * (t - 7);
    return 0.5;
  }
  const activeList = () => clients.filter(c => c.active);
  const onlineCount = () =>
    clients.reduce((n, c) => n + (c.active && c.on ? 1 : 0), 0);
  const appOut = () =>
    narrow
      ? { x: app.x + app.w / 2, y: app.y + app.h }
      : { x: app.x + app.w, y: app.y + app.h / 2 };
  function hub() {
    const o = appOut();
    return {
      x: o.x + (hubP.x - o.x) * hubMix,
      y: o.y + (hubP.y - o.y) * hubMix,
    };
  }

  function log(msg, cls) {
    const el = q('log');
    const line = document.createElement('div');
    const s = Math.floor((Date.now() - t0) / 1000);
    line.className = `live-map__log-line${
      cls ? ` live-map__log-line_${cls}` : ''
    }`;
    const time = document.createElement('span');
    time.className = 'live-map__log-time';
    time.textContent = `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
    line.append(time, ` ${msg}`);
    el.replaceChildren(line);
  }

  function layout() {
    const b = cv.getBoundingClientRect();
    W = b.width;
    H = b.height;
    if (!W || !H) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    narrow = W < 560;
    if (!narrow) {
      app.w = Math.round(Math.max(156, Math.min(180, W * 0.22)));
      app.h = 92;
      app.x = 20;
      app.y = Math.round(H / 2 - app.h / 2);
      hubP.h = Math.max(72, Math.min(96, H * 0.2));
      hubP.x = Math.round(app.x + app.w + (W * 0.5 - app.x - app.w) * 0.55);
      hubP.y = Math.round(H / 2 - 18);
      const fx = Math.round(W * 0.53);
      field = { x: fx, y: 44, w: W - fx - 20, h: H - 44 - 22 };
    } else {
      app.w = Math.round(Math.min(220, W * 0.62));
      app.h = 92;
      app.x = Math.round(W / 2 - app.w / 2);
      app.y = 16;
      hubP.h = 64;
      hubP.x = Math.round(W / 2);
      hubP.y = app.y + app.h + 30 + hubP.h / 2;
      // Below the hub: its name pill (42), the history pill (22), the field label.
      const fy = Math.round(hubP.y + hubP.h * (50 / 102) + 10 + 42 + 32 + 30);
      field = { x: 16, y: fy, w: W - 32, h: Math.max(140, H - fy - 18) };
    }
    clients.forEach(c => {
      c.x = field.x + c.u * field.w;
      c.y = field.y + c.v * field.h;
    });
    pulses.length = 0;
    drops.length = 0;
    grid = document.createElement('canvas');
    grid.width = cv.width;
    grid.height = cv.height;
    const g = grid.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = rgba(INK, 0.06);
    for (let y = 12; y < H; y += 24)
      for (let x = 12; x < W; x += 24) g.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);
  }

  // Messages
  function addPulse(p) {
    const dx = p.x1 - p.x0,
      dy = p.y1 - p.y0,
      b = p.bend || 0;
    p.cx = (p.x0 + p.x1) / 2 - dy * b;
    p.cy = (p.y0 + p.y1) / 2 + dx * b;
    p.t = 0;
    p.delay = p.delay || 0;
    pulses.push(p);
  }
  function at(p, t) {
    const a = 1 - t;
    return [
      a * a * p.x0 + 2 * a * t * p.cx + t * t * p.x1,
      a * a * p.y0 + 2 * a * t * p.cy + t * t * p.y1,
    ];
  }
  function sendTo(c, from, kind, delay) {
    addPulse({
      kind,
      target: c,
      x0: from.x,
      y0: from.y,
      x1: c.x,
      y1: c.y,
      dur:
        kind === 'replay'
          ? 0.36 + Math.random() * 0.2
          : 0.5 + Math.random() * 0.35,
      bend: (Math.random() - 0.5) * 0.3,
      delay: delay || 0,
    });
  }
  function broadcast() {
    const list = activeList();
    if (!list.length) return;
    const k = 3 + Math.floor(Math.random() * 6),
      targets = [],
      o = appOut();
    for (let i = 0; i < k; i++)
      targets.push(list[Math.floor(Math.random() * list.length)]);
    if (mode === 'any')
      addPulse({
        kind: 'up',
        targets,
        x0: o.x,
        y0: o.y,
        x1: hubP.x,
        y1: hubP.y,
        dur: 0.3,
        bend: 0,
      });
    else targets.forEach(t => sendTo(t, o, t.on ? 'out' : 'doomed'));
  }
  function lose(x, y) {
    stats.lost += PER;
    if (tunnelT >= 0) tunnelLost += PER;
    if (deployT >= 0) deployLost += PER;
    drops.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 40,
      vy: -25 - Math.random() * 30,
      life: 1,
    });
  }
  function arrive(p) {
    const t = p.target;
    if (p.kind === 'up') {
      kick = 1;
      p.targets.forEach(x => {
        if (x.on) sendTo(x, hubP, 'out');
        else {
          x.queue++;
          history++;
        }
      });
    } else if (p.kind === 'out') {
      if (t.on) {
        t.flash = 1;
        t.fc = RED;
        stats.delivered += PER;
      } else if (mode === 'any') {
        t.queue++;
        history++;
      } else lose(p.x1, p.y1);
    } else if (p.kind === 'replay') {
      t.flash = 1;
      t.fc = OK;
      stats.delivered += PER;
      stats.replayed += PER;
    }
  }

  // Scenarios
  function startTunnel() {
    if (tunnelT >= 0) return;
    tunnelT = 0;
    tunnelLost = 0;
    let n = 0;
    clients.forEach(c => {
      if (c.active && inTunnel(c)) {
        c.on = false;
        n++;
      }
    });
    log(`Subway: ${fmt(n * PER)} connections lose signal.`, 'bad');
  }
  function endTunnel() {
    tunnelT = -1;
    let total = 0,
      i = 0;
    clients.forEach(c => {
      if (!c.active || !inTunnel(c)) return;
      if (mode === 'ws' && deployT >= 0) return;
      c.on = true;
      if (mode === 'any' && c.queue > 0) {
        for (let k = 0; k < c.queue; k++) {
          sendTo(c, hubP, 'replay', 0.04 * i + Math.random() * 0.25);
          i++;
        }
        total += c.queue;
        c.queue = 0;
      } else if (mode === 'ws') c.gap = 1;
    });
    if (mode === 'any')
      log(
        `Signal back: ${fmt(
          total * PER
        )} missed messages replayed from stream history, in order.`,
        'ok'
      );
    else
      log(
        `Signal back: ${fmt(
          tunnelLost
        )} messages lost, with no history to replay.`,
        'bad'
      );
  }
  function startDeploy() {
    if (deployT >= 0) return;
    deployT = 0;
    deployLost = 0;
    deployRc = 0;
    ver++;
    if (mode === 'ws') {
      let n = 0;
      clients.forEach(c => {
        if (c.active && c.on) {
          c.on = false;
          c.back = DEP * 0.55 + c.order * 1.1;
          n++;
        }
      });
      log(
        `Deploy v${ver}: the app restarts and drops all ${fmt(
          n * PER
        )} connections.`,
        'bad'
      );
    } else {
      log(
        `Deploy v${ver}: the app restarts, AnyCable keeps ${fmt(
          onlineCount() * PER
        )} connections open.`,
        'ok'
      );
    }
  }
  function endDeploy() {
    const wasWs = mode === 'ws';
    deployT = -1;
    clients.forEach(c => {
      if (c.back >= 0) {
        c.back = -1;
        c.on = !(tunnelT >= 0 && inTunnel(c));
      }
    });
    if (wasWs)
      log(
        `Deploy done: ${fmt(deployLost)} messages lost, ${fmt(
          deployRc * PER
        )} clients reconnected at once.`,
        'bad'
      );
    else log('Deploy done: 0 connections dropped, 0 messages lost.', 'ok');
  }
  function startSpike() {
    if (spikeT >= 0) return;
    spikeT = 0;
    refusedCount = 0;
    if (mode === 'any')
      log(
        'Launch day: connections double to 20,000, outside your app processes.',
        'ok'
      );
    else
      log('Launch day: connections double inside your app processes.', 'bad');
  }
  function endSpike() {
    spikeT = -1;
    if (mode === 'ws' && refusedCount)
      log(
        `Spike over: ${fmt(refusedCount * PER)} connection attempts timed out.`,
        'bad'
      );
    else if (mode === 'any')
      log('Spike over: every new connection was accepted.', 'ok');
    clients.forEach(c => {
      c.refused = false;
    });
  }
  function setMode(m) {
    if (m === mode) return;
    mode = m;
    q('mode-any').setAttribute('aria-pressed', String(m === 'any'));
    q('mode-ws').setAttribute('aria-pressed', String(m === 'ws'));
    tunnelT = -1;
    deployT = -1;
    spikeT = -1;
    history = 0;
    pulses.length = 0;
    drops.length = 0;
    stats = { delivered: 0, replayed: 0, lost: 0 };
    clients.forEach(c => {
      c.on = true;
      c.queue = 0;
      c.back = -1;
      c.refused = false;
      c.active = c.order < 0.5;
    });
    log(
      m === 'any'
        ? 'AnyCable: connections live in a separate Go server.'
        : 'In-process WebSockets: connections live inside your app.',
      ''
    );
  }

  // Autoplay script, until the visitor takes over
  let auto = !RM,
    autoT = 0,
    autoIdx = 0;
  const LOOP = 50;
  const script = [
    [2, startTunnel],
    [8.5, startDeploy],
    [13.5, startSpike],
    [24, () => setMode('ws')],
    [26, startTunnel],
    [32.5, startDeploy],
    [38, startSpike],
    [48, () => setMode('any')],
  ];
  function takeOver() {
    if (!auto) return;
    auto = false;
    q('auto').textContent = 'You are driving.';
    q('log').setAttribute('aria-live', 'polite'); // quiet during autoplay
  }
  if (RM) q('auto').textContent = 'Press a button to run a scenario.';

  function update(dt) {
    clock += dt;
    if (auto) {
      autoT += dt;
      while (autoIdx < script.length && autoT >= script[autoIdx][0]) {
        script[autoIdx][1]();
        autoIdx++;
      }
      if (autoT >= LOOP) {
        autoT = 0;
        autoIdx = 0;
      }
    }
    hubMix += ((mode === 'any' ? 1 : 0) - hubMix) * Math.min(1, dt * 3);
    kick = Math.max(0, kick - dt * 3);
    tunA += ((tunnelT >= 0 ? 1 : 0) - tunA) * Math.min(1, dt * 5);
    if (tunnelT >= 0) {
      tunnelT += dt;
      if (tunnelT >= TUN) endTunnel();
    }
    if (deployT >= 0) {
      deployT += dt;
      if (mode === 'ws') {
        clients.forEach(c => {
          if (c.back >= 0 && deployT >= c.back) {
            c.back = -1;
            if (!(tunnelT >= 0 && inTunnel(c))) {
              c.on = true;
              c.gap = 1;
              deployRc++;
            }
          }
        });
      }
      if (deployT >= DEP) endDeploy();
    }
    if (spikeT >= 0) {
      spikeT += dt;
      if (spikeT >= SPK) endSpike();
    }
    const lvl = spikeLevel();
    clients.forEach(c => {
      const want = c.order < lvl;
      if (want && !c.active && !c.refused) {
        if (mode === 'ws' && spikeT >= 0 && Math.random() < 0.35) {
          c.refused = true;
          c.rx = 1;
          refusedCount++;
        } else {
          c.active = true;
          c.appear = 0;
          c.on =
            !(tunnelT >= 0 && inTunnel(c)) && !(mode === 'ws' && deployT >= 0);
        }
      } else if (!want && c.active) {
        c.active = false;
        history = Math.max(0, history - c.queue);
        c.queue = 0;
      }
      c.flash = Math.max(0, c.flash - dt * 2.2);
      c.gap = Math.max(0, c.gap - dt * 0.8);
      c.appear = Math.min(1, c.appear + dt * 2.5);
      c.rx = Math.max(0, c.rx - dt * 0.6);
    });
    acc += dt * (RM ? 3 : 6) * (lvl / 0.5);
    while (acc >= 1) {
      acc -= 1;
      broadcast();
    }
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      if (p.delay > 0) {
        p.delay -= dt;
        continue;
      }
      if (!p.started) {
        p.started = true;
        if (p.kind === 'replay') history = Math.max(0, history - 1);
      }
      p.t += dt / p.dur;
      if (p.kind === 'doomed' && p.t >= 0.62) {
        const pt = at(p, 0.62);
        lose(pt[0], pt[1]);
        pulses.splice(i, 1);
        continue;
      }
      if (p.t >= 1) {
        pulses.splice(i, 1);
        arrive(p);
      }
    }
    for (let j = drops.length - 1; j >= 0; j--) {
      const d = drops[j];
      d.vy += 140 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.life -= dt * 0.9;
      if (d.life <= 0) drops.splice(j, 1);
    }
  }

  // Drawing
  function pill(x, y, w, h, fill, stroke) {
    rr(x, y, w, h, h / 2);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }
  function drawTunnel() {
    if (tunA < 0.01) return;
    const z = tunnelZone();
    ctx.save();
    ctx.globalAlpha = tunA;
    rr(z.x, z.y, z.w, z.h, 10);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = rgba(INK, 0.045);
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
    ctx.strokeStyle = rgba(RED, 0.55);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
  function tunnelZone() {
    return {
      x: field.x - 10,
      y: field.y + field.h * 0.6 - 6,
      w: field.w + 20,
      h: field.h * 0.4 + 16,
    };
  }
  function drawTunnelLabel() {
    if (tunA < 0.01) return;
    const z = tunnelZone();
    ctx.save();
    ctx.globalAlpha = tunA;
    const left = tunnelT >= 0 ? Math.max(0, TUN - tunnelT).toFixed(1) : '0.0';
    const label = fit(
      `No signal · subway · ${left} s`,
      z.w - 40,
      600,
      10.5,
      MONO
    );
    const tw = ctx.measureText(label).width;
    pill(z.x + 10, z.y + z.h - 30, tw + 20, 20, rgba(BG, 0.94), rgba(RED, 0.5));
    ctx.fillStyle = rgba(RED, 1);
    ctx.textBaseline = 'middle';
    ctx.fillText(label, z.x + 20, z.y + z.h - 20);
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }
  function drawClient(c) {
    if (c.rx > 0.01 && !c.active) {
      ctx.strokeStyle = rgba(RED, c.rx);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(c.x - 4, c.y - 4);
      ctx.lineTo(c.x + 4, c.y + 4);
      ctx.moveTo(c.x + 4, c.y - 4);
      ctx.lineTo(c.x - 4, c.y + 4);
      ctx.stroke();
      return;
    }
    if (!c.active) return;
    const sc = 0.5 + 0.5 * c.appear;
    const w = (c.kind ? 12 : 7) * sc,
      h = (c.kind ? 8 : 11) * sc,
      x = c.x - w / 2,
      y = c.y - h / 2;
    if (c.appear < 1) {
      ctx.strokeStyle = rgba(INK, 0.6 * (1 - c.appear));
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 6 + 14 * c.appear, 0, 6.283);
      ctx.stroke();
    }
    if (c.flash > 0.02) {
      ctx.fillStyle = rgba(c.fc, 0.26 * c.flash);
      ctx.beginPath();
      ctx.arc(c.x, c.y, 8 + 7 * (1 - c.flash), 0, 6.283);
      ctx.fill();
    }
    if (c.on) {
      rr(x, y, w, h, 2);
      ctx.fillStyle = rgba(
        INK,
        (0.38 + 0.5 * c.flash) * (0.4 + 0.6 * c.appear)
      );
      ctx.fill();
      if (c.flash > 0.25) {
        rr(x + 1.5, y + 1.5, w - 3, h - 3, 1);
        ctx.fillStyle = rgba(c.fc, c.flash);
        ctx.fill();
      }
      if (c.kind) {
        ctx.fillStyle = rgba(INK, 0.32);
        ctx.fillRect(x - 1.5, y + h + 1, w + 3, 1.5);
      }
    } else {
      rr(x + 0.5, y + 0.5, w - 1, h - 1, 2);
      ctx.strokeStyle = rgba(MUTE, 0.6);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    if (c.queue > 0) {
      ctx.fillStyle = rgba(RED, 1);
      ctx.beginPath();
      ctx.arc(x + w, y, 2.4, 0, 6.283);
      ctx.fill();
    }
    if (c.gap > 0.02) {
      ctx.strokeStyle = rgba(RED, c.gap);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 8 + 10 * (1 - c.gap), 0, 6.283);
      ctx.stroke();
    }
  }
  function drawApp() {
    const { x, y, w, h } = app;
    const dep = deployT >= 0,
      inner = w - 28;
    rr(x, y, w, h, 10);
    ctx.fillStyle = '#1B191E';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = dep ? rgba(AMB, 0.9) : rgba(INK, 0.16);
    ctx.stroke();
    ctx.fillStyle = rgba(INK, 1);
    ctx.fillText(fit('Your app', inner, 700, 14, SANS), x + 14, y + 24);
    ctx.fillStyle = dep ? rgba(AMB, 1) : rgba(MUTE, 1);
    const sub = dep
      ? `deploying v${ver}…`
      : mode === 'any'
      ? 'rails · fastapi · node'
      : '+ websocket server';
    ctx.fillText(fit(sub, inner, 400, 10.5, MONO), x + 14, y + 41);
    const n = 4,
      gap = 4,
      bw = (inner - gap * (n - 1)) / n,
      cur = dep ? Math.floor((deployT / DEP) * n) : -1;
    for (let i = 0; i < n; i++) {
      let col = rgba(INK, 0.22);
      if (dep && i === cur)
        col = rgba(AMB, 0.5 + 0.5 * Math.abs(Math.sin(clock * 9)));
      else if (dep && i < cur) col = rgba(OK, 0.75);
      rr(x + 14 + i * (bw + gap), y + 52, bw, 5, 2);
      ctx.fillStyle = col;
      ctx.fill();
    }
    const mem =
      mode === 'any'
        ? 0.2
        : Math.min(0.97, 0.15 + ((0.85 * onlineCount()) / N) * 1.15);
    ctx.fillStyle = rgba(MUTE, 1);
    ctx.fillText(fit('mem', 30, 400, 9.5, MONO), x + 14, y + h - 12);
    const mx = x + 46,
      mw = w - 60;
    rr(mx, y + h - 19, mw, 5, 2);
    ctx.fillStyle = rgba(INK, 0.1);
    ctx.fill();
    rr(mx, y + h - 19, Math.max(4, mw * mem), 5, 2);
    ctx.fillStyle = mem > 0.8 ? rgba(RED, 1) : rgba(INK, 0.55);
    ctx.fill();
  }
  function drawHub() {
    const hh = hubP.h,
      hw = hh * (80 / 102);
    const scale = 1 + 0.06 * kick;
    const bob = RM ? 0 : Math.sin(clock * 1.6) * 2.5;
    // The logo's cube body is centered at (40, 52) of its 80 x 102 box.
    const cx = hubP.x,
      cy = hubP.y + bob;
    const lx = cx - (hw * scale) / 2,
      ly = cy - hh * scale * (52 / 102);
    ctx.save();
    ctx.globalAlpha = 0.12 + 0.88 * hubMix;
    if (kick > 0.02 && hubMix > 0.5) {
      ctx.strokeStyle = rgba(RED, 0.45 * kick);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, hh * 0.62 + (1 - kick) * 26, 0, 6.283);
      ctx.stroke();
    }
    if (logo.complete && logo.naturalWidth)
      ctx.drawImage(logo, lx, ly, hw * scale, hh * scale);
    ctx.restore();

    // Name and live count under the logo, on a solid pill so traffic lines
    // never run through the text.
    const top = hubP.y + hh * (50 / 102) + 10;
    const maxW = narrow
      ? W - 40
      : Math.min(200, field.x - (app.x + app.w) - 16);
    const name = fit('AnyCable', maxW - 24, 700, 14, SANS);
    const nameFont = [ctx.font, ctx.fontStretch],
      nw = ctx.measureText(name).width;
    const sub = fit(
      hubMix > 0.5 ? `${fmt(onlineCount() * PER)} connections` : 'not in use',
      maxW - 24,
      400,
      10.5,
      MONO
    );
    const subFont = [ctx.font, ctx.fontStretch],
      sw = ctx.measureText(sub).width;
    const bw = Math.max(nw, sw) + 24;
    rr(cx - bw / 2, top, bw, 42, 8);
    ctx.fillStyle = rgba(BG, 0.92);
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = rgba(INK, 0.1);
    ctx.stroke();
    ctx.textAlign = 'center';
    [ctx.font, ctx.fontStretch] = nameFont;
    ctx.fillStyle = rgba(INK, hubMix > 0.5 ? 1 : 0.4);
    ctx.fillText(name, cx, top + 18);
    [ctx.font, ctx.fontStretch] = subFont;
    ctx.fillStyle = rgba(MUTE, 1);
    ctx.fillText(sub, cx, top + 33);

    if (history > 0 && hubMix > 0.5) {
      const label = fit(
        `${fmt(history * PER)} in history`,
        maxW - 30,
        600,
        10.5,
        MONO
      );
      const lw = ctx.measureText(label).width + 30;
      pill(cx - lw / 2, top + 50, lw, 22, rgba(RED, 0.16), rgba(RED, 0.55));
      ctx.fillStyle = rgba(RED, 1);
      ctx.beginPath();
      ctx.arc(cx - lw / 2 + 12, top + 61, 3, 0, 6.283);
      ctx.fill();
      ctx.fillStyle = '#FF8C84';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, cx - lw / 2 + 21, top + 61.5);
      ctx.textBaseline = 'alphabetic';
    }
    ctx.textAlign = 'left';
  }
  function draw() {
    ctx.fillStyle = `rgb(${BG})`;
    ctx.fillRect(0, 0, W, H);
    if (grid) ctx.drawImage(grid, 0, 0, W, H);
    const h = hub();
    const gr = ctx.createRadialGradient(
      h.x,
      h.y,
      0,
      h.x,
      h.y,
      Math.max(180, W * 0.26)
    );
    gr.addColorStop(0, rgba(RED, (0.15 + 0.1 * kick) * (0.35 + 0.65 * hubMix)));
    gr.addColorStop(1, rgba(RED, 0));
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = rgba(MUTE, 1);
    ctx.fillText(
      fit('Your users · 1 dot = 100 connections', field.w, 400, 10.5, MONO),
      field.x,
      field.y - 16
    );
    drawTunnel();
    ctx.lineWidth = 1;
    ctx.strokeStyle = rgba(INK, 0.05);
    ctx.beginPath();
    clients.forEach(c => {
      if (c.active && c.on) {
        ctx.moveTo(h.x, h.y);
        ctx.lineTo(c.x, c.y);
      }
    });
    ctx.stroke();
    if (hubMix > 0.02) {
      const o = appOut();
      ctx.save();
      ctx.globalAlpha = hubMix;
      ctx.strokeStyle = rgba(RED, 0.65);
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = RM ? 0 : -clock * 30;
      ctx.beginPath();
      ctx.moveTo(o.x, o.y);
      ctx.lineTo(hubP.x, hubP.y);
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    pulses.forEach(p => {
      if (p.delay > 0) return;
      const t = Math.min(1, p.t),
        ta = Math.max(0, t - 0.18),
        a = at(p, t),
        b = at(p, ta);
      const col =
        p.kind === 'replay' ? OK : p.kind === 'doomed' ? RED : '255,128,112';
      const lg = ctx.createLinearGradient(b[0], b[1], a[0], a[1]);
      lg.addColorStop(0, rgba(col, 0));
      lg.addColorStop(1, rgba(col, 0.95));
      ctx.strokeStyle = lg;
      ctx.lineWidth = p.kind === 'up' ? 3 : 1.8;
      ctx.beginPath();
      ctx.moveTo(b[0], b[1]);
      for (let s = 1; s <= 4; s++) {
        const pt = at(p, ta + ((t - ta) * s) / 4);
        ctx.lineTo(pt[0], pt[1]);
      }
      ctx.stroke();
      ctx.fillStyle = rgba(col, 0.22);
      ctx.beginPath();
      ctx.arc(a[0], a[1], p.kind === 'up' ? 8 : 5.5, 0, 6.283);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      ctx.arc(a[0], a[1], p.kind === 'up' ? 2.6 : 1.7, 0, 6.283);
      ctx.fill();
    });
    ctx.restore();
    clients.forEach(drawClient);
    drops.forEach(d => {
      ctx.strokeStyle = rgba(RED, Math.max(0, d.life));
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(d.x - 3, d.y - 3);
      ctx.lineTo(d.x + 3, d.y + 3);
      ctx.moveTo(d.x + 3, d.y - 3);
      ctx.lineTo(d.x - 3, d.y + 3);
      ctx.stroke();
    });
    drawTunnelLabel();
    drawApp();
    drawHub();
  }

  // The tally and the running-scenario state on the buttons
  const tally = {
    delivered: q('delivered'),
    replayed: q('replayed'),
    lost: q('lost'),
  };
  const buttons = {
    tunnel: q('tunnel'),
    deploy: q('deploy'),
    spike: q('spike'),
  };
  let tallyT = 0;
  function updateHud(dt) {
    [
      [buttons.tunnel, tunnelT, TUN],
      [buttons.deploy, deployT, DEP],
      [buttons.spike, spikeT, SPK],
    ].forEach(([b, t, d]) => {
      if (t >= 0) {
        b.setAttribute('data-running', '');
        b.style.setProperty('--p', (t / d).toFixed(3));
      } else if (b.hasAttribute('data-running'))
        b.removeAttribute('data-running');
    });
    tallyT += dt;
    if (tallyT < 0.2) return;
    tallyT = 0;
    tally.delivered.textContent = fmt(stats.delivered);
    tally.replayed.textContent = fmt(stats.replayed);
    tally.lost.textContent = fmt(stats.lost);
    tally.lost.parentNode.classList.toggle(
      'live-map__tally-item_bad',
      stats.lost > 0
    );
  }

  // Wiring
  const on = (name, fn) =>
    q(name).addEventListener('click', () => {
      takeOver();
      fn();
    });
  on('tunnel', startTunnel);
  on('deploy', startDeploy);
  on('spike', startSpike);
  on('mode-any', () => setMode('any'));
  on('mode-ws', () => setMode('ws'));

  if (window.ResizeObserver) new ResizeObserver(layout).observe(cv);
  else window.addEventListener('resize', layout);
  layout();
  log(
    `Simulated traffic: your app broadcasts to ${fmt(
      onlineCount() * PER
    )} connections.`,
    ''
  );

  let visible = true,
    running = false,
    last = 0;
  function frame(now) {
    if (!visible) {
      running = false;
      return;
    }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    updateHud(dt);
    requestAnimationFrame(frame);
  }
  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }
  if (window.IntersectionObserver) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) start();
    }).observe(root);
  }
  start();
}
