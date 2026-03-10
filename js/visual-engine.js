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

  // 1-Bit Necrotic Noise: High-contrast dithered structures
  function generateNecroticNoise(w, h, data, timeOffset) {
    const intensity = currentIntensity * 0.1;
    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % w;
      const y = Math.floor((i / 4) / w);
      
      // Animated organic noise (vein-like)
      const n1 = hash(x * 0.1, y * 0.1, Math.floor(timeOffset * 0.5));
      const n2 = hash(x * 0.02, y * 0.02, Math.floor(timeOffset * 0.2));
      
      // Combine for organic 'rot'
      let val = (n1 * 0.7 + n2 * 0.3);
      
      // 1-Bit Dithering (Ordered Dither approximation)
      const threshold = ( (x % 2) + (y % 2) * 2 ) * 0.25;
      const bit = val > (0.5 + intensity + threshold) ? 255 : 0;
      
      data[i] = bit;     // R
      data[i+1] = bit * 0.8; // G (Slightly sickly green/amber)
      data[i+2] = bit * 0.5; // B
      data[i+3] = bit > 0 ? 40 : 0; // Alpha
    }
  }

  // Biological Rot: Veins/Decay
  function drawBiologicalRot(tCtx, w, h) {
    tCtx.strokeStyle = 'rgba(255, 40, 0, 0.4)';
    tCtx.lineWidth = 1;
    for(let i=0; i<10; i++) {
        tCtx.beginPath();
        let x = Math.random() * w;
        let y = Math.random() * h;
        tCtx.moveTo(x, y);
        for(let j=0; j<20; j++) {
            x += (Math.random() - 0.5) * 40;
            y += (Math.random() - 0.5) * 40;
            tCtx.lineTo(x, y);
        }
        tCtx.stroke();
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
    low: ['AM1.jpg', 'am10.jpg', 'am4.jpg', 'face.jpg', 'am2.jpg', 'face2.jpg'],
    medium: ['eye1.jpg', 'eye2.jpg', 'eye3.jpg', 'eye4.jpg', 'am6.jpg', 'am8.jpg', 'am11.jpg'],
    high: ['am7.jpg', 'am9.jpg', 'teeth1.jpg', 'hand.jpg', 'am5.jpg', 'am3.jpg'],
    horror: ['am3.jpg', 'am7.jpg', 'teeth1.jpg', 'hand.jpg', 'face.jpg', 'face2.jpg']
  };

  // State-specific GIF backgrounds
  const stateGifs = {
    red: ['red_glitch.gif', 'gtitch_face.gif'],
    void: ['void glitch.gif'],
    blue: ['blue_am.gif'],
    gold: ['am.gif', 'am9.jpg', 'am11.jpg'],
    glitch: ['body_glitch.gif', 'body_glitch2.gif', 'am.gif']
  };

  let currentBgCategory = '';
  let currentStateGif = '';

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
    // Swap rate depends on intensity (low = 10s, high = 0.5s)
    const swapInterval = Math.max(500, 10000 - (intensity * 950));

    // Priority 1: State-specific GIFs for intense states
    const hasStateGif = stateGifs[currentState];
    const shouldShowGif = hasStateGif && (intensity >= 5 || forceHorror || Math.random() < 0.2);

    if (shouldShowGif) {
      const pool = stateGifs[currentState];
      const gif = pool[Math.floor(Math.random() * pool.length)];
      
      if (gif !== currentStateGif || (now - lastImageSwapTime > swapInterval)) {
        currentStateGif = gif;
        lastImageSwapTime = now;
        
        bgLayer.classList.remove('flash-glitch-active');
        void bgLayer.offsetWidth; // Force reflow
        
        bgLayer.style.backgroundImage = `url('images/${gif}')`;
        
        let filter = 'grayscale(0.8) contrast(150%) brightness(0.8)';
        if (currentState === 'red' || currentState === 'glitch') {
          filter = `grayscale(0.3) contrast(${150 + intensity * 20}%) brightness(${1.0 + intensity * 0.05})`;
        } else if (currentState === 'gold') {
          filter = `sepia(1) saturate(3) contrast(150%) brightness(${1.0 + intensity * 0.05})`;
        }

        bgLayer.style.filter = filter;
        bgLayer.style.opacity = intensity >= 8 ? '0.45' : '0.2';
        bgLayer.classList.add('flash-glitch-active');

        // Extra chaos at intensity 10
        if (intensity >= 10 && Math.random() < 0.4) {
             triggerDigitalGlitch(true);
             setTimeout(() => triggerDigitalGlitch(false), 300);
        }
      }
      return;
    }

    // Priority 2: Standard JPG logic
    if (category !== currentBgCategory || (now - lastImageSwapTime > swapInterval)) {
      currentBgCategory = category;
      lastImageSwapTime = now;
      currentStateGif = ''; // Reset gif tracking when falling back to JPGs
      
      let pool = bgImages[category];
      
      // 20% chance to bleed an image from a different category
      if (Math.random() < 0.2 && !forceHorror) {
        const allKeys = Object.keys(bgImages);
        pool = bgImages[allKeys[Math.floor(Math.random() * allKeys.length)]];
      }
      
      const img = pool[Math.floor(Math.random() * pool.length)];
      
      bgLayer.classList.remove('flash-glitch-active');
      void bgLayer.offsetWidth;
      
      bgLayer.style.backgroundImage = `url('images/${img}')`;
      bgLayer.style.filter = category === 'horror' 
        ? 'grayscale(1) contrast(300%) brightness(1.1) sepia(1)' 
        : 'grayscale(1) contrast(180%) brightness(0.9)';
      bgLayer.style.opacity = category === 'horror' ? '0.22' : '0.15';
      
      bgLayer.classList.add('flash-glitch-active');
      if (intensity > 3 && Math.random() < 0.3) {
        AudioEngine.playStatic(0.15);
      }
    }
  }

  function resize() {
    // Use lower resolution for necrotic noise performance
    const scale = 0.5; 
    canvas.width = window.innerWidth * scale;
    canvas.height = window.innerHeight * scale;
    canvas.style.opacity = '1.0'; // Enable noise layer
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
    
    let rainColor = '#00ff41'; // Terminal Green for Observation
    if (currentState === 'green') rainColor = '#00ff41';
    else if (currentState === 'red') rainColor = '#e81900';
    else if (currentState === 'void') rainColor = '#6a6055';
    else if (currentState === 'gold') rainColor = '#f5c518';
    else if (currentState === 'blue') rainColor = '#7099dd';
    else if (currentState === 'glitch') {
        const colors = ['#f0903a', '#f5c518', '#e81900', '#00ff41', '#7099dd'];
        rainColor = colors[Math.floor(Math.random() * colors.length)];
    }

    let leadColor = '#d0ffd0';
    if (currentState === 'green') leadColor = '#d0ffd0';
    else if (currentState === 'red') leadColor = '#ffaaaa';
    else if (currentState === 'gold') leadColor = '#fff8d0';
    else if (currentState === 'void') leadColor = '#d8d0c0';
    else if (currentState === 'blue') leadColor = '#99bbff';

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

      generateNecroticNoise(w, h, data, time);
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
    // Clear ALL previous state classes
    body.classList.remove('state-green', 'state-red', 'state-void', 'state-glitch', 'state-gold', 'state-blue');

    if (state === 'red') {
      body.classList.add('state-red');
      currentState = 'red';
      body.style.backgroundColor = '#060000';
      document.documentElement.style.setProperty('--clr-text', '#ff2b00');
      document.documentElement.style.setProperty('--clr-glow', 'rgba(255,43,0,0.5)');
      document.documentElement.style.setProperty('--clr-glow-strong', 'rgba(255,43,0,0.9)');
    } else if (state === 'void') {
      body.classList.add('state-void');
      currentState = 'void';
      body.style.backgroundColor = '#04070a';
      document.documentElement.style.setProperty('--clr-text', '#c8c4b0');
      document.documentElement.style.setProperty('--clr-glow', 'rgba(200,196,176,0.25)');
      document.documentElement.style.setProperty('--clr-glow-strong', 'rgba(200,196,176,0.6)');
    } else if (state === 'glitch') {
      body.classList.add('state-glitch');
      currentState = 'glitch';
      body.style.backgroundColor = '#03060a';
      document.documentElement.style.setProperty('--clr-text', '#ff7a20');
      document.documentElement.style.setProperty('--clr-glow', 'rgba(255,122,32,0.55)');
      document.documentElement.style.setProperty('--clr-glow-strong', 'rgba(255,122,32,0.95)');
    } else if (state === 'gold') {
      body.classList.add('state-gold');
      currentState = 'gold';
      body.style.backgroundColor = '#07060a';
      document.documentElement.style.setProperty('--clr-text', '#f5c518');
      document.documentElement.style.setProperty('--clr-glow', 'rgba(245,197,24,0.45)');
      document.documentElement.style.setProperty('--clr-glow-strong', 'rgba(245,197,24,0.9)');
    } else if (state === 'blue') {
      body.classList.add('state-blue');
      currentState = 'blue';
      body.style.backgroundColor = '#000810';
      document.documentElement.style.setProperty('--clr-text', '#7099dd');
      document.documentElement.style.setProperty('--clr-glow', 'rgba(80,130,220,0.3)');
      document.documentElement.style.setProperty('--clr-glow-strong', 'rgba(80,130,220,0.7)');
    } else {
      // green — Cold Observation (default state)
      body.classList.add('state-green');
      currentState = 'green';
      body.style.backgroundColor = '#020604';
      document.documentElement.style.setProperty('--clr-text', '#00ff41');
      document.documentElement.style.setProperty('--clr-glow', 'rgba(0,255,65,0.35)');
      document.documentElement.style.setProperty('--clr-glow-strong', 'rgba(0,255,65,0.8)');
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
        if (level >= 8) node.style.boxShadow = '0 0 10px #ff2b00';
      } else {
        node.classList.remove('active');
        node.style.boxShadow = 'none';
      }
    });

    // Intense visual shifts
    if (level >= 9) {
      document.body.classList.add('visual-hysteria');
    } else {
      document.body.classList.remove('visual-hysteria');
    }

    // Chromatic aberration intensity
    document.documentElement.style.setProperty('--glitch-intensity', `${level * 0.1}`);
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
    const dreadGifs = ['eye5.gif', 'eye6.gif', 'heart.gif', 'gtitch_face.gif'];
    
    const flashInterval = setInterval(() => {
      if (flashCount > 5) {
        clearInterval(flashInterval);
        overlay.classList.add('hidden');
        overlay.style.backgroundColor = 'rgba(0,0,0,0.85)';
        overlay.style.filter = 'none';
        img.src = '';
        return;
      }

      // Mix procedural and GIFs
      if (Math.random() < 0.6) {
        const gif = dreadGifs[Math.floor(Math.random() * dreadGifs.length)];
        img.src = `images/${gif}`;
      } else {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 128;
        tempCanvas.height = 128;
        const tCtx = tempCanvas.getContext('2d');
        const r = Math.random();
        if (r < 0.3) drawDistortedFace(tCtx, 128, 128);
        else if (r < 0.6) drawStaringEye(tCtx, 128, 128);
        else drawNoise(tCtx, 128, 128);
        img.src = tempCanvas.toDataURL();
      }

      overlay.classList.remove('hidden');
      overlay.style.backgroundColor = Math.random() < 0.5 ? '#fff' : '#000';
      overlay.style.filter = `invert(${Math.random() < 0.5 ? 1 : 0}) contrast(500%)`;

      AudioEngine.playStatic(0.1);
      
      flashCount++;
    }, 50); 
  }

  function flashImage(type = 'noise') {
    const overlay = document.getElementById('flash-overlay');
    const img = document.getElementById('flash-image');
    if (!overlay) return;

    // Use new GIFs if available for the type
    if (type === 'eye' && Math.random() < 0.7) {
      const eyeGifs = ['eye5.gif', 'eye6.gif'];
      img.src = `images/${eyeGifs[Math.floor(Math.random() * eyeGifs.length)]}`;
    } else if (type === 'heart') {
      img.src = 'images/heart.gif';
    } else if (type === 'hand' && Math.random() < 0.4) {
       img.src = 'images/hand.jpg'; // Keep static hand for variety or find a hand gif
    } else {
      // Procedural fallback
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 256;
      tempCanvas.height = 256;
      const tCtx = tempCanvas.getContext('2d');

      if (type === 'eye') drawStaringEye(tCtx, 256, 256);
      else if (type === 'hand') drawReachingHand(tCtx, 256, 256);
      else drawDistortedFace(tCtx, 256, 256);

      img.src = tempCanvas.toDataURL();
    }

    overlay.classList.remove('hidden');
    overlay.style.filter = Math.random() < 0.3 ? 'invert(1) contrast(200%)' : 'none';

    AudioEngine.playStatic(0.2);
    AudioEngine.playImpact();
    setTimeout(() => {
      overlay.classList.add('hidden');
      overlay.style.filter = 'none';
      img.src = ''; // Clear src
    }, 150);
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
    tCtx.strokeStyle = 'rgba(255, 102, 0, 0.35)';
    tCtx.lineWidth = 2;
    tCtx.beginPath();
    tCtx.ellipse(w / 2, h / 2, 60, 80, 0, 0, Math.PI * 2);
    tCtx.stroke();

    // Hollow eyes
    tCtx.fillStyle = '#000';
    tCtx.fillRect(w / 2 - 30, h / 2 - 20, 20, 12);
    tCtx.fillRect(w / 2 + 10, h / 2 - 20, 20, 12);

    // Eye glow
    tCtx.fillStyle = 'rgba(255, 102, 0, 0.6)';
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
    tCtx.strokeStyle = 'rgba(255, 102, 0, 0.45)';
    tCtx.lineWidth = 2;
    tCtx.beginPath();
    tCtx.ellipse(w / 2, h / 2, 80, 50, 0, 0, Math.PI * 2);
    tCtx.stroke();

    // Iris
    tCtx.strokeStyle = 'rgba(255, 204, 0, 0.6)';
    tCtx.beginPath();
    tCtx.arc(w / 2, h / 2, 30, 0, Math.PI * 2);
    tCtx.stroke();

    // Pupil
    tCtx.fillStyle = '#000';
    tCtx.beginPath();
    tCtx.arc(w / 2, h / 2, 15, 0, Math.PI * 2);
    tCtx.fill();

    // Pupil highlight
    tCtx.fillStyle = 'rgba(255, 102, 0, 0.9)';
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
    tCtx.strokeStyle = 'rgba(255, 102, 0, 0.4)';
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
