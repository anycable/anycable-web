// The live map's model: client devices, messages in flight, and the three
// scenarios. One scenario runs at a time. Drawing lives in draw.js.

import { appOut } from './layout.js';

export const PER = 100; // connections per dot
const N = 100; // dots: 10,000 connections

// The bottom 40% of the field is the subway that loses signal.
export const TUNNEL_TOP = 0.6;
const inTunnel = c => c.v > TUNNEL_TOP;

const TUNNEL_S = 4.5;
const DEPLOY_S = 3.6;
// In-process deploys: clients start reconnecting this far into the deploy,
// spread over RECONNECT_SPREAD_S.
const DEPLOY_RECONNECT_AT = 0.55;
const DEPLOY_RECONNECT_SPREAD_S = 0.55;
// Reconnect storm. Both servers face the same first wave, which starts
// FIRST_WAVE_S after the drop. The in-process server crashes at CRASH_AT[i]
// and stays down for DOWN_S; clients retry in waves that spread wider as their
// backoff grows (WAVE_S).
const STORM_S = { any: 5, ws: 10.5 };
const FIRST_WAVE_S = 0.35;
const CRASH_AT = [1.7, 4.9];
const DOWN_S = 1.5;
const WAVE_S = [0.8, 0.9, 2.8];
const RETRY_S = { after: 0.5, spread: 1.2 }; // a refused client's next try
const APP_LOAD_PER_CONNECT = 0.012; // each connect call runs auth and a query
const HUB_LOAD_PER_RESTORE = 0.0085;
// Reconnects per second are counted over this sliding window.
export const RATE_WINDOW_S = 0.5;
const BROADCASTS_PER_S = { normal: 6, reducedMotion: 3 };
// A message to a dropped in-process connection dies this far along its path.
const DOOMED_AT = 0.62;

export const fmt = n => Math.round(n).toLocaleString('en-US');

// Device positions: an R2 low-discrepancy sequence spreads them evenly in
// any aspect ratio. A fixed shuffle gives each one its place in the order
// in which in-process clients reconnect after a deploy.
function makeClients() {
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const rank = Array.from({ length: N }, (_, i) => i);
  for (let i = N - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [rank[i], rank[j]] = [rank[j], rank[i]];
  }
  return rank.map((r, i) => {
    const order = (r + 0.5) / N;
    return {
      u: 0.03 + 0.94 * ((0.5 + 0.754877666 * (i + 1)) % 1),
      v: 0.04 + 0.92 * ((0.5 + 0.569840291 * (i + 1)) % 1),
      kind: random() < 0.62 ? 'phone' : 'laptop',
      order,
      x: 0,
      y: 0,
      on: true,
      flash: 0,
      tone: 'ok', // flash colour: ok for a message, amber for a restored session
      queue: 0, // messages waiting in stream history for this client
      gap: 0, // fading ring: this client reconnected with nothing to replay
      rx: 0, // fading cross: a refused connection attempt
      back: -1, // in-process deploy: when this client reconnects
      inStorm: false,
      rcAt: -1, // storm time of the next reconnect attempt
    };
  });
}

// A point on a message's quadratic path, t from 0 to 1.
export function pointOnPulse(p, t) {
  const a = 1 - t;
  return [
    a * a * p.x0 + 2 * a * t * p.cx + t * t * p.x1,
    a * a * p.y0 + 2 * a * t * p.cy + t * t * p.y1,
  ];
}

export function createSim({ log, reducedMotion }) {
  const clients = makeClients();
  const sim = {
    mode: 'any', // 'any' for AnyCable, 'ws' for in-process WebSockets
    clients,
    pulses: [],
    drops: [],
    history: 0, // messages waiting in stream history
    stats: { delivered: 0, replayed: 0, lost: 0 },
    running: null, // the scenario in progress: { name, t, duration, lost, ... }
    geo: null,
    clock: 0,
    hubMix: 1, // eases to 1 with AnyCable in the path, to 0 without it
    kick: 0, // the hub's pulse as a broadcast reaches it
    tunnelFade: 0,
    ver: 412,
    appDown: -1, // seconds until the crashed app is back
    appLoad: 0,
    hubLoad: 0,
    rcTimes: [], // clock times of recent reconnects
  };
  let due = 0; // broadcasts owed to the clock

  const onlineCount = () => clients.reduce((n, c) => n + (c.on ? 1 : 0), 0);
  const elapsed = name => (sim.running?.name === name ? sim.running.t : -1);

  // Messages
  function addPulse(p) {
    const bend = p.bend || 0;
    p.cx = (p.x0 + p.x1) / 2 - (p.y1 - p.y0) * bend;
    p.cy = (p.y0 + p.y1) / 2 + (p.x1 - p.x0) * bend;
    p.t = 0;
    p.delay = p.delay || 0;
    sim.pulses.push(p);
  }
  const randomBend = () => (Math.random() - 0.5) * 0.3;
  function sendTo(c, from, kind, delay = 0) {
    const dur =
      kind === 'replay'
        ? 0.36 + Math.random() * 0.2
        : 0.5 + Math.random() * 0.35;
    addPulse({
      kind,
      target: c,
      x0: from.x,
      y0: from.y,
      x1: c.x,
      y1: c.y,
      dur,
      bend: randomBend(),
      delay,
    });
  }
  function broadcast() {
    if (sim.mode === 'ws' && sim.appDown >= 0) return; // the app is down
    const count = 3 + Math.floor(Math.random() * 6);
    const targets = Array.from(
      { length: count },
      () => clients[Math.floor(Math.random() * clients.length)]
    );
    const o = appOut(sim.geo);
    if (sim.mode === 'ws') {
      targets.forEach(t => sendTo(t, o, t.on ? 'out' : 'doomed'));
      return;
    }
    const { hub } = sim.geo;
    addPulse({
      kind: 'up',
      targets,
      x0: o.x,
      y0: o.y,
      x1: hub.x,
      y1: hub.y,
      dur: 0.3,
    });
  }
  function lose(x, y) {
    sim.stats.lost += PER;
    if (sim.running) sim.running.lost += PER;
    sim.drops.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 40,
      vy: -25 - Math.random() * 30,
      life: 1,
    });
  }
  function keepInHistory(c) {
    c.queue++;
    sim.history++;
  }
  function arrive(p) {
    const c = p.target;
    switch (p.kind) {
      case 'up':
        sim.kick = 1;
        p.targets.forEach(t => (t.on ? sendTo(t, sim.geo.hub, 'out') : keepInHistory(t)));
        break;
      case 'out':
        if (c.on) {
          c.flash = 1;
          c.tone = 'ok';
          sim.stats.delivered += PER;
        } else if (sim.mode === 'any') keepInHistory(c);
        else lose(p.x1, p.y1);
        break;
      case 'replay':
        c.flash = 1;
        c.tone = 'ok';
        sim.stats.delivered += PER;
        sim.stats.replayed += PER;
        break;
      case 'rc':
        reconnect(c);
        break;
    }
  }
  // Sends a returning client's missed messages from stream history. Message k
  // leaves at start + k * stagger, plus up to `jitter` seconds.
  function replayQueue(c, { stagger, start = 0, jitter = 0.2 }) {
    for (let k = 0; k < c.queue; k++)
      sendTo(c, sim.geo.hub, 'replay', start + stagger * k + Math.random() * jitter);
    const n = c.queue;
    c.queue = 0;
    return n;
  }
  // A reconnect attempt reaches the server during a storm.
  function reconnect(c) {
    const storm = sim.running?.name === 'storm' ? sim.running : null;
    if (!storm || c.on) return; // the storm already ended
    if (sim.mode === 'ws') {
      if (sim.appDown >= 0) {
        c.rx = 1; // refused: the app is down
        if (c.rcAt < 0)
          c.rcAt = storm.t + RETRY_S.after + Math.random() * RETRY_S.spread;
        return;
      }
      // Every reconnect runs the app's connect code: auth, a database query.
      storm.calls++;
      sim.appLoad = Math.min(1, sim.appLoad + APP_LOAD_PER_CONNECT);
      c.on = true;
      c.gap = 1;
    } else {
      // AnyCable restores the session from its cache, with no call to the app.
      sim.hubLoad = Math.min(1, sim.hubLoad + HUB_LOAD_PER_RESTORE);
      c.on = true;
      c.flash = 1;
      c.tone = 'amber';
      storm.replayed += replayQueue(c, { stagger: 0.06 });
    }
    sim.rcTimes.push(sim.clock);
    storm.last = storm.t;
  }

  // Scenarios. Each one gets a run object ({ name, t, duration, lost }) that
  // it can add its own counters to; tick runs every frame while it lasts.
  const scenarios = {
    tunnel: {
      duration: () => TUNNEL_S,
      start() {
        let n = 0;
        for (const c of clients) {
          if (!inTunnel(c)) continue;
          c.on = false;
          n++;
        }
        log(`Subway: ${fmt(n * PER)} connections lose signal.`, 'bad');
      },
      end(run) {
        let replayed = 0;
        for (const c of clients) {
          if (!inTunnel(c)) continue;
          c.on = true;
          if (sim.mode === 'ws') c.gap = 1;
          else
            replayed += replayQueue(c, {
              stagger: 0.04,
              start: 0.04 * replayed,
              jitter: 0.25,
            });
        }
        if (sim.mode === 'ws')
          log(
            `Signal back: ${fmt(run.lost)} messages lost, with no history to replay.`,
            'bad'
          );
        else
          log(
            `Signal back: ${fmt(replayed * PER)} missed messages replayed from stream history, in order.`,
            'ok'
          );
      },
    },

    deploy: {
      duration: () => DEPLOY_S,
      start(run) {
        sim.ver++;
        run.reconnected = 0;
        if (sim.mode === 'any') {
          log(
            `Deploy v${sim.ver}: the app restarts, AnyCable keeps ${fmt(onlineCount() * PER)} connections open.`,
            'ok'
          );
          return;
        }
        let n = 0;
        for (const c of clients) {
          if (!c.on) continue;
          c.on = false;
          c.back =
            DEPLOY_S * DEPLOY_RECONNECT_AT + c.order * DEPLOY_RECONNECT_SPREAD_S;
          n++;
        }
        log(
          `Deploy v${sim.ver}: the app restarts and drops all ${fmt(n * PER)} connections.`,
          'bad'
        );
      },
      tick(run) {
        for (const c of clients) {
          if (c.back < 0 || run.t < c.back) continue;
          c.back = -1;
          c.on = true;
          c.gap = 1;
          run.reconnected++;
        }
      },
      end(run) {
        for (const c of clients) {
          if (c.back < 0) continue;
          c.back = -1;
          c.on = true;
        }
        if (sim.mode === 'ws')
          log(
            `Deploy done: ${fmt(run.lost)} messages lost, ${fmt(run.reconnected * PER)} clients reconnected at once.`,
            'bad'
          );
        else log('Deploy done: 0 connections dropped, 0 messages lost.', 'ok');
      },
    },

    storm: {
      duration: mode => STORM_S[mode],
      start(run) {
        Object.assign(run, {
          total: 0,
          calls: 0,
          replayed: 0,
          last: 0,
          crashes: 0,
          noted: false,
        });
        sim.rcTimes.length = 0;
        for (const c of clients) {
          if (!c.on) continue;
          c.on = false;
          c.inStorm = true;
          c.rcAt = FIRST_WAVE_S + Math.random() * WAVE_S[0];
          run.total++;
        }
        log(
          `Load balancer restart: ${fmt(run.total * PER)} connections drop and reconnect at once.`,
          'bad'
        );
      },
      tick(run, dt) {
        sendDueReconnects(run);
        if (sim.mode === 'any') {
          if (!run.noted && run.t >= 1) {
            run.noted = true;
            log(
              'AnyCable restores each session from its cache: no auth calls reach your app.',
              'ok'
            );
          }
          return;
        }
        if (run.crashes < CRASH_AT.length && run.t >= CRASH_AT[run.crashes])
          crash(run);
        recover(run, dt);
      },
      end(run) {
        for (const c of clients) {
          if (!c.inStorm) continue;
          c.inStorm = false;
          c.rcAt = -1;
          if (c.on) continue;
          c.on = true;
          if (sim.mode === 'any')
            run.replayed += replayQueue(c, { stagger: 0.06 });
        }
        if (sim.mode === 'ws')
          log(
            `Back after ${run.crashes} crashes, ${run.last.toFixed(1)} s: ${fmt(run.lost)} messages lost, ${fmt(run.calls * PER)} connect calls.`,
            'bad'
          );
        else
          log(
            `Storm absorbed: ${fmt(run.total * PER)} sessions back in ${(run.last - FIRST_WAVE_S).toFixed(1)} s, 0 calls to your app, ${fmt(run.replayed * PER)} missed messages replayed.`,
            'ok'
          );
      },
    },

  };

  // Storm helpers
  function sendDueReconnects(run) {
    const server = sim.mode === 'any' ? sim.geo.hub : appOut(sim.geo);
    for (const c of clients) {
      if (c.rcAt < 0 || run.t < c.rcAt) continue;
      c.rcAt = -1;
      if (c.on) continue;
      addPulse({
        kind: 'rc',
        target: c,
        x0: c.x,
        y0: c.y,
        x1: server.x,
        y1: server.y,
        dur: 0.4 + Math.random() * 0.3,
        bend: randomBend(),
      });
    }
  }
  function crash(run) {
    run.crashes++;
    sim.appDown = DOWN_S;
    sim.appLoad = 1;
    const up = run.t + DOWN_S;
    for (const c of clients) {
      if (!c.inStorm) continue;
      c.on = false;
      c.rcAt = up + 0.15 + Math.random() * WAVE_S[run.crashes];
    }
    log(
      run.crashes === 1
        ? 'Out of memory: your app crashes, and your pages go down with it.'
        : `Crashed again: ${fmt(run.total * PER)} clients retried at the same moment.`,
      'bad'
    );
  }
  function recover(run, dt) {
    if (sim.appDown < 0) return;
    sim.appDown -= dt;
    if (sim.appDown > 0) return;
    sim.appDown = -1;
    sim.appLoad = 0.15;
    log(
      run.crashes === 1
        ? 'App restarted. Every client retries at the same moment.'
        : 'App restarted again. Clients have backed off longer this time.',
      'bad'
    );
  }

  // Controls
  function start(name) {
    if (sim.running) return false;
    const scenario = scenarios[name];
    sim.running = { name, t: 0, duration: scenario.duration(sim.mode), lost: 0 };
    scenario.start(sim.running);
    return true;
  }
  function setMode(mode) {
    if (mode === sim.mode) return false;
    Object.assign(sim, {
      mode,
      running: null,
      appDown: -1,
      appLoad: 0,
      hubLoad: 0,
      history: 0,
      stats: { delivered: 0, replayed: 0, lost: 0 },
    });
    sim.rcTimes.length = 0;
    sim.pulses.length = 0;
    sim.drops.length = 0;
    for (const c of clients)
      Object.assign(c, {
        on: true,
        queue: 0,
        back: -1,
        inStorm: false,
        rcAt: -1,
        rx: 0,
      });
    log(
      mode === 'any'
        ? 'AnyCable: connections live in a separate Go server.'
        : 'In-process WebSockets: connections live inside your app.',
      ''
    );
    return true;
  }
  function setLayout(geo) {
    sim.geo = geo;
    for (const c of clients) {
      c.x = geo.field.x + c.u * geo.field.w;
      c.y = geo.field.y + c.v * geo.field.h;
    }
    sim.pulses.length = 0;
    sim.drops.length = 0;
  }
  // Where the hub is drawn: AnyCable's position, or the app's edge when the
  // in-process server has no hub in between.
  function hubPos() {
    const o = appOut(sim.geo);
    const { hub } = sim.geo;
    return {
      x: o.x + (hub.x - o.x) * sim.hubMix,
      y: o.y + (hub.y - o.y) * sim.hubMix,
    };
  }

  // Frame update
  const ease = (from, to, rate, dt) => from + (to - from) * Math.min(1, dt * rate);
  function tickScenario(dt) {
    const run = sim.running;
    if (!run) return;
    const scenario = scenarios[run.name];
    run.t += dt;
    scenario.tick?.(run, dt);
    if (run.t < run.duration) return;
    scenario.end(run);
    sim.running = null;
  }
  function tickClients(dt) {
    for (const c of clients) {
      c.flash = Math.max(0, c.flash - dt * 2.2);
      c.gap = Math.max(0, c.gap - dt * 0.8);
      c.rx = Math.max(0, c.rx - dt * 0.6);
    }
  }
  function tickPulses(dt) {
    for (let i = sim.pulses.length - 1; i >= 0; i--) {
      const p = sim.pulses[i];
      if (p.delay > 0) {
        p.delay -= dt;
        continue;
      }
      if (!p.started) {
        p.started = true;
        if (p.kind === 'replay') sim.history = Math.max(0, sim.history - 1);
      }
      p.t += dt / p.dur;
      if (p.kind === 'doomed' && p.t >= DOOMED_AT) {
        lose(...pointOnPulse(p, DOOMED_AT));
        sim.pulses.splice(i, 1);
      } else if (p.t >= 1) {
        sim.pulses.splice(i, 1);
        arrive(p);
      }
    }
  }
  function tickDrops(dt) {
    for (let i = sim.drops.length - 1; i >= 0; i--) {
      const d = sim.drops[i];
      d.vy += 140 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.life -= dt * 0.9;
      if (d.life <= 0) sim.drops.splice(i, 1);
    }
  }
  function update(dt) {
    sim.clock += dt;
    sim.hubMix = ease(sim.hubMix, sim.mode === 'any' ? 1 : 0, 3, dt);
    sim.kick = Math.max(0, sim.kick - dt * 3);
    sim.tunnelFade = ease(sim.tunnelFade, elapsed('tunnel') >= 0 ? 1 : 0, 5, dt);
    tickScenario(dt);
    sim.appLoad = Math.max(0, sim.appLoad - sim.appLoad * 0.45 * dt);
    sim.hubLoad = Math.max(0, sim.hubLoad - sim.hubLoad * 1.2 * dt);
    while (sim.rcTimes.length && sim.clock - sim.rcTimes[0] > RATE_WINDOW_S)
      sim.rcTimes.shift();
    tickClients(dt);
    const rate = reducedMotion
      ? BROADCASTS_PER_S.reducedMotion
      : BROADCASTS_PER_S.normal;
    due += dt * rate;
    for (; due >= 1; due--) broadcast();
    tickPulses(dt);
    tickDrops(dt);
  }

  return Object.assign(sim, {
    start,
    setMode,
    setLayout,
    update,
    hubPos,
    onlineCount,
  });
}
