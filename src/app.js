/* ===== Tambouille — interface (vanilla JS, rendu par vues, délégation d'événements) ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const opt = (pairs, v) => pairs.map(([k, l]) => `<option value="${esc(k)}"${String(v) === String(k) ? ' selected' : ''}>${esc(l)}</option>`).join('');
const pl = (n, s, p) => `${n} ${n > 1 ? (p || s + 's') : s}`;
const fmtDate = (iso, o = { day: 'numeric', month: 'short' }) => iso ? new Date(iso + 'T12:00').toLocaleDateString('fr-FR', o) : '';
const r1 = v => Math.round(v * 10) / 10;
const ICONS = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  fridge: '<path d="M6 2h12a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM5 9h14M9 5v2M9 12v4"/>',
  chef: '<path d="M6 13a4 4 0 0 1 1-7.9A5 5 0 0 1 16.9 5 4 4 0 0 1 18 13v7H6zM6 17h12"/>',
  cal: '<path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4"/>',
  cart: '<path d="M3 4h2l2.5 11h10L20 7H6.5"/><circle cx="9" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16"/>',
  mic: '<path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3"/>',
  barcode: '<path d="M4 5v14M7 5v14M11 5v14M14 5v14M18 5v14M20 5v14"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  flame: '<path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.3 2 1.5 3 2.5 3-1-3 .5-6.5.5-8.5z"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', check: '<path d="M5 12l5 5L20 7"/>',
  send: '<path d="M4 12l16-8-6 16-2-7z"/>', users: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3 6"/>',
  sliders: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="15" cy="6" r="2" class="f"/><circle cx="8" cy="12" r="2" class="f"/><circle cx="17" cy="18" r="2" class="f"/>',
  gear: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  play: '<path d="M7 4l13 8-13 8z"/>', left: '<path d="M15 6l-6 6 6 6"/>', right: '<path d="M9 6l6 6-6 6"/>', up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4M9 2h6"/>', leaf: '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15M5 19l7-7"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>', refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>', chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  book: '<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>', snow: '<path d="M12 2v20M4 7l16 10M20 7L4 17M9 3l3 2 3-2M9 21l3-2 3 2"/>',
  wheel: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/>', download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  copy: '<path d="M8 8h11v12H8zM5 16V4h11"/>', volume: '<path d="M4 9h4l5-4v14l-5-4H4zM17 8a5 5 0 0 1 0 8"/>', swap: '<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>', trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM4 5h4v2a3 3 0 0 1-4-2zM20 5h-4v2a3 3 0 0 0 4-2zM12 13v4M8 21h8M9 17h6"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>', box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  pot: '<path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM2 10h2M20 10h2M9 6c0-1 1-1 1-2M14 6c0-1 1-1 1-2"/>',
};
const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ===== État ===== */
const WIDGETS = { notifs: 'Notifications du jour', alerts: 'Alertes de péremption', tonight: 'Ce soir et surprise', modes: 'Modes de cuisine', today: 'Repas du jour', suggestions: 'Suggestions', reco: 'Recommandations', nutrition: 'Nutrition du jour', gaspi: 'Bilan anti-gaspi', shopping: 'Liste de courses', season: 'Produits de saison', challenge: 'Défi de la semaine' };
const DEF_PREFS = { servings: 2, allergies: [], diet: '', dislikes: '', staples: DEFAULT_STAPLES, equipment: ['plaques', 'four', 'mixeur', 'microondes', 'fouet'], level: 'normal', theme: 'system', accent: 'sauge', widgets: Object.keys(WIDGETS).map(id => ({ id, on: true })), alertDays: 3, goals: { kcal: 2000, p: 90, c: 250, f: 70, fiber: 30 }, budgetWeek: 0, essentials: 'lait, œufs, beurre, pâtes, riz, oignon', memory: '', foyer: false, slots: ['petitdej', 'midi', 'soir', 'collation'], cuisinesFav: [], likes: '', banned: '', budgetDay: 0, maxTime: 0, maxDiff: 0, scanAuto: false, scanConf: 0.7, cookFont: 'm', cookAutoRead: false, planDays: 7, planAlternate: true, planRepeat: 7, planAutoShop: false, shopBudget: 0, shopSort: 'rayon', stores: '', brands: {}, mealSplit: { petitdej: 25, midi: 35, soir: 30, collation: 10 }, nutriAlerts: { kcalOver: true, protUnder: true }, fontScale: 1, anim: true, layout: 'grid', aiLang: 'français', notif: { expiry: true, daily: true, meals: true, shop: true, plan: true, freq: 'daily' }, ai: { creativity: 'normale', length: 'courtes', priority: 'equilibre', count: 3, experimental: false }, saveSearch: true };
const S = { pantry: [], spaces: DEFAULT_SPACES.map(s => ({ ...s })), moves: [], shopping: [], shopLists: [], plan: {}, fav: [], hist: [], ai: [], notes: {}, views: [], food: [], scans: [], searches: [], stats: { savedN: 0, savedEur: 0, wastedN: 0, wastedEur: 0 }, prefs: JSON.parse(JSON.stringify(DEF_PREFS)) };
const SHARED = ['pantry', 'spaces', 'moves', 'shopping', 'shopLists', 'plan', 'hist', 'ai', 'notes', 'stats'];
const KEYS = [...SHARED, 'fav', 'views', 'food', 'scans', 'searches', 'prefs'];
const F0 = () => ({ q: '', maxTime: 0, diff: 0, maxCost: 0, maxKcal: 0, minProt: 0, maxCarbs: 0, maxFat: 0, cuisine: '', meal: '', must: '', ban: '', equipOnly: true, season: false, gourmand: 0, maxMissing: '', temp: '', style: '', verified: false });
const UI = { route: 'accueil', inv: 'all', invQ: '', invTab: 'stock', F: F0(), mode: 'all', filtersOpen: false, gen: { mode: 'stock', meal: 'plat', style: '', cuisine: '', count: 0, servings: 0, maxTime: 0, budget: 0, diff: 0, maxMissing: 3, prioritize: true, complexity: '', portions: '', temp: '', type: '', tradition: '', weather: '' }, aiBusy: false, chat: [], chatBusy: false, timers: [], weekOffset: 0, demo: false, sync: 'local', members: {}, names: {}, lib: 'fav', libQ: '', nutriDay: null, review: [], openShopList: null };
let sheetRender = null, cook = null, curR = null, curServ = 2;

/* ===== Persistance : appareil + compte (privé) + foyer (partagé, optionnel) ===== */
const LS = 'frigo-fute-v1';
const lsLoad = () => { try { return JSON.parse(localStorage.getItem(LS) || 'null'); } catch { return null; } };
const lsSave = () => { try { localStorage.setItem(LS, JSON.stringify({ ...S, __demo: UI.demo })); } catch {} };
const CL = { db: null, user: null, uid: null, me: null, perso: null, foyer: null, unsubF: null, foyerOn: false };
const dirty = new Set(); let flushT = null;
function save(...keys) { if (keys.includes('pantry')) UI.demo = false; keys.forEach(k => dirty.add(k)); lsSave(); clearTimeout(flushT); flushT = setTimeout(flush, 600); }
const colFor = k => SHARED.includes(k) && CL.foyerOn ? CL.foyer : CL.perso;
async function flush() {
  if (!CL.perso) { dirty.clear(); return; }
  setSync('saving');
  for (const k of [...dirty]) {
    dirty.delete(k); if (k === 'pantry' && UI.demo) continue;
    try { await colFor(k).doc(k).set({ json: JSON.stringify(S[k]), t: Date.now() }); }
    catch { dirty.add(k); setSync('err'); clearTimeout(flushT); flushT = setTimeout(flush, 5000); return; }
  }
  setSync('ok');
}
const NESTED = ['goals', 'mealSplit', 'nutriAlerts', 'notif', 'ai', 'brands'];
function loadKey(k, v) { if (v == null) return; if (k === 'prefs') { const p = { ...JSON.parse(JSON.stringify(DEF_PREFS)), ...v }; NESTED.forEach(n => { p[n] = { ...DEF_PREFS[n], ...(v[n] || {}) }; }); S.prefs = p; } else S[k] = v; }
function applyDocs(snap, src, initial) {
  let got = false;
  for (const d of snap.docs) {
    const id = d.id;
    if (id.startsWith('m_')) { if (src === 'foyer') { try { UI.members[id.slice(2)] = d.data(); got = true; } catch {} } continue; }
    if (!KEYS.includes(id) || dirty.has(id)) continue;
    if (src === 'foyer' && !SHARED.includes(id)) continue;
    if (src === 'perso' && CL.foyerOn && SHARED.includes(id)) continue;
    if (!initial && d.metadata && d.metadata.hasPendingWrites) continue;
    try { loadKey(id, JSON.parse(d.data().json)); got = true; if (id === 'pantry') UI.demo = false; } catch {}
  }
  if (src === 'foyer') { const ids = new Set(snap.docs.map(d => d.id)); Object.keys(UI.members).forEach(m => { if (!ids.has('m_' + m)) delete UI.members[m]; }); loadNames(); }
  if (got) { migrate(); lsSave(); applyTheme(); render(); }
}
async function initCloud() {
  try {
    if (!window.claude?.use) return initSupabase();
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    if (!db || !user) return setSync('local');
    CL.db = db; CL.user = user; CL.uid = await user.id(); if (!CL.uid) return setSync('local');
    try { CL.me = await user.me(); } catch {}
    CL.perso = db.collection('data/users/' + CL.uid);
    const snap = await CL.perso.get();
    if (snap.empty) { if (!UI.demo) save(...KEYS); else setSync('ok'); } else { applyDocs(snap, 'perso', true); setSync('ok'); }
    CL.perso.onSnapshot(s => applyDocs(s, 'perso', false), () => setSync('err'));
    if (S.prefs.foyer) await connectFoyer().catch(() => toast('Le foyer partagé est inaccessible pour le moment.'));
    render();
  } catch { setSync('local'); }
}
async function connectFoyer() {
  CL.foyer = CL.db.collection('foyer');
  const snap = await CL.foyer.get();
  await CL.foyer.doc('m_' + CL.uid).set({ allergies: S.prefs.allergies, diet: S.prefs.diet, t: Date.now() }); // échoue sans droit d'écriture
  CL.foyerOn = true;
  if (!snap.docs.some(d => SHARED.includes(d.id))) SHARED.forEach(k => dirty.add(k)); else applyDocs(snap, 'foyer', true);
  CL.unsubF?.(); CL.unsubF = CL.foyer.onSnapshot(s => applyDocs(s, 'foyer', false), () => setSync('err'));
  flush();
}
async function writeMember() { if (CL.foyerOn) try { await CL.foyer.doc('m_' + CL.uid).set({ allergies: S.prefs.allergies, diet: S.prefs.diet, t: Date.now() }); } catch {} }
async function loadNames() { if (!CL.user?.profiles) return; const ids = Object.keys(UI.members); if (!ids.length) return; try { const ps = await CL.user.profiles(ids); ids.forEach(id => { UI.names[id] = ps[id]?.name || ''; }); if (UI.route === 'profil') render(); } catch {} }
function setSync(s) { UI.sync = s; const el = $('#sync'); if (!el) return; el.dataset.s = s; el.title = { ok: 'Synchronisé sur votre compte', saving: 'Enregistrement…', err: 'Hors ligne : enregistré sur cet appareil', local: 'Enregistré sur cet appareil' }[s]; el.querySelector('span').textContent = { ok: CL.foyerOn ? 'Foyer' : 'Synchro', saving: 'Sauvegarde', err: 'Hors ligne', local: 'Local' }[s]; }
function migrate() {
  if (!Array.isArray(S.spaces) || !S.spaces.length) S.spaces = DEFAULT_SPACES.map(s => ({ ...s }));
  const sp = new Set(S.spaces.map(s => s.id));
  S.pantry = (S.pantry || []).map(it => { const m = it.v === 2 ? it : { ...migrateItem(it), v: 2 }; if (!sp.has(m.loc)) m.loc = S.spaces[0].id; return m; });
  S.ai = (S.ai || []).map(r => r._n ? r : { ...normRecipe(r), _n: 1 });
  S.shopping = (S.shopping || []).map(s => s.cat ? s : { ...s, cat: guessCat(s.name) });
  S.stats = { savedN: 0, savedEur: 0, wastedN: 0, wastedEur: 0, ...(S.stats || {}) };
  S.prefs.widgets = mergeWidgets(S.prefs.widgets);
  S.prefs.slots = S.prefs.slots?.length ? S.prefs.slots : DEF_PREFS.slots;
}
function mergeWidgets(w) { const list = Array.isArray(w) ? w.filter(x => WIDGETS[x.id]) : []; Object.keys(WIDGETS).forEach((id, i) => { if (!list.some(x => x.id === id)) list.splice(Math.min(i, list.length), 0, { id, on: true }); }); return list; }
function logMove(type, it, qty, note) { S.moves.unshift({ t: Date.now(), type, name: it.name, qty: qty ?? it.qty, unit: it.unit, note: note || '', by: CL.uid && CL.foyerOn ? CL.uid : '' }); if (S.moves.length > 400) S.moves.length = 400; }
function effPrefs() { const p = S.prefs; if (!CL.foyerOn) return p; const al = new Set(p.allergies); Object.entries(UI.members).forEach(([id, m]) => { if (id !== CL.uid) (m.allergies || []).forEach(a => al.add(a)); }); return { ...p, allergies: [...al] }; }

/* ===== Thème ===== */
let hostTheme = null;
function applyTheme() {
  const root = document.documentElement, t = S.prefs.theme;
  if (t === 'light' || t === 'dark') root.dataset.theme = t; else if (hostTheme) root.dataset.theme = hostTheme; else delete root.dataset.theme;
  root.classList.remove('acc-tomate', 'acc-aubergine', 'acc-ocean', 'acc-sauge'); root.classList.add('acc-' + (S.prefs.accent || 'sauge'));
}

/* ===== IA : adaptateur de fournisseur (changer de fournisseur = ajouter une entrée) ===== */
const AI_PROVIDERS = {
  claude: {
    connect: async () => { try { return window.claude?.use ? await window.claude.use('sample') : null; } catch { return null; } },
    json: (h, input, o) => h.json(input, o), text: (h, input, o) => h(input, o),
    images: async h => { try { return (await h.limits?.())?.images !== false; } catch { return true; } },
  },
};
const AI = {
  name: 'claude', _p: null,
  h() { if (!this._p) this._p = AI_PROVIDERS[this.name].connect(); return this._p; },
  async ready() { const h = await this.h(); if (!h) toast(IN_CLAUDE ? 'L’IA n’est pas disponible ici. Ouvrez Tambouille sur claude.ai en étant connecté.' : 'Connectez-vous à votre compte Tambouille pour utiliser l’IA.', IN_CLAUDE ? null : { act: 'goAccount', label: 'Se connecter' }); return !!h; },
  async json(input, o = {}) { return AI_PROVIDERS[this.name].json(await this.h(), input, { modelTier: 'default', ...o }); },
  async text(input, o = {}) { return AI_PROVIDERS[this.name].text(await this.h(), input, { modelTier: 'default', ...o }); },
  async images() { return AI_PROVIDERS[this.name].images(await this.h()); },
};
function aiErr(e) { const c = e?.code; toast(c === 'not_configured' ? 'L’IA du site n’est pas encore configurée (clé Anthropic manquante côté serveur).' : c === 'auth' ? 'Session expirée : reconnectez-vous.' : c === 'network' ? 'Serveur IA injoignable. Vérifiez votre connexion.' : c === 'not_granted' ? 'Accès à l’IA refusé. Autorisez-le dans le menu Autorisations de la page.' : c === 'rate_limited' ? 'Trop de demandes à l’IA. Réessayez dans un instant.' : c === 'invalid_json' ? 'La réponse de l’IA était incomplète. Réessayez.' : 'L’IA n’a pas pu répondre. Vérifiez votre connexion et réessayez.'); }
async function compress(file, max = 1280) {
  try { const bmp = await createImageBitmap(file); const k = Math.min(1, max / Math.max(bmp.width, bmp.height)); const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k); c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); return await new Promise(r => c.toBlob(b => r(b || file), 'image/jpeg', 0.82)); } catch { return file; }
}
const CAT_KEYS = Object.keys(CATS).join('|');
const ITEM_SCHEMA = `{"items":[{"name":"nom courant en français","brand":"marque si lisible sinon vide","qty":nombre,"unit":"g|kg|ml|cl|l|pc","cat":"${CAT_KEYS}","loc":"frigo|placard|congelo","exp":"AAAA-MM-JJ si une date est lisible sinon null","expType":"DLC (à consommer jusqu'au) | DDM (de préférence avant) | est (pas de date lisible)","shelfDays":jours de conservation estimés si pas de date,"confidence":0 à 1,"nutri":{"kcal":0,"p":0,"c":0,"f":0} pour 100 g si le tableau est lisible sinon null}]}`;
const RECIPE_SCHEMA = `{"title":"","description":"une phrase","prep":minutes,"cook":minutes,"difficulty":1-3,"servings":n,"kcal":par portion,"protein":g par portion,"carbs":g,"fat":g,"fiber":g,"cuisine":"Française|Italienne|Indienne|Mexicaine|Chinoise|Japonaise|Thaïlandaise|Libanaise|Marocaine|Grecque|Espagnole|Américaine|Fusion…","meal":"plat|entree|accompagnement|dessert|petitdej|collation|boisson","gourmand":1-3,"equipment":["Poêle","Casserole","Four","Mixeur","Saladier"…],"allergens":[${Object.keys(ALLERGENS).map(a => `"${a}"`).join('|')}],"hue":teinte 0-360 évoquant le plat,"ingredients":[{"name":"","qty":nombre,"unit":"g|kg|ml|cl|l|pc|cs|cc","optional":false}],"steps":["étapes détaillées avec durées (ex. cuire 10 min)"],"tip":"astuce","storage":"conservation et réchauffage"}`;

/* ===== Recettes ===== */
const allRecipes = () => [...S.ai, ...BASE];
const getR = id => allRecipes().find(r => r.id === id);
const isFav = id => S.fav.includes(id);
const servings = () => S.prefs.servings || 2;
function scoredList(F = {}, mode = 'all', opts = {}) {
  const P = effPrefs(), m = MODES[mode] ? MODES[mode][1] : () => true;
  const cm = !opts.noCmode && UI.cmode ? COOK_MODES[UI.cmode] : null;
  const F2 = { ...(opts.noProfile ? {} : { maxTime: P.maxTime || 0, diff: P.maxDiff || 0 }), ...(cm?.F || {}), ...Object.fromEntries(Object.entries(F).filter(([, v]) => v !== '' && v !== 0 && v !== false && v != null)) };
  const list = allRecipes().filter(r => passesFilters(r, F2, P)).map(r => ({ r, a: analyze(r, S.pantry, servings(), P.staples), cost: recipeCost(r, servings()) }))
    .filter(x => m(x.r, x.a) && (!cm?.test || cm.test(x.r, x.a, x.cost)) && (F2.maxMissing == null || x.a.missing.length <= F2.maxMissing));
  list.forEach(x => { x.a.score += prefBonus(x, P); if (cm?.sort) x.a.score += cm.sort(x); });
  return list;
}
const FOOD_HUES = [6, 14, 24, 34, 44, 52, 70, 88, 105, 128, 145];
function hash(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }
function art(r, cls = '') {
  const h = hash(r.id), b = [];
  for (let i = 0; i < 5; i++) { const a = (h >> (i * 3)) % 360, d = 10 + ((h >> (i * 2)) % 18); b.push(`<i style="--x:${(50 + Math.cos(a) * d).toFixed(1)}%;--y:${(52 + Math.sin(a) * d * 0.8).toFixed(1)}%;--s:${12 + (h >> i) % 12}%;--hh:${FOOD_HUES[(h >> (i * 2 + 1)) % FOOD_HUES.length]};--rot:${a}deg"></i>`); }
  return `<div class="art ${cls}" style="--h:${r.hue}"><span class="plate"></span>${b.join('')}</div>`;
}
function statusPill(a) { if (a.canCook) return `<span class="pill ok">${ic('check')}100 % dispo</span>`; const n = a.missing.length; return `<span class="pill ${n <= 2 ? 'warn' : 'muted'}">${a.pct} % · manque ${n}</span>`; }
function recipeCard({ r, a, cost }) {
  return `<button class="rcard" data-act="openRecipe" data-id="${r.id}">${art(r)}<div class="rbody">
    <div class="rtags">${statusPill(a)}${a.gaspi ? `<span class="pill gaspi">${ic('leaf')}Anti-gaspi</span>` : ''}${r.src !== 'base' ? `<span class="pill ai">${ic(r.src === 'perso' ? 'edit' : 'spark')}${r.src === 'perso' ? 'Perso' : 'IA'}</span>` : ''}</div>
    <h3>${esc(r.title)}</h3>
    <div class="meta">${ic('clock')}${r.time} min<span>·</span>${r.kcal ? `${r.kcal} kcal<span>·</span>` : ''}${euro(cost / servings())}/pers.</div>
  </div>${isFav(r.id) ? `<span class="favdot" aria-label="Favori">${ic('heart')}</span>` : ''}${S.notes[r.id]?.stars ? `<span class="stars-mini" aria-label="${S.notes[r.id].stars} étoiles">${'★'.repeat(S.notes[r.id].stars)}</span>` : ''}</button>`;
}
function expInfo(it) {
  const s = safety(it), d = s.d;
  if (s.level === 'expired') return { lab: 'DLC dépassée', cls: 'bad', s };
  if (s.level === 'check') return { lab: 'À vérifier', cls: 'bad', s };
  if (s.level === 'ddm') return { lab: 'DDM dépassée', cls: 'warn', s };
  if (d == null) return { lab: '', cls: '', s };
  if (d === 0) return { lab: 'Aujourd’hui', cls: 'bad', s }; if (d === 1) return { lab: 'Demain', cls: 'bad', s };
  if (d <= 3) return { lab: 'J-' + d, cls: 'warn', s };
  return { lab: d > 45 ? fmtDate(effExp(it), { month: 'short', year: '2-digit' }) : 'J-' + d, cls: 'okc', s };
}
const spaceName = id => S.spaces.find(s => s.id === id)?.name || 'Frigo';
const spaceKind = id => S.spaces.find(s => s.id === id)?.kind || 'frigo';
const emptyState = (t, s) => `<div class="empty"><b>${t}</b><span>${s}</span></div>`;
function stepper(name, v, lab) { return `<div class="stepper" role="group" aria-label="${esc(lab || name)}"><button class="icon sm" data-act="step" data-n="${name}" data-d="-1" aria-label="Moins">${ic('minus')}</button><b>${v}</b><button class="icon sm" data-act="step" data-n="${name}" data-d="1" aria-label="Plus">${ic('plus')}</button></div>`; }
function prefSummary(P = effPrefs()) { const a = [P.diet ? DIETS[P.diet] : '', ...(P.allergies || []).map(x => 'sans ' + ALLERGENS[x].toLowerCase())].filter(Boolean); return a.length ? a.join(', ') : 'Aucune restriction'; }
function stepFor(u) { return u === 'g' || u === 'ml' ? 50 : u === 'cl' ? 5 : u === 'kg' || u === 'l' ? 0.25 : 1; }
function weekStart(off) { const d = new Date(todayISO() + 'T12:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + off * 7); return d.toISOString().slice(0, 10); }
const watchList = () => S.pantry.filter(p => p.qty > 0).map(p => ({ p, e: expInfo(p) })).filter(({ e }) => !e.s.safe || e.s.level === 'ddm' || (e.s.d != null && e.s.d <= S.prefs.alertDays)).sort((a, b) => (a.e.s.d ?? 0) - (b.e.s.d ?? 0));
const forgotten = () => S.pantry.filter(p => p.qty > 0 && spaceKind(p.loc) === 'frigo' && ['fruitleg', 'laitier', 'viande', 'poisson', 'frais', 'autre'].includes(p.cat) && Date.now() - (p.upd || p.added) > 14 * 86400000 && safety(p).safe);
const missingEssentials = () => S.prefs.essentials.split(',').map(s => s.trim()).filter(Boolean).filter(e => !S.pantry.some(p => p.qty > 0 && safety(p).safe && (nameMatches(e, p.name) || nameMatches(p.name, e))) && !S.shopping.some(s => !s.done && nameMatches(e, s.name)));
function techify(text) { let h = esc(text); if (S.prefs.level !== 'debutant') return h; for (const t of Object.keys(TECH)) { const re = new RegExp(`(^|[^\\p{L}])(${t})(?=[^\\p{L}]|$)`, 'iu'); h = h.replace(re, `$1<button class="tech" data-act="tech" data-t="${esc(t)}">$2</button>`); } return h; }

/* ===== Vues ===== */
const ROUTES = { accueil: ['home', 'Accueil'], scanner: ['scan', 'Scanner'], inventaire: ['fridge', 'Inventaire'], recettes: ['chef', 'Recettes'], assistant: ['chat', 'Assistant'], planning: ['cal', 'Planning'], courses: ['cart', 'Courses'], nutrition: ['chart', 'Nutrition'], favoris: ['book', 'Favoris'], profil: ['user', 'Profil'] };
const W = {
  alerts() {
    const w = watchList(); if (!w.length) return '';
    const bad = w.filter(x => !x.e.s.safe);
    const g = scoredList({}, 'gaspi').sort((a, b) => b.a.score - a.a.score).slice(0, 3);
    return `<section class="block"><div class="bhead"><h2>${ic('bell')}À consommer vite</h2><button class="link" data-act="go" data-r="inventaire" data-inv="watch">Gérer ${ic('right')}</button></div>
    ${bad.length ? `<p class="alertline bad">${ic('info')}${pl(bad.length, 'aliment')} à jeter ou à vérifier : ${bad.slice(0, 4).map(x => esc(x.p.name)).join(', ')}.</p>` : ''}
    <div class="chips">${w.filter(x => x.e.s.safe).slice(0, 10).map(({ p, e }) => `<button class="chip ${e.cls}" data-act="editItem" data-id="${p.id}">${esc(p.name)} <em>${e.lab}</em></button>`).join('')}</div>
    ${g.length ? `<div class="grid g3">${g.map(recipeCard).join('')}</div>` : ''}</section>`;
  },
  tonight() { return `<div class="tonightrow"><button class="tonight" data-act="tonight">${ic('spark')}<span>Qu’est-ce qu’on mange ce soir&nbsp;?</span></button><button class="btn ghost wheelbtn" data-act="wheel">${ic('wheel')}Laisser la roue choisir</button></div>`; },
  today() {
    const p = S.plan[todayISO()] || {}; const items = S.prefs.slots.map(s => [s, p[s] && getR(p[s])]).filter(x => x[1]);
    return `<section class="block"><div class="bhead"><h2>${ic('cal')}Au menu aujourd’hui</h2><button class="link" data-act="go" data-r="planning">Planning ${ic('right')}</button></div>
    ${items.length ? `<ul class="hist">${items.map(([s, r]) => `<li><button data-act="openRecipe" data-id="${r.id}"><span><small>${SLOTS[s]}</small> ${esc(r.title)}</span><em>${r.time} min</em></button></li>`).join('')}</ul>` : `<div class="empty sm"><span>Rien de prévu aujourd’hui.</span><button class="link" data-act="go" data-r="planning">Générer un menu</button></div>`}</section>`;
  },
  suggestions() {
    const sc = scoredList({ equipOnly: true }).filter(x => x.r.meal === 'plat').sort((a, b) => b.a.score - a.a.score).slice(0, 4);
    return `<section class="block"><div class="bhead"><h2>Suggestions pour vous</h2><button class="link" data-act="go" data-r="recettes">Tout voir ${ic('right')}</button></div><div class="grid g4">${sc.map(recipeCard).join('') || emptyState('Aucune recette ne correspond.', 'Ajustez vos préférences dans le profil.')}</div></section>`;
  },
  nutrition() { const t = dayTotals(todayISO()), g = S.prefs.goals; return `<section class="block"><div class="bhead"><h2>${ic('chart')}Nutrition du jour</h2><button class="link" data-act="go" data-r="nutrition">Détails ${ic('right')}</button></div><div class="macros">${macroBar('Calories', t.kcal, g.kcal, 'kcal')}${macroBar('Protéines', t.p, g.p, 'g')}</div></section>`; },
  gaspi() { const s = S.stats; return `<section class="block"><div class="bhead"><h2>${ic('leaf')}Bilan anti-gaspi</h2></div><div class="stats"><div><b>${s.savedN}</b><span>aliments sauvés</span></div><div><b>${euro(s.savedEur)}</b><span>économisés (estim.)</span></div><div class="${s.wastedN ? 'alert' : ''}"><b>${s.wastedN}</b><span>jetés</span></div></div></section>`; },
  shopping() { const n = S.shopping.filter(s => !s.done).length, me = missingEssentials(); if (!n && !me.length) return ''; return `<section class="block"><div class="bhead"><h2>${ic('cart')}Courses</h2><button class="link" data-act="go" data-r="courses">Ouvrir ${ic('right')}</button></div><p class="muted-t">${pl(n, 'article')} à acheter${me.length ? ` · basiques manquants : ${esc(me.join(', '))}` : ''}.</p></section>`; },
  season() { const m = new Date().getMonth() + 1; const list = Object.keys(SEASON).filter(k => inSeason(k, m)); return `<section class="block"><div class="bhead"><h2>${ic('leaf')}De saison en ${new Date().toLocaleDateString('fr-FR', { month: 'long' })}</h2></div><div class="chips">${list.map(k => `<button class="chip btnchip" data-act="searchIng" data-q="${esc(k)}">${esc(k)}</button>`).join('')}</div></section>`; },
  challenge() { const c = weeklyChallenge(); return `<section class="block"><div class="bhead"><h2>${ic('trophy')}Défi de la semaine</h2></div><div class="challenge"><b>${esc(c.label)}</b><div class="bar"><span style="width:${Math.min(100, c.done / c.goal * 100)}%"></span></div><small>${Math.min(c.done, c.goal)} / ${c.goal}${c.done >= c.goal ? ' · réussi !' : ''}</small></div></section>`; },
};
const VIEWS = {
  accueil() {
    const h = new Date().getHours(); const name = CL.me?.name ? ', ' + esc(CL.me.name.split(' ')[0]) : '';
    const soon = watchList().filter(x => x.e.s.safe).length, can = scoredList({}, 'full').length;
    return `${guestBanner()}${UI.demo ? `<div class="banner"><div><b>Inventaire d’exemple.</b> Ces aliments ne sont pas les vôtres : scannez votre frigo ou videz-le.</div><div class="row"><button class="btn sm" data-act="keepDemo">Garder pour tester</button><button class="btn sm ghost" data-act="clearDemo">Vider</button></div></div>` : ''}
    <section class="hero"><p class="eyebrow">${h < 11 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'}${name} · ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      <h1>On cuisine quoi<br>avec ce qu’il y a&nbsp;?</h1>
      <div class="stats"><button data-act="go" data-r="inventaire"><b>${S.pantry.filter(p => p.qty > 0).length}</b><span>aliments en stock</span></button><button data-act="go" data-r="recettes" data-mode="full"><b>${can}</b><span>recettes 100 % dispo</span></button><button data-act="go" data-r="inventaire" data-inv="watch" class="${soon ? 'alert' : ''}"><b>${soon}</b><span>à consommer vite</span></button></div>
    </section>
    ${S.prefs.widgets.filter(w => w.on).map(w => W[w.id]()).join('')}
    <p class="custom"><button class="link" data-act="profilSec" data-s="accueil">${ic('sliders')}Personnaliser l’accueil</button></p>`;
  },
  inventaire() {
    if (UI.invTab === 'hist') return invHeader() + `<ul class="moves">${S.moves.slice(0, 150).map(m => `<li><span class="mt ${m.type}">${{ add: 'Ajout', use: 'Utilisé', edit: 'Modifié', del: 'Supprimé', waste: 'Jeté', freeze: 'Congelé', buy: 'Acheté', open: 'Ouvert' }[m.type] || m.type}</span><b>${esc(m.name)}</b><em>${esc(fmtQty(m.qty, m.unit))}${m.note && m.note !== 'scan' ? ' · ' + esc(m.note) : m.note === 'scan' ? ' · scan' : ''}</em><small>${new Date(m.t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}${m.by && UI.names[m.by] ? ' · ' + esc(UI.names[m.by]) : ''}</small></li>`).join('') || `<li>${emptyState('Aucun mouvement.', 'Ajouts, consommations et pertes apparaîtront ici.')}</li>`}</ul>`;
    if (UI.inv === 'watch') return invHeader() + watchView();
    const q = norm(UI.invQ);
    const list = S.pantry.filter(p => p.qty > 0 && (UI.inv === 'all' || p.loc === UI.inv) && (!q || norm(p.name + ' ' + p.brand).includes(q)));
    const groups = CAT_ORDER.map(c => [c, list.filter(p => p.cat === c).sort((a, b) => (daysLeft(effExp(a)) ?? 9e3) - (daysLeft(effExp(b)) ?? 9e3))]).filter(g => g[1].length);
    const empty = S.pantry.filter(p => p.qty <= 0);
    return invHeader() + `<div class="searchline">${ic('search')}<input id="invQ" data-live="invQ" placeholder="Rechercher un aliment ou une marque" value="${esc(UI.invQ)}"></div>
    ${groups.map(([c, items]) => `<details class="catgrp" open><summary><b>${CATS[c].label}</b><small>${items.length}</small></summary><ul class="stock">${items.map(stockRow).join('')}</ul></details>`).join('') || emptyState(S.pantry.length ? 'Rien ici.' : 'Votre inventaire est vide.', S.pantry.length ? 'Changez d’espace ou de recherche.' : 'Ouvrez le Scanner pour photographier votre frigo.')}
    ${empty.length ? `<details class="catgrp"><summary><b>Épuisés</b><small>${empty.length}</small></summary><ul class="stock">${empty.map(stockRow).join('')}</ul><button class="link danger" data-act="purgeEmpty">Retirer les produits épuisés</button></details>` : ''}`;
  },
  recettes() {
    const F = UI.F, G = UI.gen;
    const list = scoredList(F, UI.mode).sort((x, y) => ((y.r.created || 0) > Date.now() - 6e5) - ((x.r.created || 0) > Date.now() - 6e5) || y.a.score - x.a.score);
    const nF = ['maxTime', 'diff', 'maxCost', 'maxKcal', 'minProt', 'maxCarbs', 'maxFat', 'cuisine', 'meal', 'must', 'ban', 'season', 'gourmand', 'temp', 'style', 'verified'].filter(k => F[k]).length + (F.maxMissing !== '' && F.maxMissing != null ? 1 : 0);
    const cuisines = [...new Set(allRecipes().map(r => r.cuisine))].sort();
    const sel = (k, lab, pairs) => `<label class="fld"><span>${lab}</span><select id="f_${k}" data-f="${k}">${opt(pairs, F[k])}</select></label>`;
    return `<div class="vhead"><h1>Recettes</h1><p>${pl(list.length, 'recette')} · classées selon votre stock, vos préférences et vos filtres.</p></div>${cmodeBanner()}
    <section class="aibox"><div><h2>${ic('spark')}Créer des recettes avec l’IA</h2><p>3 recettes originales à partir de vos ${S.pantry.filter(p => p.qty > 0 && safety(p).safe).length} aliments utilisables, périssables en priorité. Filtres, matériel et allergies respectés.</p></div>
      <div class="genopts">
        <div class="seg sm">${[['stock', '100 % mon stock'], ['achats', '+ 1 à 3 achats']].map(([k, l]) => `<button aria-selected="${G.mode === k}" data-act="gen" data-k="mode" data-v="${k}">${l}</button>`).join('')}</div>
        <label class="fld"><span>Type</span><select id="g_meal" data-g="meal">${opt(Object.entries(MEALS), G.meal)}</select></label>
        <label class="fld"><span>Envie</span><select id="g_style" data-g="style">${opt([['', 'Au choix'], ['rapide', 'Rapide'], ['économique', 'Économique'], ['gourmande', 'Gourmande'], ['équilibrée', 'Équilibrée'], ['riche en protéines', 'Protéinée'], ['originale et créative', 'Originale']], G.style)}</select></label>
        <label class="fld"><span>Cuisine</span><input id="g_cuisine" data-g="cuisine" value="${esc(G.cuisine)}" placeholder="Indifférent, japonaise…"></label>
        <button class="btn accent" data-act="genAI" ${UI.aiBusy ? 'disabled' : ''}>${UI.aiBusy ? '<span class="spin"></span>Création…' : ic('spark') + 'Générer'}</button>
      </div>${genAdvanced()}</section>
    <div class="toolbar"><div class="searchline grow">${ic('search')}<input id="recQ" data-live="F.q" placeholder="Nom, ingrédient ou cuisine" value="${esc(F.q)}"></div>
      <button class="btn ghost" data-act="toggleFilters" aria-expanded="${UI.filtersOpen}">${ic('sliders')}<span>Filtres${nF ? ` (${nF})` : ''}</span></button><button class="icon" data-act="wheel" aria-label="Roue aléatoire">${ic('wheel')}</button></div>${recentSearches()}${compareTray()}
    <div class="seg">${Object.entries(MODES).map(([k, [l]]) => `<button aria-selected="${UI.mode === k}" data-act="mode" data-m="${k}">${l}</button>`).join('')}</div>
    ${UI.filtersOpen ? `<div class="filters">
      ${sel('maxTime', 'Temps max', [[0, 'Indifférent'], [15, '15 min'], [20, '20 min'], [30, '30 min'], [45, '45 min'], [60, '1 h']])}
      ${sel('maxCost', 'Budget / portion', [[0, 'Indifférent'], [1, '≤ 1 €'], [1.5, '≤ 1,50 €'], [2.5, '≤ 2,50 €'], [4, '≤ 4 €']])}
      ${sel('diff', 'Difficulté', [[0, 'Toutes'], [1, 'Facile'], [2, 'Moyenne au plus']])}
      ${sel('meal', 'Type de repas', [['', 'Tous'], ...Object.entries(MEALS)])}
      ${sel('cuisine', 'Cuisine', [['', 'Toutes'], ...cuisines.map(c => [c, c])])}
      ${sel('maxKcal', 'Calories / portion', [[0, 'Indifférent'], [300, '≤ 300'], [450, '≤ 450'], [600, '≤ 600']])}
      ${sel('minProt', 'Protéines min.', [[0, 'Indifférent'], [15, '≥ 15 g'], [25, '≥ 25 g'], [30, '≥ 30 g']])}
      ${sel('maxCarbs', 'Glucides max.', [[0, 'Indifférent'], [30, '≤ 30 g'], [50, '≤ 50 g'], [70, '≤ 70 g']])}
      ${sel('maxFat', 'Lipides max.', [[0, 'Indifférent'], [15, '≤ 15 g'], [25, '≤ 25 g']])}
      ${sel('gourmand', 'Gourmandise', [[0, 'Indifférent'], [2, 'Plutôt gourmand'], [3, 'Très gourmand']])}
      <label class="fld"><span>Ingrédients obligatoires</span><input id="f_must" data-live="F.must" value="${esc(F.must)}" placeholder="poulet, riz"></label>
      <label class="fld"><span>Ingrédients interdits</span><input id="f_ban" data-live="F.ban" value="${esc(F.ban)}" placeholder="coriandre"></label>
      <div class="fld"><span>Personnes</span>${stepper('servings', servings(), 'Nombre de personnes')}</div>
      ${sel('maxMissing', 'Manquants max.', [['', 'Indifférent'], [0, 'Aucun'], [1, '1'], [2, '2'], [3, '3']])}
      ${sel('temp', 'Chaud ou froid', [['', 'Indifférent'], ['chaud', 'Chaud'], ['froid', 'Froid']])}
      ${sel('style', 'Complexité', [['', 'Indifférent'], ['simple', 'Simple'], ['elabore', 'Élaborée']])}
      <label class="check"><input type="checkbox" id="f_verified" data-fc="verified" ${F.verified ? 'checked' : ''}> Recettes vérifiées uniquement</label>
      <label class="check"><input type="checkbox" id="f_season" data-fc="season" ${F.season ? 'checked' : ''}> De saison uniquement</label>
      <label class="check"><input type="checkbox" id="f_equip" data-fc="equipOnly" ${F.equipOnly ? 'checked' : ''}> Avec mon matériel</label>
      <div class="fld wide"><span>Allergies et régime (exclusion stricte)</span><button class="btn ghost sm" data-act="profilSec" data-s="prefs">${esc(prefSummary())}</button></div>
      <button class="link" data-act="resetFilters">Réinitialiser les filtres</button></div>` : ''}
    <div class="grid g3">${list.map(recipeCard).join('') || emptyState('Aucune recette avec ces critères.', 'Élargissez les filtres ou générez une recette avec l’IA.')}</div>`;
  },
  assistant() { return `<div class="vhead"><h1>Assistant</h1><p>Il connaît votre inventaire, vos préférences et vos recettes. Il peut créer ou adapter une recette, l’enregistrer et remplir votre liste de courses.</p></div><div class="chatpage">${chatHTML()}</div>`; },
  planning() {
    const start = weekStart(UI.weekOffset), days = [...Array(7)].map((_, i) => addDays(start, i)), T = todayISO(), slots = S.prefs.slots;
    const slot = (d, s) => { const id = S.plan[d]?.[s]; if (id === 'libre') return `<div class="slot full libre"><small>${SLOTS[s]}</small><span class="sname">Repas libre</span><div class="sact"><button class="icon xs" data-act="unplan" data-d="${d}" data-s="${s}" aria-label="Retirer">${ic('x')}</button></div></div>`; const r = id && getR(id); return r ? `<div class="slot full"><small>${SLOTS[s]}</small><button class="sname" data-act="openRecipe" data-id="${r.id}">${esc(r.title)}</button><div class="sact"><button class="icon xs" data-act="replaceSlot" data-d="${d}" data-s="${s}" aria-label="Remplacer">${ic('refresh')}</button><button class="icon xs" data-act="moveSlot" data-d="${d}" data-s="${s}" aria-label="Déplacer">${ic('swap')}</button><button class="icon xs" data-act="unplan" data-d="${d}" data-s="${s}" aria-label="Retirer">${ic('x')}</button></div></div>` : `<button class="slot" data-act="pickPlan" data-d="${d}" data-s="${s}">${ic('plus')}<span>${SLOTS[s]}</span></button>`; };
    const sum = weekSummary(days);
    return `<div class="vhead"><h1>Planning</h1><p>Semaine du ${fmtDate(start, { day: 'numeric', month: 'long' })}</p></div>
    <div class="row wrap gap"><div class="row"><button class="icon" data-act="week" data-w="-1" aria-label="Semaine précédente">${ic('left')}</button><button class="btn ghost sm" data-act="week" data-w="0">Cette semaine</button><button class="icon" data-act="week" data-w="1" aria-label="Semaine suivante">${ic('right')}</button></div>
      <div class="row wrap"><button class="btn ghost" data-act="autoPlan" data-n="${S.prefs.planDays}">${ic('spark')}Générer ${S.prefs.planDays === 7 ? 'la semaine' : pl(S.prefs.planDays, 'jour')}</button><button class="btn" data-act="planToShop">${ic('cart')}Courses de la semaine</button></div></div>${planOptions()}
    <div class="wsum"><div><b>${euro(sum.cost)}</b><span>coût estimé${S.prefs.budgetWeek ? ` / ${euro(S.prefs.budgetWeek)}` : ''}</span></div><div><b>${sum.kcal || '–'}</b><span>kcal / jour planifié / pers.</span></div><div><b>${sum.p || '–'} g</b><span>protéines / jour</span></div><div><b>${sum.meals}</b><span>repas prévus</span></div>
      <label class="fld"><span>Budget semaine (€)</span><input id="budgetWeek" type="number" min="0" step="5" inputmode="decimal" data-pref="budgetWeek" value="${S.prefs.budgetWeek || ''}" placeholder="Aucun"></label></div>
    ${S.prefs.budgetWeek && sum.cost > S.prefs.budgetWeek ? `<p class="alertline warn">${ic('info')}Budget dépassé de ${euro(sum.cost - S.prefs.budgetWeek)}. Remplacez quelques repas ou régénérez.</p>` : ''}
    <div class="week" style="--slots:${slots.length}">${days.map(d => `<div class="day ${d === T ? 'today' : ''} ${d < T ? 'past' : ''}"><div class="dname"><b>${fmtDate(d, { weekday: 'short' })}</b><span>${new Date(d + 'T12:00').getDate()}</span></div>${slots.map(s => slot(d, s)).join('')}</div>`).join('')}</div>
    <p class="note">${ic('info')}Le menu automatique utilise d’abord vos aliments périssables, évite de répéter un plat dans la semaine, réutilise les ingrédients à acheter et respecte votre budget.</p>`;
  },
  favoris() {
    const tabs = [['fav', 'Favoris'], ['mine', 'Mes recettes'], ['recent', 'Vues récemment'], ['hist', 'Historique']];
    const q = norm(UI.libQ), match = r => !q || norm(r.title + ' ' + r.ingr.map(i => i.n).join(' ')).includes(q);
    const P = effPrefs(), wrap = r => ({ r, a: analyze(r, S.pantry, servings(), P.staples), cost: recipeCost(r, servings()) });
    let body;
    if (UI.lib === 'hist') body = `<ul class="hist">${S.hist.filter(h => !q || norm(h.title).includes(q)).map(h => `<li><button data-act="openRecipe" data-id="${h.rid}"><span>${esc(h.title)}${h.rating ? ` <i class="stars-i">${'★'.repeat(h.rating)}</i>` : ''}</span><em>${new Date(h.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · ${h.servings} pers.</em></button></li>`).join('') || `<li>${emptyState('Pas encore de recette cuisinée.', 'Lancez le mode cuisine depuis une recette.')}</li>`}</ul>`;
    else {
      const ids = UI.lib === 'fav' ? S.fav : UI.lib === 'recent' ? S.views : S.ai.map(r => r.id);
      const rs = ids.map(getR).filter(Boolean).filter(match).map(wrap);
      const groups = UI.lib === 'mine' ? Object.entries(MEALS).map(([m, l]) => [l, rs.filter(x => x.r.meal === m)]).filter(g => g[1].length) : [['', rs]];
      body = rs.length ? groups.map(([l, g]) => `${l ? `<h3 class="aisle">${l}</h3>` : ''}<div class="grid g3">${g.map(recipeCard).join('')}</div>`).join('') : emptyState({ fav: 'Aucun favori.', recent: 'Aucune recette consultée.', mine: 'Aucune recette personnelle.' }[UI.lib], { fav: 'Touchez le cœur d’une recette pour la retrouver ici.', recent: 'Les recettes ouvertes apparaissent ici.', mine: 'Créez, importez ou générez une recette.' }[UI.lib]);
    }
    return `<div class="vhead"><h1>Favoris et bibliothèque</h1><p>${pl(S.fav.length, 'favori')} · ${pl(S.ai.length, 'recette personnelle', 'recettes personnelles')}</p></div>
    <div class="row wrap"><button class="btn accent" data-act="newRecipe">${ic('plus')}Créer une recette</button><button class="btn ghost" data-act="importRecipe">${ic('upload')}Importer un texte</button><button class="btn ghost" data-act="pick" data-k="dish">${ic('camera')}Depuis une photo de plat</button></div>
    <div class="seg">${tabs.map(([k, l]) => `<button aria-selected="${UI.lib === k}" data-act="lib" data-v="${k}">${l}</button>`).join('')}</div>
    <div class="searchline">${ic('search')}<input id="libQ" data-live="libQ" placeholder="Rechercher par nom ou ingrédient" value="${esc(UI.libQ)}"></div>${body}`;
  },
};
function invHeader() {
  const n = S.pantry.filter(p => p.qty > 0).length, w = watchList().length;
  return `<div class="vhead row gap"><div><h1>Inventaire</h1><p>${pl(n, 'aliment')} · ${pl(S.spaces.length, 'espace')}</p></div><button class="btn accent" data-act="newItem">${ic('plus')}Ajouter</button></div>
  <div class="seg">${[['stock', 'Stock'], ['hist', 'Historique']].map(([k, l]) => `<button aria-selected="${UI.invTab === k}" data-act="invTab" data-v="${k}">${l}</button>`).join('')}</div>
  ${UI.invTab === 'stock' ? `<div class="seg">${[['all', 'Tout', n], ['watch', 'À surveiller', w], ...S.spaces.map(s => [s.id, s.name, S.pantry.filter(p => p.qty > 0 && p.loc === s.id).length])].map(([k, l, c]) => `<button aria-selected="${UI.inv === k}" data-act="inv" data-v="${esc(k)}">${esc(l)}<small>${c}</small></button>`).join('')}<button data-act="spaces" aria-label="Gérer les espaces">${ic('gear')}</button></div>` : ''}`;
}
function stockRow(p) {
  const e = expInfo(p);
  return `<li class="srow ${e.cls}"><button class="sinfo" data-act="editItem" data-id="${p.id}">${p.photo ? `<img src="${esc(photoSrc(p.photo))}" alt="" loading="lazy">` : ''}<span><b>${esc(p.name)}${p.uncertain ? ' <i class="tag warn">à vérifier</i>' : ''}${p.state !== 'neuf' ? ` <i class="tag">${p.state === 'ouvert' ? 'ouvert' : 'entamé'}</i>` : ''}</b><small>${esc([p.brand, spaceName(p.loc)].filter(Boolean).join(' · '))}</small></span></button>
    <span class="exp ${e.cls}">${e.lab}${e.lab ? `<i>${p.expType === 'est' ? '≈' : p.expType}</i>` : ''}</span>
    <div class="qty"><button class="icon sm" data-act="qty" data-id="${p.id}" data-d="-1" aria-label="Diminuer ${esc(p.name)}">${ic('minus')}</button><span>${esc(fmtQty(p.qty, p.unit)) || '0'}</span><button class="icon sm" data-act="qty" data-id="${p.id}" data-d="1" aria-label="Augmenter ${esc(p.name)}">${ic('plus')}</button></div></li>`;
}
function watchView() {
  const w = watchList(), fg = forgotten(), opened = S.pantry.filter(p => p.qty > 0 && p.state !== 'neuf' && safety(p).safe && !w.some(x => x.p.id === p.id));
  const card = ({ p, e }) => `<li class="wrow ${e.cls}"><div><b>${esc(p.name)}</b><span>${e.lab ? e.lab + ' · ' : ''}${e.s.note ? esc(e.s.note) : `${esc(fmtQty(p.qty, p.unit))} · ${esc(spaceName(p.loc))}`}</span></div><div class="row wrap">
    ${e.s.safe ? `<button class="btn sm ghost" data-act="cookWith" data-id="${p.id}">${ic('chef')}Recettes</button>${CATS[p.cat].freeze && spaceKind(p.loc) !== 'congelo' ? `<button class="btn sm ghost" data-act="freeze" data-id="${p.id}">${ic('snow')}Congeler</button>` : ''}<button class="btn sm ghost" data-act="consumed" data-id="${p.id}">${ic('check')}Consommé</button>` : `<button class="btn sm ghost" data-act="editItem" data-id="${p.id}">${ic('edit')}Corriger la date</button>`}
    <button class="btn sm ghost danger" data-act="waste" data-id="${p.id}">${ic('trash')}Jeté</button></div></li>`;
  return `${w.length ? `<ul class="watch">${w.map(card).join('')}</ul>` : emptyState('Rien d’urgent.', `Aucun aliment ne périme dans les ${pl(S.prefs.alertDays, 'prochain jour', 'prochains jours')}.`)}
  ${opened.length ? `<div class="bhead"><h3>Produits ouverts</h3></div><ul class="watch">${opened.map(p => card({ p, e: expInfo(p) })).join('')}</ul>` : ''}
  ${fg.length ? `<div class="bhead"><h3>Oubliés au frigo ?</h3><small class="muted-t">pas touchés depuis 2 semaines</small></div><ul class="watch">${fg.map(p => card({ p, e: expInfo(p) })).join('')}</ul>` : ''}
  <p class="note">${ic('info')}DLC « à consommer jusqu’au » : date de sécurité, à ne jamais dépasser. DDM « de préférence avant » : le produit reste consommable après si l’emballage est intact. Tambouille n’utilise jamais un produit dont la DLC est dépassée.</p>`;
}
function macroBar(l, v, g, u) { const pc = g ? Math.min(100, v / g * 100) : 0; return `<div class="mbar ${g && v > g * 1.1 ? 'over' : ''}"><div class="mtop"><span>${l}</span><b>${Math.round(v)}<small> / ${g} ${u}</small></b></div><div class="bar"><span style="width:${pc.toFixed(0)}%"></span></div></div>`; }
function dayTotals(d) { return S.food.filter(f => f.date === d).reduce((a, f) => ({ kcal: a.kcal + (f.kcal || 0), p: a.p + (f.p || 0), c: a.c + (f.c || 0), f: a.f + (f.f || 0), fiber: a.fiber + (f.fiber || 0) }), { kcal: 0, p: 0, c: 0, f: 0, fiber: 0 }); }
function weekSummary(days) { let cost = 0, kcal = 0, p = 0, meals = 0; let nd = 0; days.forEach(d => { const ids = Object.values(S.plan[d] || {}); if (ids.length) nd++; ids.forEach(id => { const r = getR(id); if (!r) return; meals++; cost += recipeCost(r, servings()); kcal += r.kcal; p += r.prot; }); }); return { cost, meals, kcal: nd ? Math.round(kcal / nd) : 0, p: nd ? Math.round(p / nd) : 0 }; }
function statsData() { const c = {}; S.moves.filter(m => m.type === 'use').forEach(m => { c[m.name] = (c[m.name] || 0) + 1; }); return { top: Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 8) }; }
function badgeList() {
  const cuis = new Set(S.hist.map(h => h.cuisine).filter(Boolean)), recentWaste = S.moves.some(m => m.type === 'waste' && Date.now() - m.t < 30 * 864e5);
  const wk = weekStart(0), planned = [...Array(7)].reduce((a, _, i) => a + Object.keys(S.plan[addDays(wk, i)] || {}).length, 0);
  return [
    { icon: 'chef', label: 'Premier plat', desc: 'Cuisiner une recette en mode cuisine', got: S.hist.length >= 1 },
    { icon: 'flame', label: 'Habitué', desc: 'Cuisiner 10 recettes', got: S.hist.length >= 10 },
    { icon: 'leaf', label: 'Sauveur', desc: 'Sauver 10 aliments du gaspillage', got: S.stats.savedN >= 10 },
    { icon: 'check', label: 'Zéro gaspi', desc: '30 jours sans rien jeter (5 recettes min.)', got: !recentWaste && S.hist.length >= 5 },
    { icon: 'globe', label: 'Globe-cuisinier', desc: 'Cuisiner 3 cuisines différentes', got: cuis.size >= 3 },
    { icon: 'cal', label: 'Organisé', desc: 'Planifier 10 repas cette semaine', got: planned >= 10 },
    { icon: 'spark', label: 'Créatif', desc: 'Créer 3 recettes (IA ou à la main)', got: S.ai.length >= 3 },
    { icon: 'scan', label: 'Œil de lynx', desc: 'Ajouter des aliments par photo', got: S.moves.some(m => m.note === 'scan') },
  ];
}
function weeklyChallenge() {
  const wk = weekStart(0), n = Math.floor(new Date(wk + 'T12:00').getTime() / (7 * 864e5)) % 4, h = S.hist.filter(x => new Date(x.date).toISOString().slice(0, 10) >= wk);
  return [{ label: 'Cuisiner 3 recettes anti-gaspi', goal: 3, done: h.filter(x => x.gaspi).length }, { label: 'Cuisiner 2 plats végétariens', goal: 2, done: h.filter(x => x.vege).length }, { label: 'Tester 2 cuisines du monde', goal: 2, done: new Set(h.filter(x => x.cuisine && x.cuisine !== 'Française').map(x => x.cuisine)).size }, { label: 'Cuisiner 4 fois cette semaine', goal: 4, done: h.length }][n];
}

/* ===== Rendu, routage ===== */
function render() {
  const v = $('#view'); if (!v) return; const y = window.scrollY;
  v.innerHTML = VIEWS[UI.route](); document.body.dataset.route = UI.route;
  $$('.nav [data-r]').forEach(b => b.setAttribute('aria-current', b.dataset.r === UI.route ? 'page' : 'false'));
  const more = $('.nav [data-act=moreMenu]'); if (more) more.setAttribute('aria-current', ['assistant', 'planning', 'courses', 'nutrition', 'favoris', 'profil'].includes(UI.route) ? 'page' : 'false');
  window.scrollTo(0, y);
  if (UI.route === 'assistant') scrollChat();
  if (sheetRender) refreshSheet();
}
function go(r) { r = r === 'stock' ? 'inventaire' : r; if (!VIEWS[r]) r = 'accueil'; if (location.hash.slice(1) !== r) location.hash = r; else { UI.route = r; render(); window.scrollTo(0, 0); } }
window.addEventListener('hashchange', () => { let r = location.hash.slice(1); if (r === 'stock') r = 'inventaire'; UI.route = VIEWS[r] ? r : 'accueil'; if (sheetRender) closeSheet(); render(); window.scrollTo(0, 0); });

/* ===== Feuilles et notifications ===== */
function openSheet(fn, cls = '') { sheetRender = fn; const w = $('#sheet'); w.className = 'sheet-wrap ' + cls; w.hidden = false; refreshSheet(); $('#sheetBody').scrollTop = 0; requestAnimationFrame(() => w.classList.add('in')); document.body.classList.add('locked'); }
function refreshSheet() { const c = $('#sheetBody'); const st = c.scrollTop; c.innerHTML = sheetRender(); c.scrollTop = st; }
function closeSheet() { const w = $('#sheet'); w.classList.remove('in'); sheetRender = null; setTimeout(() => { if (!sheetRender) { w.hidden = true; $('#sheetBody').innerHTML = ''; } }, 220); if (!cook) document.body.classList.remove('locked'); }
function toast(msg, act) { const t = $('#toast'); t.innerHTML = `<span>${esc(msg)}</span>${act ? `<button data-act="${act.act}"${act.id ? ` data-id="${esc(act.id)}"` : ''}>${esc(act.label)}</button>` : ''}`; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 4500); }
const shead = t => `<div class="shead"><h2>${t}</h2><button class="icon" data-act="closeSheet" aria-label="Fermer">${ic('x')}</button></div>`;

/* ===== Fiche recette ===== */
function openRecipe(id, serv) {
  curR = getR(id); if (!curR) return toast('Cette recette n’existe plus.');
  curServ = serv || servings(); UI.confirmDel = false;
  S.views = [id, ...S.views.filter(x => x !== id)].slice(0, 20); save('views');
  openSheet(recipeSheet, 'tall');
}
function recipeSheet() {
  const r = curR; if (!r) return '';
  const P = effPrefs(), a = analyze(r, S.pantry, curServ, P.staples), k = curServ / r.servings, cost = recipeCost(r, curServ), al = recipeAllergens(r);
  const bad = al.filter(x => P.allergies.includes(x)), se = seasonOf(r, new Date().getMonth() + 1), note = S.notes[r.id] || {};
  const st = { ok: ['ok', 'En stock'], partial: ['warn', 'Insuffisant'], missing: ['bad', 'Manquant'], staple: ['muted', 'Basique'] };
  return `<div class="rhead">${art(r, 'big')}<button class="icon close" data-act="closeSheet" aria-label="Fermer">${ic('x')}</button></div>
  <div class="rdetail">
    ${bad.length ? `<p class="alertline bad">${ic('info')}Contient ${bad.map(x => ALLERGENS[x]).join(', ')} : incompatible avec les allergies déclarées.</p>` : ''}
    <div class="rtags">${statusPill(a)}${a.gaspi ? `<span class="pill gaspi">${ic('leaf')}Écoule des aliments qui périment</span>` : ''}${se.ok && !se.out ? `<span class="pill ok">${ic('leaf')}De saison</span>` : ''}<span class="pill muted">${esc(r.cuisine)} · ${MEALS[r.meal]}</span>${r.src !== 'base' ? `<span class="pill ai">${{ ai: 'Créée par l’IA', perso: 'Ma recette', import: 'Importée', photo: 'Depuis une photo' }[r.src] || 'Perso'}</span>` : ''}</div>
    <h2 class="rtitle">${esc(r.title)}</h2>${r.desc ? `<p class="rdesc">${esc(r.desc)}</p>` : ''}
    <div class="match"><div class="bar"><span style="width:${a.pct}%"></span></div><small>${a.pct} % des ingrédients disponibles</small></div>
    <div class="facts"><div><b>${r.prep}</b><span>min prépa.</span></div><div><b>${r.cook}</b><span>min cuisson</span></div><div><b>${['', 'Facile', 'Moyen', 'Difficile'][r.diff]}</b><span>difficulté</span></div><div><b>${euro(cost / curServ)}</b><span>par portion*</span></div><div><b>${euro(cost)}</b><span>au total*</span></div></div>
    ${r.kcal ? `<div class="nutri"><div><b>${r.kcal}</b><span>kcal</span></div><div><b>${r.prot} g</b><span>protéines</span></div><div><b>${r.carbs} g</b><span>glucides</span></div><div><b>${r.fat} g</b><span>lipides</span></div><div><b>${r.fiber} g</b><span>fibres</span></div></div><p class="fine">Par portion, valeurs estimées. *Coût estimé d’après des prix moyens.</p>` : `<p class="fine">Valeurs nutritionnelles non renseignées. *Coût estimé d’après des prix moyens.</p>`}
    ${al.length ? `<p class="allerg">Allergènes : ${al.map(x => ALLERGENS[x]).join(', ')}</p>` : ''}
    <div class="row wrap"><button class="btn accent big" data-act="startCook">${ic('play')}Mode cuisine</button><button class="btn ghost" data-act="fav" aria-pressed="${isFav(r.id)}">${ic('heart')}Favori</button><button class="btn ghost" data-act="askAbout">${ic('spark')}Adapter à mon frigo</button><button class="btn ghost" data-act="shareRecipe">${ic('copy')}Copier</button><button class="btn ghost" data-act="exportRecipe">${ic('download')}Exporter</button><button class="btn ghost" data-act="addCompare">${ic('swap')}Comparer</button></div>${recipeOptions(r)}
    <div class="bhead"><h3>Ingrédients</h3><div class="row"><span class="muted-t">${ic('users')}</span>${stepper('curServ', curServ, 'Portions')}</div></div>
    ${a.maxServ != null && Math.floor(a.maxServ) >= 1 && Math.floor(a.maxServ) < curServ ? `<button class="hintbtn" data-act="fitStock" data-n="${Math.floor(a.maxServ)}">${ic('info')}Votre stock permet ${pl(Math.floor(a.maxServ), 'portion')}. Ajuster les quantités</button>` : ''}
    <ul class="ingr">${a.lines.map(l => `<li class="${st[l.status][0]}"><span class="dot"></span><span class="iq">${esc(fmtQty(l.ing.q * k, l.ing.u))}</span><span class="in">${esc(l.ing.n)}${l.ing.opt ? ' <em>(facultatif)</em>' : ''}${l.item && norm(l.item.name) !== norm(l.ing.n) ? ` <em>→ ${esc(l.item.name)}</em>` : ''}${l.sub ? `<br><em class="sub">Remplaçable par ${esc(l.sub.name)} (en stock)</em>` : ''}${l.ddm ? '<br><em class="sub">DDM dépassée : vérifiez l’aspect</em>' : ''}${l.uncertain ? '<br><em class="sub">Détection incertaine : vérifiez</em>' : ''}</span><span class="is">${st[l.status][1]}${l.item ? ` · ${esc(fmtQty(l.item.qty, l.item.unit))}` : ''}</span></li>`).join('')}</ul>
    ${a.missing.length ? `<button class="btn ghost" data-act="missingToShop">${ic('cart')}Ajouter ${pl(a.missing.length, 'manquant')} aux courses</button>` : ''}
    ${r.equip.length ? `<div class="bhead"><h3>Matériel</h3></div><div class="chips">${r.equip.map(e => `<span class="chip">${esc(e)}</span>`).join('')}</div>` : ''}
    <div class="bhead"><h3>Préparation</h3>${S.prefs.level === 'debutant' ? '<small class="muted-t">Touchez un terme souligné pour l’explication</small>' : ''}</div>
    <ol class="steps">${r.steps.map(s => `<li>${techify(s)}</li>`).join('')}</ol>
    ${r.tip ? `<p class="tip">${ic('spark')}<span>${esc(r.tip)}</span></p>` : ''}
    ${r.storage ? `<p class="tip store">${ic('box')}<span><b>Conservation et réchauffage.</b> ${esc(r.storage)}</span></p>` : ''}
    <div class="bhead"><h3>Mon avis</h3></div>
    <div class="rate">${[1, 2, 3, 4, 5].map(n => `<button data-act="rate" data-n="${n}" aria-label="${n} étoile${n > 1 ? 's' : ''}" aria-pressed="${(note.stars || 0) >= n}">${ic('star')}</button>`).join('')}</div>
    <label class="fld"><span>Notes personnelles</span><textarea id="rNote" data-note="1" rows="2" placeholder="Ex. un peu plus de sel, parfait avec du riz">${esc(note.text || '')}</textarea></label>
    <div class="bhead"><h3>Planifier</h3></div>
    <form class="row wrap" data-form="planRecipe"><label class="fld"><span>Jour</span><select id="plD" name="d">${[...Array(14)].map((_, i) => { const d = addDays(todayISO(), i); return `<option value="${d}">${fmtDate(d, { weekday: 'long', day: 'numeric', month: 'short' })}</option>`; }).join('')}</select></label><label class="fld"><span>Repas</span><select id="plS" name="s">${opt(Object.entries(SLOTS), r.meal === 'petitdej' ? 'petitdej' : ['dessert', 'collation', 'boisson'].includes(r.meal) ? 'collation' : 'soir')}</select></label><button class="btn ghost" type="submit">${ic('cal')}Ajouter au planning</button></form>
    ${r.src !== 'base' ? `<div class="row wrap">${r.src === 'perso' || r.src === 'import' ? `<button class="btn ghost" data-act="editRecipe">${ic('edit')}Modifier</button>` : ''}${UI.confirmDel ? `<span>Supprimer définitivement ?</span><button class="btn danger sm" data-act="delRecipe">Supprimer</button><button class="btn ghost sm" data-act="cancelDel">Annuler</button>` : `<button class="link danger" data-act="askDel">Supprimer cette recette</button>`}</div>` : ''}
  </div>`;
}
function recipeText(r, serv) { const k = serv / r.servings; return `${r.title}\n${r.desc ? r.desc + '\n' : ''}${serv} personnes · ${r.time} min\n\nIngrédients\n${r.ingr.map(i => `- ${fmtQty(i.q * k, i.u)} ${i.n}${i.opt ? ' (facultatif)' : ''}`).join('\n')}\n\nPréparation\n${r.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}${r.tip ? `\n\nAstuce : ${r.tip}` : ''}${r.storage ? `\nConservation : ${r.storage}` : ''}\n\nTambouille`; }
async function copyText(t) { try { await navigator.clipboard.writeText(t); toast('Recette copiée : collez-la où vous voulez.'); } catch { openSheet(() => shead('Copier la recette') + `<textarea id="copyArea" rows="14" readonly>${esc(t)}</textarea><p class="muted-t">Sélectionnez le texte puis copiez-le.</p>`); setTimeout(() => $('#copyArea')?.select(), 60); } }
async function download(filename, data) { try { const d = window.claude?.use ? await window.claude.use('downloads') : null; if (!d) return downloadFallback(filename, data); await d.save({ filename, data }); } catch (e) { if (e?.code !== 'declined') toast('Le fichier n’a pas pu être enregistré.'); } }

/* ===== Mode cuisine : étapes, minuteurs, voix, mains libres ===== */
let wakeLock = null, rec = null;
async function startCook() { const r = curR; closeSheet(); cook = { r, serv: curServ, i: 0, done: new Set(), skipped: new Set(), over: {}, detail: {}, list: false, ingr: false, hands: false }; $('#cook').hidden = false; document.body.classList.add('locked', 'cooking'); try { wakeLock = await navigator.wakeLock?.request('screen'); } catch {} renderCook(); }
function speak(t) { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'fr-FR'; speechSynthesis.speak(u); } catch { toast('La lecture vocale n’est pas disponible sur cet appareil.'); } }
function handsFree(on) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!on) { if (cook) cook.hands = false; const r = rec; rec = null; try { r?.stop(); } catch {} return; }
  cook.hands = true;
  if (!SR) { toast('Commande vocale indisponible ici : chaque étape sera lue à voix haute.'); speak(cook.r.steps[cook.i]); return; }
  try {
    rec = new SR(); rec.lang = 'fr-FR'; rec.continuous = true; rec.interimResults = false;
    rec.onresult = e => { const t = norm(e.results[e.results.length - 1][0].transcript); if (/suivant|apre|ensuite|fait/.test(t)) cookMove(1); else if (/precedent|retour/.test(t)) cookMove(-1); else if (/repet|reli|encore/.test(t)) speak(cook.r.steps[cook.i]); else if (/minuteur|chrono|lance/.test(t)) { const tm = stepTimers(cook.r.steps[cook.i])[0]; tm ? addTimer(tm.sec, tm.label) : speak('Pas de durée dans cette étape.'); } else if (/ingredient/.test(t)) { cook.ingr = !cook.ingr; renderCook(); } else if (/stop|arrete/.test(t)) { handsFree(false); renderCook(); } };
    rec.onerror = ev => { if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') { toast('Micro refusé : les étapes restent lues à voix haute.'); rec = null; } };
    rec.onend = () => { if (cook?.hands && rec) try { rec.start(); } catch {} };
    rec.start(); speak(cook.r.steps[cook.i]);
  } catch { toast('Micro indisponible : les étapes restent lues à voix haute.'); speak(cook.r.steps[cook.i]); }
}
function exitCook() { handsFree(false); try { speechSynthesis.cancel(); } catch {} document.body.classList.remove('cooking'); cook = null; $('#cook').hidden = true; $('#cook').innerHTML = ''; try { wakeLock?.release(); } catch {} wakeLock = null; if (!sheetRender) document.body.classList.remove('locked'); }

/* ===== Minuteurs ===== */
let actx = null;
function beep() { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); [0, .35, .7].forEach(t => { const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(actx.destination); g.gain.setValueAtTime(.25, actx.currentTime + t); g.gain.exponentialRampToValueAtTime(.001, actx.currentTime + t + .3); o.start(actx.currentTime + t); o.stop(actx.currentTime + t + .3); }); navigator.vibrate?.([200, 100, 200]); } catch {} }
function addTimer(sec, label) { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); } catch {} UI.timers.push({ id: uid(), label, end: Date.now() + sec * 1000, done: false }); renderTimers(); toast('Minuteur lancé : ' + label); }
const mmss = s => { s = Math.max(0, Math.ceil(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
function renderTimers() { const b = $('#timers'); if (!UI.timers.length) { b.hidden = true; return; } b.hidden = false; b.innerHTML = UI.timers.map(t => `<div class="tmr ${t.done ? 'ring' : ''}">${ic('timer')}<span class="tl">${esc(t.label)}</span><b data-tleft="${t.id}">${t.done ? 'Terminé' : mmss((t.end - Date.now()) / 1000)}</b><button class="icon sm" data-act="delTimer" data-id="${t.id}" aria-label="Arrêter">${ic('x')}</button></div>`).join(''); }
setInterval(() => { let ch = false; for (const t of UI.timers) { if (t.done) continue; const l = (t.end - Date.now()) / 1000; if (l <= 0) { t.done = true; ch = true; beep(); toast('Minuteur terminé : ' + t.label); notifyBrowser('Minuteur terminé', t.label); if (cook?.hands) speak('Minuteur terminé'); } else { const el = document.querySelector(`[data-tleft="${t.id}"]`); if (el) el.textContent = mmss(l); } } if (ch) renderTimers(); }, 500);

/* ===== Fin de recette : note, nutrition, mise à jour du stock validée ===== */
let consume = [];
function finishCook() {
  const { r, serv } = cook; exitCook(); curR = r; curServ = serv;
  const a = analyze(r, S.pantry, serv, effPrefs().staples);
  consume = a.lines.filter(l => l.item).map(l => ({ id: l.item.id, name: l.item.name, unit: l.item.unit, have: l.item.qty, take: l.take == null ? 0 : +l.take.toFixed(2), guess: l.take == null, gaspi: !!l.gaspi }));
  UI.finish = { stars: S.notes[r.id]?.stars || 0, eaten: 1, gaspi: a.gaspi > 0 };
  openSheet(() => `${shead('Bon appétit !')}
    <p class="muted-t">« ${esc(r.title)} » pour ${serv} personnes. Notez la recette, puis validez la mise à jour du stock.</p>
    <div class="rate">${[1, 2, 3, 4, 5].map(n => `<button data-act="finRate" data-n="${n}" aria-label="${n} étoile${n > 1 ? 's' : ''}" aria-pressed="${UI.finish.stars >= n}">${ic('star')}</button>`).join('')}</div>
    <div class="row gap"><span>Portions mangées par vous (suivi nutrition)</span>${stepper('eaten', UI.finish.eaten, 'Portions mangées')}</div>
    <h3>Quantités utilisées</h3>
    <ul class="consume">${consume.map((c, i) => `<li><div><b>${esc(c.name)}</b><span>En stock : ${esc(fmtQty(c.have, c.unit))}${c.guess ? ' · à préciser' : ''}</span></div><label class="sr" for="cons${i}">Quantité utilisée de ${esc(c.name)}</label><input id="cons${i}" type="number" inputmode="decimal" min="0" step="any" value="${c.take}" data-cons="${i}"><span class="u">${esc(UNITS[c.unit] || 'pièce(s)')}</span></li>`).join('') || '<li>Aucun aliment du stock à déduire.</li>'}</ul>
    <label class="check"><input type="checkbox" id="rmEmpty" checked> Retirer de l’inventaire les aliments épuisés</label>
    <div class="row wrap"><button class="btn accent big" data-act="applyConsume">${ic('check')}Valider</button><button class="btn ghost" data-act="skipConsume">Ne pas toucher au stock</button></div>`);
}
function logCooked(r, serv) {
  S.hist.unshift({ id: uid(), rid: r.id, title: r.title, date: Date.now(), servings: serv, rating: UI.finish.stars || 0, gaspi: UI.finish.gaspi, cuisine: r.cuisine, vege: dietOK(r, 'vege') }); S.hist = S.hist.slice(0, 200);
  if (UI.finish.stars) S.notes[r.id] = { ...(S.notes[r.id] || {}), stars: UI.finish.stars };
  if (UI.finish.eaten > 0 && r.kcal) { const e = UI.finish.eaten; S.food.push({ id: uid(), date: todayISO(), slot: slotNow(), label: r.title + (e !== 1 ? ` (×${e})` : ''), kcal: Math.round(r.kcal * e), p: Math.round(r.prot * e), c: Math.round(r.carbs * e), f: Math.round(r.fat * e), fiber: Math.round(r.fiber * e), rid: r.id, est: true }); S.food = S.food.slice(-600); }
  save('hist', 'notes', 'food');
}

/* ===== Inventaire : ajout, fusion, édition ===== */
function addItems(items, note) {
  for (const it of items) {
    const ex = S.pantry.find(p => norm(p.name) === norm(it.name) && p.unit === it.unit && p.exp === it.exp && p.loc === it.loc && p.qty > 0);
    if (ex) { ex.qty = +(ex.qty + it.qty).toFixed(3); ex.upd = Date.now(); if (!it.uncertain) ex.uncertain = false; } else S.pantry.push({ ...it, v: 2 });
    logMove(note === 'buy' ? 'buy' : 'add', it, it.qty, note === 'scan' ? 'scan' : '');
  }
  save('pantry', 'moves'); render();
}
function itemSheet(id) {
  const isNew = !id; const p = isNew ? makeItem({ name: '', qty: 1, unit: 'pc' }) : S.pantry.find(x => x.id === id); if (!p) return;
  const C = CATS[p.cat] || CATS.autre, e = expInfo(p);
  UI.itemPhoto = p.photo || null;
  openSheet(() => `${shead(isNew ? 'Nouvel aliment' : esc(p.name))}
  ${!isNew && !e.s.safe ? `<p class="alertline bad">${ic('info')}${esc(e.s.note)}</p>` : ''}${!isNew && e.s.level === 'ddm' ? `<p class="alertline warn">${ic('info')}${esc(e.s.note)}</p>` : ''}
  ${p.uncertain ? `<p class="alertline warn">${ic('info')}Détecté par l’IA avec un doute. Vérifiez puis enregistrez pour confirmer.</p>` : ''}
  <form class="form" data-form="saveItem" data-id="${isNew ? '' : p.id}">
    <label class="fld wide"><span>Nom</span><input name="name" id="itName" required value="${esc(p.name)}"></label>
    <label class="fld"><span>Marque</span><input name="brand" id="itBrand" value="${esc(p.brand)}"></label>
    <label class="fld"><span>Catégorie</span><select name="cat" id="itCat">${opt([...(isNew ? [['', 'Automatique']] : []), ...CAT_ORDER.map(c => [c, CATS[c].label])], isNew ? '' : p.cat)}</select></label>
    <label class="fld"><span>Quantité</span><input name="qty" id="itQty" type="number" step="any" min="0" inputmode="decimal" value="${p.qty}"></label>
    <label class="fld"><span>Unité</span><select name="unit" id="itUnit">${opt(Object.keys(UNITS).map(u => [u, u === 'pc' ? 'pièce(s)' : UNITS[u]]), p.unit)}</select></label>
    <label class="fld"><span>Rangement</span><select name="loc" id="itLoc">${opt(S.spaces.map(s => [s.id, s.name]), p.loc)}</select></label>
    <label class="fld"><span>État</span><select name="state" id="itState">${opt([['neuf', 'Neuf (fermé)'], ['ouvert', 'Ouvert'], ['entame', 'Entamé']], p.state)}</select></label>
    <label class="fld"><span>Date limite${isNew ? ' (vide = estimation)' : ''}</span><input name="exp" id="itExp" type="date" value="${isNew ? '' : p.exp || ''}"></label>
    <label class="fld"><span>Type de date</span><select name="expType" id="itExpType">${opt([...(isNew ? [['', 'Automatique selon le produit']] : []), ['DLC', 'DLC · à consommer jusqu’au'], ['DDM', 'DDM · de préférence avant'], ['est', 'Estimation (pas de date)']], isNew ? '' : p.expType)}</select></label>
    <label class="fld"><span>Acheté le</span><input name="bought" id="itBought" type="date" value="${p.bought || ''}"></label>
    <label class="fld"><span>Ouvert le</span><input name="opened" id="itOpened" type="date" value="${p.opened || ''}"></label>
    <fieldset class="fld wide"><legend>Valeurs nutritionnelles pour 100 g (facultatif)</legend><div class="nrow">${[['kcal', 'kcal'], ['p', 'Prot.'], ['c', 'Gluc.'], ['f', 'Lip.']].map(([k, l]) => `<label><span>${l}</span><input name="n_${k}" id="itN${k}" type="number" min="0" step="any" value="${p.nutri?.[k] ?? ''}"></label>`).join('')}</div></fieldset>
    <label class="fld wide"><span>Note</span><input name="note" id="itNote" value="${esc(p.note)}"></label>
    <div class="fld wide photo">${UI.itemPhoto ? `<img src="${esc(photoSrc(UI.itemPhoto))}" alt="Photo de l’aliment"><button type="button" class="btn ghost sm" data-act="rmItemPhoto">Retirer la photo</button>` : `<button type="button" class="btn ghost sm" data-act="itemPhoto">${ic('camera')}Ajouter une photo</button>`}</div>
    <div class="row wrap wide"><button class="btn accent" type="submit">${ic('check')}${p.uncertain ? 'Confirmer et enregistrer' : 'Enregistrer'}</button>
    ${isNew ? '' : `${p.state === 'neuf' ? `<button class="btn ghost" type="button" data-act="openItem" data-id="${p.id}">Je l’ouvre</button>` : ''}${C.freeze && spaceKind(p.loc) !== 'congelo' && e.s.safe ? `<button class="btn ghost" type="button" data-act="freeze" data-id="${p.id}">${ic('snow')}Congeler</button>` : ''}<button class="btn ghost" type="button" data-act="waste" data-id="${p.id}">Jeté</button><button class="btn ghost danger" type="button" data-act="delItem" data-id="${p.id}">${ic('trash')}Supprimer</button>`}</div>
  </form>
  <p class="tip store">${ic('box')}<span><b>Conservation (${C.label.toLowerCase()}).</b> ${esc(C.tip)}${C.freeze ? ' Se congèle.' : ''} Après ouverture : environ ${pl(C.open, 'jour')}.</span></p>`);
}
function spacesSheet() {
  openSheet(() => `${shead('Espaces de stockage')}<p class="muted-t">Plusieurs frigos, une cave, un second congélateur… Chaque aliment est rangé dans un espace.</p>
  <ul class="spaces">${S.spaces.map(s => `<li><input aria-label="Nom de l’espace" id="sp_${esc(s.id)}" data-space="${esc(s.id)}" value="${esc(s.name)}"><select aria-label="Type d’espace" id="spk_${esc(s.id)}" data-spacek="${esc(s.id)}">${opt(Object.entries(SPACE_KINDS), s.kind)}</select><small>${S.pantry.filter(p => p.loc === s.id && p.qty > 0).length}</small>${S.spaces.length > 1 ? `<button class="icon sm" data-act="delSpace" data-id="${esc(s.id)}" aria-label="Supprimer l’espace ${esc(s.name)}">${ic('trash')}</button>` : ''}</li>`).join('')}</ul>
  <form class="addbar" data-form="addSpace"><label class="sr" for="newSpace">Nouvel espace</label><input name="n" id="newSpace" placeholder="Ex. Frigo du garage" required><select name="k" id="newSpaceK" aria-label="Type">${opt(Object.entries(SPACE_KINDS), 'frigo')}</select><button class="btn" type="submit">${ic('plus')}<span>Ajouter</span></button></form>
  <p class="note">${ic('info')}Supprimer un espace déplace ses aliments dans un autre.</p>`);
}

/* ===== Scan IA : photos, étiquettes, plats ===== */
function mergeDupes(items) {
  const out = [];
  for (const it of items) { const ex = out.find(o => norm(o.name) === norm(it.name) && o.unit === it.unit); if (ex) { ex.qty = Math.max(ex.qty, it.qty); ex.confidence = Math.max(ex.confidence, it.confidence); ex.uncertain = ex.confidence < 0.7; ex.keep = !ex.uncertain; ex.dup = true; } else out.push(it); }
  return out;
}
async function dishFromPhoto(imgs) {
  try {
    const out = await AI.json(`Photo d'un plat cuisiné. Identifie le plat (nom courant), puis donne une recette fidèle pour le reproduire à la maison pour ${servings()} personnes. Si tu n'es pas sûr, mets confidence < 0.6 et propose la recette la plus proche. Réponds uniquement en JSON : {"dish":"","confidence":0-1,"recipe":${RECIPE_SCHEMA}}`, { images: imgs });
    const r = sanitizeRecipe(out?.recipe, 'photo'); if (!r) throw { code: 'invalid_json' };
    S.ai.unshift(r); save('ai'); closeSheet(); render();
    openRecipe(r.id); toast(Number(out.confidence) < 0.6 ? `Plat incertain : recette la plus proche de « ${out.dish || r.title} ».` : `Reconnu : ${out.dish || r.title}. Recette ajoutée à vos recettes.`);
  } catch (e) { closeSheet(); aiErr(e); }
}
function reviewItems(items, title, note) {
  UI.review = items; UI.reviewNote = note || '';
  openSheet(() => `${shead(esc(title))}
  <p class="muted-t">Vérifiez avant d’ajouter. Les aliments incertains sont décochés : cochez-les seulement si vous êtes sûr.</p>
  <ul class="review">${UI.review.map((it, i) => { const inStock = S.pantry.some(p => p.qty > 0 && nameMatches(it.name, p.name)); return `<li class="${it.keep ? '' : 'off'}">
    <label class="cb"><input type="checkbox" data-rv="${i}" data-k="keep" ${it.keep ? 'checked' : ''} aria-label="Ajouter ${esc(it.name)}"><span class="box">${ic('check')}</span></label>
    <input class="rn" aria-label="Nom" data-rv="${i}" data-k="name" value="${esc(it.name)}">
    <input class="rq" aria-label="Quantité" type="number" step="any" min="0" data-rv="${i}" data-k="qty" value="${it.qty}">
    <select class="ru" aria-label="Unité" data-rv="${i}" data-k="unit">${opt(Object.keys(UNITS).map(u => [u, u === 'pc' ? 'pc' : UNITS[u]]), it.unit)}</select>
    <input class="rd" aria-label="Date limite" type="date" data-rv="${i}" data-k="exp" value="${it.exp}">
    <div class="rtagline">${it.uncertain ? '<i class="tag warn">incertain</i>' : ''}${it.dup ? '<i class="tag">vu sur plusieurs photos</i>' : ''}${inStock ? '<i class="tag">déjà en stock</i>' : ''}${it.brand ? `<i class="tag">${esc(it.brand)}</i>` : ''}<i class="tag">${it.expType === 'est' ? 'date estimée' : it.expType}</i>${it.nutri ? `<i class="tag">${it.nutri.kcal} kcal/100 g</i>` : ''}</div>
  </li>`; }).join('')}</ul>
  <div class="row wrap"><button class="btn accent big" data-act="confirmReview">${ic('check')}Ajouter ${UI.review.filter(x => x.keep).length} à l’inventaire</button></div>`);
}

/* ===== Génération de recettes IA ===== */
/* ===== Assistant : conversation avec outils ===== */
let turnRecipes = [];
function chatContext() {
  const P = effPrefs(), r = UI.chatRecipe ? getR(UI.chatRecipe) : null;
  const stock = S.pantry.filter(p => p.qty > 0 && safety(p).safe).slice(0, 60).map(x => `${x.name} (${fmtQty(x.qty, x.unit)}, ${expInfo(x).lab || 'sans date'})`).join(', ');
  return `Tu es l'assistant culinaire de l'application Tambouille. ${S.prefs.ai.length === 'detaillees' ? 'Réponds de façon détaillée et pédagogique' : 'Réponds de façon concrète et brève (listes courtes)'}, en ${S.prefs.aiLang}. Pose une question seulement si c'est indispensable.
Règles : ne présente jamais un ingrédient manquant comme disponible ; respecte strictement les allergies ; ne recommande jamais un aliment dont la DLC est dépassée ; valeurs nutritionnelles et prix sont des estimations.
Outils : quand tu crées ou adaptes une recette, enregistre-la avec enregistrer_recette (un bouton permettra de l'ouvrir). Pour des achats, utilise ajouter_courses. Pour une préférence durable exprimée par l'utilisateur, utilise memoriser_preference.
Inventaire utilisable : ${stock || 'vide'}.
Basiques : ${P.staples}. Matériel : ${P.equipment.map(e => EQUIP[e]).join(', ')}. ${servings()} personnes par défaut.
Préférences : ${prefSummary(P)}${P.dislikes ? ', n’aime pas : ' + P.dislikes : ''}. Niveau : ${P.level}.${P.memory ? ` À savoir : ${P.memory}` : ''}
${r ? `Recette en cours : « ${r.title} » pour ${r.servings} pers. Ingrédients : ${r.ingr.map(i => fmtQty(i.q, i.u) + ' ' + i.n).join(', ')}. Étapes : ${r.steps.join(' / ')}` : ''}${cook ? ` L'utilisateur cuisine en ce moment, étape ${cook.i + 1}.` : ''}`;
}
const TOOLS = () => [
  { name: 'lire_inventaire', description: 'Inventaire complet : aliments utilisables avec quantités et dates, plus ceux à ne pas utiliser.', execute: () => ({ utilisables: S.pantry.filter(p => p.qty > 0 && safety(p).safe).map(p => `${p.name} · ${fmtQty(p.qty, p.unit)} · ${expInfo(p).lab}`), a_ne_pas_utiliser: S.pantry.filter(p => p.qty > 0 && !safety(p).safe).map(p => p.name) }) },
  { name: 'chercher_recettes', description: 'Cherche dans la bibliothèque de l’utilisateur, classée selon son stock.', inputSchema: { type: 'object', properties: { texte: { type: 'string' }, temps_max: { type: 'number' }, type_repas: { type: 'string', enum: Object.keys(MEALS) }, proteines_min: { type: 'number' }, cout_max_portion: { type: 'number' } } }, execute: i => scoredList({ q: i.texte || '', maxTime: i.temps_max || 0, meal: i.type_repas || '', minProt: i.proteines_min || 0, maxCost: i.cout_max_portion || 0 }).sort((a, b) => b.a.score - a.a.score).slice(0, 8).map(x => ({ id: x.r.id, titre: x.r.title, disponible: x.a.pct + ' %', manque: x.a.missing.map(l => l.ing.n), minutes: x.r.time, cout_portion: +(x.cost / servings()).toFixed(2) })) },
  { name: 'enregistrer_recette', description: 'Enregistre une recette créée ou adaptée dans la bibliothèque de l’utilisateur.', inputSchema: { type: 'object', properties: { recette: { type: 'object', description: 'Format : ' + RECIPE_SCHEMA } }, required: ['recette'] }, execute: i => { const r = sanitizeRecipe(i.recette, 'ai'); if (!r) throw new Error('Recette invalide : title, ingredients[] et steps[] sont obligatoires.'); const P = effPrefs(); if (!passesFilters(r, {}, { allergies: P.allergies, diet: P.diet })) throw new Error('Refusée : contient un allergène interdit ou ne respecte pas le régime.'); S.ai.unshift(r); save('ai'); turnRecipes.push(r.id); return { enregistree: true, id: r.id, titre: r.title }; } },
  { name: 'ajouter_courses', description: 'Ajoute des articles à la liste de courses.', inputSchema: { type: 'object', properties: { articles: { type: 'array', items: { type: 'object', properties: { nom: { type: 'string' }, quantite: { type: 'number' }, unite: { type: 'string', enum: Object.keys(UNITS) } }, required: ['nom'] } } }, required: ['articles'] }, execute: i => { const a = (i.articles || []).slice(0, 30); a.forEach(x => addShop(String(x.nom).slice(0, 50), Number(x.quantite) || 0, UNITS[x.unite] !== undefined ? x.unite : 'pc', 'Assistant')); save('shopping'); return { ajoutes: a.length }; } },
  { name: 'memoriser_preference', description: 'Retient une préférence culinaire durable exprimée par l’utilisateur.', inputSchema: { type: 'object', properties: { texte: { type: 'string' } }, required: ['texte'] }, execute: i => { const t = String(i.texte).slice(0, 200); S.prefs.memory = [S.prefs.memory, t].filter(Boolean).join(' ; ').slice(-1500); save('prefs'); return { ok: true }; } },
];
function md(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').split('\n').map(l => /^\s*([-•*]|\d+\.)\s+/.test(l) ? `<li>${l.replace(/^\s*([-•*]|\d+\.)\s+/, '')}</li>` : l.trim() ? `<p>${l}</p>` : '').join('').replace(/(<li>.*?<\/li>)+/g, m => `<ul>${m}</ul>`); }
function chatHTML() {
  const ctxR = UI.chatRecipe && getR(UI.chatRecipe);
  return `${ctxR ? `<div class="ctxr">${ic('chef')}<span>À propos de « ${esc(ctxR.title)} »</span><button class="icon xs" data-act="clearCtx" aria-label="Retirer le contexte">${ic('x')}</button></div>` : ''}
  <div class="chat" id="chatLog">${UI.chat.length ? UI.chat.map(m => `<div class="msg ${m.role}">${m.role === 'assistant' ? (md(m.content) || '<span class="spin"></span>') + (m.recipes || []).map(id => { const r = getR(id); return r ? `<button class="btn sm accent" data-act="openRecipe" data-id="${id}">${ic('chef')}Ouvrir « ${esc(r.title)} »</button>` : ''; }).join('') : esc(m.content)}</div>`).join('') : `<div class="msg assistant"><p>Bonjour ! Je connais votre inventaire et vos préférences. Que voulez-vous cuisiner ?</p></div>`}</div>
  <div class="chips">${['Qu’est-ce que je peux faire avec ce qui périme ?', 'Un repas pour 4 à moins de 10 €', 'Un dîner riche en protéines en 20 min', 'Comment remplacer la crème fraîche ?', 'Un dessert avec ce que j’ai'].map(q => `<button class="chip btnchip" data-act="ask" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>
  <form class="addbar" data-form="chat"><label class="sr" for="chatIn">Votre question</label><input id="chatIn" name="t" autocomplete="off" placeholder="Posez votre question…" value="${esc(UI.chatDraft || '')}" ${UI.chatBusy ? 'disabled' : ''}><button class="btn accent" type="submit" ${UI.chatBusy ? 'disabled' : ''} aria-label="Envoyer">${ic('send')}</button>${UI.chat.length ? `<button class="icon" type="button" data-act="clearChat" aria-label="Nouvelle conversation">${ic('refresh')}</button>` : ''}</form>`;
}
function scrollChat() { const l = $('#chatLog'); if (l) l.scrollTop = l.scrollHeight; }
function openChat(draft, rid) { UI.chatDraft = draft || ''; if (rid !== undefined) UI.chatRecipe = rid; if (cook) { openSheet(() => shead(`${ic('spark')}Assistant`) + chatHTML(), 'tall'); scrollChat(); setTimeout(() => $('#chatIn')?.focus(), 80); return; } closeSheet(); go('assistant'); setTimeout(() => { const i = $('#chatIn'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 80); }
function refreshChat() { if (UI.route === 'assistant') render(); else if (sheetRender) refreshSheet(); scrollChat(); }
async function ask(q) {
  q = q.trim(); if (!q || UI.chatBusy) return; if (!(await AI.ready())) return;
  UI.chatDraft = ''; UI.chat.push({ role: 'user', content: q }, { role: 'assistant', content: '', recipes: [] }); UI.chatBusy = true; turnRecipes = [];
  if (UI.route !== 'assistant' && !cook) { closeSheet(); go('assistant'); }
  refreshChat();
  const last = UI.chat[UI.chat.length - 1];
  const msgs = UI.chat.slice(0, -1).slice(-14).map(m => ({ role: m.role, content: m.content || '…' }));
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
  msgs[0] = { role: 'user', content: chatContext() + '\n\n---\n' + msgs[0].content };
  try {
    const res = await AI.text(msgs, { cache: false, tools: TOOLS(), onText: ({ text }) => { last.content = text; const els = $$('#chatLog .msg.assistant'); const el = els[els.length - 1]; if (el) { el.innerHTML = md(text); scrollChat(); } } });
    last.content = res.text || last.content || 'C’est fait.';
  } catch (e) { last.content = last.content || 'Je n’ai pas pu répondre. Réessayez dans un instant.'; aiErr(e); }
  last.recipes = [...turnRecipes]; UI.chatBusy = false; refreshChat();
}

/* ===== Ce soir, roue ===== */
function tonight(again) {
  const sc = scoredList({ maxTime: 45, equipOnly: true }).filter(x => x.r.meal === 'plat').sort((a, b) => (b.a.canCook - a.a.canCook) || (b.a.score - a.a.score));
  if (!sc.length) return toast('Aucune recette ne correspond à vos préférences.');
  UI.tIdx = again ? ((UI.tIdx || 0) + 1) % Math.min(sc.length, 8) : 0;
  const { r, a, cost } = sc[UI.tIdx]; curR = r; curServ = servings();
  openSheet(() => `${shead('Ce soir, je vous propose')}<div class="tonight-card">${art(r, 'big')}<div><div class="rtags">${statusPill(a)}${a.gaspi ? `<span class="pill gaspi">${ic('leaf')}Anti-gaspi</span>` : ''}</div><h3>${esc(r.title)}</h3><p class="meta">${ic('clock')}${r.time} min · ${r.kcal} kcal · ${euro(cost / servings())}/pers.</p>
    <p class="muted-t">${a.canCook ? 'Vous avez tout ce qu’il faut.' : 'Il manque : ' + a.missing.map(l => esc(l.ing.n)).join(', ') + '.'}${a.gaspi ? ' Elle écoule des aliments qui périment bientôt.' : ''}</p></div></div>
    <div class="row wrap"><button class="btn accent big" data-act="openRecipe" data-id="${r.id}">Voir la recette</button><button class="btn ghost" data-act="tonightAgain">${ic('refresh')}Autre idée</button></div>`);
}
function wheel() {
  const pool = scoredList({ maxTime: 60, equipOnly: true }).filter(x => x.r.meal === 'plat').sort((a, b) => b.a.score - a.a.score).slice(0, 12).sort(() => Math.random() - .5).slice(0, 8);
  if (pool.length < 2) return toast('Pas assez de recettes compatibles pour lancer la roue.');
  UI.wheel = { pool, rot: 0, res: null, spinning: false };
  const n = pool.length, seg = 360 / n, cols = pool.map((x, i) => `hsl(${FOOD_HUES[(i * 3) % FOOD_HUES.length]} 62% 64%) ${(i * seg).toFixed(2)}deg ${((i + 1) * seg).toFixed(2)}deg`).join(',');
  openSheet(() => `${shead('La roue des repas')}<p class="muted-t">8 plats compatibles avec votre stock et vos préférences.</p><div class="wheelwrap"><div class="pointer"></div><div class="wheel" id="wheelDisk" style="background:conic-gradient(${cols});transform:rotate(${UI.wheel.rot}deg)">${pool.map((x, i) => `<span style="transform:rotate(${(i * seg + seg / 2 - 90).toFixed(2)}deg)"><em>${esc(x.r.title.length > 20 ? x.r.title.slice(0, 19) + '…' : x.r.title)}</em></span>`).join('')}</div></div>
  <div class="row wrap center">${UI.wheel.res ? `<button class="btn accent big" data-act="openRecipe" data-id="${UI.wheel.res.r.id}">Cuisiner « ${esc(UI.wheel.res.r.title)} »</button>` : ''}<button class="btn ${UI.wheel.res ? 'ghost' : 'accent big'}" data-act="spin" ${UI.wheel.spinning ? 'disabled' : ''}>${ic('wheel')}${UI.wheel.res ? 'Relancer' : 'Lancer la roue'}</button></div>`);
}
function spin() {
  const w = UI.wheel; if (!w || w.spinning) return; const n = w.pool.length, seg = 360 / n, k = Math.floor(Math.random() * n);
  w.rot = w.rot - (w.rot % 360) + 360 * 5 + (360 - (k * seg + seg / 2)); w.res = null; w.spinning = true;
  const d = $('#wheelDisk'); if (d) d.style.transform = `rotate(${w.rot}deg)`;
  setTimeout(() => { w.spinning = false; w.res = w.pool[k]; if (sheetRender) refreshSheet(); }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 50 : 3600);
}

/* ===== Courses ===== */
function addShop(name, qty, unit, from) {
  const ex = S.shopping.find(s => !s.done && norm(s.name) === norm(name) && s.unit === unit);
  if (ex) ex.qty = +(Number(ex.qty || 0) + Number(qty || 0)).toFixed(2); else S.shopping.push({ id: uid(), name, qty: qty ? +Number(qty).toFixed(2) : 0, unit, cat: guessCat(name), from: from || '', done: false });
}
function missingLines(r, serv) {
  const a = analyze(r, S.pantry, serv, effPrefs().staples);
  return a.missing.map(l => { if (l.status === 'partial' && l.item) { const need = convert(l.q, l.ing.u, l.item.unit, l.ing.n); return { n: l.ing.n, q: Math.max(0, need - l.item.qty), u: l.item.unit }; } return { n: l.ing.n, q: l.q, u: l.ing.u }; });
}
const isStapleName = n => String(effPrefs().staples).split(',').map(norm).filter(Boolean).some(s => norm(n) === s || nameMatches(s, n));
/* Liste d'une période : besoins cumulés de toutes les recettes, moins le stock utilisable */
function periodNeeds(ids) {
  const need = new Map();
  ids.forEach(id => { const r = getR(id); if (!r) return; const k = servings() / r.servings; r.ingr.filter(i => !i.opt && !isStapleName(i.n)).forEach(i => { const key = norm(i.n); const e = need.get(key) || { n: i.n, u: i.u, q: 0, from: new Set() }; const add = e.u === i.u ? i.q * k : convert(i.q * k, i.u, e.u, i.n); if (add != null) e.q += add; e.from.add(r.title); need.set(key, e); }); });
  const out = [];
  for (const e of need.values()) {
    let have = 0; S.pantry.filter(p => p.qty > 0 && safety(p).safe && nameMatches(e.n, p.name)).forEach(p => { const c = convert(p.qty, p.unit, e.u, e.n); have += c != null ? c : e.q; });
    if (have + 1e-6 < e.q * 0.9) out.push({ n: e.n, q: e.q - have, u: e.u, from: [...e.from].slice(0, 2).join(', ') });
  }
  return out;
}

/* ===== Planning ===== */
function autoPlan(n) {
  const T = todayISO(), P = S.prefs; n = +n || 7;
  const start = n === 7 ? weekStart(UI.weekOffset) : T;
  const dates = [...Array(n)].map((_, i) => addDays(start, i)).filter(d => d >= T);
  const cands = scoredList({ equipOnly: true }, 'all', { noCmode: true }).sort((a, b) => b.a.score - a.a.score);
  const res = planAuto({ dates, slots: P.slots, cands, plan: S.plan, budget: P.budgetWeek || (P.budgetDay ? P.budgetDay * 7 : 0), servings: servings(), history: S.hist.slice(0, 20).map(h => ({ rid: h.rid, date: new Date(h.date).toISOString().slice(0, 10) })), alternate: P.planAlternate, repeatDays: P.planRepeat });
  S.plan = res.plan; save('plan');
  let shop = 0; if (P.planAutoShop && res.added) { const need = periodNeeds(dates.flatMap(d => Object.values(S.plan[d] || {}))); need.forEach(l => addShop(l.n, l.q, l.u, l.from)); shop = need.length; save('shopping'); }
  render(); toast(res.added ? `${pl(res.added, 'repas planifié', 'repas planifiés')}${shop ? `, ${pl(shop, 'article')} ajouté${shop > 1 ? 's' : ''} aux courses` : ''}.` : 'Ces jours sont déjà remplis.');
}
function replaceSlot(d, s) {
  const cur = S.plan[d]?.[s]; const near = new Set([...Array(7)].flatMap((_, i) => Object.values(S.plan[addDays(d, i - 3)] || {})));
  const c = scoredList({ equipOnly: true }).filter(x => SLOT_MEALS[s].includes(x.r.meal) && x.r.id !== cur && !near.has(x.r.id)).sort((a, b) => b.a.score - a.a.score);
  const pick = c[Math.floor(Math.random() * Math.min(3, c.length))]; if (!pick) return toast('Aucune autre recette compatible.');
  S.plan[d][s] = pick.r.id; save('plan'); render(); toast('Remplacé par « ' + pick.r.title + ' ».');
}
function pickPlan(d, s) {
  const list = scoredList({ equipOnly: true }).filter(x => SLOT_MEALS[s].includes(x.r.meal)).sort((a, b) => b.a.score - a.a.score);
  openSheet(() => `${shead(`${fmtDate(d, { weekday: 'long', day: 'numeric' })} · ${SLOTS[s]}`)}<button class="btn ghost" data-act="setPlan" data-d="${d}" data-s="${s}" data-id="libre">${ic('globe')}Repas libre (restaurant, invitation…)</button><ul class="pick">${list.map(({ r, a, cost }) => `<li><button data-act="setPlan" data-d="${d}" data-s="${s}" data-id="${r.id}"><b>${esc(r.title)}</b><span>${r.time} min · ${a.canCook ? '100 % dispo' : 'manque ' + a.missing.length} · ${euro(cost / servings())}/pers.${a.gaspi ? ' · anti-gaspi' : ''}</span></button></li>`).join('') || `<li>${emptyState('Aucune recette pour ce repas.', 'Créez-en une dans la bibliothèque.')}</li>`}</ul>`, 'tall');
}
function moveSlot(d, s) {
  const start = weekStart(UI.weekOffset), r = getR(S.plan[d]?.[s]);
  openSheet(() => `${shead('Déplacer « ' + esc(r?.title || '') + ' »')}<p class="muted-t">Choisissez le nouveau créneau. S’il est occupé, les deux repas sont échangés.</p>
  <div class="movegrid">${[...Array(14)].map((_, i) => addDays(start, i)).map(x => `<div><b>${fmtDate(x, { weekday: 'short', day: 'numeric' })}</b>${S.prefs.slots.map(t => `<button class="${x === d && t === s ? 'cur' : S.plan[x]?.[t] ? 'busy' : ''}" data-act="doMove" data-d="${d}" data-s="${s}" data-d2="${x}" data-s2="${t}" ${x === d && t === s ? 'disabled' : ''}>${SLOTS[t]}</button>`).join('')}</div>`).join('')}</div>`, 'tall');
}

/* ===== Formulaires recette (création, import), repas, menu ===== */
function recipeForm(r) {
  const e = r || { title: '', meal: 'plat', cuisine: 'Française', servings: servings(), prep: 15, cook: 15, diff: 1, ingr: [], steps: [], tip: '', storage: '', kcal: '', prot: '', carbs: '', fat: '', fiber: '', desc: '', equip: [] };
  openSheet(() => `${shead(r ? 'Modifier la recette' : 'Nouvelle recette')}
  <form class="form" data-form="saveRecipe" data-id="${r ? r.id : ''}">
    <label class="fld wide"><span>Titre</span><input name="title" id="rfT" required value="${esc(e.title)}"></label>
    <label class="fld wide"><span>Description</span><input name="desc" id="rfD" value="${esc(e.desc)}"></label>
    <label class="fld"><span>Type</span><select name="meal" id="rfM">${opt(Object.entries(MEALS), e.meal)}</select></label>
    <label class="fld"><span>Cuisine</span><input name="cuisine" id="rfC" value="${esc(e.cuisine)}"></label>
    <label class="fld"><span>Portions</span><input name="servings" id="rfS" type="number" min="1" value="${e.servings}"></label>
    <label class="fld"><span>Difficulté</span><select name="diff" id="rfDf">${opt([[1, 'Facile'], [2, 'Moyenne'], [3, 'Difficile']], e.diff)}</select></label>
    <label class="fld"><span>Préparation (min)</span><input name="prep" id="rfP" type="number" min="0" value="${e.prep}"></label>
    <label class="fld"><span>Cuisson (min)</span><input name="cook" id="rfK" type="number" min="0" value="${e.cook}"></label>
    <label class="fld wide"><span>Ingrédients, un par ligne (ex. « 200 g pâtes »)</span><textarea name="ingr" id="rfI" rows="6" required>${esc(e.ingr.map(i => `${i.u === 'pc' ? r1(i.q) : fmtQty(i.q, i.u)} ${i.n}`).join('\n'))}</textarea></label>
    <label class="fld wide"><span>Étapes, une par ligne</span><textarea name="steps" id="rfE" rows="6" required>${esc(e.steps.join('\n'))}</textarea></label>
    <label class="fld wide"><span>Matériel (séparé par des virgules)</span><input name="equip" id="rfQ" value="${esc((e.equip || []).join(', '))}" placeholder="Poêle, Four"></label>
    <label class="fld wide"><span>Astuce</span><input name="tip" id="rfA" value="${esc(e.tip)}"></label>
    <label class="fld wide"><span>Conservation et réchauffage</span><input name="storage" id="rfCo" value="${esc(e.storage)}"></label>
    <fieldset class="fld wide"><legend>Par portion (facultatif)</legend><div class="nrow">${[['kcal', 'kcal'], ['prot', 'Prot.'], ['carbs', 'Gluc.'], ['fat', 'Lip.'], ['fiber', 'Fibres']].map(([k, l]) => `<label><span>${l}</span><input name="${k}" id="rf_${k}" type="number" min="0" value="${e[k] || ''}"></label>`).join('')}</div></fieldset>
    <div class="wide"><button class="btn accent" type="submit">${ic('check')}Enregistrer</button></div>
  </form>`, 'tall');
}
function importSheet() {
  openSheet(() => `${shead('Importer une recette')}<p class="muted-t">Collez le texte d’une recette (page web, message, livre). Tambouille ne peut pas ouvrir les liens : copiez le contenu de la page.</p>
  <form class="form" data-form="importRecipe"><label class="fld wide"><span>Texte de la recette</span><textarea name="t" id="impT" rows="10" required placeholder="Collez ici le titre, les ingrédients et les étapes"></textarea></label><div class="wide"><button class="btn accent" type="submit" ${UI.aiBusy ? 'disabled' : ''}>${UI.aiBusy ? '<span class="spin"></span>Lecture…' : ic('spark') + 'Structurer avec l’IA'}</button></div></form>`, 'tall');
}
function foodSheet() {
  openSheet(() => `${shead('Ajouter un repas')}
  <form class="form" data-form="foodAI"><label class="fld wide"><span>Décrivez ce que vous avez mangé (estimation par l’IA)</span><input id="fdTxt" name="t" placeholder="Ex. un sandwich jambon-beurre et une pomme" required></label><div class="wide"><button class="btn accent" type="submit" ${UI.aiBusy ? 'disabled' : ''}>${UI.aiBusy ? '<span class="spin"></span>Estimation…' : ic('spark') + 'Estimer'}</button></div></form>
  <h3>Ou saisir les valeurs</h3>
  <form class="form" data-form="foodManual"><label class="fld wide"><span>Libellé</span><input id="fdL" name="label" required></label><div class="nrow wide">${[['kcal', 'kcal'], ['p', 'Prot.'], ['c', 'Gluc.'], ['f', 'Lip.'], ['fiber', 'Fibres']].map(([k, l]) => `<label><span>${l}</span><input name="${k}" id="fd_${k}" type="number" min="0" value="0"></label>`).join('')}</div><div class="wide"><button class="btn ghost" type="submit">Ajouter</button></div></form>
  <h3>Ou depuis une recette</h3><ul class="pick">${[...new Set([...S.hist.map(h => h.rid), ...S.fav, ...S.views])].map(getR).filter(r => r && r.kcal).slice(0, 12).map(r => `<li><button data-act="foodFromRecipe" data-id="${r.id}"><b>${esc(r.title)}</b><span>${r.kcal} kcal · ${r.prot} g prot. par portion</span></button></li>`).join('') || '<li class="muted-t">Vos recettes cuisinées, favorites et consultées apparaîtront ici.</li>'}</ul>`, 'tall');
}
function moreMenu() { openSheet(() => `${shead('Toutes les sections')}<div class="moregrid">${Object.entries(ROUTES).map(([k, [icn, l]]) => `<a href="#${k}" class="${UI.route === k ? 'cur' : ''}">${ic(icn)}<span>${l}</span></a>`).join('')}</div>`); }

/* ===== Actions ===== */
const findItem = id => S.pantry.find(x => x.id === id);
const ACT = {
  go: b => { if (b.dataset.mode) UI.mode = b.dataset.mode; if (b.dataset.inv) { UI.inv = b.dataset.inv; UI.invTab = 'stock'; } go(b.dataset.r); },
  moreMenu, closeSheet,
  keepDemo: () => { save('pantry'); toast('Exemple conservé : modifiez-le librement.'); render(); },
  clearDemo: () => { S.pantry = []; save('pantry'); render(); },
  tonight: () => tonight(false), tonightAgain: () => tonight(true), wheel, spin,
  inv: b => { UI.inv = b.dataset.v; render(); }, invTab: b => { UI.invTab = b.dataset.v; render(); },
  mode: b => { UI.mode = b.dataset.m; render(); },
  gen: b => { UI.gen[b.dataset.k] = b.dataset.v; render(); }, genAI,
  toggleFilters: () => { UI.filtersOpen = !UI.filtersOpen; render(); },
  resetFilters: () => { UI.F = F0(); UI.mode = 'all'; render(); },
  searchIng: b => { UI.F = { ...F0(), q: b.dataset.q }; UI.mode = 'all'; go('recettes'); },
  openRecipe: b => openRecipe(b.dataset.id),
  step: b => { const d = +b.dataset.d, n = b.dataset.n; if (n === 'curServ') { curServ = Math.min(20, Math.max(1, curServ + d)); refreshSheet(); } else if (n === 'cookServ') { cook.serv = Math.min(20, Math.max(1, cook.serv + d)); renderCook(); } else if (n === 'eaten') { UI.finish.eaten = Math.max(0, Math.min(10, UI.finish.eaten + d)); refreshSheet(); } else { S.prefs.servings = Math.min(12, Math.max(1, servings() + d)); save('prefs'); render(); } },
  fitStock: b => { curServ = +b.dataset.n; refreshSheet(); },
  qty: b => { const p = findItem(b.dataset.id); if (!p) return; const old = p.qty; p.qty = Math.max(0, +(p.qty + (+b.dataset.d) * stepFor(p.unit)).toFixed(3)); p.upd = Date.now(); if (old > p.qty) logMove('use', p, +(old - p.qty).toFixed(3)); save('pantry', 'moves'); render(); },
  editItem: b => itemSheet(b.dataset.id), newItem: () => itemSheet(null), manual: () => itemSheet(null),
  delItem: b => { const i = S.pantry.findIndex(x => x.id === b.dataset.id); if (i < 0) return; const [rm] = S.pantry.splice(i, 1); UI.undo = rm; logMove('del', rm); save('pantry', 'moves'); closeSheet(); render(); toast(rm.name + ' supprimé', { act: 'undoDel', label: 'Annuler' }); },
  undoDel: () => { if (UI.undo) { S.pantry.push(UI.undo); UI.undo = null; save('pantry'); render(); } },
  purgeEmpty: () => { S.pantry = S.pantry.filter(p => p.qty > 0); save('pantry'); render(); },
  openItem: b => { const p = findItem(b.dataset.id); p.state = 'ouvert'; p.opened = todayISO(); p.upd = Date.now(); logMove('open', p); save('pantry', 'moves'); closeSheet(); render(); toast(`${p.name} ouvert : à consommer avant le ${fmtDate(effExp(p), { day: 'numeric', month: 'long' })}.`); },
  freeze: b => { const p = findItem(b.dataset.id); const cz = S.spaces.find(s => s.kind === 'congelo'); if (!cz) return toast('Ajoutez d’abord un congélateur dans vos espaces.'); p.loc = cz.id; p.exp = addDays(todayISO(), 90); p.expType = 'DDM'; p.note = `Congelé le ${fmtDate(todayISO(), { day: 'numeric', month: 'short' })}. ${p.note || ''}`.trim(); p.upd = Date.now(); logMove('freeze', p); S.stats.savedN++; S.stats.savedEur += estPrice(p.name, p.qty, p.unit); save('pantry', 'moves', 'stats'); closeSheet(); render(); toast(`${p.name} au congélateur, à consommer d’ici 3 mois. Décongelez au frigo.`); },
  consumed: b => { const p = findItem(b.dataset.id); logMove('use', p); if ((daysLeft(effExp(p)) ?? 9) <= 3) { S.stats.savedN++; S.stats.savedEur += estPrice(p.name, p.qty, p.unit); } p.qty = 0; save('pantry', 'moves', 'stats'); render(); },
  waste: b => { const p = findItem(b.dataset.id); logMove('waste', p); S.stats.wastedN++; S.stats.wastedEur += estPrice(p.name, p.qty, p.unit); S.pantry = S.pantry.filter(x => x.id !== p.id); save('pantry', 'moves', 'stats'); closeSheet(); render(); toast(`${p.name} noté comme jeté.`); },
  cookWith: b => { const p = findItem(b.dataset.id); UI.F = { ...F0(), must: p.name }; UI.mode = 'all'; UI.filtersOpen = true; go('recettes'); },
  spaces: spacesSheet,
  delSpace: b => { const id = b.dataset.id; const other = S.spaces.find(s => s.id !== id); S.pantry.forEach(p => { if (p.loc === id) p.loc = other.id; }); S.spaces = S.spaces.filter(s => s.id !== id); if (UI.inv === id) UI.inv = 'all'; save('spaces', 'pantry'); render(); },
  itemPhoto: () => $('#fileItemPhoto').click(),
  rmItemPhoto: () => { UI.itemPhoto = null; const f = $('form[data-form=saveItem]'); f.dataset.photo = 'none'; f.querySelector('.photo').innerHTML = `<span class="muted-t">La photo sera retirée à l’enregistrement.</span>`; },
  pick: b => { UI.fileKind = b.dataset.k; const f = $('#filePhoto'); f.multiple = b.dataset.k === 'scan' || b.dataset.k === 'gen'; f.click(); },
  voice: () => voiceAdd(),
  confirmReview: () => { const its = UI.review.filter(x => x.keep && x.name).map(({ keep, confidence, dup, ...x }) => ({ ...x, qty: Number(x.qty) || 1, uncertain: !!x.uncertain })); if (!its.length) return toast('Cochez au moins un aliment.'); addItems(its, UI.reviewNote); closeSheet(); const nu = its.filter(x => x.uncertain).length; toast(`${pl(its.length, 'aliment')} ajouté${its.length > 1 ? 's' : ''}${nu ? `, dont ${nu} à vérifier` : ''}.`); if (UI.afterReview === 'gen') { UI.afterReview = null; UI.gen.mode = 'stock'; go('recettes'); genAI(); } },
  fav: () => { const id = curR.id; S.fav = isFav(id) ? S.fav.filter(x => x !== id) : [id, ...S.fav]; save('fav'); refreshSheet(); render(); },
  rate: b => { const n = +b.dataset.n; S.notes[curR.id] = { ...(S.notes[curR.id] || {}), stars: S.notes[curR.id]?.stars === n ? 0 : n }; save('notes'); refreshSheet(); },
  finRate: b => { UI.finish.stars = +b.dataset.n; refreshSheet(); },
  tech: b => toast(`${b.dataset.t} : ${TECH[b.dataset.t] || TECH[b.dataset.t.toLowerCase()] || ''}`),
  askAbout: () => openChat(`Adapte « ${curR.title} » à mon frigo et propose des substitutions pour ce qui manque.`, curR.id),
  askStep: () => openChat(`Étape ${cook.i + 1} : `, cook.r.id),
  shareRecipe: () => copyText(recipeText(curR, curServ)),
  exportRecipe: () => download(`${norm(curR.title).replace(/ /g, '-') || 'recette'}.txt`, recipeText(curR, curServ)),
  missingToShop: () => { const ls = missingLines(curR, curServ); ls.forEach(l => addShop(l.n, l.q, l.u, curR.title)); save('shopping'); toast(`${pl(ls.length, 'article')} ajouté${ls.length > 1 ? 's' : ''} aux courses.`, { act: 'goShop', label: 'Voir' }); },
  goShop: () => { closeSheet(); go('courses'); }, goPlan: () => { closeSheet(); go('planning'); }, goInv: () => go('inventaire'),
  askDel: () => { UI.confirmDel = true; refreshSheet(); }, cancelDel: () => { UI.confirmDel = false; refreshSheet(); },
  delRecipe: () => { const id = curR.id; S.ai = S.ai.filter(r => r.id !== id); S.fav = S.fav.filter(x => x !== id); Object.values(S.plan).forEach(o => Object.keys(o).forEach(k => { if (o[k] === id) delete o[k]; })); save('ai', 'fav', 'plan'); closeSheet(); render(); toast('Recette supprimée.'); },
  editRecipe: () => recipeForm(curR), newRecipe: () => recipeForm(null), importRecipe: importSheet,
  startCook, exitCook, cookPrev: () => cookMove(-1), cookNext: () => cookMove(1), cookGo: b => { cook.i = +b.dataset.i; renderCook(); },
  toggleIngr: () => { cook.ingr = !cook.ingr; renderCook(); }, handsFree: () => { handsFree(!cook.hands); renderCook(); }, speak: () => speak(cook.r.steps[cook.i]),
  timer: b => addTimer(+b.dataset.sec, b.dataset.label),
  customTimer: () => { const el = $('#cook .cstep'); if (el.querySelector('.ctform')) return; el.insertAdjacentHTML('beforeend', `<form class="row ctform" data-form="ctimer"><label class="sr" for="ctMin">Minutes</label><input id="ctMin" name="m" type="number" min="1" max="360" value="5" inputmode="numeric"><span>min</span><button class="btn accent sm" type="submit">Lancer</button></form>`); $('#ctMin').focus(); },
  delTimer: b => { UI.timers = UI.timers.filter(t => t.id !== b.dataset.id); renderTimers(); },
  finishCook,
  applyConsume: () => {
    $$('[data-cons]').forEach(inp => { consume[+inp.dataset.cons].take = Math.max(0, parseFloat(String(inp.value).replace(',', '.')) || 0); });
    const rm = $('#rmEmpty')?.checked;
    consume.forEach(c => { const p = findItem(c.id); if (!p || !c.take) return; const t = Math.min(c.take, p.qty); p.qty = Math.max(0, +(p.qty - t).toFixed(3)); p.upd = Date.now(); if (p.state === 'neuf' && p.qty > 0) { p.state = 'entame'; p.opened = p.opened || todayISO(); } logMove('use', p, +t.toFixed(3), curR.title); if (c.gaspi) { S.stats.savedN++; S.stats.savedEur += estPrice(p.name, t, p.unit); } });
    const gone = S.pantry.filter(p => p.qty <= 0).length; if (rm) S.pantry = S.pantry.filter(p => p.qty > 0);
    logCooked(curR, curServ); save('pantry', 'moves', 'stats'); closeSheet(); render();
    toast(`Stock mis à jour${rm && gone ? ` · ${pl(gone, 'aliment épuisé', 'aliments épuisés')}` : ''}.`);
  },
  skipConsume: () => { logCooked(curR, curServ); closeSheet(); render(); },
  week: b => { const w = +b.dataset.w; UI.weekOffset = w === 0 ? 0 : UI.weekOffset + w; render(); },
  autoPlan: b => autoPlan(+b.dataset.n), pickPlan: b => pickPlan(b.dataset.d, b.dataset.s), replaceSlot: b => replaceSlot(b.dataset.d, b.dataset.s), moveSlot: b => moveSlot(b.dataset.d, b.dataset.s),
  doMove: b => { const { d, s, d2, s2 } = b.dataset; const a = S.plan[d]?.[s], z = S.plan[d2]?.[s2]; S.plan[d2] = S.plan[d2] || {}; S.plan[d2][s2] = a; if (z) S.plan[d][s] = z; else delete S.plan[d][s]; save('plan'); closeSheet(); render(); },
  setPlan: b => { S.plan[b.dataset.d] = { ...(S.plan[b.dataset.d] || {}), [b.dataset.s]: b.dataset.id }; save('plan'); closeSheet(); render(); },
  unplan: b => { if (S.plan[b.dataset.d]) delete S.plan[b.dataset.d][b.dataset.s]; save('plan'); render(); },
  planToShop: () => { const start = weekStart(UI.weekOffset), T = todayISO(); const ids = [...Array(7)].map((_, i) => addDays(start, i)).filter(d => d >= T).flatMap(d => Object.values(S.plan[d] || {})); const need = periodNeeds(ids); need.forEach(l => addShop(l.n, l.q, l.u, l.from)); save('shopping'); toast(need.length ? `${pl(need.length, 'ingrédient')} ajouté${need.length > 1 ? 's' : ''}, stock déjà déduit.` : 'Rien à acheter : tout est en stock.', need.length ? { act: 'goShop', label: 'Voir' } : null); },
  toggleShop: b => { const s = S.shopping.find(x => x.id === b.dataset.id); if (s) { s.done = b.checked; save('shopping'); render(); } },
  delShop: b => { S.shopping = S.shopping.filter(x => x.id !== b.dataset.id); save('shopping'); render(); },
  clearDone: () => { S.shopping = S.shopping.filter(x => !x.done); save('shopping'); render(); },
  addEssential: b => { addShop(b.dataset.n, 0, 'pc', 'Basique'); save('shopping'); render(); },
  finishShopping: () => {
    const done = S.shopping.filter(x => x.done), total = done.reduce((a, s) => a + estPrice(s.name, s.qty || 1, s.unit || 'pc'), 0);
    S.shopLists.unshift({ id: uid(), date: todayISO(), items: done.map(({ name, qty, unit }) => ({ name, qty, unit })), total }); S.shopLists = S.shopLists.slice(0, 25);
    S.shopping = S.shopping.filter(x => !x.done); save('shopping', 'shopLists');
    addItems(done.map(s => makeItem({ name: s.name.charAt(0).toUpperCase() + s.name.slice(1), qty: s.qty || 1, unit: s.unit || 'pc' })), 'buy');
    toast(`${pl(done.length, 'article')} rangé${done.length > 1 ? 's' : ''}. Vérifiez les dates dans l’inventaire.`, { act: 'goInv', label: 'Voir' });
  },
  openShopList: b => { UI.openShopList = UI.openShopList === b.dataset.id ? null : b.dataset.id; render(); },
  reuseList: b => { const l = S.shopLists.find(x => x.id === b.dataset.id); l.items.forEach(i => addShop(i.name, i.qty, i.unit, 'Ancienne liste')); save('shopping'); render(); toast('Articles remis dans la liste.'); },
  ask: b => ask(b.dataset.q), clearChat: () => { UI.chat = []; UI.chatRecipe = null; refreshChat(); }, clearCtx: () => { UI.chatRecipe = null; refreshChat(); },
  lib: b => { UI.lib = b.dataset.v; render(); },
  nday: b => { UI.nutriDay = addDays(UI.nutriDay || todayISO(), +b.dataset.d); if (UI.nutriDay > todayISO()) UI.nutriDay = todayISO(); render(); },
  addFood: foodSheet, delFood: b => { S.food = S.food.filter(f => f.id !== b.dataset.id); save('food'); render(); },
  foodFromRecipe: b => { const r = getR(b.dataset.id); S.food.push({ id: uid(), date: UI.nutriDay || todayISO(), slot: UI.foodSlot || slotNow(), label: r.title, kcal: r.kcal, p: r.prot, c: r.carbs, f: r.fat, fiber: r.fiber, rid: r.id, est: true }); save('food'); closeSheet(); render(); },
  profilSec: b => { UI.ptab = { prefs: 'culinaire', accueil: 'apparence' }[b.dataset.s] || b.dataset.s; go('profil'); },
  theme: b => { S.prefs.theme = b.dataset.v; save('prefs'); applyTheme(); render(); }, accent: b => { S.prefs.accent = b.dataset.v; save('prefs'); applyTheme(); render(); },
  widgetOn: b => { S.prefs.widgets[+b.dataset.i].on = b.checked; save('prefs'); },
  widgetMove: b => { const i = +b.dataset.i, j = i + +b.dataset.d, w = S.prefs.widgets; [w[i], w[j]] = [w[j], w[i]]; save('prefs'); render(); },
  joinFoyer: async () => { try { S.prefs.foyer = true; await connectFoyer(); save('prefs'); setSync('ok'); toast('Vous êtes dans le foyer : inventaire, courses et planning sont partagés.'); render(); } catch { S.prefs.foyer = false; CL.foyerOn = false; toast('Impossible de rejoindre le foyer : il faut le droit « peut interagir » sur cette appli.'); } },
  leaveFoyer: async () => { S.prefs.foyer = false; CL.unsubF?.(); CL.unsubF = null; try { await CL.foyer.doc('m_' + CL.uid).delete(); } catch {} CL.foyerOn = false; UI.members = {}; save('prefs'); try { const s = await CL.perso.get(); applyDocs(s, 'perso', true); } catch {} setSync('ok'); render(); toast('Vous avez quitté le foyer. Vos données personnelles sont rétablies.'); },
  exportData: () => download(`tambouille-${todayISO()}.json`, JSON.stringify({ app: 'Tambouille', version: 2, exported: new Date().toISOString(), data: S }, null, 1)),
  importData: () => $('#fileBackup').click(),
  askReset: () => { UI.confirmReset = true; render(); }, cancelReset: () => { UI.confirmReset = false; render(); },
  doReset: () => { UI.confirmReset = false; Object.assign(S, { pantry: [], spaces: DEFAULT_SPACES.map(s => ({ ...s })), moves: [], shopping: [], shopLists: [], plan: {}, fav: [], hist: [], ai: [], notes: {}, views: [], food: [], stats: { savedN: 0, savedEur: 0, wastedN: 0, wastedEur: 0 }, prefs: JSON.parse(JSON.stringify(DEF_PREFS)) }); save(...KEYS); applyTheme(); render(); toast('Toutes vos données ont été effacées.'); },
};
function voiceAdd() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const fallback = () => { go('scanner'); setTimeout(() => $('#quickAdd')?.focus(), 60); toast('Micro indisponible ici : utilisez la dictée de votre clavier (icône micro) dans le champ.'); };
  if (!SR) return fallback();
  try { const r = new SR(); r.lang = 'fr-FR'; toast('Je vous écoute… ex. « six œufs et un litre de lait »'); r.onresult = e => { const t = [...e.results].map(x => x[0].transcript).join(' '); const items = parseFreeText(t).map(x => ({ ...makeItem(x), keep: true, confidence: 1 })); if (items.length) reviewItems(items, 'Aliments dictés'); }; r.onerror = fallback; r.start(); } catch { fallback(); }
}

/* ===== Délégation d'événements ===== */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  if (b.tagName === 'INPUT') return;
  const f = ACT[b.dataset.act]; if (f) { e.preventDefault(); f(b, e); }
});
let liveT = null;
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.live) { clearTimeout(liveT); const id = t.id; liveT = setTimeout(() => { const pos = t.selectionStart; const [a, b] = t.dataset.live.split('.'); if (b) UI[a][b] = t.value; else UI[a] = t.value; render(); const n = document.getElementById(id); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch {} } }, 220); return; }
  if (t.dataset.rv != null && t.dataset.k !== 'keep') { const it = UI.review[+t.dataset.rv]; it[t.dataset.k] = t.dataset.k === 'qty' ? parseFloat(t.value) || 0 : t.value; return; }
  if (t.dataset.g) { UI.gen[t.dataset.g] = t.value; return; }
  if (t.id === 'chatIn') UI.chatDraft = t.value;
});
document.addEventListener('change', async e => {
  const t = e.target;
  if (t.matches('input[type=checkbox][data-act]')) return ACT[t.dataset.act]?.(t);
  if (t.dataset.f) { UI.F[t.dataset.f] = t.value === '' || isNaN(+t.value) ? t.value : +t.value; return render(); }
  if (t.dataset.fc) { UI.F[t.dataset.fc] = t.checked; return render(); }
  if (t.dataset.g) { UI.gen[t.dataset.g] = t.value; return; }
  if (t.dataset.pref) { S.prefs[t.dataset.pref] = Math.max(0, +t.value || 0); save('prefs'); return render(); }
  if (t.dataset.note) { S.notes[curR.id] = { ...(S.notes[curR.id] || {}), text: t.value.slice(0, 500) }; save('notes'); return toast('Note enregistrée.'); }
  if (t.dataset.space) { const s = S.spaces.find(x => x.id === t.dataset.space); s.name = t.value.trim().slice(0, 30) || s.name; save('spaces'); return render(); }
  if (t.dataset.spacek) { S.spaces.find(x => x.id === t.dataset.spacek).kind = t.value; save('spaces'); return; }
  if (t.dataset.rv != null) { const it = UI.review[+t.dataset.rv], k = t.dataset.k; it[k] = k === 'keep' ? t.checked : k === 'qty' ? parseFloat(t.value) || 0 : t.value; if (k === 'keep') refreshSheet(); return; }
  if (t.id === 'filePhoto') { const fs = t.files; if (fs?.length) scanImages([...fs], UI.fileKind); t.value = ''; return; }
  if (t.id === 'fileItemPhoto') { const f = t.files?.[0]; t.value = ''; if (!f) return; try { const as = await photoStore(); if (!as) return toast(IN_CLAUDE ? 'L’ajout de photos n’est pas disponible pour votre accès.' : 'Connectez-vous à votre compte pour ajouter des photos.'); const res = await as.upload(await compress(f, 640)); UI.itemPhoto = res.id; const fm = $('form[data-form=saveItem]'); if (fm) { fm.dataset.photo = res.id; fm.querySelector('.photo').innerHTML = `<img src="${esc(res.url)}" alt="Photo de l’aliment"><span class="muted-t">Enregistrez pour conserver la photo.</span>`; } } catch { toast('La photo n’a pas pu être envoyée.'); } return; }
  if (t.id === 'fileBackup') { const f = t.files?.[0]; t.value = ''; if (!f) return; try { const j = JSON.parse(await f.text()); const d = j.data || j; if (!Array.isArray(d.pantry)) throw 0; KEYS.forEach(k => { if (d[k] != null) loadKey(k, d[k]); }); migrate(); save(...KEYS); applyTheme(); render(); toast('Sauvegarde restaurée.'); } catch { toast('Ce fichier n’est pas une sauvegarde Tambouille valide.'); } }
});
document.addEventListener('submit', async e => {
  const f = e.target.closest('form[data-form]'); if (!f) return; e.preventDefault();
  const fd = new FormData(f), kind = f.dataset.form, num = k => Math.max(0, parseFloat(fd.get(k)) || 0);
  if (kind === 'quickAdd') { const items = parseFreeText(fd.get('t')).map(x => ({ ...makeItem(x), keep: true, confidence: 1 })); if (!items.length) return toast('Écrivez par exemple « 6 œufs, 500 g de farine ».'); if (items.length === 1) { const { keep, confidence, ...it } = items[0]; addItems([it]); toast(`${it.name} ajouté · ${it.expType === 'est' ? 'date estimée au' : 'à consommer avant le'} ${fmtDate(it.exp, { day: 'numeric', month: 'long' })}.`, { act: 'editItem', id: it.id, label: 'Modifier' }); } else reviewItems(items, `${pl(items.length, 'aliment')} à ajouter`); return; }
  if (kind === 'saveItem') {
    const id = f.dataset.id, nu = ['kcal', 'p', 'c', 'f'].some(k => fd.get('n_' + k) !== '') ? Object.fromEntries(['kcal', 'p', 'c', 'f'].map(k => [k, num('n_' + k)])) : null;
    const v = { name: String(fd.get('name')).trim(), brand: String(fd.get('brand') || '').trim(), qty: num('qty'), unit: fd.get('unit'), loc: fd.get('loc'), cat: fd.get('cat'), state: fd.get('state'), exp: fd.get('exp') || null, expType: fd.get('expType'), bought: fd.get('bought') || null, opened: fd.get('opened') || (fd.get('state') !== 'neuf' ? todayISO() : null), note: String(fd.get('note') || ''), nutri: nu, uncertain: false, upd: Date.now() };
    if (f.dataset.photo) v.photo = f.dataset.photo === 'none' ? null : f.dataset.photo;
    if (!v.name) return;
    if (id) { const p = findItem(id); Object.assign(p, v, { cat: v.cat || p.cat, expType: v.expType || p.expType, exp: v.exp || p.exp }); logMove('edit', p); } else { const it = { ...makeItem({ ...v, cat: v.cat || null, exp: v.exp || null, expType: v.expType || null }), v: 2 }; S.pantry.push(it); logMove('add', it); }
    save('pantry', 'moves'); closeSheet(); render(); return;
  }
  if (kind === 'addSpace') { const n = String(fd.get('n')).trim().slice(0, 30); if (!n) return; S.spaces.push({ id: 's' + uid(), name: n, kind: fd.get('k') }); save('spaces'); refreshSheet(); render(); return; }
  if (kind === 'addShop') { parseFreeText(fd.get('t')).forEach(x => addShop(x.name, x.qty, x.unit)); save('shopping'); render(); setTimeout(() => $('#addShop')?.focus(), 0); return; }
  if (kind === 'chat') { const q = String(fd.get('t') || ''); ask(q); return; }
  if (kind === 'planRecipe') { const d = fd.get('d'), s = fd.get('s'); S.plan[d] = { ...(S.plan[d] || {}), [s]: curR.id }; save('plan'); toast('Ajouté au planning.', { act: 'goPlan', label: 'Voir' }); return; }
  if (kind === 'ctimer') { const m = Math.max(1, Math.min(360, +fd.get('m') || 5)); addTimer(m * 60, `${m} min`); f.remove(); return; }
  if (kind === 'prefs') { const sl = fd.getAll('slot'); S.prefs = { ...S.prefs, servings: Math.max(1, Math.min(12, +fd.get('servings') || 2)), diet: fd.get('diet'), allergies: fd.getAll('al'), dislikes: String(fd.get('dislikes') || '').trim(), equipment: fd.getAll('eq'), level: fd.get('level'), alertDays: +fd.get('alertDays') || 3, staples: String(fd.get('staples') || '').trim(), essentials: String(fd.get('essentials') || '').trim(), slots: sl.length ? Object.keys(SLOTS).filter(s => sl.includes(s)) : ['midi', 'soir'], memory: String(fd.get('memory') || '').slice(0, 1500) }; save('prefs'); writeMember(); render(); toast('Préférences enregistrées.'); return; }
  if (kind === 'goals') { S.prefs.goals = { kcal: num('kcal') || 2000, p: num('p'), c: num('c'), f: num('f'), fiber: num('fiber') }; save('prefs'); render(); toast('Objectifs enregistrés.'); return; }
  if (kind === 'conv') { const q = parseFloat(fd.get('q')) || 0, from = fd.get('from'), to = fd.get('to'), n = String(fd.get('name') || ''); const r = convert(q, from, to, n); const lab = (v, u) => u === 'pc' ? `${r1(v)} pièce(s)` : fmtQty(v, u); UI.cv = { q, from, to, n }; UI.cvOut = r == null ? 'Conversion impossible : indiquez un ingrédient au poids connu (œuf, oignon, tomate…).' : `${lab(q, from)} = ${lab(r, to)}${['g', 'kg'].includes(from) !== ['g', 'kg'].includes(to) && from !== 'pc' && to !== 'pc' ? ' (densité de l’eau)' : ''}`; render(); return; }
  if (kind === 'saveRecipe') {
    const ingr = String(fd.get('ingr')).split('\n').map(l => l.trim()).filter(Boolean).map(l => { const p = parseLine(l); return p ? { name: p.name.charAt(0).toLowerCase() + p.name.slice(1), qty: p.qty, unit: p.unit } : null; }).filter(Boolean);
    const r = sanitizeRecipe({ title: fd.get('title'), description: fd.get('desc'), meal: fd.get('meal'), cuisine: fd.get('cuisine'), servings: +fd.get('servings'), difficulty: +fd.get('diff'), prep: +fd.get('prep'), cook: +fd.get('cook'), ingredients: ingr, steps: String(fd.get('steps')).split('\n').map(s => s.trim()).filter(Boolean), equipment: String(fd.get('equip') || '').split(',').map(s => s.trim()).filter(Boolean), tip: fd.get('tip'), storage: fd.get('storage'), kcal: num('kcal'), protein: num('prot'), carbs: num('carbs'), fat: num('fat'), fiber: num('fiber'), hue: hash(fd.get('title')) % 360 }, 'perso');
    if (!r) return toast('Il faut au moins un ingrédient et une étape.');
    const id = f.dataset.id; if (id) { r.id = id; r.src = S.ai.find(x => x.id === id)?.src || 'perso'; S.ai = S.ai.map(x => x.id === id ? r : x); } else S.ai.unshift(r);
    save('ai'); closeSheet(); render(); openRecipe(r.id); toast('Recette enregistrée.'); return;
  }
  if (kind === 'importRecipe') { if (!(await AI.ready())) return; UI.aiBusy = true; const txt = String(fd.get('t')); refreshSheet(); try { const out = await AI.json(`Transforme ce texte de recette en JSON structuré, sans rien inventer d'absent (estime seulement les valeurs nutritionnelles, la difficulté et le matériel). Si une information manque, laisse vide. Texte :\n"""${txt.slice(0, 12000)}"""\nRéponds uniquement en JSON : ${RECIPE_SCHEMA}`); const r = sanitizeRecipe(out, 'import'); if (!r) throw { code: 'invalid_json' }; S.ai.unshift(r); save('ai'); UI.aiBusy = false; closeSheet(); render(); openRecipe(r.id); toast('Recette importée.'); } catch (er) { UI.aiBusy = false; if (sheetRender) refreshSheet(); aiErr(er); } return; }
  if (kind === 'foodAI') { if (!(await AI.ready())) return; UI.aiBusy = true; const txt = String(fd.get('t')); refreshSheet(); try { const out = await AI.json(`Estime les apports nutritionnels de ce repas (portions françaises courantes) : "${txt.slice(0, 300)}". Réponds uniquement en JSON : {"label":"libellé court","kcal":0,"p":0,"c":0,"f":0,"fiber":0}`); const v = k => Math.max(0, Math.round(Number(out?.[k]) || 0)); S.food.push({ id: uid(), date: UI.nutriDay || todayISO(), slot: UI.foodSlot || slotNow(), label: String(out?.label || txt).slice(0, 80), kcal: v('kcal'), p: v('p'), c: v('c'), f: v('f'), fiber: v('fiber'), est: true }); save('food'); UI.aiBusy = false; closeSheet(); render(); } catch (er) { UI.aiBusy = false; if (sheetRender) refreshSheet(); aiErr(er); } return; }
  if (kind === 'foodManual') { S.food.push({ id: uid(), date: UI.nutriDay || todayISO(), slot: UI.foodSlot || slotNow(), label: String(fd.get('label')).slice(0, 80), kcal: num('kcal'), p: num('p'), c: num('c'), f: num('f'), fiber: num('fiber'), est: false }); save('food'); closeSheet(); render(); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (sheetRender) closeSheet(); else if (cook) exitCook(); } });
$('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet') closeSheet(); });

/* ===== Démarrage ===== */
function demoPantry() {
  const T = todayISO();
  return [['Œufs', 6, 'pc', 2], ['Champignons de Paris', 250, 'g', 1], ['Courgette', 2, 'pc', 3], ['Lait demi-écrémé', 1, 'l', 5], ['Emmental râpé', 150, 'g', 12], ['Crème liquide', 20, 'cl', 2], ['Beurre', 250, 'g', 30], ['Spaghetti', 500, 'g', 400], ['Riz basmati', 1, 'kg', 400], ['Tomates concassées', 400, 'g', 300], ['Oignon', 3, 'pc', 20], ['Lardons', 200, 'g', 4], ['Pommes de terre', 1.5, 'kg', 25], ['Farine', 1, 'kg', 200]]
    .map(([name, qty, unit, d]) => ({ ...makeItem({ name, qty, unit, exp: addDays(T, d) }), v: 2 }));
}
