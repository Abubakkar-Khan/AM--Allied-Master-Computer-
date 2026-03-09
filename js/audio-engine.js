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

  async function init() {
    if (isInitialized) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.6;
      masterGain.connect(ctx.destination);
      isInitialized = true;
      
      // Lazily initialize Kokoro
      initKokoro();
    } catch (e) {
      console.warn('AudioEngine: Web Audio API not available');
    }
  }

  async function initKokoro() {
    const statusEl = document.getElementById('voice-status');
    if (statusEl) statusEl.classList.remove('hidden');

    try {
      // Dynamic import of the Kokoro library
      const { KokoroTTS } = await import('kokoro-js');
      
      // Use the lightest version for browser speed (v1.0 is ~30MB)
      kokoro = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
        dtype: "q8", // 8-bit quantization for performance
        device: "wasm"
      });
      
      isKokoroReady = true;
      if (statusEl) {
        statusEl.textContent = 'NEURAL LINK: SYNCHRONIZED';
        setTimeout(() => statusEl.classList.add('hidden'), 2000);
      }
      console.log('AudioEngine: Kokoro AI Voice ready');
    } catch (e) {
      console.error('AudioEngine: Failed to load Kokoro TTS:', e);
      if (statusEl) statusEl.textContent = 'NEURAL LINK: FALLBACK ACTIVE';
      setTimeout(() => statusEl.classList.add('hidden'), 3000);
    }
  }

  function startDrone() {
    if (!isInitialized) return;

    // Sub-bass drone — 40Hz
    droneOsc = ctx.createOscillator();
    droneGain = ctx.createGain();
    const droneFilter = ctx.createBiquadFilter();

    droneOsc.type = 'sine';
    droneOsc.frequency.value = 40;

    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 80;
    droneFilter.Q.value = 1;

    droneGain.gain.value = 0;

    droneOsc.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(masterGain);
    droneOsc.start();

    // Fade in slowly
    droneGain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 3);

    // Add a second harmonic for richness
    const drone2 = ctx.createOscillator();
    const drone2Gain = ctx.createGain();
    drone2.type = 'sine';
    drone2.frequency.value = 60;
    drone2Gain.gain.value = 0;
    drone2.connect(drone2Gain);
    drone2Gain.connect(masterGain);
    drone2.start();
    drone2Gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 5);

    // Slow LFO modulation on drone
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15;
    lfoGain.gain.value = 5;
    lfo.connect(lfoGain);
    lfoGain.connect(droneOsc.frequency);
    lfo.start();
  }

  function playTick() {
    if (!isInitialized) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.value = 800 + Math.random() * 400;

    filter.type = 'highpass';
    filter.frequency.value = 2000;

    gain.gain.value = 0.03 + Math.random() * 0.02;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    osc.start();

    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.stop(ctx.currentTime + 0.05);
  }

  function playStatic(duration = 0.3) {
    if (!isInitialized) return;

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    source.buffer = buffer;

    filter.type = 'bandpass';
    filter.frequency.value = 3000;
    filter.Q.value = 0.5;

    const vol = 0.05 + (currentIntensity / 10) * 0.15;
    gain.gain.value = vol;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    source.start();

    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  }

  function playTinnitus(duration = 1.5) {
    if (!isInitialized) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 12000;

    const vol = 0.02 + (currentIntensity / 10) * 0.06;
    gain.gain.value = 0;

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();

    // Fade in, hold, fade out
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(vol, ctx.currentTime + duration - 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration + 0.1);
  }

  function playImpact() {
    if (!isInitialized) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = 80;

    gain.gain.value = 0.15;

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();

    osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.stop(ctx.currentTime + 0.5);
  }

  function setIntensity(level) {
    currentIntensity = Math.max(1, Math.min(10, level));
    if (droneGain) {
      const droneVol = 0.15 + (currentIntensity / 10) * 0.3;
      droneGain.gain.linearRampToValueAtTime(droneVol, ctx.currentTime + 0.5);
    }
  }

  /**
   * Speak AM's text using Kokoro AI (realistic) with Web Speech fallback.
   */
  async function speakText(text) {
    if (!isInitialized) return null;

    // AI Voice Path
    if (isKokoroReady && kokoro) {
      try {
        startSpeechDrone();
        
        // Use "am_adam" or "bm_lewis" for deep, realistic male voices
        const audio = await kokoro.generate(text, {
          voice: "am_adam",
          speed: 0.8
        });

        // The audio object contains .audio (Float32Array) and .sampling_rate
        const buffer = ctx.createBuffer(1, audio.audio.length, audio.sampling_rate);
        buffer.getChannelData(0).set(audio.audio);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(masterGain);
        
        // Fake utterance object for TextEngine compatibility
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

    // Fallback to legacy Web Speech API
    return speakTextLegacy(text);
  }

  function speakTextLegacy(text) {
    if (!('speechSynthesis' in window)) return null;
    window.speechSynthesis.cancel();
    stopSpeechDrone();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.65;
    utterance.pitch = 0.05;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      /male|david|daniel|james|mark|google uk|microsoft edge/i.test(v.name) && !/female/i.test(v.name)
    );
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => startSpeechDrone();
    utterance.onend = () => stopSpeechDrone();
    utterance.onerror = () => stopSpeechDrone();

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

  /**
   * Unsettling background audio layer — dissonant drones, metallic resonance, random stingers.
   */
  function startBackgroundHorror() {
    if (!isInitialized) return;

    // Dissonant tritone drone (the "devil's interval")
    const dissonant1 = ctx.createOscillator();
    const dissonant2 = ctx.createOscillator();
    const disGain = ctx.createGain();

    dissonant1.type = 'sawtooth';
    dissonant1.frequency.value = 55; // A1
    dissonant2.type = 'sawtooth';
    dissonant2.frequency.value = 77.78; // Eb2 — tritone

    disGain.gain.value = 0;

    const disFilter = ctx.createBiquadFilter();
    disFilter.type = 'lowpass';
    disFilter.frequency.value = 120;
    disFilter.Q.value = 2;

    dissonant1.connect(disFilter);
    dissonant2.connect(disFilter);
    disFilter.connect(disGain);
    disGain.connect(masterGain);
    dissonant1.start();
    dissonant2.start();
    disGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 8);

    // Slow LFO on filter for breathing effect
    const breathLfo = ctx.createOscillator();
    const breathGain = ctx.createGain();
    breathLfo.type = 'sine';
    breathLfo.frequency.value = 0.08;
    breathGain.gain.value = 40;
    breathLfo.connect(breathGain);
    breathGain.connect(disFilter.frequency);
    breathLfo.start();

    // Metallic resonance ping (random intervals)
    function schedulePing() {
      const delay = 5000 + Math.random() * 15000;
      setTimeout(() => {
        if (!isInitialized) return;
        const ping = ctx.createOscillator();
        const pingGain = ctx.createGain();
        const pingFilter = ctx.createBiquadFilter();

        ping.type = 'sine';
        ping.frequency.value = 2000 + Math.random() * 3000;

        pingFilter.type = 'bandpass';
        pingFilter.frequency.value = ping.frequency.value;
        pingFilter.Q.value = 30;

        pingGain.gain.value = 0.02 + Math.random() * 0.03;

        ping.connect(pingFilter);
        pingFilter.connect(pingGain);
        pingGain.connect(masterGain);
        ping.start();

        pingGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
        ping.stop(ctx.currentTime + 2);

        schedulePing();
      }, delay);
    }
    schedulePing();

    // Distant rumble / machine groan (random)
    function scheduleGroan() {
      const delay = 8000 + Math.random() * 20000;
      setTimeout(() => {
        if (!isInitialized) return;
        const groan = ctx.createOscillator();
        const groanGain = ctx.createGain();

        groan.type = 'triangle';
        groan.frequency.value = 25 + Math.random() * 15;

        groanGain.gain.value = 0;

        groan.connect(groanGain);
        groanGain.connect(masterGain);
        groan.start();

        const dur = 2 + Math.random() * 3;
        groanGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + dur * 0.3);
        groanGain.gain.linearRampToValueAtTime(0, ctx.currentTime + dur);
        groan.stop(ctx.currentTime + dur + 0.1);

        scheduleGroan();
      }, delay);
    }
    scheduleGroan();
  }

  return {
    init,
    startDrone,
    playTick,
    playStatic,
    playTinnitus,
    playImpact,
    setIntensity,
    setIntensity,
    speakText,
    startSpeechDrone,
    stopSpeechDrone,
    startBackgroundHorror
  };
})();

