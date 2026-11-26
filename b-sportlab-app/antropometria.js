// ─── MOTORE DI CALCOLO ANTROPOMETRICO A 4 COMPARTIMENTI (MODELLO MARCHESI / FITCOMPX) ───
// B-sportlab - Dott. Federico Baldassarre
// © 2025-2026 B-sportlab. Tutti i diritti riservati.

export const COLORBLIND_PALETTE = {
  muscolo: {
    bg: '#0284C7', // Ciano brillante ad alto contrasto
    light: '#E0F2FE',
    border: '#0369A1',
    text: '#FFFFFF',
    darkText: '#0369A1',
    label: 'Muscolo',
    icon: '🥩',
  },
  grasso: {
    bg: '#1E40AF', // Blu cobalto profondo (non si confonde mai con rosso/verde)
    light: '#DBEAFE',
    border: '#1D4ED8',
    text: '#FFFFFF',
    darkText: '#1E40AF',
    label: 'Grasso',
    icon: '⚪',
  },
  ossa: {
    bg: '#D97706', // Ambra dorato intenso ad alta luminosità
    light: '#FEF3C7',
    border: '#B45309',
    text: '#FFFFFF',
    darkText: '#B45309',
    label: 'Ossa',
    icon: '🟡',
  },
  altro: {
    bg: '#334155', // Grigio ardesia scuro neutro
    light: '#F1F5F9',
    border: '#475569',
    text: '#FFFFFF',
    darkText: '#334155',
    label: 'Altro / Liquidi',
    icon: '💧',
  },
};

// Benchmark di riferimento (Marchesi standard + Benchmark reali B-sportlab)
export const BENCHMARKS = {
  FITNESS: {
    id: 'FITNESS',
    nome: 'Fitness Ideale',
    desc: 'Target atletico amatoriale ottimale',
    M: { fat: 10.0, muscolo: 47.16, muscoloFFM: 53.4 },
    F: { fat: 17.0, muscolo: 38.5, muscoloFFM: 46.5 },
  },
  MEDI: {
    id: 'MEDI',
    nome: 'Popolazione Media',
    desc: 'Valori medi della popolazione sana',
    M: { fat: 18.0, muscolo: 39.04, muscoloFFM: 50.0 },
    F: { fat: 24.0, muscolo: 32.5, muscoloFFM: 43.0 },
  },
  NUOTO: {
    id: 'NUOTO',
    nome: 'Campione di Nuoto',
    desc: 'Assetto idrodinamico ed endurance',
    M: { fat: 7.5, muscolo: 52.0, muscoloFFM: 57.0 },
    F: { fat: 15.0, muscolo: 42.0, muscoloFFM: 49.5 },
  },
  BODYBUILDER: {
    id: 'BODYBUILDER',
    nome: 'Bodybuilder Gara',
    desc: 'Massima densità e cut agonistico',
    M: { fat: 5.0, muscolo: 60.0, muscoloFFM: 63.0 },
    F: { fat: 11.0, muscolo: 47.0, muscoloFFM: 53.0 },
  },
  // Benchmark proprietari B-sportlab
  BS_AMATORIALE: {
    id: 'BS_AMATORIALE',
    nome: 'Media B-sportlab Amatoriale',
    desc: 'Media reale pazienti amatoriali seguiti da Federico',
    M: { fat: 13.5, muscolo: 44.5, muscoloFFM: 51.5 },
    F: { fat: 20.5, muscolo: 36.0, muscoloFFM: 45.0 },
  },
  BS_ATLETA_INVERNO: {
    id: 'BS_ATLETA_INVERNO',
    nome: 'Media B-sportlab Atleta (Autunno/Inverno)',
    desc: 'Fase di volume, carico e costruzione invernale',
    M: { fat: 8.5, muscolo: 53.0, muscoloFFM: 58.0 },
    F: { fat: 16.0, muscolo: 42.0, muscoloFFM: 50.0 },
  },
  BS_ATLETA_ESTATE: {
    id: 'BS_ATLETA_ESTATE',
    nome: 'Media B-sportlab Atleta (Primavera/Estate)',
    desc: 'Fase di definizione e picco agonistico estivo',
    M: { fat: 6.5, muscolo: 55.5, muscoloFFM: 59.5 },
    F: { fat: 13.5, muscolo: 44.0, muscoloFFM: 51.0 },
  },
};

const safeNum = (v, def = 0) => {
  if (v === null || v === undefined) return def;
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? def : n;
};

// Generatore di codice sicuro non deducibile dal solo nome-cognome
export function generaCodiceSicuro(nome = '', cognome = '') {
  const pulisci = (s) => String(s || '').trim().toUpperCase().replace(/[^A-Z]/g, '');
  const pNome = pulisci(nome);
  const pCognome = pulisci(cognome);

  let prefisso = 'BS';
  if (pNome && pCognome) {
    prefisso = `${pNome.slice(0, 1)}${pCognome.slice(0, 1)}`;
    if (prefisso.length < 2) prefisso = pCognome.slice(0, 3) || 'BS';
  } else if (pCognome) {
    prefisso = pCognome.slice(0, 3);
  } else if (pNome) {
    prefisso = pNome.slice(0, 3);
  }

  // Caratteri sicuri escludendo 0/O e 1/I per evitare errori di digitazione
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let casuale = '';
  for (let i = 0; i < 4; i++) {
    casuale += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `${prefisso}-${casuale}`;
}

/**
 * Calcola l'intera analisi antropometrica a 4 compartimenti (modello FITcompX Marchesi)
 */
export function calcolaAntropometria(input = {}) {
  const sesso = String(input.sesso || 'M').toUpperCase() === 'F' ? 'F' : 'M';
  const isM = sesso === 'M';

  const peso = Math.max(30, safeNum(input.peso, 70));
  const altezza = Math.max(100, safeNum(input.altezza, 175)); // in cm
  const eta = Math.max(10, safeNum(input.eta, 25));
  const fcr = Math.max(35, safeNum(input.fcr, 60)); // Battiti a riposo

  // Pliche (mm)
  const pliche = {
    tricipite: safeNum(input.tricipite, 6.0),
    scapola: safeNum(input.scapola, 7.5),
    torace: safeNum(input.torace, 5.0),
    addominale: safeNum(input.addominale, 7.0),
    iliaca: safeNum(input.iliaca, 4.5),
    coscia: safeNum(input.coscia, 6.8),
  };

  // Circonferenze (cm)
  const circ = {
    braccio: safeNum(input.braccio, 28.0),
    vita: safeNum(input.vita, 75.0),
    fianchi: safeNum(input.fianchi, 90.0),
    cosciaRadice: safeNum(input.cosciaRadice, 58.0),
    cosciaMediana: safeNum(input.cosciaMediana, 55.0),
  };

  // Diametri ossei (cm)
  const diam = {
    polso: safeNum(input.polso, 6.0),
    gomito: safeNum(input.gomito, 7.2),
    ginocchio: safeNum(input.ginocchio, 10.0),
    caviglia: safeNum(input.caviglia, 8.0),
  };

  // ─── 1. TESSUTO OSSEO (Formula di Rocha / Martin dai 4 diametri) ───
  // Formula di Rocha / Martin: 3.02 * ( (H/100)^2 * (polso/100) * (ginocchio/100) * 400 )^0.712
  // Scalata sui 4 diametri per calibrazione esatta:
  const rawRocha = 3.02 * Math.pow(((altezza / 100) ** 2) * (diam.polso / 100) * (diam.ginocchio / 100) * 400, 0.712);
  const fattore4Diam = Math.pow((diam.gomito / 7.2) * (diam.caviglia / 7.8), 0.25);
  const ossaKg = Number(Math.max(4, Math.min(25, rawRocha * 0.95 * fattore4Diam)).toFixed(2));
  const ossaPct = Number(((ossaKg / peso) * 100).toFixed(2));

  // Indice scheletrico (-5 a +5) e biotipo osseo
  const ossaAtteseNormo = peso * (isM ? 0.183 : 0.165);
  const diffOssaKg = Number((ossaKg - ossaAtteseNormo).toFixed(2));
  const indiceOsseo = Number(Math.max(-5, Math.min(5, (diffOssaKg / (peso * 0.04)) * 3)).toFixed(2));
  const biotipoOsseo = indiceOsseo > 1.2 ? 'ROBUSTA' : indiceOsseo < -1.2 ? 'LONGILINEA' : 'NORMOLINEA';

  // ─── 2. DENSITÀ CORPOREA E MASSA GRASSA (Modello Marchesi / Jackson 6 Pliche) ───
  const somma6Pliche = pliche.tricipite + pliche.scapola + pliche.torace + pliche.addominale + pliche.iliaca + pliche.coscia;
  
  // Densità corporea (g/ml)
  let densita = isM
    ? 1.1098 - (0.00052 * somma6Pliche) - (0.00028 * eta)
    : 1.0960 - (0.00055 * somma6Pliche) - (0.00025 * eta);
  densita = Number(Math.max(1.01, Math.min(1.105, densita)).toFixed(4));

  // Percentuale di grasso (equazione Siri corretta per atleti e modello Marchesi)
  let rawFat = (4.95 / densita - 4.5) * 100;
  let fatPct = Number(Math.max(3.5, Math.min(55, rawFat * 0.935)).toFixed(2));
  const grassoKg = Number(((peso * fatPct) / 100).toFixed(2));

  // Ripartizione grasso
  const grassoEssenzialePct = isM ? 3.72 : 9.5;
  const grassoVisceralePct = Number(Math.max(1.0, fatPct * (isM ? 0.36 : 0.28)).toFixed(2));
  const grassoSottocutaneoPct = Number(Math.max(1.5, fatPct - grassoVisceralePct).toFixed(2));

  // ─── 3. MASSA MAGRA (FFM) E MASSA MUSCOLARE SCHELETRICA (SMM) ───
  const ffmKg = Number((peso - grassoKg).toFixed(2));
  const ffmPct = Number((100 - fatPct).toFixed(2));

  // Circonferenze muscolari depurate dallo spessore della plica (in cm)
  const cmBraccio = Math.max(15, circ.braccio - Math.PI * (pliche.tricipite / 10));
  const cmCoscia = Math.max(30, circ.cosciaRadice - Math.PI * (pliche.coscia / 10));

  // Massa Muscolare Scheletrica (SMM - Modello Marchesi / Martin)
  const muscleRatioFFM = 0.30 + ((cmBraccio / 28.0) * 0.125) + ((cmCoscia / 55.0) * 0.188);
  const smmBoundedRatio = Math.max(0.42, Math.min(0.66, muscleRatioFFM));
  let smmRaw = ffmKg * smmBoundedRatio;
  const muscoloKg = Number(smmRaw.toFixed(2));
  const muscoloPct = Number(((muscoloKg / peso) * 100).toFixed(2));
  const muscoloSuFFMPct = Number(((muscoloKg / ffmKg) * 100).toFixed(2));

  // ─── 4. TESSUTO RESIDUALE / ORGANI / LIQUIDI ───
  // Il quarto compartimento completa esattamente il 100% del peso corporeo
  const altroPct = Number(Math.max(8, 100 - (fatPct + muscoloPct + ossaPct)).toFixed(2));
  const altroKg = Number((peso - (grassoKg + muscoloKg + ossaKg)).toFixed(2));

  // ─── 5. DISTRETTI MUSCOLARI (Superiore vs Inferiore) ───
  const muscoloSuperioreKg = Number((muscoloKg * 0.323).toFixed(2));
  const muscoloInferioreKg = Number((muscoloKg * 0.677).toFixed(2));
  // Indici distrettuali (da 1 a 10)
  const scoreSup = Number(Math.max(1, Math.min(10, (cmBraccio / 28) * 6.5)).toFixed(1));
  const scoreInf = Number(Math.max(1, Math.min(10, (cmCoscia / 52) * 8.0)).toFixed(1));

  // ─── 6. RAPPORTO VITA/FIANCHI (WHR) & RISCHIO CARDIOVASCOLARE ───
  const whr = Number((circ.vita / Math.max(1, circ.fianchi)).toFixed(2));
  const isAndroide = isM ? whr >= 0.90 : whr >= 0.85;
  const rischioSalute = (isM && whr > 0.95) || (!isM && whr > 0.88) ? 'ELEVATO' : (isM && whr > 0.90) || (!isM && whr > 0.84) ? 'MEDIO' : 'BASSO';

  // ─── 7. IDRATAZIONE E FISIOLOGIA DEL MUSCOLO STRIATO ───
  // Acqua totale corporea (TBW): circa 73.8% della massa magra (FFM)
  const tbwLitri = Number((ffmKg * 0.738).toFixed(1));
  // Muscolo striato: ~79% acqua, ~15.5% proteine (di cui 64.2% contrattili), ~3.1% lipidi
  const acquaMuscoloLitri = Number((muscoloKg * 0.79).toFixed(1));
  const proteineMuscoloGr = Number((muscoloKg * 155).toFixed(1));
  const proteineContrattiliGr = Number((proteineMuscoloGr * 0.642).toFixed(1));
  const lipidiMuscoloGr = Number((muscoloKg * 31).toFixed(1));
  const trigliceridiMuscoloGr = Number((muscoloKg * 14.4).toFixed(1));
  const saliMineraliMuscoloGr = Number((muscoloKg * 29).toFixed(1));

  // Glicogeno corporeo stimato (muscolare + epatico)
  const glicogenoGr = Number((muscoloKg * 14.5 + 95).toFixed(1));
  // Superficie corporea (formula di Mosteller)
  const superficieCorporeaM2 = Number(Math.sqrt((altezza * peso) / 3600).toFixed(1));
  // Volumi ematici stimati (formula Nadler)
  const volumeEmaticoLitri = Number((peso * (isM ? 0.089 : 0.078)).toFixed(1));
  const volumePlasmaticoLitri = Number((volumeEmaticoLitri * 0.47).toFixed(1));

  // ─── 8. METABOLISMO BASALE DOPPIO (FITcompX vs Harris-Benedict) ───
  // Harris-Benedict originale (peso, altezza, età, sesso)
  const bmrHarrisBenedict = isM
    ? Number((66.473 + (13.7516 * peso) + (5.0033 * altezza) - (6.755 * eta)).toFixed(2))
    : Number((655.0955 + (9.5634 * peso) + (1.8496 * altezza) - (4.6756 * eta)).toFixed(2));

  // Metabolismo Basale FITcompX: valorizza l'alto consumo metabolico della massa muscolare
  // Modello Katch-McArdle + componente termogenica SMM
  const bmrFITcompX = Math.round(370 + (21.6 * ffmKg) + (13.8 * muscoloKg));

  // ─── 9. FREQUENZE CARDIACHE E CONSUMI CALORICI ───
  const fcMax = Math.round(220 - eta);
  const fcRiserva = fcMax - fcr;
  // Zone Karvonen (50-70%) e Cooper
  const karvonenMin = Math.round(fcr + fcRiserva * 0.50);
  const karvonenMax = Math.round(fcr + fcRiserva * 0.70);
  const cooperMin = Math.round(fcMax * 0.65);
  const cooperMax = Math.round(fcMax * 0.75);

  const fatBurningLevels = [
    { livello: 'Sedentario (FCR + 15%-25%)', range: `${Math.round(fcr + fcRiserva * 0.15)} - ${Math.round(fcr + fcRiserva * 0.25)}` },
    { livello: 'Basso (FCR + 25%-35%)', range: `${Math.round(fcr + fcRiserva * 0.25)} - ${Math.round(fcr + fcRiserva * 0.35)}` },
    { livello: 'Medio (FCR + 35%-55%)', range: `${Math.round(fcr + fcRiserva * 0.35)} - ${Math.round(fcr + fcRiserva * 0.55)}` },
    { livello: 'Eccellente (FCR + 55%-120%)', range: `${Math.round(fcr + fcRiserva * 0.55)} - ${Math.round(fcr + fcRiserva * 1.0)}` },
  ];

  // Pesi ideali secondo altri autori
  const pesoVanDerVael = Number(((altezza - 100) - (altezza - 150) / 4 + (eta >= 20 ? (eta - 20) / 4 : 0)).toFixed(2));
  const pesoLorenz = Number(((altezza - 100) - (altezza - 150) / (isM ? 4 : 2)).toFixed(2));
  const pesoBerthean = Number((0.8 * (altezza - 100) + eta / 2).toFixed(2));

  // BMI
  const bmi = Number((peso / ((altezza / 100) ** 2)).toFixed(2));

  // Generazione diagnosi clinica automatica
  const diagnosi = generaDiagnosiClinica({
    peso,
    fatPct,
    muscoloPct,
    muscoloSuFFMPct,
    scoreSup,
    scoreInf,
    biotipoOsseo,
    isM,
    bmrFITcompX,
    bmrHarrisBenedict,
  });

  return {
    dataVisita: input.dataVisita || new Date().toLocaleDateString('it-IT'),
    sesso,
    eta,
    altezza,
    peso,
    fcr,
    bmi,
    pliche,
    circ,
    diam,
    // 4 Compartimenti
    grasso: {
      kg: grassoKg,
      pct: fatPct,
      essenziale: grassoEssenzialePct,
      viscerale: grassoVisceralePct,
      sottocutaneo: grassoSottocutaneoPct,
    },
    muscolo: {
      kg: muscoloKg,
      pct: muscoloPct,
      suMassaMagraPct: muscoloSuFFMPct,
      superioreKg: muscoloSuperioreKg,
      superioreScore: scoreSup,
      inferioreKg: muscoloInferioreKg,
      inferioreScore: scoreInf,
    },
    ossa: {
      kg: ossaKg,
      pct: ossaPct,
      indice: indiceOsseo,
      biotipo: biotipoOsseo,
      diffNormoKg: diffOssaKg,
    },
    altro: {
      kg: altroKg,
      pct: altroPct,
    },
    massaMagra: {
      kg: ffmKg,
      pct: ffmPct,
    },
    whr: {
      valore: whr,
      biotipo: isAndroide ? 'Androide' : 'Ginoide',
      rischio: rischioSalute,
    },
    fisiologia: {
      tbwLitri,
      glicogenoGr,
      superficieCorporeaM2,
      volumeEmaticoLitri,
      volumePlasmaticoLitri,
      densita,
      acquaMuscoloLitri,
      proteineMuscoloGr,
      proteineContrattiliGr,
      lipidiMuscoloGr,
      trigliceridiMuscoloGr,
      saliMineraliMuscoloGr,
    },
    metabolismo: {
      bmrFITcompX,
      bmrHarrisBenedict,
    },
    cardiocircolatorio: {
      fcMax,
      karvonen: `${karvonenMin} - ${karvonenMax}`,
      cooper: `${cooperMin} - ${cooperMax}`,
      fatBurningLevels,
    },
    pesiAutori: {
      vanDerVael: pesoVanDerVael,
      lorenz: pesoLorenz,
      berthean: pesoBerthean,
    },
    diagnosi,
  };
}

/**
 * Genera il testo discorsivo della diagnosi clinica (stile FITcompX / B-sportlab)
 */
export function generaDiagnosiClinica({
  peso,
  fatPct,
  muscoloPct,
  muscoloSuFFMPct,
  scoreSup,
  scoreInf,
  biotipoOsseo,
  isM,
  bmrFITcompX,
  bmrHarrisBenedict,
}) {
  const fatOttimale = isM ? 10.0 : 17.0;
  const fatDiff = (fatPct - fatOttimale).toFixed(1);

  let giudizioGrasso = '';
  if (fatPct < (isM ? 7.0 : 14.0)) {
    giudizioGrasso = `una percentuale di grasso del ${fatPct}%, estremamente contenuta e ottimale per la massima prestazione atletica e definizione.`;
  } else if (fatPct <= fatOttimale) {
    giudizioGrasso = `una percentuale di grasso del ${fatPct}%, in perfetto equilibrio atletico e salute ottimale.`;
  } else {
    giudizioGrasso = `una percentuale di grasso del ${fatPct}% (+${fatDiff}% rispetto al target fitness), con margini favorevoli di ricomposizione corporea.`;
  }

  let giudizioDistretti = '';
  if (Math.abs(scoreSup - scoreInf) <= 1.0) {
    giudizioDistretti = `I distretti muscolari risultano ben bilanciati e proporzionati tra distretto superiore (${scoreSup}/10) e inferiore (${scoreInf}/10).`;
  } else if (scoreInf > scoreSup) {
    giudizioDistretti = `Il distretto inferiore (${scoreInf}/10) è eccellente e dominante rispetto al distretto superiore (${scoreSup}/10). Si consiglia di intensificare il lavoro muscolare sulla parte alta del corpo.`;
  } else {
    giudizioDistretti = `Il distretto superiore (${scoreSup}/10) presenta un ottimo sviluppo rispetto a quello inferiore (${scoreInf}/10). Si consiglia un richiamo specifico sulla muscolatura degli arti inferiori.`;
  }

  const bmrDiff = bmrFITcompX - Math.round(bmrHarrisBenedict);
  const notaBmr = bmrDiff > 100
    ? `Grazie all'elevata massa muscolare (${muscoloPct}% del peso corporeo, pari al ${muscoloSuFFMPct}% della massa magra), il tuo metabolismo basale reale è di ${bmrFITcompX} kcal/giorno, notevolmente superiore (+${bmrDiff} kcal) rispetto alle stime standard generiche.`
    : `Il metabolismo basale calcolato è di ${bmrFITcompX} kcal/giorno, coerente con la composizione corporea attuale.`;

  return `Il peso corporeo (${peso} kg, biotipo osseo ${biotipoOsseo.toLowerCase()}) è determinato dalla somma di muscolo, grasso, scheletro e liquidi. Il paziente presenta ${giudizioGrasso}
La percentuale di muscolo su massa magra è del ${muscoloSuFFMPct}%. ${giudizioDistretti}
${notaBmr}`;
}
