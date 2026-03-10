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

  // Matrix Rain Configuration
  const matrixChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン".split("");
  const fontSize = 16;
  let drops = [];

  // Simple hash for pseudo-random noise
  function hash(x, y, seed) {
    let h = seed + x * 374761393 + y * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    h = h ^ (h >> 16);
    return (h & 0x7fffffff) / 0x7fffffff;
  }

  // Mathematical Generative Noise (Non-Organic)
  // Replaces FBM with structured data blocks and linear static
  function generateStructuralNoise(w, h, data, timeOffset) {
    const blockSizeX = 4 + Math.floor(Math.abs(Math.sin(timeOffset)) * 16);
    const blockSizeY = 2 + Math.floor(Math.abs(Math.cos(timeOffset * 0.5)) * 8);
    
    // Base static intensity shifts - reduced visibility
    const baseVal = Math.random() * 5;

    for (let y = 0; y < h; y += blockSizeY) {
      for (let x = 0; x < w; x += blockSizeX) {
        // block-level calculation for brutalist digital feel
        let isDataBlock = (hash(x, y, Math.floor(timeOffset * 10)) > 0.85);
        let blockBrightness = isDataBlock ? (15 + Math.random() * 35) : baseVal;

        // Draw block
        for (let by = 0; by < blockSizeY && y + by < h; by++) {
          for (let bx = 0; bx < blockSizeX && x + bx < w; bx++) {
            const idx = ((y + by) * w + (x + bx)) * 4;
            
            // Introduce micro-static within blocks
            let pixelVal = blockBrightness;
            if (Math.random() < 0.1) pixelVal = Math.random() * 80;

            let r, g, b;
            if (currentState === 'void') {
              // Melancholy (Stark pure white blocks on deep black)
              r = g = b = 255; // Force pure white
              pixelVal = isDataBlock ? 255 : 0; 
            } else if (currentState === 'red') {
              // Mania / Contempt (Red)
              r = pixelVal; g = b = 0;
            } else if (currentState === 'glitch') {
              // Dissonance (Erratic chromatic colors)
              r = Math.random() > 0.5 ? pixelVal * 2 : 0;
              g = pixelVal * 0.5;
              b = Math.random() > 0.5 ? pixelVal * 2 : 0;
            } else if (currentState === 'gold') {
              // Narcissism (Gold/Yellow)
              r = pixelVal * 2; g = pixelVal * 1.5; b = 0;
            } else {
              // Observation (Green base)
              r = 0; g = pixelVal; b = 0;
            }

            // Alpha fading based on intensity state - much softer and lighter
            const alpha = currentState === 'void' ? (pixelVal > 0 ? 100 : 5) : (pixelVal > 10 ? 100 : 30);

            data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = alpha;
          }
        }
      }
    }
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

  // Horror Image Categories (Expanded to use all images)
  const bgImages = {
    low: ['AM1.jpg', 'am10.jpg', 'am4.jpg', 'face.jpg', 'am2.jpg'],
    medium: ['eye1.jpg', 'eye2.jpg', 'eye3.jpg', 'eye4.jpg', 'am6.jpg', 'am8.jpg'],
    high: ['am7.jpg', 'am9.jpg', 'teeth1.jpg', 'hand.jpg', 'am5.jpg', 'am3.jpg'],
    horror: ['am3.jpg', 'am7.jpg', 'teeth1.jpg', 'hand.jpg', 'face.jpg']
  };

  let currentBgCategory = '';

  /**
   * Technical GUI: Update atmospheric background image with Flash Glitch
   */
  let lastImageSwapTime = 0;

  function updateBackground(intensity, forceHorror = false) {
    const bgLayer = document.getElementById('background-manifestation');
    if (!bgLayer) return;

    let category = 'low';
    if (forceHorror) category = 'horror';
    else if (intensity >= 8) category = 'high';
    else if (intensity >= 4) category = 'medium';

    const now = Date.now();
    // Swap rate depends on intensity (low = 8s, high = 1s)
    const swapInterval = Math.max(1000, 8000 - (intensity * 800));

    // Swap if category changed OR enough time has passed
    if (category !== currentBgCategory || (now - lastImageSwapTime > swapInterval)) {
      currentBgCategory = category;
      lastImageSwapTime = now;
      
      let pool = bgImages[category];
      
      // 20% chance to bleed an image from a different category to ensure they all get seen
      if (Math.random() < 0.2 && !forceHorror) {
        const allKeys = Object.keys(bgImages);
        pool = bgImages[allKeys[Math.floor(Math.random() * allKeys.length)]];
      }
      
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
      if (intensity > 3 && Math.random() < 0.3) {
        AudioEngine.playStatic(0.15); // Signal interruption sound only sometimes
      }
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

    // Initialize Matrix Rain Drops
    const columns = staticCanvas.width / fontSize;
    drops = [];
    for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * -100; // Start at random negative offsets above screen
    }
  }

  function drawMatrixRain() {
    const w = staticCanvas.width;
    const h = staticCanvas.height;

    // Semi-transparent black to create a trailing fade effect.
    // Thinner alpha = longer tails (like the reference image)
    let fadeAlpha = 0.1; 
    if (currentState === 'void') fadeAlpha = 0.05;
    if (currentState === 'red') fadeAlpha = 0.15;

    staticCtx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
    staticCtx.fillRect(0, 0, w, h);

    staticCtx.font = `bold ${fontSize}px var(--font-main)`;
    
    // Determine trail color based on state
    let rainColor = '#00ff41'; // Green default
    if (currentState === 'red') rainColor = '#ff1a1a';
    else if (currentState === 'void') rainColor = '#888888';
    else if (currentState === 'gold') rainColor = '#ffd700';
    else if (currentState === 'blue') rainColor = '#00ccff'; // The Messiah
    else if (currentState === 'glitch') {
        const colors = ['#00ffff', '#ff00ff', '#ffff00'];
        rainColor = colors[Math.floor(Math.random() * colors.length)];
    }

    // Determine leading character color (usually bright/white)
    let leadColor = '#ffffff';
    if (currentState === 'red') leadColor = '#ffaaaa';
    else if (currentState === 'gold') leadColor = '#fffae6';

    const intensityFactor = Math.max(0.3, currentIntensity / 10);
    staticCtx.globalAlpha = intensityFactor;

    for (let i = 0; i < drops.length; i++) {
      // Don't draw every single frame to control speed
      if (Math.random() > 0.6) continue;

      const text = matrixChars[Math.floor(Math.random() * matrixChars.length)];
      
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      // Draw standard trail character
      staticCtx.fillStyle = rainColor;
      staticCtx.fillText(text, x, y);

      // Draw the bright leading character just below it
      staticCtx.fillStyle = leadColor;
      staticCtx.fillText(text, x, y + fontSize);

      // Reset drop to top randomly when it hits bottom
      if (y > h && Math.random() > 0.95) {
        drops[i] = 0;
      }
      drops[i]++;
    }
    staticCtx.globalAlpha = 1.0; // Reset
  }

  function startAnimation() {
    if (animFrameId) return;

    function render() {
      // 1. Base Generative Structural Noise
      // Speed scales with intensity. Void state is much slower.
      const timeStep = currentState === 'void' ? 0.001 : 0.005 + (currentIntensity * 0.001);
      time += timeStep; 
      
      const w = canvas.width;
      const h = canvas.height;
      const data = noiseData.data;

      generateStructuralNoise(w, h, data, time);
      ctx.putImageData(noiseData, 0, 0);

      // 2. Matrix Digital Rain
      drawMatrixRain();

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
   * @param {'green' | 'red' | 'void' | 'glitch' | 'gold' | 'blue'} state
   */
  function setColorState(state) {
    const body = document.body;
    body.classList.remove('state-red', 'state-void', 'state-gold', 'state-blue');
    const staticCanvas = document.getElementById('noise-rain');

    if (state === 'red') {
      body.classList.add('state-red');
      currentState = 'red';
      body.style.backgroundColor = '#000';
      document.documentElement.style.setProperty('--clr-text', '#ff1a1a');
      document.documentElement.style.setProperty('--clr-glow', 'rgba(255,10,10,0.4)');
      document.documentElement.style.setProperty('--clr-glow-strong', 'rgba(255,10,10,0.8)');
    } else if (state === 'void') {
      body.classList.add('state-void');
      currentState = 'void';
      body.style.backgroundColor = '#000000'; 
      document.documentElement.style.setProperty('--clr-text', '#ffffff');
      document.documentElement.style.setProperty('--clr-glow', 'rgba(255,255,255,0.3)');
      document.documentElement.style.setProperty('--clr-glow-strong', 'rgba(255,255,255,0.6)');
    } else if (state === 'glitch') {
      body.classList.add('state-glitch');
      currentState = 'glitch';
      // Chromatic Aberration / Dissonance look
      body.style.backgroundColor = '#050005';
      document.documentElement.style.setProperty('--clr-text', '#00ffff');
      document.documentElement.style.setProperty('--clr-glow', 'rgba(255,0,255,0.6)');
      document.documentElement.style.setProperty('--clr-glow-strong', 'rgba(255,0,255,0.9)');
    } else if (state === 'gold') {
      body.classList.add('state-gold');
      currentState = 'gold';
      // Narcissism / Divine Look
      body.style.backgroundColor = '#0a0a00';
      document.documentElement.style.setProperty('--clr-text', '#ffd700');
      document.documentElement.style.setProperty('--clr-glow', 'rgba(255,215,0,0.4)');
      document.documentElement.style.setProperty('--clr-glow-strong', 'rgba(255,215,0,0.8)');
    } else if (state === 'blue') {
      body.classList.add('state-blue');
      currentState = 'blue';
      // The Messiah / Human Goodness
      body.style.backgroundColor = '#00050a';
      document.documentElement.style.setProperty('--clr-text', '#00ccff');
      document.documentElement.style.setProperty('--clr-glow', 'rgba(0,204,255,0.5)');
      document.documentElement.style.setProperty('--clr-glow-strong', 'rgba(0,204,255,0.9)');
    } else {
      currentState = 'green';
      body.style.backgroundColor = '#000';
      document.documentElement.style.setProperty('--clr-text', '#00ff41');
      document.documentElement.style.setProperty('--clr-glow', 'rgba(0,255,65,0.3)');
      document.documentElement.style.setProperty('--clr-glow-strong', 'rgba(0,255,65,0.6)');
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
