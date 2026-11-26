// Hero illustration: a live map of connections.
//
// Your app broadcasts through the AnyCable server (drawn with the real AnyCable
// logo) to a field of client devices; one dot stands for 100 connections.
// Three scenarios show what the delivery guarantees mean in practice: an
// unreliable network (missed messages wait in stream history and replay on
// reconnect), an app deploy (connections stay open) and a reconnect storm
// (every client reconnects at once; AnyCable restores sessions from its cache
// without calling the app). A switch replays the same events on an in-process WebSocket
// server, where messages are lost and the storm crashes the app until clients
// back off far enough for it to recover.
//
// The traffic is simulated (sim.js) and drawn on a canvas (draw.js). A short
// script plays on its own until the visitor presses a button. Rendering pauses
// while the hero is off screen, and with reduced motion the script does not
// autoplay.

import { readTheme } from './theme.js';
import { logoForDarkPanel } from './logo.js';
import { computeLayout } from './layout.js';
import { createSim, PER, fmt } from './sim.js';
import { createRenderer } from './draw.js';

const SCENARIOS = ['tunnel', 'deploy', 'storm'];
// Autoplay: [seconds into the loop, scenario name or mode switch]
const SCRIPT = [
  [2, 'tunnel'],
  [8, 'deploy'],
  [13, 'storm'],
  [20, { mode: 'ws' }],
  [22, 'tunnel'],
  [28, 'deploy'],
  [33, 'storm'],
  [45.5, { mode: 'any' }],
];
const LOOP_S = 47.5;
const MAX_FRAME_S = 0.05;
const TALLY_EVERY_S = 0.2;

const root = document.querySelector("[data-controller='live-map']");
if (root) initLiveMap(root);

function initLiveMap(root) {
  const q = name => root.querySelector(`[data-live-map-target='${name}']`);
  const canvas = q('canvas');
  const ctx = canvas.getContext('2d');
  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  const t0 = Date.now();
  const pad = n => String(n).padStart(2, '0');

  function log(message, tone) {
    const s = Math.floor((Date.now() - t0) / 1000);
    const line = document.createElement('div');
    line.className = 'live-map__log-line';
    if (tone) line.classList.add(`live-map__log-line_${tone}`);
    const time = document.createElement('span');
    time.className = 'live-map__log-time';
    time.textContent = `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
    const text = document.createElement('span');
    text.textContent = message;
    line.append(time, text);
    q('log').replaceChildren(line);
  }

  const sim = createSim({ log, reducedMotion });
  const renderer = createRenderer(ctx, sim, {
    theme: readTheme(root),
    logo: logoForDarkPanel(),
    reducedMotion,
  });

  // live-map.scss sets --live-map-layout to "stacked" on narrow panels.
  function layout() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const stacked =
      getComputedStyle(canvas).getPropertyValue('--live-map-layout').trim() ===
      'stacked';
    sim.setLayout(computeLayout(width, height, stacked));
    renderer.resize(width, height, dpr);
  }

  function setMode(mode) {
    if (!sim.setMode(mode)) return;
    q('mode-any').setAttribute('aria-pressed', String(mode === 'any'));
    q('mode-ws').setAttribute('aria-pressed', String(mode === 'ws'));
  }

  // Autoplay, until the visitor takes over
  let auto = !reducedMotion;
  let autoT = 0;
  let autoIdx = 0;
  function play(dt) {
    autoT += dt;
    while (autoIdx < SCRIPT.length && autoT >= SCRIPT[autoIdx][0]) {
      const step = SCRIPT[autoIdx][1];
      if (step.mode) setMode(step.mode);
      else sim.start(step);
      autoIdx++;
    }
    if (autoT < LOOP_S) return;
    autoT = 0;
    autoIdx = 0;
  }
  function takeOver() {
    if (!auto) return;
    auto = false;
    q('log').setAttribute('aria-live', 'polite'); // quiet during autoplay
  }

  // The tally, and the running scenario's progress on its button. One
  // scenario runs at a time: the other buttons wait until it ends.
  const tally = {
    delivered: q('delivered'),
    replayed: q('replayed'),
    lost: q('lost'),
  };
  let tallyT = 0;
  function updateHud(dt) {
    const run = sim.running;
    for (const name of SCENARIOS) {
      const button = q(name);
      const mine = run?.name === name;
      button.disabled = Boolean(run) && !mine;
      button.toggleAttribute('data-running', mine);
      if (mine) button.style.setProperty('--p', (run.t / run.duration).toFixed(3));
    }
    tallyT += dt;
    if (tallyT < TALLY_EVERY_S) return;
    tallyT = 0;
    for (const key of Object.keys(tally))
      tally[key].textContent = fmt(sim.stats[key]);
    tally.lost.parentNode.classList.toggle(
      'live-map__tally-item_bad',
      sim.stats.lost > 0
    );
  }

  // Wiring
  const on = (name, action) =>
    q(name).addEventListener('click', () => {
      takeOver();
      action();
    });
  for (const name of SCENARIOS) on(name, () => sim.start(name));
  on('mode-any', () => setMode('any'));
  on('mode-ws', () => setMode('ws'));

  new ResizeObserver(layout).observe(canvas);
  layout();
  log(
    `Simulated traffic: your app broadcasts to ${fmt(sim.onlineCount() * PER)} connections.`,
    ''
  );

  let visible = true;
  let looping = false;
  let last = 0;
  function frame(now) {
    if (!visible) {
      looping = false;
      return;
    }
    const dt = Math.min(MAX_FRAME_S, (now - last) / 1000);
    last = now;
    if (sim.geo) {
      if (auto) play(dt);
      sim.update(dt);
      renderer.draw();
    }
    updateHud(dt);
    requestAnimationFrame(frame);
  }
  function start() {
    if (looping) return;
    looping = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
  }).observe(root);
  start();
}
