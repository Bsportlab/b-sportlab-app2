import { ALIMENTI_DB } from './alimenti_db';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { expandFoodTerms, normalizeSearchText } from './lingue';
export { generaCodiceSicuro, calcolaAntropometria, BENCHMARKS, COLORBLIND_PALETTE } from './antropometria';

export const STORAGE_KEY = '@bsportlab_v10';

export const MEALS = ['Colazione', 'Pranzo', 'Merenda', 'Cena'];
export const DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
export const WORKOUT_SLOTS = [
  ['none', '🛌 Nessun allenamento'],
  ['fasted', '🌅 Digiuno (Pre-Colazione)'],
  ['morning', '☀️ Mattina (Dopo Colazione)'],
  ['lunch', '🕛 Pausa Pranzo'],
  ['afternoon', '🌇 Pomeriggio (Pre-Cena)'],
  ['evening', '🌙 Sera (Dopo Cena)'],
];
export const MOODS = [
  ['ready', '⚡ Già pronto / Zero fornelli (2 min)', 'Solo piatti freddi o assemblaggi senza cottura'],
  ['cook', '👨‍🍳 Ho voglia di cucinare', 'Piatti caldi, gourmet e ricette ai fornelli'],
  ['box', '🥡 Schiscetta / Fuori casa', 'Comodi da preparare e portare al lavoro o uni'],
  ['all', '🎲 Sorprendimi (Tutte le idee)', 'Mostra tutto il ricettario B-sportlab'],
];
export const SWEET_SAVORY = [['all', '🌍 Tutte'], ['sweet', '🍯 Dolce'], ['savory', '🥑 Salato']];
export const SEASONS = [['all', '🌍 Tutte le Stagioni'], ['summer', '☀️ Estate / Primavera'], ['winter', '❄️ Autunno / Inverno']];
export const FILTERS = [['gf', 'Senza Glutine'], ['lf', 'Senza Lattosio'], ['veg', 'Vegetariano'], ['vegan', 'Vegano']];

export const PROFILI = [
  ['BENESSERE', '🌱 Benessere (Singola Giornata)'],
  ['FITNESS', '⚡ Fitness / Amatoriale (Riposo + Workout)'],
  ['ATLETA', '🔥 Atleta / Performance (Microciclo Avanzato)'],
];

export const MOMENTI_INTEGRATORI = [
  ['colazione', '🌅 Mattina / Colazione'],
  ['pranzo', '🕛 Pranzo'],
  ['cena', '🌙 Sera / Cena'],
  ['notte', '🛌 Prima di dormire'],
  ['pre_wo', '⚡ Pre-Workout (30 min prima)'],
  ['intra_wo', '🚴 Intra-Workout (nella borraccia)'],
  ['post_wo', '🥤 Post-Workout (Recupero immediato)'],
  ['tutti', '🌍 In qualsiasi momento'],
];

export const DEFAULT_DOCTOR_SUPPLEMENTS = [
  { nome: 'Creatina monoidrato', dose: '5g', momento: 'post_wo' },
  { nome: 'Omega 3 (EPA/DHA)', dose: '2 cps', momento: 'colazione' },
  { nome: 'Vitamina D3', dose: '2000 UI', momento: 'colazione' },
  { nome: 'Magnesio bisglicinato', dose: '300mg', momento: 'notte' },
  { nome: 'Proteine Whey Isolate', dose: '30g', momento: 'post_wo' },
  { nome: 'Multivitaminico', dose: '1 cps', momento: 'colazione' },
  { nome: 'Beta Alanina', dose: '3.2g', momento: 'pre_wo' },
  { nome: 'Caffeina anidra', dose: '200mg', momento: 'pre_wo' },
  { nome: 'Melatonina', dose: '1mg', momento: 'notte' },
  { nome: 'Elettroliti / Sali', dose: '1 bustina in 500ml', momento: 'intra_wo' },
  { nome: 'Glutammina', dose: '5g', momento: 'post_wo' },
  { nome: 'Zinco & Selenio', dose: '1 cps', momento: 'cena' },
];

export const POST_WORKOUT_PRESETS = [
  { label: '⚡ Standard (30P / 40C)', nome: 'Recovery Shake', p: '30', c: '40', f: '2' },
  { label: '🏃‍♂️ Endurance (25P / 60C)', nome: 'Endurance Shake', p: '25', c: '60', f: '1' },
  { label: '💪 Forza (40P / 20C)', nome: 'Protein Power Shake', p: '40', c: '20', f: '2' },
  { label: '🥛 Solo Prot (30P / 0C)', nome: 'Whey Isolate Shake', p: '30', c: '0', f: '1' },
];

export const calcGPerKg = (grams, weight) => {
  const w = parseFloat(String(weight || 70).replace(',', '.')) || 70;
  const g = parseFloat(String(grams || 0).replace(',', '.')) || 0;
  return (g / w).toFixed(1);
};

export const formatDateDMY = (d = new Date()) => {
  if (!d) return '';
  if (typeof d === 'string') {
    const s = d.trim();
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
      const parts = s.split('/');
      return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
    }
    const parts = s.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
  }
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return String(d || '');
  const day = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${day}/${m}/${y}`;
};

export const parseDMY = (str) => {
  if (!str) return new Date();
  if (str instanceof Date) return isNaN(str.getTime()) ? new Date() : str;
  const s = String(str).trim();
  const dmyMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    return new Date(year, month, day);
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date() : d;
};

export const isDateAfter = (d1Input, d2Input) => {
  const d1 = parseDMY(d1Input);
  const d2 = parseDMY(d2Input);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  return d1.getTime() > d2.getTime();
};

export const formatIsoDate = (d = new Date()) => {
  const date = d instanceof Date ? d : parseDMY(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const formatItalianDayLabel = (d = new Date()) => {
  const date = d instanceof Date ? d : parseDMY(d);
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
  return `${dayNames[date.getDay()]} ${date.getDate()} ${monthNames[date.getMonth()]}`;
};

export const generateAthleteDates = (startDateStr, numDays = 5) => {
  const count = Math.max(1, Math.min(30, parseInt(numDays, 10) || 5));
  const baseDate = parseDMY(startDateStr || new Date());
  const result = [];
  for (let i = 0; i < count; i++) {
    const cur = new Date(baseDate);
    cur.setDate(baseDate.getDate() + i);
    result.push({
      id: `ath_${Date.now()}_${i}`,
      data: formatDateDMY(cur),
      nome: formatItalianDayLabel(cur),
      kj: i === 0 ? '1500' : i === 1 ? '2000' : '0',
      intra: { ore: '2', gh_carbo: '60', nome: 'Maltodestrine / Gel' },
      recovery: { nome: 'Recovery Shake', p: '30', c: '40', f: '2' },
      target_macro: { p: '140', f: '65', c: '450' },
      note: '',
    });
  }
  return result;
};

export const normalizePaziente = (p) => {
  if (!p) return null;
  const piano = p.piano_dati || {};

  // Priorità al metodo esplicito memorizzato nei dati clinici del piano
  let rawMetodo = p.metodo;
  if (piano.metodo && ['BENESSERE', 'FITNESS', 'ATLETA'].includes(piano.metodo)) {
    rawMetodo = piano.metodo;
  }
  if (!rawMetodo) rawMetodo = 'BENESSERE';

  let metodo = rawMetodo;
  if (rawMetodo === 'ON_OFF') metodo = 'FITNESS';
  if (rawMetodo === 'KJ') metodo = 'ATLETA';

  return {
    ...p,
    metodo,
    modalita_uso: p.modalita_uso || piano.modalita_uso || 'LIBERA',
    _rawMetodo: rawMetodo,
    peso_visita: String(p.peso_visita ?? 70),
    coeff_carbo: String(p.coeff_carbo ?? 2.0),
    passi_target: Number(p.passi_target ?? 8000),
    integratori: (Array.isArray(p.integratori) && p.integratori.length > 0) ? p.integratori : (Array.isArray(piano.integratori) ? piano.integratori : []),
    storico_piani: Array.isArray(p.storico_piani) ? p.storico_piani : [],
    anagrafica: {
      nome: p.anagrafica?.nome || p.nome || piano.anagrafica?.nome || '',
      cognome: p.anagrafica?.cognome || p.cognome || piano.anagrafica?.cognome || '',
      sesso: p.anagrafica?.sesso || p.sesso || piano.anagrafica?.sesso || 'M',
      data_nascita: p.anagrafica?.data_nascita || p.data_nascita || piano.anagrafica?.data_nascita || '',
      codice_fiscale: p.anagrafica?.codice_fiscale || p.codice_fiscale || piano.anagrafica?.codice_fiscale || '',
      telefono: p.anagrafica?.telefono || p.telefono || piano.anagrafica?.telefono || '',
      email: p.anagrafica?.email || p.email || piano.anagrafica?.email || '',
      residenza: p.anagrafica?.residenza || p.residenza || piano.anagrafica?.residenza || '',
    },
    note_private_dottore: p.note_private_dottore || piano.note_private_dottore || '',
    mostra_note_dottore: p.mostra_note_dottore !== undefined ? Boolean(p.mostra_note_dottore) : (piano.mostra_note_dottore !== undefined ? Boolean(piano.mostra_note_dottore) : true),
    visite_antropometriche: Array.isArray(p.visite_antropometriche) ? p.visite_antropometriche : (Array.isArray(piano.visite_antropometriche) ? piano.visite_antropometriche : []),
    piano_dati: {
      ...piano,
      metodo,
      modalita_uso: p.modalita_uso || piano.modalita_uso || 'LIBERA',
      mostra_macro: piano.mostra_macro !== false,
      lingua: piano.lingua || 'it',
      anagrafica: {
        nome: p.anagrafica?.nome || p.nome || piano.anagrafica?.nome || '',
        cognome: p.anagrafica?.cognome || p.cognome || piano.anagrafica?.cognome || '',
        sesso: p.anagrafica?.sesso || p.sesso || piano.anagrafica?.sesso || 'M',
        data_nascita: p.anagrafica?.data_nascita || p.data_nascita || piano.anagrafica?.data_nascita || '',
        codice_fiscale: p.anagrafica?.codice_fiscale || p.codice_fiscale || piano.anagrafica?.codice_fiscale || '',
        telefono: p.anagrafica?.telefono || p.telefono || piano.anagrafica?.telefono || '',
        email: p.anagrafica?.email || p.email || piano.anagrafica?.email || '',
        residenza: p.anagrafica?.residenza || p.residenza || piano.anagrafica?.residenza || '',
      },
      note_private_dottore: p.note_private_dottore || piano.note_private_dottore || '',
      mostra_note_dottore: p.mostra_note_dottore !== undefined ? Boolean(p.mostra_note_dottore) : (piano.mostra_note_dottore !== undefined ? Boolean(piano.mostra_note_dottore) : true),
      visite_antropometriche: Array.isArray(p.visite_antropometriche) ? p.visite_antropometriche : (Array.isArray(piano.visite_antropometriche) ? piano.visite_antropometriche : []),
      // 1. Benessere
      target_benessere: piano.target_benessere || { p: '130', f: '55', c: '180' },
      // 2. Fitness
      riposo_fitness: piano.riposo_fitness || piano.off || { p: '140', f: '60', c: '160' },
      workouts_fitness: Array.isArray(piano.workouts_fitness) && piano.workouts_fitness.length > 0
        ? piano.workouts_fitness
        : [
            { id: 'w1', nome: 'Allenamento A (Palestra)', delta_kcal: '300' },
            { id: 'w2', nome: 'Allenamento B (Corsa / Cardio)', delta_kcal: '450' },
          ],
      // 3. Atleta
      bmr_base: String(piano.bmr_base ?? '1500'),
      coeff_laf: String(piano.coeff_laf ?? '1.2'),
      data_inizio: piano.data_inizio ? formatDateDMY(piano.data_inizio) : formatDateDMY(new Date()),
      giorni_atleta: Array.isArray(piano.giorni_atleta) && piano.giorni_atleta.length > 0
        ? piano.giorni_atleta.map((g, i) => ({
            ...g,
            data: formatDateDMY(g.data),
            nome: g.nome || formatItalianDayLabel(g.data),
          }))
        : generateAthleteDates(formatDateDMY(new Date()), 5),
      // Dati legacy per compatibilità
      on: piano.on || { p: '150', f: '60', c: '280' },
      off: piano.off || { p: '150', f: '65', c: '160' },
      base: piano.base || { p: '140', f: '60', c: '200' },
      kj: piano.kj || { Lun: '0', Mar: '1200', Mer: '0', Gio: '1400', Ven: '800', Sab: '2000', Dom: '0' },
    },
    peri_workout: p.peri_workout || {
      intra: { nome: 'Gel / Maltodestrine', p: '0', f: '0', c: '40' },
      post: { nome: 'Recovery Shake', p: '30', f: '2', c: '40' },
    },
    diario_peso: Array.isArray(p.diario_peso) ? p.diario_peso : [],
  };
};

export const SUPERMARKET_AISLES = [
  { id: 'produce', order: 1 },
  { id: 'pantry', order: 2 },
  { id: 'dairy', order: 3 },
  { id: 'protein', order: 4 },
  { id: 'other', order: 5 },
];

const GF_ITEMS = ['avena', 'gnocchi', 'gallette', 'crackers'];
const LF_ITEMS = ['yogurt greco', 'fiocchi di latte', 'ricotta', 'feta'];

export const fmtName = (name, flt = []) => {
  let res = String(name || '');
  if (flt.includes('gf') && GF_ITEMS.some((k) => res.toLowerCase().includes(k))) res += ' (Senza Glutine)';
  if (flt.includes('lf') && LF_ITEMS.some((k) => res.toLowerCase().includes(k))) res += ' (Senza Lattosio)';
  return res;
};

export const toNum = (v) => parseFloat(String(v ?? 0).replace(',', '.')) || 0;
const round5 = (n) => Math.round(n / 5) * 5;

export const formatCaseName = (str = '') => {
  const clean = String(str || '').trim().replace(/\s+/g, ' ');
  if (!clean) return '';

  const lower = clean.toLowerCase();
  const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);

  return capitalized
    .replace(/\bevo\b/gi, 'EVO')
    .replace(/\bvenere\b/gi, 'Venere');
};

export const convertMeasureToGrams = (amountOrText, ingredientName = '') => {
  const ing = String(ingredientName || '').toLowerCase();
  const isLiquidOrOil = ['olio', 'acqua', 'latte', 'succo', 'brodo', 'aceto', 'bevanda'].some((k) => ing.includes(k));

  if (typeof amountOrText === 'number') {
    return Number.isFinite(amountOrText) && amountOrText > 0 ? Math.round(amountOrText) : 0;
  }

  const raw = String(amountOrText || '').trim().toLowerCase().replace(',', '.');
  if (!raw) return 0;

  const match = raw.match(/(\d+(?:\.\d+)?)\s*(kg|g|gr|grammi|ml|l|cucchiai?o?|cucchiain[oi]?|tbsp|tsp|c\.so|c\.ino)?/i);
  const qty = match ? parseFloat(match[1]) : 1;
  const unit = (match?.[2] || '').toLowerCase();

  if (unit === 'kg' || unit === 'l') return Math.round(qty * 1000);
  if (unit === 'g' || unit === 'gr' || unit === 'grammi' || unit === 'ml') return Math.round(qty);
  if (['cucchiaio', 'cucchiai', 'tbsp', 'c.so'].includes(unit) || raw.includes('cucchiai')) {
    return Math.round(qty * (isLiquidOrOil ? 10 : 15));
  }
  if (['cucchiaino', 'cucchiaini', 'tsp', 'c.ino'].includes(unit) || raw.includes('cucchiain')) {
    return Math.round(qty * 5);
  }
  if (raw.includes('filo')) return 5;
  if (raw.includes('pizzico')) return 2;

  return Number.isFinite(qty) && qty > 0 ? Math.round(qty) : 0;
};

export const isPreparedOrCutIngredient = (name = '') => {
  const n = String(name || '').toLowerCase();
  return [
    'less', 'cotti', 'cotte', 'precott', 'arrosto', 'grigliat', 'trifolat',
    'al vapore', 'al forno', 'a cubetti', 'a rondelle', 'a julienne', 'a fettine',
    'a striscioline', 'sgranati', 'sbucciat', 'sgusciat', 'pulite', 'sode',
  ].some((k) => n.includes(k));
};

export const isCookedReadyIngredient = (name = '') => {
  const n = String(name || '').toLowerCase();
  return [
    'cott', 'precott', 'less', 'sode', 'in salamoia', 'al naturale', 'affumicat', 'arrosto', 'grigliat',
  ].some((k) => n.includes(k));
};

export const estimateCookedGrams = (grams, name = '', kind = 'c') => {
  if (!grams || grams <= 0) return 0;
  const n = String(name || '').toLowerCase();
  if (isCookedReadyIngredient(n)) return round5(grams);

  if (kind === 'c') {
    if (['riso', 'pasta', 'avena', 'farro', 'quinoa', 'orzo', 'grano saraceno', 'mais', 'polenta'].some((k) => n.includes(k))) {
      return round5(grams * 2.5);
    }
    return round5(grams);
  }

  if (kind === 'p') {
    if (['pollo', 'tacchino', 'manzo', 'merluzzo', 'orata', 'salmone', 'gamber', 'seppie', 'tofu', 'tempeh'].some((k) => n.includes(k))) {
      return round5(grams * 0.75);
    }
    return round5(grams);
  }

  return round5(grams);
};

export const normalizeIngredientName = (name = '') => {
  const clean = String(name || '')
    .replace(/^\d+\s+/, '')
    .replace(/\s*\([^)]*\)/g, '')
    .trim();

  const lower = clean.toLowerCase();

  if (lower.includes('ghiaccio')) return '';
  if (lower.includes('yogurt greco intero')) return 'Yogurt greco intero';
  if (lower.includes('olio evo')) return 'Olio EVO';

  if (isPreparedOrCutIngredient(lower)) {
    return formatCaseName(clean);
  }

  if (lower.includes('mandorl')) return 'Mandorle';
  if (lower.includes('nocciol')) return 'Nocciole';
  if (lower.includes('pistacch')) return 'Pistacchi';
  if (lower.includes('gherigli di noce') || lower === 'noci') return 'Noci';
  if (lower.includes('albume')) return 'Albumi';
  if (lower.includes('uovo intero')) return 'Uovo intero';
  if (lower.includes('patate dolci')) return 'Patate dolci';
  if (lower.includes('patate comuni')) return 'Patate';
  if (lower === 'zucca') return 'Zucca';
  if (lower.includes('insalata mista')) return 'Insalata mista';
  if (lower.includes('insalata verde')) return 'Insalata verde';
  if (lower.includes('gallette di mais')) return 'Gallette di mais';
  if (lower.includes('gallette di grano saraceno') || lower.includes('gallette grano saraceno')) return 'Gallette di grano saraceno';
  if (lower.includes('gallette di riso') || lower.includes('gallette riso/mais')) return 'Gallette di riso';

  return formatCaseName(clean);
};

export const splitCombinedIngredient = (rawName, rawAmount, flt = []) => {
  const formatted = fmtName(rawName, flt);
  const totalGrams = convertMeasureToGrams(rawAmount, formatted);
  if (totalGrams <= 0) return [];

  const parts = String(formatted)
    .split(/\s*(?:\+|\/|,|\s+e\s+)\s*/i)
    .map((p) => normalizeIngredientName(p))
    .filter(Boolean);

  if (parts.length <= 1) {
    const single = normalizeIngredientName(formatted);
    return single ? [[single, totalGrams]] : [];
  }

  const baseShare = Math.floor(totalGrams / parts.length);
  const remainder = totalGrams - baseShare * parts.length;

  return parts.map((part, idx) => [part, baseShare + (idx === 0 ? remainder : 0)]);
};

export const getSupermarketAisle = (ingredientName = '') => {
  const n = String(ingredientName || '').toLowerCase();

  if ([
    'mela', 'pera', 'banana', 'kiwi', 'pesca', 'albicocca', 'fragol', 'mirtill', 'frutti di bosco',
    'melone', 'arancia', 'limone', 'lime', 'avocado', 'pomodor', 'zucchin', 'carot', 'rucola',
    'cetriol', 'spinac', 'broccol', 'cavol', 'cavolfior', 'finocch', 'peperon', 'sedan', 'porr',
    'verza', 'lattuga', 'radicchi', 'melanzan', 'fagiolin', 'valerian', 'ravanell', 'carciof',
    'cipoll', 'aglio', 'zenzero', 'basilico', 'menta', 'prezzemolo', 'aneto', 'rosmarino', 'salvia',
    'patat', 'insalat', 'zucca',
  ].some((k) => n.includes(k))) {
    return 'produce';
  }

  if ([
    'avena', 'riso', 'pasta', 'pane', 'farro', 'quinoa', 'cous cous', 'grano saraceno', 'mais',
    'polenta', 'gallette', 'crackers', 'fette biscottate', 'muesli', 'farina', 'lenticch', 'ceci',
    'fagiol', 'lupini', 'pisell', 'edamame', 'mandorl', 'noci', 'noce', 'nocciole', 'pistacch',
    'anacard', 'pinoli', 'semi di zucca', 'chia', 'burro d’arachidi', 'burro di mandorle',
    'crema di mandorle', 'cocco', 'cacao', 'fondente', 'cannella', 'origano', 'curry', 'curcuma',
    'lievito', 'vaniglia', 'passata', 'tahina',
  ].some((k) => n.includes(k))) {
    return 'pantry';
  }

  if ([
    'yogurt', 'latte', 'ricotta', 'fiocchi di latte', 'feta', 'tofu', 'tempeh',
  ].some((k) => n.includes(k))) {
    return 'dairy';
  }

  if ([
    'pollo', 'tacchino', 'manzo', 'bresaola', 'salmone', 'tonno', 'merluzzo', 'orata',
    'gamber', 'sgombro', 'seppie', 'uov', 'album', 'hamburger', 'macinato', 'straccetti',
  ].some((k) => n.includes(k))) {
    return 'protein';
  }

  return 'other';
};

export const isRecipeCompatible = (recipe, flt = [], bad = '') => {
  if (!recipe) return false;
  const allowSoy = flt.includes('veg') || flt.includes('vegan');
  if (recipe.soy && !allowSoy) return false;

  for (let k of flt) {
    if (!Array.isArray(recipe.t) || !recipe.t.includes(k)) return false;
  }

  const excludedTerms = expandFoodTerms(bad);

  if (excludedTerms.length > 0) {
    const txt = normalizeSearchText([
      recipe.n,
      recipe.st,
      recipe.c?.at(0),
      recipe.p?.at(0),
      recipe.f?.at(0),
      recipe.v?.at(0),
      ...(recipe.tags || []),
    ].join(' '));

    for (let w of excludedTerms) {
      if (w.length >= 2 && txt.includes(w)) return false;
    }
  }

  return true;
};

export const cleanWeekPlanByFilters = (weekPlan, flt = [], bad = '') => {
  const next = {};
  DAYS.forEach((d) => {
    const dayObj = weekPlan?.[d] || {};
    const cleanDay = {};
    MEALS.forEach((m) => {
      const r = dayObj[m];
      cleanDay[m] = r && isRecipeCompatible(r, flt, bad) ? r : null;
    });
    next[d] = cleanDay;
  });
  return next;
};

export const computeDailyTargets = (paziente, { dayType, dayName, slots = [], athleteDayIndex = null, fitnessWorkoutId = null }) => {
  const normPaz = normalizePaziente(paziente);
  const peso = toNum(normPaz.peso_visita) || 70;
  const piano = normPaz.piano_dati || {};
  const metodo = normPaz.metodo;
  const activeSlots = (slots || []).filter((x) => x !== 'none');

  let totP = 0;
  let totF = 0;
  let totC = 0;
  let kjOggi = 0;
  let kcalGiorno = 0;
  let hasWorkout = false;
  let intraP = 0;
  let intraF = 0;
  let intraC = 0;
  let intraNome = '';
  let postP = 0;
  let postF = 0;
  let postC = 0;
  let postNome = '';
  let waterLiters = '2.2';
  let curAthleteDay = null;

  // ─── 1. PROFILO BENESSERE ──────────────────────────────────────────────
  if (metodo === 'BENESSERE') {
    const target = piano.target_benessere || { p: 130, f: 55, c: 180 };
    totP = toNum(target.p);
    totF = toNum(target.f);
    totC = toNum(target.c);
    kcalGiorno = (totP * 4) + (totF * 9) + (totC * 4);
    hasWorkout = false;

    const passi = normPaz.passi_target || 8000;
    const waterBase = peso * 32;
    const waterExtra = passi >= 10000 ? 300 : 0;
    waterLiters = ((waterBase + waterExtra) / 1000).toFixed(1);

    const weights = {
      Colazione: { p: 0.22, f: 0.20, c: 0.25 },
      Pranzo: { p: 0.33, f: 0.35, c: 0.35 },
      Merenda: { p: 0.15, f: 0.15, c: 0.15 },
      Cena: { p: 0.30, f: 0.30, c: 0.25 },
    };

    const mealTargets = {};
    MEALS.forEach((m) => {
      mealTargets[m] = {
        p: Math.round(totP * weights[m].p),
        f: Math.round(totF * weights[m].f),
        c: Math.round(totC * weights[m].c),
        isPeriWorkout: false,
      };
    });

    return {
      mealTargets,
      remP: totP,
      remF: totF,
      remC: totC,
      waterLiters,
      hasWorkout: false,
      kjOggi: 0,
      totP,
      totF,
      totC,
      kcalGiorno,
      passi,
      gPerKg: {
        p: calcGPerKg(totP, peso),
        f: calcGPerKg(totF, peso),
        c: calcGPerKg(totC, peso),
      },
      metodo: 'BENESSERE',
    };
  }

  // ─── 2. PROFILO FITNESS / AMATORIALE ──────────────────────────────────
  if (metodo === 'FITNESS') {
    const riposo = piano.riposo_fitness || piano.off || { p: 140, f: 60, c: 160 };
    const workouts = piano.workouts_fitness || [];
    const isWorkoutDay = dayType === 'ON' || Boolean(fitnessWorkoutId);

    if (isWorkoutDay) {
      hasWorkout = true;
      const matched = workouts.find((w) => w.id === fitnessWorkoutId) || workouts[0] || { delta_kcal: 300 };
      const deltaKcal = toNum(matched.delta_kcal) || 300;
      const extraC = Math.round(deltaKcal / 4);
      totP = toNum(riposo.p);
      totF = toNum(riposo.f);
      totC = toNum(riposo.c) + extraC;
    } else {
      hasWorkout = false;
      totP = toNum(riposo.p);
      totF = toNum(riposo.f);
      totC = toNum(riposo.c);
    }
    kcalGiorno = (totP * 4) + (totF * 9) + (totC * 4);

    const waterBase = peso * 33;
    const waterExtra = hasWorkout ? 500 : 0;
    waterLiters = ((waterBase + waterExtra) / 1000).toFixed(1);

    const protectedMeals = new Set();
    if (hasWorkout) {
      activeSlots.forEach((sl) => {
        if (sl === 'fasted') protectedMeals.add('Colazione');
        if (sl === 'morning') { protectedMeals.add('Colazione'); protectedMeals.add('Pranzo'); }
        if (sl === 'lunch') { protectedMeals.add('Colazione'); protectedMeals.add('Pranzo'); }
        if (sl === 'afternoon') { protectedMeals.add('Pranzo'); protectedMeals.add('Merenda'); protectedMeals.add('Cena'); }
        if (sl === 'evening') { protectedMeals.add('Merenda'); protectedMeals.add('Cena'); }
      });
      if (protectedMeals.size === 0) protectedMeals.add('Merenda');
    }

    const weightsP = { Colazione: 0.22, Pranzo: 0.33, Merenda: 0.15, Cena: 0.30 };
    const weightsF = { Colazione: 0.20, Pranzo: 0.35, Merenda: 0.15, Cena: 0.30 };
    const protArray = Array.from(protectedMeals);
    const targetPeriCarbo = Math.round(peso * 1.5);
    const maxProtEach = protArray.length > 0 ? Math.min(targetPeriCarbo, Math.floor(totC / protArray.length)) : 0;
    const usedProtectedC = maxProtEach * protArray.length;
    const nonProtMeals = MEALS.filter((m) => !protectedMeals.has(m));
    const cPerOther = nonProtMeals.length > 0 ? Math.max(0, Math.round((totC - usedProtectedC) / nonProtMeals.length)) : 0;

    const mealTargets = {};
    MEALS.forEach((m) => {
      const isProt = protectedMeals.has(m);
      mealTargets[m] = {
        p: Math.round(totP * weightsP[m]),
        f: Math.round(totF * weightsF[m]),
        c: isProt ? maxProtEach : cPerOther,
        isPeriWorkout: isProt,
      };
    });

    return {
      mealTargets,
      remP: totP,
      remF: totF,
      remC: totC,
      waterLiters,
      hasWorkout,
      kjOggi: 0,
      totP,
      totF,
      totC,
      kcalGiorno,
      gPerKg: {
        p: calcGPerKg(totP, peso),
        f: calcGPerKg(totF, peso),
        c: calcGPerKg(totC, peso),
      },
      metodo: 'FITNESS',
    };
  }

  // ─── 3. PROFILO ATLETA / PERFORMANCE ──────────────────────────────────
  if (metodo === 'ATLETA') {
    const giorni = piano.giorni_atleta || [];
    if (athleteDayIndex !== null && giorni[athleteDayIndex]) {
      curAthleteDay = giorni[athleteDayIndex];
    } else if (dayName) {
      curAthleteDay = giorni.find((g) => g.nome === dayName || g.data === dayName || g.id === dayName) || giorni[0];
    } else {
      const todayDMY = formatDateDMY(new Date());
      const todayIso = formatIsoDate();
      curAthleteDay = giorni.find((g) => g.data === todayDMY || g.data === todayIso) || giorni[0] || {};
    }

    const bmr = toNum(piano.bmr_base) || 1500;
    const coeff = toNum(piano.coeff_laf) || 1.2;
    kjOggi = toNum(curAthleteDay?.kj) || 0;
    kcalGiorno = Math.round((bmr * coeff) + kjOggi);

    if (curAthleteDay?.target_macro?.p && curAthleteDay?.target_macro?.c) {
      totP = toNum(curAthleteDay.target_macro.p);
      totF = toNum(curAthleteDay.target_macro.f);
      totC = toNum(curAthleteDay.target_macro.c);
    } else {
      totP = Math.round(peso * 1.8);
      totF = Math.round(peso * 0.9);
      const kcalFromPF = (totP * 4) + (totF * 9);
      totC = Math.max(100, Math.round((kcalGiorno - kcalFromPF) / 4));
    }

    hasWorkout = kjOggi > 0;
    if (hasWorkout) {
      const ore = toNum(curAthleteDay?.intra?.ore) || 0;
      const ghCarbo = toNum(curAthleteDay?.intra?.gh_carbo) || 0;
      intraC = Math.round(ore * ghCarbo);
      intraP = toNum(curAthleteDay?.intra?.p) || 0;
      intraF = toNum(curAthleteDay?.intra?.f) || 0;
      intraNome = curAthleteDay?.intra?.nome || 'Maltodestrine / Gel (in borraccia)';

      postP = toNum(curAthleteDay?.recovery?.p) || 0;
      postC = toNum(curAthleteDay?.recovery?.c) || 0;
      postF = toNum(curAthleteDay?.recovery?.f) || 0;
      postNome = curAthleteDay?.recovery?.nome || 'Recovery Shake';
    }

    const remP = Math.max(0, totP - postP);
    const remF = Math.max(0, totF - postF);
    const remC = Math.max(0, totC - intraC - postC);

    const protectedMeals = new Set();
    if (hasWorkout) {
      activeSlots.forEach((sl) => {
        if (sl === 'fasted') protectedMeals.add('Colazione');
        if (sl === 'morning') { protectedMeals.add('Colazione'); protectedMeals.add('Pranzo'); }
        if (sl === 'lunch') { protectedMeals.add('Colazione'); protectedMeals.add('Pranzo'); }
        if (sl === 'afternoon') { protectedMeals.add('Pranzo'); protectedMeals.add('Merenda'); protectedMeals.add('Cena'); }
        if (sl === 'evening') { protectedMeals.add('Merenda'); protectedMeals.add('Cena'); }
      });
      if (protectedMeals.size === 0) {
        protectedMeals.add('Pranzo');
        protectedMeals.add('Cena');
      }
    }

    const targetPeriCarbo = Math.round(peso * 2.0); // 2.0 g/kg nei pasti pre e post solidi
    const protArray = Array.from(protectedMeals);
    const maxProtEach = protArray.length > 0 ? Math.min(targetPeriCarbo, Math.floor(remC / protArray.length)) : 0;
    const usedProtectedC = maxProtEach * protArray.length;
    const nonProtMeals = MEALS.filter((m) => !protectedMeals.has(m));
    const cPerOther = nonProtMeals.length > 0 ? Math.max(0, Math.round((remC - usedProtectedC) / nonProtMeals.length)) : 0;

    const weightsP = { Colazione: 0.22, Pranzo: 0.33, Merenda: 0.15, Cena: 0.30 };
    const weightsF = { Colazione: 0.20, Pranzo: 0.35, Merenda: 0.15, Cena: 0.30 };
    const mealTargets = {};
    MEALS.forEach((m) => {
      const isProt = protectedMeals.has(m);
      mealTargets[m] = {
        p: Math.round(remP * weightsP[m]),
        f: Math.round(remF * weightsF[m]),
        c: isProt ? maxProtEach : cPerOther,
        isPeriWorkout: isProt,
      };
    });

    const waterBase = peso * 35;
    const waterExtra = Math.round(kjOggi * 0.6);
    waterLiters = ((waterBase + waterExtra) / 1000).toFixed(1);

    return {
      mealTargets,
      remP,
      remF,
      remC,
      waterLiters,
      hasWorkout,
      kjOggi,
      totP,
      totF,
      totC,
      kcalGiorno,
      intraP,
      intraC,
      intraF,
      intraNome,
      postP,
      postC,
      postF,
      postNome,
      curAthleteDay,
      gPerKg: {
        p: calcGPerKg(totP, peso),
        f: calcGPerKg(totF, peso),
        c: calcGPerKg(totC, peso),
      },
      metodo: 'ATLETA',
    };
  }

  // ─── 4. FALLBACK LEGACY (ON_OFF / KJ) ──────────────────────────────────
  if (normPaz._rawMetodo === 'KJ') {
    const base = piano.base || { p: 140, f: 60, c: 200 };
    kjOggi = toNum(piano.kj?.[dayName]);
    const extraCarbo = Math.round((kjOggi * 1.1) / 4);
    totP = toNum(base.p);
    totF = toNum(base.f);
    totC = toNum(base.c) + extraCarbo;
  } else {
    const src = dayType === 'ON' ? (piano.on || { p: 150, f: 60, c: 280 }) : (piano.off || { p: 150, f: 65, c: 160 });
    totP = toNum(src.p);
    totF = toNum(src.f);
    totC = toNum(src.c);
  }

  hasWorkout = normPaz._rawMetodo === 'KJ' ? kjOggi > 0 : (dayType === 'ON' && activeSlots.length > 0);
  const remP = totP;
  const remF = totF;
  const remC = totC;
  const weightsP = { Colazione: 0.22, Pranzo: 0.33, Merenda: 0.15, Cena: 0.30 };
  const weightsF = { Colazione: 0.20, Pranzo: 0.35, Merenda: 0.15, Cena: 0.30 };
  const mealTargets = {};
  MEALS.forEach((m) => {
    mealTargets[m] = {
      p: Math.round(remP * weightsP[m]),
      f: Math.round(remF * weightsF[m]),
      c: Math.round(remC * 0.25),
      isPeriWorkout: false,
    };
  });
  const waterBase = peso * 33;
  const waterExtra = hasWorkout ? 600 : 0;
  waterLiters = ((waterBase + waterExtra) / 1000).toFixed(1);

  return { mealTargets, remP, remF, remC, waterLiters, hasWorkout, kjOggi, totP, totF, totC, gPerKg: { p: calcGPerKg(totP, peso), f: calcGPerKg(totF, peso), c: calcGPerKg(totC, peso) }, metodo: 'FITNESS' };
};

export const calcOne = (r, tC, tP, tF) => {
  const vArr = Array.isArray(r.v) ? r.v : [r.v, 0, 0, 0, 0];
  const cArr = Array.isArray(r.c) ? r.c : [r.c, 0, 0, 0];
  const pArr = Array.isArray(r.p) ? r.p : [r.p, 0, 0, 0];
  const fArr = Array.isArray(r.f) ? r.f : [r.f, 0, 0, 0];

  const nomeC = String(cArr.at(0) || '');
  const nomeP = String(pArr.at(0) || '');
  const nomeF = String(fArr.at(0) || '');
  const nomeV = String(vArr.at(0) || '');

  const vG = Number(vArr.at(1)) || 0;
  const vC = Number(vArr.at(2)) || 0;
  const vP = Number(vArr.at(3)) || 0;
  const vF = Number(vArr.at(4)) || 0;

  const cC = Number(cArr.at(1)) || 0;
  const cP = Number(cArr.at(2)) || 0;
  const cF = Number(cArr.at(3)) || 0;

  const pC = Number(pArr.at(1)) || 0;
  const pP = Number(pArr.at(2)) || 0;
  const pF = Number(pArr.at(3)) || 0;

  const fC = Number(fArr.at(1)) || 0;
  const fP = Number(fArr.at(2)) || 0;
  const fF = Number(fArr.at(3)) || 0;

  const isOlio = nomeF.toLowerCase().includes('olio');
  const isPatata = nomeC.toLowerCase().includes('patat');
  const isFruttaC = ['mela', 'pera', 'pesca', 'banana', 'frutti'].some((k) => nomeC.toLowerCase().includes(k));
  const isLatteP = nomeP.toLowerCase().includes('latte');

  // Max bounds to prevent unrealistic single-meal portions (e.g. 500g potatoes)
  const maxC = isPatata ? 280 : (isFruttaC ? 180 : (cC < 40 ? 250 : 180));
  const rawGC = cC >= 5 ? Math.max(0, Math.min(maxC, ((tC - vC) / cC) * 100)) : 0;
  const gC = round5(rawGC);
  const gCCotto = estimateCookedGrams(gC, nomeC, 'c');

  const protFromC = (gC / 100) * cP;
  const fatFromC = (gC / 100) * cF;

  // For liquid milk clamp to 250ml (~1 cup); otherwise pP < 15 is 250g, pP >= 15 is 220g
  const maxP = isLatteP ? 250 : (pP < 15 ? 250 : 220);
  // Lower threshold from pP >= 4 to pP >= 2.5 so milk (pP: 3.4) calculates properly!
  const rawGP = pP >= 2.5 ? Math.max(0, Math.min(maxP, ((tP - vP - protFromC) / pP) * 100)) : 0;
  const gP = Math.min(maxP, round5(rawGP));
  const gPCotto = estimateCookedGrams(gP, nomeP, 'p');

  const carbFromP = (gP / 100) * pC;
  const fatFromP = (gP / 100) * pF;

  const maxF = isOlio ? 20 : (fF < 25 ? 60 : 35);
  // Min fat: recipes specifying oil get min 5g; nuts/seeds/dark chocolate get min 10g so they never display 0g!
  const minF = (fF >= 8) ? (isOlio ? 5 : (fF >= 40 ? 10 : 15)) : 0;
  const idealGF = fF >= 8 ? ((tF - vF - fatFromC - fatFromP) / fF) * 100 : 0;
  const rawGF = fF >= 8 ? Math.max(minF, Math.min(maxF, idealGF)) : 0;
  const gF = Math.min(maxF, round5(rawGF));
  const carbFromF = (gF / 100) * fC;
  const protFromF = (gF / 100) * fP;

  const totC = Math.round(vC + (gC / 100) * cC + carbFromP + carbFromF);
  const totP = Math.round(vP + protFromC + (gP / 100) * pP + protFromF);
  const totF = Math.round(vF + fatFromC + fatFromP + (gF / 100) * fF);

  return {
    ...r,
    nomeC,
    nomeP,
    nomeF,
    nomeV,
    gC,
    gCCotto,
    gP,
    gPCotto,
    gF,
    gV: round5(vG),
    totC,
    totP,
    totF,
    kcal: Math.round(totC * 4 + totP * 4 + totF * 9),
    diff: Math.abs(totC - tC) + Math.abs(totP - tP) + Math.abs(totF - tF),
  };
};

export const filterRecipes = (recipes, { meal, prepMode, mealKinds, flt, season = 'all', bad, pantry, targetObj, excludeIds = [] }) => {
  const tP = parseFloat(targetObj.p) || 0;
  const tF = parseFloat(targetObj.f) || 0;
  const tC = parseFloat(targetObj.c) || 0;
  if (!tC && !tP && !tF) return [];

  const expandedPantry = expandFoodTerms(pantry[meal] || '');
  const kind = mealKinds[meal] || 'all';
  const isMorningGroup = meal === 'Colazione' || meal === 'Merenda';

  const basePool = recipes.filter((r) => {
    const rIsMorning = r.m === 'Colazione' || r.m === 'Merenda';
    if (isMorningGroup !== rIsMorning) return false;
    if (isMorningGroup && kind !== 'all' && r.kind !== kind) return false;
    if (targetObj.isPeriWorkout && ['ceci', 'lenticchie', 'fagioli', 'lupini'].some((leg) => r.n.toLowerCase().includes(leg))) return false;
    return isRecipeCompatible(r, flt, bad);
  });

  const matchPrep = (r) => {
    if (prepMode === 'all') return true;
    if (prepMode === 'ready') return r.prep && r.prep.includes('fast');
    return r.prep && r.prep.includes(prepMode);
  };

  const freshPool = basePool.filter((r) => !excludeIds.includes(r.id));
  const poolToUse = freshPool.length >= 3 ? freshPool : basePool;

  return poolToUse
    .map((r) => {
      const txt = normalizeSearchText([
        r.n,
        r.st,
        r.c?.at(0),
        r.p?.at(0),
        r.f?.at(0),
        r.v?.at(0),
        ...(r.tags || []),
      ].join(' '));
      const seasonPriority = season !== 'all' && r.sea.includes(season) ? 1 : 0;
      const prepPriority = matchPrep(r) ? 1 : 0;
      const hits = expandedPantry.filter((w) => w.length >= 2 && txt.includes(w)).length;
      return {
        ...calcOne(r, tC, tP, tF),
        hits,
        seasonPriority,
        prepPriority,
        rnd: Math.random(),
      };
    })
    .sort((a, b) => (b.hits - a.hits) || (b.seasonPriority - a.seasonPriority) || (b.prepPriority - a.prepPriority) || (b.rnd - a.rnd))
    .slice(0, 3);
};

export const generateAllMeals = (recipes, params) => {
  const { daily } = params;
  const out = {};
  let usedP = 0;
  let usedF = 0;

  MEALS.forEach((m, idx) => {
    const remainingMeals = MEALS.slice(idx);
    const baseT = daily.mealTargets[m];
    const remP = Math.max(0, daily.remP - usedP);
    const remF = Math.max(0, daily.remF - usedF);

    const adjTarget = {
      ...baseT,
      p: idx === 0 ? baseT.p : Math.round(remP / remainingMeals.length),
      f: idx === 0 ? baseT.f : Math.round(remF / remainingMeals.length),
    };

    const usedIds = Object.values(out).flat().map((x) => x.id);
    const list = filterRecipes(recipes, { ...params, meal: m, targetObj: adjTarget, excludeIds: usedIds });
    out[m] = list;

    if (list.length > 0) {
      usedP += list.at(0).totP;
      usedF += list.at(0).totF;
    }
  });

  return out;
};

export const shuffleAndRebalance = (recipes, currentResults, targetMeal, params) => {
  const { daily } = params;
  const prevIds = (currentResults[targetMeal] || []).map((x) => x.id);
  const newList = filterRecipes(recipes, {
    ...params,
    meal: targetMeal,
    targetObj: daily.mealTargets[targetMeal],
    excludeIds: prevIds,
  });
  const updated = { ...currentResults, [targetMeal]: newList };

  if (newList.length === 0) return updated;

  const chosen = newList.at(0);
  const otherMeals = MEALS.filter((m) => m !== targetMeal);
  const remP = Math.max(0, daily.remP - chosen.totP);
  const remF = Math.max(0, daily.remF - chosen.totF);

  otherMeals.forEach((m) => {
    const baseT = daily.mealTargets[m];
    const adjTarget = {
      ...baseT,
      p: Math.round(remP / otherMeals.length),
      f: Math.round(remF / otherMeals.length),
    };
    const existing = updated[m] || [];
    if (existing.length > 0) {
      updated[m] = existing.map((r) => ({
        ...calcOne(r, adjTarget.c, adjTarget.p, adjTarget.f),
        hits: r.hits,
        seasonPriority: r.seasonPriority,
        prepPriority: r.prepPriority,
      }));
    } else {
      updated[m] = filterRecipes(recipes, { ...params, meal: m, targetObj: adjTarget });
    }
  });

  return updated;
};

export const copyDayPlan = (weekPlan, sourceDay, targetDays) => {
  const srcMeals = weekPlan[sourceDay] || {};
  const next = { ...weekPlan };
  targetDays.forEach((d) => {
    if (d === sourceDay) return;
    next[d] = {
      Colazione: srcMeals.Colazione ? { ...srcMeals.Colazione } : null,
      Pranzo: srcMeals.Pranzo ? { ...srcMeals.Pranzo } : null,
      Merenda: srcMeals.Merenda ? { ...srcMeals.Merenda } : null,
      Cena: srcMeals.Cena ? { ...srcMeals.Cena } : null,
    };
  });
  return next;
};

export const fillDayMeals = (weekPlan, targetDay, recipes, params, overwriteExisting = false) => {
  const { daily } = params;
  const currentDay = weekPlan[targetDay] || {};
  const updatedDay = { ...currentDay };

  MEALS.forEach((m) => {
    if (!overwriteExisting && updatedDay[m]) return;
    const list = filterRecipes(recipes, {
      ...params,
      meal: m,
      targetObj: daily.mealTargets[m],
    });
    if (list.length > 0) {
      updatedDay[m] = list[0];
    }
  });

  return {
    ...weekPlan,
    [targetDay]: updatedDay,
  };
};

export const getWeekShop = (weekPlan, flt) => {
  const tot = {};
  DAYS.forEach((d) => {
    MEALS.forEach((m) => {
      const r = weekPlan[d]?.[m];
      if (!r) return;
      const entries = [
        [r.nomeC || r.c?.at(0), r.gC],
        [r.nomeP || r.p?.at(0), r.gP],
        [r.nomeF || r.f?.at(0), r.gF],
        [r.nomeV || r.v?.at(0), r.gV || 0],
      ];
      entries.forEach(([rawName, rawAmount]) => {
        const splitItems = splitCombinedIngredient(rawName, rawAmount, flt);
        splitItems.forEach(([k, grams]) => {
          if (grams > 0 && k) tot[k] = (tot[k] || 0) + grams;
        });
      });
    });
  });
  return Object.entries(tot);
};

export const getWeekShopByAisle = (weekPlan, flt) => {
  const rawItems = getWeekShop(weekPlan, flt);
  const grouped = {
    produce: [],
    pantry: [],
    dairy: [],
    protein: [],
    other: [],
  };

  rawItems.forEach(([name, grams]) => {
    const cleanName = formatCaseName(name);
    const aisle = getSupermarketAisle(cleanName);
    grouped[aisle].push([cleanName, grams]);
  });

  return SUPERMARKET_AISLES
    .map((a) => ({
      aisle: a.id,
      items: grouped[a.id].sort((x, y) => x[0].localeCompare(y[0])),
    }))
    .filter((group) => group.items.length > 0);
};

export const loadLocal = () => AsyncStorage.getItem(STORAGE_KEY).then((raw) => (raw ? JSON.parse(raw) : null)).catch(() => null);
export const saveLocal = (data) => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});

// ─── MOTORE COMPONI PIATTO SEMPLICE (GRAMMATURE CRUDO & COTTO) ───────────────
const BKF_CARB_IDS = new Set([
  'avena_fiocchi', 'farina_avena', 'crusca_avena', 'fette_biscottate', 'fette_biscottate_int',
  'pane_bauletto_integrale', 'pane_integrale', 'pane_segale', 'gallette_riso', 'gallette_mais', 'gallette_farro',
  'muesli_frutta', 'granola_avena', 'corn_flakes', 'crackers_integrali',
]);

const BKF_PROT_IDS = new Set([
  'yogurt_greco_0', 'yogurt_greco_2', 'skyr_bianco', 'yogurt_bianco_magro', 'yogurt_bianco_intero',
  'albume', 'uova_intere', 'ricotta_vaccina', 'ricotta_capra', 'fiocchi_latte',
  'whey_isolate', 'whey_concentrate', 'caseine', 'proteine_vegetali_polvere',
  'latte_ps', 'latte_scremato', 'latte_intero', 'latte_zymil', 'latte_soia', 'latte_avena', 'latte_mandorla',
  'fesa_tacchino', 'fesa_pollo_affettato', 'bresaola', 'prosciutto_cotto',
]);

const BKF_FAT_IDS = new Set([
  'burro_arachidi', 'burro_mandorle', 'burro_nocciole', 'mandorle', 'noci', 'nocciole',
  'semi_chia', 'semi_lino', 'cioccolato_85', 'cioccolato_90', 'cocco_rape',
  'avocado', 'olio_evo', 'burro_ghee',
]);

const SNACK_CARB_IDS = new Set([
  'gallette_riso', 'gallette_mais', 'gallette_farro', 'fette_biscottate', 'fette_biscottate_int',
  'pane_bauletto_integrale', 'pane_segale', 'pane_integrale', 'crackers_integrali',
  'avena_fiocchi', 'farina_avena', 'muesli_frutta', 'granola_avena', 'piadina_evo', 'castagne_bollite',
]);

const SNACK_PROT_IDS = new Set([
  'yogurt_greco_0', 'yogurt_greco_2', 'skyr_bianco', 'yogurt_bianco_magro',
  'fiocchi_latte', 'ricotta_vaccina', 'ricotta_capra', 'mozzarella_light', 'spalmabile_light', 'caciotta_magra',
  'albume', 'uova_intere', 'whey_isolate', 'whey_concentrate', 'proteine_vegetali_polvere',
  'latte_ps', 'latte_scremato', 'latte_zymil', 'latte_soia', 'latte_avena',
  'fesa_tacchino', 'fesa_pollo_affettato', 'bresaola', 'prosciutto_cotto',
  'tonno_naturale', 'sgombro_naturale', 'lupini', 'edamame',
]);

const SNACK_FAT_IDS = new Set([
  'mandorle', 'noci', 'nocciole', 'anacardi', 'pistacchi', 'arachidi', 'noci_pecan',
  'burro_arachidi', 'burro_mandorle', 'burro_nocciole', 'cioccolato_85', 'cioccolato_90',
  'semi_zucca', 'semi_chia', 'semi_girasole', 'cocco_rape', 'avocado', 'olio_evo', 'olive_nere', 'olive_verdi',
]);

const MAIN_EXCLUDE_CARBS = new Set([
  'muesli_frutta', 'granola_avena', 'corn_flakes', 'fette_biscottate', 'fette_biscottate_int', 'crusca_avena',
]);

const MAIN_EXCLUDE_PROTS = new Set([
  'whey_isolate', 'whey_concentrate', 'caseine', 'proteine_vegetali_polvere',
  'latte_intero', 'latte_ps', 'latte_scremato', 'latte_zymil', 'latte_soia', 'latte_avena', 'latte_mandorla',
]);

export function buildComponiPiattoMeals(daily, flt = [], bad = []) {
  const res = {};
  const meals = MEALS || ['Colazione', 'Pranzo', 'Merenda', 'Cena'];

  meals.forEach((m) => {
    const t = daily?.mealTargets?.[m] || { p: 25, c: 50, f: 12, isPeriWorkout: false };
    const isAthletePeri = Boolean(t.isPeriWorkout);

    function processCat(cat) {
      let items = (ALIMENTI_DB || []).filter((x) => x.cat === cat);

      // Filtro rigoroso per coerenza con il pasto specifico
      if (m === 'Colazione') {
        if (cat === 'C') items = items.filter((x) => BKF_CARB_IDS.has(x.id));
        else if (cat === 'P') items = items.filter((x) => BKF_PROT_IDS.has(x.id));
        else if (cat === 'F') items = items.filter((x) => BKF_FAT_IDS.has(x.id));
      } else if (m === 'Merenda') {
        if (cat === 'C') items = items.filter((x) => SNACK_CARB_IDS.has(x.id));
        else if (cat === 'P') items = items.filter((x) => SNACK_PROT_IDS.has(x.id));
        else if (cat === 'F') items = items.filter((x) => SNACK_FAT_IDS.has(x.id));
      } else {
        // Pranzo e Cena: piatti principali (escludi cereali da colazione e proteine liquide da shaker)
        if (cat === 'C') items = items.filter((x) => !MAIN_EXCLUDE_CARBS.has(x.id));
        else if (cat === 'P') items = items.filter((x) => !MAIN_EXCLUDE_PROTS.has(x.id));
      }

      if (flt.includes('gf')) items = items.filter((x) => !x.tags.includes('glutine'));
      if (flt.includes('lf')) items = items.filter((x) => !x.tags.includes('dairy') && !x.tags.includes('latticini'));
      if (flt.includes('veg')) items = items.filter((x) => !x.tags.includes('carne') && !x.tags.includes('pesce'));
      if (bad.length > 0) items = items.filter((x) => !bad.includes(x.id) && !bad.includes(x.nome));

      const isCookableFood = (it) => {
        if (!it) return false;
        if (it.cat === 'F' || it.cat === 'FR') return false;
        const id = String(it.id || '').toLowerCase();
        if (['pane', 'fette_biscottate', 'gallette', 'crackers', 'muesli', 'granola', 'corn_flakes', 'crusca', 'castagne'].some((k) => id.includes(k))) return false;
        if (['yogurt', 'skyr', 'fiocchi_latte', 'ricotta', 'mozzarella', 'parmigiano', 'spalmabile', 'primo_sale', 'caciotta', 'latte', 'whey', 'caseine', 'proteine_vegetali'].some((k) => id.includes(k))) return false;
        if (['bresaola', 'prosciutto', 'fesa_tacchino', 'fesa_pollo_affettato', 'salmone_affumicato', 'tonno_naturale', 'tonno_olio', 'sgombro_naturale', 'lupini', 'edamame'].some((k) => id.includes(k))) return false;
        if (id.includes('_scatola') || id.includes('piselli_lessati')) return false;
        return Boolean(it.cookedRatio && it.cookedRatio !== 1.0);
      };

      const computed = items.map((it) => {
        const cookable = isCookableFood(it);
        let gCrudo = 0;
        if (cat === 'C') {
          const per100 = it.c > 0 ? it.c : 70;
          gCrudo = Math.max(15, round5(t.c / (per100 / 100)));
        } else if (cat === 'P') {
          const per100 = it.p > 0 ? it.p : 20;
          gCrudo = Math.max(20, round5(t.p / (per100 / 100)));
        } else if (cat === 'F') {
          const per100 = it.f > 0 ? it.f : 80;
          gCrudo = Math.max(5, round5(t.f / (per100 / 100)));
        } else if (cat === 'V') {
          gCrudo = 200;
        } else if (cat === 'FR') {
          gCrudo = 150;
        }

        const gCotto = cookable ? round5(gCrudo * (it.cookedRatio || 1.0)) : gCrudo;
        return {
          id: it.id,
          nome: it.nome,
          cat: it.cat,
          isPrimary: Boolean(it.isPrimary),
          isCookable: cookable,
          gCrudo,
          gCotto,
          cookedRatio: it.cookedRatio || 1.0,
          cookedLabel: it.cookedLabel || 'cotto',
          servingUnit: it.servingUnit || '',
          kcal: Math.round(((it.kcal || 100) * gCrudo) / 100),
          p: Math.round(((it.p || 0) * gCrudo) / 100),
          c: Math.round(((it.c || 0) * gCrudo) / 100),
          f: Math.round(((it.f || 0) * gCrudo) / 100),
        };
      });

      // Ordinamento opzioni primarie per il pasto
      let sorted = [...computed];
      if (m === 'Colazione') {
        const topBkfC = ['avena_fiocchi', 'fette_biscottate', 'pane_integrale', 'gallette_riso'];
        const topBkfP = ['yogurt_greco_0', 'albume', 'uova_intere', 'fesa_tacchino'];
        const topBkfF = ['burro_arachidi', 'burro_mandorle', 'mandorle', 'cioccolato_85'];
        sorted.sort((a, b) => {
          const aTop = (topBkfC.includes(a.id) || topBkfP.includes(a.id) || topBkfF.includes(a.id)) ? 1 : 0;
          const bTop = (topBkfC.includes(b.id) || topBkfP.includes(b.id) || topBkfF.includes(b.id)) ? 1 : 0;
          return bTop - aTop;
        });
      } else if (m === 'Merenda') {
        const topSnkC = ['gallette_riso', 'pane_bauletto_integrale', 'crackers_integrali', 'fette_biscottate_int'];
        const topSnkP = ['yogurt_greco_0', 'fiocchi_latte', 'bresaola', 'whey_isolate'];
        const topSnkF = ['mandorle', 'noci', 'burro_arachidi', 'cioccolato_85'];
        sorted.sort((a, b) => {
          const aTop = (topSnkC.includes(a.id) || topSnkP.includes(a.id) || topSnkF.includes(a.id)) ? 1 : 0;
          const bTop = (topSnkC.includes(b.id) || topSnkP.includes(b.id) || topSnkF.includes(b.id)) ? 1 : 0;
          return bTop - aTop;
        });
      } else {
        const topMainC = ['pasta_semola', 'riso_basmati', 'patate', 'pane_integrale'];
        const topMainP = ['petto_pollo', 'merluzzo', 'tagliata_manzo', 'salmone_fresco'];
        const topMainF = ['olio_evo', 'avocado', 'olive_verdi', 'olio_lino'];
        sorted.sort((a, b) => {
          const aTop = (topMainC.includes(a.id) || topMainP.includes(a.id) || topMainF.includes(a.id)) ? 1 : 0;
          const bTop = (topMainC.includes(b.id) || topMainP.includes(b.id) || topMainF.includes(b.id)) ? 1 : 0;
          return bTop - aTop;
        });
      }

      const primary = sorted.slice(0, 4);
      const alternatives = sorted.slice(4);
      return { primary, alternatives };
    }

    res[m] = {
      target: t,
      isPeriWorkout: isAthletePeri,
      carbo: processCat('C'),
      protein: processCat('P'),
      fat: processCat('F'),
      veggies: (m === 'Pranzo' || m === 'Cena') ? processCat('V') : { primary: [], alternatives: [] },
      fruits: (m === 'Colazione' || m === 'Merenda') ? processCat('FR') : { primary: [], alternatives: [] },
    };
  });

  return res;
}
