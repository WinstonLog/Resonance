window.S = window.S || {};

(async function(){
  S.Renderer.init();
  S.Input.init();
  S.Game.initDust();

  S.Game.state.level = S.Storage.get('level', 1);
  S.Game.state.best  = S.Storage.get('best', 1);
  S.Game.state.mode  = 'title';

  S.Daily.init();
  S.Skins.init();
  S.Achievements.init();
  S.Hints.init();
  S.Rating.init();

  S.UI.init();
  S.UI.updateHUD();
  S.UI.updateBest();
  S.UI.updateHintsCounter();
  S.UI.updateRating();
  S.UI.updatePlayButton();
  S.UI.show('screen-title');

  S.Skins.applyToCells();

  // Титульный экран готов
  S.SDK.notifyReady();

  let lastT = performance.now();
  function loop(t){
    const dt = Math.min(0.05, (t - lastT)/1000 || 0);
    lastT = t;
    const m = S.Game.state.mode;
    if(m === 'paused' || m === 'howto' || m === 'settings'){
      S.Game.state.time += dt;
    } else {
      S.Game.update(dt);
    }
    S.Renderer.render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Инициализация VK Bridge (короткий таймаут, чтобы не блокировать запуск)
  const sdkPromise = S.SDK.init();
  const timeout = new Promise(res => setTimeout(()=> res('timeout'), 4000));
  try { await Promise.race([sdkPromise, timeout]); }
  catch(e){ console.warn('VK SDK race error', e); }

  if(S.SDK.isAuthorized){
    try {
      const cloud = await S.SDK.loadCloud();
      if(cloud){
        if(typeof cloud.level === 'number') S.Game.state.level = cloud.level;
        if(typeof cloud.best  === 'number') S.Game.state.best  = cloud.best;
        if(cloud.tutorialDone) S.Storage.set('tutorialDone', true);
        if(cloud.achievements){
          S.Storage.set('achievements', cloud.achievements);
          S.Achievements.init();
        }
        if(typeof cloud.hints === 'number'){
          S.Storage.set('hints', cloud.hints);
          S.Hints.init();
        }
        if(typeof cloud.ratingPoints === 'number'){
          S.Storage.set('ratingPoints', cloud.ratingPoints);
        }
        if(typeof cloud.ratingPerfect === 'number'){
          S.Storage.set('ratingPerfect', cloud.ratingPerfect);
        }
        if(Array.isArray(cloud.ratingLevels)){
          S.Storage.set('ratingLevels', cloud.ratingLevels);
        }
        S.Rating.init();

        S.UI.updateHUD();
        S.UI.updateBest();
        S.UI.updateHintsCounter();
        S.UI.updateRating();
        S.UI.updatePlayButton();
      }
    } catch(e){}
  }

  if(S.I18N.mode === 'auto' && S.SDK.detectedLang){
    S.I18N.setLang(S.SDK.detectedLang);
    S.I18N.applyToDOM();
    S.UI.updateRating();
    S.UI.updatePlayButton();
  }

  setTimeout(()=> S.Achievements.check(), 800);

  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden && S.Game.state.mode === 'playing'){
      S.UI.pause();
    }
  });
})();