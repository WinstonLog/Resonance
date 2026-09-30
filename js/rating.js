window.S = window.S || {};

S.Rating = {
  totalPoints: 0,
  perfectCount: 0,
  scoredLevels: [],

  init(){
    this.totalPoints   = S.Storage.get('ratingPoints', 0) || 0;
    this.perfectCount  = S.Storage.get('ratingPerfect', 0) || 0;
    this.scoredLevels  = S.Storage.get('ratingLevels', []) || [];
    if (!Array.isArray(this.scoredLevels)) this.scoredLevels = [];
  },

  isScored(level){
    return this.scoredLevels.indexOf(level) !== -1;
  },

  pointsFor(diff){
    if (diff < 0) diff = 0;
    const table = S.CONFIG.RATING || [];
    for (const row of table){
      if (diff <= row.diff) return row.points;
    }
    return S.CONFIG.RATING_MIN || 20;
  },

  addScore(level, moves, ideal){
    if (this.isScored(level)){
      return { points: 0, isPerfect: false, isNew: false };
    }

    const diff = Math.max(0, moves - ideal);
    const points = this.pointsFor(diff);
    const isPerfect = (diff === 0);

    this.totalPoints += points;
    if (isPerfect) this.perfectCount++;
    this.scoredLevels.push(level);

    if (this.scoredLevels.length > 500){
      this.scoredLevels = this.scoredLevels.slice(-500);
    }

    S.Storage.set('ratingPoints', this.totalPoints);
    S.Storage.set('ratingPerfect', this.perfectCount);
    S.Storage.set('ratingLevels', this.scoredLevels);

    S.SDK.saveCloud({
      ratingPoints: this.totalPoints,
      ratingPerfect: this.perfectCount,
      ratingLevels: this.scoredLevels
    });

    return { points, isPerfect, isNew: true };
  },

  submit(){
    S.Leaderboard.submit(this.totalPoints);
  }
};