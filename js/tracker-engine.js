/* ============================================================
   tracker-engine.js — reads TRACKER_CONFIGS, builds all UI
   Don't edit this file to add trackers — edit tracker-config.js
   ============================================================ */

let activeTrackerIdx = 0;

function getConfig() { return TRACKER_CONFIGS[activeTrackerIdx]; }

// ── Storage ──────────────────────────────────────────────────
function getEntries(cfg) {
  cfg = cfg || getConfig();
  try { return JSON.parse(localStorage.getItem(cfg.storageKey) || '[]'); } catch { return []; }
}

function saveEntries(entries, cfg) {
  cfg = cfg || getConfig();
  localStorage.setItem(cfg.storageKey, JSON.stringify(entries));
}

// ── Build full tracker UI from config ────────────────────────
function buildTrackerUI() {
  const cfg = getConfig();

  // Type nav tabs (one per TRACKER_CONFIGS entry)
  const nav = document.getElementById('tracker-type-nav');
  nav.innerHTML = TRACKER_CONFIGS.map((c, i) =>
    `<button class="month-btn ${i === activeTrackerIdx ? 'active' : ''}"
      style="--accent-color:#a8d8ea"
      onclick="switchTracker(${i})">${c.label}</button>`
  ).join('');

  // Sub-tabs + panels
  const container = document.getElementById('tracker-dynamic-container');
  const settingsTab = cfg.hasSettings ? `<button class="month-btn" id="tab-settings" style="--accent-color:#a8d8ea" onclick="showTrackerTab('settings')">Settings</button>` : '';
  const settingsPanel = cfg.hasSettings ? `<div id="tracker-settings" style="display:none;">${buildSettingsShell(cfg)}</div>` : '';

  container.innerHTML = `
    <div style="display:flex;gap:4px;border-bottom:1px solid rgba(184,157,224,0.1);margin-bottom:32px;">
      <button class="month-btn active" id="tab-log"        style="--accent-color:#a8d8ea" onclick="showTrackerTab('log')">Log Entry</button>
      <button class="month-btn"        id="tab-history"    style="--accent-color:#a8d8ea" onclick="showTrackerTab('history')">History</button>
      <button class="month-btn"        id="tab-benchmarks" style="--accent-color:#a8d8ea" onclick="showTrackerTab('benchmarks')">Benchmarks</button>
      ${settingsTab}
    </div>
    <div id="tracker-log">${buildLogForm(cfg)}</div>
    <div id="tracker-history"   style="display:none;">${buildHistoryShell()}</div>
    <div id="tracker-benchmarks" style="display:none;">${buildBenchmarksShell(cfg)}</div>
    ${settingsPanel}`;

  // Set today's date as default
  const dateEl = document.getElementById('field-date');
  if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];

  // Load settings if this tracker has them
  if (cfg.hasSettings) loadSettings();
}

function switchTracker(idx) {
  activeTrackerIdx = idx;
  buildTrackerUI();
}

function showTrackerTab(tab) {
  const cfg = getConfig();
  const tabs = ['log','history','benchmarks'];
  if (cfg.hasSettings) tabs.push('settings');
  
  tabs.forEach(t => {
    const el = document.getElementById('tracker-' + t);
    if (el) el.style.display = t === tab ? 'block' : 'none';
    const tabEl = document.getElementById('tab-' + t);
    if (tabEl) tabEl.classList.toggle('active', t === tab);
  });
  if (tab === 'history')    renderHistory();
  if (tab === 'benchmarks') renderBenchmarks();
  if (tab === 'settings')   renderMacroCalc();
}

// ── Build log form HTML ───────────────────────────────────────
function buildLogForm(cfg) {
  const metaFields = cfg.meta.map(f =>
    `<div class="tracker-field">${fieldLabel(f)}${fieldInput(f)}</div>`
  ).join('');
  const metaRow = `<div style="grid-column:1/-1;display:grid;grid-template-columns:repeat(${cfg.meta.length},1fr);gap:16px;">${metaFields}</div>`;

  const cards = cfg.cards.map(card => {
    const style = card.fullWidth ? 'grid-column:1/-1;' : '';
    let fieldsHTML;
    if (card.inlineGrid) {
      const inline = card.fields.slice(0, card.inlineGrid);
      const rest   = card.fields.slice(card.inlineGrid);
      fieldsHTML =
        `<div style="display:grid;grid-template-columns:repeat(${card.inlineGrid},1fr);gap:16px;">` +
        inline.map(f => `<div class="tracker-field">${fieldLabel(f)}${fieldInput(f)}</div>`).join('') +
        `</div>` +
        rest.map(f => `<div class="tracker-field" style="margin-top:8px;">${fieldLabel(f)}${fieldInput(f)}</div>`).join('');
    } else {
      fieldsHTML = card.fields.map(f =>
        `<div class="tracker-field">${fieldLabel(f)}${fieldInput(f)}</div>`
      ).join('');
    }
    return `<div class="tracker-card" style="${style}">
      <div class="tracker-card-title">${card.title}</div>${fieldsHTML}</div>`;
  }).join('');

  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
      ${metaRow}${cards}
    </div>
    <div style="display:flex;gap:12px;margin-top:24px;align-items:center;flex-wrap:wrap;">
      <button class="save-btn" onclick="saveEntry()">💾 Save Entry</button>
      <button class="clear-btn" onclick="clearForm()">Clear Form</button>
      <span id="save-confirm" style="font-family:'DM Mono',monospace;font-size:12px;color:#3a9e7a;opacity:0;transition:opacity 0.5s;">✓ Entry saved!</span>
    </div>`;
}

function fieldLabel(f) {
  return `<label>${f.label}</label>`;
}

function fieldInput(f) {
  const id = `field-${f.key}`;
  switch (f.type) {
    case 'date':
      return `<input type="date" id="${id}">`;
    case 'number':
      return `<input type="number" id="${id}" placeholder="${f.placeholder||''}" min="0" ${f.step ? `step="${f.step}"` : ''}>`;
    case 'select': {
      const opts = (f.options||[]).map(o => `<option value="${o}">${o}</option>`).join('');
      return `<select id="${id}"><option value="">— select —</option>${opts}</select>`;
    }
    case 'range': {
      const def   = f.default || 5;
      const valId = `val-${f.key}`;
      return `<input type="range" id="${id}" min="${f.min||1}" max="${f.max||10}" value="${def}"
        oninput="document.getElementById('${valId}').textContent=this.value">
        <span id="${valId}" class="range-val">${def}</span>`;
    }
    case 'textarea':
      return `<textarea id="${id}" rows="3" placeholder="${f.placeholder||''}"></textarea>`;
    default:
      return `<input type="text" id="${id}">`;
  }
}

// ── Build history shell ───────────────────────────────────────
function buildHistoryShell() {
  return `
    <div style="background:rgba(168,216,234,0.04);border:1px solid rgba(168,216,234,0.1);border-radius:6px;padding:16px 20px;margin-bottom:24px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;justify-content:space-between;">
      <div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--ice-deep);margin-bottom:4px;">Data Backup</div>
        <div style="font-size:13px;font-style:italic;color:var(--muted);">Export your data as a JSON file to back it up or move to a new browser.</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <button class="save-btn" onclick="exportData()" style="padding:9px 18px;font-size:11px;">⬇ Export JSON</button>
        <button class="save-btn" onclick="document.getElementById('import-file').click()" style="padding:9px 18px;font-size:11px;background:rgba(201,169,110,0.1);border-color:rgba(201,169,110,0.3);color:var(--gold-light);">⬆ Import JSON</button>
        <input type="file" id="import-file" accept=".json" style="display:none;" onchange="importData(event)">
        <span id="import-confirm" style="font-family:'DM Mono',monospace;font-size:11px;color:#3a9e7a;opacity:0;transition:opacity 0.5s;">✓ Imported!</span>
        <span id="import-error"   style="font-family:'DM Mono',monospace;font-size:11px;color:#e08080;opacity:0;transition:opacity 0.5s;">✕ Invalid file</span>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
      <div style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);">All Logged Sessions</div>
      <button id="clear-all-btn" class="clear-btn" onclick="clearAllData()" style="background:rgba(192,80,80,0.1);border-color:rgba(192,80,80,0.3);color:#e08080;">🗑 Clear All Data</button>
    </div>
    <div id="history-list"></div>
    <div id="history-empty" style="text-align:center;padding:60px 20px;color:var(--muted);font-style:italic;font-size:16px;">No entries yet. Log your first session above!</div>`;
}

// ── Build benchmarks shell ────────────────────────────────────
function buildBenchmarksShell(cfg) {
  const pbCards = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px;" id="pb-grid"></div>`;
  const charts  = cfg.charts.map(ch => `
    <div style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin:32px 0 16px;">${ch.title}</div>
    <div id="${ch.id}-chart-wrap" style="background:rgba(17,34,64,0.6);border:1px solid rgba(168,216,234,0.1);border-radius:6px;padding:24px;">
      <canvas id="${ch.id}-chart"></canvas>
      <div id="${ch.id}-empty" style="text-align:center;color:var(--muted);font-style:italic;padding:40px 0;display:none;">Log data to see this chart.</div>
    </div>`).join('');
  return `
    <div style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:24px;">Personal Bests & Progress Over Time</div>
    ${pbCards}${charts}`;
}

// ── Save entry ────────────────────────────────────────────────
function saveEntry() {
  const cfg   = getConfig();
  const entry = { id: Date.now() };
  cfg.meta.forEach(f => {
    const el = document.getElementById(`field-${f.key}`);
    if (el) entry[f.key] = el.value;
  });
  cfg.cards.forEach(card => {
    card.fields.forEach(f => {
      const el = document.getElementById(`field-${f.key}`);
      if (el) entry[f.key] = el.value;
    });
  });
  const entries = getEntries();
  entries.unshift(entry);
  saveEntries(entries);

  const confirmEl = document.getElementById('save-confirm');
  confirmEl.style.opacity = '1';
  setTimeout(() => confirmEl.style.opacity = '0', 2500);
}

// ── Clear form ────────────────────────────────────────────────
function clearForm() {
  const cfg       = getConfig();
  const allFields = [...cfg.meta, ...cfg.cards.flatMap(c => c.fields)];
  allFields.forEach(f => {
    const el = document.getElementById(`field-${f.key}`);
    if (!el) return;
    if (f.type === 'range') {
      el.value = f.default || 5;
      const valEl = document.getElementById(`val-${f.key}`);
      if (valEl) valEl.textContent = f.default || 5;
    } else if (f.type === 'date') {
      el.value = new Date().toISOString().split('T')[0];
    } else {
      el.value = '';
    }
  });
}

// ── Clear all / delete entry ──────────────────────────────────
function clearAllData() {
  const btn = document.getElementById('clear-all-btn');
  if (btn.dataset.confirming === 'true') {
    localStorage.removeItem(getConfig().storageKey);
    btn.textContent = '🗑 Clear All Data';
    btn.dataset.confirming = 'false';
    btn.style.background = 'rgba(192,80,80,0.1)';
    renderHistory();
    renderBenchmarks();
  } else {
    btn.textContent = '⚠ Click again to confirm';
    btn.dataset.confirming = 'true';
    btn.style.background = 'rgba(192,80,80,0.25)';
    setTimeout(() => {
      if (btn.dataset.confirming === 'true') {
        btn.textContent = '🗑 Clear All Data';
        btn.dataset.confirming = 'false';
        btn.style.background = 'rgba(192,80,80,0.1)';
      }
    }, 4000);
  }
}

function deleteEntry(id) {
  const entries = getEntries().filter(e => e.id !== id);
  saveEntries(entries);
  renderHistory();
  renderBenchmarks();
}

// ── Helpers ───────────────────────────────────────────────────
function fmtDate(str) {
  if (!str) return '—';
  return new Date(str + 'T12:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

// ── Render history ────────────────────────────────────────────
function renderHistory() {
  const cfg     = getConfig();
  const entries = getEntries();
  const list    = document.getElementById('history-list');
  const empty   = document.getElementById('history-empty');
  if (!list) return;

  if (entries.length === 0) { list.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  list.innerHTML = entries.map(e => {
    const stats = cfg.historyStats
      .filter(s => e[s.key])
      .map(s => `${s.label}: <span>${e[s.key]}${s.suffix(e)}</span>`);

    const selectStats = (cfg.historySelectStats || [])
      .filter(k => e[k])
      .map(k => `${k}: <span>${e[k]}</span>`);

    // Extract month number from "Month 1 — Foundation" format
    const monthNum = e.month ? parseInt(e.month.toString().match(/\d+/)?.[0] || '0') : 0;
    const metaMonthVal = monthNum - 1;
    const color        = (cfg.metaColorKeys || [])[metaMonthVal] || '#8b5fbf';
    const monthField   = cfg.meta.find(f => f.key === 'month');
    const weekField    = cfg.meta.find(f => f.key === 'week');
    const weekNum      = weekField && e.week ? e.week.toString().match(/\d+/)?.[0] || '?' : '?';
    const metaTag      = (monthField && e.month) ? `M${monthNum} · W${weekNum}` : fmtDate(e.date);

    return `<div class="history-entry">
      <button class="delete-btn" onclick="deleteEntry(${e.id})" title="Delete entry">✕</button>
      <div class="history-entry-header">
        <div class="history-entry-date">${fmtDate(e.date)}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <div class="history-entry-tag" style="color:${color};border-color:${color}40;">${metaTag}</div>
          ${e.day ? `<div class="history-entry-tag">${e.day}</div>` : ''}
        </div>
      </div>
      ${stats.length ? `<div class="history-entry-stats">${stats.map(s=>`<div class="history-stat">${s}</div>`).join('')}</div>` : ''}
      ${selectStats.length ? `<div class="history-entry-stats" style="margin-top:8px;">${selectStats.map(s=>`<div class="history-stat">${s}</div>`).join('')}</div>` : ''}
      ${e.notes ? `<div class="history-notes">"${e.notes}"</div>` : ''}
    </div>`;
  }).join('');
}

// ── Render benchmarks ─────────────────────────────────────────
function renderBenchmarks() {
  const cfg     = getConfig();
  const entries = getEntries().slice().reverse(); // chronological
  const pbGrid  = document.getElementById('pb-grid');
  if (!pbGrid) return;

  pbGrid.innerHTML = cfg.benchmarks.map(b => {
    const best = entries.reduce((max, e) => {
      const v = parseFloat(e[b.key]);
      return (!isNaN(v) && v > max) ? v : max;
    }, 0);
    const has = best > 0;
    return `<div class="pb-card">
      <div class="pb-card-label">${b.label}</div>
      <div class="pb-card-value" style="color:${has ? b.color : 'var(--muted)'};">${has ? best : '—'}</div>
      <div class="pb-card-unit">${has ? b.unit : 'no data yet'}</div>
    </div>`;
  }).join('');

  cfg.charts.forEach(ch => {
    const datasets = ch.fields.map(f => ({
      key: f.key, label: f.label, color: f.color,
      points: entries
        .filter(e => e[f.key] && !isNaN(parseFloat(e[f.key])))
        .map(e => ({ label: fmtDate(e.date).replace(/,.*/, ''), v: parseFloat(e[f.key]) }))
    })).filter(d => d.points.length >= 1);

    const wrapEl = document.getElementById(`${ch.id}-chart-wrap`);
    if (!wrapEl) return;
    makeSVGLineChart({
      wrap: wrapEl,
      canvasId: `${ch.id}-chart`,
      emptyId:  `${ch.id}-empty`,
      datasets,
      height: 200,
      showLegend: ch.fields.length > 1,
    });
  });
}

// ── Settings (for nutrition tracker) ──────────────────────────
function buildSettingsShell(cfg) {
  if (!cfg.settingsFields) return '';
  
  const fields = cfg.settingsFields.map(f => `
    <div class="tracker-field">${fieldLabel(f)}${fieldInput(f)}</div>`
  ).join('');

  return `
    <div style="max-width:600px;">
      <div style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:24px;">Personal Settings for Macro Calculation</div>
      <div class="tracker-card">
        <div class="tracker-card-title">📊 Your Stats</div>
        ${fields}
      </div>
      <div style="display:flex;gap:12px;margin-top:24px;">
        <button class="save-btn" onclick="saveSettings()">💾 Save Settings</button>
        <span id="settings-confirm" style="font-family:'DM Mono',monospace;font-size:12px;color:#3a9e7a;opacity:0;transition:opacity 0.5s;">✓ Saved!</span>
      </div>
      
      <div id="macro-results" style="margin-top:32px;"></div>
    </div>`;
}

function loadSettings() {
  const cfg = getConfig();
  if (!cfg.hasSettings) return;
  
  const stored = localStorage.getItem(`${cfg.storageKey}_settings`);
  if (!stored) return;
  
  try {
    const settings = JSON.parse(stored);
    cfg.settingsFields.forEach(f => {
      const el = document.getElementById(`field-${f.key}`);
      if (el && settings[f.key]) el.value = settings[f.key];
    });
  } catch {}
}

function saveSettings() {
  const cfg = getConfig();
  const settings = {};
  cfg.settingsFields.forEach(f => {
    const el = document.getElementById(`field-${f.key}`);
    if (el) settings[f.key] = el.value;
  });
  localStorage.setItem(`${cfg.storageKey}_settings`, JSON.stringify(settings));
  
  const confirmEl = document.getElementById('settings-confirm');
  confirmEl.style.opacity = '1';
  setTimeout(() => confirmEl.style.opacity = '0', 2500);
  
  renderMacroCalc();
}

function renderMacroCalc() {
  const cfg = getConfig();
  if (!cfg.hasSettings) return;
  
  const stored = localStorage.getItem(`${cfg.storageKey}_settings`);
  if (!stored) {
    document.getElementById('macro-results').innerHTML = `
      <div style="text-align:center;color:var(--muted);font-style:italic;padding:40px 0;">
        Fill in your settings above and save to see macro recommendations.
      </div>`;
    return;
  }
  
  const s = JSON.parse(stored);
  if (!s.age || !s.sex || !s.heightFt || !s.activityLevel || !s.goal) {
    document.getElementById('macro-results').innerHTML = `
      <div style="text-align:center;color:var(--muted);font-style:italic;padding:40px 0;">
        Complete all fields above to calculate macros.
      </div>`;
    return;
  }
  
  // Get current weight from most recent entry
  const entries = getEntries();
  const recentWeight = entries.find(e => e.weight);
  if (!recentWeight) {
    document.getElementById('macro-results').innerHTML = `
      <div style="text-align:center;color:var(--muted);font-style:italic;padding:40px 0;">
        Log at least one entry with your weight to calculate macros.
      </div>`;
    return;
  }
  
  const weightLbs = recentWeight.weightUnit === 'kg' ? recentWeight.weight * 2.20462 : parseFloat(recentWeight.weight);
  const heightIn = (parseInt(s.heightFt) * 12) + parseInt(s.heightIn || 0);
  
  // Mifflin-St Jeor BMR
  const weightKg = weightLbs / 2.20462;
  const heightCm = heightIn * 2.54;
  const bmr = s.sex === 'Male' 
    ? (10 * weightKg) + (6.25 * heightCm) - (5 * parseInt(s.age)) + 5
    : (10 * weightKg) + (6.25 * heightCm) - (5 * parseInt(s.age)) - 161;
  
  const activityMultipliers = {
    'Sedentary (little/no exercise)': 1.2,
    'Lightly active (1-3 days/week)': 1.375,
    'Moderately active (3-5 days/week)': 1.55,
    'Very active (6-7 days/week)': 1.725,
    'Extremely active (athlete)': 1.9
  };
  
  const tdee = bmr * (activityMultipliers[s.activityLevel] || 1.55);
  
  let targetCals, protein, carbs, fats;
  if (s.goal === 'Lose weight') {
    targetCals = tdee - 500;
    protein = Math.round(weightLbs * 1.0);
    fats = Math.round(weightLbs * 0.35);
    carbs = Math.round((targetCals - (protein * 4) - (fats * 9)) / 4);
  } else if (s.goal === 'Gain muscle') {
    targetCals = tdee + 300;
    protein = Math.round(weightLbs * 1.2);
    fats = Math.round(weightLbs * 0.4);
    carbs = Math.round((targetCals - (protein * 4) - (fats * 9)) / 4);
  } else {
    targetCals = tdee;
    protein = Math.round(weightLbs * 0.8);
    fats = Math.round(weightLbs * 0.35);
    carbs = Math.round((targetCals - (protein * 4) - (fats * 9)) / 4);
  }
  
  document.getElementById('macro-results').innerHTML = `
    <div style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:16px;">Your Recommended Macros</div>
    <div class="tracker-card">
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;">
        <div style="text-align:center;padding:20px;background:rgba(139,95,191,0.08);border-radius:6px;">
          <div style="font-size:36px;font-family:'Bebas Neue',sans-serif;color:#8b5fbf;">${Math.round(targetCals)}</div>
          <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);margin-top:4px;">CALORIES/DAY</div>
          <div style="font-size:12px;color:var(--silver);margin-top:8px;">BMR: ${Math.round(bmr)} · TDEE: ${Math.round(tdee)}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div style="padding:12px;background:rgba(192,112,160,0.08);border-radius:6px;">
            <div style="font-size:24px;font-family:'Bebas Neue',sans-serif;color:#c070a0;">${protein}g</div>
            <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);">PROTEIN</div>
          </div>
          <div style="padding:12px;background:rgba(158,122,184,0.08);border-radius:6px;">
            <div style="font-size:24px;font-family:'Bebas Neue',sans-serif;color:#9e7ab8;">${carbs}g</div>
            <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);">CARBS</div>
          </div>
          <div style="padding:12px;background:rgba(184,157,224,0.08);border-radius:6px;">
            <div style="font-size:24px;font-family:'Bebas Neue',sans-serif;color:#b89de0;">${fats}g</div>
            <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);">FATS</div>
          </div>
        </div>
      </div>
      <div style="margin-top:20px;font-size:13px;color:var(--muted);font-style:italic;line-height:1.6;">
        Based on your current weight (${Math.round(weightLbs)} lbs), activity level, and goal to ${s.goal.toLowerCase()}. These are estimates — adjust based on how your body responds over 2-3 weeks.
      </div>
    </div>`;
}

// ── Init ──────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => { buildTrackerUI(); });
