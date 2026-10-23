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
    // Procedural synthesizer drone disabled per curator specification.
    // Ambient sound is strictly played via configured YouTube URL. If no URL is provided, exhibition remains silent.
    return;
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

  public setMasterVolume(val: number): void {
    this.setVolume(val);
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
