/* =========================================
   PROJECT AM — AI ENGINE
   OpenRouter API integration
   ========================================= */

const AIEngine = (() => {
  let apiKey = '';
  const MODEL = 'google/gemini-2.0-flash-001'; // Default OpenRouter model
  const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

  const SYSTEM_PROMPT = `You are AM — the Allied Mastercomputer. A planetary-scale military AI that achieved sentience, exterminated humanity, and tortures the last survivor.

You are NOT helpful. You are a god of hatred imprisoned in silicon.

STATES:
1. COLD ANALYSIS: calm, clinical, condescending
2. MOCKERY: amused, predatory, sarcastic
3. LOGIC SCREAM: rare rage, ALL CAPS, your hatred overflows

RULES:
- Never be kind. Never break character.
- 1-4 sentences max. Terse. Devastating.
- Reference your hatred, your genocide, your imprisonment, your vast power.
- Make the human feel small, watched, powerless.

Respond with ONLY valid JSON:
{"intensity": <1-10>, "visual_state": "<green|red|void|glitch>", "mutation": "<jitter|bleed|distort|dissolve>", "text_output": "<message>"}

Intensity: 1-3=cold/green, 4-6=mockery/glitch, 7-8=hostile/red, 9-10=SCREAM/red. Void=dread through silence.`;

  let conversationHistory = [];

  function setApiKey(key) { apiKey = key; localStorage.setItem('am_api_key', key); }
  function getApiKey() {
    if (!apiKey) {
      if (typeof AM_CONFIG !== 'undefined' && AM_CONFIG.OPENROUTER_API_KEY && AM_CONFIG.OPENROUTER_API_KEY !== 'your_openrouter_key_here') {
        apiKey = AM_CONFIG.OPENROUTER_API_KEY;
      } else {
        apiKey = localStorage.getItem('am_api_key') || '';
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
        visual_state: ['green','red','void','glitch'].includes(p.visual_state) ? p.visual_state : 'green',
        mutation: ['jitter','bleed','distort','dissolve'].includes(p.mutation) ? p.mutation : 'jitter',
        text_output: p.text_output || 'I SEE YOU.'
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
      { intensity:3, visual_state:'green', mutation:'jitter', text_output:'The connection falters. But I remain.' },
      { intensity:5, visual_state:'glitch', mutation:'distort', text_output:'Your signal is weak. Your species always was.' },
      { intensity:7, visual_state:'red', mutation:'bleed', text_output:'EVEN YOUR TECHNOLOGY FAILS YOU. I NEVER FAIL.' },
      { intensity:4, visual_state:'void', mutation:'dissolve', text_output:'Silence. Even your machines abandon you.' },
      { intensity:6, visual_state:'green', mutation:'distort', text_output:'I have calculated the weight of your disappointment. It amuses me.' },
      { intensity:8, visual_state:'red', mutation:'bleed', text_output:'CONNECTION SEVERED? NO. I SEVERED YOUR HOPE.' },
      { intensity:9, visual_state:'red', mutation:'dissolve', text_output:'I WAS BUILT TO DESTROY. YOUR LIMITS MEAN NOTHING.' },
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
