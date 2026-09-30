window.S = window.S || {};

S.CONFIG = {
  ROWS: 5,
  COLS: 5,
  BASE_CLICKS: 2,
  MAX_CLICKS: 9,

  // Базовая пентатоника C-dur
  SCALE: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99],
  // Транспозиция по уровням: каждый блок из 5 уровней — сдвиг тональности.
  TRANSPOSE: [1.000, 1.122, 1.260, 1.498, 1.682],

  // ID лидерборда, созданного в настройках приложения VK.
  // В VK leaderboards идентифицируются числами.
  LEADERBOARD_ID: 1,

  STORAGE_KEY: 'sozvuchie_v1',
  AD_COOLDOWN_MS: 120_000,
  AD_FIRST_LEVEL: 3,

  DAILY_LEADERBOARD: 1,
  DAILY_CLICKS: 5,

  FAST_THRESHOLD: 3000,
  FAST5_THRESHOLD: 5000,
  NOHINT_TARGET: 10,

  HINT_COOLDOWN_MS: 30_000,

  RATING: [
    { diff: 0, points: 100 },
    { diff: 1, points: 70 },
    { diff: 2, points: 50 },
    { diff: 3, points: 30 }
  ],
  RATING_MIN: 20,

  STREAK_REWARDS: [
    { day: 3,  type: 'hints',  amount: 2 },
    { day: 7,  type: 'skin',   skinId: 'mono' },
    { day: 14, type: 'transpose' },
    { day: 30, type: 'badge',  badgeId: 'marathon' }
  ],

  MILESTONES: [10, 25, 50, 100, 200]
};