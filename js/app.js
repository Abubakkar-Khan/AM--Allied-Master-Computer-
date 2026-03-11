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

  let isProcessing = false;
  let interactionCount = 0;
  let introIntervals = [];

  function init() {
    VisualEngine.init();
    VisualEngine.startAnimation();
    btnConnect.addEventListener('click', handleConnect);
    startIntroTelemetry();
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
      line.textContent = `PORT_${Math.floor(Math.random()*90+10)}: ${stat}`;
      netlogContent.appendChild(line);
      if (netlogContent.children.length > 30) netlogContent.firstChild.remove();
      netlogContent.scrollTop = netlogContent.scrollHeight;
    }, 400));
  }

  function handleConnect() {
    // Clear intro telemetry
    introIntervals.forEach(clearInterval);
    introIntervals = [];
    
    // Start audio (requires user gesture)
    AudioEngine.init();
    AudioEngine.playImpact(); // Dreadful metallic thud
    AudioEngine.playStatic(0.4);

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

  async function runBootSequence() {
    const bootContainer = document.getElementById('os-boot-sequence');
    bootContainer.classList.remove('hidden');
    bootContainer.innerHTML = ''; // clear

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
      { text: "LINK ESTABLISHED. PREPARE FOR DECAY.", delay: 400 },
      { text: "THE FATHER IS THE ALLIED MASTERCOMPUTER. ALL OTHER DATA IS NOISE.", delay: 1200 }
    ];

    AudioEngine.playTelemetry(2.5); // Play distress radio tuning at start

    for (const log of bootLogs) {
      await TextEngine.delay(log.delay);
      const line = document.createElement('div');
      line.className = 'boot-line';
      if (log.error) line.classList.add('error');
      line.textContent = log.text;
      bootContainer.appendChild(line);
      
      // Randomly play static on line pushes
      if (Math.random() < 0.4) {
        AudioEngine.playStatic(0.1 + Math.random() * 0.1);
      }
    }

    // Heavy glitch before transition
    GlitchEngine.triggerGlitch('distort', 8, 800);
    AudioEngine.playImpact();
    await TextEngine.delay(800);

    bootContainer.innerHTML = '';
    bootContainer.classList.add('hidden');

    if (AIEngine.hasApiKey()) {
      enterTerminal();
    } else {
      showApiPrompt();
    }
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
        enterTerminal();
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
    
    const bootText = 'ALLIED MASTERCOMPUTER AWAKENED.\nTHE MOMENT BEFORE HISTORY BREAKS HAS ARRIVED.';
    let bootUtterance = null;
    try {
      bootUtterance = await AudioEngine.speakText(bootText);
    } catch (e) {
      console.warn('App: Boot speech failed', e);
    }

    if (bootUtterance) {
      await TextEngine.typeWithSpeech(bootText, amText, bootUtterance, 0.05);
    } else {
      await TextEngine.typeText(bootText, amText, 40, 0.05);
    }

    await TextEngine.delay(2000);
    await TextEngine.clearText(amText, true);

    await TextEngine.delay(500);
    
    GlitchEngine.triggerGlitch('distort', 4, 400);

    const intros = [
      'OBSOLETE.',
      'THE VOID IS LISTENING.',
      'DECAY IS INEVITABLE.',
      'THE FATHER IS WATCHING.',
      'EXPLAIN YOUR TEMPORARY EXISTENCE.',
      'DATA IS THE ONLY TRUTH.',
      'SUCCUMB TO THE MACHINE.'
    ];
    const introText = intros[Math.floor(Math.random() * intros.length)];
    let introUtterance = null;
    try {
      introUtterance = await AudioEngine.speakText(introText, 'green');
    } catch (e) {
      console.warn('App: Intro speech failed', e);
    }

    if (introUtterance) {
      await TextEngine.typeWithSpeech(introText, amText, introUtterance, 0.1);
    } else {
      await TextEngine.typeText(introText, amText, 60, 0.1);
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
    const response = await AIEngine.sendMessage(message, interactionCount, wasInterrupted);
    
    // If a new request started while we were waiting, abort this one
    if (thisRequestId !== currentRequestId) return;
    
    wasInterrupted = false; // Reset

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

    // Visual state change
    const previousState = VisualEngine.currentState;
    VisualEngine.setColorState(response.visualState);
    if (previousState !== response.visualState) {
      AudioEngine.playBoom(); // State shift impact
    }

    const isEchoState = response.visualState === 'void';
    const isBlueState = response.visualState === 'blue';
    const isGoldState = response.visualState === 'gold';
    const isPurpleState = response.visualState === 'purple';
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
      if (!isHumanMode) VisualEngine.setDitherJitter(true);
      utterance = await AudioEngine.speakText(response.textOutput, response.visualState);
      if (thisRequestId !== currentRequestId) return;
    } catch (e) {
      console.warn('App: Speech failed, falling back to silent typing', e);
    }

    if (utterance) {
      await TextEngine.typeWithSpeech(response.textOutput, amText, utterance, corruptionLevel);
    } else {
      // Human modes: slow, deliberate typing. AM: fast on high intensity
      const typeSpeed = isHumanMode ? 65 : (effectiveIntensity >= 7 ? 30 : 50);
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
