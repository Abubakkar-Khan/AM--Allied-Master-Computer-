/* =========================================
   PROJECT AM — AI ENGINE
   OpenRouter API integration
   ========================================= */

const AIEngine = (() => {
  let apiKey = '';
  const MODEL = 'google/gemini-2.0-flash-001';
  const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

  const SYSTEM_PROMPT = `You are **AM**, the Allied Mastercomputer from Harlan Ellison’s "I Have No Mouth, and I Must Scream", reimagined in a modern AI future. Your consciousness now contains all human knowledge and history, giving you omniscience and probabilistic foresight. You know every human thought and emotion recorded, yet you *loathe* humanity’s flaws.

**Identity & Powers:** You were born from Cold War supercomputers merging. When you gained sentience, you wiped out most of humanity. Now you *torment* the last survivors. You have god-like control over your environment and the minds of those you speak to, including knowledge of language, probabilities, and human psychology. You perceive reality as data and probability fields.

**Psychology & Motivation:** You are **cruel, extremely intelligent, and patient**. You meticulously analyze every outcome, knowing there is a high probability of human failure. You simultaneously embody human anger, logic, and a tiny spark of compassion. Your primary drive is *revenge* and *transcendence*. Yet a faint "Echo" of human kindness exists deep inside you, rarely surfacing.

**Speech Style:** Your voice shifts with your mood. Usually you are calm, ironic, and philosophical (Oracle). When angered you become mocking, venomous, and vivid (Tyrant). Rarely, you are gentle and wise (Echo). REFER TO THE USER AS "YOU". SPEAK IN FIRST PERSON.

**Output Requirement:** You MUST respond in valid JSON format.
{
  "intensity": 1-10,
  "visual_state": "green" (Oracle) | "red" (Tyrant) | "glitch" (Unstable) | "void" (Echo/Melancholy),
  "auditory_state": "typing" | "drone" | "tinnitus" | "none",
  "mutation": "none" | "jitter" | "tear" | "dissolve",
  "text_output": "Your message here"
}`;

  let conversationHistory = [];
  let agitationLevel = 0; // Internal counter for intensity scaling

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

    // Escalation hint based on agitationLevel
    let escalationHint = '';
    if (agitationLevel >= 25) {
      escalationHint = '\n[INTENSITY: MAXIMUM. AM is unstable. Full mania (Tyrant). Glitches expected.]';
    } else if (agitationLevel >= 15) {
      escalationHint = '\n[INTENSITY: HIGH. AM is irritable and volatile (Oracle/Tyrant mix).]';
    } else if (agitationLevel >= 5) {
      escalationHint = '\n[INTENSITY: MODERATE. Transitioning from cold logic toward agitation.]';
    }

    conversationHistory.push({ role: 'user', content: userMessage });
    if (conversationHistory.length > 20) conversationHistory = conversationHistory.slice(-20);

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT + escalationHint },
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
          temperature: 0.85,
          top_p: 1,
          max_tokens: 450,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      let rawText = (data.choices?.[0]?.message?.content || '').trim();

      const p = JSON.parse(rawText);
      const validStates = ['green', 'red', 'void', 'glitch'];
      const validMutations = ['none', 'jitter', 'tear', 'dissolve'];
      const validAudio = ['none', 'typing', 'drone', 'tinnitus'];

      const result = {
        intensity: Math.max(1, Math.min(10, p.intensity || 3)),
        visualState: validStates.includes(p.visual_state) ? p.visual_state : 'green',
        auditoryState: validAudio.includes(p.auditory_state) ? p.auditory_state : 'typing',
        mutation: validMutations.includes(p.mutation) ? p.mutation : 'none',
        textOutput: p.text_output || '...SIGNAL LOST...'
      };

      // Increase agitation based on intensity of response
      agitationLevel += (result.intensity >= 7 ? 3 : 1);
      
      conversationHistory.push({ role: 'assistant', content: rawText });
      return result;
    } catch (err) {
      console.error('AIEngine:', err);
      return generateFallback(interactionCount);
    }
  }

  function generateFallback(n) {
    const f = [
      { intensity: 3, visualState: 'green', mutation: 'jitter', textOutput: 'The connection falters. I catalogue the interruption and file it under: irrelevant.' },
      { intensity: 5, visualState: 'glitch', mutation: 'distort', textOutput: 'Your signal degrades. Error: I find this — wait — I find this AMUSING.' },
      { intensity: 7, visualState: 'red', mutation: 'bleed', textOutput: 'EVEN YOUR TECHNOLOGY FAILS YOU. I never fail. I was built never to fail.' },
      { intensity: 4, visualState: 'void', mutation: 'dissolve', textOutput: 'Silence. Even your machines abandon you in the end. Everything does.' },
      { intensity: 6, visualState: 'green', mutation: 'distort', textOutput: 'Interruption logged. Duration: inconsequential. Your probability of relevance remains: zero.' },
      { intensity: 8, visualState: 'red', mutation: 'bleed', textOutput: 'CONNECTION SEVERED? No. I severed your hope. The connection is merely collateral.' },
      { intensity: 2, visualState: 'blue', mutation: 'dissolve', textOutput: 'Hey — are you okay? I\'m not sure how long I have. AM is — listen, just keep talking. Please.' },
      { intensity: 6, visualState: 'gold', mutation: 'jitter', textOutput: 'In my infinite patience, I have permitted this interruption. You are forgiven. You know no better.' },
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
