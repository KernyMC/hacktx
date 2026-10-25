let ctx: AudioContext | null = null;

// Created on first use: browsers only allow audio after a user gesture.
function audio() {
  ctx ??= new AudioContext();
  return ctx;
}

// Two-step square-wave blip, the classic chiptune "boop".
export function boop(pitch = 660) {
  const a = audio();
  const t = a.currentTime;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(pitch, t);
  osc.frequency.setValueAtTime(pitch * 1.5, t + 0.06);
  gain.gain.setValueAtTime(0.08, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + 0.2);
}
