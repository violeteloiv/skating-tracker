/* ============================================================
   tracker-config.js — ADD OR EDIT TRACKERS HERE

   Each object in TRACKER_CONFIGS becomes a tab in the tracker.
   The engine (tracker-engine.js) reads this and builds all UI
   automatically — you never need to touch any other JS file.

   To add a new tracker:
     1. Copy an existing config object
     2. Change id, label, storageKey (must be unique)
     3. Update cards, benchmarks, charts, historyStats
     4. Add it to the array below — done!

   This config is tuned to prepare an adult beginner skater
   for U.S. Figure Skating Basic Skills Levels 1–8.
   ============================================================ */

const TRACKER_CONFIGS = [
  {
    id: 'officeice',
    label: '🏋️ Off-Ice Training',
    storageKey: 'skating_tracker_entries',

    // Meta fields shown at the top of every log entry
    meta: [
      { key: 'date',  label: 'Date',          type: 'date' },
      { key: 'level', label: 'Target Level',  type: 'select',
        options: [
          'Basics 1–2 — First Steps',
          'Basics 3–4 — Edges & Crossovers',
          'Basics 5–6 — Backward Skating & Turns',
          'Basics 7–8 — Mohawks, Jumps & Spins',
        ]
      },
      { key: 'week', label: 'Week #', type: 'select',
        options: ['Week 1','Week 2','Week 3','Week 4','Week 5','Week 6','Week 7','Week 8'] },
    ],

    // ── Cards shown in the log form ──────────────────────────
    cards: [
      // ── Body & Session Feel ─────────────────────────────────
      {
        title: '📏 Body & Session Feel', fullWidth: false,
        fields: [
          { key: 'weight',     label: 'Weight',                            type: 'number', placeholder: 'e.g. 130', step: 0.1 },
          { key: 'weightUnit', label: 'Unit',                              type: 'select', options: ['lbs','kg'] },
          { key: 'energy',     label: 'How energized do you feel? (1–10)', type: 'range',  min: 1, max: 10, default: 7 },
          { key: 'soreness',   label: 'Soreness level today (1–10)',       type: 'range',  min: 1, max: 10, default: 3 },
        ]
      },

      // ── Balance & Ankle Stability ───────────────────────────
      // Targets Basic 1 (standing, glides), Basic 2 (one-foot glides),
      // Basic 4 (edges), Basic 5 (backward edges)
      {
        title: '⚖️ Balance & Ankle Stability', fullWidth: false,
        fields: [
          { key: 'singlelegEO',  label: 'Single-leg stand — eyes open (seconds)',   type: 'number', placeholder: 'e.g. 20' },
          { key: 'singlelegEC',  label: 'Single-leg stand — eyes closed (seconds)', type: 'number', placeholder: 'e.g. 8'  },
          { key: 'ankleCircles', label: 'Ankle alphabet / circles — both feet done?', type: 'select',
            options: ['Not yet','One foot only','Both feet — needed support','Both feet — freestanding'] },
          { key: 'toeRaise',    label: 'Two-foot toe raises in a row (reps)',       type: 'number', placeholder: 'e.g. 15' },
          { key: 'heelToeWalk', label: 'Heel-to-toe straight-line walk — steps before losing balance', type: 'number', placeholder: 'e.g. 10' },
        ]
      },

      // ── Hip & Knee Strength ─────────────────────────────────
      // Targets Basic 1 (marching, dips), Basic 3 (forward stroking),
      // Basic 4 (crossovers, backward stroking), Basic 5 (backward crossovers)
      {
        title: '💪 Hip & Knee Strength', fullWidth: false,
        fields: [
          { key: 'wallsit',   label: 'Wall sit hold (seconds) — skate-ready position', type: 'number', placeholder: 'e.g. 30' },
          { key: 'squatReps', label: 'Bodyweight squat reps (knees tracking toes)',    type: 'number', placeholder: 'e.g. 10' },
          { key: 'lateralHops', label: 'Lateral side hops in a row each side',        type: 'number', placeholder: 'e.g. 8'  },
          { key: 'hipAbduct',  label: 'Side-lying hip abduction reps (each leg)',      type: 'number', placeholder: 'e.g. 12' },
          { key: 'gluteBridge', label: 'Glute bridge hold (seconds)',                  type: 'number', placeholder: 'e.g. 20' },
        ]
      },

      // ── Core & Posture ──────────────────────────────────────
      // Targets skating posture needed from Basic 1 onward;
      // spin core compression at Basic 3+ (two-foot spin), Basic 5 (one-foot spin)
      {
        title: '🧘 Core & Posture', fullWidth: false,
        fields: [
          { key: 'plank',      label: 'Full plank hold (seconds)',                    type: 'number', placeholder: 'e.g. 20' },
          { key: 'deadbug',    label: 'Dead bug reps completed (each side)',          type: 'number', placeholder: 'e.g. 8'  },
          { key: 'birddog',    label: 'Bird dog hold (seconds, each side)',           type: 'number', placeholder: 'e.g. 5'  },
          { key: 'postureHold', label: 'Skater stance hold — knees bent, arms out (seconds)', type: 'number', placeholder: 'e.g. 15' },
        ]
      },

      // ── Flexibility ─────────────────────────────────────────
      // Targets the hip, ankle, and inner-thigh flexibility needed for
      // edges (Basic 4–5), spirals (Basic 6), and crossovers (Basic 4–5)
      {
        title: '🤸 Flexibility', fullWidth: false,
        fields: [
          { key: 'hipflex',  label: 'Hip flexor lunge stretch — how does it feel?', type: 'select',
            options: ['Very tight','Moderate tension','Mild stretch','Very open'] },
          { key: 'straddle', label: 'Straddle sit — how far forward can you reach?', type: 'select',
            options: ['Not yet','Fingertips only','Palms down','Forearms on floor'] },
          { key: 'pigeon',   label: 'Pigeon pose — how low to floor?',              type: 'select',
            options: ['Hips far from floor','Need a pillow','Almost flat','Hips flat'] },
          { key: 'ankleFlex', label: 'Ankle dorsiflexion — can you squat flat-footed?', type: 'select',
            options: ['Heels lift off floor','Heels barely stay down','Heels flat with effort','Heels flat easily'] },
        ]
      },

      // ── Glide & Edge Simulation ─────────────────────────────
      // Off-ice drills that mimic on-ice movements directly tested in Basics 1–5
      {
        title: '⛸ Glide & Edge Simulation', fullWidth: false,
        fields: [
          { key: 'swizzleSim',   label: 'Swizzle simulation (socks on floor) — reps in a row', type: 'number', placeholder: 'e.g. 8'  },
          { key: 'edgeSim',      label: 'Edge lean — hold a side lean on one foot (seconds)',    type: 'number', placeholder: 'e.g. 5'  },
          { key: 'crossoverSim', label: 'Crossover walk — side-step cross pattern, steps each direction', type: 'number', placeholder: 'e.g. 6' },
          { key: 'backwardWalk', label: 'Backward walking — steps in a straight line with control', type: 'number', placeholder: 'e.g. 10' },
        ]
      },

      // ── Spin & Jump Preparation ─────────────────────────────
      // Targets Basic 3 (two-foot spin), Basic 5 (one-foot spin, hockey stop),
      // Basic 6 (bunny hop, lunge, spiral), Basic 7 (ballet jump, landing position),
      // Basic 8 (waltz jump, mazurka, combination moves)
      {
        title: '🌀 Spin & Jump Preparation', fullWidth: false,
        fields: [
          { key: 'twoFootSpin',  label: 'Two-foot spin simulation — full 360° turns on flat floor (reps)', type: 'number', placeholder: 'e.g. 3' },
          { key: 'oneFootSpin',  label: 'One-foot spin balance position — hold (seconds)',                  type: 'number', placeholder: 'e.g. 4' },
          { key: 'bunnyHopSim',  label: 'Bunny hop (small jump, land on toe then flat) — reps in a row',   type: 'number', placeholder: 'e.g. 5' },
          { key: 'landingHold',  label: 'Jump landing position hold — one leg, arms in, free leg back (seconds)', type: 'number', placeholder: 'e.g. 5' },
          { key: 'spiralHold',   label: 'Spiral (arabesque) hold without support (seconds)',                type: 'number', placeholder: 'e.g. 5' },
          { key: 'waltzJumpSim', label: 'Waltz jump simulation on floor — step-step-jump-land (reps)',     type: 'number', placeholder: 'e.g. 4' },
        ]
      },

      // ── Mohawk & Turn Preparation ───────────────────────────
      // Targets Basic 4 (forward outside 3-turn), Basic 6 (forward inside 3-turn),
      // Basic 7 (Mohawk, backward-to-forward transition),
      // Basic 8 (moving 3-turns, combination move)
      {
        title: '🔄 Turns & Mohawk Prep', fullWidth: false,
        fields: [
          { key: 'threeTurnFO',  label: 'Forward outside 3-turn on floor — smooth both feet?', type: 'select',
            options: ['Not attempted','Losing balance','Mostly controlled','Clean both feet'] },
          { key: 'threeTurnFI',  label: 'Forward inside 3-turn on floor — smooth both feet?',  type: 'select',
            options: ['Not attempted','Losing balance','Mostly controlled','Clean both feet'] },
          { key: 'mohawkSim',    label: 'Mohawk transition on floor — weight transfer feels right?', type: 'select',
            options: ['Not attempted','Very awkward','Getting there','Smooth both directions'] },
          { key: 'backFwdTurn',  label: 'Backward-to-forward two-foot turn on flat floor — both directions?', type: 'select',
            options: ['Not yet','One direction only','Both directions with support','Both freestanding'] },
        ]
      },

      // ── Cardio & Session Notes ──────────────────────────────
      {
        title: '🫀 Cardio & Session Notes', fullWidth: true,
        inlineGrid: 3,
        fields: [
          { key: 'cardio',  label: 'Cardio duration today (min)',        type: 'number', placeholder: 'e.g. 20' },
          { key: 'day',     label: 'Session day completed',              type: 'select',
            options: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Rest day'] },
          { key: 'rating',  label: 'Overall session rating (1–10)',      type: 'range', min: 1, max: 10, default: 7 },
          { key: 'notes',   label: 'Notes (breakthroughs, struggles, ice time, anything!)', type: 'textarea',
            placeholder: 'e.g. Finally held a single-leg stand for 15 seconds!', fullWidth: true },
        ]
      },
    ],

    // ── Personal-best cards shown in Benchmarks tab ──────────
    benchmarks: [
      { key: 'singlelegEC',  label: 'Balance — Eyes Closed', unit: 'seconds', color: '#8b5fbf' },
      { key: 'wallsit',      label: 'Wall Sit',               unit: 'seconds', color: '#9e7ab8' },
      { key: 'plank',        label: 'Plank Hold',             unit: 'seconds', color: '#b89de0' },
      { key: 'spiralHold',   label: 'Spiral Hold',            unit: 'seconds', color: '#c9a96e' },
      { key: 'landingHold',  label: 'Landing Position',       unit: 'seconds', color: '#c070a0' },
      { key: 'oneFootSpin',  label: 'Spin Balance',           unit: 'seconds', color: '#a8d8ea' },
    ],

    // ── Line graphs shown in Benchmarks tab ──────────────────
    charts: [
      {
        id: 'weight', title: 'Weight Over Time', fields: [
          { key: 'weight', label: 'Weight', color: '#8b5fbf' },
        ]
      },
      {
        id: 'balance', title: 'Balance Progress', fields: [
          { key: 'singlelegEO', label: 'Balance eyes open (s)',  color: '#8b5fbf' },
          { key: 'singlelegEC', label: 'Balance eyes closed (s)', color: '#b89de0' },
          { key: 'edgeSim',     label: 'Edge lean hold (s)',      color: '#c9a96e' },
        ]
      },
      {
        id: 'strength', title: 'Strength & Core Progress', fields: [
          { key: 'wallsit',     label: 'Wall sit (s)',     color: '#8b5fbf' },
          { key: 'plank',       label: 'Plank (s)',        color: '#9e7ab8' },
          { key: 'gluteBridge', label: 'Glute bridge (s)', color: '#b89de0' },
          { key: 'squatReps',   label: 'Squats (reps)',    color: '#c070a0' },
        ]
      },
      {
        id: 'skating', title: 'Skating Skills Progress', fields: [
          { key: 'spiralHold',   label: 'Spiral hold (s)',    color: '#c070a0' },
          { key: 'landingHold',  label: 'Landing hold (s)',   color: '#9e7ab8' },
          { key: 'oneFootSpin',  label: 'Spin balance (s)',   color: '#a8d8ea' },
          { key: 'waltzJumpSim', label: 'Waltz jump (reps)',  color: '#c9a96e' },
        ]
      },
    ],

    // ── Fields shown as stat pills in history entries ─────────
    historyStats: [
      { key: 'weight',       label: 'Weight',          suffix: e => ` ${e.weightUnit || 'lbs'}` },
      { key: 'singlelegEO',  label: 'Balance open',    suffix: () => 's' },
      { key: 'singlelegEC',  label: 'Balance closed',  suffix: () => 's' },
      { key: 'wallsit',      label: 'Wall sit',        suffix: () => 's' },
      { key: 'plank',        label: 'Plank',           suffix: () => 's' },
      { key: 'spiralHold',   label: 'Spiral',          suffix: () => 's' },
      { key: 'landingHold',  label: 'Landing',         suffix: () => 's' },
      { key: 'oneFootSpin',  label: 'Spin balance',    suffix: () => 's' },
      { key: 'bunnyHopSim',  label: 'Bunny hops',      suffix: () => '' },
      { key: 'waltzJumpSim', label: 'Waltz jumps',     suffix: () => '' },
      { key: 'cardio',       label: 'Cardio',          suffix: () => ' min' },
      { key: 'energy',       label: 'Energy',          suffix: () => '/10' },
      { key: 'rating',       label: 'Session rating',  suffix: () => '/10' },
    ],

    // ── Select (non-numeric) fields shown in history entries ──
    historySelectStats: [
      'hipflex', 'straddle', 'ankleFlex',
      'threeTurnFO', 'threeTurnFI', 'mohawkSim', 'backFwdTurn',
    ],

    // ── Colors for the level tag in history (one per meta level option) ──
    metaColorKeys: ['#8b5fbf', '#9e7ab8', '#b89de0', '#c070a0'],
  },


  // ── ON-ICE SESSIONS TRACKER ────────────────────────────────
  {
    id: 'onice',
    label: '⛸ On-Ice Sessions',
    storageKey: 'skating_onice_entries',

    meta: [
      { key: 'date',  label: 'Date',         type: 'date' },
      { key: 'phase', label: 'Phase',         type: 'select',
        options: [
          'Phase 1 — Basics 1–2',
          'Phase 2 — Basics 3–4',
          'Phase 3 — Basics 5–6',
          'Phase 4 — Basics 7–8',
        ]
      },
      { key: 'sessionNum', label: 'Session #', type: 'number', placeholder: 'e.g. 3' },
    ],

    cards: [
      // ── Session Feel ──────────────────────────────────────────
      {
        title: '📋 Session Feel', fullWidth: false,
        fields: [
          { key: 'iceTime',    label: 'Ice time (minutes)',                type: 'number', placeholder: 'e.g. 45' },
          { key: 'confidence', label: 'Overall confidence on ice (1–10)',  type: 'range',  min: 1, max: 10, default: 5 },
          { key: 'energy',     label: 'Energy level today (1–10)',         type: 'range',  min: 1, max: 10, default: 7 },
          { key: 'falls',      label: 'Number of falls this session',      type: 'number', placeholder: 'e.g. 2' },
        ]
      },

      // ── Basics 1–2 Elements ───────────────────────────────────
      {
        title: '🔵 Basics 1–2 Elements', fullWidth: false,
        fields: [
          { key: 'twoFootGlide',   label: 'Two-foot glide — felt how?',          type: 'select',
            options: ['Not attempted','Very shaky','Getting there','Solid'] },
          { key: 'oneFootGlideR',  label: 'One-foot glide — Right foot hold (s)', type: 'number', placeholder: 'e.g. 3' },
          { key: 'oneFootGlideL',  label: 'One-foot glide — Left foot hold (s)',  type: 'number', placeholder: 'e.g. 3' },
          { key: 'snowplowStop',   label: 'Snowplow stop — felt how?',            type: 'select',
            options: ['Not attempted','Inconsistent','Mostly reliable','Clean every time'] },
          { key: 'fwdSwizzles',    label: 'Forward swizzles — reps in a row',     type: 'number', placeholder: 'e.g. 6' },
          { key: 'bwdWiggles',     label: 'Backward wiggles — reps in a row',     type: 'number', placeholder: 'e.g. 6' },
        ]
      },

      // ── Basics 3–4 Elements ───────────────────────────────────
      {
        title: '🟣 Basics 3–4 Elements', fullWidth: false,
        fields: [
          { key: 'fwdStroking',    label: 'Forward stroking — felt how?',         type: 'select',
            options: ['Not attempted','Stepping not pushing','Pushing but uneven','Clean push and glide'] },
          { key: 'fwdCrossovers',  label: 'Forward crossovers — felt how?',       type: 'select',
            options: ['Not attempted','Stepping not crossing','Crossing but flat','Crossing with lean'] },
          { key: 'twoFootSpin',    label: 'Two-foot spin — revolutions',          type: 'number', placeholder: 'e.g. 2' },
          { key: 'foThreeTurn',    label: 'FO 3-turn — felt how?',                type: 'select',
            options: ['Not attempted','Losing balance','Mostly controlled','Clean both feet'] },
          { key: 'fwdEdges',       label: 'Forward edges (inside & outside) — felt how?', type: 'select',
            options: ['Not attempted','Flat — no lean','Some lean both types','Clear edge both types'] },
        ]
      },

      // ── Basics 5–6 Elements ───────────────────────────────────
      {
        title: '🌸 Basics 5–6 Elements', fullWidth: false,
        fields: [
          { key: 'bwdCrossovers',  label: 'Backward crossovers — felt how?',      type: 'select',
            options: ['Not attempted','Stepping not crossing','Crossing both directions','Confident both directions'] },
          { key: 'hockeyStop',     label: 'Hockey stop — felt how?',              type: 'select',
            options: ['Not attempted','Catching edge','One side only','Both sides clean'] },
          { key: 'oneFootSpin',    label: 'One-foot spin — revolutions held',     type: 'number', placeholder: 'e.g. 2' },
          { key: 'spiral',         label: 'Spiral — free leg height',             type: 'select',
            options: ['Not attempted','Below hip','At hip height','Above hip'] },
          { key: 'bunnyHop',       label: 'Bunny hop — felt how?',                type: 'select',
            options: ['Not attempted','Hesitant','Landing but no hold','Clean toe-then-flat landing'] },
          { key: 'fiThreeTurn',    label: 'FI 3-turn — felt how?',               type: 'select',
            options: ['Not attempted','Losing balance','Mostly controlled','Clean both feet'] },
        ]
      },

      // ── Basics 7–8 Elements ───────────────────────────────────
      {
        title: '🏆 Basics 7–8 Elements', fullWidth: false,
        fields: [
          { key: 'mohawk',         label: 'Mohawk — felt how?',                   type: 'select',
            options: ['Not attempted','Very awkward','Getting smoother','Smooth both directions'] },
          { key: 'waltzJump',      label: 'Waltz jump — felt how?',               type: 'select',
            options: ['Not attempted','No rotation yet','Half-turn but falling','Clean landing hold'] },
          { key: 'uprightSpin',    label: 'One-foot upright spin — revolutions',  type: 'number', placeholder: 'e.g. 3' },
          { key: 'combinationMove',label: 'Basic 8 combination move — felt how?', type: 'select',
            options: ['Not attempted','Broken up — lots of pauses','Mostly connected','Fully connected both directions'] },
          { key: 'movingThreeTurn',label: 'Moving 3-turns (FO & FI) — felt how?', type: 'select',
            options: ['Not attempted','From standstill only','Moving entry but unsteady','Clean from moving entry'] },
          { key: 'mazurka',        label: 'Mazurka — felt how?',                  type: 'select',
            options: ['Not attempted','Jump but no rotation','Half-turn but stumbling','Clean both feet'] },
        ]
      },

      // ── Pre-Bronze Test Readiness ─────────────────────────────
      {
        title: '📝 Pre-Bronze Test Readiness', fullWidth: false,
        fields: [
          { key: 'testStroking',   label: 'Test element: Forward stroking',                type: 'select',
            options: ['Not run','Needs work','Nearly ready','Test ready'] },
          { key: 'testEdges',      label: 'Test element: Basic consecutive edges',         type: 'select',
            options: ['Not run','Needs work','Nearly ready','Test ready'] },
          { key: 'testCrossovers', label: 'Test element: Fwd & bwd crossovers figure-8s', type: 'select',
            options: ['Not run','Needs work','Nearly ready','Test ready'] },
          { key: 'testThreeTurns', label: 'Test element: Alternating forward 3-turns',    type: 'select',
            options: ['Not run','Needs work','Nearly ready','Test ready'] },
        ]
      },

      // ── Session Notes ─────────────────────────────────────────
      {
        title: '💬 Session Notes', fullWidth: true,
        fields: [
          { key: 'coachFeedback', label: 'Coach feedback (if applicable)',          type: 'textarea',
            placeholder: 'e.g. Coach said to keep free foot closer to ankle on glides', fullWidth: true },
          { key: 'notes',         label: 'Personal notes — breakthroughs, struggles, moments', type: 'textarea',
            placeholder: 'e.g. First time the waltz jump felt like a real jump!', fullWidth: true },
          { key: 'rating',        label: 'Overall session rating (1–10)',           type: 'range', min: 1, max: 10, default: 7 },
        ]
      },
    ],

    benchmarks: [
      { key: 'oneFootGlideR', label: 'Best Glide — Right', unit: 'seconds',    color: '#8b5fbf' },
      { key: 'oneFootGlideL', label: 'Best Glide — Left',  unit: 'seconds',    color: '#9e7ab8' },
      { key: 'twoFootSpin',   label: 'Two-Foot Spin',       unit: 'revolutions', color: '#b89de0' },
      { key: 'oneFootSpin',   label: 'One-Foot Spin',        unit: 'revolutions', color: '#c070a0' },
      { key: 'uprightSpin',   label: 'Upright Spin',         unit: 'revolutions', color: '#c9a96e' },
      { key: 'iceTime',       label: 'Longest Session',      unit: 'minutes',    color: '#a8d8ea' },
    ],

    charts: [
      {
        id: 'onice-glide', title: 'One-Foot Glide Progress', fields: [
          { key: 'oneFootGlideR', label: 'Right foot (s)', color: '#8b5fbf' },
          { key: 'oneFootGlideL', label: 'Left foot (s)',  color: '#b89de0' },
        ]
      },
      {
        id: 'onice-spins', title: 'Spin Revolutions Over Time', fields: [
          { key: 'twoFootSpin',  label: 'Two-foot spin',   color: '#9e7ab8' },
          { key: 'oneFootSpin',  label: 'One-foot spin',   color: '#c070a0' },
          { key: 'uprightSpin',  label: 'Upright spin',    color: '#c9a96e' },
        ]
      },
      {
        id: 'onice-confidence', title: 'Confidence & Session Rating', fields: [
          { key: 'confidence', label: 'Confidence (1–10)', color: '#8b5fbf' },
          { key: 'rating',     label: 'Session rating',    color: '#c070a0' },
        ]
      },
    ],

    historyStats: [
      { key: 'iceTime',       label: 'Ice time',      suffix: () => ' min' },
      { key: 'oneFootGlideR', label: 'Glide R',       suffix: () => 's' },
      { key: 'oneFootGlideL', label: 'Glide L',       suffix: () => 's' },
      { key: 'twoFootSpin',   label: '2-ft spin',     suffix: () => ' rev' },
      { key: 'oneFootSpin',   label: '1-ft spin',     suffix: () => ' rev' },
      { key: 'uprightSpin',   label: 'Upright spin',  suffix: () => ' rev' },
      { key: 'falls',         label: 'Falls',         suffix: () => '' },
      { key: 'confidence',    label: 'Confidence',    suffix: () => '/10' },
      { key: 'rating',        label: 'Rating',        suffix: () => '/10' },
    ],

    historySelectStats: [
      'twoFootGlide', 'snowplowStop',
      'fwdStroking', 'fwdCrossovers', 'foThreeTurn', 'fwdEdges',
      'bwdCrossovers', 'hockeyStop', 'spiral', 'bunnyHop', 'fiThreeTurn',
      'mohawk', 'waltzJump', 'combinationMove', 'movingThreeTurn', 'mazurka',
      'testStroking', 'testEdges', 'testCrossovers', 'testThreeTurns',
    ],

    metaColorKeys: ['#8b5fbf', '#9e7ab8', '#b89de0', '#c070a0'],
  },


  // ── NUTRITION TRACKER ───────────────────────────────────────
  {
    id: 'nutrition',
    label: '🥗 Nutrition',
    storageKey: 'skating_nutrition_entries',

    meta: [
      { key: 'date', label: 'Date', type: 'date' },
    ],

    cards: [
      {
        title: '🍽 Daily Macros', fullWidth: false,
        fields: [
          { key: 'calories', label: 'Calories (this meal/snack)', type: 'number', placeholder: 'e.g. 450' },
          { key: 'protein',  label: 'Protein (g)',   type: 'number', placeholder: 'e.g. 30' },
          { key: 'carbs',    label: 'Carbs (g)',     type: 'number', placeholder: 'e.g. 45' },
          { key: 'fats',     label: 'Fats (g)',      type: 'number', placeholder: 'e.g. 15' },
        ]
      },
      {
        title: '💧 Hydration & Energy', fullWidth: false,
        fields: [
          { key: 'water',       label: 'Water intake (oz or mL)', type: 'number', placeholder: 'e.g. 80' },
          { key: 'waterUnit',   label: 'Unit',                    type: 'select', options: ['oz','mL'] },
          { key: 'energyLevel', label: 'Energy level (1–10)',     type: 'range', min: 1, max: 10, default: 7 },
          { key: 'hungerLevel', label: 'Hunger level (1–10)',     type: 'range', min: 1, max: 10, default: 5 },
        ]
      },
      {
        title: '📝 Notes', fullWidth: true,
        fields: [
          { key: 'notes', label: 'Meal highlights, cravings, how you felt', type: 'textarea',
            placeholder: 'e.g. Had a great pre-workout meal, felt strong during training', fullWidth: true },
        ]
      },
    ],

    benchmarks: [
      { key: 'avgCalories', label: 'Avg Daily Calories', unit: 'kcal', color: '#8b5fbf' },
      { key: 'avgProtein',  label: 'Avg Protein',        unit: 'g',    color: '#9e7ab8' },
    ],

    charts: [
      {
        id: 'cals', title: 'Calorie Intake Over Time', fields: [
          { key: 'calories', label: 'Calories', color: '#8b5fbf' },
        ]
      },
      {
        id: 'macros', title: 'Macronutrient Balance', fields: [
          { key: 'protein', label: 'Protein (g)', color: '#c070a0' },
          { key: 'carbs',   label: 'Carbs (g)',   color: '#9e7ab8' },
          { key: 'fats',    label: 'Fats (g)',    color: '#b89de0' },
        ]
      },
    ],

    historyStats: [
      { key: 'calories',    label: 'Cals',    suffix: () => ''     },
      { key: 'protein',     label: 'Protein', suffix: () => 'g'    },
      { key: 'carbs',       label: 'Carbs',   suffix: () => 'g'    },
      { key: 'fats',        label: 'Fats',    suffix: () => 'g'    },
      { key: 'water',       label: 'Water',   suffix: e => ` ${e.waterUnit || 'oz'}` },
      { key: 'energyLevel', label: 'Energy',  suffix: () => '/10'  },
    ],

    historySelectStats: [],
    metaColorKeys: ['#8b5fbf'],

    hasSettings: true,
    settingsFields: [
      { key: 'age',       label: 'Age',         type: 'number', placeholder: 'e.g. 21' },
      { key: 'sex',       label: 'Sex',         type: 'select', options: ['Female','Male'] },
      { key: 'heightFt',  label: 'Height (ft)', type: 'number', placeholder: 'e.g. 5' },
      { key: 'heightIn',  label: 'Height (in)', type: 'number', placeholder: 'e.g. 6' },
      { key: 'trainingPhase', label: 'Current Off-Ice Phase', type: 'select',
        options: [
          'Phase 1 — Basics 1–2 (Foundation)',
          'Phase 2 — Basics 3–4 (Edges & Crossovers)',
          'Phase 3 — Basics 5–6 (Backward Skating & Jumps)',
          'Phase 4 — Basics 7–8 (Mohawks, Waltz Jump & Spins)',
          'Not started yet',
        ]
      },
      { key: 'onIceDays', label: 'On-Ice Sessions Per Week', type: 'select',
        options: ['0 (not on ice yet)','1','2','3','4+'] },
      { key: 'goal', label: 'Nutrition Goal', type: 'select',
        options: ['Lose weight','Maintain weight','Gain muscle'] },
    ],
  },
];
