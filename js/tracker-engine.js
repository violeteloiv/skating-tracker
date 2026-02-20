/* ============================================================
   tracker-engine.js — reads TRACKER_CONFIGS, builds all UI
   Don't edit this file to add trackers — edit tracker-config.js
   ============================================================ */

const APP_VERSION = 'v2.4.0';

// ── Workout Intensity Engine ──────────────────────────────────
//
// Targets are based on what the training plan PRESCRIBES for each
// day of the week in a given phase — not on what was actually logged.
// This means nutrition targets are always populated even before you
// log a session for the day.
//
// MET (Metabolic Equivalent of Task) sources:
//   Compendium of Physical Activities, Ainsworth et al. 2011
//   Figure skating MET: ~7.0 (recreational-to-vigorous, ACSM)

// ── Prescribed schedule per phase ────────────────────────────
// Keys are JS getDay() values: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
// Each entry: { met, label, type, durationMins }
const PHASE_SCHEDULE = {
  // Phase 1 — Basics 1–2: Foundation. Gentle strength, flexibility, balance.
  1: {
    1: { met: 4.5, label: 'Lower body & balance',  type: 'strength',    durationMins: 45 }, // Mon
    2: { met: 4.0, label: 'Core & posture',         type: 'strength',    durationMins: 45 }, // Tue
    3: { met: 3.0, label: 'Flexibility & mobility', type: 'flexibility', durationMins: 40 }, // Wed
    4: { met: 3.5, label: 'Arms & posture',         type: 'strength',    durationMins: 40 }, // Thu
    5: { met: 4.5, label: 'Full-body simulation',   type: 'cardio',      durationMins: 45 }, // Fri
    6: { met: 1.3, label: 'Rest / light walk',      type: 'rest',        durationMins: 0  }, // Sat
    0: { met: 1.3, label: 'Rest',                   type: 'rest',        durationMins: 0  }, // Sun
  },
  // Phase 2 — Basics 3–4: Build. Single-leg strength, edge work, cardio added.
  2: {
    1: { met: 5.0, label: 'Single-leg strength',    type: 'strength',    durationMins: 50 },
    2: { met: 4.5, label: 'Core stability',         type: 'strength',    durationMins: 45 },
    3: { met: 3.5, label: 'Deep flexibility',       type: 'flexibility', durationMins: 40 },
    4: { met: 4.0, label: 'Upper body & arms',      type: 'strength',    durationMins: 45 },
    5: { met: 5.5, label: 'Jump prep & power',      type: 'cardio',      durationMins: 50 },
    6: { met: 1.3, label: 'Rest / active recovery', type: 'rest',        durationMins: 0  },
    0: { met: 1.3, label: 'Rest',                   type: 'rest',        durationMins: 0  },
  },
  // Phase 3 — Basics 5–6: Power. Plyometrics, 25-min cardio, intensity rises.
  3: {
    1: { met: 5.5, label: 'Lower body power',       type: 'strength',    durationMins: 55 },
    2: { met: 5.0, label: 'Core power & rotation',  type: 'strength',    durationMins: 50 },
    3: { met: 6.0, label: 'Cardio & endurance',     type: 'cardio',      durationMins: 55 }, // cardio day
    4: { met: 4.5, label: 'Upper body & posture',   type: 'strength',    durationMins: 50 },
    5: { met: 5.5, label: 'Skating elements',        type: 'cardio',      durationMins: 55 },
    6: { met: 2.5, label: 'Light yoga / recovery',  type: 'flexibility', durationMins: 30 },
    0: { met: 1.3, label: 'Rest',                   type: 'rest',        durationMins: 0  },
  },
  // Phase 4 — Basics 7–8: Performance. Peak intensity, mock programs.
  4: {
    1: { met: 6.0, label: 'Peak lower body',        type: 'strength',    durationMins: 60 },
    2: { met: 5.5, label: 'Core mastery',           type: 'strength',    durationMins: 55 },
    3: { met: 6.5, label: 'Cardio + mock program',  type: 'cardio',      durationMins: 65 },
    4: { met: 5.0, label: 'Full upper body',        type: 'strength',    durationMins: 55 },
    5: { met: 6.0, label: 'Skating readiness day',  type: 'cardio',      durationMins: 60 },
    6: { met: 2.5, label: 'Active recovery / yoga', type: 'flexibility', durationMins: 30 },
    0: { met: 1.3, label: 'Rest',                   type: 'rest',        durationMins: 0  },
  },
};

// On-ice MET — recreational to vigorous figure skating
const ICE_MET = 7.0;
const ICE_SESSION_MINS = 50; // assumed average session length

// How extra training calories are split across macros, by session type.
// Strength → more protein; cardio/ice → more carbs; mixed → blended.
const MACRO_SPLIT_BONUS = {
  strength:    { proteinPct: 0.35, carbsPct: 0.45, fatsPct: 0.20 },
  cardio:      { proteinPct: 0.20, carbsPct: 0.60, fatsPct: 0.20 },
  flexibility: { proteinPct: 0.25, carbsPct: 0.55, fatsPct: 0.20 },
  rest:        { proteinPct: 0.25, carbsPct: 0.50, fatsPct: 0.25 },
  mixed:       { proteinPct: 0.28, carbsPct: 0.52, fatsPct: 0.20 },
};

/**
 * getPrescribedDayBurn(dateStr, weightKg, trainingPhase, onIceDays)
 *
 * Looks at the day-of-week for dateStr and returns what the training
 * plan prescribes for that day in the given phase.
 *
 * onIceDays: number of on-ice sessions per week (0–4). Sessions are
 * distributed across Mon/Wed/Fri so they slot naturally around the
 * off-ice schedule without doubling up on rest days.
 *
 * Returns { extraCals, sessionSummary[], dominantType }
 */
function getPrescribedDayBurn(dateStr, weightKg, trainingPhase, onIceDays) {
  const phaseNum = parseInt((trainingPhase || '').match(/\d+/)?.[0] || '0');
  const schedule = PHASE_SCHEDULE[phaseNum];

  const date   = new Date(dateStr + 'T12:00:00');
  const dow    = date.getDay(); // 0=Sun … 6=Sat

  let extraCals = 0;
  const sessionSummary = [];
  const types = [];

  // ── Off-ice prescribed session ────────────────────────────
  if (schedule) {
    const session = schedule[dow];
    if (session && session.type !== 'rest' && session.durationMins > 0) {
      const hours  = session.durationMins / 60;
      const burned = Math.round(session.met * weightKg * hours);
      extraCals += burned;
      types.push(session.type);
      sessionSummary.push({
        icon:   session.type === 'strength' ? '🏋️' : session.type === 'cardio' ? '🏃' : '🧘',
        label:  session.label,
        mins:   session.durationMins,
        burned,
        source: 'off-ice plan',
      });
    }
  }

  // ── On-ice sessions ───────────────────────────────────────
  // Distribute sessions evenly across Mon (1), Wed (3), Fri (5), and Thu (4) if 4+.
  // This avoids adding ice sessions on rest days or doubling up awkwardly.
  const iceDayCount = parseInt(onIceDays) || 0;
  const iceDows = [1, 3, 5, 4].slice(0, iceDayCount); // Mon, Wed, Fri, Thu

  if (iceDows.includes(dow)) {
    const burned = Math.round(ICE_MET * weightKg * (ICE_SESSION_MINS / 60));
    extraCals += burned;
    types.push('cardio');
    sessionSummary.push({
      icon:   '⛸',
      label:  'On-ice session',
      mins:   ICE_SESSION_MINS,
      burned,
      source: 'on-ice plan',
    });
  }

  // ── Dominant type ─────────────────────────────────────────
  let dominantType = 'rest';
  if (types.length === 1) dominantType = types[0];
  else if (types.length > 1) dominantType = 'mixed';

  return { extraCals, sessionSummary, dominantType };
}

/**
 * computeMacros(baseTDEE, extraCals, weightLbs, goal, dominantType)
 * Distributes extra calories across macros using training-type ratios.
 */
function computeMacros(baseTDEE, extraCals, weightLbs, goal, dominantType) {
  let baseCals, baseProtein, baseFats, baseCarbs;
  if (goal === 'Lose weight') {
    baseCals    = baseTDEE - 500;
    baseProtein = Math.round(weightLbs * 1.0);
    baseFats    = Math.round(weightLbs * 0.35);
    baseCarbs   = Math.round((baseCals - (baseProtein * 4) - (baseFats * 9)) / 4);
  } else if (goal === 'Gain muscle') {
    baseCals    = baseTDEE + 300;
    baseProtein = Math.round(weightLbs * 1.2);
    baseFats    = Math.round(weightLbs * 0.40);
    baseCarbs   = Math.round((baseCals - (baseProtein * 4) - (baseFats * 9)) / 4);
  } else {
    baseCals    = baseTDEE;
    baseProtein = Math.round(weightLbs * 0.8);
    baseFats    = Math.round(weightLbs * 0.35);
    baseCarbs   = Math.round((baseCals - (baseProtein * 4) - (baseFats * 9)) / 4);
  }

  if (extraCals <= 0) {
    return { targetCals: Math.round(baseCals), protein: baseProtein, carbs: baseCarbs, fats: baseFats };
  }

  const split = MACRO_SPLIT_BONUS[dominantType] || MACRO_SPLIT_BONUS.mixed;
  return {
    targetCals: Math.round(baseCals + extraCals),
    protein:    baseProtein + Math.round((extraCals * split.proteinPct) / 4),
    carbs:      baseCarbs   + Math.round((extraCals * split.carbsPct)   / 4),
    fats:       baseFats    + Math.round((extraCals * split.fatsPct)    / 9),
  };
}

/**
 * getBaseNutritionData()
 * Reads settings + most recent weight, returns BMR/TDEE.
 * Returns null if required data is missing.
 */
function getBaseNutritionData() {
  const nutritionConfig = TRACKER_CONFIGS.find(t => t.id === 'nutrition');
  if (!nutritionConfig) return null;
  const stored = localStorage.getItem(`${nutritionConfig.storageKey}_settings`);
  if (!stored) return null;
  const s = JSON.parse(stored);
  if (!s.age || !s.sex || !s.heightFt || !s.goal) return null;

  let recentWeight = null;
  TRACKER_CONFIGS.forEach(tracker => {
    if (recentWeight) return;
    const found = getEntries(tracker).find(e => e.weight && parseFloat(e.weight) > 0);
    if (found) recentWeight = found;
  });
  if (!recentWeight) return null;

  const weightLbs = recentWeight.weightUnit === 'kg'
    ? parseFloat(recentWeight.weight) * 2.20462
    : parseFloat(recentWeight.weight);
  const weightKg  = weightLbs / 2.20462;
  const heightIn  = (parseInt(s.heightFt) * 12) + parseInt(s.heightIn || 0);
  const heightCm  = heightIn * 2.54;

  // Mifflin-St Jeor BMR
  const bmr = s.sex === 'Male'
    ? (10 * weightKg) + (6.25 * heightCm) - (5 * parseInt(s.age)) + 5
    : (10 * weightKg) + (6.25 * heightCm) - (5 * parseInt(s.age)) - 161;

  // Base TDEE uses a moderate multiplier (1.375 — lightly active baseline).
  // The engine adds training-specific calories on top per day, so we don't
  // want the TDEE multiplier to already be "very active" — that would double-count.
  const baseTDEE = bmr * 1.375;

  return { s, weightLbs, weightKg, bmr, baseTDEE };
}

/**
 * getNutritionTargets(dateStr?)
 * Returns day-specific { targetCals, protein, carbs, fats, extraCals, sessionSummary, dominantType }.
 * Uses prescribed plan schedule, not logged data.
 */
function getNutritionTargets(dateStr) {
  const base = getBaseNutritionData();
  if (!base) return null;
  const { s, weightLbs, weightKg, baseTDEE } = base;

  let extraCals = 0, sessionSummary = [], dominantType = 'rest';
  if (dateStr) {
    const burn   = getPrescribedDayBurn(dateStr, weightKg, s.trainingPhase, parseInt(s.onIceDays) || 0);
    extraCals      = burn.extraCals;
    sessionSummary = burn.sessionSummary;
    dominantType   = burn.dominantType;
  }

  const macros = computeMacros(baseTDEE, extraCals, weightLbs, s.goal, dominantType);
  return { ...macros, extraCals, sessionSummary, dominantType };
}


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

/**
 * getNutritionTargets(dateStr?)
 * Returns { targetCals, protein, carbs, fats, extraCals, sessionSummary, dominantType }
 * If dateStr is provided, targets are adjusted for that day's actual logged workouts.
 * If omitted, returns base TDEE targets (used for the Settings page baseline).
 */
function getNutritionTargets(dateStr) {
  const base = getBaseNutritionData();
  if (!base) return null;
  const { s, weightLbs, weightKg, baseTDEE } = base;

  let extraCals = 0, sessionSummary = [], dominantType = 'rest';
  if (dateStr) {
    const burn   = getPrescribedDayBurn(dateStr, weightKg, s.trainingPhase, parseInt(s.onIceDays) || 0);
    extraCals      = burn.extraCals;
    sessionSummary = burn.sessionSummary;
    dominantType   = burn.dominantType;
  }

  const macros = computeMacros(baseTDEE, extraCals, weightLbs, s.goal, dominantType);
  return { ...macros, extraCals, sessionSummary, dominantType };
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

  // For nutrition tracker: group by day and show daily totals + individual entries
  if (cfg.id === 'nutrition') {
    const byDate = {};
    entries.forEach(e => {
      const dateKey = e.date;
      if (!byDate[dateKey]) byDate[dateKey] = [];
      byDate[dateKey].push(e);
    });

    list.innerHTML = Object.entries(byDate).map(([date, dayEntries]) => {
      // Get workout-adjusted targets FOR THIS SPECIFIC DATE
      const targets = getNutritionTargets(date);

      // Calculate daily food totals
      const totals = {
        calories: dayEntries.reduce((sum, e) => sum + (parseFloat(e.calories) || 0), 0),
        protein:  dayEntries.reduce((sum, e) => sum + (parseFloat(e.protein)  || 0), 0),
        carbs:    dayEntries.reduce((sum, e) => sum + (parseFloat(e.carbs)    || 0), 0),
        fats:     dayEntries.reduce((sum, e) => sum + (parseFloat(e.fats)     || 0), 0),
        water:    dayEntries.reduce((sum, e) => sum + (parseFloat(e.water)    || 0), 0),
      };

      const color = '#8b5fbf';

      // Workout activity pills for this day
      const activityPills = targets?.sessionSummary?.length
        ? targets.sessionSummary.map(s =>
            `<div style="
              display:inline-flex;align-items:center;gap:5px;
              font-family:'DM Mono',monospace;font-size:10px;
              background:rgba(168,216,234,0.08);border:1px solid rgba(168,216,234,0.2);
              color:#a8d8ea;padding:3px 9px;border-radius:3px;">
              ${s.icon} ${s.label} · ${s.mins} min · +${s.burned} cal
            </div>`).join('')
        : `<div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);
              background:rgba(184,157,224,0.04);border:1px solid rgba(184,157,224,0.1);
              padding:3px 9px;border-radius:3px;display:inline-block;">
              😴 Rest day — base targets
           </div>`;

      // Macro display box with % of day-specific target
      const getMacroDisplay = (actual, target, label) => {
        if (!targets || !target) {
          return `<div style="padding:8px;background:rgba(17,34,64,0.4);border-radius:6px;">
            <div style="font-size:24px;font-family:'Bebas Neue',sans-serif;line-height:1;">${Math.round(actual)}</div>
            <div style="font-size:9px;font-family:'DM Mono',monospace;color:var(--muted);">${label}</div>
          </div>`;
        }
        const pct = Math.round((actual / target) * 100);
        let displayColor, bgColor, borderColor;
        if (pct >= 90 && pct <= 110) {
          displayColor = '#3a9e7a'; bgColor = 'rgba(58,158,122,0.12)'; borderColor = 'rgba(58,158,122,0.3)';
        } else if (pct >= 70 && pct <= 130) {
          displayColor = '#c9a96e'; bgColor = 'rgba(201,169,110,0.12)'; borderColor = 'rgba(201,169,110,0.3)';
        } else {
          displayColor = '#c05050'; bgColor = 'rgba(192,80,80,0.12)'; borderColor = 'rgba(192,80,80,0.3)';
        }
        return `
          <div style="background:${bgColor};border:1px solid ${borderColor};border-radius:6px;padding:8px;">
            <div style="font-size:24px;font-family:'Bebas Neue',sans-serif;color:${displayColor};line-height:1;">${Math.round(actual)}</div>
            <div style="font-size:9px;font-family:'DM Mono',monospace;color:var(--muted);margin-bottom:2px;">${label}</div>
            <div style="font-size:10px;font-family:'DM Mono',monospace;color:${displayColor};">${pct}% of ${target}</div>
          </div>`;
      };

      return `<div class="history-entry" style="margin-bottom:20px;">
        <div class="history-entry-header">
          <div class="history-entry-date">${fmtDate(date)}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <div class="history-entry-tag" style="color:${color};border-color:${color}40;">${dayEntries.length} meal${dayEntries.length > 1 ? 's' : ''}</div>
          </div>
        </div>

        <!-- Activity summary for the day -->
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">
          ${activityPills}
        </div>

        <!-- Daily totals vs workout-adjusted targets -->
        <div style="background:rgba(139,95,191,0.06);border-radius:6px;padding:16px;margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;flex-wrap:wrap;gap:6px;">
            <div style="font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px;color:#8b5fbf;">Daily Totals</div>
            ${targets?.extraCals > 0
              ? `<div style="font-family:'DM Mono',monospace;font-size:10px;color:#a8d8ea;">
                   Target boosted +${targets.extraCals} cal for today's training
                 </div>`
              : ''}
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;">
            ${getMacroDisplay(totals.calories, targets?.targetCals, 'CALORIES')}
            ${getMacroDisplay(totals.protein,  targets?.protein,    'PROTEIN')}
            ${getMacroDisplay(totals.carbs,    targets?.carbs,      'CARBS')}
            ${getMacroDisplay(totals.fats,     targets?.fats,       'FATS')}
          </div>
          ${!targets ? `<div style="margin-top:12px;font-size:11px;color:var(--muted);font-style:italic;">💡 Set your targets in <strong>Settings</strong> tab to see color-coded progress!</div>` : ''}
        </div>

        <details style="margin-top:8px;">
          <summary style="cursor:pointer;font-family:'DM Mono',monospace;font-size:11px;color:var(--muted);padding:8px 0;">Show individual meals (${dayEntries.length})</summary>
          <div style="margin-top:12px;padding-left:12px;border-left:2px solid rgba(139,95,191,0.2);">
            ${dayEntries.map(e => `
              <div style="margin-bottom:12px;padding:8px;background:rgba(17,34,64,0.4);border-radius:4px;position:relative;">
                <button class="delete-btn" onclick="deleteEntry(${e.id})" title="Delete entry" style="top:8px;right:8px;">✕</button>
                <div style="font-size:12px;color:var(--silver);margin-bottom:4px;">
                  ${e.calories ? `${e.calories} cal` : ''}
                  ${e.protein  ? ` · ${e.protein}g P`  : ''}
                  ${e.carbs    ? ` · ${e.carbs}g C`    : ''}
                  ${e.fats     ? ` · ${e.fats}g F`     : ''}
                </div>
                ${e.notes ? `<div style="font-size:12px;color:var(--muted);font-style:italic;">"${e.notes}"</div>` : ''}
              </div>
            `).join('')}
          </div>
        </details>
      </div>`;
    }).join('');
    return;
  }

  // Original history rendering for non-nutrition trackers
  list.innerHTML = entries.map(e => {
    const stats = cfg.historyStats
      .filter(s => e[s.key])
      .map(s => `${s.label}: <span>${e[s.key]}${s.suffix(e)}</span>`);

    const selectStats = (cfg.historySelectStats || [])
      .filter(k => e[k])
      .map(k => `${k}: <span>${e[k]}</span>`);

    // Extract phase/month number
    const phaseRaw = e.phase || e.month || '';
    const phaseNum = phaseRaw ? parseInt(phaseRaw.toString().match(/\d+/)?.[0] || '0') : 0;
    const color    = (cfg.metaColorKeys || [])[phaseNum - 1] || '#8b5fbf';

    // Build meta tag label
    let metaTag = fmtDate(e.date);
    const phaseField = cfg.meta.find(f => f.key === 'phase' || f.key === 'month');
    const weekField  = cfg.meta.find(f => f.key === 'week');
    const sessionField = cfg.meta.find(f => f.key === 'sessionNum');
    if (phaseField && phaseRaw) {
      if (sessionField && e.sessionNum) {
        metaTag = `P${phaseNum} · Session ${e.sessionNum}`;
      } else if (weekField && e.week) {
        const weekNum = e.week.toString().match(/\d+/)?.[0] || '?';
        metaTag = `P${phaseNum} · W${weekNum}`;
      } else {
        metaTag = `Phase ${phaseNum}`;
      }
    }

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

  // For nutrition tracker: aggregate multiple entries per day
  let processedEntries = entries;
  if (cfg.id === 'nutrition') {
    const dailyTotals = {};
    entries.forEach(e => {
      const dateKey = e.date;
      if (!dailyTotals[dateKey]) {
        dailyTotals[dateKey] = {
          date: e.date,
          calories: 0, protein: 0, carbs: 0, fats: 0, water: 0,
          weight: null, weightUnit: null, energyLevel: [], hungerLevel: []
        };
      }
      dailyTotals[dateKey].calories += parseFloat(e.calories) || 0;
      dailyTotals[dateKey].protein  += parseFloat(e.protein) || 0;
      dailyTotals[dateKey].carbs    += parseFloat(e.carbs) || 0;
      dailyTotals[dateKey].fats     += parseFloat(e.fats) || 0;
      dailyTotals[dateKey].water    += parseFloat(e.water) || 0;
      if (e.weight) {
        dailyTotals[dateKey].weight = e.weight;
        dailyTotals[dateKey].weightUnit = e.weightUnit;
      }
      if (e.energyLevel) dailyTotals[dateKey].energyLevel.push(parseFloat(e.energyLevel));
      if (e.hungerLevel) dailyTotals[dateKey].hungerLevel.push(parseFloat(e.hungerLevel));
    });

    processedEntries = Object.values(dailyTotals).map(day => ({
      ...day,
      energyLevel: day.energyLevel.length ? Math.round(day.energyLevel.reduce((a,b)=>a+b,0) / day.energyLevel.length) : null,
      hungerLevel: day.hungerLevel.length ? Math.round(day.hungerLevel.reduce((a,b)=>a+b,0) / day.hungerLevel.length) : null,
    }));
  }

  pbGrid.innerHTML = cfg.benchmarks.map(b => {
    const best = processedEntries.reduce((max, e) => {
      const v = parseFloat(e[b.key]);
      return (!isNaN(v) && v > max) ? v : max;
    }, 0);
    const has = best > 0;
    return `<div class="pb-card">
      <div class="pb-card-label">${b.label}</div>
      <div class="pb-card-value" style="color:${has ? b.color : 'var(--muted)'};">${has ? Math.round(best) : '—'}</div>
      <div class="pb-card-unit">${has ? b.unit : 'no data yet'}</div>
    </div>`;
  }).join('');

  cfg.charts.forEach(ch => {
    const datasets = ch.fields.map(f => ({
      key: f.key, label: f.label, color: f.color,
      points: processedEntries
        .filter(e => e[f.key] && !isNaN(parseFloat(e[f.key])))
        .map(e => ({ label: fmtDate(e.date).replace(/,.*/, ''), v: Math.round(parseFloat(e[f.key])) }))
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

  const resultsEl = document.getElementById('macro-results');
  if (!resultsEl) return;

  const base = getBaseNutritionData();

  if (!base) {
    // Check if it's a settings issue or a weight issue
    const nutritionConfig = TRACKER_CONFIGS.find(t => t.id === 'nutrition');
    const stored = nutritionConfig ? localStorage.getItem(`${nutritionConfig.storageKey}_settings`) : null;
    const s = stored ? JSON.parse(stored) : null;
    const missingSettings = !s || !s.age || !s.sex || !s.heightFt || !s.goal;

    if (missingSettings || !stored) {
      resultsEl.innerHTML = `
        <div style="text-align:center;color:var(--muted);font-style:italic;padding:40px 0;">
          Fill in your settings above and click Save to see macro recommendations.
        </div>`;
      return;
    }

    // Settings OK but no weight logged yet
    resultsEl.innerHTML = `
      <div style="text-align:center;color:var(--muted);font-style:italic;padding:40px 0;">
        <div style="font-size:16px;color:var(--frost);margin-bottom:12px;">⚠️ Weight Required</div>
        <div style="margin-bottom:16px;">No weight data found in any tracker.</div>
        <div style="background:rgba(139,95,191,0.08);border:1px solid rgba(139,95,191,0.2);border-radius:6px;padding:16px;max-width:400px;margin:0 auto;text-align:left;">
          <strong style="color:var(--ice-deep);">To see your macro targets:</strong><br><br>
          1. Go to <strong>🏋️ Off-Ice Training</strong> tracker<br>
          2. Click <strong>Log Entry</strong> tab<br>
          3. Fill in <strong>Weight</strong> field (in Body Metrics card)<br>
          4. Click <strong>Save Entry</strong><br>
          5. Return to <strong>🥗 Nutrition → Settings</strong> tab
        </div>
      </div>`;
    return;
  }

  const { s, weightLbs, weightKg, bmr, baseTDEE } = base;

  // ── Base (rest-day) targets ────────────────────────────────
  const baseMacros = computeMacros(baseTDEE, 0, weightLbs, s.goal, 'rest');

  // ── Today's workout-adjusted targets ──────────────────────
  const todayStr    = new Date().toISOString().split('T')[0];
  const todayBurn   = getPrescribedDayBurn(todayStr, weightKg, s.trainingPhase, parseInt(s.onIceDays) || 0);
  const todayMacros = computeMacros(baseTDEE, todayBurn.extraCals, weightLbs, s.goal, todayBurn.dominantType);

  // ── Workout type label ─────────────────────────────────────
  const typeLabels = { strength: '💪 Strength day', cardio: '🏃 Cardio day', flexibility: '🧘 Flexibility day', rest: '😴 Rest day', mixed: '⚡ Mixed training day' };
  const todayTypeLabel = typeLabels[todayBurn.dominantType] || '😴 Rest day';

  // ── Day-by-day breakdown (last 7 days) ────────────────────
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr    = d.toISOString().split('T')[0];
    const burn    = getPrescribedDayBurn(dStr, weightKg, s.trainingPhase, parseInt(s.onIceDays) || 0);
    const macros  = computeMacros(baseTDEE, burn.extraCals, weightLbs, s.goal, burn.dominantType);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    last7.push({ dStr, dayName, burn, macros, isToday: i === 0 });
  }

  const macroBar = (macros) => `
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">
      <span style="font-family:'DM Mono',monospace;font-size:10px;color:#8b5fbf;">${macros.targetCals} cal</span>
      <span style="font-family:'DM Mono',monospace;font-size:10px;color:#c070a0;">${macros.protein}g P</span>
      <span style="font-family:'DM Mono',monospace;font-size:10px;color:#9e7ab8;">${macros.carbs}g C</span>
      <span style="font-family:'DM Mono',monospace;font-size:10px;color:#b89de0;">${macros.fats}g F</span>
    </div>`;

  resultsEl.innerHTML = `
    <!-- TODAY'S TARGETS -->
    <div style="background:rgba(139,95,191,0.08);border:1px solid rgba(139,95,191,0.3);border-radius:8px;padding:24px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:2px;color:#8b5fbf;">🎯 Today's Targets</div>
        <div style="font-family:'DM Mono',monospace;font-size:11px;color:#a8d8ea;background:rgba(168,216,234,0.08);border:1px solid rgba(168,216,234,0.2);padding:4px 12px;border-radius:3px;">${todayTypeLabel}</div>
      </div>

      ${todayBurn.sessionSummary.length > 0 ? `
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;">
          ${todayBurn.sessionSummary.map(s =>
            `<div style="font-family:'DM Mono',monospace;font-size:10px;color:#a8d8ea;background:rgba(168,216,234,0.06);border:1px solid rgba(168,216,234,0.15);padding:3px 10px;border-radius:3px;">
              ${s.icon} ${s.label} · ${s.mins} min · +${s.burned} cal
            </div>`).join('')}
        </div>` : `
        <div style="font-size:13px;color:var(--muted);font-style:italic;margin-bottom:16px;">
          No workouts logged today — showing base targets. Log an off-ice or on-ice session to see today's adjusted targets.
        </div>`}

      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;">
        <div style="text-align:center;padding:20px;background:rgba(139,95,191,0.12);border-radius:6px;border:2px solid #8b5fbf;">
          <div style="font-size:52px;font-family:'Bebas Neue',sans-serif;color:#8b5fbf;line-height:1;">${todayMacros.targetCals}</div>
          <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--muted);margin-top:6px;letter-spacing:1px;">CALORIES</div>
          ${todayBurn.extraCals > 0 ? `<div style="font-family:'DM Mono',monospace;font-size:10px;color:#a8d8ea;margin-top:4px;">base + ${todayBurn.extraCals} training</div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div style="padding:12px;background:rgba(192,112,160,0.12);border-radius:6px;border:1px solid rgba(192,112,160,0.3);display:flex;justify-content:space-between;align-items:center;">
            <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:1px;">PROTEIN</div>
            <div style="font-size:26px;font-family:'Bebas Neue',sans-serif;color:#c070a0;line-height:1;">${todayMacros.protein}g</div>
          </div>
          <div style="padding:12px;background:rgba(158,122,184,0.12);border-radius:6px;border:1px solid rgba(158,122,184,0.3);display:flex;justify-content:space-between;align-items:center;">
            <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:1px;">CARBS</div>
            <div style="font-size:26px;font-family:'Bebas Neue',sans-serif;color:#9e7ab8;line-height:1;">${todayMacros.carbs}g</div>
          </div>
          <div style="padding:12px;background:rgba(184,157,224,0.12);border-radius:6px;border:1px solid rgba(184,157,224,0.3);display:flex;justify-content:space-between;align-items:center;">
            <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:1px;">FATS</div>
            <div style="font-size:26px;font-family:'Bebas Neue',sans-serif;color:#b89de0;line-height:1;">${todayMacros.fats}g</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 7-DAY CALENDAR VIEW -->
    <div style="background:rgba(17,34,64,0.6);border:1px solid rgba(184,157,224,0.1);border-radius:8px;padding:20px;margin-bottom:20px;">
      <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:16px;">📅 Last 7 Days — Adjusted Targets</div>
      <div style="display:flex;flex-direction:column;gap:1px;">
        ${last7.map(day => {
          const hasWorkout = day.burn.sessionSummary.length > 0;
          const isToday    = day.isToday;
          const rowBg      = isToday ? 'rgba(139,95,191,0.10)' : 'rgba(17,34,64,0.3)';
          const border     = isToday ? '1px solid rgba(139,95,191,0.35)' : '1px solid rgba(184,157,224,0.06)';
          return `
            <div style="display:grid;grid-template-columns:140px 1fr auto;gap:12px;align-items:center;
                        padding:10px 14px;border-radius:5px;background:${rowBg};border:${border};">
              <div>
                <div style="font-family:'DM Mono',monospace;font-size:11px;color:${isToday ? '#a8d8ea' : 'var(--silver)'};">
                  ${isToday ? '▶ Today' : day.dayName}
                </div>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:5px;">
                ${hasWorkout
                  ? day.burn.sessionSummary.map(s =>
                      `<span style="font-family:'DM Mono',monospace;font-size:9px;color:#a8d8ea;
                                   background:rgba(168,216,234,0.07);border:1px solid rgba(168,216,234,0.15);
                                   padding:2px 7px;border-radius:2px;">${s.icon} ${s.label} · ${s.mins}m</span>`).join('')
                  : `<span style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);">rest</span>`}
              </div>
              <div style="text-align:right;">
                ${macroBar(day.macros)}
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>

    <!-- BASE TARGETS (reference) -->
    <div class="tracker-card" style="background:rgba(17,34,64,0.4);">
      <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:16px;">📊 Baseline (No Training Days)</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;">
        ${[
          { label: 'CALORIES', val: baseMacros.targetCals, color: '#8b5fbf' },
          { label: 'PROTEIN',  val: `${baseMacros.protein}g`,  color: '#c070a0' },
          { label: 'CARBS',    val: `${baseMacros.carbs}g`,    color: '#9e7ab8' },
          { label: 'FATS',     val: `${baseMacros.fats}g`,     color: '#b89de0' },
        ].map(m => `
          <div style="text-align:center;padding:12px;background:rgba(17,34,64,0.5);border-radius:5px;border:1px solid rgba(184,157,224,0.08);">
            <div style="font-size:22px;font-family:'Bebas Neue',sans-serif;color:${m.color};">${m.val}</div>
            <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;">${m.label}</div>
          </div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;">
        <div>
          <div style="font-size:11px;color:var(--muted);font-family:'DM Mono',monospace;">BMR</div>
          <div style="font-size:20px;color:var(--silver);font-family:'Bebas Neue',sans-serif;">${Math.round(bmr)}</div>
        </div>
        <div>
          <div style="font-size:11px;color:var(--muted);font-family:'DM Mono',monospace;">Base TDEE</div>
          <div style="font-size:20px;color:var(--silver);font-family:'Bebas Neue',sans-serif;">${Math.round(baseTDEE)}</div>
        </div>
        <div>
          <div style="font-size:11px;color:var(--muted);font-family:'DM Mono',monospace;">Weight</div>
          <div style="font-size:20px;color:var(--silver);font-family:'Bebas Neue',sans-serif;">${Math.round(weightLbs)} lbs</div>
        </div>
      </div>
      <div style="font-size:12px;color:var(--muted);font-style:italic;line-height:1.6;border-top:1px solid rgba(184,157,224,0.1);padding-top:12px;">
        💡 Targets automatically adjust each day based on what the training plan prescribes for that day of the week in your current phase.
        Strength days (Mon/Tue/Thu) boost protein; cardio and ice days (Wed/Fri + on-ice sessions) boost carbs.
        Update your phase in Settings whenever you move to the next phase of the program.
      </div>
    </div>`;
}

// ── Init ──────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  buildTrackerUI();

  // Display version in footer
  const versionEl = document.getElementById('version-display');
  if (versionEl) {
    versionEl.textContent = `Figure Skating Foundation Tracker ${APP_VERSION}`;
  }
});
