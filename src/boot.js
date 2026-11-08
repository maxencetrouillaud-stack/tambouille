/* ===== Démarrage ===== */
(function boot() {
  hostTheme = document.documentElement.dataset.theme || null;
  const loc = lsLoad();
  if (loc) { KEYS.forEach(k => loadKey(k, loc[k])); UI.demo = !!loc.__demo; } else { S.pantry = demoPantry(); UI.demo = true; }
  migrate(); applyTheme(); applyLook();
  let r = location.hash.slice(1); if (r === 'stock') r = 'inventaire'; UI.route = VIEWS[r] ? r : 'accueil';
  render(); setSync('local'); initCloud(); optionsBoot();
  try { const k = 'tambouille-alert'; if (localStorage.getItem(k) !== todayISO()) { const n = watchList().length; if (n && !UI.demo) toast(`${pl(n, 'aliment')} à surveiller dans votre inventaire.`, { act: 'goInv', label: 'Voir' }); localStorage.setItem(k, todayISO()); } } catch {}
  document.addEventListener('visibilitychange', async () => { if (document.visibilityState === 'visible' && cook && !wakeLock) { try { wakeLock = await navigator.wakeLock?.request('screen'); } catch {} } });
})();
