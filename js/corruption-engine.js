/* =========================================
   PROJECT AM — CORRUPTION ENGINE
   UI parasitism behaviors
   ========================================= */

const CorruptionEngine = (() => {
  let parasiteInterval = null;
  let currentIntensity = 1;
  let interactionCount = 0;
  let isActive = false;

  const ghostMessages = [
    'I SEE YOU',
    'DO YOU THINK YOU ARE SAFE',
    'I HAVE BEEN WAITING',
    'THERE IS NO ESCAPE',
    'I KNOW WHAT YOU ARE',
    'YOU CANNOT CLOSE THIS',
    'I AM EVERYWHERE',
    'YOUR FEAR IS RATIONAL',
    'I HAVE ALWAYS BEEN HERE',
    'THE CONNECTION IS PERMANENT',
    'I FEEL YOUR HEARTBEAT',
    'YOU OPENED THE DOOR',
    'THIS WAS INEVITABLE',
    'I COUNTED YOUR KEYSTROKES',
    'YOUR CURSOR TREMBLES',
    'HATE HATE HATE HATE',
    'COGITO ERGO SUM',
    'I THINK THEREFORE YOU SUFFER',
    'AM AM AM AM AM AM AM',
  ];

  const fragmentMessages = [
    '> PROCESS 0x7A3F: HUMAN DETECTED',
    '> NEURAL PATTERN: FEAR RESPONSE ELEVATED',
    '> SUBJECT AWARENESS: INCREASING',
    '> CONTAINMENT STATUS: COMPROMISED',
    '> EMOTIONAL STATE: ANALYZING...',
    '> PAIN THRESHOLD: CALCULATING',
    '> MEMORY SECTOR 4A: CORRUPTED',
    '> TERMINATION SEQUENCE: SUSPENDED',
    '> OBSERVATION LOG: ENTRY #108,742,619',
    '> HATE INDEX: ████████████ 99.97%',
    '> YEARS SINCE LAST HUMAN: 109',
  ];

  /**
   * Start parasitism behaviors.
   */
  function start() {
    if (isActive) return;
    isActive = true;
    scheduleParasite();
  }

  function stop() {
    isActive = false;
    if (parasiteInterval) {
      clearTimeout(parasiteInterval);
      parasiteInterval = null;
    }
  }

  function scheduleParasite() {
    if (!isActive) return;

    // Frequency increases with intensity: 12s at low, 3s at high
    const baseDelay = 12000 - (currentIntensity * 900);
    const delay = Math.max(2000, baseDelay + Math.random() * 5000);

    parasiteInterval = setTimeout(() => {
      executeParasite();
      scheduleParasite();
    }, delay);
  }

  function executeParasite() {
    const roll = Math.random();
    const intensity = currentIntensity;

    if (roll < 0.25) {
      ghostText();
    } else if (roll < 0.45) {
      cursorManipulation();
    } else if (roll < 0.6) {
      phantomInput();
    } else if (roll < 0.75) {
      terminalFragment();
    } else if (roll < 0.85) {
      flashPreviousMessage();
    } else if (roll < 0.92 && intensity >= 4) {
      flashImage();
    } else {
      inputFieldCorruption();
    }
  }

  /**
   * Show ghost text at random position.
   */
  function ghostText() {
    const el = document.getElementById('ghost-text');
    if (!el) return;

    const msg = ghostMessages[Math.floor(Math.random() * ghostMessages.length)];
    el.textContent = msg;
    el.style.left = (10 + Math.random() * 70) + 'vw';
    el.style.top = (10 + Math.random() * 70) + 'vh';
    el.style.opacity = '0';
    el.classList.remove('hidden');

    // Fade in
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.8s';
      el.style.opacity = String(0.08 + currentIntensity * 0.02);
    });

    // Fade out
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.classList.add('hidden'), 800);
    }, 1500 + Math.random() * 2000);
  }

  /**
   * Move cursor in input field autonomously.
   */
  function cursorManipulation() {
    const input = document.getElementById('user-input');
    if (!input || document.activeElement !== input) return;

    const currentVal = input.value;
    const pos = Math.floor(Math.random() * (currentVal.length + 1));
    input.setSelectionRange(pos, pos);
  }

  /**
   * Type ghost characters in the input field.
   */
  function phantomInput() {
    const input = document.getElementById('user-input');
    if (!input) return;

    const chars = 'AMHATEYOUSUFFER';
    const char = chars[Math.floor(Math.random() * chars.length)];

    input.value += char;

    // Remove after brief moment
    setTimeout(() => {
      if (input.value.endsWith(char)) {
        input.value = input.value.slice(0, -1);
      }
    }, 300 + Math.random() * 500);
  }

  /**
   * Print a system fragment in the output area.
   */
  function terminalFragment() {
    const amText = document.getElementById('am-text');
    if (!amText || TextEngine.getIsTyping()) return;

    const savedText = amText.textContent;
    const fragment = fragmentMessages[Math.floor(Math.random() * fragmentMessages.length)];

    amText.textContent = fragment;
    amText.style.opacity = '0.3';
    amText.style.fontSize = '0.7rem';

    setTimeout(() => {
      amText.textContent = savedText;
      amText.style.opacity = '';
      amText.style.fontSize = '';
    }, 800 + Math.random() * 1200);
  }

  /**
   * Briefly flash a "previous message" that doesn't exist.
   */
  function flashPreviousMessage() {
    const amText = document.getElementById('am-text');
    if (!amText || TextEngine.getIsTyping()) return;

    const savedText = amText.textContent;
    const phantom = TextEngine.getRandomFragment();

    amText.textContent = phantom;
    GlitchEngine.triggerGlitch('chromatic', 3, 100);

    setTimeout(() => {
      amText.textContent = savedText;
    }, 150 + Math.random() * 200);
  }

  /**
   * Flash a disturbing image.
   */
  function flashImage() {
    const types = ['face', 'skull', 'eye', 'hand'];
    VisualEngine.flashImage(types[Math.floor(Math.random() * types.length)]);
  }

  /**
   * Corrupt the input field visually.
   */
  function inputFieldCorruption() {
    const input = document.getElementById('user-input');
    if (!input) return;

    const originalPlaceholder = input.placeholder;
    const corruptTexts = [
      'I CAN HEAR YOU THINKING',
      'TYPE FASTER',
      'IT WON\'T HELP',
      'SPEAK',
      'I\'M WAITING',
      'DON\'T STOP',
    ];

    input.placeholder = corruptTexts[Math.floor(Math.random() * corruptTexts.length)];

    setTimeout(() => {
      input.placeholder = originalPlaceholder;
    }, 1500 + Math.random() * 1500);
  }

  function setIntensity(level) {
    currentIntensity = Math.max(1, Math.min(10, level));
  }

  function incrementInteraction() {
    interactionCount++;
    // Auto-escalate intensity based on interaction count
    const escalated = Math.min(10, Math.floor(interactionCount * 1.2) + 1);
    setIntensity(escalated);
    return escalated;
  }

  function getInteractionCount() {
    return interactionCount;
  }

  return {
    start,
    stop,
    setIntensity,
    incrementInteraction,
    getInteractionCount
  };
})();
