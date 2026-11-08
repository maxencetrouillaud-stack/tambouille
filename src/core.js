/* ===== Tambouille — cœur métier (pur, sans DOM, testable sous Node) ===== */
const DAY = 86400000;
const todayISO = () => { const d = new Date(); d.setHours(12, 0, 0, 0); return d.toISOString().slice(0, 10); };
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const diffDays = (a, b) => Math.round((new Date(a + 'T12:00:00') - new Date(b + 'T12:00:00')) / DAY);
const daysLeft = exp => exp ? diffDays(exp, todayISO()) : null;
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

/* ----- Unités ----- */
const UNITS = { g: 'g', kg: 'kg', ml: 'ml', cl: 'cl', l: 'l', pc: '', cs: 'c. à s.', cc: 'c. à c.' };
const UNIT_ALIASES = { gr: 'g', grammes: 'g', gramme: 'g', kilo: 'kg', kilos: 'kg', litre: 'l', litres: 'l', millilitres: 'ml', centilitres: 'cl', 'c.à.s': 'cs', 'càs': 'cs', cas: 'cs', cuillere: 'cs', cuilleres: 'cs', 'cuillère': 'cs', 'cuillères': 'cs', 'c.à.c': 'cc', 'càc': 'cc', cac: 'cc', piece: 'pc', pieces: 'pc', 'pièce': 'pc', 'pièces': 'pc', pc: 'pc', pcs: 'pc', x: 'pc', boite: 'pc', 'boîte': 'pc', boites: 'pc', 'boîtes': 'pc', tranche: 'pc', tranches: 'pc', sachet: 'pc', sachets: 'pc', paquet: 'pc', paquets: 'pc', pot: 'pc', pots: 'pc', bouteille: 'pc', bouteilles: 'pc', brique: 'pc', briques: 'pc' };
const PIECE_G = { oeuf: 60, oignon: 100, echalote: 30, carotte: 100, 'pomme terre': 150, poireau: 200, courgette: 250, tomate: 120, poivron: 180, citron: 100, pomme: 150, banane: 120, avocat: 170, ail: 5, brocoli: 400, salade: 300, champignon: 20, 'pain mie': 25, jambon: 45, 'pave saumon': 125, aubergine: 300, concombre: 300, orange: 150, poire: 160, yaourt: 125, tortilla: 40, potiron: 1500, 'cube bouillon': 10, 'pate brisee': 230, 'pate feuilletee': 230, 'pain': 250, baguette: 250 };

const STOP = new Set(['de', 'd', 'du', 'des', 'la', 'le', 'les', 'l', 'en', 'au', 'aux', 'a', 'et', 'bio', 'frais', 'fraiche', 'fraiches', 'nature']);
function norm(s) {
  return String(s || '').toLowerCase().replace(/œ/g, 'oe').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[’'`-]/g, ' ').replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/).filter(w => w && !STOP.has(w))
    .map(w => (w.length > 3 && /[sx]$/.test(w)) ? w.slice(0, -1) : w).join(' ');
}
const has = (n, k) => (' ' + n + ' ').includes(' ' + k);
const SYN = {
  'pate': ['spaghetti', 'penne', 'tagliatelle', 'fusilli', 'coquillette', 'macaroni', 'linguine', 'farfalle', 'rigatoni', 'nouille'],
  'fromage rape': ['emmental', 'gruyere', 'comte', 'parmesan', 'mozzarella rapee', 'cheddar'],
  'emmental': ['gruyere', 'comte', 'fromage rape'],
  'parmesan': ['grana padano', 'pecorino', 'grana'],
  'lardon': ['bacon', 'poitrine fumee'],
  'poulet': ['blanc poulet', 'escalope poulet', 'filet poulet', 'cuisse poulet'],
  'boeuf': ['steak', 'bavette', 'rumsteck'],
  'boeuf hache': ['steak hache', 'viande hachee'],
  'salade': ['laitue', 'roquette', 'mache', 'batavia', 'romaine', 'sucrine'],
  'pain': ['baguette', 'pain mie', 'pain complet'],
  'tomate concassee': ['coulis tomate', 'pulpe tomate', 'sauce tomate', 'passata'],
  'creme': ['creme fraiche', 'creme liquide', 'creme epaisse'],
  'lentille': ['lentille verte', 'lentille blonde'],
  'riz': ['riz basmati', 'riz thai', 'riz complet', 'riz arborio', 'riz rond'],
  'fromage blanc': ['skyr'],
  'huile': ['huile olive', 'huile tournesol', 'huile colza'],
  'chocolat': ['chocolat noir', 'chocolat patissier', 'chocolat lait'],
  'sucre': ['sucre poudre', 'sucre roux', 'cassonade'],
};
const EXC = { pomme: ['terre'], lait: ['coco', 'amande', 'avoine', 'soja', 'riz', 'vegetal'], pate: ['feuillete', 'brise', 'sable', 'pizza', 'tartiner', 'fruit', 'curry'], creme: ['glace', 'dessert', 'marron', 'balsamique'], riz: ['galette', 'souffle'], beurre: ['cacahuete', 'cacahouete'], tomate: ['concassee', 'sechee', 'sauce', 'coulis', 'pulpe', 'passata'], oeuf: ['paque', 'chocolat'], citron: ['jus'], sucre: ['glace'], chocolat: ['chaud', 'poudre'] };

function nameMatches(recipeName, pantryName) {
  const rn = norm(recipeName), pn = norm(pantryName);
  if (!rn || !pn) return false;
  if (rn === pn) return true;
  if ((EXC[rn] || []).some(e => has(pn, e))) return false;
  if ((' ' + pn + ' ').includes(' ' + rn + ' ')) return true;
  return (SYN[rn] || []).some(s => pn === s || (' ' + pn + ' ').includes(' ' + s + ' '));
}

function toBase(q, u) {
  q = Number(q) || 0;
  switch (u) {
    case 'kg': return { v: q * 1000, b: 'g' }; case 'g': return { v: q, b: 'g' };
    case 'l': return { v: q * 1000, b: 'ml' }; case 'cl': return { v: q * 10, b: 'ml' }; case 'ml': return { v: q, b: 'ml' };
    case 'cs': return { v: q * 15, b: 'ml' }; case 'cc': return { v: q * 5, b: 'ml' };
    default: return { v: q, b: 'pc' };
  }
}
function pieceWeight(name) { const n = norm(name); let best = null, bl = 0; for (const k of Object.keys(PIECE_G)) if ((n === k || (' ' + n + ' ').includes(' ' + k + ' ')) && k.length > bl) { best = PIECE_G[k]; bl = k.length; } return best; }
/* Convertit (q,u) dans l'unité cible ; null si impossible (ex. pièces → g sans poids connu) */
function convert(q, u, toUnit, name) {
  const a = toBase(q, u), t = toBase(1, toUnit);
  if (a.b === t.b) return a.v / t.v;
  const mass = b => b === 'g' || b === 'ml';
  if (mass(a.b) && mass(t.b)) return a.v / t.v; // densité ≈ 1
  const w = pieceWeight(name); if (!w) return null;
  if (a.b === 'pc') return a.v * w / t.v;
  if (t.b === 'pc') return a.v / w;
  return null;
}
function fmtQty(q, u) {
  if (q == null || isNaN(q)) return '';
  let r;
  if (u === 'pc') r = q < 1 ? Math.round(q * 4) / 4 : Math.round(q * 2) / 2;
  else if ((u === 'g' || u === 'ml') && q >= 50) r = Math.round(q / 5) * 5;
  else r = Math.round(q * 10) / 10;
  const s = String(r).replace('.', ',');
  const lab = UNITS[u] ?? u;
  return lab ? s + ' ' + lab : s;
}
const euro = v => (Math.round(v * 100) / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

/* ----- Catégories, conservation, prix indicatifs ----- */
const CATS = {
  fruitleg: { label: 'Fruits et légumes', days: 7, loc: 'frigo', exp: 'est', open: 3, price: 3, freeze: true, tip: 'Hors du frigo : tomates, bananes, pommes de terre, oignons et ail. Au bac à légumes : le reste, sans les laver.', kw: ['pomme de terre', 'patate', 'carotte', 'tomate', 'courgette', 'oignon', 'echalote', 'poireau', 'salade', 'laitue', 'epinard', 'brocoli', 'poivron', 'champignon', 'concombre', 'ail', 'chou', 'aubergine', 'haricot vert', 'petit pois', 'radis', 'navet', 'betterave', 'potiron', 'courge', 'celeri', 'fenouil', 'asperge', 'avocat', 'pomme', 'banane', 'citron', 'orange', 'fraise', 'poire', 'raisin', 'kiwi', 'mangue', 'ananas', 'peche', 'abricot', 'framboise', 'myrtille', 'clementine', 'pamplemousse', 'melon', 'cerise', 'prune', 'gingembre', 'persil', 'coriandre', 'basilic frais', 'menthe', 'aneth', 'ciboulette', 'roquette', 'mache', 'endive', 'panais', 'patate douce', 'figue'] },
  viande: { label: 'Viandes et volailles', days: 3, loc: 'frigo', exp: 'DLC', open: 2, price: 13, freeze: true, tip: 'Au plus froid du frigo (0-4 °C), dans son emballage. Congelez avant la DLC si vous ne la cuisinez pas.', kw: ['poulet', 'boeuf', 'porc', 'jambon', 'lardon', 'bacon', 'steak', 'dinde', 'saucisse', 'chorizo', 'canard', 'veau', 'agneau', 'viande', 'escalope', 'merguez', 'roti', 'knack', 'saucisson', 'rillette'] },
  poisson: { label: 'Poissons et fruits de mer', days: 2, loc: 'frigo', exp: 'DLC', open: 1, price: 18, freeze: true, tip: 'À consommer très vite, au plus froid du frigo. Se congèle bien s’il est très frais.', kw: ['saumon', 'cabillaud', 'merlu', 'crevette', 'poisson', 'moule', 'colin', 'truite', 'surimi', 'crabe', 'calamar', 'lieu', 'dorade'] },
  laitier: { label: 'Produits laitiers et œufs', days: 10, loc: 'frigo', exp: 'DLC', open: 4, price: 7, freeze: false, tip: 'Refermez bien après ouverture. Le beurre et les fromages à pâte dure se congèlent ; crème et yaourts mal.', kw: ['lait', 'yaourt', 'yogourt', 'fromage', 'creme', 'beurre', 'emmental', 'parmesan', 'mozzarella', 'feta', 'comte', 'gruyere', 'chevre', 'skyr', 'ricotta', 'mascarpone', 'camembert', 'brie', 'cheddar', 'raclette', 'reblochon', 'oeuf', 'petit suisse'] },
  feculent: { label: 'Féculents et céréales', days: 365, loc: 'placard', exp: 'DDM', open: 90, price: 2.5, freeze: false, tip: 'Au sec, dans un bocal fermé une fois ouvert, à l’abri des mites alimentaires.', kw: ['pate', 'spaghetti', 'penne', 'tagliatelle', 'fusilli', 'coquillette', 'nouille', 'riz', 'semoule', 'quinoa', 'boulgour', 'lentille', 'pois chiche', 'haricot sec', 'flocon', 'avoine', 'cereale', 'pain', 'baguette', 'gnocchi', 'couscous', 'polenta', 'tortilla', 'muesli', 'granola'] },
  conserve: { label: 'Conserves et bocaux', days: 700, loc: 'placard', exp: 'DDM', open: 3, price: 4, freeze: false, tip: 'Une fois ouverte, transvasez dans une boîte hermétique au frigo et consommez sous 3 jours.', kw: ['conserve', 'tomate concassee', 'coulis', 'pulpe', 'passata', 'haricot rouge', 'mais', 'thon', 'sardine', 'lait coco', 'compote', 'cornichon', 'olive', 'confit', 'bocal'] },
  epice: { label: 'Épices et condiments', days: 700, loc: 'placard', exp: 'DDM', open: 365, price: 25, freeze: false, tip: 'À l’abri de la lumière et de la chaleur ; les épices perdent leur arôme après un an.', kw: ['sel', 'poivre', 'epice', 'curry', 'cumin', 'paprika', 'cannelle', 'herbe', 'thym', 'laurier', 'origan', 'muscade', 'piment', 'curcuma', 'moutarde', 'bouillon', 'cube', 'vanille', 'levure', 'bicarbonate', 'sesame', 'graine'] },
  sauce: { label: 'Sauces et huiles', days: 365, loc: 'placard', exp: 'DDM', open: 60, price: 6, freeze: false, tip: 'Huiles à l’abri de la lumière. Sauces entamées (mayonnaise, pesto, ketchup) au frigo.', kw: ['huile', 'vinaigre', 'sauce', 'ketchup', 'mayonnaise', 'pesto', 'soja', 'tahini', 'nuoc mam', 'tabasco', 'harissa'] },
  surgele: { label: 'Produits surgelés', days: 180, loc: 'congelo', exp: 'DDM', open: 1, price: 6, freeze: true, tip: 'Ne recongelez jamais un produit décongelé cru. Décongelez au frigo, pas à l’air libre.', kw: ['surgele', 'glace', 'frite', 'poelee', 'congele', 'sorbet'] },
  boisson: { label: 'Boissons', days: 120, loc: 'placard', exp: 'DDM', open: 4, price: 2, freeze: false, tip: 'Jus et laits végétaux ouverts : au frigo, 3 à 5 jours.', kw: ['jus', 'soda', 'eau', 'biere', 'vin', 'cafe', 'the', 'sirop', 'lait vegetal', 'lait amande', 'lait avoine', 'lait soja', 'cidre', 'infusion'] },
  sucre: { label: 'Pâtisserie et sucré', days: 365, loc: 'placard', exp: 'DDM', open: 120, price: 4, freeze: false, tip: 'Farine, sucre et cacao au sec dans des bocaux. Chocolat entre 15 et 18 °C.', kw: ['farine', 'sucre', 'chocolat', 'cacao', 'miel', 'confiture', 'biscuit', 'maizena', 'poudre amande', 'pate tartiner', 'cassonade', 'gateau', 'beurre cacahuete', 'amande', 'noisette', 'noix', 'pistache', 'raisin sec', 'cajou'] },
  frais: { label: 'Pâtes à tarte et traiteur', days: 10, loc: 'frigo', exp: 'DLC', open: 2, price: 8, freeze: true, tip: 'Au frigo, entre 0 et 4 °C. Les pâtes à tarte se congèlent.', kw: ['pate brisee', 'pate feuilletee', 'pate pizza', 'pate sablee', 'houmou', 'tofu', 'gnocchi frais', 'pate fraiche', 'quiche', 'tzatziki'] },
  autre: { label: 'Autres produits', days: 14, loc: 'frigo', exp: 'est', open: 5, price: 5, freeze: false, tip: 'Suivez les indications de l’emballage.', kw: [] },
};
const CAT_ORDER = ['fruitleg', 'viande', 'poisson', 'laitier', 'frais', 'feculent', 'conserve', 'epice', 'sauce', 'surgele', 'boisson', 'sucre', 'autre'];
const OLD_CAT = { legume: 'fruitleg', fruit: 'fruitleg', oeuf: 'laitier', epicerie: null };
const SPACE_KINDS = { frigo: 'Frigo', placard: 'Placard', congelo: 'Congélateur', cave: 'Cave / cellier' };
const DEFAULT_SPACES = [{ id: 'frigo', name: 'Frigo', kind: 'frigo' }, { id: 'placard', name: 'Placard', kind: 'placard' }, { id: 'congelo', name: 'Congélateur', kind: 'congelo' }];
const PIECE_PRICE = { oeuf: 0.3, 'cube bouillon': 0.15, 'pate brisee': 1.4, 'pate feuilletee': 1.4, avocat: 1, citron: 0.45, yaourt: 0.35, tortilla: 0.3, baguette: 1.1, 'pave saumon': 3.5, salade: 1.2, brocoli: 2, potiron: 3 };
const KW_INDEX = Object.entries(CATS).flatMap(([c, o]) => o.kw.map(k => [norm(k), c])).sort((a, b) => b[0].length - a[0].length);
function guessCat(name) {
  const n = ' ' + norm(name) + ' '; let best = 'autre', bi = 1e9, bl = 0;
  for (const [k, c] of KW_INDEX) { const i = n.indexOf(' ' + k); if (i >= 0 && (i < bi || (i === bi && k.length > bl))) { best = c; bi = i; bl = k.length; } }
  return best;
}
function estPrice(name, qty, unit) {
  const n = norm(name), cat = CATS[guessCat(name)];
  if (unit === 'pc') { for (const [k, p] of Object.entries(PIECE_PRICE)) if (n === k || has(n, k)) return qty * p; }
  const b = toBase(qty, unit);
  const kg = b.b === 'pc' ? qty * (pieceWeight(name) || 200) / 1000 : b.v / 1000;
  return kg * cat.price;
}

/* ----- Dates : DLC (sécurité) / DDM (qualité) / estimation, aliments ouverts ----- */
function effExp(it) {
  let e = it.exp || null;
  if ((it.state === 'ouvert' || it.state === 'entame') && it.opened) {
    const o = addDays(it.opened, (CATS[it.cat] || CATS.autre).open);
    if (!e || o < e) e = o;
  }
  return e;
}
/* safe=false : ne doit jamais être proposé à la consommation */
function safety(it) {
  const d = daysLeft(effExp(it));
  if (d == null || d >= 0) return { safe: true, d, level: d == null ? 'none' : d <= 1 ? 'urgent' : d <= 3 ? 'soon' : 'ok' };
  if (it.expType === 'DDM') return { safe: true, d, level: 'ddm', note: 'DDM dépassée : encore consommable si l’emballage est intact et l’aspect normal.' };
  if (it.expType === 'DLC') return { safe: false, d, level: 'expired', note: 'DLC dépassée : ne pas consommer, à jeter.' };
  return { safe: false, d, level: 'check', note: 'Date estimée dépassée : vérifiez l’aspect et l’odeur, puis mettez la date à jour.' };
}

/* ----- Saisonnalité (France métropolitaine, mois de début/fin) ----- */
const SEASON = { courgette: [6, 9], tomate: [6, 9], aubergine: [6, 9], poivron: [6, 9], concombre: [5, 9], 'haricot vert': [6, 9], 'petit pois': [5, 7], asperge: [4, 6], fraise: [5, 7], cerise: [6, 7], abricot: [6, 8], peche: [6, 9], melon: [6, 9], framboise: [6, 9], myrtille: [7, 9], prune: [7, 9], raisin: [8, 10], figue: [8, 10], champignon: [9, 11], potiron: [9, 1], courge: [9, 1], poireau: [9, 4], chou: [10, 3], endive: [10, 4], celeri: [9, 3], navet: [10, 3], panais: [10, 3], epinard: [9, 5], brocoli: [6, 11], 'chou fleur': [9, 4], radis: [3, 6], salade: [4, 10], mache: [10, 3], fenouil: [6, 11], pomme: [9, 4], poire: [8, 2], kiwi: [11, 4], clementine: [11, 2], orange: [12, 4], 'patate douce': [9, 12], betterave: [7, 3] };
function inSeason(name, month) {
  const n = norm(name); let k = null;
  for (const key of Object.keys(SEASON)) if ((n === key || has(n, key)) && (!k || key.length > k.length)) k = key;
  if (!k || (k === 'pomme' && has(n, 'pomme terre'))) return null;
  const [a, b] = SEASON[k];
  return a <= b ? month >= a && month <= b : month >= a || month <= b;
}
function seasonOf(r, month) { let ok = 0, out = 0; for (const i of r.ingr) { const s = inSeason(i.n, month); if (s === true) ok++; else if (s === false) out++; } return { ok, out }; }

/* ----- Allergènes (déclarés + détectés dans les ingrédients : exclusion stricte) ----- */
const ALLERGENS = { gluten: 'Gluten', lait: 'Lait', oeuf: 'Œufs', arachide: 'Arachide', fruits_a_coque: 'Fruits à coque', poisson: 'Poisson', crustaces: 'Crustacés', mollusques: 'Mollusques', soja: 'Soja', celeri: 'Céleri', moutarde: 'Moutarde', sesame: 'Sésame', sulfites: 'Sulfites', lupin: 'Lupin' };
const ALLERGEN_KW = {
  gluten: ['farine', 'pate', 'spaghetti', 'penne', 'tagliatelle', 'fusilli', 'coquillette', 'nouille', 'macaroni', 'pain', 'baguette', 'semoule', 'boulgour', 'chapelure', 'biscuit', 'gnocchi', 'ble', 'seigle', 'orge', 'avoine', 'flocon', 'couscous', 'biere', 'tortilla', 'sauce soja', 'cube bouillon', 'granola', 'muesli'],
  lait: ['lait', 'beurre', 'creme', 'fromage', 'emmental', 'parmesan', 'mozzarella', 'feta', 'comte', 'gruyere', 'yaourt', 'mascarpone', 'ricotta', 'chevre', 'skyr', 'raclette', 'cheddar', 'reblochon', 'camembert', 'brie', 'petit suisse', 'chocolat lait'],
  oeuf: ['oeuf', 'mayonnaise', 'pate fraiche'], arachide: ['cacahuete', 'cacahouete', 'arachide'],
  fruits_a_coque: ['amande', 'noisette', 'noix', 'pistache', 'cajou', 'pecan', 'pignon', 'pesto'],
  poisson: ['saumon', 'thon', 'cabillaud', 'merlu', 'poisson', 'sardine', 'anchoi', 'truite', 'colin', 'nuoc mam', 'lieu', 'dorade'],
  crustaces: ['crevette', 'crabe', 'homard', 'langoustine', 'surimi'], mollusques: ['moule', 'calamar', 'huitre', 'seiche'],
  soja: ['soja', 'tofu', 'edamame'], celeri: ['celeri'], moutarde: ['moutarde'], sesame: ['sesame', 'tahini', 'houmou'],
  sulfites: ['vin', 'vinaigre vin', 'fruit sec', 'raisin sec'], lupin: ['lupin'],
};
const ALLERGEN_NOT = { lait: ['lait coco', 'lait amande', 'lait avoine', 'lait soja', 'lait riz', 'lait vegetal', 'beurre cacahuete', 'creme coco'], gluten: ['sans gluten'] };
function ingAllergens(name) {
  const n = norm(name), out = [];
  for (const [a, kws] of Object.entries(ALLERGEN_KW)) {
    let c = ' ' + n + ' ';
    (ALLERGEN_NOT[a] || []).forEach(x => { c = c.split(' ' + norm(x) + ' ').join(' '); });
    if (kws.some(k => c.includes(' ' + norm(k) + ' '))) out.push(a);
  }
  return out;
}
function recipeAllergens(r) { const s = new Set(r.allergens || []); for (const i of r.ingr) ingAllergens(i.n).forEach(a => s.add(a)); return [...s]; }
const MEAT = new Set(['viande', 'poisson']);
function dietOK(r, diet) {
  if (!diet) return true;
  const cats = r.ingr.map(i => guessCat(i.n)), al = recipeAllergens(r);
  const meat = cats.some(c => MEAT.has(c)) || al.includes('poisson') || al.includes('crustaces') || al.includes('mollusques') || r.ingr.some(i => has(norm(i.n), 'gelatine') || has(norm(i.n), 'bouillon poulet'));
  if (diet === 'vege') return !meat;
  if (diet === 'vegan') return !meat && !al.includes('lait') && !al.includes('oeuf') && !r.ingr.some(i => has(norm(i.n), 'miel'));
  if (diet === 'sansgluten') return !al.includes('gluten');
  if (diet === 'sanslactose') return !al.includes('lait');
  return true;
}
const DIETS = { '': 'Aucun', vege: 'Végétarien', vegan: 'Végan', sansgluten: 'Sans gluten', sanslactose: 'Sans lactose' };
const DEFAULT_STAPLES = 'sel, poivre, huile, huile d’olive, eau';

/* ----- Substitutions locales (sans IA) ----- */
const SUBS = { creme: ['lait coco', 'fromage blanc', 'yaourt', 'lait'], beurre: ['huile', 'margarine'], lait: ['lait vegetal', 'lait avoine', 'lait amande', 'lait soja'], parmesan: ['emmental', 'comte', 'gruyere'], emmental: ['comte', 'gruyere', 'mozzarella', 'parmesan', 'cheddar'], 'fromage rape': ['mozzarella', 'cheddar', 'chevre'], lardon: ['jambon', 'bacon', 'chorizo'], oignon: ['echalote', 'poireau'], echalote: ['oignon'], riz: ['quinoa', 'boulgour', 'semoule'], pate: ['riz', 'gnocchi'], 'tomate concassee': ['tomate', 'coulis'], citron: ['vinaigre', 'citron vert'], poulet: ['dinde', 'tofu', 'pois chiche'], 'boeuf hache': ['lentille', 'steak hache vegetal'], sucre: ['miel', 'sirop erable'], farine: ['maizena'], mayonnaise: ['yaourt', 'fromage blanc'], yaourt: ['fromage blanc', 'skyr'], courgette: ['aubergine', 'poivron'], epinard: ['salade', 'blette'], 'lait coco': ['creme'], 'pave saumon': ['cabillaud', 'colin', 'truite'], chocolat: ['cacao'] };

/* ----- Saisie libre : "500 g de farine, 3 oeufs, lait 1 l, deux yaourts" ----- */
const NUMWORDS = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, douze: 12, quinze: 15, vingt: 20, trente: 30, demi: 0.5, 'demie': 0.5, cent: 100, mille: 1000 };
function wordsToNum(s) { return String(s).replace(/\b(un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|douze|quinze|vingt|trente|demie?|cent|mille)\b(?=\s+[a-zA-Zàâçéèêëîïôûùüœ])/gi, w => NUMWORDS[w.toLowerCase()]); }
function parseUnit(tok) { if (!tok) return null; const t = tok.toLowerCase().replace(/\.$/, ''); if (UNITS[t] !== undefined) return t; return UNIT_ALIASES[t] || null; }
function parseLine(line) {
  let s = wordsToNum(line).trim().replace(/\s+/g, ' ');
  if (!s) return null;
  let qty = null, unit = 'pc', name = s, m;
  if ((m = s.match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-Zàâçéèêëîïôûùüÿ.]+)?\s*(?:de |d'|d’)?(.*)$/i))) {
    const u = parseUnit(m[2]);
    qty = parseFloat(m[1].replace(',', '.'));
    if (u) { unit = u; name = m[3]; } else name = ((m[2] || '') + ' ' + m[3]).trim();
  } else if ((m = s.match(/^(.*?)\s+(?:x\s*)?(\d+(?:[.,]\d+)?)\s*([a-zA-Zàâçéèêëîïôûùüÿ.]+)?$/i))) {
    const u = parseUnit(m[3]);
    if (m[3] && !u) return { name: s, qty: 1, unit: 'pc' };
    name = m[1]; qty = parseFloat(m[2].replace(',', '.')); if (u) unit = u;
  }
  name = name.replace(/^(?:de |d'|d’)/i, '').trim();
  if (!name) return null;
  if (qty == null || isNaN(qty)) qty = 1;
  return { name: name.charAt(0).toUpperCase() + name.slice(1), qty, unit };
}
function parseFreeText(text) { return String(text || '').split(/[\n;]+|(?<!\d),|,(?!\d)|\s+et\s+/i).map(parseLine).filter(Boolean); }

function makeItem(p) {
  let cat = p.cat; if (OLD_CAT[cat] !== undefined) cat = OLD_CAT[cat] || guessCat(p.name);
  if (!CATS[cat]) cat = guessCat(p.name);
  const C = CATS[cat];
  const loc = p.loc || C.loc;
  const shelf = p.shelfDays != null && isFinite(p.shelfDays) ? Math.max(0, Math.round(p.shelfDays)) : (loc === 'congelo' && cat !== 'surgele' ? 90 : C.days);
  return {
    id: p.id || uid(), name: String(p.name || '').trim().slice(0, 60), qty: Math.max(0, Number(p.qty) || 0), unit: UNITS[p.unit] !== undefined ? p.unit : 'pc',
    cat, loc, exp: p.exp || addDays(todayISO(), shelf), expType: ['DLC', 'DDM', 'est'].includes(p.expType) ? p.expType : (p.exp && p.expType == null ? C.exp : (p.expType || C.exp)),
    bought: p.bought || todayISO(), state: p.state || 'neuf', opened: p.opened || null, brand: p.brand ? String(p.brand).slice(0, 40) : '',
    nutri: p.nutri || null, photo: p.photo || null, uncertain: !!p.uncertain, note: p.note || '', added: p.added || Date.now(), upd: Date.now(),
  };
}
/* Migration des articles de la v1 */
function migrateItem(it) { return makeItem({ ...it, expType: it.expType || null }); }

/* ----- Recettes ----- */
function parseIng(s) {
  const opt = s.startsWith('?'); if (opt) s = s.slice(1);
  const m = s.match(/^(\d+(?:[.,]\d+)?)\s*(g|kg|ml|cl|l|pc|cs|cc)\s+(.+)$/);
  return m ? { n: m[3], q: parseFloat(m[1].replace(',', '.')), u: m[2], opt } : { n: s, q: 1, u: 'pc', opt };
}
const MEALS = { plat: 'Plat', entree: 'Entrée', accompagnement: 'Accompagnement', dessert: 'Dessert', petitdej: 'Petit-déjeuner', collation: 'Collation', boisson: 'Boisson' };
const EQUIP = { plaques: 'Plaques de cuisson', four: 'Four traditionnel', microondes: 'Micro-ondes', airfryer: 'Air fryer', thermomix: 'Thermomix', cookeo: 'Cookeo', robot: 'Robot pâtissier', blender: 'Blender', mixeur: 'Mixeur', barbecue: 'Barbecue', plancha: 'Plancha', autocuiseur: 'Autocuiseur', friteuse: 'Friteuse', machinepain: 'Machine à pain', fouet: 'Fouet électrique' };
const EQUIP_REQ = { 'Four': ['four', 'airfryer'], 'Mixeur': ['mixeur', 'blender', 'thermomix'], 'Blender': ['blender', 'mixeur', 'thermomix'], 'Poêle': ['plaques', 'plancha'], 'Casserole': ['plaques', 'cookeo', 'thermomix', 'autocuiseur'], 'Wok': ['plaques'], 'Sauteuse': ['plaques', 'cookeo'], 'Faitout': ['plaques', 'cookeo', 'autocuiseur'], 'Fouet électrique': ['fouet', 'robot', 'thermomix'], 'Micro-ondes': ['microondes'] };
const CUISINE_GROUPS = { Asiatique: ['Chinoise', 'Japonaise', 'Thaïlandaise', 'Coréenne', 'Vietnamienne', 'Indienne'], Méditerranéenne: ['Grecque', 'Espagnole', 'Libanaise', 'Moyen-orientale', 'Marocaine', 'Italienne'] };
const cuisineIn = (c, favs) => favs.some(f => f === c || (CUISINE_GROUPS[f] || []).includes(c));
function normRecipe(x) {
  const r = { ...x };
  r.ingr = (r.ingr || []).map(i => ({ n: i.n, q: Number(i.q) || 0, u: UNITS[i.u] !== undefined ? i.u : 'pc', opt: !!i.opt }));
  r.time = Number(r.time) || ((Number(r.prep) || 0) + (Number(r.cook) || 0)) || 30;
  r.prep = r.prep != null ? Number(r.prep) : Math.round(r.time / 3); r.cook = r.cook != null ? Number(r.cook) : Math.max(0, r.time - r.prep);
  r.servings = Number(r.servings) || 2; r.diff = Number(r.diff) || 1;
  r.kcal = Number(r.kcal) || 0; r.prot = Number(r.prot) || 0; r.carbs = Number(r.carbs) || 0; r.fat = Number(r.fat) || 0; r.fiber = Number(r.fiber) || 0;
  r.cuisine = r.cuisine || 'Française'; r.meal = MEALS[r.meal] ? r.meal : 'plat'; r.gourmand = Number(r.gourmand) || 2;
  r.equip = Array.isArray(r.equip) ? r.equip : []; r.steps = Array.isArray(r.steps) ? r.steps : [];
  r.desc = r.desc || ''; r.tip = r.tip || ''; r.storage = r.storage || ''; r.hue = Number(r.hue) || 30; r.allergens = r.allergens || [];
  return r;
}
function equipOK(r, have) { return r.equip.every(e => { const k = EQUIP_REQ[e]; return !k || k.some(x => have.includes(x)); }); }
function recipeCost(r, servings) { const k = (servings || r.servings) / r.servings; return r.ingr.filter(i => !i.opt).reduce((s, i) => s + estPrice(i.n, i.q * k, i.u), 0); }

/* ----- Analyse d'une recette face au stock : jamais de manquant présenté comme disponible ----- */
function isStaple(name, staples) { const n = norm(name); return staples.some(s => s && (n === s || nameMatches(s, n))); }
function analyze(r, pantry, servings, staplesText) {
  const staples = String(staplesText ?? DEFAULT_STAPLES).split(',').map(norm).filter(Boolean);
  servings = servings || r.servings;
  const k = servings / r.servings;
  const lines = [];
  let needed = 0, ok = 0, partial = 0, gaspi = 0, maxK = Infinity;
  const used = new Set();
  const usable = pantry.filter(p => p.qty > 0 && safety(p).safe);
  for (const ing of r.ingr) {
    const q = ing.q * k;
    const line = { ing, q, u: ing.u, status: 'missing', item: null, take: null };
    if (isStaple(ing.n, staples)) { line.status = 'staple'; lines.push(line); continue; }
    const cands = usable.filter(p => !used.has(p.id) && nameMatches(ing.n, p.name)).sort((a, b) => (daysLeft(effExp(a)) ?? 999) - (daysLeft(effExp(b)) ?? 999));
    if (cands.length) {
      const it = cands[0]; used.add(it.id); line.item = it;
      const need = convert(q, ing.u, it.unit, ing.n);
      if (need == null) line.status = 'ok';
      else { line.take = Math.min(need, it.qty); line.status = it.qty + 1e-9 >= need * 0.9 ? 'ok' : 'partial'; if (!ing.opt && need > 0) maxK = Math.min(maxK, it.qty / (need / k)); }
      const sf = safety(it);
      if (sf.level === 'urgent') { gaspi += 25; line.gaspi = true; } else if (sf.level === 'soon') { gaspi += 15; line.gaspi = true; }
      if (sf.level === 'ddm') line.ddm = true;
      if (it.uncertain) line.uncertain = true;
    }
    if (line.status === 'missing' || line.status === 'partial') {
      const alts = SUBS[norm(ing.n)] || [];
      const sub = usable.find(p => !used.has(p.id) && alts.some(a => nameMatches(a, p.name)));
      if (sub) line.sub = sub;
    }
    if (!ing.opt) { needed++; if (line.status === 'ok') ok++; else if (line.status === 'partial') partial++; }
    lines.push(line);
  }
  const missing = lines.filter(l => !l.ing.opt && (l.status === 'missing' || l.status === 'partial'));
  const coverage = needed ? (ok + partial * 0.5) / needed : 1;
  const maxServ = maxK === Infinity || lines.some(l => !l.ing.opt && l.status === 'missing') ? null : Math.floor(maxK * r.servings * 10) / 10;
  return { lines, missing, coverage, pct: Math.round(coverage * 100), gaspi, maxServ, canCook: missing.length === 0, score: Math.round(coverage * 100 + gaspi - missing.length * 6 - r.time / 10) };
}

/* Filtres combinables. F : critères de la vue ; P : préférences (allergies du foyer incluses) */
function passesFilters(r, F, P) {
  const al = recipeAllergens(r);
  if ((P.allergies || []).some(a => al.includes(a))) return false;
  if (!dietOK(r, P.diet)) return false;
  const banList = [P.dislikes, P.banned, F.ban].filter(Boolean).join(',').split(',').map(norm).filter(Boolean);
  if (banList.length && r.ingr.some(i => banList.some(d => nameMatches(d, i.n) || nameMatches(i.n, d)))) return false;
  if (F.must) { const ms = F.must.split(',').map(norm).filter(Boolean); if (!ms.every(m => r.ingr.some(i => nameMatches(m, i.n) || nameMatches(i.n, m)))) return false; }
  if (F.equipOnly && P.equipment && !equipOK(r, P.equipment)) return false;
  if (F.maxTime && r.time > F.maxTime) return false;
  if (F.diff && r.diff > F.diff) return false;
  if (F.maxCost && recipeCost(r) / r.servings > F.maxCost) return false;
  if (F.maxKcal && r.kcal > F.maxKcal) return false;
  if (F.minProt && r.prot < F.minProt) return false;
  if (F.maxCarbs && r.carbs > F.maxCarbs) return false;
  if (F.maxFat && r.fat > F.maxFat) return false;
  if (F.cuisine && r.cuisine !== F.cuisine) return false;
  if (F.meal && r.meal !== F.meal) return false;
  if (F.gourmand && r.gourmand < F.gourmand) return false;
  if (F.temp === 'chaud' && !(r.cook > 0)) return false;
  if (F.temp === 'froid' && r.cook > 0) return false;
  if (F.style === 'simple' && (r.diff > 1 || r.ingr.filter(i => !i.opt).length > 6)) return false;
  if (F.style === 'elabore' && r.diff < 2 && r.ingr.length < 7) return false;
  if (F.verified && r.src !== 'base') return false;
  if (F.cuisines && F.cuisines.length && !cuisineIn(r.cuisine, F.cuisines)) return false;
  if (F.season) { const s = seasonOf(r, new Date().getMonth() + 1); if (s.out > 0) return false; }
  if (F.q) { const q = norm(F.q); if (!norm(r.title).includes(q) && !r.ingr.some(i => norm(i.n).includes(q)) && !norm(r.cuisine).includes(q)) return false; }
  return true;
}
const MODES = {
  all: ['Toutes', () => true], full: ['100 % dispo', (r, a) => a.canCook], few: ['Quelques achats', (r, a) => a.missing.length > 0 && a.missing.length <= 3],
  rapide: ['Rapides', r => r.time <= 20], eco: ['Économiques', r => recipeCost(r) / r.servings <= 1.8], gaspi: ['Anti-gaspi', (r, a) => a.gaspi > 0],
  gourmand: ['Gourmandes', r => r.gourmand >= 3], equilibre: ['Équilibrées', r => r.kcal >= 300 && r.kcal <= 650 && r.prot >= 15 && r.fat <= 25 && r.fiber >= 4],
  proteine: ['Protéinées', r => r.prot >= 25], vege: ['Végétariennes', r => dietOK(r, 'vege')], vegan: ['Végétaliennes', r => dietOK(r, 'vegan')],
  monde: ['Du monde', r => r.cuisine !== 'Française'], perso: ['Créées par IA ou moi', r => r.src !== 'base'],
};

/* Validation stricte d'une recette produite par l'IA */
function sanitizeRecipe(x, src = 'ai') {
  if (!x || typeof x !== 'object' || !x.title || !Array.isArray(x.ingredients) || !Array.isArray(x.steps) || !x.steps.length) return null;
  const num = (v, d, lo, hi) => { const n = Number(v); return isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
  const ingr = x.ingredients.slice(0, 25).map(i => typeof i === 'string' ? parseIng(i) : ({ n: String(i.name || i.n || '').slice(0, 50), q: num(i.qty ?? i.q, 1, 0, 5000), u: UNITS[i.unit] !== undefined ? i.unit : (parseUnit(i.unit) || 'pc'), opt: !!i.optional })).filter(i => i.n);
  if (!ingr.length) return null;
  const prep = num(x.prep, 10, 0, 240), cook = num(x.cook, 15, 0, 480);
  return normRecipe({
    id: (src === 'ai' ? 'ai-' : 'p-') + uid(), title: String(x.title).slice(0, 80), desc: String(x.description || x.desc || '').slice(0, 240), prep, cook, time: prep + cook,
    diff: num(x.difficulty, 1, 1, 3), servings: num(x.servings, 2, 1, 20), kcal: num(x.kcal, 0, 0, 3000), prot: num(x.protein, 0, 0, 200), carbs: num(x.carbs, 0, 0, 400), fat: num(x.fat, 0, 0, 200), fiber: num(x.fiber, 0, 0, 80),
    cuisine: String(x.cuisine || 'Française').slice(0, 30), meal: MEALS[x.meal] ? x.meal : 'plat', gourmand: num(x.gourmand, 2, 1, 3),
    equip: (Array.isArray(x.equipment) ? x.equipment : []).slice(0, 10).map(e => String(e).slice(0, 30)),
    allergens: (Array.isArray(x.allergens) ? x.allergens : []).filter(a => ALLERGENS[a]),
    hue: num(x.hue, Math.floor(Math.random() * 360), 0, 360), ingr, steps: x.steps.slice(0, 16).map(s => String(s).slice(0, 500)),
    tip: String(x.tip || '').slice(0, 400), storage: String(x.storage || '').slice(0, 300), src, created: Date.now(), estimated: true,
  });
}
function stepTimers(text) {
  const out = []; const re = /(\d+(?:[.,]\d+)?)\s*(h|heures?|min|minutes?)\b/gi; let m;
  while ((m = re.exec(text))) { const v = parseFloat(m[1].replace(',', '.')); const sec = /^h/i.test(m[2]) ? v * 3600 : v * 60; if (sec > 0 && sec <= 6 * 3600) out.push({ label: m[0], sec: Math.round(sec) }); }
  return out;
}

/* ----- Glossaire des techniques (mode débutant) ----- */
const TECH = { 'faire suer': 'Cuire à feu doux sans coloration pour que le légume rende son eau et s’attendrisse.', 'nacrer': 'Enrober le riz cru de matière grasse chaude jusqu’à ce qu’il devienne translucide.', 'déglacer': 'Verser un liquide dans la poêle chaude pour décoller les sucs de cuisson.', 'blanchir': 'Plonger quelques minutes dans l’eau bouillante puis refroidir.', 'saisir': 'Cuire à feu très vif pour colorer l’extérieur rapidement.', 'mijoter': 'Cuire doucement à petits frémissements, longtemps.', 'foncer': 'Garnir le moule avec la pâte étalée.', 'sabler': 'Frotter beurre et farine du bout des doigts jusqu’à obtenir une texture de sable.', 'émincer': 'Couper en tranches fines.', 'ciseler': 'Couper très finement (herbes, échalote).', 'réserver': 'Mettre de côté pour plus tard.', 'appareil': 'Mélange de base prêt à être cuit (œufs + crème par exemple).', 'frémissement': 'Liquide juste avant l’ébullition : petites bulles en surface.', 'al dente': 'Pâtes encore légèrement fermes sous la dent.', 'monter en neige': 'Battre les blancs d’œufs jusqu’à ce qu’ils soient fermes et mousseux.', 'zester': 'Prélever la fine peau colorée d’un agrume.', 'rissoler': 'Faire dorer dans une matière grasse chaude.', 'napper': 'Recouvrir d’une sauce.', 'bain-marie': 'Faire chauffer un récipient posé sur une casserole d’eau frémissante.', 'lier': 'Épaissir une sauce.' };

/* ----- Planificateur : périssables d'abord, variété, budget, réutilisation des achats ----- */
const SLOTS = { petitdej: 'Petit-déj.', midi: 'Déjeuner', soir: 'Dîner', collation: 'Collation' };
const SLOT_MEALS = { petitdej: ['petitdej'], midi: ['plat'], soir: ['plat'], collation: ['collation', 'dessert', 'boisson'] };
function planAuto({ dates, slots, cands, plan, budget, servings, history = [], alternate = false, repeatDays = 7 }) {
  const out = JSON.parse(JSON.stringify(plan || {}));
  const lastUsed = {}; history.forEach(h => { lastUsed[h.rid] = h.date; });
  Object.entries(out).forEach(([d, o]) => Object.values(o || {}).forEach(id => { if (!lastUsed[id] || lastUsed[id] < d) lastUsed[id] = d; }));
  const mealsPerWeek = slots.filter(s => s === 'midi' || s === 'soir').length * 7 || 14;
  const target = budget ? budget / mealsPerWeek : null;
  let n = 0, prevMissing = [], prevCuisine = null;
  for (const d of dates) {
    out[d] = out[d] || {};
    const dayMissing = [];
    for (const s of slots) {
      if (out[d][s]) continue;
      let best = null, bs = -1e9;
      for (const c of cands) {
        if (!SLOT_MEALS[s].includes(c.r.meal)) continue;
        if (s === 'midi' && c.r.time > 45) continue;
        const lu = lastUsed[c.r.id]; if (lu && Math.abs(diffDays(d, lu)) < repeatDays) continue;
        let sc = c.a.score;
        const cost = recipeCost(c.r, servings) / servings;
        if (target && (s === 'midi' || s === 'soir')) sc -= Math.max(0, cost - target) * 15;
        if (alternate && prevCuisine && (s === 'midi' || s === 'soir') && c.r.cuisine === prevCuisine) sc -= 12;
        sc += c.a.missing.filter(l => prevMissing.some(p => nameMatches(p, l.ing.n))).length * 8;
        if (sc > bs) { bs = sc; best = c; }
      }
      if (!best) continue;
      out[d][s] = best.r.id; lastUsed[best.r.id] = d; n++; if (s === 'midi' || s === 'soir') prevCuisine = best.r.cuisine;
      best.a.missing.forEach(l => dayMissing.push(l.ing.n));
    }
    prevMissing = dayMissing;
  }
  return { plan: out, added: n };
}

if (typeof module !== 'undefined') module.exports = { norm, nameMatches, convert, fmtQty, parseFreeText, parseLine, makeItem, migrateItem, guessCat, analyze, passesFilters, sanitizeRecipe, normRecipe, stepTimers, daysLeft, addDays, todayISO, safety, effExp, inSeason, seasonOf, recipeAllergens, ingAllergens, dietOK, estPrice, recipeCost, planAuto, MODES, equipOK, CATS, cuisineIn };
