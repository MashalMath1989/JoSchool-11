/**
 * Audio Feedback System for JoSchool Quizzes
 * Uses the Web Audio API to synthesize responsive, lightweight, zero-latency feedback sounds
 * for correct and incorrect answers without relying on external audio files.
 */

class SoundFeedbackManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private readonly STORAGE_KEY = 'joschool_quiz_sound_enabled';

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        this.soundEnabled = stored === null ? true : stored === 'true';
      } catch {
        this.soundEnabled = true;
      }
    }
  }

  /**
   * Lazily initializes and unlocks the AudioContext.
   * Modern browsers require a user gesture (like clicking a choice) before resuming audio.
   */
  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return null;

      if (!this.ctx || this.ctx.state === 'closed') {
        this.ctx = new AudioContextClass();
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      return this.ctx;
    } catch (e) {
      console.warn('Web Audio API not available:', e);
      return null;
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem(this.STORAGE_KEY, String(enabled));
    } catch {
      // ignore
    }
  }

  public toggle(): boolean {
    const next = !this.soundEnabled;
    this.setEnabled(next);
    if (next) {
      // Subtle preview note when re-enabling
      this.playPreviewTone();
    }
    return next;
  }

  /**
   * Positive sound for correct answers:
   * A bright, melodic two-note chord (G5 -> C6) with warm sine waves
   * evoking a cheerful, satisfying ding.
   */
  public playCorrect(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Note 1: G5 (783.99 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(783.99, now);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.2, now + 0.015);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.19);

      // Note 2: C6 (1046.50 Hz) - slightly delayed for an uplifting arpeggio
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.50, now + 0.08);

      gain2.gain.setValueAtTime(0.001, now + 0.08);
      gain2.gain.linearRampToValueAtTime(0.24, now + 0.095);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.08);
      osc2.stop(now + 0.39);

      // Subtle warm sparkle overtone (E6: 1318.51 Hz)
      const oscSparkle = ctx.createOscillator();
      const gainSparkle = ctx.createGain();
      oscSparkle.type = 'triangle';
      oscSparkle.frequency.setValueAtTime(1318.51, now + 0.1);

      gainSparkle.gain.setValueAtTime(0.001, now + 0.1);
      gainSparkle.gain.linearRampToValueAtTime(0.08, now + 0.115);
      gainSparkle.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

      oscSparkle.connect(gainSparkle);
      gainSparkle.connect(ctx.destination);

      oscSparkle.start(now + 0.1);
      oscSparkle.stop(now + 0.31);
    } catch (e) {
      console.warn('Error playing correct sound:', e);
    }
  }

  /**
   * Negative sound for incorrect answers:
   * A gentle, muted low double-tone (D4 -> G3) that clearly indicates an incorrect choice
   * without being harsh or frustrating.
   */
  public playIncorrect(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Note 1: 293.66 Hz (D4)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(293.66, now);
      osc1.frequency.linearRampToValueAtTime(261.63, now + 0.09); // slight downward pitch bend

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.18, now + 0.015);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.13);

      // Note 2: 220 Hz (A3) descending to 196 Hz (G3)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(220, now + 0.1);
      osc2.frequency.linearRampToValueAtTime(196, now + 0.2);

      gain2.gain.setValueAtTime(0.001, now + 0.1);
      gain2.gain.linearRampToValueAtTime(0.2, now + 0.115);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.1);
      osc2.stop(now + 0.27);
    } catch (e) {
      console.warn('Error playing incorrect sound:', e);
    }
  }

  private playPreviewTone(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // ignore
    }
  }
}

export const soundManager = new SoundFeedbackManager();
