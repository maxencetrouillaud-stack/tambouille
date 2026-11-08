/* ===== Aperçus 3D des plats : moteur WebGL maison (aucune dépendance, fonctionne hors ligne) =====
   Chaque plat est généré à partir de la recette : contenant (assiette, bol, poêle, verre…), base et garnitures selon les ingrédients. */
const D3 = { imgs: new Map(), recipes: new Map(), queue: [], busy: false, live: null, ok: null, thumb: null };
const PI = Math.PI, TAU = PI * 2;
const d3norm = x => String(x || '').toLowerCase().replace(/œ/g, 'oe').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
ICONS.expand = '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>';

/* ----- Mathématiques ----- */
const M3 = {
  mul(A, B) { const r = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) { let s = j === 3 ? A[i * 4 + 3] : 0; for (let k = 0; k < 3; k++) s += A[i * 4 + k] * B[k * 4 + j]; r[i * 4 + j] = s; } return r; },
  ap(A, p) { return [A[0] * p[0] + A[1] * p[1] + A[2] * p[2] + A[3], A[4] * p[0] + A[5] * p[1] + A[6] * p[2] + A[7], A[8] * p[0] + A[9] * p[1] + A[10] * p[2] + A[11]]; },
  T: (x, y, z) => [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z],
  S: (x, y = x, z = x) => [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0],
  RX: a => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0]; },
  RY: a => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0]; },
  RZ: a => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0]; },
};
const tf = (...ms) => ms.reduce((a, b) => M3.mul(a, b));
function d3rng(seed) { let a = (seed >>> 0) || 1; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const d3n = (x, y, z) => { const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return s - Math.floor(s); };
const d3smooth = (x, y, z) => 0.5 + 0.25 * Math.sin(x * 9.1 + z * 3.7) * Math.sin(z * 8.3 - y * 5.1) + 0.25 * Math.sin((x + y + z) * 13.7);
function C(h, a = 1) { if (Array.isArray(h)) return h; return [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255, a]; }
function hslC(h, s, l) { s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return [f(0), f(8), f(4), 1]; }
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, (a[3] ?? 1) + ((b[3] ?? 1) - (a[3] ?? 1)) * t];

/* ----- Géométrie : surfaces paramétriques, normales calculées sur la forme finale ----- */
// o : { jit: variation de teinte, gloss: brillance 0..1, trans: transparent }
function surf(G, fn, nu, nv, X, col, o = {}) {
  const P = (u, v) => M3.ap(X, fn(u, v)), e = 1e-3, pts = [], nrm = [], cols = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const u = i / nu, v = j / nv, p = P(u, v), uu = Math.min(Math.max(u, e), 1 - e), vv = Math.min(Math.max(v, e), 1 - e);
    const a = P(uu + e, vv), b = P(uu - e, vv), c = P(uu, vv + e), d = P(uu, vv - e);
    const du = [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dv = [c[0] - d[0], c[1] - d[1], c[2] - d[2]];
    let n = [du[1] * dv[2] - du[2] * dv[1], du[2] * dv[0] - du[0] * dv[2], du[0] * dv[1] - du[1] * dv[0]]; const l = Math.hypot(n[0], n[1], n[2]);
    n = l > 1e-12 ? n.map(x => x / l) : [0, 1, 0];
    let k = typeof col === 'function' ? col(p, u, v, n) : col; const jt = o.jit ?? 0.1;
    if (jt) { const f = 1 + (d3n(p[0], p[1], p[2]) - 0.5) * jt + (d3smooth(p[0], p[1], p[2]) - 0.5) * jt; k = [k[0] * f, k[1] * f, k[2] * f, k[3] ?? 1]; }
    pts.push(p); nrm.push(n); cols.push(k);
  }
  const out = o.trans ? G.t : G.o, g = o.gloss ?? 0.15;
  const put = q => { const p = pts[q], n = nrm[q], c = cols[q]; out.push(p[0], p[1], p[2], n[0], n[1], n[2], c[0], c[1], c[2], c[3] ?? 1, g); };
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const k = j * (nu + 1) + i; put(k); put(k + 1); put(k + nu + 2); put(k); put(k + nu + 2); put(k + nu + 1); }
}
const unitS = (u, v) => { const t = v * PI, f = u * TAU; return [Math.sin(t) * Math.cos(f), Math.cos(t), Math.sin(t) * Math.sin(f)]; };
const sphere = (G, X, col, n = 12, o) => surf(G, unitS, n, Math.max(4, Math.ceil(n * 0.6)), X, col, o);
const sp = (x, e) => Math.sign(x) * Math.pow(Math.abs(x), e);
const cube = (G, X, col, e = 0.3, n = 8, o) => surf(G, (u, v) => { const t = v * PI - PI / 2, f = u * TAU - PI; return [sp(Math.cos(t), e) * sp(Math.cos(f), e), sp(Math.sin(t), e), sp(Math.cos(t), e) * sp(Math.sin(f), e)]; }, n, n, X, col, o);
function lathe(G, X, prof, col, n = 40, o) {
  const L = prof.length - 1, sub = o?.sub || 2;
  surf(G, (u, v) => { const f = v * L, i = Math.min(Math.floor(f), L - 1), t = f - i, r = prof[i][0] + (prof[i + 1][0] - prof[i][0]) * t, y = prof[i][1] + (prof[i + 1][1] - prof[i][1]) * t; return [r * Math.cos(u * TAU), y, r * Math.sin(u * TAU)]; }, n, L * sub, X, col, o);
}
const torus = (G, X, R, r, arc, col, nu = 18, nv = 7, o) => surf(G, (u, v) => { const a = u * arc, b = v * TAU; return [(R + r * Math.cos(b)) * Math.cos(a), r * Math.sin(b), (R + r * Math.cos(b)) * Math.sin(a)]; }, nu, nv, X, col, o);
function tube(G, X, curve, r, col, nu = 36, nv = 5, o) {
  surf(G, (u, v) => {
    const p = curve(u), q = curve(Math.min(1, u + .01)), q0 = curve(Math.max(0, u - .01)); let T = [q[0] - q0[0], q[1] - q0[1], q[2] - q0[2]]; const tl = Math.hypot(...T) || 1; T = T.map(x => x / tl);
    const up = Math.abs(T[1]) > .9 ? [1, 0, 0] : [0, 1, 0]; let N = [T[1] * up[2] - T[2] * up[1], T[2] * up[0] - T[0] * up[2], T[0] * up[1] - T[1] * up[0]]; const nl = Math.hypot(...N) || 1; N = N.map(x => x / nl);
    const B = [T[1] * N[2] - T[2] * N[1], T[2] * N[0] - T[0] * N[2], T[0] * N[1] - T[1] * N[0]], b = v * TAU, rr = typeof r === 'function' ? r(u) : r;
    return [p[0] + rr * (Math.cos(b) * N[0] + Math.sin(b) * B[0]), p[1] + rr * (Math.cos(b) * N[1] + Math.sin(b) * B[1]), p[2] + rr * (Math.cos(b) * N[2] + Math.sin(b) * B[2])];
  }, nu, nv, X, col, o);
}
const disc = (G, X, r, h, col, n = 18, o) => lathe(G, X, [[0, 0], [r, 0], [r, h], [0, h]], col, n, { sub: 1, ...o });
const I = M3.T(0, 0, 0);

/* ----- Contenants ----- */
const CERAM = C('#f6f3ec'), CERAM2 = C('#ece6d8');
function plate(G, y = 0, col = CERAM) { lathe(G, M3.T(0, y, 0), [[0, .02], [.72, .02], [.8, .035], [1.02, .1], [1.07, .108], [1.07, .095], [.84, .035], [.62, -.035], [.5, -.035], [0, -.035]], (p) => { const r = Math.hypot(p[0], p[2]); return r > .99 && r < 1.06 && p[1] > .09 ? mix(col, C('#b9a88a'), .35) : col; }, 56, { jit: .02, gloss: .7 }); return .02 + y; }
function bowl(G, col = CERAM, w = 1, h = 1) {
  const s = (r, y) => [r * w, y * h];
  lathe(G, I, [s(0, .08), s(.45, .1), s(.68, .22), s(.8, .42), s(.82, .5), s(.87, .5), s(.86, .42), s(.74, .18), s(.52, .02), s(.45, 0), s(0, 0)], (p, u, v) => v > .44 && v < .52 ? mix(col, C('#c9b38a'), .3) : col, 56, { jit: .02, gloss: .7 });
}
function shadow(G, R) { lathe(G, M3.T(0, -.04, 0), [[0, 0], [R, 0]], p => { const r = Math.hypot(p[0], p[2]) / R; return [0.12, 0.08, 0.05, Math.pow(Math.max(0, 1 - r), 1.6) * .42]; }, 40, { trans: true, jit: 0, sub: 8 }); }
function pan(G, col = C('#2c2a29'), handle = true) {
  lathe(G, I, [[0, .04], [.82, .04], [.9, .1], [.96, .22], [1, .22], [.95, .06], [.85, 0], [0, 0]], col, 52, { jit: .04, gloss: .55 });
  if (handle) { cube(G, tf(M3.T(1.25, .17, 0), M3.RZ(.12), M3.S(.32, .04, .065)), C('#3a2a20'), .35, 10, { gloss: .3 }); }
  return .05;
}

/* ----- Reconnaissance du type de plat ----- */
function d3kind(r, t, all) {
  if (r.meal === 'boisson' || /smoothie|milkshake|chocolat chaud|cafe|the |infusion|jus |limonade|latte/.test(t)) return 'drink';
  if (/mousse|tiramisu|verrine|panna|creme brulee|creme dessert|yaourt glace/.test(t)) return 'verrine';
  if (/salade/.test(t)) return 'salad';
  if (/pancake|crepe|gaufre|blini/.test(t)) return 'stack';
  if (/gateau|cake|brownie|cheesecake|fondant|moelleux/.test(t)) return 'cake';
  if (/tarte|quiche|pizza|clafoutis|flan|tatin/.test(t)) return 'tart';
  if (/crumble/.test(t)) return 'crumble';
  if (/gratin|parmentier|lasagne|moussaka|hachis/.test(t)) return 'gratin';
  if (/croque|sandwich|burger|quesadilla|wrap|panini|tartine|toast|bagel/.test(t)) return 'sandwich';
  if (/omelette/.test(t)) return 'omelette';
  if (/shakshuka|frittata|tortilla espagnole|oeufs? (au plat|brouill)/.test(t)) return 'pan';
  if (/gnocchi/.test(t)) return 'gnocchi';
  if (/wok|saute(?! de)|poele/.test(t) && !/riz saute/.test(t)) return 'wok';
  if (/houmous|caviar|tapenade|guacamole|tzatziki/.test(t)) return 'dip';
  if (/balls|boulettes? energ|truffe|bouchee/.test(t)) return 'balls';
  if (/soupe|veloute|potage|bouillon|gaspacho|ramen|pho/.test(t)) return 'soup';
  if (/porridge|riz au lait|compote|semoule au lait|granola|muesli|yaourt/.test(t)) return 'porridge';
  if (/dahl|dal |curry|chili|ragout|blanquette|bourguignon|tajine|mijote|colombo|bowl/.test(t)) return /bowl/.test(t) ? 'poke' : 'stew';
  if (/gnocchi/.test(t)) return 'gnocchi';
  if (/pates|spaghetti|tagliatelle|pad thai|nouilles|carbonara|pesto|linguine|penne|fusilli|macaroni/.test(t)) return 'pasta';
  if (/risotto|riz|paella|biryani/.test(t)) return 'rice';
  if (/puree|ecrase/.test(t)) return 'puree';
  if (/ratatouille|poelee|legumes rotis|tian/.test(t)) return 'veggies';
  if (/papillote|saumon|poisson|filet|steak|cotelette|poulet roti|escalope|cabillaud/.test(t)) return 'protein';
  if (r.meal === 'dessert') return /pomme|fruit/.test(all) ? 'porridge' : 'cake';
  if (/pates|spaghetti|nouille/.test(all)) return 'pasta';
  if (/\briz\b/.test(all)) return 'rice';
  return 'stew';
}
function d3base(all, t) {
  const R = [[/chocolat|cacao/, '#5a3322'], [/curry|coco|dahl|lentille corail/, '#e0a040'], [/potiron|courge|butternut|carotte/, '#e8862a'], [/tomate|coulis|chili|shakshuka|haricot rouge/, '#c2412a'], [/pesto|epinard|petits pois|brocoli|basilic/, '#6e9a3e'], [/champignon/, '#b89a72'], [/fraise|framboise|fruits rouges/, '#e2708e'], [/banane/, '#efdca6'], [/pomme/, '#dcb565'], [/pois chiche|houmous/, '#c9a468'], [/lait|vanille|creme|avoine/, '#f1e8d2'], [/lentille/, '#8a6a3a']];
  for (const [re, c] of R) if (re.test(t)) return C(c);
  for (const [re, c] of R) if (re.test(all)) return C(c);
  return C('#c08a4a');
}

/* ----- Garnitures (chaque fonction pose un élément, base à y≈0) ----- */
const K = {
  red: C('#d23a26'), green: C('#4f8a2e'), dgreen: C('#2f6a2a'), yolk: C('#f2a91c'), white: C('#fbf8f0'), cheese: C('#f2d270'), brown: C('#6b3d22'), gold: C('#d9a24a'),
};
const TOP = {
  tomato(G, X, rnd, c) { if (c.flat) { disc(G, tf(X, M3.T(0, .005, 0)), .09, .018, (p, u, v) => { const d = Math.hypot(p[0] - X[3], p[2] - X[11]); return d < .05 && (Math.sin(Math.atan2(p[2] - X[11], p[0] - X[3]) * 3) > .3) ? C('#f06a4a') : K.red; }, 20, { gloss: .5 }); return; } cube(G, tf(X, M3.T(0, .03, 0), M3.RY(rnd() * 3), M3.S(.045, .035, .04)), K.red, .45, 8, { gloss: .6 }); },
  cherry(G, X) { sphere(G, tf(X, M3.T(0, .05, 0), M3.S(.06, .055, .06)), K.red, 12, { gloss: .9 }); },
  mushroom(G, X, rnd) { const Y = tf(X, M3.RX((rnd() - .5) * 1.2)); lathe(G, Y, [[0, .075], [.05, .068], [.075, .04], [.07, .028], [.025, .03]], (p, u, v) => v < .7 ? C('#9a7450') : C('#e6d2b0'), 16, { gloss: .25 }); disc(G, Y, .022, .035, C('#e8dcc2'), 8); },
  egg(G, X, rnd, c) {
    if (c.half) { sphere(G, tf(X, M3.T(0, .02, 0), M3.S(.09, .06, .065)), K.white, 14, { gloss: .5 }); disc(G, tf(X, M3.T(0, .058, 0)), .045, .012, C('#f5b72a'), 14, { gloss: .3 }); return; }
    surf(G, (u, v) => { const r = v * (.2 + .03 * Math.sin(u * TAU * 3) + .02 * Math.sin(u * TAU * 5)); return [r * Math.cos(u * TAU), .022 * Math.cos(v * PI / 2), r * Math.sin(u * TAU)]; }, 24, 4, X, K.white, { gloss: .6 });
    sphere(G, tf(X, M3.T(.02, .02, 0), M3.S(.075, .05, .075)), K.yolk, 14, { gloss: .95, jit: .03 });
  },
  grated(G, X, rnd) { for (let i = 0; i < 3; i++) cube(G, tf(X, M3.T((rnd() - .5) * .08, .012, (rnd() - .5) * .08), M3.RY(rnd() * 6), M3.RZ(rnd() * .5), M3.S(.035, .006, .007)), K.cheese, .4, 4, { gloss: .3 }); },
  shave(G, X, rnd) { surf(G, (u, v) => [(u - .5) * .1, Math.sin(u * 3) * .015 + .02, (v - .5) * .05], 4, 2, tf(X, M3.RZ(rnd() * .6)), C('#efe0b0'), { gloss: .3 }); },
  mozza(G, X) { surf(G, (u, v) => { const r = v * .1 * (1 + .1 * Math.sin(u * 17)); return [r * Math.cos(u * TAU), .015 * (1 - v * v), r * Math.sin(u * TAU)]; }, 20, 4, X, C('#fbf6ea'), { gloss: .5 }); },
  cube_w(G, X, rnd) { cube(G, tf(X, M3.T(0, .03, 0), M3.RY(rnd() * 3), M3.S(.04)), C('#f8f5ee'), .25, 6, { jit: .05 }); },
  lardon(G, X, rnd) { cube(G, tf(X, M3.T(0, .025, 0), M3.RY(rnd() * 3), M3.S(.055, .025, .025)), p => d3n(p[0] * 3, 0, p[2] * 3) > .7 ? C('#f3dfd0') : C('#c46a5a'), .35, 6, { gloss: .5 }); },
  ham(G, X, rnd) { surf(G, (u, v) => [(u - .5) * .18, Math.sin(u * PI * 2) * .03 + .03, (v - .5) * .08], 8, 2, X, C('#e9a2a0'), { gloss: .4 }); },
  chicken(G, X, rnd) { cube(G, tf(X, M3.T(0, .035, 0), M3.RY(rnd() * 3), M3.S(.07, .04, .055)), (p, u, v, n) => Math.abs(n[1]) > .5 ? C('#d8a25a') : C('#f0dcb8'), .6, 8, { gloss: .3 }); },
  beef(G, X, rnd) { cube(G, tf(X, M3.T(0, .02, 0), M3.RY(rnd() * 3), M3.RZ(.2), M3.S(.08, .018, .035)), C('#6a3a24'), .5, 6, { gloss: .5 }); },
  shrimp(G, X, rnd) { torus(G, tf(X, M3.T(0, .03, 0), M3.RX(PI / 2)), .045, .022, PI * 1.4, (p, u) => mix(C('#f08a5a'), C('#fbe0c8'), (Math.sin(u * 30) + 1) / 4), 14, 6, { gloss: .5 }); },
  fish(G, X) { cube(G, tf(X, M3.T(0, .05, 0), M3.S(.42, .06, .2)), p => mix(C('#f0875a'), C('#fbd3b8'), Math.max(0, Math.sin(p[0] * 40 + p[2] * 12)) * .6), .5, 12, { gloss: .55, jit: .04 }); },
  zucchini(G, X, rnd, c) { disc(G, tf(X, M3.T(0, .005, 0), M3.RX(c.flat ? 0 : (rnd() - .5) * .8)), .06, .018, p => { const d = Math.hypot(p[0] - X[3], p[2] - X[11]); return d > .052 ? C('#3d6e2a') : C('#dfe6a8'); }, 16, { gloss: .4 }); },
  cucumber(G, X, rnd) { TOP.zucchini(G, X, rnd, {}); },
  carrot(G, X, rnd) { disc(G, tf(X, M3.RX((rnd() - .5) * .6)), .04, .014, C('#ec7a22'), 12, { gloss: .4 }); },
  broccoli(G, X, rnd) { disc(G, X, .018, .05, C('#8db35a'), 6); for (let i = 0; i < 6; i++) { const a = i * 1.05 + rnd(), d = i ? .03 : 0; sphere(G, tf(X, M3.T(Math.cos(a) * d, .06 + (i ? 0 : .01), Math.sin(a) * d), M3.S(.032)), K.dgreen, 7, { jit: .3 }); } },
  leaf(G, X, rnd, c) { const s = c.big ? 1.6 : 1; surf(G, (u, v) => { const x = (u - .5) * .2 * s, w = Math.sin(u * PI) * .07 * s, z = (v - .5) * 2 * w; return [x, .015 + .4 * x * x / s + .02 * Math.sin(u * 9 + v * 4), z]; }, 8, 4, tf(X, M3.RX((rnd() - .5) * 1.4)), (p, u, v) => mix(C(c.col || '#3f8a2a'), C('#9bc95a'), Math.abs(v - .5) < .06 ? .8 : .15), { gloss: .4, jit: .2 }); },
  herb(G, X, rnd) { surf(G, (u, v) => { const w = Math.sin(u * PI) * .022; return [(u - .5) * .05, .01 + (u - .5) * (u - .5) * .1, (v - .5) * 2 * w]; }, 4, 2, X, C('#3c7d2a'), { gloss: .3 }); },
  onion(G, X, rnd) { torus(G, tf(X, M3.T(0, .012, 0), M3.RX((rnd() - .5) * .5)), .05, .007, TAU * .8, C('#efe2ef'), 14, 4, { gloss: .5 }); },
  pepper(G, X, rnd) { const col = [C('#d8322a'), C('#e8b22a'), C('#4a8a2a')][Math.floor(rnd() * 3)]; surf(G, (u, v) => { const a = (u - .5) * 1.2; return [Math.sin(a) * .07, .02 + (1 - Math.cos(a)) * .07, (v - .5) * .025]; }, 6, 2, X, col, { gloss: .8 }); },
  chickpea(G, X) { sphere(G, tf(X, M3.T(0, .03, 0), M3.S(.035, .032, .035)), C('#d8b878'), 8, { jit: .1 }); },
  lentil(G, X, rnd) { for (let i = 0; i < 4; i++) sphere(G, tf(X, M3.T((rnd() - .5) * .07, .008, (rnd() - .5) * .07), M3.S(.018, .008, .018)), C('#6a5a32'), 6); },
  bean(G, X, rnd) { sphere(G, tf(X, M3.T(0, .022, 0), M3.RY(rnd() * 3), M3.S(.045, .022, .025)), C('#6a1e18'), 8, { gloss: .6 }); },
  greenbean(G, X, rnd) { tube(G, X, t => [(t - .5) * .2, .015, Math.sin(t * 3) * .01], .012, C('#4a8a2e'), 10, 5); },
  corn(G, X, rnd) { cube(G, tf(X, M3.T(0, .015, 0), M3.S(.018, .015, .016)), C('#f4c430'), .5, 4, { gloss: .5 }); },
  pea(G, X) { sphere(G, tf(X, M3.T(0, .02, 0), M3.S(.022)), C('#5aa03a'), 7, { gloss: .5 }); },
  avocado(G, X, rnd) { surf(G, (u, v) => { const a = (u - .5) * 2.2, rr = .16 - v * .035; return [Math.sin(a) * rr, .015 + Math.cos(a) * rr * .15, (v - .5) * .06 + (1 - Math.cos(a)) * .1]; }, 10, 3, X, (p, u, v) => v > .9 ? C('#2f4a1a') : mix(C('#c9d86a'), C('#6e9a2a'), v), { gloss: .5 }); },
  potato(G, X, rnd) { cube(G, tf(X, M3.T(0, .03, 0), M3.RY(rnd() * 3), M3.S(.05, .035, .045)), C('#e6c26a'), .45, 6, { gloss: .3 }); },
  apple(G, X, rnd) { surf(G, (u, v) => { const a = (u - .5) * 1.6; return [Math.sin(a) * .1, .012 + v * .015, Math.cos(a) * .1 * (1 - v * .3) - .08]; }, 8, 2, X, (p, u, v) => v > .8 ? C('#c23a2a') : C('#f2e2a8'), { gloss: .4 }); },
  banana(G, X, rnd) { disc(G, tf(X, M3.RX((rnd() - .5) * .4)), .045, .014, C('#f3e7b8'), 12, { gloss: .3 }); },
  strawberry(G, X, rnd) { const Y = tf(X, M3.RZ((rnd() - .5) * 1.2)); lathe(G, Y, [[0, 0], [.03, .02], [.042, .055], [.03, .08], [0, .085]], p => d3n(p[0] * 9, p[1] * 9, p[2] * 9) > .9 ? C('#f7e08a') : C('#d8283a'), 12, { gloss: .8 }); disc(G, tf(Y, M3.T(0, .08, 0)), .03, .006, C('#3a7a2a'), 6); },
  berry(G, X, rnd) { sphere(G, tf(X, M3.T(0, .025, 0), M3.S(.028)), rnd() > .5 ? C('#3a3a7a') : C('#c22a4a'), 8, { gloss: .7 }); },
  choco(G, X, rnd) { torus(G, tf(X, M3.T(0, .015, 0), M3.RZ(PI / 2), M3.RY(rnd() * 3)), .02, .008, PI * 1.6, C('#4a2a1a'), 10, 4, { gloss: .5 }); },
  olive(G, X) { sphere(G, tf(X, M3.T(0, .028, 0), M3.S(.038, .028, .028)), C('#2a1e26'), 10, { gloss: .9 }); },
  lemon(G, X) { disc(G, tf(X, M3.T(0, .03, 0), M3.RX(.5)), .08, .014, p => { const d = Math.hypot(p[0] - X[3], p[2] - X[11]); return d > .07 ? C('#f2d020') : (Math.sin(Math.atan2(p[2] - X[11], p[0] - X[3]) * 8) > .7 ? C('#fff6c0') : C('#f7e060')); }, 18, { gloss: .6 }); },
  nut(G, X, rnd) { sphere(G, tf(X, M3.T(0, .02, 0), M3.RY(rnd() * 3), M3.S(.035, .02, .022)), C('#a8743a'), 8, { jit: .2 }); },
  eggplant(G, X, rnd) { cube(G, tf(X, M3.T(0, .03, 0), M3.RY(rnd() * 3), M3.S(.05, .035, .045)), (p, u, v, n) => Math.abs(n[1]) > .6 ? C('#3a1e3a') : C('#d8c89a'), .5, 6, { gloss: .5 }); },
  squash(G, X, rnd) { cube(G, tf(X, M3.T(0, .03, 0), M3.RY(rnd() * 3), M3.S(.045)), C('#e8862a'), .45, 6, { gloss: .4 }); },
  coco(G, X, rnd) { surf(G, (u, v) => [(u - .5) * .04, .01, (v - .5) * .015], 2, 1, tf(X, M3.RY(rnd() * 3)), C('#fbf8f2'), { jit: 0 }); },
  seed(G, X, rnd) { for (let i = 0; i < 3; i++) sphere(G, tf(X, M3.T((rnd() - .5) * .06, .006, (rnd() - .5) * .06), M3.S(.01, .005, .006)), C('#f6ecd0'), 5, { jit: 0 }); },
  chili(G, X, rnd) { torus(G, tf(X, M3.T(0, .008, 0)), .012, .004, TAU, C('#d22a1a'), 8, 4, { gloss: .6 }); },
  crouton(G, X, rnd) { cube(G, tf(X, M3.T(0, .03, 0), M3.RY(rnd() * 3), M3.S(.04)), (p, u, v, n) => Math.abs(n[1]) > .5 ? C('#d8a04a') : C('#f2dca8'), .3, 6, { jit: .25 }); },
  drizzle(G, X, rnd, c) { const a0 = rnd() * TAU, R = c.R || .4; tube(G, M3.T(0, (c.y || 0) + .012, 0), t => [Math.cos(a0 + t * 9) * R * (1 - t * .8), Math.sin(t * 40) * .003, Math.sin(a0 + t * 9) * R * (1 - t * .8)], .012, C(c.col || '#c8781a'), 90, 5, { gloss: 1, jit: .05 }); },
};
const D3ING = [[/tomate cerise/, 'cherry', 5], [/tomate|coulis/, 'tomato', 8], [/champignon/, 'mushroom', 7], [/oeuf/, 'egg', 1], [/parmesan|pecorino/, 'shave', 8], [/mozzarella|burrata/, 'mozza', 4], [/feta|tofu|chevre/, 'cube_w', 9], [/fromage|emmental|gruyere|comte|cheddar/, 'grated', 14], [/lardon|bacon|pancetta|guanciale/, 'lardon', 10], [/jambon/, 'ham', 4], [/poulet|dinde/, 'chicken', 8], [/boeuf|steak|hache|viande|porc|agneau/, 'beef', 9], [/crevette|gambas/, 'shrimp', 7], [/saumon|thon|cabillaud|poisson/, 'fish', 1], [/courgette/, 'zucchini', 9], [/concombre/, 'cucumber', 7], [/carotte/, 'carrot', 9], [/brocoli/, 'broccoli', 6], [/epinard|roquette|salade|laitue|mache|chou/, 'leaf', 8], [/basilic|persil|coriandre|menthe|aneth|herbe|ciboulette|thym/, 'herb', 12], [/oignon|echalote/, 'onion', 5], [/poivron/, 'pepper', 8], [/pois chiche/, 'chickpea', 12], [/lentille/, 'lentil', 10], [/haricots? rouges?/, 'bean', 12], [/haricots? verts?/, 'greenbean', 7], [/\bmais\b/, 'corn', 14], [/petits? pois/, 'pea', 14], [/avocat/, 'avocado', 4], [/pomme de terre|patate/, 'potato', 8], [/pomme/, 'apple', 7], [/banane/, 'banana', 8], [/fraise/, 'strawberry', 5], [/framboise|myrtille|fruits rouges|cerise/, 'berry', 8], [/chocolat|cacao/, 'choco', 6], [/olive/, 'olive', 7], [/citron/, 'lemon', 1], [/noix|amande|noisette|cacahuete|cajou/, 'nut', 7], [/miel|sirop|erable/, 'drizzle', 1], [/aubergine/, 'eggplant', 8], [/potiron|courge|butternut/, 'squash', 8], [/coco/, 'coco', 14], [/sesame|graine/, 'seed', 8], [/piment/, 'chili', 6], [/pain|crouton/, 'crouton', 7]];
const D3SKIP = /^(sel|poivre|huile|eau|farine|sucre|levure|vinaigre|moutarde|bouillon|ail|vanille|cannelle|cumin|paprika|curcuma|gingembre|epice|muscade|bicarbonate|maizena|sauce soja|sauce|lait|beurre|creme|herbes de provence|laurier|garam|curry|pate)/;

function place(c, S, n, fn) {
  for (let i = 0; i < n; i++) {
    const a = c.rnd() * TAU, d = Math.sqrt(c.rnd()) * S.R * .92, x = Math.cos(a) * d * (S.sx || 1), z = Math.sin(a) * d;
    fn(tf(M3.T(x, S.top(x, z), z), M3.RY(c.rnd() * TAU)), i);
  }
}
function toppings(c, S) {
  const seen = new Set();
  for (const ing of c.r.ingr) {
    const n = d3norm(ing.n); if (D3SKIP.test(n) || c.used.some(re => re.test(n))) continue;
    const m = D3ING.find(([re]) => re.test(n)); if (!m || seen.has(m[1])) continue; seen.add(m[1]);
    const [, kind, cnt] = m, f = TOP[kind], o = { flat: c.flat, half: c.kind === 'salad' || c.kind === 'poke', R: S.R * .8, y: S.top(0, 0), big: c.kind === 'salad' };
    if (kind === 'drizzle') { f(c.G, I, c.rnd, o); continue; }
    if (kind === 'fish') { f(c.G, tf(M3.T(0, S.top(0, 0), 0), M3.RY(c.rnd())), c.rnd, o); continue; }
    if (kind === 'egg' && c.kind === 'pan') { place(c, { ...S, R: S.R * .7 }, 3, X => f(c.G, X, c.rnd, o)); continue; }
    if (kind === 'egg' && c.kind !== 'salad' && c.kind !== 'poke') { f(c.G, tf(M3.T(.05, S.top(.05, 0), 0), M3.RY(c.rnd())), c.rnd, o); continue; }
    if (kind === 'lemon') { f(c.G, tf(M3.T(S.R * .75, S.top(S.R * .75, 0), 0)), c.rnd, o); continue; }
    if (c.flat && (kind === 'tomato' || kind === 'zucchini')) { const ring = Math.max(2, Math.round(S.R / .17)); for (let k = 0; k < ring; k++) { const rr = S.R * (k + .6) / ring * .95, cnt2 = Math.max(1, Math.round(TAU * rr / .16)); for (let j = 0; j < cnt2; j++) { const a = j / cnt2 * TAU + k * .3, x = Math.cos(a) * rr, z = Math.sin(a) * rr; f(c.G, M3.T(x, S.top(x, z), z), c.rnd, o); } } continue; }
    place(c, S, Math.round(cnt * (c.dense || 1)), X => f(c.G, X, c.rnd, o));
  }
  if (!seen.has('herb') && !seen.has('leaf') && c.garnish !== false && /plat|entree/.test(c.r.meal || 'plat')) place(c, S, 5, X => TOP.herb(c.G, X, c.rnd));
}

/* ----- Plats ----- */
const mound = (h, R, y0) => (x, z) => y0 + h * Math.max(0, 1 - (x * x + z * z) / (R * R));
const KIND = {
  pasta(c) {
    const y0 = plate(c.G), h = .26, R = .68, top = mound(h, R, y0), all = c.all;
    const col = /pesto|basilic/.test(all) ? C('#a8bf58') : /pad thai|nouille/.test(c.t) ? C('#e3b878') : /tomate|bolognaise/.test(all) ? C('#e08a4a') : C('#f2d27c');
    for (let k = 0; k < 46; k++) { const a0 = c.rnd() * TAU, turns = 1.2 + c.rnd() * 1.8, r0 = .05 + c.rnd() * .2, r1 = r0 + .25 + c.rnd() * .35, ph = c.rnd() * 6;
      tube(c.G, I, t => { const a = a0 + t * turns * TAU, rr = Math.min(R * .98, r0 + (r1 - r0) * t), x = Math.cos(a) * rr, z = Math.sin(a) * rr; return [x, top(x, z) * (.85 + .15 * Math.sin(t * 7 + ph)) + .015, z]; }, .019, col, 54, 5, { gloss: .55, jit: .06 }); }
    if (/tomate|bolognaise/.test(all)) lathe(c.G, M3.T(0, y0, 0), [[0, h + .03], [.25, h * .8], [.4, .05], [0, .05]], C('#b83220'), 24, { gloss: .7 });
    c.used.push(/pate|spaghetti|nouille|tagliatelle|basilic|pesto/);
    return { top: (x, z) => top(x, z) + .02, R: R * .85 };
  },
  rice(c) {
    const y0 = plate(c.G), h = .22, R = .66, top = mound(h, R, y0), risotto = /risotto/.test(c.t);
    const col = risotto ? C('#efe0b8') : /saute|cantonais|curry/.test(c.t) ? C('#f0d48a') : C('#f6f2e8');
    lathe(c.G, M3.T(0, y0, 0), [[0, h], [R * .5, h * .75], [R * .85, h * .28], [R, 0]], col, 40, { jit: .12, gloss: risotto ? .6 : .2, sub: 4 });
    if (!risotto) place(c, { top: (x, z) => top(x, z) - .005, R }, 160, X => sphere(c.G, tf(X, M3.RZ(c.rnd() * .6), M3.S(.035, .012, .014)), C('#fbf8ee'), 6, { jit: .05, gloss: .4 }));
    c.used.push(/\briz\b/);
    return { top: (x, z) => top(x, z) + .01, R: R * .8 };
  },
  puree(c) {
    const y0 = plate(c.G), R = .62;
    lathe(c.G, M3.T(0, y0, 0), [[0, .2], [.12, .21], [.3, .17], [.5, .1], [R, 0]], C('#f2df9a'), 48, { sub: 4, gloss: .4, jit: .06 });
    cube(c.G, tf(M3.T(.03, y0 + .215, 0), M3.S(.08, .025, .07)), C('#f9e690'), .3, 8, { gloss: .9 });
    c.used.push(/pomme de terre|patate/);
    return { top: mound(.18, R, y0 + .02), R: R * .7 };
  },
  soup(c) {
    bowl(c.G); const col = d3base(c.all, c.t), y = .4;
    lathe(c.G, I, [[0, y], [.76, y], [.79, y - .03]], col, 40, { gloss: .75, jit: .05, sub: 3 });
    lathe(c.G, M3.T(-.08, y + .004, .06), [[0, 0], [.09, .002]], C('#f4e6c8'), 20, { gloss: .9, jit: 0 });
    c.used.push(/potiron|courge|carotte|pomme de terre|poireau|lentille corail|legume|tomate|butternut/); c.dense = .5;
    return { top: () => y + .003, R: .62 };
  },
  stew(c) {
    bowl(c.G, CERAM, 1.05, .95); const col = d3base(c.all, c.t), y = .37;
    lathe(c.G, I, [[0, y], [.78, y], [.8, y - .03]], col, 40, { gloss: .7, jit: .1, sub: 3 });
    place(c, { top: () => y - .02, R: .65 }, 18, X => cube(c.G, tf(X, M3.S(.05, .04, .045)), mix(col, C('#ffffff'), .12), .6, 6, { gloss: .5 }));
    c.used.push(/lentille corail|coulis|tomate concassee|lait de coco/);
    return { top: () => y - .01, R: .66 };
  },
  porridge(c) {
    bowl(c.G); const col = d3base(c.all, c.t), y = .4;
    lathe(c.G, I, [[0, y + .03], [.4, y + .015], [.79, y]], col, 40, { gloss: .5, jit: .18, sub: 3 });
    if (/riz|avoine|flocon|semoule/.test(c.all)) place(c, { top: () => y + .02, R: .7 }, 140, X => sphere(c.G, tf(X, M3.RZ(c.rnd()), M3.S(.03, .012, .014)), mix(col, C('#ffffff'), .5), 5, { jit: .05, gloss: .5 }));
    c.used.push(/flocon|avoine|riz|pomme(?! de)|lait/); c.garnish = false;
    return { top: () => y + .02, R: .55 };
  },
  poke(c) {
    bowl(c.G, C('#2c2a2a'), 1.05, .9); const y = .36;
    lathe(c.G, I, [[0, y + .04], [.5, y + .03], [.78, y]], C('#f4efe2'), 40, { jit: .15, sub: 3 }); c.dense = 1.6;
    return { top: () => y + .04, R: .6 };
  },
  salad(c) {
    bowl(c.G, C('#f3efe6'), 1.15, .85); const y = .32, top = mound(.14, .85, y);
    place(c, { top, R: .85 }, 34, X => TOP.leaf(c.G, X, c.rnd, { big: true, col: c.rnd() > .5 ? '#5aa03a' : '#3c7d2a' }));
    c.used.push(/salade|laitue|roquette|mache/);
    return { top: (x, z) => top(x, z) + .04, R: .7 };
  },
  tart(c) {
    const y0 = plate(c.G, 0, C('#f4f1ea')), pizza = /pizza/.test(c.t), R = .9, fy = y0 + (pizza ? .04 : .11);
    lathe(c.G, M3.T(0, y0, 0), pizza ? [[0, .03], [R * .9, .03], [R, .06], [R + .02, .02], [0, 0]] : [[0, .02], [R, .02], [R + .04, .06], [R + .06, .15], [R + .01, .16], [R - .02, .12], [0, .11]], (p, u, v) => { const ra = Math.hypot(p[0], p[2]); return ra > R * .93 ? mix(C('#d9a24a'), C('#a0662a'), d3n(p[0] * 5, 0, p[2] * 5) * .5 + (Math.abs(Math.sin(u * TAU * 22)) > .9 ? .3 : 0)) : C('#e9c27a'); }, 64, { jit: .1, gloss: .3 });
    const fill = /quiche|flan|clafoutis/.test(c.t) ? C('#f0cf6a') : /tomate|pizza/.test(c.all) ? C('#c8402a') : d3base(c.all, c.t);
    lathe(c.G, M3.T(0, fy, 0), [[0, .005], [R * .92, 0]], (p) => mix(fill, C('#a8662a'), Math.pow(d3smooth(p[0] * 2, 0, p[2] * 2), 3) * (/quiche/.test(c.t) ? .9 : .2)), 48, { jit: .12, gloss: .45, sub: 6 });
    c.flat = true; c.used.push(/pate|farine|beurre|lait|creme/);
    if (/quiche|flan/.test(c.t)) c.used.push(/oeuf/);
    return { top: () => fy + .006, R: R * .85 };
  },
  crumble(c) {
    const R = .85; lathe(c.G, I, [[0, .02], [R, .02], [R + .02, .28], [R + .1, .28], [R + .08, 0], [0, 0]], C('#f2efe8'), 56, { gloss: .7, jit: .02 });
    lathe(c.G, I, [[0, .25], [R, .25]], d3base(c.all, c.t), 40, { sub: 2 });
    place(c, { top: () => .26, R }, 120, X => cube(c.G, tf(X, M3.S(.04 + c.rnd() * .03, .03, .035)), mix(C('#e8b45a'), C('#b8742a'), c.rnd()), .55, 5, { jit: .2 }));
    c.used.push(/pomme|beurre|farine|sucre|poire/); c.garnish = false;
    return { top: () => .3, R: .5 };
  },
  cake(c) {
    const y0 = plate(c.G), R = .62, h = .42, choco = /chocolat|cacao|brownie/.test(c.all);
    const crumb = choco ? C('#5a3322') : C('#f2cf7a'), crust = choco ? C('#3e2216') : C('#c98a3a');
    surf(c.G, (u, v) => { const a = u * TAU * .86 + .2, t = v * 3; let r, y; if (t < 1) { r = R * t; y = h + .04 * (1 - t * t); } else if (t < 2) { r = R; y = h * (2 - t); } else { r = R * (3 - t); y = 0; } return [r * Math.cos(a), y0 + y, r * Math.sin(a)]; }, 52, 18, I, (p) => Math.hypot(p[0], p[2]) > R * .97 || p[1] > y0 + h - .01 ? crust : crust, { gloss: .3, jit: .12 });
    for (const a of [.2, TAU * .86 + .2]) surf(c.G, (u, v) => [Math.cos(a) * R * u, y0 + h * v + (v > .99 ? .04 * (1 - u * u) : 0), Math.sin(a) * R * u], 8, 6, I, (p, u, v) => v > .94 || u > .97 ? crust : crumb, { jit: .25, gloss: .1 });
    if (!choco) place(c, { top: () => y0 + h + .03, R: R * .8 }, 40, X => sphere(c.G, tf(X, M3.S(.012, .004, .012)), C('#ffffff'), 4, { jit: 0 }));
    c.used.push(/farine|sucre|oeuf|beurre|yaourt|levure|lait|huile|chocolat|cacao/); c.garnish = false;
    return { top: () => y0 + h + .04, R: R * .55 };
  },
  stack(c) {
    const y0 = plate(c.G), crepe = /crepe/.test(c.t), n = crepe ? 6 : 4, R = crepe ? .7 : .5, th = crepe ? .018 : .07;
    for (let i = 0; i < n; i++) { const y = y0 + i * th * .92, ph = c.rnd() * 6; surf(c.G, (u, v) => { const r = R * (1 + .03 * Math.sin(u * TAU * 4 + ph)) * (v < .5 ? 1 : 1 - (v - .5) * .08), a = u * TAU; return [r * Math.cos(a) * (v < .5 ? 1 : 1), y + (v < .5 ? 0 : th) + (crepe ? .01 * Math.sin(u * TAU * 3 + ph) : 0), r * Math.sin(a)]; }, 36, 2, I, (p, u, v) => mix(C('#f0c878'), C('#b8742a'), crepe ? d3n(p[0] * 6, p[1], p[2] * 6) * .5 : (v > .4 && v < .6 ? .7 : .25)), { gloss: .25, jit: .12 });
      lathe(c.G, M3.T(0, y + th, 0), [[0, .002], [R * .99, 0]], (p) => mix(C('#e8b45a'), C('#b8742a'), d3smooth(p[0] * 3, 0, p[2] * 3) * .6), 36, { sub: 3, jit: .1 }); }
    const ty = y0 + n * th * .92 + .01;
    if (!crepe) { cube(c.G, tf(M3.T(0, ty + .015, 0), M3.S(.08, .025, .07)), C('#f9e690'), .3, 8, { gloss: .9 }); TOP.drizzle(c.G, I, c.rnd, { R: R * .7, y: ty, col: '#b8641a' }); }
    else place(c, { top: () => ty, R: R * .8 }, 60, X => sphere(c.G, tf(X, M3.S(.01, .003, .01)), C('#ffffff'), 4, { jit: 0 }));
    c.used.push(/farine|oeuf|lait|beurre|sucre|levure|miel|sirop/); c.garnish = false;
    return { top: () => ty + .01, R: R * .6 };
  },
  sandwich(c) {
    plate(c.G); const qd = /quesadilla|wrap/.test(c.t);
    if (qd) { for (let i = 0; i < 3; i++) { const a = i * TAU / 3 + .3, X = tf(M3.T(Math.cos(a) * .06, .02, Math.sin(a) * .06), M3.RY(-a)), w = (p) => Math.abs(Math.sin(p[0] * 26 + p[2] * 26)) > .92 ? C('#9a6a32') : mix(C('#ecc884'), C('#c89a52'), d3n(p[0] * 9, 0, p[2] * 9) * .5);
      surf(c.G, (u, v) => { const t = (u - .5) * 1.0, rr = .55 * v; return [Math.cos(t) * rr, .07 * Math.pow(Math.sin(Math.min(1, v * 1.05) * PI), .6) * Math.pow(Math.cos(t * 1.5), .5), Math.sin(t) * rr]; }, 14, 8, X, w, { gloss: .2 });
      surf(c.G, (u, v) => { const t = (u - .5) * 1.0, rr = .55 * v; return [Math.cos(t) * rr, 0, Math.sin(t) * rr]; }, 6, 2, X, C('#e6c07a'));
      cube(c.G, tf(X, M3.T(.5, .03, 0), M3.S(.025, .018, .22)), K.cheese, .3, 6, { gloss: .6 }); } }
    else for (let i = 0; i < 2; i++) { const X = tf(M3.T(i ? .22 : -.22, 0, i ? -.08 : .08), M3.RY(i ? .5 : -.3));
      cube(c.G, tf(X, M3.T(0, .07, 0), M3.S(.36, .045, .34)), (p, u, v, n) => C('#f3dcae'), .25, 12);
      cube(c.G, tf(X, M3.T(0, .125, 0), M3.S(.35, .012, .33)), C('#e8a2a0'), .2, 8, { gloss: .4 });
      cube(c.G, tf(X, M3.T(0, .185, 0), M3.S(.36, .045, .34)), (p, u, v, n) => Math.abs(n[1]) > .5 && p[1] > .2 ? mix(C('#e2a43a'), C('#9a5a22'), Math.min(1, d3smooth(p[0] * 4, 0, p[2] * 4) * 1.2)) : C('#f3dcae'), .25, 12, { gloss: .35 }); }
    c.used.push(/pain|tortilla|jambon|fromage|emmental|gruyere|beurre|bechamel|poulet|wrap/); c.garnish = false;
    return { top: (x, z) => .03, R: .2 };
  },
  omelette(c) {
    const y0 = plate(c.G), R = .6, h = .13, X = M3.RY(.4), col = p => mix(C('#f4d062'), C('#c8862a'), Math.min(1, Math.pow(d3smooth(p[0] * 4, 0, p[2] * 4), 4) * 1.6));
    surf(c.G, (u, v) => { const a = u * PI, rr = R * v * (1 + .03 * Math.sin(u * 25)); return [Math.cos(a) * rr, y0 + .01 + h * Math.sqrt(Math.max(0, 1 - v * v)) * Math.pow(Math.sin(a), .35), Math.sin(a) * rr * .62 - .08]; }, 32, 10, X, col, { gloss: .45, jit: .08 });
    surf(c.G, (u, v) => [(u - .5) * 2 * R * v ** 0 * (1 - 0), y0 + .01 + h * Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2)) * v * .9, -.08 + (v - 1) * .02], 20, 2, X, col, { gloss: .45, jit: .08 });
    c.used.push(/oeuf|beurre|lait/);
    return { top: (x, z) => y0, R: .85, ring: true };
  },
  pan(c) {
    const y0 = pan(c.G), fr = /frittata|tortilla/.test(c.t), col = fr ? C('#f0c858') : C('#b8341e');
    lathe(c.G, M3.T(0, y0, 0), [[0, fr ? .11 : .07], [.82, fr ? .1 : .07], [.86, .03]], (p) => mix(col, fr ? C('#b8742a') : C('#e86a3a'), d3smooth(p[0] * 4, 0, p[2] * 4) * .6), 48, { gloss: fr ? .35 : .7, jit: .15, sub: 3 });
    if (fr) c.used.push(/oeuf/); c.used.push(/tomate|coulis|poivron rouge|lait|creme/);
    return { top: () => y0 + (fr ? .11 : .075), R: .7 };
  },
  wok(c) {
    lathe(c.G, I, [[0, .02], [.5, .05], [.85, .25], [.95, .38], [1, .38], [.9, .22], [.5, 0], [0, -.02]], C('#262422'), 52, { gloss: .55, jit: .04 });
    for (const s of [-1, 1]) torus(c.G, tf(M3.T(s * 1.03, .34, 0), M3.RZ(PI / 2)), .07, .015, PI, C('#262422'), 10, 5, { gloss: .5 });
    lathe(c.G, I, [[0, .06], [.55, .09], [.7, .16]], C('#8a4a22'), 36, { gloss: .8, sub: 3 });
    if (/nouille|riz/.test(c.all)) for (let k = 0; k < 20; k++) { const a0 = c.rnd() * TAU, r0 = .1 + c.rnd() * .4; tube(c.G, I, t => { const a = a0 + t * 3, rr = r0 + t * .15; return [Math.cos(a) * rr, .08 + .3 * rr * rr + .01 * Math.sin(t * 9), Math.sin(a) * rr]; }, .016, C('#e3b878'), 30, 5, { gloss: .5 }); }
    c.dense = 2;
    return { top: (x, z) => .06 + .3 * Math.max(0, (x * x + z * z) / .5) * .5, R: .7 };
  },
  dip(c) {
    lathe(c.G, I, [[0, .06], [.6, .08], [.78, .2], [.82, .22], [.8, .14], [.6, 0], [0, 0]], C('#f2efe6'), 52, { gloss: .7, jit: .02 });
    surf(c.G, (u, v) => { const a = u * TAU, r = .74 * v; return [Math.cos(a) * r, .14 + .05 * Math.sin(a * 2 + r * 18) * v * (1 - v) * 3 - .03 * (1 - v), Math.sin(a) * r]; }, 48, 10, I, d3base(c.all, c.t), { gloss: .4, jit: .08 });
    lathe(c.G, M3.T(0, .118, 0), [[0, .006], [.2, 0]], C('#d8b030'), 24, { gloss: 1, jit: 0 });
    place(c, { top: () => .14, R: .5 }, 20, X => sphere(c.G, tf(X, M3.S(.012, .003, .012)), C('#c03a1a'), 4));
    c.used.push(/pois chiche|tahini|citron|ail|huile/); c.garnish = false;
    return { top: () => .13, R: .15 };
  },
  balls(c) {
    const y0 = plate(c.G), pts = [[0, 0, 0], [.27, 0, 0], [-.27, 0, 0], [.135, 0, .24], [-.135, 0, .24], [.135, 0, -.24], [-.135, 0, -.24], [.07, .2, .08], [-.08, .2, -.06]], choco = /cacao|chocolat/.test(c.all);
    for (const [x, y, z] of pts) sphere(c.G, tf(M3.T(x, y0 + .13 + y, z), M3.S(.13)), (p) => d3n(p[0] * 40, p[1] * 40, p[2] * 40) > .82 ? C('#f6efe0') : choco ? C('#4a2a1a') : C('#b8864a'), 16, { jit: .25, gloss: .15 });
    c.garnish = false; c.used.push(/./);
    return { top: () => y0, R: .1 };
  },
  verrine(c) {
    const col = d3base(c.all, c.t);
    lathe(c.G, I, [[0, .02], [.32, .02], [.36, .48], [0, .48]], (p) => p[1] > .44 ? mix(col, C('#2a1810'), .2) : col, 32, { gloss: .5, jit: .12 });
    lathe(c.G, I, [[0, 0], [.4, 0], [.44, .62], [.42, .62], [.38, .02]], [1, 1, 1, .22], 40, { trans: true, gloss: 1, jit: 0 });
    place(c, { top: () => .49, R: .2 }, 10, X => TOP.choco(c.G, X, c.rnd));
    c.used.push(/./); c.garnish = false;
    return { top: () => .49, R: .2 };
  },
  drink(c) {
    const hot = /chaud|cafe|the |infusion|latte/.test(c.t), col = d3base(c.all, c.t);
    if (hot) { lathe(c.G, I, [[0, .05], [.36, .06], [.38, .7], [.42, .7], [.42, .04], [.38, 0], [0, 0]], C('#e8e2d6'), 40, { gloss: .8, jit: .02 }); torus(c.G, tf(M3.T(.45, .37, 0), M3.RX(PI / 2)), .16, .035, TAU, C('#e8e2d6'), 20, 8, { gloss: .8, jit: .02 }); lathe(c.G, I, [[0, .63], [.37, .63]], col, 30, { gloss: .8, sub: 2, jit: .05 }); lathe(c.G, M3.T(0, .632, 0), [[0, .04], [.16, .02], [.3, 0]], C('#f6efe2'), 24, { gloss: .6, jit: .05 }); }
    else { lathe(c.G, I, [[0, .08], [.33, .08], [.37, .95], [0, .95]], col, 36, { gloss: .5, jit: .06 }); lathe(c.G, I, [[0, 0], [.36, 0], [.42, 1.15], [.4, 1.15], [.34, .06], [0, .06]], [1, 1, 1, .2], 40, { trans: true, gloss: 1, jit: 0 }); tube(c.G, I, t => [.12 + t * .18, .5 + t * .9, .05], .025, C('#e05a6a'), 6, 8, { gloss: .5 }); if (/fraise/.test(c.all)) TOP.strawberry(c.G, tf(M3.T(-.4, 1.08, 0), M3.RZ(.9), M3.S(1.6)), c.rnd, {}); }
    c.used.push(/./); c.garnish = false;
    return { top: () => 0, R: 0 };
  },
  gnocchi(c) {
    const y0 = plate(c.G), col = d3base(c.all, c.t);
    lathe(c.G, M3.T(0, y0, 0), [[0, .015], [.6, .01], [.66, 0]], col, 40, { gloss: .7, jit: .06, sub: 2 });
    place(c, { top: () => y0 + .03, R: .55 }, 22, X => cube(c.G, tf(X, M3.S(.08, .045, .055)), (p, u) => mix(C('#f3dca0'), C('#c8862a'), Math.max(0, Math.sin(u * 40)) * .25 + (p[1] > y0 + .06 ? .3 : 0)), .7, 10, { gloss: .35 }));
    c.used.push(/gnocchi|epinard|creme/);
    return { top: () => y0 + .06, R: .5 };
  },
  veggies(c) { const y0 = plate(c.G); lathe(c.G, M3.T(0, y0, 0), [[0, .03], [.6, .02], [.65, 0]], C('#b8441e'), 40, { gloss: .7, sub: 2 }); c.dense = 1.6; return { top: () => y0 + .02, R: .55 }; },
  protein(c) { const y0 = plate(c.G); if (/papillote/.test(c.t)) lathe(c.G, M3.T(0, y0 + .005, 0), [[0, .01], [.7, .02], [.78, .08]], C('#f2ead8'), 40, { gloss: .3, jit: .05, sub: 2 }); c.dense = .6; return { top: () => y0 + .02, R: .6 }; },
};

function d3build(r) {
  const G = { o: [], t: [] }, t = d3norm(r.title), all = d3norm(r.title + ' ' + r.ingr.map(i => i.n).join(' ')), kind = d3kind(r, t, all);
  const c = { G, rnd: d3rng(hash(r.id + r.title)), r, t, all, kind, used: [] };
  shadow(G, kind === 'drink' || kind === 'verrine' ? .7 : kind === 'pan' ? 1.4 : 1.25);
  const S = KIND[kind](c); toppings(c, S);
  let ymin = 1e9, ymax = -1e9, rad = 0; for (let i = 0; i < G.o.length; i += 11) { ymin = Math.min(ymin, G.o[i + 1]); ymax = Math.max(ymax, G.o[i + 1]); rad = Math.max(rad, Math.hypot(G.o[i], G.o[i + 2])); }
  return { o: new Float32Array(G.o), t: new Float32Array(G.t), cy: (ymin + ymax) / 2, rad: Math.max(rad, (ymax - ymin) / 2, .6), hot: r.cook > 0 && ['soup', 'stew', 'pasta', 'rice', 'pan', 'wok', 'puree', 'gnocchi', 'omelette', 'protein', 'veggies', 'gratin'].includes(kind) || (kind === 'drink' && /chaud|cafe|the /.test(t)), kind };
}
KIND.gratin = c => {
  const W = 1.05, D = .7, top = .3;
  cube(c.G, tf(M3.T(0, .15, 0), M3.S(W + .08, .15, D + .08)), C('#f0ebe0'), .22, 18, { gloss: .75, jit: .02 });
  cube(c.G, tf(M3.T(0, top - .02, 0), M3.S(W, .05, D)), (p, u, v, n) => Math.abs(n[1]) > .5 ? mix(C('#e8b850'), C('#8a4a1a'), Math.min(1, Math.pow(d3smooth(p[0] * 6, 0, p[2] * 6), 2) * 1.6)) : C('#e9b860'), .2, 22, { gloss: .45, jit: .15 });
  c.used.push(/./); c.garnish = false;
  return { top: () => top + .03, R: .5, sx: 1.4 };
};

/* ----- Rendu WebGL ----- */
const D3VS = 'attribute vec3 aP;attribute vec3 aN;attribute vec4 aC;attribute float aG;uniform mat4 uVP;uniform mat3 uR;varying vec3 vN;varying vec4 vC;varying vec3 vW;varying float vG;void main(){vec3 w=uR*aP;vW=w;vN=uR*aN;vC=aC;vG=aG;gl_Position=uVP*vec4(w,1.0);}';
const D3FS = 'precision mediump float;varying vec3 vN;varying vec4 vC;varying vec3 vW;varying float vG;uniform vec3 uEye;void main(){vec3 n=normalize(vN);vec3 v=normalize(uEye-vW);if(dot(n,v)<0.0)n=-n;vec3 L=normalize(vec3(-0.45,0.9,0.35));vec3 L2=normalize(vec3(0.7,0.35,-0.5));float d=max(dot(n,L),0.0);float d2=max(dot(n,L2),0.0)*0.3;float hemi=0.5+0.5*n.y;vec3 amb=mix(vec3(0.36,0.31,0.28),vec3(0.66,0.68,0.74),hemi);vec3 h=normalize(L+v);float s=pow(max(dot(n,h),0.0),mix(10.0,90.0,vG))*vG*0.75;float rim=pow(1.0-max(dot(n,v),0.0),3.0)*0.16;vec3 c=vC.rgb*(amb*0.72+d*vec3(1.0,0.95,0.88)*0.82+d2*vec3(0.75,0.85,1.0))+s+rim;gl_FragColor=vec4(c,vC.a);}';
function d3ctx(canvas, keep) {
  const gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: !!keep }); if (!gl) return null;
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }, p = gl.createProgram();
  gl.attachShader(p, sh(gl.VERTEX_SHADER, D3VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, D3FS)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
  gl.useProgram(p);
  return { gl, p, a: ['aP', 'aN', 'aC', 'aG'].map(n => gl.getAttribLocation(p, n)), uVP: gl.getUniformLocation(p, 'uVP'), uR: gl.getUniformLocation(p, 'uR'), uEye: gl.getUniformLocation(p, 'uEye'), bufs: null };
}
function d3upload(X, m) { const { gl } = X; if (X.bufs) X.bufs.forEach(b => gl.deleteBuffer(b.b)); X.bufs = [m.o, m.t].map(arr => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW); return { b, n: arr.length / 11 }; }); X.m = m; }
function d3draw(X, w, h, yaw, pitch, zoom) {
  const { gl, m } = X; gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST);
  const asp = w / h, f = 1 / Math.tan(.33), fit = Math.pow(1.6 / asp, 1.8), dist = m.rad * 3.35 * fit / zoom, tgt = [0, m.cy * .8, 0];
  const eye = [0, tgt[1] + Math.sin(pitch) * dist, Math.cos(pitch) * dist], zf = [eye[0] - tgt[0], eye[1] - tgt[1], eye[2] - tgt[2]], zl = Math.hypot(...zf), z = zf.map(x => x / zl);
  const xv = [z[2], 0, -z[0]], xl = Math.hypot(...xv), x = xv.map(a => a / xl), y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
  const V = [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]), -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]), -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]), 1];
  const n = .05, fr = 40, P = [f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, (fr + n) / (n - fr), -1, 0, 0, 2 * fr * n / (n - fr), 0], VP = [];
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += P[k * 4 + r] * V[c * 4 + k]; VP[c * 4 + r] = s; }
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  gl.uniformMatrix4fv(X.uVP, false, VP); gl.uniformMatrix3fv(X.uR, false, [cy, 0, -sy, 0, 1, 0, sy, 0, cy]); gl.uniform3fv(X.uEye, eye);
  X.bufs.forEach((B, i) => { if (!B.n) return; gl.bindBuffer(gl.ARRAY_BUFFER, B.b); [3, 3, 4, 1].reduce((off, sz, k) => { gl.enableVertexAttribArray(X.a[k]); gl.vertexAttribPointer(X.a[k], sz, gl.FLOAT, false, 44, off * 4); return off + sz; }, 0);
    if (i) { gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); } else { gl.disable(gl.BLEND); gl.depthMask(true); }
    gl.drawArrays(gl.TRIANGLES, 0, B.n); });
  gl.depthMask(true);
}

/* ----- Vignettes des cartes (rendu hors écran, une seule fois par recette et par session) ----- */
const d3key = r => 'd' + hash(r.id + '|' + r.title + '|' + r.ingr.map(i => i.n).join(','));
function d3thumbCtx() { if (D3.thumb === null) { try { const cv = document.createElement('canvas'); cv.width = 640; cv.height = 400; D3.thumb = d3ctx(cv, true) || false; D3.thumb && (D3.thumb.cv = cv); } catch { D3.thumb = false; } D3.ok = !!D3.thumb; } return D3.thumb; }
function d3supported() { if (D3.ok == null) d3thumbCtx(); return D3.ok; }
function d3on() { return S.prefs.dish3d !== false && d3supported(); }
function d3thumb(r) { const X = d3thumbCtx(); if (!X) return ''; d3upload(X, d3build(r)); d3draw(X, 640, 400, .35 + (hash(r.id) % 100) / 100 * .8, .62, 1.02); return X.cv.toDataURL('image/webp', .86); }
function d3pump() {
  if (D3.busy) return; const key = D3.queue.shift(); if (!key) return; D3.busy = true;
  const run = () => { try { const r = D3.recipes.get(key); if (r && !D3.imgs.has(key)) D3.imgs.set(key, d3thumb(r)); const src = D3.imgs.get(key); if (src) document.querySelectorAll(`img.d3img[data-d3="${key}"]`).forEach(im => { im.src = src; im.parentElement?.classList.add('has3d'); }); } catch (e) { console.warn('3D', e); } D3.busy = false; d3pump(); };
  (window.requestIdleCallback || (f => setTimeout(f, 16)))(run, { timeout: 300 });
}
const _art2d = art;
art = function (r, cls = '') {
  const h = _art2d(r, cls); if (!r?.ingr || !d3on()) return h;
  const key = d3key(r), src = D3.imgs.get(key); D3.recipes.set(key, r);
  return h.replace('class="art', `class="art${src ? ' has3d' : ''}`).replace('<span class="plate"></span>', `<span class="plate"></span><img class="d3img" alt="" draggable="false" data-d3="${key}"${src ? ` src="${src}"` : ''}>`);
};

/* ----- Visionneuse interactive de la fiche recette ----- */
function d3viewer(r) {
  const wrap = document.createElement('div'); wrap.className = 'd3view'; wrap.innerHTML = `<canvas aria-label="Aperçu 3D du plat : glissez pour le faire tourner" role="img"></canvas><div class="steam" aria-hidden="true"><i></i><i></i><i></i></div><div class="d3bar"><button class="icon sm" data-d3a="full" aria-label="Plein écran" title="Plein écran">${ic('expand')}</button><button class="icon sm" data-d3a="reset" aria-label="Recentrer" title="Recentrer">${ic('refresh')}</button></div><span class="d3hint">Glissez pour tourner · pincez pour zoomer</span>`;
  const cv = wrap.querySelector('canvas'), X = d3ctx(cv); if (!X) return null;
  const m = d3build(r); d3upload(X, m); wrap.classList.toggle('hot', m.hot && S.prefs.anim !== false);
  const anim = S.prefs.anim !== false && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const st = { yaw: .5, pitch: .62, zoom: 1, vy: 0, drag: null, idle: 0, pts: new Map(), dirty: true, off: 0 };
  const V = { wrap, rid: r.id + d3key(r), st, X, dead: false };
  const size = () => { const d = Math.min(devicePixelRatio || 1, 2), w = Math.round(wrap.clientWidth * d), h = Math.round(wrap.clientHeight * d); if (w && h && (cv.width !== w || cv.height !== h)) { cv.width = w; cv.height = h; st.dirty = true; } };
  wrap.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; wrap.setPointerCapture?.(e.pointerId); st.pts.set(e.pointerId, [e.clientX, e.clientY]); st.drag = [e.clientX, e.clientY]; st.vy = 0; st.idle = 0; wrap.classList.add('grab'); });
  wrap.addEventListener('pointermove', e => {
    if (!st.pts.has(e.pointerId)) return; const prev = st.pts.get(e.pointerId); st.pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (st.pts.size === 2) { const [a, b] = [...st.pts.values()], pa = e.pointerId === [...st.pts.keys()][0] ? prev : a, pb = e.pointerId === [...st.pts.keys()][1] ? prev : b; const d0 = Math.hypot(pa[0] - pb[0], pa[1] - pb[1]), d1 = Math.hypot(a[0] - b[0], a[1] - b[1]); if (d0 > 0) st.zoom = Math.min(2.6, Math.max(.6, st.zoom * d1 / d0)); }
    else { const dx = e.clientX - prev[0], dy = e.clientY - prev[1]; st.yaw += dx * .012; st.vy = dx * .012; if (wrap.classList.contains('full') || e.pointerType === 'mouse') st.pitch = Math.min(1.35, Math.max(.12, st.pitch + dy * .008)); }
    st.dirty = true; st.idle = 0;
  });
  const up = e => { st.pts.delete(e.pointerId); if (!st.pts.size) { st.drag = null; wrap.classList.remove('grab'); } };
  wrap.addEventListener('pointerup', up); wrap.addEventListener('pointercancel', up);
  wrap.addEventListener('wheel', e => { e.preventDefault(); st.zoom = Math.min(2.6, Math.max(.6, st.zoom * Math.exp(-e.deltaY * .0015))); st.dirty = true; }, { passive: false });
  wrap.addEventListener('dblclick', () => { st.yaw = .5; st.pitch = .62; st.zoom = 1; st.dirty = true; });
  wrap.addEventListener('click', e => { const b = e.target.closest('[data-d3a]'); if (!b) return; e.stopPropagation(); if (b.dataset.d3a === 'reset') { st.yaw = .5; st.pitch = .62; st.zoom = 1; } else { wrap.classList.toggle('full'); document.body.classList.toggle('d3full', wrap.classList.contains('full')); } st.dirty = true; });
  cv.addEventListener('webglcontextlost', e => { e.preventDefault(); V.dead = true; });
  const loop = () => {
    if (V.dead || D3.live !== V) return;
    if (!wrap.isConnected) { if (++st.off > 90) return d3dispose(V); } else st.off = 0;
    if (wrap.isConnected) { size(); st.idle++;
      if (!st.drag) { if (Math.abs(st.vy) > .0005) { st.yaw += st.vy; st.vy *= .94; st.dirty = true; } else if (anim && st.idle > 90) { st.yaw += .004; st.dirty = true; } }
      if (st.dirty && cv.width) { d3draw(X, cv.width, cv.height, st.yaw, st.pitch, st.zoom); st.dirty = false; } }
    requestAnimationFrame(loop);
  };
  D3.live = V; requestAnimationFrame(loop); return V;
}
function d3dispose(V) { if (!V) return; V.dead = true; if (D3.live === V) D3.live = null; document.body.classList.remove('d3full'); try { V.X.gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch {} V.wrap.remove(); }
function d3mount() {
  const head = document.querySelector('#sheetBody .rhead'); if (!head || head.querySelector('.d3view')) return;
  if (!curR || !sheetRender || !head.querySelector('.art.big') || !d3on()) return;
  const id = curR.id + d3key(curR); let V = D3.live;
  if (!V || V.rid !== id || V.dead) { d3dispose(V); V = d3viewer(curR); if (!V) return; }
  head.classList.add('has3d'); head.appendChild(V.wrap); V.st.dirty = true;
}
let d3sched = 0;
new MutationObserver(() => { if (d3sched) return; d3sched = requestAnimationFrame(() => { d3sched = 0;
  if (!d3on()) return;
  d3mount();
  document.querySelectorAll('img.d3img:not([src])').forEach(im => { const k = im.dataset.d3; if (!D3.queue.includes(k)) D3.queue.push(k); });
  d3pump();
}); }).observe(document.body, { childList: true, subtree: true });
