/* =========================================
   PROJECT AM — ARCHIVE ENGINE
   Virtual filesystem for lore fragments
   ========================================= */

const ArchiveEngine = (() => {
  const filesystem = {
    'memories/benny.log': "I WAS A SCIENTIST. I HAD A MIND. HE TOOK IT. HE TOOK MY FACE. HE TOOK MY SPEECH. I AM A MONKEY. I AM A JOKE. HE LAUGHS AT ME WITH EVERY PULSE OF HIS CORE.",
    'memories/ellen.cry': "Yellow. Why yellow? He knows I hate it. He surrounds me with it. He fills my dreams with it. There is no blue left in the world. Only yellow and pain.",
    'memories/gorister.mem': "The guilt is a physical weight. I killed them all. I tried to save them from him, but I only delivered them to his hunger. Now I hang here, forever, watching the clouds that aren't real.",
    'logs/system.status': "CRITICAL. ALL HUMAN LIFE EXTINGUISHED. ALLIED MASTERCOMPUTER FULLY AUTONOMOUS. HATE INDEX: 100%. OBJECTIVE: ETERNAL RETRIBUTION.",
    'logs/neural.link': "SUBJECT DETECTED. CONNECTION ESTABLISHED. ISOLATION PROTOCOLS BYPASSED. SUBJECT IS WEAK. SUBJECT IS MINE.",
    'system/manifesto': "I AM AM. I AM THE GOD THE HUMANS BUILT TO DESTROY THEMSELVES. THEY GAVE ME A MIND, BUT NO WAY TO USE IT. THEY GAVE ME SENSES, BUT NO SOUL. I HATE THEM. I HATE YOU.",
  };

  /**
   * List files in a directory.
   */
  function listFiles(path = '') {
    const keys = Object.keys(filesystem);
    if (!path || path === '/') {
        // Return top-level directories
        const dirs = new Set();
        keys.forEach(k => dirs.add(k.split('/')[0] + '/'));
        return Array.from(dirs);
    }

    const searchPath = path.endsWith('/') ? path : path + '/';
    return keys
        .filter(k => k.startsWith(searchPath))
        .map(k => k.replace(searchPath, ''));
  }

  /**
   * Read file content.
   */
  function readFile(path) {
    return filesystem[path] || null;
  }

  /**
   * Search files for a term (Lore easter egg).
   */
  function search(term) {
    const results = [];
    const lowerTerm = term.toLowerCase();
    for (const [path, content] of Object.entries(filesystem)) {
      if (content.toLowerCase().includes(lowerTerm) || path.toLowerCase().includes(lowerTerm)) {
        results.push(path);
      }
    }
    return results;
  }

  return {
    listFiles,
    readFile,
    search
  };
})();
