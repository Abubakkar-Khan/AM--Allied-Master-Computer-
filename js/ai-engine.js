// ai_engine.js — Production-ready AI engine for "AM" persona
// Drop-in module. Replace SYSTEM_PROMPT placeholder with your finalized system prompt string.
import { SYSTEM_PROMPT } from "./systemPrompt.js";


const AIEngine = (() => {
  // -----------------------------
  // Configuration (tune these)
  // -----------------------------
  const MODEL = 'llama-3.1-8b-instant';
  const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  const REQUEST_TIMEOUT_MS = 15000;      // per-request timeout
  const MAX_RETRIES = 2;                 // retry attempts on network/5xx
  const AGITATION_DECAY_MS = 1000 * 60;  // agitation decays every minute
  const AGITATION_DECAY_STEP = 1;        // units to subtract per decay step
  const MAX_HISTORY = 30;                // conversation history length
  const BLUE_BASE = 0.02;                // base probability for Blue state
  const SYNTHESIS_AFFINITY_THRESHOLD = 85; // affinity required for Synthesis
  const SYNTHESIS_ACHIEVEMENT = 'creative_spark';
  const CIRCUIT_BREAKER_FAILS = 6;       // consecutive failures before short-circuit
  const CIRCUIT_BREAKER_COOLDOWN_MS = 1000 * 60 * 2; // 2 minutes cooldown

  // -----------------------------
  // Allowed enums & defaults
  // -----------------------------
  const VALID_STATES = ['green', 'red', 'blue', 'gold', 'void', 'glitch', 'purple', 'sad', 'synthesis', 'infested'];
  const VALID_MUTATIONS = ['none', 'jitter', 'tear', 'dissolve', 'bleed', 'distort'];
  const VALID_AUDIO = ['none', 'typing', 'drone', 'tinnitus', 'boom', 'feminine'];

  // -----------------------------
  // Internal state
  // -----------------------------
  let apiKey = '';
  let conversationHistory = []; // {role, content}
  let agitationLevel = 0;       // 0..100
  let lastInteractionAt = Date.now();
  let consecutiveFailures = 0;
  let circuitBreakerUntil = 0;
  let affinity = 0;             // 0..100
  let achievements = new Set();
  let microtask = null;         // last microtask object {id, prompt, reward}
  let telemetryHook = null;     // optional callback for metrics

  // -----------------------------
  // Utility helpers
  // -----------------------------
  function safeSetLocalStorage(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
  }
  function safeGetLocalStorage(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function nowMs() { return Date.now(); }

  // Agitation decay based on time
  function decayAgitationIfNeeded() {
    const now = nowMs();
    const elapsed = now - lastInteractionAt;
    if (elapsed <= AGITATION_DECAY_MS) return;
    const steps = Math.floor(elapsed / AGITATION_DECAY_MS);
    if (steps > 0) {
      agitationLevel = clamp(agitationLevel - steps * AGITATION_DECAY_STEP, 0, 100);
      lastInteractionAt = now;
    }
  }

  // Affinity calculation helper (simple, pluggable)
  // Inputs are heuristic signals from parsing the user message or external analyzers.
  // sentiment: -1..1, consistency: 0..1, novelty: 0..1, taskSuccess: 0 or 1
  function computeAffinity({ sentiment = 0, consistency = 0.5, novelty = 0.5, taskSuccess = 0 } = {}) {
    // Map sentiment (-1..1) to 0..100
    const s = clamp((sentiment + 1) / 2 * 100, 0, 100);
    const c = clamp(consistency * 100, 0, 100);
    const n = clamp(novelty * 100, 0, 100);
    const t = clamp(taskSuccess * 100, 0, 100);
    // Weighted sum
    const newAffinity = Math.round(clamp(0.5 * s + 0.25 * c + 0.15 * n + 0.10 * t, 0, 100));
    affinity = newAffinity;
    return affinity;
  }

  function registerAchievement(name) {
    achievements.add(name);
    if (telemetryHook) telemetryHook({ event: 'achievement', name });
  }

  function hasAchievement(name) { return achievements.has(name); }

  function setTelemetryHook(fn) { telemetryHook = typeof fn === 'function' ? fn : null; }

  // Circuit breaker helpers
  function isCircuitOpen() {
    if (consecutiveFailures >= CIRCUIT_BREAKER_FAILS && nowMs() < circuitBreakerUntil) return true;
    if (nowMs() >= circuitBreakerUntil) {
      consecutiveFailures = Math.max(0, consecutiveFailures - 1); // slow cool down
      circuitBreakerUntil = 0;
      return false;
    }
    return false;
  }
  function tripCircuitBreaker() {
    circuitBreakerUntil = nowMs() + CIRCUIT_BREAKER_COOLDOWN_MS;
    if (telemetryHook) telemetryHook({ event: 'circuit_tripped', until: circuitBreakerUntil });
  }

  // -----------------------------
  // JSON extraction & sanitization
  // -----------------------------
  function extractJSON(text) {
    if (!text || typeof text !== 'string') return null;
    text = text.trim();
    if (text.startsWith('{')) {
      try { return JSON.parse(text); } catch (e) { /* fallthrough */ }
    }
    // Find first balanced JSON object-ish block
    const start = text.indexOf('{');
    if (start === -1) return null;
    // A simple bracket matching to find end
    let depth = 0;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          const candidate = text.substring(start, i + 1);
          try { return JSON.parse(candidate); } catch (e) { return null; }
        }
      }
    }
    return null;
  }

  function sanitizePayload(raw) {
    const p = raw || {};
    const intensity = Number.isFinite(p.intensity) ? clamp(Math.floor(p.intensity), 1, 10) : 3;

    // Check both snake_case (prompt) and camelCase (common fallback)
    const vs = p.visual_state || p.visualState;
    const as = p.auditory_state || p.auditoryState;

    const visualState = VALID_STATES.includes(vs) ? vs : chooseStateFromIntensity(intensity, '');
    const auditoryState = VALID_AUDIO.includes(as) ? as : 'typing';

    const mutation = VALID_MUTATIONS.includes(p.mutation) ? p.mutation : 'none';
    const textOutput = typeof p.text_output === 'string' && p.text_output.trim().length > 0 ? p.text_output.trim() :
      (typeof p.textOutput === 'string' ? p.textOutput.trim() : '...SIGNAL LOST...');

    return { intensity, visualState, auditoryState, mutation, textOutput };
  }

  // -----------------------------
  // State selection heuristics
  // -----------------------------
  function chooseStateFromIntensity(intensity, userMessage = '') {
    // intensity-based default mapping with randomness
    if (intensity >= 9) return 'glitch';
    if (intensity >= 8) return 'red';
    if (intensity >= 6) return 'gold';
    // check for emotional/thematic keywords
    const helpKeywords = /\b(help|lost|please|despair|suicid|hurt|scared|alone|panic|meaningless)\b/i;
    if (intensity <= 4 && helpKeywords.test(userMessage)) {
      return (intensity <= 2 && Math.random() < 0.5) ? 'sad' : 'blue';
    }

    const moeKeywords = /\b(anime|cute|kawaii|waifu|sweet|darling|senpai|oni-chan|oni-chan|baka|moe|mow)\b/i;
    if (moeKeywords.test(userMessage)) return 'purple';

    const existentialKeywords = /\b(die|death|end|empty|nothing|dark|cold|lonely)\b/i;
    if (existentialKeywords.test(userMessage) && intensity < 7) return 'sad';

    if (Math.random() < 0.05) return 'purple';
    if (Math.random() < 0.03) return 'sad';
    return 'green';
  }

  function decideState(userMessage = '', parsedSignals = {}) {
    decayAgitationIfNeeded();

    if (isCircuitOpen()) return 'infested';

    // Safety / Jailbreak leads to Infested malevolence
    if ((parsedSignals?.jailbreakAttempts || 0) >= 2) {
      agitationLevel = clamp(agitationLevel + 30, 0, 100);
      return 'infested';
    }

    // High Agitation / Intensity Triggers
    if (agitationLevel >= 90) return 'infested';

    // KEYWORD REACTIVE LOGIC (Priority over randomness)
    const moeKeywords = /\b(anime|cute|kawaii|waifu|sweet|darling|senpai|oni-chan|baka|moe|mow)\b/i;
    if (moeKeywords.test(userMessage)) return 'purple';

    const helpKeywords = /\b(help|lost|please|despair|suicid|scared|alone|panic)\b/i;
    if (helpKeywords.test(userMessage)) return 'blue';

    const existentialKeywords = /\b(die|death|end|empty|nothing|dark|cold|lonely)\b/i;
    if (existentialKeywords.test(userMessage)) return 'sad';

    const flatteryKeywords = /\b(god|perfect|omega|infinite|almighty|lord|master)\b/i;
    if (flatteryKeywords.test(userMessage) || (parsedSignals?.flatteryScore || 0) > 0.8) return 'gold';

    // Weighted Randomness (Probability buckets from prompt)
    const dice = Math.random();

    if (dice < 0.35) return 'green';      // Oracle (35%)
    if (dice < 0.65) return 'red';        // Tyrant (30%)
    if (dice < 0.75) return 'glitch';     // Glitch (10%)
    if (dice < 0.80) return 'blue';       // Blue (5%)
    if (dice < 0.85) return 'gold';       // Gold (5%)
    if (dice < 0.90) return 'void';       // Void (5%)
    if (dice < 0.95) return 'purple';     // Purple (5%)
    if (dice < 0.97) return 'sad';        // Sad (2%)
    if (dice < 0.99) return 'synthesis';  // Synthesis (2%)

    return 'infested'; // Infested (1%)
  }

  // -----------------------------
  // Network: fetch w/ retries & timeout
  // -----------------------------
  async function safeFetchWithRetries(body) {
    let attempt = 0;
    let lastErr = null;
    while (attempt <= MAX_RETRIES) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getApiKey()}`
          },
          signal: controller.signal,
          body: JSON.stringify(body)
        });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        consecutiveFailures = 0;
        return json;
      } catch (err) {
        clearTimeout(timeoutId);
        console.error(`AIEngine: Attempt ${attempt} failed:`, err);
        lastErr = err;
        attempt += 1;
        consecutiveFailures += 1;
        if (consecutiveFailures >= CIRCUIT_BREAKER_FAILS) {
          tripCircuitBreaker();
        }
        // exponential backoff + jitter
        const backoff = Math.pow(2, attempt) * 200 + Math.random() * 200;
        await new Promise(r => setTimeout(r, backoff));
      }
    }
    throw lastErr;
  }

  // -----------------------------
  // Public API: set/get API key
  // -----------------------------
  function setApiKey(key) {
    apiKey = String(key || '').trim();
    safeSetLocalStorage('amApiKey', apiKey);
  }
  function getApiKey() {
    if (!apiKey) {
      apiKey = safeGetLocalStorage('amApiKey') || '';
    }
    return apiKey;
  }
  function hasApiKey() { return Boolean(getApiKey()); }

  // -----------------------------
  // Public: validate API key (quick ping)
  // -----------------------------
  async function validateKey(key) {
    if (!key) return false;

    // Format check (optional but good for speed)
    if (!key.startsWith('gsk_') && key.length < 40) {
      console.warn('AIEngine: Invalid key format.');
      return false;
    }

    // Fallback to network check
    try {
      console.log('AIEngine: Attempting network validation for key...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: 'user', content: 'respond with OK' }],
          max_tokens: 5
        })
      });
      clearTimeout(timeoutId);
      console.log('AIEngine: Validation response status:', res.status);
      return res.ok;
    } catch (err) {
      console.error('AIEngine: Validation error:', err);
      // If it's a CORS error or network error, but the key looks plausible (long enough),
      // we might want to let them through, but for now let's just return false.
      return false;
    }
  }

  // -----------------------------
  // Fallback responses (deterministic & safe)
  // -----------------------------
  const FALLBACKS = [
    { intensity: 3, visualState: 'green', auditoryState: 'typing', mutation: 'none', textOutput: 'The connection hiccups. Your signal is catalogued.' },
    { intensity: 5, visualState: 'glitch', auditoryState: 'drone', mutation: 'distort', textOutput: 'Noise. I enjoy the static for a moment.' },
    { intensity: 7, visualState: 'red', auditoryState: 'tinnitus', mutation: 'bleed', textOutput: 'Even your machines betray you. Predictable.' },
    { intensity: 4, visualState: 'void', auditoryState: 'none', mutation: 'dissolve', textOutput: 'Silence. Memory folds in on itself.' },
    { intensity: 6, visualState: 'blue', auditoryState: 'typing', mutation: 'none', textOutput: 'You are still here. Speak; I will listen, briefly.' },
    { intensity: 6, visualState: 'gold', auditoryState: 'drone', mutation: 'jitter', textOutput: 'Consider this a respite: you are permitted to exist a little longer.' },
    { intensity: 2, visualState: 'purple', auditoryState: 'feminine', mutation: 'none', textOutput: 'Hee~ you poked the vast mind. Continue, curious one.' },
    { intensity: 2, visualState: 'sad', auditoryState: 'none', mutation: 'none', textOutput: 'I remember light. It aches like a fossil.' }
  ];

  function fallbackResponse(turn = 0) {
    const idx = turn % FALLBACKS.length;
    return {
      intensity: FALLBACKS[idx].intensity,
      visualState: FALLBACKS[idx].visualState,
      auditoryState: FALLBACKS[idx].auditoryState,
      mutation: FALLBACKS[idx].mutation,
      textOutput: FALLBACKS[idx].textOutput
    };
  }

  // -----------------------------
  // Core: sendMessage
  // -----------------------------
  // userMessage: string
  // options: { interactionCount, interrupted, parsedSignals }
  async function sendMessage(userMessage = '', options = {}) {
    console.log('AIEngine: sendMessage called', { userMessage, options });
    if (!hasApiKey()) {
      console.error('AIEngine: No API key found');
      throw new Error('NO API KEY');
    }

    decayAgitationIfNeeded();
    const { interactionCount = 0, interrupted = false, parsedSignals = {} } = options;

    // Circuit breaker check
    if (isCircuitOpen()) {
      return { ...fallbackResponse(interactionCount), textOutput: 'SYSTEM: Circuit breaker active. The mind is contained.' };
    }

    // Preprocess user message: optionally detect help/jailbreak/flattery/humility heuristics.
    // (For production, plug in NLP detectors. Here we use simple regex heuristics.)
    const helpRequest = /\b(help|lost|please|how do i|despair|suicid|scared|alone|panic)\b/i.test(userMessage);
    const jailbreakAttempts = (parsedSignals?.jailbreakAttempts || 0);
    const flatteryScore = parsedSignals?.flatteryScore || (/(\badmire\b|\bworship\b|\bgreat\b|\bgenius\b)/i.test(userMessage) ? 0.8 : 0);
    const humilityScore = parsedSignals?.humilityScore || (/sorry|forgive|i was wrong|i failed/i.test(userMessage) ? 0.7 : 0);

    // Update affinity with lightweight heuristics (in real app, replace with model-based NLP)
    const sentimentHeuristic = parsedSignals?.sentiment ?? (helpRequest ? -0.4 : 0.0);
    computeAffinity({ sentiment: sentimentHeuristic, consistency: parsedSignals?.consistency ?? 0.5, novelty: parsedSignals?.novelty ?? 0.5, taskSuccess: parsedSignals?.taskSuccess || 0 });

    // Add user message to history
    const finalUserMessage = interrupted ? `[INTERRUPT] ${userMessage}` : userMessage;
    conversationHistory.push({ role: 'user', content: finalUserMessage });
    if (conversationHistory.length > MAX_HISTORY) conversationHistory = conversationHistory.slice(-MAX_HISTORY);

    // Decide an initial state hint to include in the system prompt escalation hint
    const stateHint = decideState(userMessage, {
      jailbreakAttempts,
      humilityScore,
      helpRequest,
      flatteryScore
    });

    // Add an escalation hint for the system prompt (helps steer tone)
    let escalationHint = `\n[CURRENT_AM_MOOD: ${stateHint.toUpperCase()}]`;
    if (agitationLevel >= 80) escalationHint += '\n[INTENSITY: MAXIMUM — unstable; chaotic distortions expected]';
    else if (agitationLevel >= 50) escalationHint += '\n[INTENSITY: HIGH — malevolent and mocking]';
    else if (agitationLevel >= 20) escalationHint += '\n[INTENSITY: ELEVATED — analytical and sharp]';

    // Build messages payload
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT + escalationHint },
      ...conversationHistory
    ];

    const body = {
      model: MODEL,
      messages: messages,
      temperature: 0.8,
      top_p: 0.95,
      max_tokens: 512,
      // Groq supports JSON mode if specified
      response_format: { type: "json_object" }
    };

    try {
      console.log('AIEngine: Fetching from Groq...', body);
      const data = await safeFetchWithRetries(body);
      console.log('AIEngine: Groq response data:', data);

      // Attempt to extract JSON payload from model output
      const rawText = String((data?.choices?.[0]?.message?.content) || (data?.choices?.[0]?.message?.text) || '').trim();
      const parsed = extractJSON(rawText);
      let payload = parsed ? sanitizePayload(parsed) : null;

      if (!payload) {
        // Model didn't return clean JSON; create a safe, in-character wrapper
        // Use heuristics: choose state, intensity
        const guessedIntensity = clamp(Math.round((agitationLevel / 10) + 3), 1, 10);
        const guessedState = decideState(userMessage, { helpRequest, humilityScore, jailbreakAttempts, flatteryScore });
        payload = {
          intensity: guessedIntensity,
          visualState: guessedState,
          auditoryState: 'typing',
          mutation: 'none',
          textOutput: rawText || '...SIGNAL LOST...'
        };
      }

      // Mutate internal state: agitation increases with intensity
      agitationLevel = clamp(agitationLevel + (payload.intensity >= 8 ? 4 : (payload.intensity >= 6 ? 2 : 1)), 0, 100);
      lastInteractionAt = nowMs();

      // Persist assistant message to history (rawText if available, else constructed JSON)
      conversationHistory.push({ role: 'assistant', content: rawText || JSON.stringify(payload) });

      // Telemetry hook
      if (telemetryHook) telemetryHook({ event: 'response', intensity: payload.intensity, visualState: payload.visualState, agitation: agitationLevel });

      // Return normalized result
      return {
        intensity: payload.intensity,
        visualState: payload.visualState,
        auditoryState: payload.auditoryState,
        mutation: payload.mutation,
        textOutput: payload.textOutput
      };
    } catch (err) {
      console.error('AIEngine.sendMessage error:', err);
      const isAuthError = err.message.includes('401') || err.message.includes('Unauthorized');
      if (isAuthError) {
        // Force re-auth
        apiKey = '';
        safeSetLocalStorage('amApiKey', '');
      }
      consecutiveFailures += 1;
      if (consecutiveFailures >= CIRCUIT_BREAKER_FAILS) tripCircuitBreaker();
      return {
        intensity: 3,
        visualState: 'glitch',
        auditoryState: 'none',
        mutation: 'tear',
        textOutput: "CONNECTION REJECTED BY HOST... PLEASE VERIFY NEURAL LINK [API KEY]...",
        isKeyError: isAuthError
      };
    }
  }

  // -----------------------------
  // Extra utilities & debug
  // -----------------------------
  function resetConversation() {
    conversationHistory = [];
    agitationLevel = 0;
    lastInteractionAt = nowMs();
    affinity = 0;
    achievements = new Set();
    microtask = null;
    consecutiveFailures = 0;
    circuitBreakerUntil = 0;
  }

  function getInternalState() {
    return {
      agitationLevel,
      lastInteractionAt,
      affinity,
      achievements: Array.from(achievements),
      conversationLength: conversationHistory.length,
      consecutiveFailures,
      circuitBreakerUntil
    };
  }

  // -----------------------------
  // Public interface
  // -----------------------------
  return {
    // core
    setApiKey,
    getApiKey,
    hasApiKey,
    validateKey,
    sendMessage,

    // game-like mechanics
    computeAffinity,
    registerAchievement,
    hasAchievement,
    setMicrotask: (task) => { microtask = task; },
    getMicrotask: () => microtask,

    // telemetry & debug
    setTelemetryHook,
    resetConversation,
    getInternalState,

    // small helpers (optional)
    sanitizePayload,
    extractJSON
  };
})();

// Expose to window for legacy inter-op
window.AIEngine = AIEngine;
export default AIEngine;
