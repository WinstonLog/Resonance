window.S = window.S || {};

S.Storage = {
  /* ==================== БАЗОВЫЕ ОПЕРАЦИИ ==================== */

  // Возвращает весь объект сохранения как JS-объект.
  // Если данных нет или они повреждены — возвращает пустой объект.
  load(){
    try{
      const raw = localStorage.getItem(S.CONFIG.STORAGE_KEY);
      if(!raw) return {};
      const parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object') ? parsed : {};
    }catch(e){
      console.warn('Storage.load failed', e);
      return {};
    }
  },

  // Сливает переданные поля с текущим сохранением и записывает.
  // Значение null сохраняется явно (важно для очистки puzzleState).
  save(data){
    try{
      const cur = this.load();
      const merged = Object.assign({}, cur, data);
      localStorage.setItem(S.CONFIG.STORAGE_KEY, JSON.stringify(merged));
    }catch(e){
      console.warn('Storage.save failed', e);
    }
  },

  /* ==================== ДОСТУП К ПОЛЯМ ==================== */

  // Читает поле; если его нет — возвращает def.
  // Если значение явно null — тоже возвращает def (чтобы
  // "очищенные" пулы и флаги не ломали логику).
  get(key, def){
    const d = this.load();
    const val = d[key];
    return (val === undefined || val === null) ? def : val;
  },

  // Записывает поле. null допустим — превращается в "нет значения".
  set(key, val){
    const patch = {};
    patch[key] = val;
    this.save(patch);
  },

  // Удаляет поле полностью (а не записывает null).
  remove(key){
    try{
      const cur = this.load();
      if(key in cur){
        delete cur[key];
        localStorage.setItem(S.CONFIG.STORAGE_KEY, JSON.stringify(cur));
      }
    }catch(e){
      console.warn('Storage.remove failed', e);
    }
  },

  /* ==================== ПОЛНАЯ ОЧИСТКА ==================== */

  // Полностью удаляет сохранение игры.
  // Используется кнопкой "Сбросить прогресс".
  clear(){
    try{
      localStorage.removeItem(S.CONFIG.STORAGE_KEY);
    }catch(e){
      console.warn('Storage.clear failed', e);
    }
  },

  /* ==================== ОТЛАДКА ==================== */

  // Полезно во время разработки: посмотреть всё сохранение в консоли.
  dump(){
    const d = this.load();
    console.log('S.Storage dump:', d);
    return d;
  }
};