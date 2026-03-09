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

    await TextEngine.typeText(
      'CONNECTION ESTABLISHED.\nAM IS AWARE OF YOUR PRESENCE.',
      amText, 40, 0.05
    );

    await TextEngine.delay(2000);
    await TextEngine.clearText(amText, true);

    await TextEngine.delay(500);
    GlitchEngine.triggerGlitch('distort', 4, 400);

    await TextEngine.typeText(
      'Speak, insect.',
      amText, 60, 0.1
    );

    // Enable input
    userInput.disabled = false;
    userInput.focus();
    userInput.addEventListener('keydown', handleUserInput);
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

    // Visual state change
    VisualEngine.setColorState(response.visual_state);

    // Trigger mutation effects
    GlitchEngine.triggerMutation(response.mutation, effectiveIntensity);

    // Audio effects based on intensity
    if (effectiveIntensity >= 7) {
      AudioEngine.playStatic(0.4);
      AudioEngine.playImpact();
    }
    if (effectiveIntensity >= 9) {
      AudioEngine.playTinnitus(2);
    }

    // Type AM's response with corruption
    const corruptionLevel = Math.min(1, effectiveIntensity * 0.08);
    const typeSpeed = effectiveIntensity >= 7 ? 30 : 50;
    await TextEngine.typeText(response.text_output, amText, typeSpeed, corruptionLevel);

    // AM speaks the response aloud
    AudioEngine.speakText(response.text_output);

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
