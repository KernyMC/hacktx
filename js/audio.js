/* =====================================================================
   Familiars — chiptune SFX (WebAudio, zero asset files)
   All sounds are synthesized square/triangle waves so the build has no
   binary dependencies. Browsers only allow audio after a user gesture,
   so Audio.unlock() is called from the first tap.
   ===================================================================== */
(function (global) {
  'use strict';
  let ctx = null;
  let enabled = true;

  function unlock() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  }

  function setEnabled(v) { enabled = !!v; }
  function isEnabled() { return enabled; }

  // one note: freq in Hz, start offset (s), duration (s)
  function note(freq, at, dur, type = 'square', vol = 0.08, slide = 0) {
    if (!ctx || !enabled) return;
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  // short white-noise burst (crack / hit)
  function noise(at, dur, vol = 0.1) {
    if (!ctx || !enabled) return;
    const t = ctx.currentTime + at;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain(); g.gain.value = vol;
    src.connect(g).connect(ctx.destination); src.start(t);
  }

  const SFX = {
    tap()      { note(880, 0, 0.06, 'square', 0.05, 300); },
    squeak()   { note(1200, 0, 0.08, 'square', 0.06, 500); note(1500, 0.08, 0.1, 'square', 0.05, -300); },
    open()     { note(523, 0, 0.06); note(784, 0.06, 0.08); },
    close()    { note(784, 0, 0.06); note(523, 0.06, 0.08); },
    accept()   { note(659, 0, 0.08); note(880, 0.09, 0.12); },
    xp()       { note(1047, 0, 0.04, 'square', 0.04); },
    reward()   { [523, 659, 784, 1047].forEach((f, i) => note(f, i * 0.09, 0.14)); note(1319, 0.38, 0.3, 'square', 0.07); },
    legendary(){ [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => note(f, i * 0.08, 0.2, 'square', 0.07));
                 [784, 1047, 1319].forEach((f, i) => note(f, 0.55 + i * 0.12, 0.4, 'triangle', 0.08)); },
    crack()    { noise(0, 0.08, 0.12); note(200, 0, 0.08, 'square', 0.05, -100); },
    hatch()    { note(392, 0, 0.1); note(523, 0.1, 0.1); note(659, 0.2, 0.1); note(784, 0.3, 0.35, 'triangle', 0.09); },
    evolve()   { for (let i = 0; i < 12; i++) note(300 + i * 90, i * 0.05, 0.08, 'square', 0.05);
                 [784, 988, 1175, 1568].forEach((f, i) => note(f, 0.65 + i * 0.1, 0.35, 'triangle', 0.09)); },
    curse()    { note(400, 0, 0.18, 'square', 0.07, -150); note(300, 0.18, 0.25, 'square', 0.07, -120); },
    bless()    { note(1047, 0, 0.08, 'triangle', 0.08); note(1319, 0.08, 0.08, 'triangle', 0.08); note(1568, 0.16, 0.2, 'triangle', 0.08); },
    hit()      { noise(0, 0.1, 0.15); note(120, 0, 0.12, 'square', 0.08, -60); },
    error()    { note(220, 0, 0.12, 'square', 0.06); note(180, 0.12, 0.2, 'square', 0.06); },
    tick()     { note(1600, 0, 0.02, 'square', 0.02); },
  };

  // ------------------------------------------------------------------
  // Species cries: every animal has its own little voice.
  // Each entry: [freq, duration, wave, slide] notes played back to back; 'noise' = breath/huff burst.
  // ------------------------------------------------------------------
  const CRIES = {
    axolotl:    [[700, .08, 'sine', 200], [900, .1, 'sine', -120]],
    cat:        [[600, .16, 'square', 260], [820, .22, 'square', -320]],
    dog:        ['noise', [300, .08, 'square', -120], [270, .1, 'square', -90]],
    bunny:      [[1400, .05, 'triangle', 300], [1200, .06, 'triangle', -220]],
    chick:      [[2000, .06, 'square', 400], [2200, .06, 'square', -300], [2100, .07, 'square', 200]],
    hamster:    [[1500, .05, 'square', 220], [1600, .05, 'square', -200]],
    frog:       [[180, .12, 'sawtooth', -40], [230, .16, 'sawtooth', 70]],
    mouse:      [[2400, .06, 'square', 700], [2200, .05, 'square', -400]],
    duckling:   [[500, .1, 'sawtooth', -160], [460, .12, 'sawtooth', -110]],
    pig:        [[250, .08, 'sawtooth', 220], [330, .11, 'sawtooth', -170]],
    sheep:      [[330, .15, 'sawtooth', 12], [342, .22, 'sawtooth', -14]],
    hedgehog:   ['noise', [400, .06, 'square', -120]],
    squirrel:   [[1800, .04, 'square', 0], [1700, .04, 'square', 0], [1800, .04, 'square', 0], [1600, .05, 'square', -200]],
    turtle:     [[260, .26, 'sine', -70]],
    prairiedog: [[1200, .07, 'square', 450], [1500, .05, 'square', -250]],
    goat:       [[420, .12, 'sawtooth', 40], [400, .2, 'sawtooth', -70]],
    redpanda:   [[900, .08, 'triangle', 300], [700, .1, 'triangle', -220]],
    penguin:    [[380, .12, 'square', -80], [430, .14, 'square', -70]],
    fennec:     [[1300, .06, 'square', 520], [1100, .08, 'square', -320]],
    otter:      [[1000, .06, 'sine', 400], [1200, .06, 'sine', 200], [900, .08, 'sine', -200]],
    raccoon:    [[800, .05, 'triangle', 120], [900, .05, 'triangle', -120], [800, .05, 'triangle', 120], [700, .06, 'triangle', -100]],
    capybara:   [[200, .08, 'square', 0], [212, .08, 'square', 0], [190, .1, 'square', -20]],
    owl:        [[440, .18, 'sine', -20], [392, .26, 'sine', -24]],
    roadrunner: [[1200, .08, 'square', 0], [0, .06], [1200, .08, 'square', 0]],
    armadillo:  [[240, .1, 'sawtooth', -60], ['noise']],
    snowleopard:['noise', [300, .1, 'triangle', -50], [280, .1, 'triangle', -40]],
    chameleon:  [[600, .12, 'sine', 900]],
    bat:        [[3000, .08, 'square', -800], [2600, .08, 'square', -600]],
    jackalope:  [[1300, .06, 'triangle', 300], [120, .1, 'square', -40]],
    longhorn:   [[180, .25, 'sawtooth', 40], [200, .36, 'sawtooth', -60]],
  };
  function cry(species) {
    unlock();
    const seq = CRIES[species] || CRIES.axolotl;
    let at = 0;
    seq.forEach(step => {
      if (step === 'noise' || step[0] === 'noise') { noise(at, 0.07, 0.08); at += 0.06; return; }
      const [f, d, w, s] = step;
      if (f) note(f, at, d, w || 'square', 0.07, s || 0);
      at += d;
    });
  }

  function play(name) { unlock(); (SFX[name] || SFX.tap)(); }

  global.Audio8 = { play, cry, unlock, setEnabled, isEnabled, CRIES };
})(window);
