// Create a shared AudioContext (lazy, user-gesture initialized)
let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function closeAudioContext() {
  if (audioCtx) {
    audioCtx.close();
    audioCtx = null;
  }
}

// Visibility change handler to pause audio when tab is hidden
export function onVisibilityChange(onHidden: () => void, onVisible: () => void) {
  if (typeof document === 'undefined') return () => {};
  const handler = () => {
    if (document.hidden) onHidden();
    else onVisible();
  };
  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
}

/**
 * VinylCrackle ambience generator using Web Audio API.
 * Produces warm vinyl surface noise with subtle pops and clicks.
 */
export class VinylCrackle {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private isRunning: boolean = false;

  constructor() {}

  async unlockAndStart() {
    this.ctx = getAudioContext();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {}
    }
    if (this.isRunning) return;

    try {
      const sampleRate = this.ctx.sampleRate;
      const bufferSize = sampleRate * 2; // 2-second loop
      const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);

      // Generate soft vinyl dust and clicks
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // 3-pole pink noise filter for warm rumble
        b0 = 0.99765 * b0 + white * 0.0990460;
        b1 = 0.96300 * b1 + white * 0.2965164;
        b2 = 0.57000 * b2 + white * 1.0526913;
        const pink = (b0 + b1 + b2) * 0.05;

        // Occasional crackle pop
        const isCrack = Math.random() < 0.0008;
        const pop = isCrack ? (Math.random() > 0.5 ? 0.25 : -0.25) : 0;
        data[i] = pink * 0.08 + pop;
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = buffer;
      this.noiseNode.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1400;

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = 0.2;

      this.noiseNode.connect(filter);
      filter.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      this.noiseNode.start();
      this.isRunning = true;
    } catch (e) {
      console.warn('VinylCrackle failed to start:', e);
    }
  }

  stop() {
    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
      } catch {}
      this.noiseNode = null;
    }
    this.isRunning = false;
  }

  dispose() {
    this.stop();
  }
}

