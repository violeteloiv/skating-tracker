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
   ============================================================ */

const TRACKER_CONFIGS = [
  {
    id: 'officeice',
    label: '🏋️ Off-Ice Training',
    storageKey: 'skating_tracker_entries',

    // Meta fields shown at the top of every log entry
    meta: [
      { key: 'date',  label: 'Date',           type: 'date' },
      { key: 'month', label: 'Training Month',  type: 'select',
        options: ['Month 1 — Foundation','Month 2 — Build','Month 3 — Power','Month 4 — Performance'] },
      { key: 'week',  label: 'Week #',           type: 'select',
        options: ['Week 1','Week 2','Week 3','Week 4'] },
    ],

    // Cards shown in the log form
    cards: [
      {
        title: '📏 Body Metrics', fullWidth: false,
        fields: [
          { key: 'weight',     label: 'Weight',                            type: 'number', placeholder: 'e.g. 130', step: 0.1 },
          { key: 'weightUnit', label: 'Unit',                              type: 'select', options: ['lbs','kg'] },
          { key: 'energy',     label: 'How energized do you feel? (1–10)', type: 'range',  min:1, max:10, default:7 },
          { key: 'soreness',   label: 'Soreness level today (1–10)',       type: 'range',  min:1, max:10, default:3 },
        ]
      },
      {
        title: '💪 Strength', fullWidth: false,
        fields: [
          { key: 'pushups', label: 'Max full push-ups (in a row)',     type: 'number', placeholder: 'e.g. 5'  },
          { key: 'wallsit', label: 'Wall sit hold time (seconds)',     type: 'number', placeholder: 'e.g. 45' },
          { key: 'plank',   label: 'Full plank hold time (seconds)',   type: 'number', placeholder: 'e.g. 30' },
          { key: 'slsquat', label: 'Single-leg squat reps (each leg)', type: 'number', placeholder: 'e.g. 3'  },
        ]
      },
      {
        title: '⛸ Balance & Skating Skills', fullWidth: false,
        fields: [
          { key: 'balance', label: 'Single-leg balance, eyes closed (s)', type: 'number', placeholder: 'e.g. 12' },
          { key: 'spiral',  label: 'Spiral hold without wall (s)',         type: 'number', placeholder: 'e.g. 8'  },
          { key: 'sitspin', label: 'Sit-spin squat hold (s)',              type: 'number', placeholder: 'e.g. 5'  },
          { key: 'lateral', label: 'Lateral balance hold (s)',             type: 'number', placeholder: 'e.g. 10' },
        ]
      },
      {
        title: '🤸 Flexibility', fullWidth: false,
        fields: [
          { key: 'straddle', label: 'Straddle sit — can you reach the floor?', type: 'select',
            options: ['Not yet','Fingertips only','Palms down','Forearms on floor'] },
          { key: 'hipflex',  label: 'Hip flexor stretch — how does it feel?',  type: 'select',
            options: ['Very tight','Moderate tension','Mild stretch','Very open'] },
          { key: 'pigeon',   label: 'Pigeon pose — how low to floor?',          type: 'select',
            options: ['Hips far from floor','Need a pillow','Almost flat','Hips flat'] },
        ]
      },
      {
        title: '🫀 Cardio & Session Notes', fullWidth: true,
        inlineGrid: 3,
        fields: [
          { key: 'cardio', label: 'Cardio duration today (min)',   type: 'number', placeholder: 'e.g. 20' },
          { key: 'day',    label: 'Session day completed',          type: 'select',
            options: ['Monday','Tuesday','Wednesday','Thursday','Friday','Rest day'] },
          { key: 'rating', label: 'Overall session rating (1–10)', type: 'range', min:1, max:10, default:7 },
          { key: 'notes',  label: 'Notes (how it felt, wins, anything!)', type: 'textarea',
            placeholder: 'e.g. First time I held the spiral for 10 seconds!', fullWidth: true },
        ]
      },
    ],

    // Personal-best cards shown in Benchmarks tab
    benchmarks: [
      { key: 'pushups', label: 'Max Push-ups',        unit: 'reps',    color: '#8b5fbf' },
      { key: 'plank',   label: 'Longest Plank',       unit: 'seconds', color: '#9e7ab8' },
      { key: 'wallsit', label: 'Longest Wall Sit',    unit: 'seconds', color: '#b89de0' },
      { key: 'balance', label: 'Balance Eyes Closed', unit: 'seconds', color: '#c9a96e' },
      { key: 'spiral',  label: 'Spiral Hold',         unit: 'seconds', color: '#c070a0' },
      { key: 'sitspin', label: 'Sit-Spin Squat',      unit: 'seconds', color: '#a8d8ea' },
    ],

    // Line graphs shown in Benchmarks tab
    charts: [
      { id: 'weight', title: 'Weight Over Time', fields: [
          { key: 'weight', label: 'Weight', color: '#8b5fbf' },
        ]
      },
      { id: 'strength', title: 'Strength & Balance Progress', fields: [
          { key: 'pushups', label: 'Push-ups',    color: '#8b5fbf' },
          { key: 'plank',   label: 'Plank (s)',   color: '#9e7ab8' },
          { key: 'wallsit', label: 'Wall sit (s)',color: '#b89de0' },
          { key: 'balance', label: 'Balance (s)', color: '#c9a96e' },
          { key: 'spiral',  label: 'Spiral (s)',  color: '#c070a0' },
        ]
      },
    ],

    // Fields to show as stat pills in history entries
    historyStats: [
      { key: 'weight',  label: 'Weight',        suffix: e => ` ${e.weightUnit||'lbs'}` },
      { key: 'pushups', label: 'Push-ups',       suffix: () => '' },
      { key: 'plank',   label: 'Plank',          suffix: () => 's' },
      { key: 'wallsit', label: 'Wall sit',       suffix: () => 's' },
      { key: 'balance', label: 'Balance',        suffix: () => 's' },
      { key: 'spiral',  label: 'Spiral',         suffix: () => 's' },
      { key: 'sitspin', label: 'Sit-spin',       suffix: () => 's' },
      { key: 'cardio',  label: 'Cardio',         suffix: () => ' min' },
      { key: 'energy',  label: 'Energy',         suffix: () => '/10' },
      { key: 'rating',  label: 'Session rating', suffix: () => '/10' },
    ],

    // Select (non-numeric) fields to show in history entries
    historySelectStats: ['straddle','hipflex','pigeon'],

    // Colors for the month tag in history (one per meta month option)
    metaColorKeys: ['#8b5fbf','#9e7ab8','#b89de0','#c070a0'],
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
        title: '📊 Body Stats', fullWidth: false,
        fields: [
          { key: 'weight',     label: 'Current weight',  type: 'number', placeholder: 'e.g. 130', step: 0.1 },
          { key: 'weightUnit', label: 'Unit',            type: 'select', options: ['lbs','kg'] },
        ]
      },
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
          { key: 'water',  label: 'Water intake (oz or mL)', type: 'number', placeholder: 'e.g. 80' },
          { key: 'waterUnit', label: 'Unit', type: 'select', options: ['oz','mL'] },
          { key: 'energyLevel', label: 'Energy level (1–10)', type: 'range', min:1, max:10, default:7 },
          { key: 'hungerLevel', label: 'Hunger level (1–10)', type: 'range', min:1, max:10, default:5 },
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
      { id: 'cals', title: 'Calorie Intake Over Time', fields: [
          { key: 'calories', label: 'Calories', color: '#8b5fbf' },
        ]
      },
      { id: 'macros', title: 'Macronutrient Balance', fields: [
          { key: 'protein', label: 'Protein (g)', color: '#c070a0' },
          { key: 'carbs',   label: 'Carbs (g)',   color: '#9e7ab8' },
          { key: 'fats',    label: 'Fats (g)',    color: '#b89de0' },
        ]
      },
    ],

    historyStats: [
      { key: 'weight',  label: 'Weight', suffix: e => ` ${e.weightUnit||'lbs'}` },
      { key: 'calories', label: 'Cals', suffix: () => '' },
      { key: 'protein',  label: 'Protein',  suffix: () => 'g' },
      { key: 'carbs',    label: 'Carbs',    suffix: () => 'g' },
      { key: 'fats',     label: 'Fats',     suffix: () => 'g' },
      { key: 'water',    label: 'Water',    suffix: e => ` ${e.waterUnit||'oz'}` },
      { key: 'energyLevel', label: 'Energy', suffix: () => '/10' },
    ],

    historySelectStats: [],
    metaColorKeys: ['#8b5fbf'],

    // Nutrition-specific: settings for macro calculations
    hasSettings: true,
    settingsFields: [
      { key: 'age',       label: 'Age',             type: 'number', placeholder: 'e.g. 25' },
      { key: 'sex',       label: 'Sex',             type: 'select', options: ['Female','Male'] },
      { key: 'heightFt',  label: 'Height (ft)',     type: 'number', placeholder: 'e.g. 5' },
      { key: 'heightIn',  label: 'Height (in)',     type: 'number', placeholder: 'e.g. 6' },
      { key: 'activityLevel', label: 'Activity Level', type: 'select',
        options: ['Sedentary (little/no exercise)','Lightly active (1-3 days/week)','Moderately active (3-5 days/week)','Very active (6-7 days/week)','Extremely active (athlete)'] },
      { key: 'goal',      label: 'Goal',            type: 'select',
        options: ['Lose weight','Maintain weight','Gain muscle'] },
    ],
  },


  // ── EXAMPLE: On-Ice Sessions tracker ──────────────────────
  // Uncomment this entire block when you're ready to track
  // your on-ice progress!
  //
  // {
  //   id: 'onice',
  //   label: '⛸ On-Ice Sessions',
  //   storageKey: 'skating_onice_entries',
  //   meta: [
  //     { key: 'date',      label: 'Date',     type: 'date' },
  //     { key: 'lessonNum', label: 'Lesson #', type: 'number', placeholder: 'e.g. 1' },
  //   ],
  //   cards: [
  //     { title: '🛼 Elements Attempted', fullWidth: false, fields: [
  //       { key: 'forwardGlide', label: 'Forward glide (m)',     type: 'number', placeholder: 'e.g. 5' },
  //       { key: 'twoFootStop',  label: 'Two-foot stop: clean?', type: 'select', options: ['Not yet','Sort of','Yes!'] },
  //       { key: 'crossovers',   label: 'Crossovers attempted?', type: 'select', options: ['No','Yes'] },
  //     ]},
  //     { title: '💬 Session Notes', fullWidth: true, fields: [
  //       { key: 'notes', label: 'Coach feedback / personal notes', type: 'textarea',
  //         placeholder: 'e.g. Held an edge for the first time!', fullWidth: true },
  //     ]},
  //   ],
  //   benchmarks: [
  //     { key: 'forwardGlide', label: 'Longest Glide', unit: 'metres', color: '#8b5fbf' },
  //   ],
  //   charts: [
  //     { id: 'glide', title: 'Forward Glide Distance', fields: [
  //       { key: 'forwardGlide', label: 'Glide (m)', color: '#8b5fbf' },
  //     ]},
  //   ],
  //   historyStats: [
  //     { key: 'forwardGlide', label: 'Forward glide', suffix: () => 'm' },
  //   ],
  //   historySelectStats: ['twoFootStop','crossovers'],
  //   metaColorKeys: ['#8b5fbf'],
  // },
];
