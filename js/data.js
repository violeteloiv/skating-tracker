/* ============================================================
   data.js — export to JSON file and import from JSON file
   ============================================================ */

function exportData() {
  const entries = getEntries();
  if (entries.length === 0) {
    alert('No data to export yet — log some sessions first!');
    return;
  }
  const payload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    entries
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `skating-data-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);

      // Accept both { entries: [...] } wrapper and a bare array
      const incoming = Array.isArray(parsed) ? parsed
                     : (Array.isArray(parsed.entries) ? parsed.entries : null);
      if (!incoming) throw new Error('Unrecognised format');

      // Validate each entry has at minimum an id and date
      const valid = incoming.filter(en => en.id && en.date);
      if (valid.length === 0) throw new Error('No valid entries found');

      // Merge: keep existing, add only entries not already present
      const existing    = getEntries();
      const existingIds = new Set(existing.map(en => en.id));
      const merged      = [...existing];
      let addedCount    = 0;
      valid.forEach(en => {
        if (!existingIds.has(en.id)) { merged.push(en); addedCount++; }
      });

      // Sort by date descending (newest first)
      merged.sort((a, b) => new Date(b.date) - new Date(a.date));
      saveEntries(merged);

      const confirmEl = document.getElementById('import-confirm');
      confirmEl.textContent = `✓ ${addedCount} new entr${addedCount === 1 ? 'y' : 'ies'} imported!`;
      confirmEl.style.opacity = '1';
      setTimeout(() => { confirmEl.style.opacity = '0'; }, 3000);

      renderHistory();
      renderBenchmarks();

    } catch (err) {
      const errEl = document.getElementById('import-error');
      errEl.style.opacity = '1';
      setTimeout(() => { errEl.style.opacity = '0'; }, 3000);
    }

    // Reset so the same file can be re-imported if needed
    event.target.value = '';
  };
  reader.readAsText(file);
}
