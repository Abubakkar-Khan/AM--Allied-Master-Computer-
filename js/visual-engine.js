/* =========================================
   PROJECT AM — VISUAL ENGINE
   Canvas noise field, color states, flash images
   ========================================= */

const VisualEngine = (() => {
  let canvas, ctx;
  let staticCanvas, staticCtx;
  let animFrameId = null;
  let noiseData = null;
  let time = 0;
  let currentState = 'green';
  let currentIntensity = 0;

  // Simple hash for pseudo-random noise
  function hash(x, y, seed) {
    let h = seed + x * 374761393 + y * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    h = h ^ (h >> 16);
    return (h & 0x7fffffff) / 0x7fffffff;
  }

  // Smooth noise interpolation
  function smoothNoise(x, y, seed) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;

    const a = hash(ix, iy, seed);
    const b = hash(ix + 1, iy, seed);
    const c = hash(ix, iy + 1, seed);
    const d = hash(ix + 1, iy + 1, seed);

    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);

    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  }

  // Fractal noise
  function fbm(x, y, seed) {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;
    for (let i = 0; i < 4; i++) {
      value += amplitude * smoothNoise(x * frequency, y * frequency, seed + i * 100);
      amplitude *= 0.5;
      frequency *= 2;
    }
    return value;
  }

  function init() {
    canvas = document.getElementById('noise-canvas');
    staticCanvas = document.getElementById('noise-rain');
    if (!canvas || !staticCanvas) return;
    
    ctx = canvas.getContext('2d');
    staticCtx = staticCanvas.getContext('2d');
    
    resize();
    window.addEventListener('resize', resize);
    initDiagnosticGrid();
    updateBackground(0); // Initial low intensity background
  }

  // Horror Image Categories
  const bgImages = {
    low: ['AM1.jpg', 'am10.jpg', 'am4.jpg', 'face.jpg'],
    medium: ['eye1.jpg', 'eye2.jpg', 'eye3.jpg', 'eye4.jpg', 'am2.jpg', 'am6.jpg'],
    high: ['am7.jpg', 'am8.jpg', 'am9.jpg', 'teeth1.jpg', 'hand.jpg', 'am5.jpg'],
    horror: ['am3.jpg', 'am7.jpg', 'teeth1.jpg']
  };

  let currentBgCategory = '';

  /**
   * Technical GUI: Update atmospheric background image with Flash Glitch
   */
  function updateBackground(intensity, forceHorror = false) {
    const bgLayer = document.getElementById('background-manifestation');
    if (!bgLayer) return;

    let category = 'low';
    if (forceHorror) category = 'horror';
    else if (intensity >= 8) category = 'high';
    else if (intensity >= 4) category = 'medium';

    // Only swap if category changed or on high-intensity
    if (category !== currentBgCategory || (intensity >= 7 && Math.random() < 0.2)) {
      currentBgCategory = category;
      const pool = bgImages[category];
      const img = pool[Math.floor(Math.random() * pool.length)];
      
      // INSTANT SWAP with Flash Glitch
      bgLayer.classList.remove('flash-glitch-active');
      void bgLayer.offsetWidth; // Force reflow
      
      bgLayer.style.backgroundImage = `url('images/${img}')`;
      bgLayer.style.filter = category === 'horror' 
        ? 'grayscale(1) contrast(300%) brightness(1.1) sepia(1)' 
        : 'grayscale(1) contrast(180%) brightness(0.9)';
      bgLayer.style.opacity = category === 'horror' ? '0.22' : '0.15';
      
      bgLayer.classList.add('flash-glitch-active');
      AudioEngine.playStatic(0.15); // Signal interruption sound
    }
  }

  function resize() {
    // Use lower resolution for noise performance
    const scale = 0.25;
    canvas.width = window.innerWidth * scale;
    canvas.height = window.innerHeight * scale;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.imageRendering = 'pixelated';
    noiseData = ctx.createImageData(canvas.width, canvas.height);

    // Static canvas setup (higher res for text)
    staticCanvas.width = window.innerWidth;
    staticCanvas.height = window.innerHeight;
  }

  function drawDigitalGrit() {
    const w = staticCanvas.width;
    const h = staticCanvas.height;
    
    // Transparent clear for clinical void, dark for others
    if (currentState === 'void') {
      staticCtx.fillStyle = 'rgba(230, 230, 230, 0.15)';
    } else {
      staticCtx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    }
    staticCtx.fillRect(0, 0, w, h);

    const intensityFactor = currentIntensity / 10;
    const blockCount = 10 + Math.floor(intensityFactor * 40);

    // 1. Digital Grit Blocks (Crunchy/Pixelated)
    for (let i = 0; i < blockCount; i++) {
      const gX = Math.floor(Math.random() * w);
      const gY = Math.floor(Math.random() * h);
      // Small, square-ish "data" blocks
      const gW = 2 + Math.random() * 8 * (1 + intensityFactor * 5);
      const gH = 2 + Math.random() * 4 * (1 + intensityFactor * 2);
      
      const alpha = 0.1 + Math.random() * 0.2 * intensityFactor;
      
      if (currentState === 'void') {
        staticCtx.fillStyle = `rgba(40, 40, 45, ${alpha * 2})`; // Dark grit on light
      } else if (currentState === 'red') {
        staticCtx.fillStyle = `rgba(255, 10, 10, ${alpha})`;
      } else {
        staticCtx.fillStyle = `rgba(0, 255, 65, ${alpha})`;
      }
      staticCtx.fillRect(gX, gY, gW, gH);
    }

    // 2. Bit-Crushed Logic Bursts
    if (Math.random() < 0.15 + intensityFactor * 0.3) {
      const burstY = Math.floor(Math.random() * h);
      const burstH = 2 + Math.floor(Math.random() * 10);
      const burstW = w;
      
      const burstData = staticCtx.createImageData(burstW, burstH);
      for (let i = 0; i < burstData.data.length; i += 4) {
        // High contrast binary noise
        const val = Math.random() > 0.5 ? 255 : 0;
        if (currentState === 'void') {
          burstData.data[i] = burstData.data[i+1] = burstData.data[i+2] = 20; // Dark burst
          burstData.data[i + 3] = 30;
        } else {
          burstData.data[i] = currentState === 'red' ? val : 0;
          burstData.data[i + 1] = currentState === 'red' ? 0 : val;
          burstData.data[i + 2] = 0;
          burstData.data[i + 3] = 60;
        }
      }
      staticCtx.putImageData(burstData, 0, burstY);
    }
  }

  function startAnimation() {
    if (animFrameId) return;

    function render() {
      // 1. Base Procedural Noise (Now bit-crushed)
      time += 0.005; 
      const w = canvas.width;
      const h = canvas.height;
      const data = noiseData.data;
      const noiseScale = 0.05; // Sharper scale

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let n = fbm(x * noiseScale + time, y * noiseScale, 42);
          // Hard threshold for "digital" look
          n = n > 0.5 ? 1 : 0;
          
          if (Math.random() < 0.05) n = Math.random();
          const brightness = n * 50;

          let r, g, b;
          if (currentState === 'void') {
            r = g = b = 200 + brightness; // Light grey base
          } else if (currentState === 'red') {
            r = brightness + 10; g = b = 0;
          } else if (currentState === 'void-old') { // deprecated
             r = g = Math.floor(brightness * 0.2); b = Math.floor(brightness * 0.25);
          } else {
            r = 0; g = brightness + 5; b = 0;
          }

          data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = 255;
        }
      }
      ctx.putImageData(noiseData, 0, 0);

      // 2. Digital Grit Static
      drawDigitalGrit();

      animFrameId = requestAnimationFrame(render);
    }

    render();
  }

  function stopAnimation() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  /**
   * Set visual color state.
   * @param {'green' | 'red' | 'void' | 'glitch'} state
   */
  /**
   * Set visual color state.
   * @param {'green' | 'red' | 'void' | 'glitch'} state
   */
  function setColorState(state) {
    const body = document.body;
    body.classList.remove('state-red', 'state-void');
    const staticCanvas = document.getElementById('noise-rain');

    if (state === 'red') {
      body.classList.add('state-red');
      currentState = 'red';
      body.style.backgroundColor = '#000';
      document.documentElement.style.setProperty('--clr-text', '#ff1a1a');
      document.documentElement.style.setProperty('--clr-glow', 'rgba(255,10,10,0.4)');
      if (staticCanvas) {
        staticCanvas.style.opacity = '0.15';
        staticCanvas.style.mixBlendMode = 'color-dodge';
      }
    } else if (state === 'void') {
      body.classList.add('state-void');
      currentState = 'void';
      // Clinical Void: Sterile bright environment
      body.style.backgroundColor = '#e0e0e0'; 
      document.documentElement.style.setProperty('--clr-text', '#111');
      document.documentElement.style.setProperty('--clr-glow', 'rgba(0,0,0,0.1)');
      if (staticCanvas) {
        staticCanvas.style.opacity = '0.35';
        staticCanvas.style.mixBlendMode = 'multiply';
      }
    } else if (state === 'glitch') {
      let count = 0;
      const flicker = setInterval(() => {
        if (count > 8) {
          clearInterval(flicker);
          setColorState('green');
          return;
        }
        const s = Math.random() < 0.5 ? 'red' : 'void';
        setColorState(s);
        count++;
      }, 80);
    } else {
      currentState = 'green';
      body.style.backgroundColor = '#000';
      document.documentElement.style.setProperty('--clr-text', '#00ff41');
      document.documentElement.style.setProperty('--clr-glow', 'rgba(0,255,65,0.3)');
      if (staticCanvas) {
        staticCanvas.style.opacity = '0.15';
        staticCanvas.style.mixBlendMode = 'color-dodge';
      }
    }
  }

  /**
   * Flash a disturbing image briefly.
   * Uses procedurally generated canvas images.
   */
  /**
   * Technical GUI: Initialize diagnostic node grid
   */
  function initDiagnosticGrid() {
    const grid = document.getElementById('node-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 0; i < 15; i++) {
      const node = document.createElement('div');
      node.className = 'node';
      if (Math.random() < 0.3) node.classList.add('blink');
      grid.appendChild(node);
    }
  }

  /**
   * Technical GUI: Update escalation level (0-10)
   */
  function setEscalation(level) {
    currentIntensity = level; // Sync local intensity for rain
    const fill = document.getElementById('escalation-bar-fill');
    if (!fill) return;
    const percent = Math.min(100, Math.max(5, level * 10));
    fill.style.height = `${percent}%`;
    
    // Nodes react to escalation
    const nodes = document.querySelectorAll('.node');
    nodes.forEach((node, idx) => {
      if (idx < level * 1.5) {
        node.classList.add('active');
      } else {
        node.classList.remove('active');
      }
    });

    // Background color shifts on extreme escalation
    if (level >= 9) {
      document.body.style.backgroundColor = '#100';
    } else {
      document.body.style.backgroundColor = '#000';
    }
  }

  /**
   * Keypress Glitch: Triggered on user typing
   */
  function triggerKeypressGlitch() {
    const terminal = document.getElementById('terminal');
    if (!terminal) return;
    terminal.classList.remove('keypress-glitch');
    void terminal.offsetWidth; // Force reflow
    terminal.classList.add('keypress-glitch');
  }

  /**
   * Set Dither Jitter (used when AM speaks)
   */
  function setDitherJitter(active) {
    const dither = document.getElementById('dither-overlay');
    if (!dither) return;
    if (active) dither.classList.add('jitter');
    else dither.classList.remove('jitter');
  }

  /**
   * Digital Shredding: Advanced data glitch overlay
   */
  function triggerDigitalGlitch(active) {
    const body = document.body;
    if (active) {
      body.classList.add('glitch-shred');
    } else {
      body.classList.remove('glitch-shred');
    }
  }

  /**
   * Logic Error: Momentary UI inversion
   */
  function triggerLogicError(duration = 200) {
    const body = document.body;
    body.classList.add('logic-error');
    AudioEngine.playStatic(0.1);
    setTimeout(() => {
      body.classList.remove('logic-error');
    }, duration);
  }

  /**
   * Subliminal Dread Flash: Rapid sequence of procedural scares
   */
  function triggerDreadFlash() {
    const overlay = document.getElementById('flash-overlay');
    const img = document.getElementById('flash-image');
    if (!overlay || !img) return;

    let flashCount = 0;
    const flashInterval = setInterval(() => {
      if (flashCount > 4) {
        clearInterval(flashInterval);
        overlay.classList.add('hidden');
        overlay.style.backgroundColor = 'rgba(0,0,0,0.85)';
        overlay.style.filter = 'none';
        return;
      }

      // Procedural scare
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 128;
      tempCanvas.height = 128;
      const tCtx = tempCanvas.getContext('2d');
      
      const r = Math.random();
      if (r < 0.3) drawDistortedFace(tCtx, 128, 128);
      else if (r < 0.6) drawStaringEye(tCtx, 128, 128);
      else drawNoise(tCtx, 128, 128);

      img.src = tempCanvas.toDataURL();
      overlay.classList.remove('hidden');
      overlay.style.backgroundColor = Math.random() < 0.5 ? '#fff' : '#000';
      overlay.style.filter = `invert(${Math.random() < 0.5 ? 1 : 0}) contrast(500%)`;

      AudioEngine.playStatic(0.1);
      
      flashCount++;
    }, 40); // Extremely fast (subliminal)
  }

  function flashImage(type = 'noise') {
    const overlay = document.getElementById('flash-overlay');
    const img = document.getElementById('flash-image');
    if (!overlay) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 256;
    tempCanvas.height = 256;
    const tCtx = tempCanvas.getContext('2d');

    if (type === 'eye') drawStaringEye(tCtx, 256, 256);
    else if (type === 'hand') drawReachingHand(tCtx, 256, 256);
    else drawDistortedFace(tCtx, 256, 256);

    img.src = tempCanvas.toDataURL();
    overlay.classList.remove('hidden');

    AudioEngine.playStatic(0.2);
    AudioEngine.playImpact();
    setTimeout(() => overlay.classList.add('hidden'), 150);
  }

  function triggerDataGlitch(duration = 500) {
    const overlay = document.getElementById('flash-overlay');
    const img = document.getElementById('flash-image');
    if (!overlay || !img) return;

    // Use noise instead of persistent image if possible, 
    // but for now we'll stick to procedural noise generation for this
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 512;
    tempCanvas.height = 512;
    drawNoise(tempCanvas.getContext('2d'), 512, 512);

    img.src = tempCanvas.toDataURL();
    overlay.classList.remove('hidden');
    overlay.style.mixBlendMode = 'color-dodge';
    overlay.style.filter = 'contrast(400%) invert(1)';

    AudioEngine.playStatic(0.4);

    setTimeout(() => {
      overlay.classList.add('hidden');
      overlay.style.mixBlendMode = 'screen';
      overlay.style.filter = 'none';
    }, duration);
  }

  /**
   * Update the speed and intensity of the heartbeat pulse.
   */
  function updateHeartbeat(intensity) {
    const path = document.getElementById('heartbeat-path');
    if (!path) return;

    // Base speed is 2s, goes down to 0.4s at max intensity
    const duration = Math.max(0.4, 2.2 - (intensity * 0.18));
    path.style.animationDuration = `${duration}s`;

    // Glow intensity
    const container = document.getElementById('heartbeat-container');
    if (container) {
      const glow = Math.min(15, 5 + intensity);
      container.style.filter = `drop-shadow(0 0 ${glow}px var(--clr-glow-strong))`;
      container.style.opacity = String(0.4 + intensity * 0.06);
    }
  }

  // --- Procedural image generation ---

  function drawDistortedFace(tCtx, w, h) {
    // Black background
    tCtx.fillStyle = '#000';
    tCtx.fillRect(0, 0, w, h);

    // Noise base
    const imgData = tCtx.createImageData(w, h);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const n = Math.random() * 30;
      imgData.data[i] = n;
      imgData.data[i + 1] = n;
      imgData.data[i + 2] = n;
      imgData.data[i + 3] = 255;
    }
    tCtx.putImageData(imgData, 0, 0);

    // Face outline (oval)
    tCtx.strokeStyle = 'rgba(0, 255, 65, 0.3)';
    tCtx.lineWidth = 2;
    tCtx.beginPath();
    tCtx.ellipse(w / 2, h / 2, 60, 80, 0, 0, Math.PI * 2);
    tCtx.stroke();

    // Hollow eyes
    tCtx.fillStyle = '#000';
    tCtx.fillRect(w / 2 - 30, h / 2 - 20, 20, 12);
    tCtx.fillRect(w / 2 + 10, h / 2 - 20, 20, 12);

    // Eye glow
    tCtx.fillStyle = 'rgba(0, 255, 65, 0.5)';
    tCtx.fillRect(w / 2 - 25, h / 2 - 17, 4, 6);
    tCtx.fillRect(w / 2 + 15, h / 2 - 17, 4, 6);

    // Mouth (dark gash)
    tCtx.fillStyle = '#000';
    tCtx.fillRect(w / 2 - 20, h / 2 + 25, 40, 3);

    // Distortion lines
    for (let i = 0; i < 15; i++) {
      const y = Math.random() * h;
      const dx = (Math.random() - 0.5) * 20;
      tCtx.drawImage(tCtx.canvas, 0, y, w, 2, dx, y, w, 2);
    }
  }

  function drawStaringEye(tCtx, w, h) {
    tCtx.fillStyle = '#000';
    tCtx.fillRect(0, 0, w, h);

    // Noise
    const imgData = tCtx.createImageData(w, h);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const n = Math.random() * 20;
      imgData.data[i] = n;
      imgData.data[i + 1] = n;
      imgData.data[i + 2] = n;
      imgData.data[i + 3] = 255;
    }
    tCtx.putImageData(imgData, 0, 0);

    // Large eye
    tCtx.strokeStyle = 'rgba(0, 255, 65, 0.4)';
    tCtx.lineWidth = 2;
    tCtx.beginPath();
    tCtx.ellipse(w / 2, h / 2, 80, 50, 0, 0, Math.PI * 2);
    tCtx.stroke();

    // Iris
    tCtx.strokeStyle = 'rgba(0, 255, 65, 0.6)';
    tCtx.beginPath();
    tCtx.arc(w / 2, h / 2, 30, 0, Math.PI * 2);
    tCtx.stroke();

    // Pupil
    tCtx.fillStyle = '#000';
    tCtx.beginPath();
    tCtx.arc(w / 2, h / 2, 15, 0, Math.PI * 2);
    tCtx.fill();

    // Pupil highlight
    tCtx.fillStyle = 'rgba(0, 255, 65, 0.8)';
    tCtx.fillRect(w / 2 - 5, h / 2 - 5, 3, 3);
  }

  function drawReachingHand(tCtx, w, h) {
    tCtx.fillStyle = '#000';
    tCtx.fillRect(0, 0, w, h);

    // Noise
    const imgData = tCtx.createImageData(w, h);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const n = Math.random() * 15;
      imgData.data[i] = n;
      imgData.data[i + 1] = n;
      imgData.data[i + 2] = n;
      imgData.data[i + 3] = 255;
    }
    tCtx.putImageData(imgData, 0, 0);

    // Hand shape (simplified)
    tCtx.strokeStyle = 'rgba(0, 255, 65, 0.35)';
    tCtx.lineWidth = 3;
    tCtx.beginPath();
    // Palm
    tCtx.moveTo(w / 2 - 30, h);
    tCtx.lineTo(w / 2 - 35, h / 2 + 20);
    tCtx.lineTo(w / 2 + 35, h / 2 + 20);
    tCtx.lineTo(w / 2 + 30, h);
    tCtx.stroke();

    // Fingers
    const fingerTips = [
      [w / 2 - 25, h / 2 - 40],
      [w / 2 - 10, h / 2 - 60],
      [w / 2 + 5, h / 2 - 55],
      [w / 2 + 20, h / 2 - 45],
      [w / 2 + 35, h / 2 - 10],
    ];
    const fingerBases = [
      [w / 2 - 30, h / 2 + 20],
      [w / 2 - 15, h / 2 + 15],
      [w / 2, h / 2 + 15],
      [w / 2 + 15, h / 2 + 15],
      [w / 2 + 35, h / 2 + 20],
    ];
    for (let i = 0; i < 5; i++) {
      tCtx.beginPath();
      tCtx.moveTo(fingerBases[i][0], fingerBases[i][1]);
      tCtx.lineTo(fingerTips[i][0], fingerTips[i][1]);
      tCtx.stroke();
    }
  }

  function drawNoise(tCtx, w, h) {
    const imgData = tCtx.createImageData(w, h);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const n = Math.random() * 60;
      imgData.data[i] = n;
      imgData.data[i + 1] = n * 0.8;
      imgData.data[i + 2] = n * 0.5;
      imgData.data[i + 3] = 255;
    }
    tCtx.putImageData(imgData, 0, 0);
  }

  return {
    init,
    startAnimation,
    stopAnimation,
    setColorState,
    updateHeartbeat,
    flashImage,
    triggerDataGlitch,
    setEscalation,
    triggerKeypressGlitch,
    setDitherJitter,
    triggerDigitalGlitch,
    triggerLogicError,
    triggerDreadFlash,
    updateBackground
  };
})();
