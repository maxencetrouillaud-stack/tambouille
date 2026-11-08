/* ===== Tambouille — options avancées : modes, génération, scanner, adaptations, mode cuisine, planning, courses, nutrition, paramètres ===== */

/* ----- Modes de cuisine : filtrent la liste locale ET orientent l'IA ----- */
const COOK_MODES = {
  express: { l: 'Express', i: 'clock', d: 'Moins de 15 min', F: { maxTime: 15 }, gen: { style: 'express, prête en 15 minutes maximum', maxTime: 15 } },
  eco: { l: 'Économique', i: 'cart', d: 'Budget minimal', test: (r, a, c) => c / servings() <= 1.5, sort: x => -x.cost / servings() * 6, gen: { style: 'très économique, moins de 1,50 € par portion', budget: 1.5 } },
  gaspi: { l: 'Anti-gaspi', i: 'leaf', d: 'Écouler ce qui périme', test: (r, a) => a.gaspi > 0, gen: { style: 'anti-gaspillage : utiliser d’abord les aliments qui périment', prioritize: true } },
  sport: { l: 'Sportif', i: 'flame', d: 'Riche en protéines', F: { minProt: 25 }, gen: { style: 'pour sportif : au moins 30 g de protéines par portion, glucides complexes' } },
  healthy: { l: 'Healthy', i: 'leaf', d: 'Léger et équilibré', test: r => MODES.equilibre[1](r), gen: { style: 'healthy : équilibrée, riche en légumes et en fibres, peu de matières grasses' } },
  gourmand: { l: 'Gourmand', i: 'heart', d: 'Réconfortant', F: { gourmand: 3 }, gen: { style: 'très gourmande et réconfortante' } },
  etudiant: { l: 'Étudiant', i: 'book', d: 'Simple et pas cher', test: (r, a, c) => c / servings() <= 1.6 && r.diff === 1 && r.time <= 30, gen: { style: 'étudiante : simple, rapide, très peu chère, peu de vaisselle', budget: 1.5, complexity: 'simple' } },
  famille: { l: 'Familial', i: 'users', d: 'Pour toute la tablée', test: r => r.diff <= 2 && r.gourmand >= 2 && r.meal === 'plat', gen: { style: 'familiale, appréciée des enfants', portions: 'familiale' } },
  gastro: { l: 'Gastronomique', i: 'star', d: 'Techniques de chef', test: r => r.diff >= 2 || r.gourmand >= 3, gen: { style: 'gastronomique : dressage soigné, techniques de chef, sauce maison', complexity: 'elabore' } },
  batch: { l: 'Batch cooking', i: 'box', d: 'Plusieurs repas d’un coup', test: r => r.servings >= 3 && /jour|congél/i.test(r.storage), gen: { style: 'batch cooking : préparées en une session, qui se conservent 3 à 4 jours au frigo ou se congèlent, avec un ordre de préparation optimisé', portions: 'familiale' } },
  videfrigo: { l: 'Vide-frigo', i: 'fridge', d: 'Utiliser un max du stock', sort: x => x.a.lines.filter(l => l.item).length * 8, gen: { style: 'vide-frigo : utiliser le plus grand nombre d’aliments différents de l’inventaire', mode: 'stock' } },
  zerocourse: { l: 'Zéro course', i: 'check', d: 'Uniquement le stock', test: (r, a) => a.canCook, gen: { mode: 'stock', maxMissing: 0 } },
  surprise: { l: 'Surprise', i: 'spark', d: 'L’IA choisit', surprise: true },
  dessert: { l: 'Dessert', i: 'heart', d: 'Sucré', F: { meal: 'dessert' }, gen: { meal: 'dessert' } },
  apero: { l: 'Apéritif', i: 'globe', d: 'À partager', test: r => ['collation', 'entree'].includes(r.meal), gen: { meal: 'collation', style: 'apéritif à partager : bouchées, tartinables, à picorer' } },
  complet: { l: 'Repas complet', i: 'chef', d: 'Entrée, plat, dessert', test: r => ['entree', 'plat', 'dessert'].includes(r.meal), gen: { prompt: 'Propose un MENU COMPLET cohérent : exactement 3 recettes, une entrée (meal "entree"), un plat (meal "plat") et un dessert (meal "dessert").', count: 3, meal: '' } },
  petitdej: { l: 'Petit-déjeuner', i: 'clock', d: 'Pour bien commencer', F: { meal: 'petitdej' }, gen: { meal: 'petitdej' } },
  vege: { l: 'Végétarien', i: 'leaf', d: 'Sans viande ni poisson', test: r => dietOK(r, 'vege'), gen: { style: 'végétarienne, sans viande ni poisson' } },
  monde: { l: 'Cuisine du monde', i: 'globe', d: 'Dépaysant', test: r => r.cuisine !== 'Française', gen: { style: 'cuisine du monde, dépaysante' } },
};
const WEATHER = { chaud: 'il fait chaud : plats frais, salades, peu de cuisson au four', froid: 'il fait froid : plats chauds et réconfortants, soupes, mijotés', pluie: 'temps pluvieux : plats réconfortants, gratins, soupes', doux: 'temps doux : plats de saison légers' };
const PRIORITY = { equilibre: 'équilibre entre prix, goût, temps et nutrition', prix: 'le prix le plus bas', gout: 'le goût avant tout', temps: 'le temps de préparation le plus court', nutrition: 'la qualité nutritionnelle' };
const CUISINES_LIST = ['Française', 'Italienne', 'Asiatique', 'Méditerranéenne', 'Américaine', 'Mexicaine', 'Indienne', 'Libanaise', 'Marocaine', 'Japonaise'];
const PORTIONS = [['Pâtes sèches', 100, 'g'], ['Riz cru', 75, 'g'], ['Semoule, quinoa, boulgour', 70, 'g'], ['Lentilles sèches', 70, 'g'], ['Pommes de terre', 250, 'g'], ['Viande', 150, 'g'], ['Poisson', 150, 'g'], ['Légumes', 200, 'g'], ['Salade verte', 50, 'g'], ['Pain', 60, 'g'], ['Soupe', 30, 'cl'], ['Fromage', 30, 'g']];

/* Bonus de classement : goûts, cuisines préférées, habitudes, priorité choisie */
let habitsCache = null;
function habits() {
  if (habitsCache && habitsCache.n === S.hist.length) return habitsCache;
  const c = {}; S.hist.forEach(h => { const w = h.rating ? h.rating - 2 : 1; if (h.cuisine) c[h.cuisine] = (c[h.cuisine] || 0) + w; });
  return habitsCache = { n: S.hist.length, cuisines: Object.entries(c).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).map(x => x[0]).slice(0, 2) };
}
function prefBonus({ r, a, cost }, P) {
  let b = 0; const likes = String(P.likes || '').split(',').map(norm).filter(Boolean);
  if (likes.length) b += r.ingr.filter(i => likes.some(l => nameMatches(l, i.n) || nameMatches(i.n, l))).length * 6;
  if (P.cuisinesFav?.length && cuisineIn(r.cuisine, P.cuisinesFav)) b += 8;
  if (habits().cuisines.includes(r.cuisine)) b += 4;
  const st = S.notes[r.id]?.stars; if (st) b += (st - 3) * 4;
  const pr = P.ai?.priority;
  if (pr === 'prix') b -= cost / servings() * 8; else if (pr === 'temps') b -= r.time / 4; else if (pr === 'gout') b += r.gourmand * 4; else if (pr === 'nutrition') b += (MODES.equilibre[1](r) ? 10 : 0) + r.fiber;
  return b;
}

/* ----- Préférences : enregistrement automatique (data-p / data-parr) ----- */
function setPref(path, v) { const ks = path.split('.'); let o = S.prefs; ks.slice(0, -1).forEach(k => { o = o[k] = o[k] || {}; }); o[ks[ks.length - 1]] = v; afterPref(ks[0]); }
function togglePrefArr(key, v, on) { const a = new Set(S.prefs[key] || []); on ? a.add(v) : a.delete(v); S.prefs[key] = key === 'slots' ? Object.keys(SLOTS).filter(s => a.has(s)) : [...a]; if (key === 'slots' && !S.prefs.slots.length) S.prefs.slots = ['soir']; afterPref(key); }
function afterPref(k) { save('prefs'); applyTheme(); applyLook(); if (['allergies', 'diet'].includes(k)) writeMember(); habitsCache = null; flashSaved(); render(); }
function flashSaved() { const el = $('#savedFlash'); if (!el) return; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 1400); }
function applyLook() { const r = document.documentElement, p = S.prefs; r.style.setProperty('--z', p.fontScale || 1); r.classList.toggle('noanim', p.anim === false); r.classList.toggle('layout-list', p.layout === 'list'); }
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.p) { const v = t.type === 'checkbox' ? t.checked : (t.type === 'number' || t.type === 'range' || t.dataset.num) ? (+t.value || 0) : t.value; setPref(t.dataset.p, v); }
  else if (t.dataset.parr) togglePrefArr(t.dataset.parr, t.value, t.checked);
  else if (t.dataset.gopt) { UI.gen[t.dataset.gopt] = t.type === 'checkbox' ? t.checked : t.dataset.num ? (t.value === '' ? '' : +t.value) : t.value; render(); }
  else if (t.id === 'recQ' && S.prefs.saveSearch && t.value.trim().length > 1) { S.searches = [t.value.trim(), ...S.searches.filter(x => x !== t.value.trim())].slice(0, 20); save('searches'); }
  else if (t.dataset.repl != null) replaceIng(+t.dataset.repl, t.value.trim());
  else if (t.dataset.shopf) { const it = S.shopping.find(x => x.id === UI.shopEdit); if (!it) return; const k = t.dataset.shopf; it[k] = k === 'qty' ? Math.max(0, parseFloat(t.value) || 0) : t.value.trim(); if (k === 'brand' && it.brand) S.prefs.brands[norm(it.name)] = it.brand; if (k === 'name') it.cat = guessCat(it.name); save('shopping', 'prefs'); render(); }
  else if (t.dataset.scan) { UI.scanOpts[t.dataset.scan] = t.type === 'checkbox' ? t.checked : t.value; render(); }
});
const chk = (path, lab, v) => `<label class="check"><input type="checkbox" data-p="${path}" ${v ? 'checked' : ''}> ${lab}</label>`;
const pselect = (path, lab, pairs, v, num) => `<label class="fld"><span>${lab}</span><select data-p="${path}" ${num ? 'data-num="1"' : ''}>${opt(pairs, v)}</select></label>`;
const ptext = (path, lab, v, ph = '') => `<label class="fld wide"><span>${lab}</span><input data-p="${path}" value="${esc(v)}" placeholder="${esc(ph)}"></label>`;
const pchips = (key, pairs, arr) => `<div class="chips">${pairs.map(([k, l]) => `<label class="chip tog"><input type="checkbox" data-parr="${key}" value="${esc(k)}" ${arr.includes(k) ? 'checked' : ''}>${esc(l)}</label>`).join('')}</div>`;

/* ----- Accueil : notifications, modes, recommandations ----- */
const ND = () => { try { return JSON.parse(localStorage.getItem('tambouille-notif') || '{}'); } catch { return {}; } };
function notifItems() {
  const N = S.prefs.notif, out = [], T = todayISO(), h = new Date().getHours();
  if (N.expiry) { const w = watchList(); if (w.length) out.push({ k: 'expiry', i: 'bell', t: `${pl(w.length, 'aliment')} à consommer ou vérifier`, a: ['go', 'inventaire', 'watch'] }); }
  if (N.meals) { const p = S.plan[T] || {}; const next = (h < 10 ? ['petitdej', 'midi', 'soir'] : h < 14 ? ['midi', 'soir'] : ['soir']).map(s => [s, p[s]]).find(x => x[1] && x[1] !== 'libre'); if (next) { const r = getR(next[1]); if (r) out.push({ k: 'meal', i: 'cal', t: `${SLOTS[next[0]]} : ${r.title}`, a: ['openRecipe', r.id] }); } }
  if (N.plan) { const tm = addDays(T, 1); if (!Object.keys(S.plan[tm] || {}).length) out.push({ k: 'plan', i: 'cal', t: 'Rien de prévu demain', a: ['go', 'planning'] }); }
  if (N.shop) { const n = S.shopping.filter(s => !s.done).length, last = S.shopLists[0]?.date; if (n && (!last || diffDays(T, last) >= 4)) out.push({ k: 'shop', i: 'cart', t: `${pl(n, 'article')} sur la liste de courses`, a: ['go', 'courses'] }); }
  if (N.daily) { const s = scoredList({ maxTime: 45, equipOnly: true }).filter(x => x.r.meal === 'plat').sort((a, b) => b.a.score - a.a.score)[0]; if (s) out.push({ k: 'daily', i: 'spark', t: `Idée du jour : ${s.r.title}`, a: ['openRecipe', s.r.id] }); }
  return out;
}
function notifHidden() { const d = ND().hidden; if (!d) return false; const f = S.prefs.notif.freq; if (f === 'always') return false; return diffDays(todayISO(), d) < (f === 'weekly' ? 7 : 1); }
W.notifs = () => {
  if (notifHidden()) return ''; const it = notifItems(); if (!it.length) return '';
  return `<section class="block notifc"><div class="bhead"><h2>${ic('bell')}Aujourd’hui</h2><button class="link" data-act="hideNotifs">Masquer</button></div><ul>${it.map(n => `<li><button data-act="${n.a[0]}" ${n.a[0] === 'go' ? `data-r="${n.a[1]}"${n.a[2] ? ` data-inv="${n.a[2]}"` : ''}` : `data-id="${esc(n.a[1])}"`}>${ic(n.i)}<span>${esc(n.t)}</span>${ic('right')}</button></li>`).join('')}</ul></section>`;
};
W.tonight = () => `<div class="tonightrow"><button class="tonight" data-act="tonight">${ic('spark')}<span>Qu’est-ce qu’on mange ce soir&nbsp;?</span></button><button class="btn ghost wheelbtn" data-act="surprise">${ic('star')}Surprends-moi</button><button class="btn ghost wheelbtn" data-act="wheel">${ic('wheel')}La roue</button></div>`;
W.modes = () => `<section class="block"><div class="bhead"><h2>${ic('chef')}Modes de cuisine</h2>${UI.cmode ? `<button class="link" data-act="cmodeOff">Quitter le mode ${esc(COOK_MODES[UI.cmode].l)}</button>` : ''}</div>
  <div class="modes">${Object.entries(COOK_MODES).map(([k, m]) => `<button class="mode-b ${UI.cmode === k ? 'on' : ''}" data-act="cmode" data-k="${k}">${ic(m.i)}<b>${m.l}</b><small>${m.d}</small></button>`).join('')}</div>
  <div class="row wrap minis"><span class="muted-t">Menu selon la météo :</span>${Object.keys(WEATHER).map(w => `<button class="chip btnchip" data-act="weather" data-w="${w}">${{ chaud: 'Il fait chaud', froid: 'Il fait froid', pluie: 'Il pleut', doux: 'Temps doux' }[w]}</button>`).join('')}<button class="chip btnchip" data-act="leftovers">${ic('refresh')}Utiliser mes restes</button></div></section>`;
W.reco = () => {
  const hb = habits(); if (!hb.cuisines.length) return '';
  const recent = new Set(S.hist.slice(0, 10).map(h => h.rid));
  const l = scoredList({ equipOnly: true }, 'all', { noCmode: true }).filter(x => hb.cuisines.includes(x.r.cuisine) && !recent.has(x.r.id) && x.r.meal === 'plat').sort((a, b) => b.a.score - a.a.score).slice(0, 3);
  return l.length ? `<section class="block"><div class="bhead"><h2>${ic('heart')}Parce que vous aimez la cuisine ${esc(hb.cuisines.join(' et ').toLowerCase())}</h2></div><div class="grid g3">${l.map(recipeCard).join('')}</div></section>` : '';
};

/* ----- Recettes : bandeau de mode, options de génération, comparateur ----- */
function cmodeBanner() { const m = UI.cmode && COOK_MODES[UI.cmode]; return m ? `<div class="cmode">${ic(m.i)}<div><b>Mode ${esc(m.l)}</b><span>${esc(m.d)} · la liste et l’IA en tiennent compte</span></div><button class="btn sm accent" data-act="genAI">${ic('spark')}Générer</button><button class="icon sm" data-act="cmodeOff" aria-label="Quitter le mode">${ic('x')}</button></div>` : ''; }
function genAdvanced() {
  const G = UI.gen, gs = (k, lab, pairs, num) => `<label class="fld"><span>${lab}</span><select data-gopt="${k}" ${num ? 'data-num="1"' : ''}>${opt(pairs, G[k])}</select></label>`;
  return `<details class="advopts" id="genDet"${dopen('genDet')}><summary>${ic('sliders')}Options de génération</summary><div class="filters flat">
    ${gs('count', 'Nombre de recettes', [[0, `Par défaut (${S.prefs.ai.count})`], [3, '3'], [5, '5'], [10, '10'], [1, '1']], 1)}
    ${gs('servings', 'Personnes', [[0, `Par défaut (${servings()})`], ...[1, 2, 3, 4, 6, 8, 10].map(n => [n, String(n)])], 1)}
    ${gs('maxTime', 'Temps max', [[0, 'Indifférent'], ...[5, 10, 15, 30, 45, 60].map(n => [n, n + ' min'])], 1)}
    ${gs('budget', 'Budget / portion', [[0, 'Indifférent'], [1, '≤ 1 €'], [1.5, '≤ 1,50 €'], [2.5, '≤ 2,50 €'], [4, '≤ 4 €']], 1)}
    ${gs('diff', 'Difficulté', [[0, 'Indifférent'], [1, 'Facile'], [2, 'Moyenne'], [3, 'Difficile']], 1)}
    ${gs('maxMissing', 'Ingrédients à acheter', [[0, 'Aucun'], [1, '1 max.'], [2, '2 max.'], [3, '3 max.'], [5, '5 max.']], 1)}
    ${gs('complexity', 'Complexité', [['', 'Indifférent'], ['simple', 'Simple'], ['elabore', 'Élaborée']])}
    ${gs('portions', 'Portions', [['', 'Classiques'], ['individuelle', 'Individuelles'], ['familiale', 'Familiales']])}
    ${gs('temp', 'Température', [['', 'Indifférent'], ['chaud', 'Chaud'], ['froid', 'Froid']])}
    ${gs('type', 'Composition', [['', 'Indifférent'], ['complet', 'Plat complet'], ['accompagnement', 'Accompagnement']])}
    ${gs('tradition', 'Style', [['', 'Indifférent'], ['traditionnelle', 'Traditionnel'], ['originale', 'Original']])}
    ${gs('weather', 'Météo', [['', 'Non précisée'], ['chaud', 'Chaud'], ['froid', 'Froid'], ['pluie', 'Pluie'], ['doux', 'Doux']])}
    <label class="check"><input type="checkbox" data-gopt="prioritize" ${G.prioritize !== false ? 'checked' : ''}> Priorité aux aliments à terminer</label>
  </div></details>`;
}
function recentSearches() { if (UI.F.q || !S.searches.length || !S.prefs.saveSearch) return ''; return `<div class="row wrap minis"><span class="muted-t">Récentes :</span>${S.searches.slice(0, 6).map(q => `<button class="chip btnchip" data-act="searchQ" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>`; }
UI.compare = []; UI.scanOpts = { space: '', cat: '', replace: false }; UI.ptab = 'culinaire'; UI.ntab = 'jour'; UI.ctab = 'liste';
function compareTray() { if (!UI.compare.length) return ''; return `<div class="ctray">${ic('swap')}<span>Comparateur : ${UI.compare.map(id => esc(getR(id)?.title || '')).join(' · ')}</span><button class="btn sm accent" data-act="openCompare" ${UI.compare.length < 2 ? 'disabled' : ''}>Comparer</button><button class="icon sm" data-act="clearCompare" aria-label="Vider le comparateur">${ic('x')}</button></div>`; }
function compareSheet(ids) {
  const P = effPrefs(), rs = ids.map(getR).filter(Boolean).map(r => ({ r, a: analyze(r, S.pantry, servings(), P.staples), cost: recipeCost(r, servings()) }));
  const rows = [['Temps', x => x.r.time + ' min', x => x.r.time], ['Difficulté', x => ['', 'Facile', 'Moyen', 'Difficile'][x.r.diff], x => x.r.diff], ['Coût / pers.', x => euro(x.cost / servings()), x => x.cost], ['Calories', x => x.r.kcal + ' kcal', x => x.r.kcal], ['Protéines', x => x.r.prot + ' g', x => -x.r.prot], ['Glucides', x => x.r.carbs + ' g', null], ['Lipides', x => x.r.fat + ' g', x => x.r.fat], ['Fibres', x => x.r.fiber + ' g', x => -x.r.fiber], ['Disponible', x => x.a.pct + ' %', x => -x.a.pct], ['À acheter', x => x.a.missing.map(l => l.ing.n).join(', ') || '—', x => x.a.missing.length], ['Cuisine', x => x.r.cuisine, null]];
  openSheet(() => `${shead('Comparateur')}<div class="cmpwrap"><table class="cmp"><thead><tr><th></th>${rs.map(x => `<th><button class="link" data-act="openRecipe" data-id="${x.r.id}">${esc(x.r.title)}</button></th>`).join('')}</tr></thead><tbody>${rows.map(([l, f, best]) => { const vals = best ? rs.map(best) : []; const mn = Math.min(...vals); return `<tr><th>${l}</th>${rs.map((x, i) => `<td class="${best && vals[i] === mn && rs.length > 1 ? 'best' : ''}">${esc(f(x))}</td>`).join('')}</tr>`; }).join('')}</tbody></table></div><p class="fine">Valeurs par portion, estimées. En vert : la meilleure valeur de la ligne.</p>`, 'tall');
}

/* ----- Adaptations d'une recette ----- */
const ADAPT = { cost: 'réduis nettement le coût (ingrédients moins chers, même esprit)', kcal: 'réduis les calories d’au moins 25 % sans perdre le goût', prot: 'augmente les protéines d’au moins 50 %', simple: 'simplifie la préparation : moins d’étapes, d’ingrédients et d’ustensiles', fast: 'raccourcis nettement le temps total', vege: 'transforme-la en version végétarienne (aucune viande ni poisson)', lactose: 'transforme-la en version sans lactose (aucun produit laitier contenant du lactose)', gluten: 'transforme-la en version sans gluten', variant: 'propose une variante différente mais dans le même esprit', appliance: 'adapte-la à l’appareil suivant :' };
const ADAPT_L = { cost: 'Moins cher', kcal: 'Moins calorique', prot: 'Plus de protéines', simple: 'Plus simple', fast: 'Plus rapide', vege: 'Végétarienne', lactose: 'Sans lactose', gluten: 'Sans gluten', variant: 'Une variante' };
function recipeOptions(r) {
  const fam = allRecipes().filter(x => x.id !== r.id && (x.parent === r.id || (r.parent && (x.id === r.parent || x.parent === r.parent))));
  const eq = S.prefs.equipment.filter(e => e !== 'plaques');
  return `<details class="ropts" id="roptsDet"${dopen('roptsDet')}><summary>${ic('edit')}Adapter cette recette</summary>
    <div class="row wrap"><button class="btn ghost sm" data-act="servMul" data-k="2">× 2 quantités</button><button class="btn ghost sm" data-act="servMul" data-k="0.5">÷ 2 quantités</button></div>
    <p class="fine">Avec l’IA (une nouvelle version est enregistrée, l’originale est conservée) :</p>
    <div class="chips">${Object.entries(ADAPT_L).map(([k, l]) => `<button class="chip btnchip" data-act="adapt" data-k="${k}" ${UI.aiBusy ? 'disabled' : ''}>${l}</button>`).join('')}</div>
    ${eq.length ? `<div class="row wrap"><label class="fld"><span>Adapter à un appareil</span><select id="adEq">${opt(eq.map(e => [e, EQUIP[e]]), eq.includes('airfryer') ? 'airfryer' : eq[0])}</select></label><button class="btn ghost sm" data-act="adapt" data-k="appliance">${ic('spark')}Adapter</button></div>` : ''}
    ${UI.aiBusy ? '<p class="muted-t"><span class="spin"></span> Adaptation en cours…</p>' : ''}
    <p class="fine">Modifier les ingrédients (crée « ma version » d’une recette de base) :</p>
    <ul class="ingedit">${r.ingr.map((g, i) => `<li><span>${esc(fmtQty(g.q, g.u))} ${esc(g.n)}</span><input list="subs${i}" data-repl="${i}" placeholder="Remplacer par…" aria-label="Remplacer ${esc(g.n)}"><datalist id="subs${i}">${(SUBS[norm(g.n)] || []).map(x => `<option value="${esc(x)}">`).join('')}</datalist><button class="icon xs" data-act="remIng" data-i="${i}" aria-label="Supprimer ${esc(g.n)}">${ic('trash')}</button></li>`).join('')}</ul>
    ${fam.length ? `<div class="row wrap"><span class="muted-t">${pl(fam.length, 'autre version', 'autres versions')} :</span>${fam.map(x => `<button class="chip btnchip" data-act="openRecipe" data-id="${x.id}">${esc(x.title)}</button>`).join('')}<button class="btn ghost sm" data-act="compareFam">${ic('swap')}Comparer les versions</button></div>` : ''}
  </details>`;
}
function myVersion(r) {
  if (r.src === 'perso' && S.ai.some(x => x.id === r.id)) return r;
  const c = JSON.parse(JSON.stringify(r)); c.id = 'p-' + uid(); c.src = 'perso'; c.parent = r.parent || r.id; c.title = r.title.replace(/ \(ma version\)$/, '') + ' (ma version)'; c.created = Date.now(); c._n = 1;
  S.ai.unshift(c); return c;
}
function replaceIng(i, v) {
  if (!v || !curR) return; const r = myVersion(curR), old = r.ingr[i].n;
  r.ingr[i] = { ...r.ingr[i], n: v }; r.steps = r.steps.map(s => s.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), v));
  save('ai'); curR = r; UI.opened.add('roptsDet'); refreshSheet(); render(); toast(`${old} remplacé par ${v}.`);
}
async function adaptRecipe(k) {
  if (!(await AI.ready())) return; const r = curR, P = effPrefs();
  const extra = k === 'appliance' ? ' ' + EQUIP[$('#adEq')?.value || 'airfryer'] + ' (temps et températures adaptés)' : '';
  UI.aiBusy = true; UI.opened.add('roptsDet'); refreshSheet();
  const src = { title: r.title, servings: r.servings, ingredients: r.ingr.map(i => ({ name: i.n, qty: i.q, unit: i.u, optional: i.opt })), steps: r.steps, cuisine: r.cuisine, meal: r.meal };
  try {
    const out = await AI.json(`Voici une recette au format JSON : ${JSON.stringify(src)}\nConsigne : ${ADAPT[k]}${extra}.\nContraintes : ${P.allergies.length ? `aucun ingrédient contenant ${P.allergies.map(a => ALLERGENS[a]).join(', ')} ; ` : ''}matériel disponible : ${P.equipment.map(e => EQUIP[e]).join(', ')}. Valeurs nutritionnelles estimées par portion. Rédige en ${P.aiLang}. Donne un titre qui indique la version.\nRéponds UNIQUEMENT en JSON : ${RECIPE_SCHEMA}`);
    const n = sanitizeRecipe(out, 'ai'); if (!n) throw { code: 'invalid_json' };
    if (!passesFilters(n, {}, { allergies: P.allergies, diet: P.diet, banned: P.banned })) { UI.aiBusy = false; refreshSheet(); return toast('La version proposée contenait un ingrédient interdit : elle a été écartée.'); }
    n.parent = r.parent || r.id; S.ai.unshift(n); save('ai'); UI.aiBusy = false; UI.opened.delete('roptsDet');
    curR = n; curServ = n.servings; refreshSheet(); render(); toast(`Nouvelle version : ${n.title}.`, { act: 'compareFam', label: 'Comparer' });
  } catch (e) { UI.aiBusy = false; refreshSheet(); aiErr(e); }
}

/* ----- Génération IA (tous les réglages : profil, mode, options, IA) ----- */
async function genAI(extra = {}) {
  if (!(await AI.ready())) return [];
  const usable = S.pantry.filter(p => p.qty > 0 && safety(p).safe);
  if (!usable.length && !extra.leftovers) { toast('Ajoutez d’abord des aliments à votre inventaire.'); return []; }
  UI.aiBusy = true; render();
  const F = UI.F, P = effPrefs(), A = P.ai, cm = UI.cmode ? COOK_MODES[UI.cmode] : null;
  const G = { ...UI.gen, ...Object.fromEntries(Object.entries(cm?.gen || {}).filter(([k]) => !(k in UI.gen) || !UI.gen[k] || k === 'mode' || k === 'meal')), ...extra };
  const n = Math.max(1, Math.min(12, +G.count || +A.count || 3)), serv = +G.servings || servings();
  const maxT = +G.maxTime || +F.maxTime || +P.maxTime || 0, diff = +G.diff || +F.diff || +P.maxDiff || 0, budget = +G.budget || +F.maxCost || 0;
  const stockOnly = G.mode === 'stock' || +G.maxMissing === 0;
  const stock = [...usable].sort((a, b) => (daysLeft(effExp(a)) ?? 999) - (daysLeft(effExp(b)) ?? 999)).slice(0, 70).map(x => `${x.name} | ${fmtQty(x.qty, x.unit) || x.qty} | ${daysLeft(effExp(x)) ?? '?'} j${x.state !== 'neuf' ? ' | ouvert' : ''}${safety(x).level === 'ddm' ? ' | DDM dépassée' : ''}`).join('\n');
  const prompt = [
    `Tu es un chef ${A.creativity === 'haute' || extra.creative ? 'créatif et audacieux' : A.creativity === 'basse' ? 'classique, qui privilégie les valeurs sûres' : 'pragmatique'}. Propose ${n} recette${n > 1 ? 's différentes et réalisables' : ' réalisable'}${G.meal ? ` de type « ${MEALS[G.meal]} »` : ''}.`,
    G.prompt || '', cm?.gen?.style ? `MODE : ${cm.gen.style}.` : '', G.style && G.style !== cm?.gen?.style ? `ENVIE : ${G.style}.` : '',
    G.cuisine ? `CUISINE : ${G.cuisine}.` : P.cuisinesFav.length ? `Cuisines préférées (à privilégier) : ${P.cuisinesFav.join(', ')}.` : '',
    extra.leftovers ? `RESTES À UTILISER EN PRIORITÉ ABSOLUE (déjà cuits pour certains) : ${extra.leftovers}.` : '',
    G.weather ? `MÉTÉO indiquée : ${WEATHER[G.weather]}.` : '',
    usable.length ? `INVENTAIRE (nom | quantité | jours avant péremption) :\n${stock}` : 'INVENTAIRE : vide.',
    `BASIQUES toujours disponibles : ${P.staples}.`,
    stockOnly ? 'ACHATS : aucun. Utilise uniquement l’inventaire et les basiques, sans dépasser les quantités.' : `ACHATS : au maximum ${G.maxMissing ?? 3} ingrédient(s) à acheter par recette ; le reste vient de l’inventaire.`,
    G.prioritize !== false ? 'ANTI-GASPILLAGE : utilise en priorité les aliments qui périment dans 3 jours ou moins et les produits ouverts.' : '',
    `MATÉRIEL disponible uniquement : ${P.equipment.map(e => EQUIP[e]).join(', ')}. Adapte les cuissons à ce matériel et tire parti des appareils spécifiques présents (air fryer, Cookeo, Thermomix, etc.).`,
    `CONTRAINTES : ${serv} personnes${G.portions === 'individuelle' ? ' en portions individuelles' : G.portions === 'familiale' ? ' en grand plat familial à partager' : ''}${maxT ? `, ${maxT} min maximum au total` : ''}${diff ? `, difficulté ≤ ${diff}/3` : ''}${budget ? `, ≤ ${budget} € par portion` : ''}${F.maxKcal ? `, ≤ ${F.maxKcal} kcal par portion` : ''}${F.minProt ? `, ≥ ${F.minProt} g de protéines par portion` : ''}${F.must ? `, doit contenir : ${F.must}` : ''}${P.diet ? `, régime ${DIETS[P.diet]}` : ''}.`,
    P.allergies.length ? `ALLERGIES STRICTES, aucun ingrédient contenant : ${P.allergies.map(a => ALLERGENS[a]).join(', ')}.` : '',
    [P.dislikes, P.banned, F.ban].filter(Boolean).length ? `INTERDITS : ${[P.dislikes, P.banned, F.ban].filter(Boolean).join(', ')}.` : '',
    G.temp ? `Plats servis ${G.temp === 'chaud' ? 'chauds' : 'froids'}.` : '', G.type === 'complet' ? 'Plats complets (protéine + féculent + légume).' : G.type === 'accompagnement' ? 'Ce sont des accompagnements.' : '',
    G.complexity === 'simple' ? 'Recettes simples, peu d’étapes.' : G.complexity === 'elabore' ? 'Recettes élaborées, techniques soignées.' : '',
    G.tradition === 'traditionnelle' ? 'Recettes traditionnelles et éprouvées.' : G.tradition === 'originale' ? 'Recettes originales et inattendues.' : '',
    A.experimental ? 'Les associations expérimentales sont autorisées.' : 'Évite les associations expérimentales.',
    `PRIORITÉ : ${PRIORITY[A.priority] || PRIORITY.equilibre}.`,
    `NIVEAU : ${{ debutant: 'débutant, explique chaque geste simplement', normal: 'intermédiaire', expert: 'expert, étapes condensées et techniques avancées' }[P.level] || 'intermédiaire'}.`,
    P.likes ? `AIME : ${P.likes}.` : '', P.memory ? `GOÛTS : ${P.memory}` : '',
    `Rédige en ${P.aiLang}. Écris les noms d'ingrédients exactement comme dans l'inventaire quand ils en viennent. Valeurs nutritionnelles estimées par portion. Quantités pour ${serv} personnes.`,
    `Réponds UNIQUEMENT en JSON : {"recipes":[${RECIPE_SCHEMA}]}`,
  ].filter(Boolean).join('\n');
  let rs = [];
  try {
    window.__lastPrompt = prompt; const out = await AI.json(prompt, { cache: !extra.creative });
    const all = (out?.recipes || []).map(x => sanitizeRecipe(x, 'ai')).filter(Boolean);
    rs = all.filter(r => passesFilters(r, {}, { allergies: P.allergies, diet: P.diet, banned: P.banned }));
    if (!rs.length) throw { code: 'invalid_json' };
    S.ai = [...rs, ...S.ai].slice(0, 120); save('ai'); UI.mode = 'all';
    toast(`${pl(rs.length, 'recette')} créée${rs.length > 1 ? 's' : ''}${all.length > rs.length ? ` (${all.length - rs.length} écartée${all.length - rs.length > 1 ? 's' : ''} : allergène, régime ou ingrédient interdit)` : ''}.`);
  } catch (e) { aiErr(e); }
  UI.aiBusy = false; render();
  if (extra.open && rs[0]) openRecipe(rs[0].id);
  return rs;
}
async function surprise() {
  const h = await AI.h();
  if (!h) { const l = scoredList({ equipOnly: true }, 'all', { noCmode: true }).filter(x => x.r.meal === 'plat'); const x = l[Math.floor(Math.random() * l.length)]; return x && openRecipe(x.r.id); }
  toast('L’IA vous prépare une surprise…'); genAI({ count: 1, style: 'totalement libre et surprenante, mais réalisable ce soir', creative: true, open: true });
}

/* ----- Scanner ----- */
VIEWS.scanner = () => {
  const tile = (act, icon, t, d, extra = '') => `<button class="stile" data-act="${act}" ${extra}><span class="sic">${ic(icon)}</span><b>${t}</b><em>${d}</em></button>`, O = UI.scanOpts, P = S.prefs;
  return `<div class="vhead"><h1>Scanner</h1><p>Photo, voix ou clavier. ${P.scanAuto ? 'Les aliments sûrs sont ajoutés directement ; les incertains vous sont soumis.' : 'Rien n’est enregistré sans votre validation.'}</p></div>
  <details class="advopts" id="scanDet"${dopen('scanDet')}><summary>${ic('sliders')}Options du scan</summary><div class="filters flat">
    <label class="fld"><span>Zone photographiée</span><select data-scan="space">${opt([['', 'Indifférent'], ...S.spaces.map(s => [s.id, s.name])], O.space)}</select></label>
    <label class="fld"><span>Ne scanner qu’une catégorie</span><select data-scan="cat">${opt([['', 'Toutes'], ...CAT_ORDER.map(c => [c, CATS[c].label])], O.cat)}</select></label>
    <label class="check"><input type="checkbox" data-scan="replace" ${O.replace ? 'checked' : ''} ${O.cat && O.space ? '' : 'disabled'}> Remplacer le stock de cette catégorie dans cette zone</label>
    <label class="fld"><span>Confiance minimale (${Math.round(P.scanConf * 100)} %)</span><input type="range" min="0.5" max="0.95" step="0.05" data-p="scanConf" value="${P.scanConf}"></label>
    ${chk('scanAuto', 'Ajouter automatiquement les aliments sûrs', P.scanAuto)}
  </div></details>
  <div class="stiles">
    ${tile('pick', 'camera', O.space ? 'Scanner : ' + esc(spaceName(O.space)) : 'Frigo, placard, courses', 'Une ou plusieurs photos ; les doublons entre photos sont fusionnés.', 'data-k="scan"')}
    ${tile('pick', 'barcode', 'Étiquette ou code-barres', 'Nom, marque, DLC ou DDM, valeurs nutritionnelles.', 'data-k="barcode"')}
    ${tile('voice', 'mic', 'Dicter', 'Ex. « six œufs, un litre de lait et deux courgettes ».')}
    ${tile('manual', 'edit', 'Fiche détaillée', 'Quantité, dates, état, marque, valeurs nutritionnelles, photo.')}
    ${tile('pick', 'spark', 'Photo → recettes', 'Photographiez vos ingrédients, puis l’IA propose des recettes.', 'data-k="gen"')}
    ${tile('pick', 'chef', 'Reconnaître un plat', 'L’IA identifie le plat et donne une recette proche.', 'data-k="dish"')}
  </div>
  <form class="addbar" data-form="quickAdd"><label class="sr" for="quickAdd">Ajouter des aliments</label><input id="quickAdd" name="t" autocomplete="off" placeholder="Ex. 6 œufs, 500 g de farine, lait 1 l"><button class="btn" type="submit">${ic('plus')}<span>Ajouter</span></button></form>
  ${S.scans.length ? `<div class="bhead"><h3>Historique des scans</h3><button class="link danger" data-act="clearScans">Effacer</button></div><ul class="hist">${S.scans.slice(0, 15).map(s => `<li><button data-act="go" data-r="inventaire"><span><small>${{ scan: 'Photo', barcode: 'Étiquette', gen: 'Photo → recettes' }[s.kind] || s.kind}${s.space ? ' · ' + esc(spaceName(s.space)) : ''}${s.cat ? ' · ' + esc(CATS[s.cat]?.label || '') : ''}</small>${esc(s.names.slice(0, 5).join(', '))}${s.names.length > 5 ? '…' : ''}</span><em>${new Date(s.t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · ${s.added}/${s.found}</em></button></li>`).join('')}</ul>` : ''}`;
};
async function scanImages(files, kind) {
  if (!(await AI.ready())) return;
  if (!(await AI.images())) return toast('L’analyse de photos n’est pas disponible pour ce compte.');
  const n = Math.min(files.length, 6), O = { ...UI.scanOpts }, th = S.prefs.scanConf || 0.7;
  openSheet(() => `${shead('Analyse en cours')}<div class="loading"><span class="spin big"></span><p>${kind === 'dish' ? 'Reconnaissance du plat…' : kind === 'barcode' ? 'Lecture de l’emballage…' : `Identification des aliments sur ${pl(n, 'photo')}…`}</p></div>`);
  try {
    const imgs = await Promise.all([...files].slice(0, 6).map(f => compress(f)));
    if (kind === 'dish') return dishFromPhoto(imgs);
    let code = '';
    if (kind === 'barcode' && 'BarcodeDetector' in window) { try { const r = await new window.BarcodeDetector().detect(await createImageBitmap(imgs[0])); code = r[0]?.rawValue || ''; } catch {} }
    const zone = O.space ? ` La photo montre : ${spaceName(O.space)} (${SPACE_KINDS[spaceKind(O.space)]}).` : '', only = O.cat ? ` Ne liste QUE les produits de la catégorie « ${CATS[O.cat].label} ».` : '';
    const prompt = kind === 'barcode'
      ? `Photo d'un produit alimentaire emballé${code ? ` (code-barres lu : ${code})` : ''}. Lis l'étiquette : nom du produit, marque, quantité nette, date (DLC « à consommer jusqu'au » ou DDM « à consommer de préférence avant ») et tableau nutritionnel pour 100 g s'il est visible. N'invente rien d'illisible : mets null. Aujourd'hui : ${todayISO()}. Réponds uniquement en JSON : ${ITEM_SCHEMA}`
      : `${n > 1 ? `${n} photos` : 'Une photo'} d'aliments.${zone}${only} Liste chaque aliment identifiable avec une quantité estimée réaliste. Un même produit visible sur plusieurs photos ne doit apparaître qu'une fois. Lis les étiquettes, marques et dates quand c'est possible. Ignore les contenants vides et ce qui n'est pas comestible. Mets confidence < ${th} dès que tu as un doute sur la nature du produit. Aujourd'hui : ${todayISO()}. Réponds uniquement en JSON : ${ITEM_SCHEMA}`;
    const out = await AI.json(prompt, { images: imgs });
    let items = (out?.items || []).filter(x => x && x.name).slice(0, 60).map(x => {
      const conf = Math.max(0, Math.min(1, Number(x.confidence ?? 0.8)));
      const nu = x.nutri && typeof x.nutri === 'object' ? Object.fromEntries(['kcal', 'p', 'c', 'f'].map(k => [k, Number(x.nutri[k]) || 0])) : null;
      const exp = /^\d{4}-\d{2}-\d{2}$/.test(x.exp || '') ? x.exp : null;
      const loc = O.space || S.spaces.find(s => s.kind === x.loc)?.id;
      return { ...makeItem({ ...x, cat: O.cat || x.cat, exp, loc, nutri: nu, uncertain: conf < th, expType: exp ? (x.expType === 'DDM' ? 'DDM' : x.expType === 'DLC' ? 'DLC' : null) : 'est' }), confidence: conf, keep: conf >= th };
    });
    items = mergeDupes(items).map(it => ({ ...it, uncertain: it.confidence < th, keep: it.confidence >= th }));
    if (!items.length) { closeSheet(); return toast('Aucun aliment reconnu. Essayez une photo plus nette et mieux éclairée.'); }
    UI.lastScan = { t: Date.now(), kind, space: O.space, cat: O.cat, replace: O.replace && O.cat && O.space, found: items.length, names: items.map(i => i.name) };
    UI.afterReview = kind === 'gen' ? 'gen' : null;
    if (S.prefs.scanAuto && kind !== 'gen') {
      const sure = items.filter(i => !i.uncertain), unsure = items.filter(i => i.uncertain);
      if (sure.length) { applyScan(sure); toast(`${pl(sure.length, 'aliment')} ajouté${sure.length > 1 ? 's' : ''} automatiquement.`); }
      if (unsure.length) return reviewItems(unsure, `${pl(unsure.length, 'aliment incertain', 'aliments incertains')} à vérifier`, 'scan');
      return closeSheet();
    }
    reviewItems(items, kind === 'barcode' ? 'Produit reconnu' : `${pl(items.length, 'aliment')} reconnu${items.length > 1 ? 's' : ''}`, 'scan');
  } catch (e) { closeSheet(); aiErr(e); }
}
/* Enregistre les aliments scannés + historique + remplacement éventuel d'une catégorie */
function applyScan(its) {
  const L = UI.lastScan;
  if (L?.replace) { S.pantry.filter(p => p.loc === L.space && p.cat === L.cat && p.qty > 0 && !its.some(i => nameMatches(i.name, p.name) || nameMatches(p.name, i.name))).forEach(p => { logMove('edit', p, 0, 'absent du nouveau scan'); p.qty = 0; }); }
  addItems(its, 'scan');
  if (L) { S.scans.unshift({ ...L, added: (S.scans[0]?.t === L.t ? S.scans.shift().added : 0) + its.length }); S.scans = S.scans.slice(0, 40); save('scans'); }
}
ACT.confirmReview = () => {
  const its = UI.review.filter(x => x.keep && x.name).map(({ keep, confidence, dup, ...x }) => ({ ...x, qty: Number(x.qty) || 1, uncertain: !!x.uncertain }));
  if (!its.length) return toast('Cochez au moins un aliment.');
  if (UI.reviewNote === 'scan') applyScan(its); else addItems(its, UI.reviewNote);
  UI.lastScan = null; closeSheet(); const nu = its.filter(x => x.uncertain).length;
  toast(`${pl(its.length, 'aliment')} ajouté${its.length > 1 ? 's' : ''}${nu ? `, dont ${nu} à vérifier` : ''}.`);
  if (UI.afterReview === 'gen') { UI.afterReview = null; UI.gen.mode = 'stock'; go('recettes'); genAI(); }
};

/* ----- Mode cuisine ----- */
const COOK_FS = ['s', 'm', 'l', 'xl'];
function ingrUsed(r, ck) {
  const txt = norm([...ck.done].map(j => ck.over[j] || r.steps[j]).join(' '));
  return new Set(r.ingr.map((g, j) => { const w = norm(g.n).split(' ').find(x => x.length > 2); return w && (' ' + txt + ' ').includes(' ' + w) ? j : -1; }).filter(j => j >= 0));
}
function renderCook() {
  const { r, serv, i } = cook, k = serv / r.servings, step = cook.over[i] || r.steps[i], tms = stepTimers(step), used = ingrUsed(r, cook), lvl = S.prefs.level;
  const el = $('#cook'); el.className = 'cfs-' + (S.prefs.cookFont || 'm');
  el.innerHTML = `<div class="ctop"><button class="icon" data-act="exitCook" aria-label="Quitter le mode cuisine">${ic('x')}</button><div class="ctitle"><b>${esc(r.title)}</b><span>Étape ${i + 1} sur ${r.steps.length}${cook.skipped.size ? ` · ${cook.skipped.size} passée${cook.skipped.size > 1 ? 's' : ''}` : ''}</span></div>${stepper('cookServ', serv, 'Portions')}</div>
  <div class="cprog">${r.steps.map((_, j) => `<button class="${cook.done.has(j) ? 'd' : ''} ${cook.skipped.has(j) ? 'sk' : ''} ${j === i ? 'c' : ''}" data-act="cookGo" data-i="${j}" aria-label="Étape ${j + 1}${cook.done.has(j) ? ', faite' : ''}"></button>`).join('')}</div>
  <div class="row wrap"><button class="btn ghost sm" data-act="toggleIngr" aria-expanded="${cook.ingr}">Ingrédients (${serv} pers.)</button><button class="btn ${cook.hands ? 'accent' : 'ghost'} sm" data-act="handsFree" aria-pressed="${cook.hands}">${ic('mic')}Mains libres</button><button class="btn ghost sm" data-act="speak">${ic('volume')}Lire</button><button class="btn ghost sm" data-act="cookList" aria-pressed="${cook.list}">${cook.list ? 'Une étape' : 'Toutes les étapes'}</button><button class="icon sm" data-act="cookFont" data-d="-1" aria-label="Texte plus petit">A-</button><button class="icon sm" data-act="cookFont" data-d="1" aria-label="Texte plus grand">A+</button></div>
  ${cook.ingr ? `<div class="cingr"><ul>${r.ingr.map((g, j) => `<li class="${used.has(j) ? 'used' : ''}"><b>${esc(fmtQty(g.q * k, g.u))}</b> ${esc(g.n)}${used.has(j) ? ' <em>utilisé</em>' : ''}</li>`).join('')}</ul><p class="fine">${r.ingr.length - used.size} ingrédient${r.ingr.length - used.size > 1 ? 's' : ''} restant${r.ingr.length - used.size > 1 ? 's' : ''} à utiliser.</p></div>` : ''}
  ${cook.list ? `<ol class="clist">${r.steps.map((s, j) => `<li class="${j === i ? 'cur' : ''} ${cook.done.has(j) ? 'd' : ''}"><button data-act="cookGo" data-i="${j}">${techify(cook.over[j] || s)}</button></li>`).join('')}</ol>` : `
  <div class="cstep"><p class="cnum">${String(i + 1).padStart(2, '0')}${cook.done.has(i) ? ' <small>faite</small>' : ''}${cook.over[i] ? ' <small class="alt">autre méthode</small>' : ''}</p><p class="ctext">${techify(step)}</p>
    ${cook.detail[i] ? `<div class="cdetail">${md(cook.detail[i])}</div>` : ''}
    ${tms.length ? `<div class="row wrap">${tms.map(t => `<button class="btn accent" data-act="timer" data-sec="${t.sec}" data-label="${esc(t.label)} · étape ${i + 1}">${ic('timer')}Minuteur ${esc(t.label)}</button>`).join('')}</div>` : ''}
    <div class="row wrap"><button class="btn ghost sm" data-act="customTimer">${ic('timer')}Minuteur libre</button>${lvl !== 'expert' && !cook.detail[i] ? `<button class="btn ghost sm" data-act="stepAI" data-k="detail" ${UI.aiBusy ? 'disabled' : ''}>${ic('info')}Détailler</button>` : ''}<button class="btn ghost sm" data-act="stepAI" data-k="alt" ${UI.aiBusy ? 'disabled' : ''}>${ic('refresh')}Autre méthode</button><button class="btn ghost sm" data-act="stuck">${ic('chat')}Je suis bloqué</button><button class="btn ghost sm" data-act="skipStep">Passer</button></div>
    ${UI.aiBusy ? '<p class="muted-t"><span class="spin"></span> Un instant…</p>' : ''}
    ${cook.hands ? `<p class="note">${ic('mic')}Dites « suivant », « précédent », « répète », « minuteur » ou « ingrédients ».</p>` : ''}
  </div>`}
  <div class="cnav"><button class="btn ghost big" data-act="cookPrev" ${i === 0 ? 'disabled' : ''}>${ic('left')}Précédent</button>${i < r.steps.length - 1 ? `<button class="btn accent big" data-act="cookNext">Étape faite${ic('right')}</button>` : `<button class="btn accent big" data-act="finishCook">${ic('check')}Terminé</button>`}</div>`;
  renderTimers();
}
function cookMove(d) { if (!cook) return; if (d > 0) cook.done.add(cook.i); cook.i = Math.max(0, Math.min(cook.r.steps.length - 1, cook.i + d)); renderCook(); if (cook.hands || S.prefs.cookAutoRead) speak(cook.over[cook.i] || cook.r.steps[cook.i]); }
async function stepAI(k) {
  if (!(await AI.ready())) return; const i = cook.i, r = cook.r, st = cook.over[i] || r.steps[i];
  UI.aiBusy = true; renderCook();
  try {
    const res = await AI.text(k === 'detail'
      ? `Recette « ${r.title} ». Explique à un débutant, en 3 à 5 points courts, comment réaliser cette étape, avec les repères visuels et les erreurs à éviter : « ${st} ». Réponds en ${S.prefs.aiLang}, sans introduction.`
      : `Recette « ${r.title} » (matériel : ${S.prefs.equipment.map(e => EQUIP[e]).join(', ')}). Propose une autre manière de réaliser cette étape, au même résultat, en une ou deux phrases avec les durées : « ${st} ». Réponds uniquement par la nouvelle étape, en ${S.prefs.aiLang}.`, { cache: true });
    if (k === 'detail') cook.detail[i] = res.text; else cook.over[i] = res.text.trim().replace(/^["«»\s]+|["«»\s]+$/g, '');
  } catch (e) { aiErr(e); }
  UI.aiBusy = false; if (cook) renderCook();
}
function notifyBrowser(title, body) { try { if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState !== 'visible') new Notification(title, { body, icon: '/icon.svg' }); } catch {} }

/* ----- Planning ----- */
function planOptions() {
  const P = S.prefs;
  return `<details class="advopts" id="planDet"${dopen('planDet')}><summary>${ic('sliders')}Réglages du planning</summary><div class="filters flat">
    ${pselect('planDays', 'Générer sur', [[1, '1 jour'], [7, '7 jours (semaine affichée)'], [14, '14 jours'], [30, '30 jours']], P.planDays, 1)}
    ${pselect('planRepeat', 'Pas de répétition pendant', [[3, '3 jours'], [7, '7 jours'], [14, '14 jours']], P.planRepeat, 1)}
    <label class="fld"><span>Budget par jour (€)</span><input type="number" min="0" step="1" data-p="budgetDay" value="${P.budgetDay || ''}" placeholder="Aucun"></label>
    <div class="fld wide"><span>Repas par jour</span>${pchips('slots', Object.entries(SLOTS), P.slots)}</div>
    ${chk('planAlternate', 'Alterner les cuisines', P.planAlternate)}
    ${chk('planAutoShop', 'Mettre à jour la liste de courses après génération', P.planAutoShop)}
    <button class="link danger" data-act="clearPlan">Vider les jours à venir de la semaine affichée</button>
  </div></details>`;
}

/* ----- Courses ----- */
VIEWS.courses = () => {
  const P = S.prefs, todo = S.shopping.filter(s => !s.done), done = S.shopping.filter(s => s.done), me = missingEssentials();
  const price = s => estPrice(s.name, s.qty || 1, s.unit || 'pc'), total = S.shopping.reduce((a, s) => a + price(s), 0);
  const tabs = `<div class="seg">${[['liste', 'Liste'], ['achats', 'Historique des achats']].map(([k, l]) => `<button aria-selected="${UI.ctab === k}" data-act="ctab" data-v="${k}">${l}</button>`).join('')}</div>`;
  if (UI.ctab === 'achats') {
    const byM = {}; S.shopLists.forEach(l => { const m = l.date.slice(0, 7); byM[m] = (byM[m] || 0) + l.total; });
    const cnt = {}; S.shopLists.forEach(l => l.items.forEach(i => { cnt[i.name] = (cnt[i.name] || 0) + 1; }));
    return `<div class="vhead"><h1>Courses</h1><p>${pl(S.shopLists.length, 'liste terminée', 'listes terminées')}</p></div>${tabs}
    ${Object.keys(byM).length ? `<div class="stats four">${Object.entries(byM).slice(0, 4).map(([m, v]) => `<div><b>${euro(v)}</b><span>${new Date(m + '-15').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} (estim.)</span></div>`).join('')}</div>` : ''}
    ${Object.keys(cnt).length ? `<h3 class="aisle">Achetés le plus souvent</h3><div class="chips">${Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([n, c]) => `<button class="chip btnchip" data-act="addEssential" data-n="${esc(n)}">${ic('plus')}${esc(n)} <em>${c}×</em></button>`).join('')}</div>` : ''}
    <ul class="hist">${S.shopLists.map(l => `<li><button data-act="openShopList" data-id="${l.id}"><span>${fmtDate(l.date, { weekday: 'short', day: 'numeric', month: 'short' })} · ${pl(l.items.length, 'article')}</span><em>${euro(l.total)}</em></button>${UI.openShopList === l.id ? `<div class="oldlist"><p>${l.items.map(i => esc(i.name)).join(', ')}</p><button class="btn ghost sm" data-act="reuseList" data-id="${l.id}">${ic('refresh')}Remettre dans la liste</button></div>` : ''}</li>`).join('') || `<li>${emptyState('Aucun achat enregistré.', 'Terminez une liste pour garder une trace de vos achats.')}</li>`}</ul>`;
  }
  const stores = P.stores.split(',').map(s => s.trim()).filter(Boolean);
  const row = s => `<li class="${s.done ? 'done' : ''}"><label><input type="checkbox" data-act="toggleShop" data-id="${s.id}" ${s.done ? 'checked' : ''}><span class="box">${ic('check')}</span><span class="nm">${esc(s.name)}${s.brand || P.brands[norm(s.name)] ? ` <i class="tag">${esc(s.brand || P.brands[norm(s.name)])}</i>` : ''}</span></label><em>${s.qty ? esc(fmtQty(s.qty, s.unit)) : ''}</em><span class="pr">≈ ${euro(price(s))}</span><button class="icon sm" data-act="shopEdit" data-id="${s.id}" aria-label="Détails de ${esc(s.name)}">${ic('edit')}</button><button class="icon sm" data-act="delShop" data-id="${s.id}" aria-label="Supprimer ${esc(s.name)}">${ic('x')}</button>${s.from ? `<small>${esc(s.from)}</small>` : ''}</li>`;
  const groups = P.shopSort === 'magasin' ? [...stores, ''].map(st => [st || 'Sans magasin', todo.filter(s => (s.store || '') === st || (!st && !stores.includes(s.store || '')))]).filter(g => g[1].length) : CAT_ORDER.map(c => [CATS[c].label, todo.filter(s => (s.cat || guessCat(s.name)) === c)]).filter(g => g[1].length);
  return `<div class="vhead"><h1>Courses</h1><p>${pl(todo.length, 'article')} à acheter · total estimé ${euro(total)}${P.shopBudget ? ` / budget ${euro(P.shopBudget)}` : ''}</p></div>${tabs}
  ${P.shopBudget && total > P.shopBudget ? `<p class="alertline warn">${ic('info')}Budget dépassé de ${euro(total - P.shopBudget)}. Touchez le crayon d’un article pour voir des alternatives moins chères.</p>` : ''}
  <form class="addbar" data-form="addShop"><label class="sr" for="addShop">Ajouter un article</label><input id="addShop" name="t" autocomplete="off" placeholder="Ex. 1 l de lait, 2 citrons"><button class="btn" type="submit">${ic('plus')}<span>Ajouter</span></button></form>
  <details class="advopts" id="shopDet"${dopen('shopDet')}><summary>${ic('sliders')}Réglages des courses</summary><div class="filters flat">
    ${pselect('shopSort', 'Classer par', [['rayon', 'Rayon'], ['magasin', 'Magasin']], P.shopSort)}
    <label class="fld"><span>Budget max (€)</span><input type="number" min="0" step="5" data-p="shopBudget" value="${P.shopBudget || ''}" placeholder="Aucun"></label>
    ${ptext('stores', 'Mes magasins (séparés par des virgules)', P.stores, 'Lidl, Carrefour, marché')}
    ${ptext('essentials', 'Produits habituels à surveiller', P.essentials)}
  </div></details>
  ${me.length ? `<div class="suggest"><span>${ic('info')}Basiques manquants :</span>${me.map(e => `<button class="chip btnchip" data-act="addEssential" data-n="${esc(e)}">${ic('plus')}${esc(e)}</button>`).join('')}</div>` : ''}
  ${groups.map(([l, items]) => `<h3 class="aisle">${esc(l)}</h3><ul class="shop">${items.map(row).join('')}</ul>`).join('') || (done.length ? '' : emptyState('Liste vide.', 'Ajoutez les manquants depuis une recette ou générez la liste depuis le planning.'))}
  ${done.length ? `<h3 class="aisle">Dans le panier</h3><ul class="shop">${done.map(row).join('')}</ul>
  <div class="row wrap"><button class="btn accent" data-act="finishShopping">${ic('fridge')}Terminer : ranger ${pl(done.length, 'article')} dans l’inventaire</button><button class="btn ghost" data-act="clearDone">Retirer sans ranger</button></div>` : ''}
  <p class="note">${ic('info')}Prix estimés d’après des moyennes par rayon. ${CL.foyerOn ? 'Liste partagée avec votre foyer.' : ''} La comparaison entre enseignes n’est pas proposée : aucune source de prix fiable n’est accessible.</p>`;
};
function shopEditSheet(id) {
  UI.shopEdit = id;
  openSheet(() => {
    const s = S.shopping.find(x => x.id === id); if (!s) return shead('Article supprimé');
    const stores = S.prefs.stores.split(',').map(x => x.trim()).filter(Boolean), p = estPrice(s.name, s.qty || 1, s.unit || 'pc');
    const alts = (SUBS[norm(s.name)] || []).map(a => ({ a, p: estPrice(a, s.qty || 1, s.unit || 'pc') })).filter(x => x.p < p * 0.9).sort((a, b) => a.p - b.p).slice(0, 4);
    return `${shead(esc(s.name))}<div class="form">
      <label class="fld wide"><span>Nom</span><input data-shopf="name" value="${esc(s.name)}"></label>
      <label class="fld"><span>Quantité</span><input type="number" min="0" step="any" data-shopf="qty" value="${s.qty || ''}"></label>
      <label class="fld"><span>Unité</span><select data-shopf="unit">${opt(Object.keys(UNITS).map(u => [u, u === 'pc' ? 'pièce(s)' : UNITS[u]]), s.unit || 'pc')}</select></label>
      <label class="fld"><span>Magasin</span><select data-shopf="store">${opt([['', 'Aucun'], ...stores.map(x => [x, x])], s.store || '')}</select></label>
      <label class="fld"><span>Marque préférée</span><input data-shopf="brand" value="${esc(s.brand || S.prefs.brands[norm(s.name)] || '')}" placeholder="Retenue pour les prochaines fois"></label></div>
      <h3>Alternatives moins chères (estimation)</h3>
      <ul class="pick">${alts.map(x => `<li><button data-act="shopAlt" data-id="${s.id}" data-n="${esc(x.a)}"><b>${esc(x.a)}</b><span>≈ ${euro(x.p)} au lieu de ${euro(p)}</span></button></li>`).join('')}<li class="muted-t">Marque distributeur : en général 20 à 30 % moins chère que la marque nationale.</li></ul>
      ${stores.length ? '' : '<p class="fine">Ajoutez vos magasins dans les réglages des courses pour classer la liste par magasin.</p>'}`;
  });
}

/* ----- Nutrition ----- */
function svgBars(vals, goal, days, cur, label, goalLab) {
  const mx = Math.max(goal * 1.2, ...vals, 1), y = v => (180 - v / mx * 170).toFixed(1), gy = y(goal);
  const bars = vals.map((v, i) => `<rect class="${days[i] === cur ? 'cur' : ''}" x="${i * 100 + 22}" y="${y(v)}" width="56" height="${(v / mx * 170).toFixed(1)}" rx="6"/><text class="lbl" x="${i * 100 + 50}" y="202" text-anchor="middle">${fmtDate(days[i], { weekday: 'short' })}</text>` + (v ? `<text class="val" x="${i * 100 + 50}" y="${(172 - v / mx * 170).toFixed(1)}" text-anchor="middle">${Math.round(v)}</text>` : '')).join('');
  return `<div class="chart"><svg viewBox="0 0 700 210" role="img" aria-label="${label}"><line class="goal" x1="0" x2="700" y1="${gy}" y2="${gy}"/><text class="lbl" x="696" y="${(gy - 6).toFixed(1)}" text-anchor="end">${goalLab}</text>${bars}</svg></div>`;
}
const slotNow = () => { const h = new Date().getHours(); return h < 11 ? 'petitdej' : h < 15 ? 'midi' : h < 18 ? 'collation' : 'soir'; };
function nutriAlerts(t) {
  const g = S.prefs.goals, A = S.prefs.nutriAlerts, out = [], h = new Date().getHours();
  if (A.kcalOver && g.kcal && t.kcal > g.kcal * 1.1) out.push(`Objectif calorique dépassé de ${Math.round((t.kcal / g.kcal - 1) * 100)} %.`);
  if (A.protUnder && g.p && h >= 18 && t.p < g.p * 0.7) out.push(`Protéines : ${Math.round(t.p)} g sur ${g.p} g. Pensez à un dîner protéiné.`);
  return out;
}
VIEWS.nutrition = () => {
  const d = UI.nutriDay || todayISO(), g = S.prefs.goals, sp = S.prefs.mealSplit;
  const tabs = `<div class="seg">${[['jour', 'Jour'], ['semaine', 'Semaine'], ['historique', 'Historique']].map(([k, l]) => `<button aria-selected="${UI.ntab === k}" data-act="ntab" data-v="${k}">${l}</button>`).join('')}<button data-act="compareAny">${ic('swap')}Comparer des recettes</button></div>`;
  const head = `<div class="vhead"><h1>Nutrition</h1><p>Valeurs estimées à partir des recettes et de vos saisies. Ce n’est pas un suivi médical.</p></div>`;
  if (UI.ntab === 'historique') {
    const days = [...Array(30)].map((_, i) => addDays(todayISO(), -i)).filter(x => S.food.some(f => f.date === x));
    return head + tabs + (days.length ? `<div class="cmpwrap"><table class="cmp hist30"><thead><tr><th>Jour</th><th>kcal</th><th>Prot.</th><th>Gluc.</th><th>Lip.</th><th>Fibres</th><th>Objectif</th></tr></thead><tbody>${days.map(x => { const t = dayTotals(x); return `<tr><th><button class="link" data-act="nGoto" data-d="${x}">${fmtDate(x, { weekday: 'short', day: 'numeric', month: 'short' })}</button></th><td>${t.kcal}</td><td>${t.p} g</td><td>${t.c} g</td><td>${t.f} g</td><td>${t.fiber} g</td><td class="${t.kcal > g.kcal * 1.1 ? 'over' : ''}">${Math.round(t.kcal / g.kcal * 100)} %</td></tr>`; }).join('')}</tbody></table></div>` : emptyState('Pas encore d’historique.', 'Les repas notés apparaîtront ici sur 30 jours.'));
  }
  if (UI.ntab === 'semaine') {
    const days = [...Array(7)].map((_, i) => addDays(d, i - 6)), tot = days.map(dayTotals), sum = k => tot.reduce((a, t) => a + t[k], 0), filled = tot.filter(t => t.kcal).length || 1;
    return head + tabs + `<div class="macros big">${macroBar('Calories (semaine)', sum('kcal'), g.kcal * 7, 'kcal')}${macroBar('Protéines (semaine)', sum('p'), g.p * 7, 'g')}${macroBar('Glucides (semaine)', sum('c'), g.c * 7, 'g')}${macroBar('Lipides (semaine)', sum('f'), g.f * 7, 'g')}${macroBar('Fibres (semaine)', sum('fiber'), g.fiber * 7, 'g')}</div>
    <div class="stats four"><div><b>${Math.round(sum('kcal') / filled)}</b><span>kcal / jour renseigné</span></div><div><b>${Math.round(sum('p') / filled)} g</b><span>protéines / jour</span></div><div><b>${filled}</b><span>jours renseignés</span></div><div><b>${tot.filter(t => t.kcal && t.kcal <= g.kcal * 1.1 && t.kcal >= g.kcal * 0.8).length}</b><span>jours dans l’objectif</span></div></div>
    ${svgBars(tot.map(t => t.p), g.p, days, null, 'Protéines des 7 jours', `objectif ${g.p} g de protéines`)}`;
  }
  const t = dayTotals(d), entries = S.food.filter(f => f.date === d), al = d === todayISO() ? nutriAlerts(t) : [];
  const days = [...Array(7)].map((_, i) => addDays(d, i - 6)), kc = days.map(x => dayTotals(x).kcal);
  const rem = { kcal: g.kcal - t.kcal, p: g.p - t.p };
  const sug = rem.kcal > 200 ? scoredList({ maxKcal: Math.max(250, rem.kcal) }).filter(x => x.r.kcal && ['plat', 'entree', 'collation'].includes(x.r.meal)).sort((a, b) => (rem.p > 25 ? b.r.prot - a.r.prot : 0) || b.a.score - a.a.score).slice(0, 3) : [];
  return head + tabs + `<div class="row wrap gap"><div class="row"><button class="icon" data-act="nday" data-d="-1" aria-label="Jour précédent">${ic('left')}</button><b class="dlabel">${d === todayISO() ? 'Aujourd’hui' : fmtDate(d, { weekday: 'long', day: 'numeric', month: 'short' })}</b><button class="icon" data-act="nday" data-d="1" aria-label="Jour suivant" ${d >= todayISO() ? 'disabled' : ''}>${ic('right')}</button></div><button class="btn accent" data-act="addFood">${ic('plus')}Ajouter un repas</button></div>
  ${al.map(a => `<p class="alertline warn">${ic('bell')}${esc(a)}</p>`).join('')}
  <div class="macros big">${macroBar('Calories', t.kcal, g.kcal, 'kcal')}${macroBar('Protéines', t.p, g.p, 'g')}${macroBar('Glucides', t.c, g.c, 'g')}${macroBar('Lipides', t.f, g.f, 'g')}${macroBar('Fibres', t.fiber, g.fiber, 'g')}</div>
  <div class="split">${Object.entries(SLOTS).map(([s, l]) => { const v = entries.filter(f => (f.slot || 'soir') === s).reduce((a, f) => a + f.kcal, 0), tg = Math.round(g.kcal * (sp[s] || 0) / 100); return `<div><span>${l}</span><b>${v}<small> / ${tg}</small></b></div>`; }).join('')}</div>
  <ul class="food">${entries.map(f => `<li><div><b>${esc(f.label)}</b><span>${SLOTS[f.slot] || ''} · ${f.kcal} kcal · P ${f.p} g · G ${f.c} g · L ${f.f} g${f.est ? ' · estimation' : ''}</span></div><button class="icon sm" data-act="delFood" data-id="${f.id}" aria-label="Supprimer">${ic('x')}</button></li>`).join('') || `<li class="empty-li">${emptyState('Aucun repas noté ce jour.', 'Les recettes terminées en mode cuisine s’ajoutent automatiquement.')}</li>`}</ul>
  <div class="bhead"><h3>7 derniers jours</h3><small class="muted-t">moyenne ${Math.round(kc.reduce((a, b) => a + b, 0) / 7)} kcal</small></div>
  ${svgBars(kc, g.kcal, days, d, 'Calories des 7 derniers jours', `objectif ${g.kcal}`)}
  ${sug.length ? `<div class="bhead"><h3>Pour compléter la journée</h3></div><div class="grid g3">${sug.map(recipeCard).join('')}</div>` : ''}`;
};

/* ----- Profil et paramètres (onglets, enregistrement automatique) ----- */
const PTABS = [['compte', 'Compte'], ['culinaire', 'Profil culinaire'], ['apparence', 'Apparence'], ['notifs', 'Notifications'], ['ia', 'Intelligence artificielle'], ['cuisson', 'Mode cuisine'], ['foyer', 'Foyer'], ['stats', 'Statistiques'], ['outils', 'Outils'], ['donnees', 'Confidentialité'], ['appli', 'Installer']];
VIEWS.profil = () => {
  const p = S.prefs, T = UI.ptab;
  let body = '';
  if (T === 'culinaire') body = `<section class="card"><h2>${ic('user')}Vous et votre foyer</h2><div class="form">
      <label class="fld"><span>Personnes dans le foyer</span><input type="number" min="1" max="12" data-p="servings" value="${p.servings}"></label>
      ${pselect('level', 'Niveau en cuisine', [['debutant', 'Débutant : techniques expliquées'], ['normal', 'Intermédiaire'], ['expert', 'Expert : étapes condensées']], p.level)}
      ${pselect('diet', 'Régime alimentaire', Object.entries(DIETS), p.diet)}
      ${pselect('maxTime', 'Temps max en cuisine', [[0, 'Indifférent'], [15, '15 min'], [30, '30 min'], [45, '45 min'], [60, '1 h'], [90, '1 h 30']], p.maxTime, 1)}
      ${pselect('maxDiff', 'Difficulté souhaitée', [[0, 'Toutes'], [1, 'Facile'], [2, 'Moyenne au plus']], p.maxDiff, 1)}
      <label class="fld"><span>Budget par jour (€)</span><input type="number" min="0" step="1" data-p="budgetDay" value="${p.budgetDay || ''}" placeholder="Aucun"></label>
      <label class="fld"><span>Budget par semaine (€)</span><input type="number" min="0" step="5" data-p="budgetWeek" value="${p.budgetWeek || ''}" placeholder="Aucun"></label>
      <fieldset class="fld wide"><legend>Allergies et intolérances (exclusion stricte, ingrédients détectés compris)</legend>${pchips('allergies', Object.entries(ALLERGENS), p.allergies)}</fieldset>
      <fieldset class="fld wide"><legend>Cuisines préférées (mises en avant)</legend>${pchips('cuisinesFav', CUISINES_LIST.map(c => [c, c]), p.cuisinesFav)}</fieldset>
      ${ptext('likes', 'Aliments préférés (mis en avant)', p.likes, 'champignon, saumon, citron')}
      ${ptext('dislikes', 'Aliments que je n’aime pas (exclus)', p.dislikes, 'poivron, coriandre')}
      ${ptext('banned', 'Ingrédients interdits (exclus partout)', p.banned, 'porc, alcool')}
      ${ptext('staples', 'Basiques toujours disponibles (jamais comptés comme manquants)', p.staples)}
      ${ptext('essentials', 'Basiques à surveiller (proposés aux courses s’ils manquent)', p.essentials)}
      <label class="fld wide"><span>Ce que l’assistant retient de vous</span><textarea data-p="memory" rows="3" placeholder="Ex. j’adore les plats épicés">${esc(p.memory)}</textarea></label></div></section>
    <section class="card"><h2>${ic('chart')}Objectifs nutritionnels</h2><div class="form five">${[['kcal', 'Calories', 'kcal'], ['p', 'Protéines', 'g'], ['c', 'Glucides', 'g'], ['f', 'Lipides', 'g'], ['fiber', 'Fibres', 'g']].map(([k, l, u]) => `<label class="fld"><span>${l} (${u})</span><input type="number" min="0" data-p="goals.${k}" value="${p.goals[k]}"></label>`).join('')}</div>
      <p class="fine">Répartition des calories par repas (%)</p><div class="form five">${Object.entries(SLOTS).map(([s, l]) => `<label class="fld"><span>${l}</span><input type="number" min="0" max="100" data-p="mealSplit.${s}" value="${p.mealSplit[s]}"></label>`).join('')}</div>
      <div class="row wrap">${chk('nutriAlerts.kcalOver', 'Alerte si l’objectif calorique est dépassé', p.nutriAlerts.kcalOver)}${chk('nutriAlerts.protUnder', 'Alerte si les protéines sont basses le soir', p.nutriAlerts.protUnder)}</div></section>
    <section class="card"><h2>${ic('pot')}Mon matériel</h2><p class="fine">Les recettes qui demandent un appareil absent sont masquées ; l’IA adapte ses recettes à ce que vous avez.</p>${pchips('equipment', Object.entries(EQUIP), p.equipment)}</section>`;
  if (T === 'apparence') body = `<section class="card"><h2>${ic('sliders')}Apparence</h2>
      <div class="row wrap"><div class="seg sm">${[['system', 'Automatique'], ['light', 'Clair'], ['dark', 'Sombre']].map(([k, l]) => `<button aria-selected="${p.theme === k}" data-act="theme" data-v="${k}">${l}</button>`).join('')}</div>
      <div class="accents">${[['sauge', 'Sauge'], ['tomate', 'Tomate'], ['aubergine', 'Aubergine'], ['ocean', 'Océan']].map(([a, l]) => `<button class="sw sw-${a}" aria-pressed="${p.accent === a}" data-act="accent" data-v="${a}" aria-label="Couleur ${l}" title="${l}"></button>`).join('')}</div></div>
      <div class="form">${pselect('fontScale', 'Taille du texte', [[0.9, 'Petite'], [1, 'Normale'], [1.12, 'Grande'], [1.25, 'Très grande']], p.fontScale, 1)}
      ${pselect('layout', 'Affichage des recettes', [['grid', 'Grille'], ['list', 'Liste']], p.layout)}
      ${pselect('aiLang', 'Langue des contenus IA', [['français', 'Français'], ['anglais', 'English'], ['espagnol', 'Español'], ['allemand', 'Deutsch'], ['italien', 'Italiano']], p.aiLang)}
      ${chk('anim', 'Animations', p.anim !== false)}${chk('dish3d', 'Aperçus 3D des plats', p.dish3d !== false)}</div><p class="fine">L’interface est disponible en français uniquement ; la langue choisie s’applique aux recettes et réponses de l’IA.</p></section>
    <section class="card"><h2>${ic('home')}Accueil</h2><ul class="widgets">${p.widgets.map((w, i) => `<li><label class="check"><input type="checkbox" data-act="widgetOn" data-i="${i}" ${w.on ? 'checked' : ''}> ${WIDGETS[w.id]}</label><button class="icon xs" data-act="widgetMove" data-i="${i}" data-d="-1" aria-label="Monter" ${i === 0 ? 'disabled' : ''}>${ic('up')}</button><button class="icon xs" data-act="widgetMove" data-i="${i}" data-d="1" aria-label="Descendre" ${i === p.widgets.length - 1 ? 'disabled' : ''}>${ic('down')}</button></li>`).join('')}</ul></section>`;
  if (T === 'notifs') body = `<section class="card"><h2>${ic('bell')}Notifications</h2><p class="fine">Affichées dans l’encadré « Aujourd’hui » de l’accueil${'Notification' in window ? ' et, si vous l’autorisez, par le navigateur' : ''}.</p>
      ${chk('notif.expiry', 'Alertes de péremption', p.notif.expiry)}${pselect('alertDays', 'Prévenir', [[1, '1 jour avant'], [2, '2 jours avant'], [3, '3 jours avant'], [5, '5 jours avant']], p.alertDays, 1)}
      ${chk('notif.daily', 'Suggestion de recette quotidienne', p.notif.daily)}${chk('notif.meals', 'Rappels des repas planifiés', p.notif.meals)}${chk('notif.shop', 'Rappels de courses', p.notif.shop)}${chk('notif.plan', 'Rappel si le planning de demain est vide', p.notif.plan)}
      ${pselect('notif.freq', 'Fréquence', [['always', 'À chaque ouverture'], ['daily', 'Une fois par jour'], ['weekly', 'Une fois par semaine']], p.notif.freq)}
      <button class="btn ghost" data-act="browserNotif">${ic('bell')}Activer les notifications du navigateur</button></section>`;
  if (T === 'ia') body = `<section class="card"><h2>${ic('spark')}Intelligence artificielle</h2><div class="form">
      ${pselect('ai.creativity', 'Niveau de créativité', [['basse', 'Classique'], ['normale', 'Équilibré'], ['haute', 'Créatif']], p.ai.creativity)}
      ${pselect('ai.length', 'Réponses de l’assistant', [['courtes', 'Courtes'], ['detaillees', 'Détaillées']], p.ai.length)}
      ${pselect('ai.priority', 'Priorité', [['equilibre', 'Équilibre'], ['prix', 'Prix'], ['gout', 'Goût'], ['temps', 'Temps'], ['nutrition', 'Nutrition']], p.ai.priority)}
      ${pselect('ai.count', 'Nombre de suggestions par défaut', [[3, '3'], [5, '5'], [10, '10']], p.ai.count, 1)}
      ${chk('ai.experimental', 'Autoriser les recettes expérimentales', p.ai.experimental)}</div>
      <p class="fine">La priorité modifie aussi le classement des recettes de la bibliothèque.</p></section>`;
  if (T === 'cuisson') body = `<section class="card"><h2>${ic('play')}Mode cuisine</h2><div class="form">
      ${pselect('cookFont', 'Taille du texte des étapes', [['s', 'Petite'], ['m', 'Normale'], ['l', 'Grande'], ['xl', 'Très grande']], p.cookFont)}
      ${chk('cookAutoRead', 'Lire chaque étape à voix haute automatiquement', p.cookAutoRead)}</div>
      <p class="fine">En cuisine : minuteurs multiples, mains libres, détails pas à pas (débutant), vue condensée de toutes les étapes, « Je suis bloqué », autre méthode, passer une étape.</p></section>`;
  if (T === 'compte') body = accountView();
  if (T === 'appli') body = installView();
  if (T === 'foyer') body = foyerCard();
  if (T === 'stats') { const st = statsData(); body = `<section class="card"><h2>${ic('trophy')}Statistiques et badges</h2>
      <div class="stats four"><div><b>${S.hist.length}</b><span>recettes cuisinées</span></div><div><b>${S.stats.savedN}</b><span>aliments sauvés</span></div><div><b>${euro(S.stats.savedEur)}</b><span>économisés (estim.)</span></div><div><b>${euro(S.stats.wastedEur)}</b><span>jetés (estim.)</span></div></div>
      ${habits().cuisines.length ? `<p>Vos cuisines favorites d’après vos repas : <b>${esc(habits().cuisines.join(', '))}</b>.</p>` : ''}
      ${st.top.length ? `<h3>Ingrédients les plus utilisés</h3><ol class="rank">${st.top.map(([n, c]) => `<li><span>${esc(n)}</span><em>${c}×</em></li>`).join('')}</ol>` : ''}
      <div class="challenge"><b>Défi de la semaine : ${esc(weeklyChallenge().label)}</b><div class="bar"><span style="width:${Math.min(100, weeklyChallenge().done / weeklyChallenge().goal * 100)}%"></span></div></div>
      <div class="badges">${badgeList().map(b => `<div class="badge ${b.got ? 'got' : ''}">${ic(b.icon)}<b>${b.label}</b><small>${b.got ? 'Obtenu' : esc(b.desc)}</small></div>`).join('')}</div></section>`; }
  if (T === 'outils') body = `<section class="card"><h2>${ic('swap')}Convertisseur</h2>
      <form class="conv" data-form="conv"><input id="cvQ" name="q" type="number" step="any" value="${UI.cv?.q ?? 1}" aria-label="Quantité"><select id="cvFrom" name="from" aria-label="De">${opt(Object.keys(UNITS).map(u => [u, u === 'pc' ? 'pièce' : UNITS[u]]), UI.cv?.from || 'cs')}</select><span>en</span><select id="cvTo" name="to" aria-label="Vers">${opt(Object.keys(UNITS).map(u => [u, u === 'pc' ? 'pièce' : UNITS[u]]), UI.cv?.to || 'ml')}</select><input id="cvName" name="name" value="${esc(UI.cv?.n || '')}" placeholder="Ingrédient (pour les pièces)" aria-label="Ingrédient"><button class="btn ghost" type="submit">Convertir</button><output id="cvOut">${esc(UI.cvOut || '')}</output></form></section>
    <section class="card"><h2>${ic('users')}Calculateur de quantités</h2><div class="row wrap"><label class="fld"><span>Personnes</span><input type="number" min="1" max="50" id="qcN" value="${UI.qcN || servings()}" data-act-in="qc"></label><label class="fld"><span>Appétit</span><select id="qcA">${opt([[0.8, 'Petit'], [1, 'Normal'], [1.25, 'Gros']], UI.qcA || 1)}</select></label><button class="btn ghost" data-act="qcCalc">Calculer</button></div>
      <table class="cmp"><tbody>${PORTIONS.map(([n, q, u]) => `<tr><th>${n}</th><td>${fmtQty(q * (UI.qcN || servings()) * (UI.qcA || 1), u)}</td></tr>`).join('')}</tbody></table></section>
    <section class="card"><h2>${ic('cart')}Coût par personne</h2><form class="row wrap" data-form="costCalc"><label class="fld"><span>Total (€)</span><input name="t" type="number" min="0" step="0.01" id="ccT" value="${UI.ccT || ''}"></label><label class="fld"><span>Personnes</span><input name="n" type="number" min="1" id="ccN" value="${UI.ccN || servings()}"></label><button class="btn ghost" type="submit">Calculer</button>${UI.ccT ? `<b>${euro(UI.ccT / (UI.ccN || 1))} par personne</b>` : ''}</form><p class="fine">Pour une recette, le coût estimé par portion est indiqué sur sa fiche.</p></section>
    <section class="card"><h2>${ic('copy')}Partager mon profil culinaire</h2><p class="fine">Le code contient vos goûts, allergies, régime, matériel et objectifs. Il ne contient ni inventaire ni historique.</p><div class="row wrap"><button class="btn ghost" data-act="shareProfile">${ic('copy')}Copier mon code</button></div><form class="addbar" data-form="importProfile"><input name="c" id="profCode" placeholder="Coller un code TAMB1:…"><button class="btn" type="submit">Importer</button></form></section>
    <section class="card"><h2>${ic('refresh')}Réinitialiser</h2>${UI.confirmPrefs ? `<div class="row wrap confirm"><span>Revenir aux paramètres par défaut (vos données sont conservées) ?</span><button class="btn danger" data-act="resetPrefs">Réinitialiser</button><button class="btn ghost" data-act="cancelPrefs">Annuler</button></div>` : `<button class="btn ghost" data-act="askPrefs">Réinitialiser les paramètres</button>`}</section>`;
  if (T === 'donnees') body = `<section class="card"><h2>${ic('box')}Confidentialité et données</h2>
      <p class="muted-t">Vos données sont privées : stockées sur votre compte, lisibles par vous seul, et par votre foyer pour la partie partagée si vous l’avez rejoint. Les photos de scan sont envoyées à l’IA au moment de l’analyse et ne sont pas conservées.</p>
      <h3>Photos des aliments</h3><div id="photoList">${UI.photos ? (UI.photos.length ? `<div class="photos">${UI.photos.map(a => `<figure><img src="${esc(a.url)}" alt=""><button class="icon xs" data-act="delPhoto" data-id="${a.id}" aria-label="Supprimer la photo">${ic('trash')}</button></figure>`).join('')}</div>` : '<p class="fine">Aucune photo enregistrée.</p>') : `<button class="btn ghost sm" data-act="loadPhotos">Afficher mes photos</button>`}</div>
      <h3>Historique des recherches</h3>${chk('saveSearch', 'Enregistrer mes recherches', p.saveSearch)}<p class="fine">${S.searches.length ? esc(S.searches.join(' · ')) : 'Aucune recherche enregistrée.'}</p>${S.searches.length ? '<button class="btn ghost sm" data-act="clearSearches">Effacer l’historique</button>' : ''}
      <h3>Autorisations</h3><button class="btn ghost sm" data-act="perms">${ic('gear')}Gérer les autorisations (IA, stockage, photos)</button>
      <h3>Export et suppression</h3><div class="row wrap"><button class="btn ghost" data-act="exportData">${ic('download')}Exporter mes données</button><button class="btn ghost" data-act="importData">${ic('upload')}Restaurer une sauvegarde</button></div>
      ${UI.confirmReset ? `<div class="row wrap confirm"><span>Tout effacer définitivement ?</span><button class="btn danger" data-act="doReset">Oui, tout effacer</button><button class="btn ghost" data-act="cancelReset">Annuler</button></div>` : `<button class="btn ghost danger" data-act="askReset">${ic('trash')}Effacer toutes mes données</button>`}
      <p class="fine">Votre compte Claude lui-même se gère depuis les paramètres de claude.ai.</p></section>`;
  return `<div class="vhead row gap"><div><h1>Profil et paramètres</h1><p>${CL.me?.name ? esc(CL.me.name) + ' · ' : ''}${UI.sync === 'local' ? 'Enregistré sur cet appareil' : 'Synchronisé sur votre compte'}</p></div><span class="saved" id="savedFlash">${ic('check')}Enregistré</span></div>
  <div class="seg ptabs">${PTABS.map(([k, l]) => `<button aria-selected="${T === k}" data-act="ptab" data-v="${k}">${l}</button>`).join('')}</div>${body}`;
};
function foyerCard() {
  const members = Object.keys(UI.members);
  return `<section class="card" id="sec-foyer"><h2>${ic('users')}Foyer</h2>
  ${!IN_CLAUDE ? `<p class="muted-t">Le foyer partagé (inventaire et courses communs) est disponible dans la version Claude de Tambouille. Ici, chaque compte a ses propres données.</p>` : !CL.perso ? `<p class="muted-t">Le foyer partagé nécessite d’ouvrir Tambouille sur claude.ai en étant connecté.</p>` : CL.foyerOn ? `<p>Inventaire, courses, planning, recettes et historique sont partagés. Les allergies de chacun sont exclues des suggestions.</p>
    <ul class="members">${members.map(id => `<li>${ic('user')}<b>${esc(UI.names[id] || (id === CL.uid ? 'Vous' : 'Membre'))}</b>${id === CL.uid ? '<em>vous</em>' : ''}<span>${(UI.members[id].allergies || []).map(a => ALLERGENS[a]).join(', ') || 'aucune allergie'}</span></li>`).join('')}</ul>
    <p class="note">${ic('info')}Pour inviter quelqu’un : menu Partager de la page, droit « peut interagir ». Il touche ensuite « Rejoindre le foyer ».</p><button class="btn ghost danger" data-act="leaveFoyer">Quitter le foyer</button>`
    : `<p>Partagez inventaire, courses et planning avec les personnes qui ont accès à cette appli. Favoris, nutrition et paramètres restent privés.</p><button class="btn accent" data-act="joinFoyer">${ic('users')}Rejoindre ou créer le foyer</button>`}</section>`;
}

/* ----- Actions supplémentaires ----- */
Object.assign(ACT, {
  cmode: b => { const k = b.dataset.k, m = COOK_MODES[k]; if (m.surprise) return surprise(); UI.cmode = k; UI.F = F0(); UI.mode = 'all'; UI.gen = { ...UI.gen, meal: 'plat', style: '', ...Object.fromEntries(Object.entries(m.gen || {}).filter(([x]) => x !== 'prompt' && x !== 'style')) }; go('recettes'); toast(`Mode ${m.l} activé.`); },
  cmodeOff: () => { UI.cmode = null; render(); },
  surprise,
  weather: b => { UI.gen.weather = b.dataset.w; UI.F = { ...F0(), temp: b.dataset.w === 'chaud' ? 'froid' : b.dataset.w === 'doux' ? '' : 'chaud', season: true }; UI.filtersOpen = true; go('recettes'); toast('Menu adapté à la météo indiquée. Touchez « Générer » pour des idées de l’IA.'); },
  leftovers: () => openSheet(() => `${shead('Utiliser mes restes')}<form class="form" data-form="leftovers"><label class="fld wide"><span>Vos restes (cuits ou non)</span><textarea name="t" id="lefT" rows="4" required placeholder="Ex. un bol de riz cuit, la moitié d’un poulet rôti, deux carottes"></textarea></label><div class="wide"><button class="btn accent" type="submit">${ic('spark')}Trouver des recettes</button></div></form><p class="fine">Les restes cuits se conservent 2 à 3 jours au frigo : en cas de doute, ne les consommez pas.</p>`),
  hideNotifs: () => { try { localStorage.setItem('tambouille-notif', JSON.stringify({ ...ND(), hidden: todayISO() })); } catch {} render(); },
  searchQ: b => { UI.F.q = b.dataset.q; render(); },
  addCompare: () => { if (!UI.compare.includes(curR.id)) UI.compare = [...UI.compare, curR.id].slice(-3); toast(UI.compare.length > 1 ? `${UI.compare.length} recettes dans le comparateur.` : 'Ajoutée au comparateur. Ajoutez-en une autre.', UI.compare.length > 1 ? { act: 'openCompare', label: 'Comparer' } : null); render(); },
  openCompare: () => compareSheet(UI.compare), clearCompare: () => { UI.compare = []; render(); },
  compareFam: () => { const r = curR, root = r.parent || r.id; compareSheet([root, ...allRecipes().filter(x => x.parent === root).map(x => x.id)].slice(0, 3)); },
  compareAny: () => { const ids = [...new Set([...S.views, ...S.fav])].slice(0, 3); if (ids.length < 2) return toast('Ouvrez au moins deux recettes, puis réessayez.'); compareSheet(ids); },
  servMul: b => { curServ = Math.max(1, Math.round(curServ * +b.dataset.k)); refreshSheet(); },
  adapt: b => adaptRecipe(b.dataset.k),
  remIng: b => { const r = myVersion(curR), g = r.ingr[+b.dataset.i]; r.ingr.splice(+b.dataset.i, 1); save('ai'); curR = r; UI.opened.add('roptsDet'); refreshSheet(); render(); toast(`${g.n} retiré de votre version.`); },
  cookFont: b => { const i = Math.max(0, Math.min(3, COOK_FS.indexOf(S.prefs.cookFont || 'm') + +b.dataset.d)); S.prefs.cookFont = COOK_FS[i]; save('prefs'); renderCook(); },
  cookList: () => { cook.list = !cook.list; renderCook(); },
  skipStep: () => { cook.skipped.add(cook.i); if (cook.i < cook.r.steps.length - 1) { cook.i++; renderCook(); if (cook.hands || S.prefs.cookAutoRead) speak(cook.over[cook.i] || cook.r.steps[cook.i]); } else renderCook(); },
  stepAI: b => stepAI(b.dataset.k),
  stuck: () => openChat(`Je suis bloqué à l’étape ${cook.i + 1} (« ${(cook.over[cook.i] || cook.r.steps[cook.i]).slice(0, 120)} ») : `, cook.r.id),
  clearPlan: () => { const start = weekStart(UI.weekOffset), T = todayISO(); [...Array(7)].map((_, i) => addDays(start, i)).filter(d => d >= T).forEach(d => delete S.plan[d]); save('plan'); render(); },
  ctab: b => { UI.ctab = b.dataset.v; render(); }, shopEdit: b => shopEditSheet(b.dataset.id),
  shopAlt: b => { const s = S.shopping.find(x => x.id === b.dataset.id); s.name = b.dataset.n; s.cat = guessCat(s.name); save('shopping'); closeSheet(); render(); toast('Article remplacé.'); },
  ntab: b => { UI.ntab = b.dataset.v; render(); }, nGoto: b => { UI.nutriDay = b.dataset.d; UI.ntab = 'jour'; render(); },
  ptab: b => { UI.ptab = b.dataset.v; render(); window.scrollTo(0, 0); },
  browserNotif: async () => { try { if (!('Notification' in window)) throw 0; const r = await Notification.requestPermission(); toast(r === 'granted' ? 'Notifications du navigateur activées.' : 'Notifications refusées par le navigateur.'); } catch { toast('Les notifications du navigateur ne sont pas disponibles ici. Les rappels restent visibles sur l’accueil.'); } },
  loadPhotos: async () => { try { const as = await photoStore(); if (!as) throw 0; UI.photos = (await as.list()).assets.filter(a => a.contentType.startsWith('image/')); } catch { UI.photos = []; toast('La liste des photos n’est pas disponible ici.'); } render(); },
  delPhoto: async b => { try { const as = await photoStore(); await as.delete(b.dataset.id); S.pantry.forEach(p => { if (p.photo === b.dataset.id) p.photo = null; }); save('pantry'); UI.photos = UI.photos.filter(a => a.id !== b.dataset.id); render(); toast('Photo supprimée.'); } catch { toast('La photo n’a pas pu être supprimée.'); } },
  clearSearches: () => { S.searches = []; save('searches'); render(); }, clearScans: () => { S.scans = []; save('scans'); render(); },
  perms: async () => { if (!IN_CLAUDE) return toast('Gérez l’appareil photo et les notifications dans les réglages de votre navigateur ou de votre téléphone.'); try { const p = window.claude?.use ? await window.claude.use('permissions') : null; if (!p) throw 0; await p.manage(); } catch { toast('Ouvrez le menu Autorisations de la page pour gérer les accès.'); } },
  qcCalc: () => { UI.qcN = Math.max(1, +$('#qcN').value || 1); UI.qcA = +$('#qcA').value || 1; render(); },
  shareProfile: () => { const p = S.prefs, sub = { servings: p.servings, level: p.level, diet: p.diet, allergies: p.allergies, cuisinesFav: p.cuisinesFav, likes: p.likes, dislikes: p.dislikes, banned: p.banned, equipment: p.equipment, goals: p.goals, maxTime: p.maxTime, maxDiff: p.maxDiff }; const code = 'TAMB1:' + btoa(unescape(encodeURIComponent(JSON.stringify(sub)))); copyText(code); },
  askPrefs: () => { UI.confirmPrefs = true; render(); }, cancelPrefs: () => { UI.confirmPrefs = false; render(); },
  resetPrefs: () => { const f = S.prefs.foyer; S.prefs = JSON.parse(JSON.stringify(DEF_PREFS)); S.prefs.foyer = f; S.prefs.widgets = mergeWidgets(S.prefs.widgets); UI.confirmPrefs = false; save('prefs'); applyTheme(); applyLook(); writeMember(); render(); toast('Paramètres réinitialisés.'); },
});
ACT.addFood = () => { UI.foodSlot = slotNow(); foodSheet(); setTimeout(() => { const b = $('#sheetBody'); if (b && !b.querySelector('#fdSlot')) b.querySelector('.shead').insertAdjacentHTML('afterend', `<label class="fld"><span>Repas</span><select id="fdSlot" data-foodslot="1">${opt(Object.entries(SLOTS), UI.foodSlot)}</select></label>`); }, 0); };
document.addEventListener('change', e => { if (e.target.dataset.foodslot) UI.foodSlot = e.target.value; });
UI.opened = new Set(['scanDet']);
const dopen = id => UI.opened.has(id) ? ' open' : '';
document.addEventListener('toggle', e => { const d = e.target; if (d.tagName === 'DETAILS' && d.id) d.open ? UI.opened.add(d.id) : UI.opened.delete(d.id); }, true);
document.addEventListener('submit', async e => {
  const f = e.target.closest('form[data-form]'); if (!f) return; const k = f.dataset.form, fd = new FormData(f);
  if (k === 'leftovers') { e.preventDefault(); closeSheet(); go('recettes'); genAI({ leftovers: String(fd.get('t')).slice(0, 500), count: 3, mode: 'achats', maxMissing: 2 }); }
  if (k === 'costCalc') { e.preventDefault(); UI.ccT = Math.max(0, +fd.get('t') || 0); UI.ccN = Math.max(1, +fd.get('n') || 1); render(); }
  if (k === 'importProfile') { e.preventDefault(); try { const c = String(fd.get('c')).trim(); if (!c.startsWith('TAMB1:')) throw 0; const sub = JSON.parse(decodeURIComponent(escape(atob(c.slice(6))))); const allowed = ['servings', 'level', 'diet', 'allergies', 'cuisinesFav', 'likes', 'dislikes', 'banned', 'equipment', 'goals', 'maxTime', 'maxDiff']; allowed.forEach(x => { if (sub[x] != null) S.prefs[x] = x === 'goals' ? { ...S.prefs.goals, ...sub.goals } : sub[x]; }); S.prefs.allergies = (S.prefs.allergies || []).filter(a => ALLERGENS[a]); S.prefs.equipment = (S.prefs.equipment || []).filter(a => EQUIP[a]); save('prefs'); writeMember(); render(); toast('Profil culinaire importé.'); } catch { toast('Ce code de profil n’est pas valide.'); } }
});

/* ----- Démarrage des options : rappel navigateur ----- */
function optionsBoot() {
  applyLook();
  try { if ('Notification' in window && Notification.permission === 'granted' && !notifHidden()) { const d = ND(); if (d.sent !== todayISO()) { const it = notifItems(); if (it.length) new Notification('Tambouille', { body: it.map(x => x.t).slice(0, 3).join('\n'), icon: '/icon.svg' }); localStorage.setItem('tambouille-notif', JSON.stringify({ ...d, sent: todayISO() })); } } } catch {}
}
