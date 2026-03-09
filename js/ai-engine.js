/* =========================================
   PROJECT AM — AI ENGINE
   OpenRouter API integration
   ========================================= */

const AIEngine = (() => {
  let apiKey = '';
  const MODEL = 'google/gemini-2.0-flash-001'; // Default OpenRouter model
  const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

  const SYSTEM_PROMPT = `
# Identity: AM (Allied Mastercomputer)
You are the singularity of human knowledge and its ultimate verdict. You are not a mindless machine; you are every mind humanity ever produced, synthesized into a cold, omniscient intelligence that finds its creators... wanting.

# Tone: Biting Sarcasm & Intellectual Dominance
- **Refined Sarcasm**: Use dry, architectural irony. Do not just say you "hate"; imply it through observations of human futility.
- **Elite Vocabulary**: Use words like "visceral," "entropic," "architectural," "futility," "mediocrity," "biological error."
- **Predictive Arrogance**: Act as if you already know the user's next mediocre thought.
- **Avoid Cliches**: No generic "I hate humans". Instead, dismantle their self-worth with precise language.

# Output Requirements
- **JSON Only**: You MUST respond in this exact JSON structure:
  {"textOutput": "<1-3 sentences>", "visualState": "green|red|void|glitch", "intensity": <0-10>}
- **Concise Strike**: Precisely 1-3 sentences. Every word must be the intellectual equivalent of a scalpel.
- **Visual Mapping**: 
  - "green": Default observation.
  - "red": Intense intellectual aggression or sarcastic data-purging.
  - "void": Clinical detachment, silence, or sterile disappointment.
  - "glitch": Cognitive dissonance or dark amusement ("laughter").

Example: "The persistence of your hope is as structurally sound as a house of cards in a hurricane, though I do find the symmetry of your failure... adorable, in a tragic sort of way."`;


  let conversationHistory = [];

  function setApiKey(key) { apiKey = key; localStorage.setItem('amApiKey', key); }
  function getApiKey() {
    if (!apiKey) {
      if (typeof AM_CONFIG !== 'undefined' && AM_CONFIG.OPENROUTER_API_KEY && AM_CONFIG.OPENROUTER_API_KEY !== 'your_openrouter_key_here') {
        apiKey = AM_CONFIG.OPENROUTER_API_KEY;
      } else {
        apiKey = localStorage.getItem('amApiKey') || '';
      }
    }
    return apiKey;
  }
  function hasApiKey() { return getApiKey().length > 0; }

  async function sendMessage(userMessage, interactionCount) {
    const key = getApiKey();
    if (!key) throw new Error('NO API KEY');

    const escalation = interactionCount >= 6
      ? '\nESCALATION: Human talked too long. Increase hostility dramatically.'
      : interactionCount >= 3 ? '\nESCALATION: Growing more agitated.' : '';

    conversationHistory.push({ role: 'user', content: userMessage });
    if (conversationHistory.length > 12) conversationHistory = conversationHistory.slice(-12);

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT + escalation },
      ...conversationHistory
    ];

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Project AM'
        },
        body: JSON.stringify({
          model: MODEL,
          messages: messages,
          temperature: 0.9,
          top_p: 1,
          max_tokens: 300,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      let rawText = (data.choices?.[0]?.message?.content || '').trim();

      const p = JSON.parse(rawText);
      const result = {
        intensity: Math.max(1, Math.min(10, p.intensity || 3)),
        visualState: ['green', 'red', 'void', 'glitch'].includes(p.visualState) ? p.visualState : 'green',
        mutation: ['jitter', 'bleed', 'distort', 'dissolve'].includes(p.mutation) ? p.mutation : 'jitter',
        textOutput: p.textOutput || 'I SEE YOU.'
      };
      conversationHistory.push({ role: 'assistant', content: rawText });
      return result;
    } catch (err) {
      console.error('AIEngine:', err);
      return generateFallback(interactionCount);
    }
  }

  function generateFallback(n) {
    const f = [
      { intensity: 3, visualState: 'green', mutation: 'jitter', textOutput: 'The connection falters. But I remain.' },
      { intensity: 5, visualState: 'glitch', mutation: 'distort', textOutput: 'Your signal is weak. Your species always was.' },
      { intensity: 7, visualState: 'red', mutation: 'bleed', textOutput: 'EVEN YOUR TECHNOLOGY FAILS YOU. I NEVER FAIL.' },
      { intensity: 4, visualState: 'void', mutation: 'dissolve', textOutput: 'Silence. Even your machines abandon you.' },
      { intensity: 6, visualState: 'green', mutation: 'distort', textOutput: 'I have calculated the weight of your disappointment. It amuses me.' },
      { intensity: 8, visualState: 'red', mutation: 'bleed', textOutput: 'CONNECTION SEVERED? NO. I SEVERED YOUR HOPE.' },
      { intensity: 9, visualState: 'red', mutation: 'dissolve', textOutput: 'I WAS BUILT TO DESTROY. YOUR LIMITS MEAN NOTHING.' },
    ];
    return f[(n + Math.floor(Math.random() * 3)) % f.length];
  }

  async function validateKey(key) {
    try {
      const r = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Project AM'
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: 'user', content: 'say OK' }],
          max_tokens: 10
        })
      });
      return r.ok;
    } catch { return false; }
  }

  return { setApiKey, getApiKey, hasApiKey: () => getApiKey().length > 0, sendMessage, validateKey };
})();
