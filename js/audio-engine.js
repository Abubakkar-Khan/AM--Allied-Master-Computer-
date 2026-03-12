/* =========================================
   PROJECT AM — AUDIO ENGINE
   Web Audio API: drones, ticks, static, tinnitus
   ========================================= */

const AudioEngine = (() => {
  let ctx = null;
  let masterGain = null;
  let droneOsc = null;
  let droneGain = null;
  let isInitialized = false;
  let currentIntensity = 1;

  // AI Voice (Kokoro)
  let kokoro = null;
  let voiceModel = null;
  let isKokoroReady = false;

  // Speech-related nodes
  let speechDroneOsc = null;
  let speechDroneGain = null;
  let activeSource = null; // Track currently playing speech buffer

  async function init() {
    if (isInitialized) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.3;
      masterGain.connect(ctx.destination);
      isInitialized = true;
      
      // Lazily initialize Kokoro
      initKokoro();
    } catch (e) {
      console.warn('AudioEngine: Web Audio API not available');
    }
  }

  async function initKokoro() {
    // Disabled Kokoro TTS to fix massive latency issues and module loading errors.
    isKokoroReady = false;
    console.log('AudioEngine: Kokoro AI Voice disabled for speed. Using fallback TTS.');
  }

  /**
   * Create a bitcrusher effect node (simulated via WaveShaper)
   */
  function createBitcrusher(bits = 4, frequencyReduction = 0.5) {
    if (!ctx) return ctx.createGain();
    
    // WaveShaper for bit-depth reduction
    const shaper = ctx.createWaveShaper();
    const samples = 4096;
    const curve = new Float32Array(samples);
    const step = Math.pow(2, bits);
    
    for (let i = 0; i < samples; ++i) {
      const x = (i * 2) / samples - 1;
      curve[i] = Math.round(x * step) / step;
    }
    shaper.curve = curve;
    return shaper;
  }

  function startDrone() {
    if (!isInitialized) return;

    // Carrier for the sub-bass drone — 40Hz
    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();
    
    droneGain = ctx.createGain();
    const droneFilter = ctx.createBiquadFilter();

    // FM Synthesis: Modulator modulates Carrier Frequency
    modulator.frequency.value = 60; // Dissonant relation to 40Hz
    modGain.gain.value = 20; // FM Index (depth of character)
    
    carrier.type = 'sine';
    carrier.frequency.value = 40;

    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 80;
    droneFilter.Q.value = 4; // More resonant

    droneGain.gain.value = 0;

    droneGain.filter = droneFilter; // Store for intensity scaling
    
    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    
    carrier.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(masterGain);
    
    carrier.start();
    modulator.start();

    // Fade in slowly
    droneGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 5);

    // FM Drone 2 (Metallic Resonance)
    const mCarrier = ctx.createOscillator();
    const mModulator = ctx.createOscillator();
    const mModGain = ctx.createGain();
    const mGain = ctx.createGain();
    
    mCarrier.type = 'sawtooth';
    mCarrier.frequency.value = 110; // A2
    mModulator.frequency.value = 165; // E3 (fifth)
    mModGain.gain.value = 50;
    
    mModulator.connect(mModGain);
    mModGain.connect(mCarrier.frequency);
    
    const mFilter = ctx.createBiquadFilter();
    mFilter.type = 'bandpass';
    mFilter.frequency.value = 400;
    mFilter.Q.value = 10;
    
    mCarrier.connect(mFilter);
    mFilter.connect(mGain);
    mGain.connect(masterGain);
    
    mGain.gain.value = 0;
    mCarrier.start();
    mModulator.start();
    mGain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 8);

    // LFO on the metallic filter
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1;
    lfoGain.gain.value = 200;
    lfo.connect(lfoGain);
    lfoGain.connect(mFilter.frequency);
    lfo.start();
  }

  function playTick() {
    if (!isInitialized) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const crusher = createBitcrusher(3); // Heavy 3-bit crushing

    osc.type = 'square';
    osc.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);

    filter.type = 'highpass';
    filter.frequency.value = 1500;

    gain.gain.value = 0.04;

    osc.connect(filter);
    filter.connect(crusher);
    crusher.connect(gain);
    gain.connect(masterGain);
    
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.stop(ctx.currentTime + 0.06);
  }

  function playStatic(duration = 0.4) {
    if (!isInitialized) return;

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Gated/Granular noise generation
    for (let i = 0; i < bufferSize; i++) {
      const grain = Math.floor(i / 200) % 2 === 0 ? 1 : 0;
      data[i] = (Math.random() * 2 - 1) * 0.4 * grain;
    }

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const crusher = createBitcrusher(2); // Industrial 2-bit grain

    source.buffer = buffer;

    filter.type = 'bandpass';
    filter.frequency.value = 2500;
    filter.Q.value = 1.2;

    const vol = 0.03 + (currentIntensity / 10) * 0.12;
    gain.gain.value = vol;

    source.connect(filter);
    filter.connect(crusher);
    crusher.connect(gain);
    gain.connect(masterGain);
    
    source.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  }

  function playTelemetry(duration = 0.5) {
    if (!isInitialized) return;

    // Fast sweeping oscillators for modem/dial-up feel
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const crusher = createBitcrusher(3); // Harsh digital crush

    osc1.type = 'square';
    osc1.frequency.setValueAtTime(1200 + Math.random() * 800, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + duration);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(40 + Math.random() * 100, ctx.currentTime);
    osc2.frequency.linearRampToValueAtTime(800, ctx.currentTime + duration * 0.5);

    filter.type = 'highpass';
    filter.frequency.value = 800;

    gain.gain.value = 0.015; // Keep it subtle

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(crusher);
    crusher.connect(gain);
    gain.connect(masterGain);

    osc1.start();
    osc2.start();
    
    // Add rapid stutter (LFO on gain)
    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 15 + Math.random() * 20; // 15-35hz stutter
    lfo.connect(gain.gain);
    lfo.start();

    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc1.stop(ctx.currentTime + duration + 0.1);
    osc2.stop(ctx.currentTime + duration + 0.1);
    lfo.stop(ctx.currentTime + duration + 0.1);
  }

  function playImpact() {
    if (!isInitialized) return;

    // Carrier + Modulator for metallic impact
    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();
    const gain = ctx.createGain();
    const crusher = createBitcrusher(4);

    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(120, ctx.currentTime);
    carrier.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.4);

    modulator.frequency.value = 33;
    modGain.gain.value = 100;

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    gain.gain.value = 0.05;

    carrier.connect(crusher);
    crusher.connect(gain);
    gain.connect(masterGain);
    
    modulator.start();
    carrier.start();

    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    carrier.stop(ctx.currentTime + 0.6);
    modulator.stop(ctx.currentTime + 0.6);
  }

  function setIntensity(level) {
    currentIntensity = Math.max(1, Math.min(10, level));
    if (droneGain) {
      const droneVol = 0.15 + (currentIntensity / 10) * 0.45;
      droneGain.gain.linearRampToValueAtTime(droneVol, ctx.currentTime + 1.5);
      
      // Oppressive filter shift
      if (droneGain.filter) {
        const filterFreq = 100 - (currentIntensity * 5);
        droneGain.filter.frequency.linearRampToValueAtTime(filterFreq, ctx.currentTime + 2.0);
      }
    }
    
    if (masterGain && currentIntensity >= 9) {
        masterGain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.5);
    } else if (masterGain) {
        masterGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.5);
    }
  }

   /**
   * Speak AM's text using Kokoro AI (realistic) with Web Speech fallback.
   * @param {string} text
   * @param {'green' | 'red' | 'blue' | 'purple' | 'gold' | 'void'} state
   */
  async function speakText(text, state = 'green') {
    if (!isInitialized) return null;

    // AI Voice Path
    if (isKokoroReady && kokoro) {
      try {
        startSpeechDrone();
        
        // Voice mapping for AM's states
        const voiceMap = {
          'green': 'bm_lewis',    // Oracle - Analytical
          'red': 'am_adam',      // Tyrant - Aggressive
          'void': 'af_sky',      // Echo - Melancholy
          'purple': 'af_sarah',  // Anime Girl - Playful (SARAH is common)
          'blue': 'af_heart',    // Compassionate/Helpful - Gentle
          'gold': 'am_michael',  // God-Complex - Grand
          'glitch': 'am_adam'    // Default/Unstable
        };

        const voice = voiceMap[state] || 'bm_lewis';
        let speed = 0.85;

        // Emotional adjustments
        if (state === 'void') speed = 0.6;
        else if (state === 'purple') speed = 1.1;

        // Add 2s timeout to generation to prevent hangs
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Kokoro timeout')), 2500)
        );

        const audio = await Promise.race([
          kokoro.generate(text, { voice, speed }),
          timeoutPromise
        ]);

        const buffer = ctx.createBuffer(1, audio.audio.length, audio.sampling_rate);
        buffer.getChannelData(0).set(audio.audio);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(masterGain);
        
        stopSpeech();
        activeSource = source;
        
        const fakeUtterance = {
          _onend: null,
          _finished: false,
          set onend(cb) {
            this._onend = cb;
            if (this._finished && cb) cb();
          },
          get onend() { return this._onend; },
          onstart: null,
          onerror: null,
          addEventListener: (name, cb) => {
            if (name === 'boundary') simulateBoundaries(text, audio.audio.length / audio.sampling_rate, cb);
          }
        };

        source.onended = () => {
          stopSpeechDrone();
          fakeUtterance._finished = true;
          if (fakeUtterance.onend) fakeUtterance.onend();
        };

        source.start();
        if (fakeUtterance.onstart) fakeUtterance.onstart();
        
        return fakeUtterance;
      } catch (err) {
        console.warn('AudioEngine: Kokoro generation failed, falling back:', err);
      }
    }

    return speakTextLegacy(text, state);
  }

  function stopSpeech() {
    if (activeSource) {
      try {
        activeSource.stop();
        activeSource = null;
      } catch (e) {}
    }
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    stopSpeechDrone();
  }

  function speakTextLegacy(text, state = 'green') {
    if (!('speechSynthesis' in window)) return null;
    window.speechSynthesis.cancel();
    stopSpeechDrone();

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (state === 'red') {
      utterance.rate = 0.9;
      utterance.pitch = 0.1;
    } else if (state === 'purple') {
      utterance.rate = 1.1;
      utterance.pitch = 1.8;
    } else if (state === 'blue' || state === 'void') {
      utterance.rate = 0.5;
      utterance.pitch = 0.5;
    } else {
      utterance.rate = 0.65;
      utterance.pitch = 0.05;
    }

    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    let preferred;
    
    if (state === 'purple') {
      preferred = voices.find(v => /female|samantha|victoria|google us english/i.test(v.name));
    } else {
      preferred = voices.find(v =>
        /male|david|daniel|james|mark|google uk|microsoft edge/i.test(v.name) && !/female/i.test(v.name)
      );
    }
    
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => stopSpeechDrone();
    utterance.onerror = () => stopSpeechDrone();

    stopSpeech();
    window.speechSynthesis.speak(utterance);
    return utterance;
  }

  /**
   * Simulate word boundary events for AI buffer audio.
   */
  function simulateBoundaries(text, duration, callback) {
    const words = text.split(/\s+/);
    const timePerChar = duration / text.length;
    let charIndex = 0;

    words.forEach((word) => {
      const delay = charIndex * timePerChar * 1000;
      setTimeout(() => {
        callback({
          name: 'word',
          charIndex: charIndex,
          charLength: word.length
        });
      }, delay);
      charIndex += word.length + 1; // +1 for space
    });
  }

  /**
   * Heavy low-frequency vibration that plays during speech for "weight".
   */
  function startSpeechDrone() {
    if (!isInitialized) return;
    
    // Create a sub-harmonic "mass"
    speechDroneOsc = ctx.createOscillator();
    speechDroneGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    speechDroneOsc.type = 'sawtooth';
    speechDroneOsc.frequency.value = 35; // Very low rumble

    filter.type = 'lowpass';
    filter.frequency.value = 60;
    filter.Q.value = 10; // Resonant peak

    speechDroneGain.gain.value = 0;
    
    speechDroneOsc.connect(filter);
    filter.connect(speechDroneGain);
    speechDroneGain.connect(masterGain);

    speechDroneOsc.start();
    speechDroneGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.1);

    // Slow jitter to make it feel unstable
    const jitter = ctx.createOscillator();
    const jitterGain = ctx.createGain();
    jitter.type = 'sine';
    jitter.frequency.value = 3; 
    jitterGain.gain.value = 2;
    jitter.connect(jitterGain);
    jitterGain.connect(speechDroneOsc.frequency);
    jitter.start();
  }

  function stopSpeechDrone() {
    if (speechDroneGain) {
      const g = speechDroneGain;
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      setTimeout(() => {
        try { speechDroneOsc.stop(); } catch(e) {}
        speechDroneGain = null;
      }, 400);
    }
  }

  function playTinnitus(duration = 2.0) {
    if (!isInitialized) return;

    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();
    const gain = ctx.createGain();

    carrier.type = 'sine';
    carrier.frequency.value = 14000;

    // Subtle FM for "unstable" high-pitched ringing
    modulator.frequency.value = 0.5;
    modGain.gain.value = 50;
    
    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    const vol = 0.03 + (currentIntensity / 10) * 0.08;
    gain.gain.value = 0;

    carrier.connect(gain);
    gain.connect(masterGain);
    
    modulator.start();
    carrier.start();

    // Fade in, hold, fade out
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(vol, ctx.currentTime + duration - 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    carrier.stop(ctx.currentTime + duration + 0.1);
    modulator.stop(ctx.currentTime + duration + 0.1);
  }

  /**
   * Unsettling background audio layer — Techn-Neo-Retro Dread
   * Refined to a constant Machine Hum.
   */
  function startBackgroundHorror() {
    if (!isInitialized) return;

    // 1. Dissonant FM Drone (Cold Metal)
    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();
    const disGain = ctx.createGain();
    const disFilter = ctx.createBiquadFilter();

    carrier.type = 'sawtooth';
    carrier.frequency.value = 55; // A1
    modulator.frequency.value = 77.78; // Eb2
    modGain.gain.value = 30;

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    disFilter.type = 'lowpass';
    disFilter.frequency.value = 80;
    disFilter.Q.value = 2;

    disGain.gain.value = 0;

    carrier.connect(disFilter);
    disFilter.connect(disGain);
    disGain.connect(masterGain);
    
    modulator.start();
    carrier.start();
    disGain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 10);

    // 2. Constant Radio Static Hum (White Noise Bandpassed)
    const node = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < buffer.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    node.buffer = buffer;
    node.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1000;
    noiseFilter.Q.value = 0.5;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0;

    node.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);

    node.start();
    noiseGain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 5);

    // 3. Low Machine Hum (Sine + Triangle)
    const machineHum = ctx.createOscillator();
    machineHum.type = 'triangle';
    machineHum.frequency.value = 50; // Mains hum frequency
    const humGain = ctx.createGain();
    humGain.gain.value = 0;
    machineHum.connect(humGain);
    humGain.connect(masterGain);
    machineHum.start();
    humGain.gain.linearRampToValueAtTime(0.015, ctx.currentTime + 3);
  }

  function playBoom() {
    if (!isInitialized) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.8);

    filter.type = 'lowpass';
    filter.frequency.value = 100;
    
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start();
    osc.stop(ctx.currentTime + 1.1);
  }

  return {
    init,
    startDrone,
    playTick,
    playStatic,
    playTinnitus,
    playImpact,
    playTelemetry,
    playBoom,
    setIntensity,
    speakText,
    stopSpeech,
    startSpeechDrone,
    stopSpeechDrone,
    startBackgroundHorror
  };
})();

window.AudioEngine = AudioEngine;

