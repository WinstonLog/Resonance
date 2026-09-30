window.S = window.S || {};

S.LeaderboardUI = {
  async render(force){
    const wrap = document.getElementById('lbList');
    const status = document.getElementById('lbStatus');
    if (!wrap) return;

    wrap.innerHTML = '';
    if (status) status.textContent = '';

    if (!S.SDK.ready){
      if (status) status.textContent = S.I18N.t('lbNoSDK');
      return;
    }

    // Показываем личную строку — очки рейтинга игрока
    const myScore = (S.Rating && S.Rating.totalPoints) || 0;
    const name = (S.SDK.user && (S.SDK.user.first_name || S.SDK.user.last_name))
      ? ((S.SDK.user.first_name || '') + ' ' + (S.SDK.user.last_name || '')).trim()
      : S.I18N.t('lbAnonymous');

    const row = document.createElement('div');
    row.className = 'lb-row me';
    const initial = name.trim().slice(0,1).toUpperCase() || '?';
    row.innerHTML =
      '<div class="lb-rank">★</div>' +
      '<div class="lb-avatar">' + initial + '</div>' +
      '<div class="lb-name">' + name + '</div>' +
      '<div class="lb-score">' + myScore + '</div>';
    wrap.appendChild(row);

    if (status){
      status.textContent = S.I18N.t('lbVkHint');
    }
  }
};