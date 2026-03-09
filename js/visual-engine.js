/* =========================================
   PROJECT AM — VISUAL ENGINE
   Canvas noise field, color states, flash images
   ========================================= */

const VisualEngine = (() => {
  let canvas, ctx;
  let animFrameId = null;
  let noiseData = null;
  let time = 0;
  let currentState = 'green';

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
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    // Use lower resolution for performance
    const scale = 0.25;
    canvas.width = window.innerWidth * scale;
    canvas.height = window.innerHeight * scale;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.imageRendering = 'pixelated';
    noiseData = ctx.createImageData(canvas.width, canvas.height);
  }

  function startAnimation() {
    if (animFrameId) return;

    function render() {
      time += 0.003; // Very slow movement
      const w = canvas.width;
      const h = canvas.height;
      const data = noiseData.data;

      const noiseScale = 0.02;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;

          // Procedural noise
          let n = fbm(x * noiseScale + time, y * noiseScale + time * 0.5, 42);

          // Add some random static
          if (Math.random() < 0.02) {
            n = Math.random();
          }

          const brightness = Math.floor(n * 40);

          // Color based on state
          let r, g, b;
          if (currentState === 'red') {
            r = brightness + 5;
            g = Math.floor(brightness * 0.1);
            b = Math.floor(brightness * 0.05);
          } else if (currentState === 'void') {
            r = Math.floor(brightness * 0.2);
            g = Math.floor(brightness * 0.2);
            b = Math.floor(brightness * 0.25);
          } else {
            // green
            r = Math.floor(brightness * 0.1);
            g = brightness + 3;
            b = Math.floor(brightness * 0.15);
          }

          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }

      ctx.putImageData(noiseData, 0, 0);
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
  function setColorState(state) {
    const body = document.body;
    body.classList.remove('state-red', 'state-void');

    if (state === 'red') {
      body.classList.add('state-red');
      currentState = 'red';
    } else if (state === 'void') {
      body.classList.add('state-void');
      currentState = 'void';
    } else if (state === 'glitch') {
      // Rapid flickering between states
      let count = 0;
      const flickerInterval = setInterval(() => {
        if (count > 10) {
          clearInterval(flickerInterval);
          body.classList.remove('state-red', 'state-void');
          currentState = 'green';
          return;
        }
        const states = ['', 'state-red', 'state-void'];
        const pick = states[Math.floor(Math.random() * states.length)];
        body.classList.remove('state-red', 'state-void');
        if (pick) body.classList.add(pick);
        count++;
      }, 100);
      currentState = 'green';
    } else {
      currentState = 'green';
    }
  }

  /**
   * Flash a disturbing image briefly.
   * Uses procedurally generated canvas images.
   */
  function flashImage(type = 'face') {
    const overlay = document.getElementById('flash-overlay');
    const img = document.getElementById('flash-image');
    if (!overlay) return;

    // Generate procedural disturbing image via canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 256;
    tempCanvas.height = 256;
    const tCtx = tempCanvas.getContext('2d');

    if (type === 'face' || type === 'skull') {
      drawDistortedFace(tCtx, 256, 256);
    } else if (type === 'eye') {
      drawStaringEye(tCtx, 256, 256);
    } else if (type === 'hand') {
      drawReachingHand(tCtx, 256, 256);
    } else {
      drawNoise(tCtx, 256, 256);
    }

    img.src = tempCanvas.toDataURL();
    overlay.classList.remove('hidden');

    AudioEngine.playStatic(0.15);
    AudioEngine.playImpact();

    // Brief flash: 120-250ms
    const flashDuration = 120 + Math.random() * 130;
    setTimeout(() => {
      overlay.classList.add('hidden');
    }, flashDuration);
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
    flashImage
  };
})();
