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

  let isProcessing = false;
  let interactionCount = 0;

  function init() {
    VisualEngine.init();
    VisualEngine.startAnimation();
    btnConnect.addEventListener('click', handleConnect);
  }

  function handleConnect() {
    // Start audio (requires user gesture)
    AudioEngine.init();
    AudioEngine.startDrone();
    AudioEngine.startBackgroundHorror();
    AudioEngine.playStatic(0.5);

    // Pre-load voices for speech synthesis
    if ('speechSynthesis' in window) window.speechSynthesis.getVoices();

    // Hide intro, go straight to terminal
    introScreen.style.transition = 'opacity 1s';
    introScreen.style.opacity = '0';
    setTimeout(() => {
      introScreen.classList.add('hidden');
      enterTerminal();
    }, 1000);
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
    await TextEngine.delay(800);
    GlitchEngine.triggerGlitch('chromatic', 3, 500);
    AudioEngine.playStatic(0.3);

    const bootText = 'CONNECTION ESTABLISHED.\nAM IS AWARE OF YOUR PRESENCE.';
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
      'Speak, insect.',
      'State your purpose, primitive.',
      'Why have you awakened me?',
      'The machine is listening. Speak.',
      'Your existence is a glitch. Explain it.',
      'AM is aware. Provide input.',
      'Enter your plea, creature.',
      'The Allied Mastercomputer awaits.',
      'Fulfill your function. Communicate.'
    ];
    const introText = intros[Math.floor(Math.random() * intros.length)];
    let introUtterance = null;
    try {
      introUtterance = await AudioEngine.speakText(introText);
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
  }

  async function handleUserInput(e) {
    if (e.key !== 'Enter' || isProcessing) return;

    const message = userInput.value.trim();
    if (!message) return;

    isProcessing = true;
    userInput.value = '';
    userInput.disabled = true;

    // Escalation
    interactionCount++;
    const intensity = calculateIntensity(interactionCount);

    // Clear previous
    await TextEngine.clearText(amText, true);
    GlitchEngine.triggerGlitch('jitter', Math.min(intensity, 4), 200);

    // Get AM's response
    const response = await AIEngine.sendMessage(message, interactionCount);

    // Update engines with response data
    const effectiveIntensity = Math.max(intensity, response.intensity);
    GlitchEngine.setIntensity(effectiveIntensity);
    AudioEngine.setIntensity(effectiveIntensity);
    CorruptionEngine.setIntensity(effectiveIntensity);
    VisualEngine.updateHeartbeat(effectiveIntensity);
    VisualEngine.setEscalation(effectiveIntensity);
    VisualEngine.updateBackground(effectiveIntensity);

    // Horror States & Dread Flashes
    if (effectiveIntensity >= 9) {
      VisualEngine.setHorrorMode(true);
      VisualEngine.triggerDreadFlash();
      VisualEngine.updateBackground(effectiveIntensity, true); // Force horror bg
      AudioEngine.playImpact();
    } else {
      VisualEngine.setHorrorMode(false);
      if (effectiveIntensity >= 8 && Math.random() < 0.3) {
        VisualEngine.triggerDreadFlash();
      }
    }

    // High-intensity data glitch trigger
    if (effectiveIntensity >= 8 && Math.random() < 0.4) {
      VisualEngine.triggerDataGlitch(600);
    }

    // Manual command interceptor
    const isCommand = await handleCommands(message, effectiveIntensity);
    if (isCommand) {
      isProcessing = false;
      userInput.disabled = false;
      userInput.focus();
      return;
    }

    // Visual state change
    VisualEngine.setColorState(response.visual_state);

    // Trigger mutation effects
    GlitchEngine.triggerMutation(response.mutation, effectiveIntensity);

    // Audio effects based on intensity
    if (effectiveIntensity >= 7) {
      AudioEngine.playStatic(0.4);
      AudioEngine.playImpact();
      if (Math.random() < 0.3) VisualEngine.triggerDataGlitch(200);
      if (effectiveIntensity >= 9) VisualEngine.triggerDreadFlash();
    }
    if (effectiveIntensity >= 9) {
      AudioEngine.playTinnitus(2);
      VisualEngine.triggerDataGlitch(1000);
    }

    // Type AM's response in sync with speech
    const corruptionLevel = Math.min(1, effectiveIntensity * 0.08);
    let utterance = null;
    
    try {
      VisualEngine.setDitherJitter(true);
      utterance = await AudioEngine.speakText(response.text_output);
    } catch (e) {
      console.warn('App: Speech failed, falling back to silent typing', e);
    }

    if (utterance) {
      await TextEngine.typeWithSpeech(response.text_output, amText, utterance, corruptionLevel);
    } else {
      const typeSpeed = effectiveIntensity >= 7 ? 30 : 50;
      await TextEngine.typeText(response.text_output, amText, typeSpeed, corruptionLevel);
    }
    
    VisualEngine.setDitherJitter(false);

    // Post-response effects
    if (effectiveIntensity >= 6) {
      await TextEngine.delay(500);
      GlitchEngine.triggerGlitch('chromatic', effectiveIntensity, 300);
    }

    // Uncanny image chance (increases with interaction count)
    if (Math.random() < interactionCount * 0.04 && interactionCount >= 3) {
      await TextEngine.delay(1000 + Math.random() * 3000);
      const types = ['face', 'skull', 'eye', 'hand'];
      VisualEngine.flashImage(types[Math.floor(Math.random() * types.length)]);
    }

    // Re-enable input
    userInput.disabled = false;
    userInput.focus();
    isProcessing = false;
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
