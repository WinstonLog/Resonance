window.S = window.S || {};

(function(){
  const strings = {
    ru: {
      title: 'СОЗВУЧИЕ',
      subtitle: 'головоломка о свете и звуке',
      play: 'Играть',
      continue: 'Продолжить',
      continueLevel: 'Продолжить · ур.',
      stats: 'Статистика',
      howToPlay: 'Как играть',
      settings: 'Настройки',
      close: 'Закрыть',
      pause: 'Пауза',
      resume: 'Продолжить',
      restart: 'Начать заново',
      mainMenu: 'Главное меню',
      getHint: 'Подсказка',
      bestLevel: 'Рекорд:',

      addToFavorites: 'В избранное',
      support: 'Поддержка',
      openVkLeaderboard: 'Открыть рейтинг VK',
      lbVkHint: 'Нажми «Открыть рейтинг VK», чтобы увидеть таблицу лидеров',

      favoritesAdded: 'Добавлено в избранное!',
      favoritesAlready: 'Уже в избранном',
      favoritesFailed: 'Не удалось добавить',

      level: 'УРОВЕНЬ',
      moves: 'ХОДОВ',

      solved: 'РЕШЕНО',
      levelUp: 'Готовься к следующему уровню',
      extinguishAll: 'Погаси все огни',

      sound: 'Звук',
      music: 'Музыка',
      vibration: 'Вибрация',
      language: 'Язык',
      auto: 'Авто',
      resetProgress: 'Сбросить прогресс',
      confirmReset: 'Сбросить весь прогресс?',
      progressReset: 'Прогресс сброшен',

      howToText: 'Нажимай на светящиеся ячейки. Каждая ячейка переключает себя и соседей сверху, снизу, слева и справа. Цель — погасить все огни. Каждая ячейка звучит своей нотой.',
      tutStep1: 'Нажми на эту ячейку',
      tutStep2: 'Соседи тоже переключаются',
      tutStep3: 'Погаси все огни, чтобы пройти уровень',

      hintApplied: 'Подсказка:',
      hintNone: 'Уровень уже почти решён',
      adFail: 'Реклама недоступна',
      hintWait: 'Подожди',
      sec: 'сек.',

      hintModalTitle: 'Посмотреть рекламу?',
      hintModalText: 'За просмотр вы получите одну подсказку — один ход на поле.',
      hintAdReady: 'Реклама доступна',
      hintAdCooldown: 'Реклама будет доступна через',
      hintAdUnavailable: 'Реклама временно недоступна',
      cancel: 'Отмена',
      confirm: 'Смотреть',

      daily: 'Ежедневный вызов',
      dailyDone: 'Сегодня пройдено',
      dailyDoneBadge: '✓ Сегодня пройдено',
      dailyPlay: 'Играть вызов',
      streakLabel: 'Серия',
      bestStreak: 'Лучшая',
      daysTotal: 'Дней всего',
      streakDays: 'дн. подряд',
      dailyCompleted: 'Ежедневный вызов пройден!',
      dailyShared: 'Уровень одинаков у всех игроков мира',
      dailyRefresh: 'Новый вызов обновляется каждую полночь',

      streakReward: 'Награда за серию!',
      streakRewardHints: '+{n} подсказки',
      streakRewardSkin: 'Скин «{name}» открыт',
      streakRewardTranspose: 'Открыта смена тональности',
      streakRewardBadge: 'Значок «Марафонец» открыт',
      streakNextIn: 'До награды: {n} дн.',

      achievements: 'Достижения',
      newAchievement: 'Новое достижение!',

      skins: 'Скины',
      locked: 'Закрыт',
      unlocked: 'Открыт',

      weekMon: 'Пн', weekTue: 'Вт', weekWed: 'Ср', weekThu: 'Чт',
      weekFri: 'Пт', weekSat: 'Сб', weekSun: 'Вс',

      statsTitle: 'Статистика',
      statLevels: 'Пройдено уровней',
      statPerfect: 'Идеально',
      statRating: 'Очков рейтинга',
      statStreak: 'Лучшая серия',
      statDays: 'Дней в игре',
      statDailyDone: 'Daily пройдено',

      leaderboard: 'Рейтинг',
      lbNoSDK: 'Рейтинг доступен только внутри VK',
      lbError: 'Не удалось загрузить рейтинг',
      lbAnonymous: 'Игрок',

      rating: 'Рейтинг',
      ratingPoints: 'очк.',
      solvedIn: 'Сделано:',
      idealMoves: 'Идеал:',
      perfectLevel: 'ИДЕАЛЬНО',
      alreadyScored: 'Без очков',
      movesShort: 'х.',

      newRecordToast: 'Новый рекорд! Уровень {n}'
    },
    en: {
      title: 'RESONANCE',
      subtitle: 'a puzzle of light and sound',
      play: 'Play',
      continue: 'Continue',
      continueLevel: 'Continue · lvl',
      stats: 'Stats',
      howToPlay: 'How to play',
      settings: 'Settings',
      close: 'Close',
      pause: 'Pause',
      resume: 'Resume',
      restart: 'Restart',
      mainMenu: 'Main menu',
      getHint: 'Hint',
      bestLevel: 'Best:',

      addToFavorites: 'Add to favorites',
      support: 'Support',
      openVkLeaderboard: 'Open VK leaderboard',
      lbVkHint: 'Tap "Open VK leaderboard" to see the global ranking',

      favoritesAdded: 'Added to favorites!',
      favoritesAlready: 'Already in favorites',
      favoritesFailed: 'Could not add',

      level: 'LEVEL',
      moves: 'MOVES',

      solved: 'SOLVED',
      levelUp: 'Get ready for the next level',
      extinguishAll: 'Extinguish all lights',

      sound: 'Sound',
      music: 'Music',
      vibration: 'Vibration',
      language: 'Language',
      auto: 'Auto',
      resetProgress: 'Reset progress',
      confirmReset: 'Reset all progress?',
      progressReset: 'Progress reset',

      howToText: 'Tap glowing cells. Each cell toggles itself and its neighbors above, below, left and right. Goal is to extinguish all lights. Each cell plays its own note.',
      tutStep1: 'Tap this cell',
      tutStep2: 'Neighbors toggle too',
      tutStep3: 'Extinguish all lights to pass',

      hintApplied: 'Hint:',
      hintNone: 'The level is almost solved',
      adFail: 'Ad unavailable',
      hintWait: 'Wait',
      sec: 'sec.',

      hintModalTitle: 'Watch an ad?',
      hintModalText: 'You will get one hint — one move on the board.',
      hintAdReady: 'Ad is available',
      hintAdCooldown: 'Ad will be available in',
      hintAdUnavailable: 'Ad is temporarily unavailable',
      cancel: 'Cancel',
      confirm: 'Watch',

      daily: 'Daily challenge',
      dailyDone: 'Done today',
      dailyDoneBadge: '✓ Done today',
      dailyPlay: 'Play challenge',
      streakLabel: 'Streak',
      bestStreak: 'Best',
      daysTotal: 'Total days',
      streakDays: 'days in a row',
      dailyCompleted: 'Daily challenge complete!',
      dailyShared: 'The level is the same for all players worldwide',
      dailyRefresh: 'A new challenge refreshes every midnight',

      streakReward: 'Streak reward!',
      streakRewardHints: '+{n} hints',
      streakRewardSkin: 'Skin "{name}" unlocked',
      streakRewardTranspose: 'Key transposition unlocked',
      streakRewardBadge: 'Badge "Marathoner" unlocked',
      streakNextIn: 'Next reward in {n} d.',

      achievements: 'Achievements',
      newAchievement: 'New achievement!',

      skins: 'Skins',
      locked: 'Locked',
      unlocked: 'Unlocked',

      weekMon: 'Mon', weekTue: 'Tue', weekWed: 'Wed', weekThu: 'Thu',
      weekFri: 'Fri', weekSat: 'Sat', weekSun: 'Sun',

      statsTitle: 'Stats',
      statLevels: 'Levels passed',
      statPerfect: 'Perfect',
      statRating: 'Rating points',
      statStreak: 'Best streak',
      statDays: 'Days in game',
      statDailyDone: 'Daily completed',

      leaderboard: 'Rating',
      lbNoSDK: 'Leaderboard is available inside VK only',
      lbError: 'Failed to load the leaderboard',
      lbAnonymous: 'Player',

      rating: 'Rating',
      ratingPoints: 'pts',
      solvedIn: 'Moves:',
      idealMoves: 'Ideal:',
      perfectLevel: 'PERFECT',
      alreadyScored: 'No points',
      movesShort: 'mv.',

      newRecordToast: 'New record! Level {n}'
    }
  };

  S.I18N = {
    lang: 'ru',
    mode: 'auto',
    t(key){ return (strings[this.lang] || strings.ru)[key] || key; },
    setLang(code){
      this.lang = (code||'ru').toLowerCase().startsWith('ru') ? 'ru' : 'en';
      document.documentElement.lang = this.lang;
      this.applyToDOM();
    },
    setMode(mode){
      this.mode = mode;
      if(mode === 'auto' && S.SDK && S.SDK.detectedLang){
        this.setLang(S.SDK.detectedLang);
      } else if(mode !== 'auto'){
        this.setLang(mode);
      }
    },
    applyToDOM(){
      document.querySelectorAll('[data-i18n]').forEach(el=>{
        const key = el.getAttribute('data-i18n');
        const val = this.t(key);
        if(val) el.textContent = val;
      });
    }
  };
})();