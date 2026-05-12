const EFFECTS = {
  note: [
    { freq: 360, duration: 0.09, gain: 0.11, type: "triangle", delay: 0 },
  ],
  place: [
    { freq: 420, duration: 0.12, gain: 0.13, type: "sine", delay: 0 },
    { freq: 620, duration: 0.1, gain: 0.08, type: "triangle", delay: 0.025 },
  ],
  erase: [
    { freq: 250, duration: 0.11, gain: 0.1, type: "triangle", delay: 0 },
  ],
  undo: [
    { freq: 310, duration: 0.08, gain: 0.09, type: "sine", delay: 0 },
  ],
  redo: [
    { freq: 380, duration: 0.08, gain: 0.09, type: "sine", delay: 0 },
  ],
  reject: [
    { freq: 180, duration: 0.14, gain: 0.11, type: "triangle", delay: 0 },
  ],
  complete: [
    { freq: 392, duration: 0.16, gain: 0.11, type: "sine", delay: 0 },
    { freq: 523.25, duration: 0.18, gain: 0.1, type: "sine", delay: 0.08 },
    { freq: 659.25, duration: 0.22, gain: 0.11, type: "triangle", delay: 0.16 },
  ],
};

let audioContext = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext ||= new AudioContextClass();
  if (audioContext.state === "suspended") void audioContext.resume();
  return audioContext;
}

function playTone(context, note, volume) {
  const now = context.currentTime + note.delay;
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const peak = Math.max(0.0001, note.gain * volume);

  oscillator.type = note.type;
  oscillator.frequency.setValueAtTime(note.freq, now);

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(peak, now + 0.012);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + note.duration);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + note.duration + 0.02);
}

export function playGameSound(kind, volume = 0.75) {
  const notes = EFFECTS[kind];
  const cleanVolume = Math.max(0, Math.min(1, Number(volume) || 0));
  if (!notes || cleanVolume <= 0) return;

  const context = getAudioContext();
  if (!context) return;
  notes.forEach((note) => playTone(context, note, cleanVolume));
}
