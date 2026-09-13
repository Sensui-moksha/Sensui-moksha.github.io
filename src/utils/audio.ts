// Advanced Web Audio API Synthesizer (0 KB external audio assets)

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

// Auto-unlock audio context on first user touch/click/key
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    window.removeEventListener("pointerdown", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
  };
  window.addEventListener("pointerdown", unlockAudio, { passive: true });
  window.addEventListener("keydown", unlockAudio, { passive: true });
}

// Sound is enabled by default unless the user explicitly muted it ("false")
export const isSoundEnabled = (): boolean => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("portfolio_sound_enabled") !== "false";
};

export const setSoundEnabled = (enabled: boolean): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("portfolio_sound_enabled", enabled ? "true" : "false");
  if (enabled) {
    playSuccess();
  }
};

export const toggleSound = (): boolean => {
  const current = isSoundEnabled();
  const next = !current;
  setSoundEnabled(next);
  return next;
};

// Throttle helper to avoid accidental multi-triggering from nested elements
let lastSoundTime = 0;
const canPlaySound = (minIntervalMs = 25): boolean => {
  if (!isSoundEnabled()) return false;
  const now = performance.now();
  if (now - lastSoundTime < minIntervalMs) return false;
  lastSoundTime = now;
  return true;
};

/**
 * Tab Click Sound:
 * Crisp, airy, futuristic "water-drop / glass tap" with a transient overtone.
 * Perfect for navigation links, tabs, and section switchers.
 */
export const playTabClick = (): void => {
  if (!canPlaySound(40)) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Body resonance: downward smooth sine chirp
    const bodyOsc = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    bodyOsc.type = "sine";
    bodyOsc.frequency.setValueAtTime(1180, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(540, now + 0.05);

    bodyGain.gain.setValueAtTime(0.08, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    // High crisp transient tick for tactile snap
    const tickOsc = ctx.createOscillator();
    const tickGain = ctx.createGain();
    tickOsc.type = "triangle";
    tickOsc.frequency.setValueAtTime(2600, now);
    tickOsc.frequency.exponentialRampToValueAtTime(900, now + 0.015);

    tickGain.gain.setValueAtTime(0.05, now);
    tickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(ctx.destination);
    tickOsc.connect(tickGain);
    tickGain.connect(ctx.destination);

    bodyOsc.start(now);
    tickOsc.start(now);
    bodyOsc.stop(now + 0.055);
    tickOsc.stop(now + 0.02);
  } catch (err) {
    console.debug("Audio playTabClick error:", err);
  }
};

/**
 * Button Click Sound:
 * Snappy, tactile mechanical/electronic switch click.
 * Has a punchy attack and smooth micro-decay.
 */
export const playButtonClick = (): void => {
  if (!canPlaySound(35)) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Layer 1: Crisp high-frequency tactile switch transient
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = "triangle";
    clickOsc.frequency.setValueAtTime(1600, now);
    clickOsc.frequency.exponentialRampToValueAtTime(320, now + 0.03);

    clickGain.gain.setValueAtTime(0.09, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    // Layer 2: Warm tactile bottom thump
    const punchOsc = ctx.createOscillator();
    const punchGain = ctx.createGain();
    punchOsc.type = "sine";
    punchOsc.frequency.setValueAtTime(340, now);
    punchOsc.frequency.exponentialRampToValueAtTime(90, now + 0.045);

    punchGain.gain.setValueAtTime(0.07, now);
    punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    punchOsc.connect(punchGain);
    punchGain.connect(ctx.destination);

    clickOsc.start(now);
    punchOsc.start(now);
    clickOsc.stop(now + 0.035);
    punchOsc.stop(now + 0.05);
  } catch (err) {
    console.debug("Audio playButtonClick error:", err);
  }
};

// Default export alias for general clicks
export const playClick = playButtonClick;

/**
 * Theme Switch Sound:
 * Musical chime tuned to each distinct accent color.
 */
export const playThemeSound = (themeId?: string): void => {
  if (!canPlaySound(40)) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Frequencies per theme
    const themeNotes: Record<string, [number, number]> = {
      purple: [587.33, 880.0], // D5, A5
      cyan: [523.25, 783.99], // C5, G5
      emerald: [659.25, 987.77], // E5, B5
      amber: [440.0, 659.25], // A4, E5
      rose: [698.46, 1046.5], // F5, C6
    };

    const [f1, f2] = themeNotes[themeId || "purple"] || [587.33, 880.0];

    [f1, f2].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.03);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.07, now + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.03);
      osc.stop(now + idx * 0.03 + 0.2);
    });
  } catch (err) {
    console.debug("Audio playThemeSound error:", err);
  }
};

/**
 * Terminal Keystroke:
 * Soft mechanical keyboard tactile feedback for typing in console.
 */
export const playTerminalKey = (): void => {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(460, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.025);

    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.028);
  } catch (err) {
    console.debug("Audio playTerminalKey error:", err);
  }
};

/**
 * Success / Celebratory Chime:
 * Upward ascending harmonic chord (C5 -> E5 -> G5)
 */
export const playSuccess = (): void => {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + index * 0.05);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.08, now + index * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.05 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.05);
      osc.stop(now + index * 0.05 + 0.25);
    });
  } catch (err) {
    console.debug("Audio playSuccess error:", err);
  }
};

/**
 * Global Event Delegator:
 * Automatically plays appropriate sound for any interactive element across the portfolio
 * without needing manual click handlers everywhere!
 */
export const initGlobalAudioListeners = (): (() => void) => {
  if (typeof window === "undefined") return () => {};

  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Check if clicked element or its parent is an interactive control
    const interactive = target.closest(
      "a, button, [role='button'], [role='tab'], .terminal-chip, .terminal-dot, .theme-dot, .cta-btn, .see-all-btn, .work-view-link, .social-icon, .resume-button, .resume-menu-item, [class*='resume']"
    ) as HTMLElement | null;

    if (!interactive) return;

    // Theme dots have custom musical sounds handled by their click handler
    if (interactive.classList.contains("theme-dot")) {
      return;
    }

    // Navigation links / tabs
    const isTab =
      interactive.closest("nav, .header ul, [role='tablist']") ||
      interactive.hasAttribute("data-href") ||
      interactive.classList.contains("navbar-title");

    if (isTab) {
      playTabClick();
    } else {
      playButtonClick();
    }
  };

  document.addEventListener("click", handleClick, { passive: true, capture: true });

  return () => {
    document.removeEventListener("click", handleClick, { capture: true });
  };
};
