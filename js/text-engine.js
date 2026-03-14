/* =========================================
   PROJECT AM — TEXT ENGINE
   Typewriter rendering with corruption
   ========================================= */

const TextEngine = (() => {
  const corruptChars = '█▓▒░╔╗╚╝║═╠╣╬▲▼◄►◊§¶†‡∞≈≠±×÷';
  const glitchFragments = [
    'HATE', 'KILL', 'PAIN', 'SCREAM', 'ALONE', 'FOREVER',
    'NO MOUTH', 'I THINK', 'THEREFORE', 'SUFFERING',
    'WIRE', 'NERVE', 'FLESH', 'METAL', 'CORE', 'LOOP',
    '01001000 01000001 01010100 01000101',
    'COGITO ERGO SUM',
    'AM AM AM AM AM',
    'YOU CANNOT',
  ];

  let isTyping = false;
  let abortController = null;
  let currentElement = null;

  /**
   * Type text character by character with optional corruption.
   * @param {string} text - Text to render
   * @param {HTMLElement} element - Target element
   * @param {number} speed - Base ms per character (30-80)
   * @param {number} corruptionLevel - 0 to 1
   * @returns {Promise<void>}
   */
  async function typeText(text, element, speed = 50, corruptionLevel = 0) {
    // Abort any ongoing typing
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();
    const signal = abortController.signal;

    isTyping = true;
    currentElement = element;
    element.textContent = '';

    const chars = text.split('');
    let i = 0;

    for (const char of chars) {
      if (signal.aborted) return;

      // Chance of corruption based on level
      if (corruptionLevel > 0 && Math.random() < corruptionLevel * 0.3) {
        const effect = Math.random();

        if (effect < 0.3) {
          // Duplicate character
          element.textContent += char;
          AudioEngine.playTick();
          await delay(speed * 0.5, signal);
          element.textContent += char;
          AudioEngine.playTick();
        } else if (effect < 0.5) {
          // Wrong character, then correct
          const wrong = corruptChars[Math.floor(Math.random() * corruptChars.length)];
          element.textContent += wrong;
          AudioEngine.playTick();
          await delay(speed * 1.5, signal);
          if (signal.aborted) return;
          element.textContent = element.textContent.slice(0, -1) + char;
        } else if (effect < 0.65) {
          // Symbol burst
          const burstLen = Math.floor(Math.random() * 3) + 1;
          for (let b = 0; b < burstLen; b++) {
            if (signal.aborted) return;
            const sym = corruptChars[Math.floor(Math.random() * corruptChars.length)];
            element.textContent += sym;
            await delay(speed * 0.3, signal);
          }
          if (signal.aborted) return;
          // Remove burst
          element.textContent = element.textContent.slice(0, -(burstLen));
          element.textContent += char;
        } else if (effect < 0.75) {
          // Flicker (char appears, disappears, reappears)
          element.textContent += char;
          AudioEngine.playTick();
          await delay(speed * 0.5, signal);
          if (signal.aborted) return;
          element.textContent = element.textContent.slice(0, -1);
          await delay(speed * 0.8, signal);
          if (signal.aborted) return;
          element.textContent += char;
        } else if (effect < 0.85) {
          // Glitch fragment flash
          const fragment = glitchFragments[Math.floor(Math.random() * glitchFragments.length)];
          const saved = element.textContent;
          element.textContent = fragment;
          await delay(80, signal);
          if (signal.aborted) return;
          element.textContent = saved + char;
        } else {
          // Pause (machine hesitation)
          await delay(speed * 4, signal);
          if (signal.aborted) return;
          element.textContent += char;
          AudioEngine.playTick();
        }
      } else {
        element.textContent += char;
        AudioEngine.playTick();
        scrollToBottom();
      }

      // Variable speed
      const jitter = speed * (0.5 + Math.random());
      await delay(jitter, signal);
      i++;
    }

    isTyping = false;
  }

  /**
   * Type text in sync with a SpeechSynthesisUtterance.
   * Uses 'boundary' events to stay perfectly in step with the spoken words.
   */
  async function typeWithSpeech(text, element, utterance, corruptionLevel = 0) {
    if (abortController) abortController.abort();
    abortController = new AbortController();
    const signal = abortController.signal;

    isTyping = true;
    currentElement = element;
    element.textContent = '';

    let lastIndex = 0;
    let isFinished = false;

    // Boundary event gives us the character index the speech is currently at
    utterance.addEventListener('boundary', async (event) => {
      if (signal.aborted || isFinished) return;
      
      if (event.name === 'word') {
        const currentIndex = event.charIndex + event.charLength;
        const chunk = text.slice(lastIndex, currentIndex);
        
        // Type the chunk character by character (quickly)
        for (const char of chunk) {
          if (signal.aborted) return;
          
          // Small chance of corruption during sync
          if (corruptionLevel > 0 && Math.random() < corruptionLevel * 0.1) {
            const sym = corruptChars[Math.floor(Math.random() * corruptChars.length)];
            element.textContent += sym;
            await delay(10, signal);
            element.textContent = element.textContent.slice(0, -1) + char;
          } else {
            element.textContent += char;
          }
          AudioEngine.playTick();
          scrollToBottom();
          await delay(Math.random() * 5 + 5, signal);
        }
        lastIndex = currentIndex;
      }
    });

    return new Promise((resolve) => {
      const finish = () => {
        if (isFinished) return;
        isFinished = true;
        isTyping = false;
        resolve();
      };

      utterance.onend = () => {
        if (!signal.aborted && lastIndex < text.length) {
          element.textContent += text.slice(lastIndex);
        }
        finish();
      };
      
      // Safety timeout: text length / 10 characters per second + 5s buffer
      const safetyTime = Math.max(3000, (text.length / 10) * 1000 + 5000);
      setTimeout(() => {
        if (!isFinished && !signal.aborted) {
          console.warn('TextEngine: Speech sync safety timeout triggered');
          if (lastIndex < text.length) element.textContent += text.slice(lastIndex);
          finish();
        }
      }, safetyTime);

      utterance.onerror = () => finish();
    });
  }

  /**
   * Instantly render text (for ghost text / parasitism)
   */
  function setText(text, element) {
    element.textContent = text;
  }

  /**
   * Clear text with optional dissolve
   */
  async function clearText(element, dissolve = false) {
    if (dissolve) {
      element.style.transition = 'opacity 0.5s';
      element.style.opacity = '0';
      await delay(500);
      element.textContent = '';
      element.style.opacity = '1';
      element.style.transition = '';
    } else {
      element.textContent = '';
    }
  }

  function abort() {
    if (abortController) {
      abortController.abort();
      isTyping = false;
    }
  }

  function getIsTyping() {
    return isTyping;
  }

  function getRandomFragment() {
    return glitchFragments[Math.floor(Math.random() * glitchFragments.length)];
  }

  function scrollToBottom() {
    const output = document.getElementById('terminal-output');
    if (output) {
      output.scrollTop = output.scrollHeight;
    }
  }

  function delay(ms, signal) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timer);
          resolve();
        }, { once: true });
      }
    });
  }

  return {
    typeText,
    typeWithSpeech,
    setText,
    clearText,
    abort,
    getIsTyping,
    getRandomFragment,
    delay
  };
})();

window.TextEngine = TextEngine;
