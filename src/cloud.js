/* ===== Tambouille — comptes (Supabase Auth), synchronisation PostgreSQL, photos, proxy IA, installation ===== */
const APP_VERSION = '3.1.0';
const SITE_URL = 'https://tambouille-vercel.vercel.app';
const SB_URL = 'https://ufqdplmibnczqnpmkgjq.supabase.co';
const SB_KEY = 'sb_publishable_UVBJjovoii0HKOGJ5KmqaQ_-PDzRq5i'; // clé publique : la sécurité repose sur les règles RLS
const DOWNLOADS = { apk: '', exe: '', page: '' }; // renseignés uniquement quand les fichiers existent réellement
const IN_CLAUDE = !!window.claude?.use;
const IS_WEB = /^https?:$/.test(location.protocol) && !/^(localhost|127\.)/.test(location.hostname);
const API_BASE = IS_WEB && location.hostname.endsWith('vercel.app') ? '' : SITE_URL;
const SB = { client: null, user: null, profile: null, chan: null, lastWrite: {}, avatarUrl: '' };
UI.auth = 'login'; UI.photoUrls = {}; if (!IN_CLAUDE) UI.ptab = 'compte';

/* ----- Stockage de session : « rester connecté » = localStorage, sinon sessionStorage ----- */
const keep = () => { try { return localStorage.getItem('tambouille-keep') !== '0'; } catch { return true; } };
const authStorage = {
  getItem: k => { try { return (keep() ? localStorage : sessionStorage).getItem(k); } catch { return null; } },
  setItem: (k, v) => { try { (keep() ? localStorage : sessionStorage).setItem(k, v); } catch {} },
  removeItem: k => { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch {} },
};

/* ----- Adaptateur : même interface que la base de l'artefact (collection/doc/get/onSnapshot) ----- */
const snapOf = rows => ({ empty: !rows.length, docs: rows.map(r => ({ id: r.key, data: () => ({ json: JSON.stringify(r.data) }), metadata: { hasPendingWrites: false } })) });
function sbCollection(uid) {
  return {
    doc: key => ({
      set: async v => { const ts = new Date().toISOString(); SB.lastWrite[key] = ts; const { error } = await SB.client.from('user_data').upsert({ user_id: uid, key, data: JSON.parse(v.json), updated_at: ts }); if (error) throw error; },
      delete: async () => { const { error } = await SB.client.from('user_data').delete().eq('user_id', uid).eq('key', key); if (error) throw error; },
    }),
    get: async () => { const { data, error } = await SB.client.from('user_data').select('key,data').eq('user_id', uid); if (error) throw error; return snapOf(data || []); },
    onSnapshot: (fn, err) => {
      SB.chan?.unsubscribe();
      SB.chan = SB.client.channel('ud-' + uid).on('postgres_changes', { event: '*', schema: 'public', table: 'user_data', filter: `user_id=eq.${uid}` }, p => {
        const row = p.new; if (!row?.key || SB.lastWrite[row.key] === row.updated_at) return;
        fn(snapOf([row]));
      }).subscribe(st => { if (st === 'CHANNEL_ERROR') err?.(); });
      return () => SB.chan?.unsubscribe();
    },
  };
}

/* ----- Démarrage du mode compte (hors Claude) ----- */
async function initSupabase() {
  setSync('local');
  if (IN_CLAUDE || !window.supabase?.createClient) return;
  try {
    SB.client = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce', storage: authStorage } });
    SB.client.auth.onAuthStateChange((ev, session) => {
      if (ev === 'PASSWORD_RECOVERY') { UI.recovery = true; UI.ptab = 'compte'; go('profil'); }
      if (session?.user && SB.user?.id !== session.user.id) setTimeout(() => connectAccount(session.user), 0);
      if (ev === 'SIGNED_OUT' && SB.user) leaveAccount(false);
      if (ev === 'USER_UPDATED' && session?.user) { SB.user = session.user; render(); }
    });
    const { data } = await SB.client.auth.getSession();
    if (data.session) await connectAccount(data.session.user);
    else render();
  } catch { setSync('local'); }
}
async function connectAccount(user) {
  if (SB.user?.id === user.id && CL.perso) return;
  SB.user = user; CL.uid = user.id; AI.name = 'proxy'; AI._p = null;
  try {
    const { data: prof } = await SB.client.from('profiles').select('first_name,last_name,avatar_path').eq('id', user.id).maybeSingle();
    SB.profile = prof || { first_name: user.user_metadata?.first_name || '', last_name: user.user_metadata?.last_name || '' };
    CL.me = { name: [SB.profile.first_name, SB.profile.last_name].filter(Boolean).join(' ') || user.email };
    if (SB.profile.avatar_path) signedUrl(SB.profile.avatar_path).then(u => { SB.avatarUrl = u; render(); });
    CL.perso = sbCollection(user.id);
    setSync('saving');
    const snap = await CL.perso.get();
    if (snap.empty) { if (UI.demo) { S.pantry = []; UI.demo = false; } save(...KEYS); toast('Compte prêt : vos données de cet appareil y sont maintenant enregistrées.'); }
    else {
      const local = lsLoad(); if (local && !local.__demo && (local.pantry || []).length) { try { localStorage.setItem('tambouille-guest', JSON.stringify(local)); } catch {} }
      applyDocs(snap, 'perso', true); UI.demo = false;
      if (local && !local.__demo && (local.pantry || []).length) toast('Données de votre compte chargées.', { act: 'mergeGuest', label: 'Ajouter l’inventaire invité' });
    }
    CL.perso.onSnapshot(s => applyDocs(s, 'perso', false), () => setSync('err'));
    setSync('ok'); render();
  } catch (e) { setSync('err'); toast('Synchronisation impossible pour le moment. Vos modifications restent sur cet appareil.'); }
}
function leaveAccount(clear = true) {
  SB.chan?.unsubscribe(); SB.chan = null; SB.user = null; SB.profile = null; SB.avatarUrl = ''; CL.perso = null; CL.uid = null; CL.me = null; AI.name = 'claude'; AI._p = null; dirty.clear();
  if (clear) { Object.assign(S, { pantry: [], spaces: DEFAULT_SPACES.map(s => ({ ...s })), moves: [], shopping: [], shopLists: [], plan: {}, fav: [], hist: [], ai: [], notes: {}, views: [], food: [], scans: [], searches: [], stats: { savedN: 0, savedEur: 0, wastedN: 0, wastedEur: 0 }, prefs: JSON.parse(JSON.stringify(DEF_PREFS)) }); migrate(); lsSave(); applyTheme(); applyLook(); }
  setSync('local'); render();
}

/* ----- Photos : stockage privé Supabase (dossier <uid>/) ou ressources de l'artefact ----- */
async function signedUrl(path) { const { data } = await SB.client.storage.from('photos').createSignedUrl(path, 3600); return data?.signedUrl || ''; }
function photoSrc(id) {
  if (!id) return '';
  if (!String(id).startsWith('sb:')) return '/_blob/' + id;
  const path = id.slice(3); if (UI.photoUrls[path]) return UI.photoUrls[path];
  if (SB.client && UI.photoUrls[path] !== '') { UI.photoUrls[path] = ''; signedUrl(path).then(u => { if (u) { UI.photoUrls[path] = u; render(); } }); }
  return 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
}
async function photoStore() {
  if (IN_CLAUDE) return window.claude.use('assets');
  if (!SB.user) return null;
  return {
    upload: async blob => { const path = `${SB.user.id}/${uid()}.jpg`; const { error } = await SB.client.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg' }); if (error) throw error; const url = await signedUrl(path); UI.photoUrls[path] = url; return { id: 'sb:' + path, url }; },
    list: async () => { const { data } = await SB.client.storage.from('photos').list(SB.user.id, { limit: 200 }); const out = []; for (const f of data || []) { const path = `${SB.user.id}/${f.name}`; out.push({ id: 'sb:' + path, url: await signedUrl(path), contentType: 'image/jpeg' }); } return { assets: out }; },
    delete: async id => { await SB.client.storage.from('photos').remove([String(id).slice(3)]); return { deleted: true }; },
  };
}
function downloadFallback(filename, data) {
  try { const blob = data instanceof Blob ? data : new Blob([data], { type: filename.endsWith('.json') ? 'application/json' : 'text/plain;charset=utf-8' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); toast('Fichier téléchargé : ' + filename); } catch { toast('Le téléchargement n’est pas disponible ici.'); }
}

/* ----- IA via le proxy serveur (/api/ai) : clé Anthropic côté serveur uniquement ----- */
async function proxyCall(body) {
  const { data } = await SB.client.auth.getSession(); const tok = data.session?.access_token;
  if (!tok) throw { code: 'auth' };
  const r = await fetch(API_BASE + '/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok }, body: JSON.stringify(body) }).catch(() => { throw { code: 'network' }; });
  if (r.status === 401) throw { code: 'auth' }; if (r.status === 429) throw { code: 'rate_limited' }; if (r.status === 503) throw { code: 'not_configured' };
  if (!r.ok) throw { code: 'server' };
  return r.json();
}
const b64 = blob => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.onerror = rej; fr.readAsDataURL(blob); });
async function toMessages(input, images) {
  if (Array.isArray(input)) return input.map(m => ({ role: m.role, content: m.content }));
  const content = [];
  for (const im of [].concat(images || [])) content.push({ type: 'image', source: { type: 'base64', media_type: im.type || 'image/jpeg', data: await b64(im) } });
  content.push({ type: 'text', text: input });
  return [{ role: 'user', content }];
}
function parseJSONText(t) { const s = t.indexOf('{'), e = t.lastIndexOf('}'); if (s < 0 || e < s) throw { code: 'invalid_json' }; try { return JSON.parse(t.slice(s, e + 1)); } catch { throw { code: 'invalid_json' }; } }
const blocksText = r => (r.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
AI_PROVIDERS.proxy = {
  connect: async () => (SB.user ? {} : null),
  images: async () => true,
  json: async (h, input, o = {}) => parseJSONText(blocksText(await proxyCall({ messages: await toMessages(input, o.images), max_tokens: 8000 }))),
  text: async (h, input, o = {}) => {
    const msgs = await toMessages(input), tools = (o.tools || []).map(t => ({ name: t.name, description: t.description, input_schema: t.inputSchema || { type: 'object', properties: {} } }));
    let text = '';
    for (let i = 0; i < 6; i++) {
      const r = await proxyCall({ messages: msgs, tools: tools.length ? tools : undefined, max_tokens: 4000 });
      text += blocksText(r); o.onText?.({ text, delta: '' });
      const uses = (r.content || []).filter(b => b.type === 'tool_use');
      if (r.stop_reason !== 'tool_use' || !uses.length) break;
      msgs.push({ role: 'assistant', content: r.content });
      const results = [];
      for (const u of uses) { const tool = (o.tools || []).find(t => t.name === u.name); try { const out = await tool.execute(u.input || {}, {}); results.push({ type: 'tool_result', tool_use_id: u.id, content: JSON.stringify(out ?? null) }); } catch (e) { results.push({ type: 'tool_result', tool_use_id: u.id, content: String(e?.message || e), is_error: true }); } }
      msgs.push({ role: 'user', content: results });
    }
    return { text };
  },
};

/* ----- Écrans : compte et installation ----- */
const pwOk = p => p.length >= 8 && /[a-zA-Z]/.test(p) && /\d/.test(p);
function guestBanner() {
  if (IN_CLAUDE || SB.user || !SB.client) return '';
  try { if (sessionStorage.getItem('tambouille-nobanner')) return ''; } catch {}
  return `<div class="banner acct"><div><b>Mode invité.</b> Vos données restent sur cet appareil. Créez un compte gratuit pour les retrouver partout et activer l’IA.</div><div class="row"><button class="btn sm accent" data-act="goAccount" data-v="signup">Créer un compte</button><button class="btn sm ghost" data-act="goAccount" data-v="login">Se connecter</button><button class="icon sm" data-act="hideGuest" aria-label="Masquer">${ic('x')}</button></div></div>`;
}
function accountView() {
  if (IN_CLAUDE) return `<section class="card"><h2>${ic('user')}Compte</h2><p>Dans Claude, Tambouille utilise votre compte Claude : vos données sont privées, synchronisées entre vos appareils et l’IA est incluse.</p><p class="fine">Les versions site web, Android et Windows utilisent un compte Tambouille séparé (email et mot de passe).</p></section>`;
  if (!SB.client) return `<section class="card"><h2>${ic('user')}Compte</h2><p class="muted-t">Connexion indisponible : vérifiez votre connexion Internet, puis rechargez la page. Vous pouvez continuer en invité.</p></section>`;
  if (UI.recovery) return `<section class="card"><h2>${ic('user')}Nouveau mot de passe</h2><form class="form" data-form="newPassword"><label class="fld wide"><span>Nouveau mot de passe (8 caractères min., lettres et chiffres)</span><input type="password" name="p" id="npP" autocomplete="new-password" required></label><label class="fld wide"><span>Confirmation</span><input type="password" name="c" id="npC" autocomplete="new-password" required></label><div class="wide"><button class="btn accent" type="submit">Enregistrer le mot de passe</button></div></form></section>`;
  if (!SB.user) {
    const t = UI.auth;
    return `<section class="card auth"><h2>${ic('user')}${t === 'signup' ? 'Créer un compte' : t === 'forgot' ? 'Mot de passe oublié' : 'Se connecter'}</h2>
    <div class="seg sm">${[['login', 'Connexion'], ['signup', 'Inscription'], ['forgot', 'Mot de passe oublié']].map(([k, l]) => `<button aria-selected="${t === k}" data-act="authTab" data-v="${k}">${l}</button>`).join('')}</div>
    ${UI.authMsg ? `<p class="alertline ${UI.authMsg.ok ? 'okm' : 'bad'}">${ic(UI.authMsg.ok ? 'check' : 'info')}${esc(UI.authMsg.t)}</p>` : ''}
    ${t === 'login' ? `<form class="form" data-form="login"><label class="fld wide"><span>Email</span><input type="email" name="e" id="liE" autocomplete="email" required></label><label class="fld wide"><span>Mot de passe</span><input type="password" name="p" id="liP" autocomplete="current-password" required></label><label class="check wide"><input type="checkbox" name="k" ${keep() ? 'checked' : ''}> Rester connecté sur cet appareil</label><div class="wide row wrap"><button class="btn accent" type="submit" ${UI.authBusy ? 'disabled' : ''}>${UI.authBusy ? '<span class="spin"></span>' : ''}Se connecter</button><button class="btn ghost" type="button" data-act="google">Continuer avec Google</button></div></form>`
    : t === 'signup' ? `<form class="form" data-form="signup"><label class="fld"><span>Prénom</span><input name="f" id="suF" autocomplete="given-name" required maxlength="60"></label><label class="fld"><span>Nom</span><input name="l" id="suL" autocomplete="family-name" required maxlength="60"></label><label class="fld wide"><span>Email</span><input type="email" name="e" id="suE" autocomplete="email" required></label><label class="fld"><span>Mot de passe (8 caractères min., lettres et chiffres)</span><input type="password" name="p" id="suP" autocomplete="new-password" required></label><label class="fld"><span>Confirmation</span><input type="password" name="c" id="suC" autocomplete="new-password" required></label><div class="wide"><button class="btn accent" type="submit" ${UI.authBusy ? 'disabled' : ''}>${UI.authBusy ? '<span class="spin"></span>' : ''}Créer mon compte</button></div><p class="fine wide">Un email de confirmation vous sera envoyé. Vos données d’invité sur cet appareil seront ajoutées à votre compte.</p></form>`
    : `<form class="form" data-form="forgot"><label class="fld wide"><span>Email du compte</span><input type="email" name="e" id="fgE" autocomplete="email" required></label><div class="wide"><button class="btn accent" type="submit" ${UI.authBusy ? 'disabled' : ''}>Recevoir un lien de réinitialisation</button></div></form>`}
    <p class="fine">Sans compte, Tambouille fonctionne en mode invité : vos données restent sur cet appareil et l’IA n’est pas disponible.</p></section>`;
  }
  const u = SB.user, p = SB.profile || {};
  return `<section class="card"><h2>${ic('user')}Mon compte</h2>
    <div class="who">${SB.avatarUrl ? `<img src="${esc(SB.avatarUrl)}" alt="">` : `<span class="avatar">${esc((p.first_name || u.email)[0].toUpperCase())}</span>`}<div><b>${esc([p.first_name, p.last_name].filter(Boolean).join(' ') || u.email)}</b><span>${esc(u.email)}${u.email_confirmed_at ? ' · email confirmé' : ' · email non confirmé'}</span></div></div>
    ${UI.authMsg ? `<p class="alertline ${UI.authMsg.ok ? 'okm' : 'bad'}">${ic(UI.authMsg.ok ? 'check' : 'info')}${esc(UI.authMsg.t)}</p>` : ''}
    <form class="form" data-form="profileSave"><label class="fld"><span>Prénom</span><input name="f" id="pfF" value="${esc(p.first_name || '')}" maxlength="60"></label><label class="fld"><span>Nom</span><input name="l" id="pfL" value="${esc(p.last_name || '')}" maxlength="60"></label><div class="wide row wrap"><button class="btn accent" type="submit">Enregistrer le profil</button><button class="btn ghost" type="button" data-act="avatar">${ic('camera')}Photo de profil</button></div></form></section>
  <section class="card"><h2>${ic('edit')}Email et mot de passe</h2>
    <form class="form" data-form="changeEmail"><label class="fld wide"><span>Nouvel email (un lien de confirmation sera envoyé)</span><input type="email" name="e" id="ceE" autocomplete="email" required></label><div class="wide"><button class="btn ghost" type="submit">Changer d’email</button></div></form>
    <form class="form" data-form="changePassword"><label class="fld"><span>Nouveau mot de passe</span><input type="password" name="p" id="cpP" autocomplete="new-password" required></label><label class="fld"><span>Confirmation</span><input type="password" name="c" id="cpC" autocomplete="new-password" required></label><div class="wide"><button class="btn ghost" type="submit">Changer de mot de passe</button></div></form></section>
  <section class="card"><h2>${ic('gear')}Sessions</h2><div class="row wrap"><button class="btn ghost" data-act="signOut">Se déconnecter</button><button class="btn ghost" data-act="signOutAll">Se déconnecter de tous les appareils</button></div>
    <p class="fine">À la déconnexion, les données sont retirées de cet appareil ; elles restent dans votre compte.</p></section>
  <section class="card"><h2>${ic('trash')}Supprimer mon compte</h2><p class="muted-t">Suppression définitive du compte, de toutes les données synchronisées et des photos. Irréversible.</p>
    <form class="row wrap" data-form="deleteAccount"><label class="fld"><span>Tapez SUPPRIMER pour confirmer</span><input name="c" id="daC" autocomplete="off"></label><button class="btn danger" type="submit">Supprimer définitivement</button></form></section>`;
}
UI.installEvt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); UI.installEvt = e; if (UI.route === 'profil') render(); });
window.addEventListener('appinstalled', () => { UI.installEvt = null; toast('Tambouille est installée.'); render(); });
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function installView() {
  const native = !!window.Capacitor || !!window.tambouilleDesktop;
  return `<section class="card"><h2>${ic('download')}Installer Tambouille</h2>
    ${IN_CLAUDE ? `<p>Vous utilisez Tambouille dans Claude. Les versions installables (site web, Android, Windows) sont listées ci-dessous.</p>` : native ? `<p>Vous utilisez l’application installée (version ${APP_VERSION}).</p>` : standalone() ? `<p>${ic('check')} Tambouille est installée sur cet appareil.</p>` : UI.installEvt ? `<button class="btn accent big" data-act="installPwa">${ic('download')}Installer l’application</button><p class="fine">Elle s’ouvre ensuite comme une appli, depuis l’écran d’accueil ou le menu Démarrer, et fonctionne en partie hors connexion.</p>` : isIOS() ? `<ol class="steps"><li>Ouvrez ce site dans <b>Safari</b>.</li><li>Touchez le bouton <b>Partager</b>.</li><li>Choisissez <b>Sur l’écran d’accueil</b>, puis <b>Ajouter</b>.</li></ol>` : `<p class="muted-t">Pour installer la version web, utilisez le menu de votre navigateur (« Installer l’application » ou « Ajouter à l’écran d’accueil »). Le bouton direct apparaît ici quand le navigateur le propose.</p>`}
  </section>
  <section class="card"><h2>${ic('box')}Téléchargements</h2>
    ${DOWNLOADS.apk || DOWNLOADS.exe ? `<div class="row wrap">${DOWNLOADS.apk ? `<a class="btn ghost" href="${esc(DOWNLOADS.apk)}" target="_blank" rel="noopener">${ic('download')}Android (APK)</a>` : ''}${DOWNLOADS.exe ? `<a class="btn ghost" href="${esc(DOWNLOADS.exe)}" target="_blank" rel="noopener">${ic('download')}Windows (installateur)</a>` : ''}</div><p class="fine">Les fichiers sont hébergés sur le dépôt GitHub privé du projet : connectez-vous à GitHub avec un compte autorisé pour les télécharger.</p>` : `<p class="muted-t">Les versions Android et Windows n’ont pas encore été publiées.</p>`}
    <p class="fine">Version ${APP_VERSION}${UI.newVersion ? ` · <b>nouvelle version ${esc(UI.newVersion)} disponible</b>` : ''}.</p></section>`;
}
async function checkVersion() { if (IN_CLAUDE) return; try { const r = await fetch((IS_WEB ? '' : SITE_URL) + '/version.json', { cache: 'no-store' }); if (!r.ok) return; const v = (await r.json()).version; if (v && v !== APP_VERSION && v.localeCompare(APP_VERSION, undefined, { numeric: true }) > 0) { UI.newVersion = v; if (IS_WEB) toast(`Nouvelle version ${v} disponible.`, { act: 'reloadApp', label: 'Mettre à jour' }); } } catch {} }

const authErr = e => { const m = String(e?.message || e || ''); return /Invalid login/i.test(m) ? 'Email ou mot de passe incorrect.' : /Email not confirmed/i.test(m) ? 'Confirmez d’abord votre adresse email (lien reçu par email).' : /already registered|already exists/i.test(m) ? 'Un compte existe déjà avec cet email : connectez-vous.' : /rate limit|too many/i.test(m) ? 'Trop de tentatives. Réessayez dans quelques minutes.' : /provider is not enabled|Unsupported provider/i.test(m) ? 'La connexion Google n’est pas encore activée sur ce service.' : /weak|at least/i.test(m) ? 'Mot de passe trop faible.' : /network|fetch/i.test(m) ? 'Connexion Internet indisponible.' : 'Une erreur est survenue. Réessayez.'; };
const redirectTo = () => (IS_WEB ? location.origin + location.pathname : SITE_URL + '/') + '#profil';
async function authRun(fn) { UI.authBusy = true; UI.authMsg = null; render(); try { await fn(); } catch (e) { UI.authMsg = { ok: false, t: authErr(e) }; } UI.authBusy = false; render(); }
Object.assign(ACT, {
  goAccount: b => { UI.auth = b.dataset.v; UI.authMsg = null; UI.ptab = 'compte'; go('profil'); },
  hideGuest: () => { try { sessionStorage.setItem('tambouille-nobanner', '1'); } catch {} render(); },
  authTab: b => { UI.auth = b.dataset.v; UI.authMsg = null; render(); },
  google: () => authRun(async () => { const { error } = await SB.client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectTo() } }); if (error) throw error; }),
  signOut: () => authRun(async () => { await SB.client.auth.signOut({ scope: 'local' }); leaveAccount(true); toast('Vous êtes déconnecté.'); }),
  signOutAll: () => authRun(async () => { await SB.client.auth.signOut({ scope: 'global' }); leaveAccount(true); toast('Déconnecté de tous les appareils.'); }),
  avatar: () => { UI.avatarUp = true; $('#fileItemPhoto').click(); },
  installPwa: async () => { const e = UI.installEvt; if (!e) return; e.prompt(); await e.userChoice.catch(() => {}); UI.installEvt = null; render(); },
  reloadApp: () => location.reload(),
  mergeGuest: () => { try { const g = JSON.parse(localStorage.getItem('tambouille-guest') || 'null'); if (!g) return; const items = (g.pantry || []).filter(p => p.qty > 0 && !S.pantry.some(x => x.id === p.id)); S.pantry.push(...items); save('pantry'); localStorage.removeItem('tambouille-guest'); render(); toast(`${pl(items.length, 'aliment')} ajouté${items.length > 1 ? 's' : ''} depuis le mode invité.`); } catch {} },
});
document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form]'); if (!f || !SB.client) return; const k = f.dataset.form, fd = new FormData(f), g = n => String(fd.get(n) || '').trim();
  const forms = {
    login: () => { try { localStorage.setItem('tambouille-keep', fd.get('k') ? '1' : '0'); } catch {} return authRun(async () => { const { error } = await SB.client.auth.signInWithPassword({ email: g('e'), password: String(fd.get('p')) }); if (error) throw error; UI.authMsg = { ok: true, t: 'Connecté.' }; }); },
    signup: () => { const p = String(fd.get('p')); if (!pwOk(p)) { UI.authMsg = { ok: false, t: 'Mot de passe : au moins 8 caractères, avec des lettres et des chiffres.' }; return render(); } if (p !== String(fd.get('c'))) { UI.authMsg = { ok: false, t: 'Les deux mots de passe ne correspondent pas.' }; return render(); }
      return authRun(async () => { const { data, error } = await SB.client.auth.signUp({ email: g('e'), password: p, options: { emailRedirectTo: redirectTo(), data: { first_name: g('f'), last_name: g('l') } } }); if (error) throw error; if (data.user && data.user.identities && !data.user.identities.length) throw new Error('already registered'); UI.authMsg = { ok: true, t: data.session ? 'Compte créé et connecté.' : `Compte créé. Confirmez votre adresse en cliquant sur le lien envoyé à ${g('e')}.` }; UI.auth = 'login'; }); },
    forgot: () => authRun(async () => { const { error } = await SB.client.auth.resetPasswordForEmail(g('e'), { redirectTo: redirectTo() }); if (error) throw error; UI.authMsg = { ok: true, t: 'Si un compte existe pour cet email, un lien de réinitialisation vient d’être envoyé.' }; }),
    newPassword: () => { const p = String(fd.get('p')); if (!pwOk(p) || p !== String(fd.get('c'))) { UI.authMsg = { ok: false, t: 'Mot de passe invalide ou différent de la confirmation.' }; return render(); } return authRun(async () => { const { error } = await SB.client.auth.updateUser({ password: p }); if (error) throw error; UI.recovery = false; UI.authMsg = { ok: true, t: 'Mot de passe modifié.' }; }); },
    profileSave: () => authRun(async () => { const v = { first_name: g('f').slice(0, 60), last_name: g('l').slice(0, 60), updated_at: new Date().toISOString() }; const { error } = await SB.client.from('profiles').upsert({ id: SB.user.id, ...v }); if (error) throw error; SB.profile = { ...SB.profile, ...v }; CL.me = { name: [v.first_name, v.last_name].filter(Boolean).join(' ') }; UI.authMsg = { ok: true, t: 'Profil enregistré.' }; }),
    changeEmail: () => authRun(async () => { const { error } = await SB.client.auth.updateUser({ email: g('e') }, { emailRedirectTo: redirectTo() }); if (error) throw error; UI.authMsg = { ok: true, t: 'Un lien de confirmation a été envoyé à la nouvelle adresse (et à l’ancienne).' }; }),
    changePassword: () => { const p = String(fd.get('p')); if (!pwOk(p) || p !== String(fd.get('c'))) { UI.authMsg = { ok: false, t: 'Mot de passe : 8 caractères min., lettres et chiffres, identique à la confirmation.' }; return render(); } return authRun(async () => { const { error } = await SB.client.auth.updateUser({ password: p }); if (error) throw error; UI.authMsg = { ok: true, t: 'Mot de passe modifié.' }; }); },
    deleteAccount: () => { if (g('c') !== 'SUPPRIMER') { UI.authMsg = { ok: false, t: 'Tapez SUPPRIMER en majuscules pour confirmer.' }; return render(); } return authRun(async () => { const st = SB.client.storage.from('photos'); const { data: files } = await st.list(SB.user.id, { limit: 1000 }); if (files?.length) await st.remove(files.map(f => `${SB.user.id}/${f.name}`)); const { error } = await SB.client.rpc('delete_my_account'); if (error) throw error; await SB.client.auth.signOut({ scope: 'local' }).catch(() => {}); leaveAccount(true); try { localStorage.removeItem(LS); } catch {} toast('Votre compte et toutes vos données ont été supprimés.'); }); },
  };
  if (forms[k]) { e.preventDefault(); e.stopImmediatePropagation(); forms[k](); }
}, true);
/* Photo de profil : réutilise le sélecteur de photo d'aliment */
document.addEventListener('change', async e => {
  if (e.target.id !== 'fileItemPhoto' || !UI.avatarUp) return; e.stopImmediatePropagation(); UI.avatarUp = false;
  const f = e.target.files?.[0]; e.target.value = ''; if (!f || !SB.user) return;
  try { const path = `${SB.user.id}/avatar-${uid()}.jpg`; const { error } = await SB.client.storage.from('photos').upload(path, await compress(f, 400), { contentType: 'image/jpeg' }); if (error) throw error; await SB.client.from('profiles').upsert({ id: SB.user.id, avatar_path: path, updated_at: new Date().toISOString() }); SB.profile.avatar_path = path; SB.avatarUrl = await signedUrl(path); render(); toast('Photo de profil enregistrée.'); } catch { toast('La photo n’a pas pu être envoyée.'); }
}, true);
