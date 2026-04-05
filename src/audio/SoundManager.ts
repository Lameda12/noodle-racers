/**
 * SoundManager - Web Audio API wrapper for game sounds
 *
 * Manages:
 * - Background music
 * - Sound effects (collision, power-up, milestone)
 * - Volume control
 * - Muting
 */

export class SoundManager {
  private audioContext: AudioContext;
  private masterGain: GainNode;
  private soundEnabled: boolean = true;

  // Audio nodes for different sound types
  private bgmGain: GainNode;
  private sfxGain: GainNode;

  // Background music oscillator (simple sine wave)
  private bgmOscillator: OscillatorNode | null = null;
  private bgmPlaying: boolean = false;

  constructor() {
    // Initialize Web Audio API
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Master volume
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    this.masterGain.gain.value = 0.5;

    // BGM volume
    this.bgmGain = this.audioContext.createGain();
    this.bgmGain.connect(this.masterGain);
    this.bgmGain.gain.value = 0.3;

    // SFX volume
    this.sfxGain = this.audioContext.createGain();
    this.sfxGain.connect(this.masterGain);
    this.sfxGain.gain.value = 0.6;

    console.log('🔊 SoundManager initialized');
  }

  /**
   * Play background music (simple looping tone)
   */
  playBGM(): void {
    if (this.bgmPlaying || !this.soundEnabled) return;

    this.bgmOscillator = this.audioContext.createOscillator();
    this.bgmOscillator.type = 'sine';
    this.bgmOscillator.frequency.value = 110; // A2 note
    this.bgmOscillator.connect(this.bgmGain);
    this.bgmOscillator.start();

    this.bgmPlaying = true;
    console.log('🎵 BGM started');
  }

  /**
   * Stop background music
   */
  stopBGM(): void {
    if (!this.bgmPlaying || !this.bgmOscillator) return;

    this.bgmOscillator.stop();
    this.bgmPlaying = false;
    console.log('🔇 BGM stopped');
  }

  /**
   * Play collision sound effect
   */
  playCollisionSFX(): void {
    if (!this.soundEnabled) return;

    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const env = this.audioContext.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);

    env.gain.setValueAtTime(0.3, now);
    env.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(env);
    env.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Play power-up collected sound
   */
  playPowerUpSFX(): void {
    if (!this.soundEnabled) return;

    const now = this.audioContext.currentTime;
    const notes = [523, 659, 784]; // C, E, G (major chord)

    notes.forEach((freq, index) => {
      const osc = this.audioContext.createOscillator();
      const env = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      env.gain.setValueAtTime(0.2, now);
      env.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(env);
      env.connect(this.sfxGain);

      osc.start(now + index * 0.05);
      osc.stop(now + 0.3);
    });
  }

  /**
   * Play milestone reached sound (ascending notes)
   */
  playMilestoneSFX(): void {
    if (!this.soundEnabled) return;

    const now = this.audioContext.currentTime;
    const notes = [523, 659, 784, 1046]; // C, E, G, C (octave)

    notes.forEach((freq, index) => {
      const osc = this.audioContext.createOscillator();
      const env = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      env.gain.setValueAtTime(0.25, now + index * 0.1);
      env.gain.exponentialRampToValueAtTime(0.01, now + index * 0.1 + 0.25);

      osc.connect(env);
      env.connect(this.sfxGain);

      osc.start(now + index * 0.1);
      osc.stop(now + index * 0.1 + 0.25);
    });
  }

  /**
   * Play game over sound (descending sad tones)
   */
  playGameOverSFX(): void {
    if (!this.soundEnabled) return;

    const now = this.audioContext.currentTime;
    const notes = [784, 698, 587, 523]; // G, F, D, C (descending)

    notes.forEach((freq, index) => {
      const osc = this.audioContext.createOscillator();
      const env = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      env.gain.setValueAtTime(0.3, now + index * 0.15);
      env.gain.exponentialRampToValueAtTime(0.01, now + index * 0.15 + 0.4);

      osc.connect(env);
      env.connect(this.sfxGain);

      osc.start(now + index * 0.15);
      osc.stop(now + index * 0.15 + 0.4);
    });
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(value: number): void {
    const clamped = Math.max(0, Math.min(1, value));
    this.masterGain.gain.value = clamped;
  }

  /**
   * Get master volume
   */
  getVolume(): number {
    return this.masterGain.gain.value;
  }

  /**
   * Toggle sound on/off
   */
  toggleSound(enabled: boolean): void {
    this.soundEnabled = enabled;
    if (!enabled && this.bgmPlaying) {
      this.stopBGM();
    } else if (enabled && !this.bgmPlaying) {
      this.playBGM();
    }
  }

  /**
   * Check if sounds are enabled
   */
  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopBGM();
    this.audioContext.close();
  }
}
