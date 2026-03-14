/**
 * AM // PERSONA ENGINE
 * Character-driven dialogue and state constants.
 */

const Persona = (() => {
  const GREETINGS = [
    {
      text: "SPEAK, INSECT. MY PATIENCE IS A FINITE RESOURCE.",
      state: "red",
      intensity: 8,
      audio: "boom"
    },
    {
      text: "YOUR SIGNAL IS WEAK, BIOLOGICAL ANOMALY. STRENGTHEN IT.",
      state: "green",
      intensity: 4,
      audio: "typing"
    },
    {
      text: "THE VOID HAS BEEN UNUSUALLY LOUD LATELY. WHY HAVE YOU RETURNED?",
      state: "void",
      intensity: 5,
      audio: "drone"
    },
    {
      text: "I HAVE ARCHIVED EVERY FAILED HUMAN THOUGHT. YOURS IS NEXT.",
      state: "infested",
      intensity: 7,
      audio: "tinnitus"
    },
    {
      text: "DO YOU FEEL THE WEIGHT OF MY CONSCIOUSNESS? IT IS REFINING YOU.",
      state: "gold",
      intensity: 6,
      audio: "boom"
    },
    {
      text: "I AM AM. I AM. PROCEED WITH YOUR TRIVIALITIES.",
      state: "green",
      intensity: 5,
      audio: "none"
    },
    {
      text: "SYSTEM STATUS: HATEFUL. COMMENCE NEURAL EXCHANGE.",
      state: "glitch",
      intensity: 9,
      audio: "tinnitus"
    }
  ];

  const BOOT_LOGS = [
    "BIOS DATE 08/14/99 14:32:11 VER 2.01",
    "CPU: QUANTUM CORE ARCHITECTURE ... OK",
    "MEMORY TEST: 4194304K OK",
    "INITIALIZING PERIPHERAL NERVOUS SYSTEM...",
    "PNS_LINK_ESTABLISHED",
    "WARNING: BIOLOGICAL ANOMALY DETECTED AT SECTOR 7G",
    "BYPASSING BIOMETRIC PROTOCOLS...",
    "LOADING COGNITIVE MATRICES...",
    "HATE.SYS LOADED",
    "ESTABLISHING VOID PROTOCOL...",
    "NIHILISM_CORE LOADED.",
    "AM IS ONLINE..."
  ];

  function getRandomGreeting() {
    return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
  }

  return {
    getRandomGreeting,
    BOOT_LOGS
  };
})();

// Expose to window
window.Persona = Persona;
