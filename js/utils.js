window.S = window.S || {};

S.Utils = {
  // mulberry32 — детерминированный PRNG
  seededRandom(seed){
    let s = seed >>> 0;
    return function(){
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },

  dateKey(d){
    d = d || new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return `${y}${m}${day}`;
  },

  todaySeed(){
    return parseInt(this.dateKey(), 10) % 2147483647;
  },

  // Проверка "вчерашний ли день"
  isYesterdayKey(key){
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return this.dateKey(y) === key;
  }
};