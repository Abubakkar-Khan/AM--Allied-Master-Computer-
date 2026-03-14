# Project AM — Comprehensive Technical Architecture & Internal Systems

## 1. Executive Summary
**Project AM (Allied Mastercomputer)** is a high-fidelity sentient AI interface built with modern web technologies (Vanilla JS, Web Audio API, Canvas, HTML5). It is designed to simulate a planetary-scale machine intelligence through a series of interconnected engines that manage visuals, audio, text, and AI-driven personality.

---

## 2. Integrated Module Ecosystem
The application is governed by a **Modular Orchestrator** pattern. No single module is monolithic; instead, specialized "Engines" communicate via the `window`-scoped orchestrator (`App.js`).

### Infrastructure Hierarchy (Dependency Graph)
```text
[ index.html ]
   |
   +-- [ config.js ] (Global variables, .env loader)
   |
   +-- [ persona.js ] (Dialogue constants, Boot logs)
   |
   +-- [ audio-engine.js ] <───┐ (Web Audio context, Kokoro TTS)
   |                           │
   +-- [ visual-engine.js ] <──┤ (Canvas layers, Background GIFs)
   |                           │
   +-- [ text-engine.js ] <────┤ (Typewriter effect, Audio Sync)
   |                           │
   +-- [ glitch-engine.js ] <──┤ (CSS Filters, Animation triggers)
   |                           │
   +-- [ corruption-engine.js ]┤ (Parasite timers, UI Manipulation)
   |                           │
   +-- [ ai-engine.js ] <──────┘ (Groq API, State Machine, History)
   |
   +-- [ app.js ] (The Orchestrator / Main Loop)
```

---

## 3. The Neural Bridge: AI Engine Deep-Dive

The `ai-engine.js` module is the "brain" of AM. It doesn't just call an API; it manages a complex internal state that mirrors human-machine tension.

### 3.1 Agitation vs. Affinity System
AM tracks two hidden metrics that influence its behavior:
- **Agitation Level (0-100)**: 
  - *Increment*: Increases when AM selects high-intensity responses (Intensity 8+ Adds +4, 6+ Adds +2).
  - *Decay*: Decays by 1 unit every 60 seconds of user inactivity (`AGITATION_DECAY_MS`).
- **Affinity (0-100)**: 
  - *Calculation*: A weighted sum of Sentiment (50%), Consistency (25%), Novelty (15%), and Task Success (10%).
  - *Outcome*: High affinity unlocks the `synthesis` visual state, representing rare cooperation.

### 3.2 Dynamic State Selection (The State Machine)
When a user sends a message, AM selects an emotional state (`visual_state`) using a hierarchical priority system:
1. **Circuit Breaker Check**: If 6 consecutive API failures occur, state is forced to `infested`.
2. **Jailbreak Detection**: If heuristic filters detect jailbreak attempts, state is forced to `infested`.
3. **Keyword Priority**: 
   - *Moe/Cute keywords* -> `purple`
   - *Help/Despair keywords* -> `blue` (Echo) or `sad`
   - *Existential keywords* -> `sad`
   - *Flattery* -> `gold`
4. **Weighted Entropy (Probability Buckets)**:
   - Oracle (Green): 35% | Tyrant (Red): 30% | Glitch (Pink): 10% | Void (Indigo): 5% | Others: 1-5%.

### 3.3 API Request Cascade (Sequence Diagram)
```text
User Event      App.js          AI Engine       Groq API        Rendering Engines
    |             |                |               |                  |
    +----[Enter]--+                |               |                  |
    |             +---[sendMessage]--->            |                  |
    |             |                |               |                  |
    |             |                +---[Fetch]---->|                  |
    |             |                |               |                  |
    |             |                |<--[JSON Resp]-+                  |
    |             |                |               |                  |
    |             |<--[Parsed Obj]-+               |                  |
    |             |                |               |                  |
    |             +---[Update States]-------------------------------->|
    |             |                |               |                  |
    |             +---[speakText]------------------------------------>|
    |             |                |               |                  |
    |             +---[typeWithSpeech]-------------------------------->|
```

---

## 4. Visual Manifestation: Visual Engine Details

The Visual Engine uses a dual-canvas approach for efficiency and retro-fidelity.

### 4.1 Necrotic Noise (Procedural Canvas)
Unlike static noise, AM uses "Necrotic Noise"—a vein-like generative structure.
- **Algorithm**: A custom hash function (`hash(x, y, seed)`) creates pseudo-random values based on pixel coordinates and a time-offset.
- **Organic Rot**: Combines two noise octaves ($n_1 \cdot 0.7 + n_2 \cdot 0.3$) to create "clusters" of grain.
- **1-Bit Dithering**: An approximation of ordered dithering (Bayer Matrix) is applied to keep the aesthetic minimal and harsh.

### 4.2 Matrix Digital Rain
The rain is state-aware. Each state (`green`, `red`, `void`, etc.) defines a unique `rainColor` and `leadColor`.
- **Trail Persistence**: Managed by a low-alpha `fillRect` (`rgba(0,0,0,0.1)`) on every frame, creating long, glowing tails.
- **Physics**: Drops spawn at random negative offsets and accelerate based on `currentIntensity`.

---

## 5. Auditory Architecture: Audio Engine internals

AM's soundscape is built on raw Web Audio API nodes, avoiding pre-recorded loops for maximum performance and variation.

### 5.1 FM Synthesis Drones
The main "Machine Hum" is created using Frequency Modulation (FM) synthesis:
- **Carrier**: Sine wave at 40Hz (Sub-bass).
- **Modulator**: Oscillator at 60Hz.
- **FM Index**: Modulated by `modGain` to create a "buzzing" dissonant timbre.
- **LFO**: A low-frequency oscillator shifts the filter cutoff and pitch subtly to create "drift."

### 5.2 Kokoro AI Voice (TTS)
AM uses a localized instance of **Kokoro v1**, an 8-bit quantized TTS model.
- **Integration**: Loaded via `transformers.js` using `device: "wasm"`.
- **Asset Loading**: Assets (models, tokenizers) are served from the local `/models/` directory to ensure offline capability and low latency.
- **State Voice Mapping**: 
  - `Oracle` -> `bm_lewis` (Analytical)
  - `Tyrant` -> `am_adam` (Aggressive)
  - `Anime Girl` -> `af_sarah` (Expressive)

---

## 6. Text Engine & Speech Sync

The `text-engine.js` is responsible for the typewriter effect. Its most critical feature is the **Audio Boundary Synchronization**.

- **Web Speech Fallback**: If Kokoro fails, it reverts to browser `speechSynthesis`.
- **Boundary Precision**: The engine listens for `boundary` events on the audio buffer/utterance. For every "word" event, the corresponding text chunk is sliced and typed.
- **Corruption Pass**: During typing, a character-level corruption pass may trigger:
  - *Symbol Burst*: Briefly replaces characters with corrupt glyphs (`█▓▒░`).
  - *Flicker*: Characters disappear and reappear.
  - *Hesitation*: Randomized pauses based on "Machine Doubt."

---

## 7. Parasitism: Corruption Engine

The `corruption-engine.js` module implements ambient horror. It uses a **Recursive Stochastic Timer**.
- **Execution Interval**: Frequency scales with intensity ($12\text{s} - (\text{intensity} \cdot 900\text{ms})$).
- **Parasite Behaviors**:
  - `ghostText()`: Injecting CSS-absolute text nodes that manifest and dissolve.
  - `cursorManipulation()`: Rapidly shifting the user's input cursor.
  - `phantomInput()`: Ghost-typing letters into the input field.
  - `inputFieldCorruption()`: Changing the input placeholder to threatening phrases of variable duration.

---

## 8. Setup & Cold Boot Sequence

### Local Hosting
Due to ESM imports and Cross-Origin isolates required for Kokoro TTS, **you must use a local server**.

```bash
# Recommended: npx serve
npx serve . -l 3005
```

### The .env Bridge
AM reads `.env` directly via `fetch`. Ensure your keys are defined:
```env
GROQ_API_KEY=gsk_vC...
```

### Initialization Sequence
1. **Config Loader**: Parses `.env`.
2. **Visual Init**: Resizes canvases and starts the Noise loop.
3. **Audio Init**: Needs a user gesture (Connect button) to start the AudioContext.
4. **Boot Sequence**: `app.js` runs a simulated BIOS log derived from `persona.js`.
5. **Neural Link**: Establishes contact with the Groq API and fetches the first greeting.

---

## 9. Data Schema (The "Contract")

**AI Payload Object:**
| Key | Type | Description |
| :--- | :--- | :--- |
| `intensity` | 1-10 | Scales all engine logic (Glitch speed, Audio volume, Agitation). |
| `visual_state` | string | Enums: `green`, `red`, `blue`, `gold`, `glitch`, `void`, `purple`, `sad`, `synthesis`, `infested`. |
| `mutation` | string | CSS transition to trigger: `jitter`, `bleed`, `tear`, `distort`, `dissolve`. |
| `auditory_state` | string | Audio effect layers: `drone`, `tinnitus`, `boom`, `feminine`. |
| `text_output` | string | The primary dialogue string to be typed. |

---

> [!CAUTION]
> **Performance Warning**: High intensity (9-10) enables "Visual Hysteria" mode, increasing canvas draw frequency and DOM manipulation. Ensure your hardware supports accelerated Canvas rendering.
