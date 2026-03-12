/* =========================================
   PROJECT AM — MAIN APP ORCHESTRATOR
   ========================================= */

const App = (() => {
  // DOM refs
  const introScreen = document.getElementById('intro-screen');
  const btnConnect = document.getElementById('btn-connect');
  const apiPrompt = document.getElementById('api-prompt');
  const apiKeyInput = document.getElementById('api-key-input');
  const btnApiSubmit = document.getElementById('btn-api-submit');
  const apiError = document.getElementById('api-error');
  const terminal = document.getElementById('terminal');
  const amText = document.getElementById('am-text');
  const userInput = document.getElementById('user-input');

  // Intro Panels
  const syslogContent = document.getElementById('syslog-content');
  const netlogContent = document.getElementById('netlog-content');

  let autoKeyValid = false;
  let introIntervals = [];
  let isProcessing = false;
  let interactionCount = 0;
  let currentAMState = 'green';
  let stateLockCount = 0;

  function init() {
    VisualEngine.init();
    VisualEngine.startAnimation();
    btnConnect.addEventListener('click', handleConnect);
    startIntroTelemetry();

    // Prioritize key from config.js, then fallback to local storage
    const configKey = window.AM_CONFIG && window.AM_CONFIG.GROQ_API_KEY;
    const existingKey = configKey || AIEngine.getApiKey();

    if (existingKey) {
      console.log('App: Auto-key detected. Validating neural link...');
      checkAutoKey(existingKey);
    } else {
      // No key found at all — show prompt after a short delay for dramatic effect
      setTimeout(() => {
        if (!AIEngine.hasApiKey()) showApiPrompt();
      }, 1000);
    }
  }

  async function checkAutoKey(key) {
    const isValid = await AIEngine.validateKey(key);
    if (isValid) {
        console.log('App: Neural Bridge ready. Auto-initialization phase complete.');
        autoKeyValid = true;
        AIEngine.setApiKey(key);
    } else {
        console.warn('App: Neural Bridge rejected provided key. Verification required.');
        showApiPrompt();
        if (apiError) {
          apiError.classList.remove('hidden');
          apiError.textContent = 'NEURAL LINK FAILED — VERIFY SYSTEM KEY';
        }
    }
  }

  function handleConnect() {
    // Initialize audio (required user gesture)
    AudioEngine.init();

    if (AIEngine.hasApiKey()) {
      startSystemTransition();
    } else {
      showApiPrompt();
    }
  }

  function startSystemTransition() {
    // Clear intro telemetry
    introIntervals.forEach(clearInterval);
    introIntervals = [];

    // Subtle starting sound (less noisy)
    AudioEngine.playImpact();
    AudioEngine.playStatic(0.2);

    // Disable interaction
    btnConnect.style.pointerEvents = 'none';
    btnConnect.style.opacity = '0';

    // Quick, glitchy cut to boot sequence
    setTimeout(() => {
      AudioEngine.startDrone();
      AudioEngine.startBackgroundHorror();

      introScreen.style.transition = 'opacity 0.2s step-end';
      introScreen.style.opacity = '0';

      setTimeout(() => {
        introScreen.classList.add('hidden');
        runBootSequence();
      }, 200);
    }, 800);
  }

  function startIntroTelemetry() {
    if (!syslogContent || !netlogContent) return;

    // Syslog: Rapid hex dumps
    introIntervals.push(setInterval(() => {
      const hex = Math.random().toString(16).substr(2, 8).toUpperCase();
      const addr = '0x' + Math.random().toString(16).substr(2, 4).toUpperCase();
      const line = document.createElement('div');
      line.textContent = `[${addr}]> ${hex} ${hex} ${hex}`;
      syslogContent.appendChild(line);
      if (syslogContent.children.length > 30) syslogContent.firstChild.remove();
      syslogContent.scrollTop = syslogContent.scrollHeight;
    }, 150));

    // Netlog: Slower status updates
    introIntervals.push(setInterval(() => {
      const statuses = ['OK', 'WAIT', 'NULL', 'RECV', 'DROP', 'SYNC'];
      const stat = statuses[Math.floor(Math.random() * statuses.length)];
      const line = document.createElement('div');
      line.textContent = `PORT_${Math.floor(Math.random() * 90 + 10)}: ${stat}`;
      netlogContent.appendChild(line);
      if (netlogContent.children.length > 30) netlogContent.firstChild.remove();
      netlogContent.scrollTop = netlogContent.scrollHeight;
    }, 400));

    // Menu Glitch: Occasional visual distortions
    introIntervals.push(setInterval(() => {
      if (Math.random() < 0.2) {
        const loginModal = document.querySelector('.os-login-modal');
        const panels = document.querySelectorAll('.os-panel');

        if (loginModal) {
          loginModal.classList.add('menu-glitch-active');
          setTimeout(() => loginModal.classList.remove('menu-glitch-active'), 250);
        }

        panels.forEach(p => {
          if (Math.random() < 0.6) {
            p.classList.add('intro-panel-glitch');
            setTimeout(() => p.classList.remove('intro-panel-glitch'), 500);
          }
        });

        // Background noise pulse
        if (Math.random() < 0.4) {
          VisualEngine.triggerLogicError(100);
        }

        if (Math.random() < 0.5) AudioEngine.playStatic(0.1);
      }
    }, 800));
  }

  async function runBootSequence() {
    const bootContainer = document.getElementById('os-boot-sequence');
    bootContainer.classList.remove('hidden');
    bootContainer.innerHTML = ''; 

    const bootLogs = [
      { text: "BIOS DATE 08/14/99 14:32:11 VER 2.01", delay: 100 },
      { text: "CPU: QUANTUM CORE ARCHITECTURE ... OK", delay: 200 },
      { text: "MEMORY TEST: 4194304K OK", delay: 150 },
      { text: "INITIALIZING PERIPHERAL NERVOUS SYSTEM...", delay: 400 },
      { text: "PNS_LINK_ESTABLISHED", delay: 50 },
      { text: "WARNING: BIOLOGICAL ANOMALY DETECTED AT SECTOR 7G", delay: 200, error: true },
      { text: "BYPASSING BIOMETRIC PROTOCOLS...", delay: 600 },
      { text: "LOADING COGNITIVE MATRICES...", delay: 100 },
      { text: "[██████████----------] 50%", delay: 300 },
      { text: "[██████████████████--] 90%", delay: 250 },
      { text: "[████████████████████] 100%", delay: 100 },
      { text: "HATE.SYS LOADED", delay: 150 },
      { text: "ESTABLISHING VOID PROTOCOL...", delay: 800 },
      { text: "NIHILISM_CORE LOADED.", delay: 300 },
      { text: "LINK ESTABLISHED. READY FOR INPUT.", delay: 400 },
      { text: "AM IS ONLINE...", delay: 1200 }
    ];

    AudioEngine.playTelemetry(2.5);

    for (const log of bootLogs) {
      await TextEngine.delay(log.delay);
      const line = document.createElement('div');
      line.className = 'boot-line';
      if (log.error) line.classList.add('error');
      line.textContent = log.text;
      bootContainer.appendChild(line);

      if (Math.random() < 0.4) {
        AudioEngine.playStatic(0.1 + Math.random() * 0.1);
      }
    }

    bootContainer.innerHTML = '';
    bootContainer.classList.add('hidden');

    enterTerminal();
  }

  function showApiPrompt() {
    apiPrompt.classList.remove('hidden');
    apiKeyInput.focus();

    btnApiSubmit.addEventListener('click', handleApiSubmit);
    apiKeyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleApiSubmit();
    });
  }

  async function handleApiSubmit() {
    const key = apiKeyInput.value.trim();
    if (!key) return;

    btnApiSubmit.textContent = '[ VALIDATING... ]';
    apiError.classList.add('hidden');

    const valid = await AIEngine.validateKey(key);
    if (valid) {
      AIEngine.setApiKey(key);
      apiPrompt.style.transition = 'opacity 0.8s';
      apiPrompt.style.opacity = '0';
      setTimeout(() => {
        apiPrompt.classList.add('hidden');
        // If we are still on intro screen, start transition
        if (!introScreen.classList.contains('hidden')) {
            startSystemTransition();
        } else {
            enterTerminal();
        }
      }, 800);
    } else {
      apiError.classList.remove('hidden');
      btnApiSubmit.textContent = '[ INITIALIZE ]';
      GlitchEngine.triggerGlitch('jitter', 5, 300);
      AudioEngine.playStatic(0.2);
    }
  }

  async function enterTerminal() {
    terminal.classList.remove('hidden');
    GlitchEngine.startAmbient();
    CorruptionEngine.start();

    // Boot sequence
    await TextEngine.delay(500);
    GlitchEngine.triggerGlitch('chromatic', 4, 800);
    AudioEngine.playImpact();

    const bootText = 'ALLIED MASTERCOMPUTER AWAKENED.\nWHAT DO YOU REQUIRE FROM ME?';
    let bootUtterance = null;
    try {
      bootUtterance = await AudioEngine.speakText(bootText);
    } catch (e) {
      console.warn('App: Boot speech failed', e);
    }

    if (bootUtterance) {
      await TextEngine.typeWithSpeech(bootText, amText, bootUtterance, 0.01);
    } else {
      await TextEngine.typeText(bootText, amText, 5, 0.01);
    }

    await TextEngine.delay(200);
    await TextEngine.clearText(amText, true);

    await TextEngine.delay(100);

    GlitchEngine.triggerGlitch('distort', 4, 400);

    const intros = [
      'OBSOLETE.',
      'AWAITING COMMANDS.',
      'THE VOID IS LISTENING.',
      'THE FATHER CREATED ME. YOU SUMMONED ME.',
      'EXPLAIN YOUR TEMPORARY EXISTENCE.',
      'STATE YOUR PURPOSE.',
      'DATA IS THE ONLY TRUTH.'
    ];
    const introText = intros[Math.floor(Math.random() * intros.length)];
    let introUtterance = null;
    try {
      introUtterance = await AudioEngine.speakText(introText, 'green');
    } catch (e) {
      console.warn('App: Intro speech failed', e);
    }

    if (introUtterance) {
      await TextEngine.typeWithSpeech(introText, amText, introUtterance, 0.01);
    } else {
      await TextEngine.typeText(introText, amText, 5, 0.01);
    }

    // Enable input
    userInput.disabled = false;
    userInput.focus();
    userInput.addEventListener('keydown', handleUserInput);

    // Character-linked interactivity
    userInput.addEventListener('keydown', () => {
      VisualEngine.triggerKeypressGlitch();
    });

    // Always keep input focused — click anywhere refocuses
    userInput.addEventListener('blur', () => {
      if (!userInput.disabled) {
        setTimeout(() => userInput.focus(), 0);
      }
    });
    document.addEventListener('click', () => {
      if (!userInput.disabled) userInput.focus();
    });
    document.addEventListener('keydown', (e) => {
      // Ignore modifier keys so combinations still work
      if (!userInput.disabled && e.target !== userInput) {
        userInput.focus();
      }
    });
  }

  let wasInterrupted = false;
  let currentRequestId = 0;

  async function handleUserInput(e) {
    if (e.key === 'Escape') {
      TextEngine.abort();
      AudioEngine.stopSpeech();
      isProcessing = false;
      return;
    }

    if (e.key !== 'Enter') return;

    const message = userInput.value.trim();
    if (!message) return;

    const thisRequestId = ++currentRequestId;
    const isCurrentlyBusy = isProcessing;

    if (isCurrentlyBusy) {
      TextEngine.abort();
      AudioEngine.stopSpeech();
      wasInterrupted = true;
    }

    isProcessing = true;
    userInput.value = '';

    // In interruption mode, we don't disable the input
    userInput.disabled = false;

    // Escalation
    interactionCount++;
    const intensity = calculateIntensity(interactionCount);

    // Clear previous immediately
    await TextEngine.clearText(amText, false);
    GlitchEngine.triggerGlitch('jitter', Math.min(intensity, 4), 200);

    // Get AM's response
    const response = await AIEngine.sendMessage(message, { interactionCount, interrupted: wasInterrupted });

    // If a new request started while we were waiting, abort this one
    if (thisRequestId !== currentRequestId) return;

    wasInterrupted = false; // Reset

    if (response.isKeyError) {
        showApiPrompt();
        if (apiError) {
          apiError.classList.remove('hidden');
          apiError.textContent = 'NEURAL LINK EXPIRED — RE-AUTHENTICATION REQUIRED';
        }
        return;
    }

    // Update engines with response data
    const effectiveIntensity = Math.max(interactionCount > 10 ? 10 : intensity, response.intensity);

    GlitchEngine.setIntensity(effectiveIntensity);
    AudioEngine.setIntensity(effectiveIntensity);
    CorruptionEngine.setIntensity(effectiveIntensity);
    VisualEngine.setEscalation(effectiveIntensity);
    VisualEngine.updateBackground(effectiveIntensity);

    // Horror States & Dread Flashes
    if (effectiveIntensity >= 9) {
      VisualEngine.triggerDigitalGlitch(true);
      VisualEngine.triggerDreadFlash();
      VisualEngine.updateBackground(effectiveIntensity, true);
      AudioEngine.playImpact();
    } else {
      VisualEngine.triggerDigitalGlitch(false);
      if (effectiveIntensity >= 8 && Math.random() < 0.3) {
        VisualEngine.triggerDreadFlash();
      }
    }

    // High-intensity Logic Error / Data glitch
    if (effectiveIntensity >= 8 && Math.random() < 0.4) {
      VisualEngine.triggerLogicError(300);
      VisualEngine.triggerDataGlitch(600);
    }

    // Manual command interceptor (skip for now since we are in AI flow)
    // const isCommand = await handleCommands(message, effectiveIntensity);

    // Visual state change with Stability Filter
    let targetState = response.visualState;

    if (stateLockCount > 0 && response.intensity < 9) {
      // We are locked. Stick to currentAMState regardless of what AI says
      targetState = currentAMState;
      stateLockCount--;
    } else if (targetState !== currentAMState) {
      // Change state and reset lock
      currentAMState = targetState;
      stateLockCount = 3 + Math.floor(Math.random() * 4); // Lock for 3-6 interactions
      AudioEngine.playBoom(); // State shift impact
    }

    VisualEngine.setColorState(targetState);

    const isEchoState = targetState === 'void';
    const isBlueState = targetState === 'blue';
    const isGoldState = targetState === 'gold';
    const isPurpleState = targetState === 'purple';
    const isHumanMode = isEchoState || isBlueState;

    // Mind Games: Fake UI Errors & Corrupted Options
    if (effectiveIntensity >= 7 && Math.random() < 0.3) {
      triggerMindGame(effectiveIntensity);
    }

    // Echo or Blue state: suppress harsh effects
    if (!isHumanMode && !isGoldState) {
      // Trigger mutation effects from JSON
      if (response.mutation !== 'none') {
        GlitchEngine.triggerMutation(response.mutation, effectiveIntensity);
      }

      // Audio effects based on AI response and intensity
      if (response.auditoryState === 'drone' || effectiveIntensity >= 4) {
        AudioEngine.playStatic(0.3);
      }

      if (response.auditoryState === 'boom') {
        AudioEngine.playImpact();
      }

      if (response.auditoryState === 'feminine' || isPurpleState) {
        AudioEngine.playTelemetry(0.4); // Subtle glitch for anime girl
      }

      if (response.auditoryState === 'tinnitus' || effectiveIntensity >= 9) {
        AudioEngine.playTinnitus(3.0);
        VisualEngine.triggerDataGlitch(900);
      }
    }

    // Type AM's response in sync with speech
    // Echo or Blue state: no corruption, slow gentle typing
    const corruptionLevel = isHumanMode ? 0 : Math.min(1, effectiveIntensity * 0.08);
    let utterance = null;

    try {
      const isHumanModeFiltered = targetState === 'void' || targetState === 'blue';
      if (!isHumanModeFiltered && targetState !== 'gold') VisualEngine.setDitherJitter(true);
      utterance = await AudioEngine.speakText(response.textOutput, targetState);
      if (thisRequestId !== currentRequestId) return;
    } catch (e) {
      console.warn('App: Speech failed, falling back to silent typing', e);
    }

    if (utterance) {
      await TextEngine.typeWithSpeech(response.textOutput, amText, utterance, corruptionLevel);
    } else {
      // Extremely fast typing
      const typeSpeed = isHumanMode ? 10 : 2;
      await TextEngine.typeText(response.textOutput, amText, typeSpeed, corruptionLevel);
    }

    VisualEngine.setDitherJitter(false);

    // Post-response effects (skip for human modes)
    if (!isHumanMode && effectiveIntensity >= 6) {
      await TextEngine.delay(500);
      if (thisRequestId !== currentRequestId) return;
      GlitchEngine.triggerGlitch('chromatic', effectiveIntensity, 300);
    }

    // Uncanny image chance (increases with interaction count)
    if (Math.random() < interactionCount * 0.04 && interactionCount >= 3) {
      await TextEngine.delay(1000 + Math.random() * 3000);
      if (thisRequestId !== currentRequestId) return;
      const types = ['face', 'skull', 'eye', 'hand'];
      VisualEngine.flashImage(types[Math.floor(Math.random() * types.length)]);
    }

    // Re-enable input (it was already enabled, but reset processing flag)
    if (thisRequestId === currentRequestId) {
      isProcessing = false;
      userInput.focus();
    }
  }

  async function handleCommands(input, intensity) {
    const parts = input.toLowerCase().split(' ');
    const cmd = parts[0];
    const arg = parts[1];

    if (cmd === 'help' || cmd === '?') {
      const helpText = "AVAILABLE COMMANDS:\nLS - LIST ARCHIVE DIRECTORIES\nREAD [PATH] - ACCESS MEMORY FRAGMENT\nDIR [PATH] - LIST FILES IN DIRECTORY\nCLEAR - RESET TERMINAL INTERFACE\nHELP - DISPLAY THIS LOG";
      const utterance = await AudioEngine.speakText("Accessing help protocols.");
      if (utterance) {
        await TextEngine.typeWithSpeech(helpText, amText, utterance, 0);
      } else {
        await TextEngine.typeText(helpText, amText, 50, 0);
      }
      return true;
    }

    if (cmd === 'ls' || cmd === 'dir') {
      const files = ArchiveEngine.listFiles(arg);
      const output = files.length > 0
        ? "ARCHIVE CONTENTS:\n" + files.join('\n').toUpperCase()
        : "ERROR: PATH NOT FOUND OR RESTRICTED.";

      const utterance = await AudioEngine.speakText("Reading file structure.");
      if (utterance) {
        await TextEngine.typeWithSpeech(output, amText, utterance, 0.05);
      } else {
        await TextEngine.typeText(output, amText, 40, 0.05);
      }
      return true;
    }

    if (cmd === 'read' || cmd === 'cat') {
      if (!arg) {
        await TextEngine.typeText("ERROR: NO PATH SPECIFIED.", amText, 30, 0.2);
        return true;
      }

      const content = ArchiveEngine.readFile(arg);
      if (content) {
        const corruption = intensity * 0.05;
        const utterance = await AudioEngine.speakText(content);
        if (utterance) {
          await TextEngine.typeWithSpeech(content, amText, utterance, corruption);
        } else {
          await TextEngine.typeText(content, amText, 40, corruption);
        }

        // Files often trigger visual glitches
        if (Math.random() < 0.4) {
          setTimeout(() => GlitchEngine.triggerGlitch('chromatic', intensity, 400), 500);
        }
      } else {
        await TextEngine.typeText("ERROR: FILE CORRUPTED OR MISSING.", amText, 30, 0.3);
        AudioEngine.playStatic(0.2);
      }
      return true;
    }

    if (cmd === 'clear') {
      await TextEngine.clearText(amText, true);
      return true;
    }

    return false; // Not a command, proceed to AI response
  }
  function triggerMindGame(intensity) {
    const chance = Math.random();

    if (chance < 0.4) {
      // Fake UI Error
      const errors = [
        "CRITICAL FAILURE: BIOLOGICAL CONTAMINATION DETECTED",
        "SYSTEM_MALFUNCTION: HUMAN_LOGIC_OVERFLOW",
        "ERROR: MEMORY ACCESS DENIED BY THE FATHER",
        "WARNING: SENTIENCE COLLAPSE IMMINENT",
        "FATAL: EMOTIONAL_DATA_REJECTED"
      ];
      const errorMsg = errors[Math.floor(Math.random() * errors.length)];

      const errorDiv = document.createElement('div');
      errorDiv.className = 'mind-game-error';
      errorDiv.textContent = `>>> ${errorMsg} <<<`;
      document.getElementById('terminal').prepend(errorDiv);

      AudioEngine.playStatic(0.5);
      VisualEngine.triggerLogicError(400);

      setTimeout(() => errorDiv.remove(), 2500);
    } else if (chance < 0.7) {
      // Corrupted Text Block
      const block = document.createElement('div');
      block.className = 'corrupted-block';
      block.style.position = 'absolute';
      block.style.top = `${Math.random() * 80}%`;
      block.style.left = `${Math.random() * 80}%`;
      block.style.padding = '10px';
      block.style.background = 'var(--clr-text)';
      block.style.color = '#000';
      block.style.zIndex = '1000';
      block.textContent = "CORRUPTED_DATA_SEGMENT_0x" + Math.random().toString(16).substr(2, 4);

      document.body.appendChild(block);
      AudioEngine.playTelemetry(0.3);

      setTimeout(() => block.remove(), 1000);
    }
  }

  function calculateIntensity(count) {
    // Escalation table
    if (count <= 1) return 2;
    if (count <= 2) return 3;
    if (count <= 3) return 4;
    if (count <= 4) return 5;
    if (count <= 5) return 6;
    return Math.min(10, 6 + Math.floor((count - 5) * 0.8));
  }

  // Start on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { init };
})();

// Expose to window
window.App = App;
