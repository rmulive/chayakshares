/**
 * Dynamic Procedural Web Audio Soundscape Synthesizer
 * Generates an evolving architectural room resonance, warm harmonic drone,
 * and spatial filter modulation without requiring external audio files.
 */
class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private isInitialized = false;
  private isPlaying = false;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private noiseNode: AudioBufferSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private currentVolume = 0.45;

  public init(): void {
    if (this.isInitialized) return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);

      // Analyser for UI visualizers
      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = 64;

      // Warm Room Low-pass filter
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(380, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(1.8, this.ctx.currentTime);

      this.filterNode.connect(this.masterGain);
      this.masterGain.connect(this.analyserNode);
      this.analyserNode.connect(this.ctx.destination);

      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  public async start(): Promise<void> {
    if (!this.isInitialized) this.init();
    if (!this.ctx || !this.masterGain) return;

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (this.isPlaying) return;

    const t = this.ctx.currentTime;

    // Build evolving harmonic drone chords (A-minor 9th ambient chord: 55Hz, 110Hz, 164.81Hz, 220Hz, 329.63Hz)
    const freqs = [55.0, 110.0, 164.81, 220.0, 329.63];
    this.oscillators = [];

    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.filterNode) return;
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      osc.type = idx === 0 ? 'sine' : idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);

      // Slight detune for rich choral spatial width
      osc.detune.setValueAtTime((idx - 2) * 4, t);

      // Gentle gain per harmonic layer
      const gainVal = idx === 0 ? 0.28 : 0.08 / (idx + 1);
      oscGain.gain.setValueAtTime(gainVal, t);

      osc.connect(oscGain);
      oscGain.connect(this.filterNode);
      osc.start(t);
      this.oscillators.push(osc);
    });

    // Create subtle spatial air acoustic texture (pinkish filtered noise)
    this.startAtmosphericAir(t);

    // Fade in master gain smoothly
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(0, t);
    this.masterGain.gain.linearRampToValueAtTime(this.currentVolume, t + 2.5);

    this.isPlaying = true;
  }

  private startAtmosphericAir(t: number): void {
    if (!this.ctx || !this.filterNode) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.05;
      b1 = 0.96 * b1 + white * 0.11;
      b2 = 0.86 * b2 + white * 0.25;
      output[i] = (b0 + b1 + b2) * 0.04;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(450, t);
    noiseFilter.Q.setValueAtTime(0.7, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.06, t);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.filterNode);
    whiteNoise.start(t);

    this.noiseNode = whiteNoise;
  }

  public stop(): void {
    if (!this.ctx || !this.masterGain || !this.isPlaying) return;
    const t = this.ctx.currentTime;
    
    // Smooth fade out
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
    this.masterGain.gain.linearRampToValueAtTime(0, t + 1.2);

    setTimeout(() => {
      this.oscillators.forEach(osc => {
        try { osc.stop(); osc.disconnect(); } catch (_) { /* noop */ }
      });
      this.oscillators = [];
      if (this.noiseNode) {
        try { this.noiseNode.stop(); this.noiseNode.disconnect(); } catch (_) { /* noop */ }
        this.noiseNode = null;
      }
      this.isPlaying = false;
    }, 1200);
  }

  /**
   * Adapts the synth harmonic center and filter cutoff dynamically as visitor explores along the Z-axis
   */
  public updateSpatialZone(z: number): void {
    if (!this.ctx || !this.filterNode || !this.isPlaying) return;
    const t = this.ctx.currentTime;

    // Filter frequency subtly brightens in Award Pavilion and warms in Monochrome
    let targetCutoff = 350;
    if (z > 16 && z < 44) {
      // Award pavilion: brighter, resonant gold
      targetCutoff = 520;
    } else if (z >= 44 && z < 72) {
      // Monochrome: serene, deep minimalist sub tone
      targetCutoff = 280;
    } else if (z >= 72 && z < 100) {
      // Nature: organic air
      targetCutoff = 420;
    } else if (z >= 100) {
      // Street & Creative: open air
      targetCutoff = 460;
    }

    this.filterNode.frequency.setTargetAtTime(targetCutoff, t, 1.5);
  }

  public setVolume(val: number): void {
    this.currentVolume = Math.max(0, Math.min(1, val));
    if (this.ctx && this.masterGain && this.isPlaying) {
      this.masterGain.gain.setTargetAtTime(this.currentVolume, this.ctx.currentTime, 0.1);
    }
  }

  public getVisualizerData(): Uint8Array {
    if (!this.analyserNode) return new Uint8Array(32);
    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(data);
    return data;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const soundscape = new SoundscapeEngine();
