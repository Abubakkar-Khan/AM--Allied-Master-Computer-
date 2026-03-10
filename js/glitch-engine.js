/* =========================================
   PROJECT AM — GLITCH ENGINE
   Visual glitch effect orchestration
   ========================================= */

const GlitchEngine = (() => {
  let ambientInterval = null;
  let currentIntensity = 1;
  const body = document.body;

  const GLITCH_TYPES = ['jitter', 'bleed', 'distort', 'dissolve', 'chromatic', 'tear'];
  const DISTORTION_TYPES = ['shake', 'frameskip', 'signal-bleed', 'scatter', 'interlace', 'surge'];

  /**
   * Trigger a glitch effect.
   * @param {string} type - 'jitter' | 'bleed' | 'distort' | 'dissolve' | 'chromatic' | 'tear'
   * @param {number} intensity - 1-10
   * @param {number} duration - ms
   */
  function triggerGlitch(type, intensity = currentIntensity, duration = null) {
    const effectDuration = duration || (200 + intensity * 80);
    const isHigh = intensity >= 7;

    const className = `glitch-${type}`;
    body.classList.add(className);
    if (isHigh) body.classList.add('intensity-high');

    // Play audio
    if (intensity >= 5) AudioEngine.playStatic(effectDuration / 1000);
    if (intensity >= 8) AudioEngine.playImpact();

    setTimeout(() => {
      body.classList.remove(className);
      body.classList.remove('intensity-high');
    }, effectDuration);
  }

  /**
   * Trigger a distortion effect.
   */
  function triggerDistortion(type, duration = 300) {
    const className = `distortion-${type}`;

    if (type === 'shake') {
      // "Instead of shaking like an idiot, we glitch"
      VisualEngine.triggerLogicError(duration);
      VisualEngine.triggerDataGlitch(duration);
      return;
    }

    body.classList.add(className);
    setTimeout(() => body.classList.remove(className), duration);
  }

  /**
   * Trigger a combo based on mutation type from AI response.
   */
  function triggerMutation(mutation, intensity) {
    currentIntensity = intensity;

    switch (mutation) {
      case 'jitter':
        triggerGlitch('jitter', intensity);
        if (intensity >= 5) triggerDistortion('shake', 200);
        break;

      case 'bleed':
        triggerGlitch('bleed', intensity);
        triggerGlitch('chromatic', intensity, 400);
        if (intensity >= 6) triggerDistortion('signal-bleed', 500);
        break;

      case 'distort':
        triggerGlitch('distort', intensity);
        triggerDistortion('interlace', 400);
        if (intensity >= 7) triggerDistortion('scatter', 300);
        break;

      case 'tear':
        triggerGlitch('tear', intensity);
        triggerGlitch('chromatic', intensity, 400);
        if (intensity >= 7) triggerDistortion('scatter', 400);
        break;

      case 'dissolve':
        triggerGlitch('dissolve', intensity);
        if (intensity >= 5) triggerDistortion('frameskip', 400);
        if (intensity >= 8) {
          triggerDistortion('surge', 300);
          VisualEngine.triggerLogicError(300);
        }
        break;

      default:
        triggerGlitch('jitter', intensity);
    }
  }

  /**
   * Start ambient micro-glitches.
   */
  function startAmbient() {
    if (ambientInterval) return;

    function scheduleNext() {
      const interval = 3000 + Math.random() * (8000 - currentIntensity * 500);
      ambientInterval = setTimeout(() => {
        // Random micro-glitch
        body.classList.add('micro-glitch');
        const glitchDuration = 100 + Math.random() * 200;
        setTimeout(() => body.classList.remove('micro-glitch'), glitchDuration);

        // Occasional stronger ambient glitch
        if (Math.random() < currentIntensity * 0.05) {
          const randomType = GLITCH_TYPES[Math.floor(Math.random() * GLITCH_TYPES.length)];
          triggerGlitch(randomType, Math.min(currentIntensity, 4), 150);
        }

        scheduleNext();
      }, interval);
    }
    scheduleNext();
  }

  function stopAmbient() {
    if (ambientInterval) {
      clearTimeout(ambientInterval);
      ambientInterval = null;
    }
  }

  function setIntensity(level) {
    currentIntensity = Math.max(1, Math.min(10, level));
  }

  function getIntensity() {
    return currentIntensity;
  }

  return {
    triggerGlitch,
    triggerDistortion,
    triggerMutation,
    startAmbient,
    stopAmbient,
    setIntensity,
    getIntensity
  };
})();
