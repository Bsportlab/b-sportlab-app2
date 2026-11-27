import React, { useState, useEffect, useMemo } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView, Linking, Alert, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { confirmAction } from './confirm';
import { s } from './stile';
import * as M from './motore';
import { calcolaAntropometria, generaCodiceSicuro, COLORBLIND_PALETTE } from './antropometria';
import { calcolaAntropometriaServer } from './supabase';

const LIME_DARK = '#4D7C0F';
const LIME_TEXT = '#3F6212';
const LIME_SOFT = '#F7FEE7';
const DOC_SUPP_STORAGE_KEY = '@bsportlab_doc_supplements_v1';

const safeNum = (v) => parseFloat(String(v ?? 0).replace(',', '.')) || 0;

const PROFILI_LIST = [
  {
    id: 'BENESSERE',
    label: '🌱 Benessere & Salute',
    desc: '1 sola giornata standard equilibrata, passi giornalieri (NEAT) e idratazione',
  },
  {
    id: 'FITNESS',
    label: '⚡ Fitness / Amatoriale',
    desc: 'Giorno di riposo muscolare + 1-3 tipologie di allenamento con calorie e carboidrati aumentati',
  },
  {
    id: 'ATLETA',
    label: '🔥 Atleta / Performance',
    desc: 'BMR x LAF + dispendio reale in kJ, peri-workout (intra/post) e microciclo a date reali (GG/MM/AAAA)',
  },
];

export default function AdminForm({
  cur,
  setCur,
  onBack,
  onSave,
  onDelete,
  existingCodes = [],
  isNew = false,
  initialCodice = '',
  loading,
  msg,
}) {
  const [appUrl, setAppUrl] = useState(() => {
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      return window.location.origin;
    }
    return 'https://b-sportlab-app2.vercel.app';
  });

  // Stato per l'aggiunta rapida di un nuovo integratore
  const [newIntNome, setNewIntNome] = useState('');
  const [newIntDose, setNewIntDose] = useState('');
  const [newIntMomento, setNewIntMomento] = useState('colazione');

  // Libreria integratori frequenti del dottore
  const [docSuppLibrary, setDocSuppLibrary] = useState(M.DEFAULT_DOCTOR_SUPPLEMENTS || []);

  // Stato per la duplicazione mirata dei giorni Atleta
  const [dupSourceIdx, setDupSourceIdx] = useState(null);
  const [dupFeedback, setDupFeedback] = useState('');

  // Stato per la generazione guidata del microciclo Atleta (data nel formato GG/MM/AAAA)
  const [athStartDate, setAthStartDate] = useState(
    cur.piano_dati?.data_inizio ? M.formatDateDMY(cur.piano_dati.data_inizio) : M.formatDateDMY(new Date())
  );
  const [athNumDays, setAthNumDays] = useState(String(cur.piano_dati?.giorni_atleta?.length || 5));

  // Stato per Visita Antropometrica & Plicometria (FITcompX)
  const [showAntropoModal, setShowAntropoModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [antropoForm, setAntropoForm] = useState({
    dataVisita: new Date().toLocaleDateString('it-IT'),
    peso: cur.peso_visita ? String(cur.peso_visita) : '',
    altezza: cur.anagrafica?.altezza ? String(cur.anagrafica.altezza) : '',
    fcr: '',
    tricipite: '',
    scapola: '',
    torace: '',
    addominale: '',
    iliaca: '',
    coscia: '',
    braccio: '',
    vita: '',
    fianchi: '',
    cosciaRadice: '',
    cosciaMediana: '',
    polso: '',
    gomito: '',
    ginocchio: '',
    caviglia: '',
  });
  const [antropoPreview, setAntropoPreview] = useState(null);
  const [antropoSuccessMsg, setAntropoSuccessMsg] = useState('');

  const updAnagrafica = (field, val) => {
    setCur((prev) => ({
      ...prev,
      anagrafica: {
        ...(prev?.anagrafica || {}),
        [field]: val,
      },
    }));
  };

  const lastVisit = (cur.visite_antropometriche || []).length > 0
    ? cur.visite_antropometriche[cur.visite_antropometriche.length - 1]
    : null;

  const getLastVisitData = () => {
    if (!lastVisit) return null;
    const inp = lastVisit.input || {};
    const res = lastVisit.risultati || {};
    const pl = res.pliche || {};
    const ci = res.circ || {};
    const di = res.diam || {};
    return {
      peso: inp.peso !== undefined && inp.peso !== "" ? String(inp.peso) : (res.peso ? String(res.peso) : ""),
      altezza: inp.altezza !== undefined && inp.altezza !== "" ? String(inp.altezza) : (res.altezza ? String(res.altezza) : ""),
      fcr: inp.fcr !== undefined && inp.fcr !== "" ? String(inp.fcr) : (res.fcr ? String(res.fcr) : ""),
      tricipite: inp.tricipite !== undefined && inp.tricipite !== "" ? String(inp.tricipite) : (pl.tricipite !== undefined ? String(pl.tricipite) : ""),
      scapola: inp.scapola !== undefined && inp.scapola !== "" ? String(inp.scapola) : (pl.scapola !== undefined ? String(pl.scapola) : ""),
      torace: inp.torace !== undefined && inp.torace !== "" ? String(inp.torace) : (pl.torace !== undefined ? String(pl.torace) : ""),
      addominale: inp.addominale !== undefined && inp.addominale !== "" ? String(inp.addominale) : (pl.addominale !== undefined ? String(pl.addominale) : ""),
      iliaca: inp.iliaca !== undefined && inp.iliaca !== "" ? String(inp.iliaca) : (pl.iliaca !== undefined ? String(pl.iliaca) : ""),
      coscia: inp.coscia !== undefined && inp.coscia !== "" ? String(inp.coscia) : (pl.coscia !== undefined ? String(pl.coscia) : ""),
      braccio: inp.braccio !== undefined && inp.braccio !== "" ? String(inp.braccio) : (ci.braccio !== undefined ? String(ci.braccio) : ""),
      vita: inp.vita !== undefined && inp.vita !== "" ? String(inp.vita) : (ci.vita !== undefined ? String(ci.vita) : ""),
      fianchi: inp.fianchi !== undefined && inp.fianchi !== "" ? String(inp.fianchi) : (ci.fianchi !== undefined ? String(ci.fianchi) : ""),
      cosciaRadice: inp.cosciaRadice !== undefined && inp.cosciaRadice !== "" ? String(inp.cosciaRadice) : (ci.cosciaRadice !== undefined ? String(ci.cosciaRadice) : ""),
      cosciaMediana: inp.cosciaMediana !== undefined && inp.cosciaMediana !== "" ? String(inp.cosciaMediana) : (ci.cosciaMediana !== undefined ? String(ci.cosciaMediana) : ""),
      polso: inp.polso !== undefined && inp.polso !== "" ? String(inp.polso) : (di.polso !== undefined ? String(di.polso) : ""),
      gomito: inp.gomito !== undefined && inp.gomito !== "" ? String(inp.gomito) : (di.gomito !== undefined ? String(di.gomito) : ""),
      ginocchio: inp.ginocchio !== undefined && inp.ginocchio !== "" ? String(inp.ginocchio) : (di.ginocchio !== undefined ? String(di.ginocchio) : ""),
      caviglia: inp.caviglia !== undefined && inp.caviglia !== "" ? String(inp.caviglia) : (di.caviglia !== undefined ? String(di.caviglia) : ""),
    };
  };

  const handlePrefillAllFromLast = () => {
    const lastData = getLastVisitData();
    if (!lastData) return;
    setAntropoForm((prev) => ({
      ...prev,
      ...lastData,
      dataVisita: prev.dataVisita || new Date().toLocaleDateString("it-IT"),
      peso: cur.peso_visita ? String(cur.peso_visita) : (lastData.peso || prev.peso),
      altezza: cur.anagrafica?.altezza ? String(cur.anagrafica.altezza) : (lastData.altezza || prev.altezza),
    }));
  };

  const handleResetPlicheOnly = () => {
    const lastData = getLastVisitData() || {};
    setAntropoForm((prev) => ({
      ...prev,
      fcr: "",
      tricipite: "",
      scapola: "",
      torace: "",
      addominale: "",
      iliaca: "",
      coscia: "",
      braccio: "",
      vita: "",
      fianchi: "",
      cosciaRadice: "",
      cosciaMediana: "",
      // Mantiene intatti i diametri ossei (scheletrici) e altezza
      polso: lastData.polso || prev.polso || "",
      gomito: lastData.gomito || prev.gomito || "",
      ginocchio: lastData.ginocchio || prev.ginocchio || "",
      caviglia: lastData.caviglia || prev.caviglia || "",
    }));
  };

  const comparisonData = useMemo(() => {
    const rawList = cur.visite_antropometriche || [];
    if (rawList.length === 0) return null;
    const sorted = [...rawList].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const prev = sorted.length >= 2 ? sorted[sorted.length - 2] : null;

    const fRes = first?.risultati || {};
    const lRes = last?.risultati || {};
    const pRes = prev?.risultati || {};

    const diff = (a, b) => {
      const vA = safeNum(a);
      const vB = safeNum(b);
      const d = vA - vB;
      return {
        val: d,
        fmt: d > 0 ? `+${d.toFixed(1)}` : d.toFixed(1),
        str: d === 0 ? "0.0" : (d > 0 ? `+${d.toFixed(1)}` : d.toFixed(1)),
      };
    };

    return {
      sorted,
      count: sorted.length,
      first,
      last,
      prev,
      fRes,
      lRes,
      pRes,
      deltaTot: {
        peso: diff(lRes.peso, fRes.peso),
        fatKg: diff(lRes.grasso?.kg, fRes.grasso?.kg),
        fatPct: diff(lRes.grasso?.pct, fRes.grasso?.pct),
        muscKg: diff(lRes.muscolo?.kg, fRes.muscolo?.kg),
        muscPct: diff(lRes.muscolo?.pct, fRes.muscolo?.pct),
        sommaPliche: diff(lRes.pliche?.sommaPliche, fRes.pliche?.sommaPliche),
        vita: diff(lRes.circ?.vita, fRes.circ?.vita),
        fianchi: diff(lRes.circ?.fianchi, fRes.circ?.fianchi),
        braccio: diff(lRes.circ?.braccio, fRes.circ?.braccio),
        bmr: diff(lRes.metabolismo?.bmrFITcompX, fRes.metabolismo?.bmrFITcompX),
      },
      deltaLast: prev ? {
        peso: diff(lRes.peso, pRes.peso),
        fatKg: diff(lRes.grasso?.kg, pRes.grasso?.kg),
        fatPct: diff(lRes.grasso?.pct, pRes.grasso?.pct),
        muscKg: diff(lRes.muscolo?.kg, pRes.muscolo?.kg),
        muscPct: diff(lRes.muscolo?.pct, pRes.muscolo?.pct),
        sommaPliche: diff(lRes.pliche?.sommaPliche, pRes.pliche?.sommaPliche),
        vita: diff(lRes.circ?.vita, pRes.circ?.vita),
        fianchi: diff(lRes.circ?.fianchi, pRes.circ?.fianchi),
      } : null,
    };
  }, [cur.visite_antropometriche]);

  const handleOpenAntropoModal = () => {
    const lastData = getLastVisitData();
    if (lastData) {
      setAntropoForm({
        ...lastData,
        dataVisita: new Date().toLocaleDateString("it-IT"),
        peso: cur.peso_visita ? String(cur.peso_visita) : (lastData.peso || ""),
        altezza: cur.anagrafica?.altezza ? String(cur.anagrafica.altezza) : (lastData.altezza || ""),
      });
    } else {
      setAntropoForm({
        dataVisita: new Date().toLocaleDateString("it-IT"),
        peso: cur.peso_visita ? String(cur.peso_visita) : "",
        altezza: cur.anagrafica?.altezza ? String(cur.anagrafica.altezza) : "",
        fcr: "",
        tricipite: "",
        scapola: "",
        torace: "",
        addominale: "",
        iliaca: "",
        coscia: "",
        braccio: "",
        vita: "",
        fianchi: "",
        cosciaRadice: "",
        cosciaMediana: "",
        polso: "",
        gomito: "",
        ginocchio: "",
        caviglia: "",
      });
    }
    setAntropoPreview(null);
    setShowAntropoModal(true);
  };

  const getAntropoParams = () => {
    let calculatedEta = safeNum(cur.anagrafica?.eta);
    if (!calculatedEta && cur.anagrafica?.data_nascita) {
      const parts = String(cur.anagrafica.data_nascita).split(/[\/\-\.]/);
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        const birth = new Date(y, m, d);
        if (!isNaN(birth.getTime())) {
          const now = new Date();
          calculatedEta = now.getFullYear() - birth.getFullYear();
          if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
            calculatedEta--;
          }
        }
      }
    }
    const safeEta = calculatedEta > 5 ? calculatedEta : 25;

    const base = {
      sesso: cur.anagrafica?.sesso || 'M',
      eta: safeEta,
      altezza: safeNum(antropoForm.altezza) || safeNum(cur.anagrafica?.altezza) || 175,
      peso: safeNum(antropoForm.peso) || safeNum(cur.peso_visita) || 70,
      fcr: safeNum(antropoForm.fcr) || 60,
      tricipite: safeNum(antropoForm.tricipite),
      scapola: safeNum(antropoForm.scapola),
      torace: safeNum(antropoForm.torace),
      addominale: safeNum(antropoForm.addominale),
      iliaca: safeNum(antropoForm.iliaca),
      coscia: safeNum(antropoForm.coscia),
      braccio: safeNum(antropoForm.braccio),
      vita: safeNum(antropoForm.vita),
      fianchi: safeNum(antropoForm.fianchi),
      cosciaRadice: safeNum(antropoForm.cosciaRadice),
      cosciaMediana: safeNum(antropoForm.cosciaMediana),
      polso: safeNum(antropoForm.polso),
      gomito: safeNum(antropoForm.gomito),
      ginocchio: safeNum(antropoForm.ginocchio),
      caviglia: safeNum(antropoForm.caviglia),
      dataVisita: antropoForm.dataVisita || new Date().toLocaleDateString('it-IT'),
    };

    return {
      ...base,
      pliche: {
        tricipite: base.tricipite,
        sottoscapola: base.scapola,
        scapola: base.scapola,
        torace: base.torace,
        addominale: base.addominale,
        iliaca: base.iliaca,
        coscia: base.coscia,
      },
      circonferenze: {
        braccio: base.braccio,
        vita: base.vita,
        fianchi: base.fianchi,
        coscia_radice: base.cosciaRadice,
        coscia_mediana: base.cosciaMediana,
      },
      diametri: {
        polso: base.polso,
        gomito: base.gomito,
        ginocchio: base.ginocchio,
        caviglia: base.caviglia,
      },
    };
  };

  const handleCalcAntropo = () => {
    const params = getAntropoParams();
    const res = calcolaAntropometria(params);
    setAntropoPreview(res);
  };

  const handleSaveAntropo = () => {
    let res = antropoPreview;
    if (!res) {
      const params = getAntropoParams();
      res = calcolaAntropometria(params);
    }

    const nuovaVisita = {
      id: `vis_${Date.now()}`,
      data: res.dataVisita,
      timestamp: Date.now(),
      risultati: res,
      input: { ...antropoForm },
    };

    const updatedVisite = [...(cur.visite_antropometriche || []), nuovaVisita];

    setCur((prev) => ({
      ...prev,
      peso_visita: String(res.peso),
      visite_antropometriche: updatedVisite,
      ha_antropometria: true,
      anagrafica: {
        ...(prev.anagrafica || {}),
        altezza: String(res.altezza),
      },
      piano_dati: {
        ...(prev.piano_dati || {}),
        visite_antropometriche: updatedVisite,
        ha_antropometria: true,
      },
    }));

    setAntropoSuccessMsg('✅ Visita salvata con successo!');
    setTimeout(() => {
      setAntropoSuccessMsg('');
      setShowAntropoModal(false);
      setAntropoPreview(null);
    }, 1500);
  };

  const handleDeleteVisit = (vId) => {
    confirmAction({
      title: 'Elimina Visita',
      message: 'Sei sicuro di voler eliminare questa visita dallo storico del paziente?',
      confirmText: 'Elimina',
      cancelText: 'Annulla',
      isDestructive: true,
      onConfirm: () => {
        const updated = (cur.visite_antropometriche || []).filter((v) => v.id !== vId);
        setCur((prev) => ({
          ...prev,
          visite_antropometriche: updated,
          ha_antropometria: updated.length > 0,
          piano_dati: {
            ...(prev.piano_dati || {}),
            visite_antropometriche: updated,
            ha_antropometria: updated.length > 0,
          },
        }));
      },
    });
  };

  // Auto-allineamento visite: se una visita salvata ha il default 44 mm ma l'input ha valori diversi, ricalcola al volo
  useEffect(() => {
    const rawVisite = cur.visite_antropometriche || [];
    let hasMismatch = false;
    const repaired = rawVisite.map((v) => {
      const inp = v.input || {};
      const tri = parseFloat(String(inp.tricipite || 0).replace(',', '.'));
      const sca = parseFloat(String(inp.scapola || inp.sottoscapola || 0).replace(',', '.'));
      const tor = parseFloat(String(inp.torace || 0).replace(',', '.'));
      const add = parseFloat(String(inp.addominale || 0).replace(',', '.'));
      const ili = parseFloat(String(inp.iliaca || 0).replace(',', '.'));
      const cos = parseFloat(String(inp.coscia || 0).replace(',', '.'));
      const inputSum = tri + sca + tor + add + ili + cos;
      if (inputSum > 0 && Math.abs(inputSum - 44) > 1 && v.risultati?.sommaPliche === 44) {
        hasMismatch = true;
        const parseNum = (val, fb = 0) => {
          if (typeof val === 'number') return isNaN(val) ? fb : val;
          if (!val) return fb;
          const n = parseFloat(String(val).replace(',', '.').trim());
          return isNaN(n) ? fb : n;
        };
        let etaCalc = parseNum(inp.eta, 0);
        const dataNascita = cur.piano_dati?.anagrafica?.data_nascita || cur.anagrafica?.data_nascita || '';
        if (dataNascita) {
          const parts = dataNascita.split(/[-/.]/);
          if (parts.length === 3) {
            const bDate = parts[0].length === 4
              ? new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
              : new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
            if (!isNaN(bDate.getTime())) {
              let refDate = new Date();
              const vDateStr = v.data || inp.dataVisita;
              if (vDateStr) {
                const vp = vDateStr.split(/[-/.]/);
                if (vp.length === 3) {
                  refDate = vp[0].length === 4
                    ? new Date(parseInt(vp[0], 10), parseInt(vp[1], 10) - 1, parseInt(vp[2], 10))
                    : new Date(parseInt(vp[2], 10), parseInt(vp[1], 10) - 1, parseInt(vp[0], 10));
                }
              }
              const diffMs = refDate.getTime() - bDate.getTime();
              etaCalc = Number((diffMs / (365.25 * 24 * 60 * 60 * 1000)).toFixed(1));
            }
          }
        }
        if (!etaCalc || etaCalc <= 0) etaCalc = 25;
        const newRes = calcolaAntropometria({
          peso: parseNum(inp.peso, cur.peso_visita || 70),
          altezza: parseNum(inp.altezza, 175),
          sesso: inp.sesso || cur.piano_dati?.anagrafica?.sesso || cur.anagrafica?.sesso || 'M',
          eta: etaCalc,
          fcr: parseNum(inp.fcr, 60),
          tricipite: tri,
          scapola: sca,
          torace: tor,
          addominale: add,
          iliaca: ili,
          coscia: cos,
          braccio: parseNum(inp.braccio, 30),
          vita: parseNum(inp.vita, 78),
          fianchi: parseNum(inp.fianchi, 95),
          cosciaRadice: parseNum(inp.cosciaRadice, 54),
          cosciaMediana: parseNum(inp.cosciaMediana, 50),
          polso: parseNum(inp.polso, 5.5),
          gomito: parseNum(inp.gomito, 6.8),
          ginocchio: parseNum(inp.ginocchio, 9.5),
          caviglia: parseNum(inp.caviglia, 7.0),
          dataVisita: v.data || inp.dataVisita || '',
        });
        return { ...v, risultati: newRes };
      }
      return v;
    });
    if (hasMismatch) {
      setCur((prev) => ({
        ...prev,
        visite_antropometriche: repaired,
        piano_dati: {
          ...(prev.piano_dati || {}),
          visite_antropometriche: repaired,
        },
      }));
    }
  }, [cur.codice]);

  // Carica libreria integratori frequenti salvata
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(DOC_SUPP_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDocSuppLibrary(parsed);
          }
        }
      } catch (e) {
        console.warn('Errore lettura memoria integratori:', e);
      }
    })();
  }, []);

  const saveDocSuppLibrary = async (newList) => {
    setDocSuppLibrary(newList);
    try {
      await AsyncStorage.setItem(DOC_SUPP_STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.warn('Errore salvataggio memoria integratori:', e);
    }
  };

  const metodo = cur.metodo || 'BENESSERE';
  const showMacro = cur.piano_dati?.mostra_macro ?? true;
  const startWeight = safeNum(cur.peso_visita || 70);

  const updPiano = (sec, k, v) =>
    setCur({ ...cur, piano_dati: { ...cur.piano_dati, [sec]: { ...cur.piano_dati[sec], [k]: v } } });

  const updPianoRoot = (k, v) =>
    setCur({ ...cur, piano_dati: { ...cur.piano_dati, [k]: v } });

  const handleSelectMetodo = (m) => {
    setCur((prev) => ({
      ...prev,
      metodo: m,
      piano_dati: {
        ...(prev?.piano_dati || {}),
        metodo: m,
      },
    }));
  };

  // ─── GESTIONE INTEGRATORI ──────────────────────────────────────────────
  const handleSelectSuppPreset = (preset) => {
    setNewIntNome(preset.nome || '');
    setNewIntDose(preset.dose || '');
    setNewIntMomento(preset.momento || 'colazione');
  };

  const handleDeleteFromLibrary = (suppName) => {
    confirmAction({
      title: 'Elimina da Memoria',
      message: `Vuoi rimuovere "${suppName}" dalla lista dei tuoi integratori abituali salvati in memoria?`,
      confirmText: 'Rimuovi',
      cancelText: 'Annulla',
      isDestructive: true,
      onConfirm: () => {
        const updatedLib = docSuppLibrary.filter(
          (x) => x.nome.toLowerCase() !== (suppName || '').toLowerCase()
        );
        saveDocSuppLibrary(updatedLib);
      },
    });
  };

  const filteredSuppSuggestions = useMemo(() => {
    const q = newIntNome.trim().toLowerCase();
    if (!q) return [];
    return docSuppLibrary.filter((pst) =>
      (pst.nome || '').toLowerCase().includes(q)
    );
  }, [newIntNome, docSuppLibrary]);

  const handleAddIntegratore = () => {
    if (!newIntNome.trim()) return;
    const item = {
      id: `int_${Date.now()}`,
      nome: newIntNome.trim(),
      dose: newIntDose.trim(),
      momento: newIntMomento,
    };
    setCur({
      ...cur,
      integratori: [...(cur.integratori || []), item],
    });

    // Salva nella memoria degli integratori frequenti del dottore se nuovo
    const exists = docSuppLibrary.some(
      (x) => x.nome.toLowerCase() === item.nome.toLowerCase() && x.dose.toLowerCase() === item.dose.toLowerCase()
    );
    if (!exists) {
      const updatedLib = [
        { nome: item.nome, dose: item.dose, momento: item.momento },
        ...docSuppLibrary,
      ].slice(0, 30);
      saveDocSuppLibrary(updatedLib);
    }

    setNewIntNome('');
    setNewIntDose('');
  };

  const handleRemoveIntegratore = (id) => {
    setCur({
      ...cur,
      integratori: (cur.integratori || []).filter((x) => x.id !== id),
    });
  };

  // ─── GESTIONE FITNESS WORKOUTS (FINO A 10 TIPOLOGIE) ───────────────────
  const handleAddWorkout = () => {
    const list = cur.piano_dati?.workouts_fitness || [];
    if (list.length >= 10) return;
    const nextIdx = list.length + 1;
    const nextId = `w_${Date.now()}`;
    const baseP = safeNum(cur.piano_dati?.riposo_fitness?.p) || 140;
    const baseF = safeNum(cur.piano_dati?.riposo_fitness?.f) || 60;
    const baseC = safeNum(cur.piano_dati?.riposo_fitness?.c) || 160;
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L'];
    const letter = letters[nextIdx - 1] || String(nextIdx);
    
    // Stima di default bilanciata (+352 kcal: +15g Proteine, +8g Lipidi, +55g Carbo)
    const newW = {
      id: nextId,
      nome: `Allenamento ${letter}`,
      p: String(Math.round(baseP + 15)),
      f: String(Math.round(baseF + 8)),
      c: String(Math.round(baseC + 55)),
      delta_kcal: '350',
    };
    updPianoRoot('workouts_fitness', [...list, newW]);
  };

  const handleRemoveWorkout = (id) => {
    const list = cur.piano_dati?.workouts_fitness || [];
    if (list.length <= 1) return;
    updPianoRoot('workouts_fitness', list.filter((w) => w.id !== id));
  };

  const handleUpdWorkout = (id, field, val) => {
    const list = cur.piano_dati?.workouts_fitness || [];
    const updated = list.map((w) => (w.id === id ? { ...w, [field]: val } : w));
    updPianoRoot('workouts_fitness', updated);
  };

  // ─── GESTIONE ATLETA MICROCICLO & DUPLICAZIONE MIRATA ───────────────────
  const handleRegenerateAthleteCycle = () => {
    const generated = M.generateAthleteDates(athStartDate, athNumDays);
    setCur({
      ...cur,
      piano_dati: {
        ...cur.piano_dati,
        data_inizio: athStartDate,
        giorni_atleta: generated,
      },
    });
  };

  const handleUpdAthleteDay = (idx, field, val) => {
    const list = [...(cur.piano_dati?.giorni_atleta || [])];
    if (!list[idx]) return;
    list[idx] = { ...list[idx], [field]: val };
    updPianoRoot('giorni_atleta', list);
  };

  const handleUpdAthleteNested = (idx, parent, field, val) => {
    const list = [...(cur.piano_dati?.giorni_atleta || [])];
    if (!list[idx]) return;
    list[idx] = {
      ...list[idx],
      [parent]: {
        ...(list[idx][parent] || {}),
        [field]: val,
      },
    };
    updPianoRoot('giorni_atleta', list);
  };

  // Copia i parametri dal giorno sorgente al giorno destinazione MANTENENDO nome e data del giorno destinazione
  const handleCopyParamsToDay = (srcIdx, destIdx) => {
    const list = [...(cur.piano_dati?.giorni_atleta || [])];
    const src = list[srcIdx];
    const dest = list[destIdx];
    if (!src || !dest) return;

    confirmAction({
      title: 'Conferma Duplicazione Giornata',
      message: `Vuoi copiare i parametri energetici e peri-workout di "${src.nome}" nel giorno "${dest.nome}" (${dest.data})?\n\nIl nome e la data di "${dest.nome}" non cambieranno, ma i valori attuali verranno sovrascritti.`,
      confirmText: 'Duplica',
      cancelText: 'Annulla',
      isDestructive: false,
      onConfirm: () => {
        list[destIdx] = {
          ...dest, // Mantiene dest.id, dest.data, dest.nome invariati!
          kj: src.kj,
          intra: JSON.parse(JSON.stringify(src.intra || {})),
          recovery: JSON.parse(JSON.stringify(src.recovery || {})),
          target_macro: JSON.parse(JSON.stringify(src.target_macro || {})),
          note: src.note || '',
        };
        updPianoRoot('giorni_atleta', list);
        setDupSourceIdx(null);
        setDupFeedback(`✅ Parametri di "${src.nome}" copiati in "${dest.nome}"!`);
        setTimeout(() => setDupFeedback(''), 4000);
      },
    });
  };

  // Copia i parametri a TUTTI gli altri giorni del microciclo (mantenendo nomi e date)
  const handleCopyParamsToAllDays = (srcIdx) => {
    const list = [...(cur.piano_dati?.giorni_atleta || [])];
    const src = list[srcIdx];
    if (!src) return;

    confirmAction({
      title: 'Duplica su Tutti i Giorni',
      message: `Vuoi applicare i parametri di "${src.nome}" a TUTTI gli altri ${list.length - 1} giorni del microciclo?\n\nI nomi e le date dei singoli giorni rimarranno invariati.`,
      confirmText: 'Duplica su Tutti',
      cancelText: 'Annulla',
      isDestructive: false,
      onConfirm: () => {
        const updated = list.map((dest, i) => {
          if (i === srcIdx) return dest;
          return {
            ...dest, // Mantiene nome e data
            kj: src.kj,
            intra: JSON.parse(JSON.stringify(src.intra || {})),
            recovery: JSON.parse(JSON.stringify(src.recovery || {})),
            target_macro: JSON.parse(JSON.stringify(src.target_macro || {})),
            note: src.note || '',
          };
        });
        updPianoRoot('giorni_atleta', updated);
        setDupSourceIdx(null);
        setDupFeedback(`✅ Parametri di "${src.nome}" copiati in tutti gli altri giorni!`);
        setTimeout(() => setDupFeedback(''), 4000);
      },
    });
  };

  // Preset post-workout per il giorno Atleta
  const handleApplyPostWorkoutPreset = (dayIdx, preset) => {
    handleUpdAthleteNested(dayIdx, 'recovery', 'nome', preset.nome);
    handleUpdAthleteNested(dayIdx, 'recovery', 'p', preset.p);
    handleUpdAthleteNested(dayIdx, 'recovery', 'c', preset.c);
    handleUpdAthleteNested(dayIdx, 'recovery', 'f', preset.f);
  };

  const sendWhatsApp = () => {
    const code = cur.codice ? cur.codice.trim().toUpperCase() : '';
    if (!code) return;
    const l = cur.piano_dati?.lingua || 'it';
    const directLink = `${appUrl}/?code=${encodeURIComponent(code)}`;
    const pNome = (cur.anagrafica?.nome || '').trim();
    const ciaoStr = pNome ? `Ciao ${pNome}!` : 'Ciao!';
    let text = `${ciaoStr} Ecco il tuo accesso personale al piano nutrizionale B-sportlab (Dott. Federico Baldassarre).\n\n🔗 Link Diretto al tuo Piano:\n${directLink}\n\n🔑 Il tuo Codice Paziente: ${code}\n\n(Toccando il link sopra entrerai direttamente nel tuo piano nutrizionale!)`;
    if (l === 'en') {
      const hiStr = pNome ? `Hi ${pNome}!` : 'Hi!';
      text = `${hiStr} Here is your personal access to your B-sportlab nutrition plan (Dr. Federico Baldassarre).\n\n🔗 Direct Plan Link:\n${directLink}\n\n🔑 Personal Code: ${code}\n\n(Tap the link above to access your plan directly!)`;
    } else if (l === 'fr') {
      const bnjStr = pNome ? `Bonjour ${pNome} !` : 'Bonjour !';
      text = `${bnjStr} Voici votre accès personnel au plan nutritionnel B-sportlab (Dr. Federico Baldassarre).\n\n🔗 Lien direct:\n${directLink}\n\n🔑 Code personnel: ${code}\n\n(Appuyez sur le lien ci-dessus pour accéder directement à votre plan!)`;
    }
    const url = `https://wa.me/?text=${encodeURI(text)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Errore', 'Impossibile aprire WhatsApp');
    });
  };

  const diary = cur.diario_peso || [];
  const lastWeight = diary.length > 0 ? safeNum(diary[diary.length - 1].peso) : null;
  const diffWeight = lastWeight !== null && startWeight > 0 ? (lastWeight - startWeight).toFixed(1) : null;

  // Calcolo Basale e LAF comune a tutti i profili
  const curBmr = safeNum(cur.piano_dati?.bmr_base) || 1500;
  const curLaf = safeNum(cur.piano_dati?.coeff_laf) || 1.2;
  const bmrLafKcal = Math.round(curBmr * curLaf);

  // Controllo codice duplicato
  const trimmedCode = (cur.codice || '').trim().toUpperCase();
  const isDuplicateCode =
    Boolean(trimmedCode) &&
    existingCodes.some((c) => c.trim().toUpperCase() === trimmedCode) &&
    (isNew || (initialCodice && initialCodice.trim().toUpperCase() !== trimmedCode));

  return (
    <View style={{ marginBottom: 40 }}>
      <TouchableOpacity onPress={onBack} style={{ marginBottom: 12 }}>
        <Text style={{ color: LIME_TEXT, fontWeight: 'bold', fontSize: 14 }}>← Torna all’elenco pazienti</Text>
      </TouchableOpacity>

      <Text style={[s.sec, { fontSize: 20, marginBottom: 12 }]}>
        {cur.codice ? `Scheda Paziente: ${cur.codice}` : 'Nuovo Paziente'}
      </Text>

      {/* ─── 1. SELEZIONE MODELLO CLINICO (I 3 PROFILI) ─────────────────── */}
      <View style={[s.card, { borderWidth: 2, borderColor: LIME_DARK }]}>
        <Text style={[s.sec, { color: LIME_TEXT, marginBottom: 4 }]}>
          1. Tipo di Profilo Paziente
        </Text>
        <Text style={[s.txt, { fontSize: 12, marginBottom: 10, color: '#64748B' }]}>
          Tocca il modello clinico desiderato per configurare la scheda del paziente:
        </Text>
        <View style={{ gap: 8 }}>
          {PROFILI_LIST.map((prof) => {
            const active = metodo === prof.id;
            return (
              <TouchableOpacity
                key={prof.id}
                style={[
                  s.card,
                  {
                    marginTop: 0,
                    marginBottom: 0,
                    padding: 12,
                    borderWidth: 2,
                    borderColor: active ? LIME_DARK : '#CBD5E1',
                    backgroundColor: active ? LIME_SOFT : '#FFFFFF',
                  },
                ]}
                onPress={() => handleSelectMetodo(prof.id)}
              >
                <View style={s.rowBet}>
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: active ? LIME_TEXT : '#1E293B' }}>
                    {prof.label}
                  </Text>
                  {active ? (
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: LIME_TEXT }}>● ATTIVO</Text>
                  ) : null}
                </View>
                <Text style={{ fontSize: 12, color: active ? '#3F6212' : '#64748B', marginTop: 4 }}>
                  {prof.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

{/* ─── MODALITÀ D’USO PER IL PAZIENTE NELL’APP ────────────────────────── */}
<View style={[s.card, { borderWidth: 1.5, borderColor: '#3B82F6', backgroundColor: '#F8FAFC' }]}>
  <Text style={[s.sec, { color: '#1D4ED8', fontSize: 16, marginBottom: 4 }]}>
    Modalità d’Uso per il Paziente nell’App
  </Text>
  <Text style={[s.txt, { fontSize: 12, marginBottom: 10, color: '#64748B' }]}>
    Scegli se lasciare al paziente la libertà di navigare tra le modalità o fissarne una:
  </Text>
  <View style={{ gap: 8 }}>
    {[
      {
        id: 'LIBERA',
        label: '✨ Libera Scelta (Consigliata)',
        desc: 'Il paziente sceglie liberamente tra Componi Piatto Semplice, Ricettario e Diario Libero.',
      },
      {
        id: 'PIATTO',
        label: '🍽️ Solo Componi Piatto Semplice',
        desc: 'Visualizza solo le 4 alternative pulite con grammature crudo/cotto e misure pratiche. Zero distrazioni.',
      },
      {
        id: 'RICETTE',
        label: '🥗 Solo Ricettario B-sportlab',
        desc: 'Visualizza solo i piatti bilanciati e le ricette con tempi di preparazione.',
      },
      {
        id: 'DIARIO',
        label: '🎯 Solo Diario Libero',
        desc: 'Visualizza il tracciamento a bersaglio con barra di ricerca alimenti dal database CREA.',
      },
    ].map((mOpt) => {
      const active = (cur.modalita_uso || cur.piano_dati?.modalita_uso || 'LIBERA') === mOpt.id;
      return (
        <TouchableOpacity
          key={mOpt.id}
          style={[
            s.card,
            {
              marginTop: 0,
              marginBottom: 0,
              padding: 10,
              borderWidth: 1.5,
              borderColor: active ? '#2563EB' : '#CBD5E1',
              backgroundColor: active ? '#EFF6FF' : '#FFFFFF',
            },
          ]}
          onPress={() => {
            setCur({
              ...cur,
              modalita_uso: mOpt.id,
              piano_dati: {
                ...(cur.piano_dati || {}),
                modalita_uso: mOpt.id,
              },
            });
          }}
        >
          <View style={s.rowBet}>
            <Text style={{ fontSize: 13.5, fontWeight: 'bold', color: active ? '#1D4ED8' : '#1E293B' }}>
              {mOpt.label}
            </Text>
            {active ? (
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#2563EB' }}>● ATTIVA</Text>
            ) : null}
          </View>
          <Text style={{ fontSize: 11.5, color: active ? '#1E40AF' : '#64748B', marginTop: 2 }}>
            {mOpt.desc}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
</View>


      {/* ─── 2. ANAGRAFICA & ACCESSO ──────────────────────────────────────── */}
      <View style={s.card}>
        <Text style={s.sec}>2. Anagrafica Paziente & Accesso</Text>

        <View style={s.row}>
          <View style={{ flex: 1, marginRight: 6 }}>
            <Text style={s.lbl}>Nome:</Text>
            <TextInput
              style={s.tInp}
              placeholder="Nome"
              value={cur.anagrafica?.nome || ''}
              onChangeText={(v) => updAnagrafica('nome', v)}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <Text style={s.lbl}>Cognome:</Text>
            <TextInput
              style={s.tInp}
              placeholder="Cognome"
              value={cur.anagrafica?.cognome || ''}
              onChangeText={(v) => updAnagrafica('cognome', v)}
            />
          </View>
        </View>

        <View style={s.row}>
          <View style={{ flex: 1, marginRight: 6 }}>
            <Text style={s.lbl}>Sesso:</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[['M', '👨 Uomo'], ['F', '👩 Donna']].map(([sKey, sLbl]) => {
                const isAct = (cur.anagrafica?.sesso || 'M') === sKey;
                return (
                  <TouchableOpacity
                    key={sKey}
                    style={[s.mBtn, isAct && s.mAct, { marginHorizontal: 0 }]}
                    onPress={() => updAnagrafica('sesso', sKey)}
                  >
                    <Text style={[s.mTxt, isAct && s.mTxtAct]}>{sLbl}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <Text style={s.lbl}>Data di Nascita:</Text>
            <TextInput
              style={s.tInp}
              placeholder="GG/MM/AAAA"
              value={cur.anagrafica?.data_nascita || ''}
              onChangeText={(v) => updAnagrafica('data_nascita', v)}
            />
          </View>
        </View>

        <View style={s.row}>
          <View style={{ flex: 1, marginRight: 6 }}>
            <Text style={s.lbl}>Codice Fiscale:</Text>
            <TextInput
              style={s.tInp}
              autoCapitalize="characters"
              placeholder="Codice Fiscale"
              value={cur.anagrafica?.codice_fiscale || ''}
              onChangeText={(v) => updAnagrafica('codice_fiscale', v)}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <Text style={s.lbl}>Cellulare:</Text>
            <TextInput
              style={s.tInp}
              keyboardType="phone-pad"
              placeholder="Cellulare"
              value={cur.anagrafica?.telefono || ''}
              onChangeText={(v) => updAnagrafica('telefono', v)}
            />
          </View>
        </View>

        <View style={s.row}>
          <View style={{ flex: 1, marginRight: 6 }}>
            <Text style={s.lbl}>Email:</Text>
            <TextInput
              style={s.tInp}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Email"
              value={cur.anagrafica?.email || ''}
              onChangeText={(v) => updAnagrafica('email', v)}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <Text style={s.lbl}>Residenza / Città:</Text>
            <TextInput
              style={s.tInp}
              placeholder="Città"
              value={cur.anagrafica?.residenza || ''}
              onChangeText={(v) => updAnagrafica('residenza', v)}
            />
          </View>
        </View>

        {/* Codice Paziente & Generazione Sicura */}
        <View style={{ marginTop: 8, padding: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8 }}>
          <View style={s.rowBet}>
            <Text style={[s.lbl, { marginTop: 0 }]}>🔑 Codice Paziente (Accesso App):</Text>
            <TouchableOpacity
              onPress={() => {
                const nuovoCod = generaCodiceSicuro(cur.anagrafica?.nome, cur.anagrafica?.cognome);
                setCur({ ...cur, codice: nuovoCod });
              }}
              style={{ backgroundColor: LIME_SOFT, borderWidth: 1, borderColor: LIME_DARK, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}
            >
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: LIME_TEXT }}>🎲 Genera Codice Sicuro</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[s.tInp, { marginTop: 6, fontWeight: 'bold', fontSize: 15, letterSpacing: 1 }, isDuplicateCode && { borderColor: '#EAB308', borderWidth: 2, backgroundColor: '#FEFCE8' }]}
            autoCapitalize="characters"
            placeholder="es. EP-8392"
            value={cur.codice || ''}
            onChangeText={(v) => setCur({ ...cur, codice: v })}
          />
          <Text style={{ fontSize: 11, color: '#64748B', fontStyle: 'italic' }}>
            Codice con suffisso casuale sicuro: non deducibile dal solo nome per garantire la privacy del paziente.
          </Text>
        </View>

        {/* Avviso Codice Già Esistente */}
        {isDuplicateCode ? (
          <View
            style={{
              backgroundColor: '#FEF3C7',
              borderColor: '#F59E0B',
              borderWidth: 1,
              borderRadius: 8,
              padding: 10,
              marginTop: 8,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#92400E' }}>
              ⚠️ ATTENZIONE: Il codice "{trimmedCode}" esiste già nel tuo elenco pazienti.
            </Text>
            <Text style={{ fontSize: 11, color: '#B45309', marginTop: 2 }}>
              Se salvi questa scheda, sovrascriverai completamente i dati del paziente esistente.
            </Text>
          </View>
        ) : null}

        <View style={[s.row, { marginTop: 10 }]}>
          <View style={{ flex: 1, marginRight: 6 }}>
            <Text style={s.lbl}>Peso Visita (kg):</Text>
            <TextInput
              style={s.inp}
              keyboardType="numeric"
              placeholder="kg"
              value={cur.peso_visita !== undefined && cur.peso_visita !== null && cur.peso_visita !== '' ? String(cur.peso_visita) : ''}
              onChangeText={(v) => setCur({ ...cur, peso_visita: v })}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <Text style={s.lbl}>Altezza (cm):</Text>
            <TextInput
              style={s.inp}
              keyboardType="numeric"
              placeholder="cm"
              value={cur.anagrafica?.altezza ? String(cur.anagrafica.altezza) : ''}
              onChangeText={(v) => updAnagrafica('altezza', v)}
            />
          </View>
        </View>

        <Text style={[s.lbl, { marginTop: 10 }]}>Lingua predefinita paziente:</Text>
        <View style={s.row}>
          {[['it', '🇮🇹 Italiano'], ['en', '🇬🇧 English'], ['fr', '🇫🇷 Français']].map(([k, l]) => (
            <TouchableOpacity
              key={k}
              style={[s.mBtn, (cur.piano_dati?.lingua || 'it') === k && s.mAct]}
              onPress={() => setCur({ ...cur, piano_dati: { ...(cur.piano_dati || {}), lingua: k } })}
            >
              <Text style={[s.mTxt, (cur.piano_dati?.lingua || 'it') === k && s.mTxtAct]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            s.sBtn,
            { backgroundColor: showMacro ? LIME_SOFT : '#F8FAFC', borderColor: showMacro ? LIME_DARK : '#E2E8F0', marginTop: 10 },
          ]}
          onPress={() => setCur({ ...cur, piano_dati: { ...(cur.piano_dati || {}), mostra_macro: !showMacro } })}
        >
          <Text style={s.sBtnTxt}>
            {showMacro ? '👁️ Macro e Kcal VISIBILI al paziente' : '🙈 Macro e Kcal NASCOSTI (solo dosi a crudo)'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            s.sBtn,
            { backgroundColor: cur.attivo ? '#DCFCE7' : '#FEE2E2', borderColor: cur.attivo ? '#16A34A' : '#DC2626' },
          ]}
          onPress={() => setCur({ ...cur, attivo: !cur.attivo })}
        >
          <Text style={s.sBtnTxt}>
            {cur.attivo ? '✅ ATTIVO (Tocca per bloccare)' : '⛔ BLOCCATO (Tocca per riattivare)'}
          </Text>
        </TouchableOpacity>

        <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderColor: '#E2E8F0' }}>
          <Text style={s.lbl}>Link App da inviare al paziente:</Text>
          <TextInput style={s.tInp} value={appUrl} onChangeText={setAppUrl} placeholder="https://..." />
          <TouchableOpacity
            style={[s.sBtn, { backgroundColor: '#25D366', borderColor: '#16A34A' }]}
            onPress={sendWhatsApp}
          >
            <Text style={[s.sBtnTxt, { color: '#FFF' }]}>📲 Invia Codice & Link su WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── VISITE ANTROPOMETRICHE & PLICOMETRIA (FITCOMPX) ──────────────── */}
      <View style={[s.card, { borderWidth: 1.5, borderColor: '#0284C7', backgroundColor: '#F0F9FF' }]}>
        <View style={s.rowBet}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[s.sec, { color: '#0369A1', marginBottom: 2, fontSize: 16 }]}>
              🩺 Visite Antropometriche & Plicometria
            </Text>
            <Text style={{ fontSize: 12, color: '#0284C7' }}>
              Modello a 4 compartimenti (Grasso, Muscolo, Ossa, Liquidi - Stile FITcompX)
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {(cur.visite_antropometriche || []).length >= 1 ? (
              <TouchableOpacity
                style={[
                  s.btn,
                  {
                    marginTop: 0,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    backgroundColor: '#10B981',
                    borderColor: '#059669',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                  },
                ]}
                onPress={() => setShowComparisonModal(true)}
              >
                <Text style={[s.btnTxt, { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }]}>
                  🖥️ Mostra Confronto al Paziente
                </Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[s.btn, { marginTop: 0, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#0284C7', borderColor: '#0369A1' }]}
              onPress={handleOpenAntropoModal}
            >
              <Text style={[s.btnTxt, { color: '#FFFFFF', fontSize: 12 }]}>+ Nuova Visita</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Toggle Visibilità Referto al Paziente */}
        <TouchableOpacity
          onPress={() => {
            const nextVal = !cur.ha_antropometria;
            setCur({
              ...cur,
              ha_antropometria: nextVal,
              piano_dati: { ...(cur.piano_dati || {}), ha_antropometria: nextVal },
            });
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: cur.ha_antropometria ? '#DCFCE7' : '#FFFFFF',
            borderWidth: 1,
            borderColor: cur.ha_antropometria ? '#86EFAC' : '#CBD5E1',
            borderRadius: 8,
            padding: 10,
            marginTop: 10,
          }}
        >
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              borderWidth: 1.5,
              borderColor: cur.ha_antropometria ? '#15803D' : '#94A3B8',
              backgroundColor: cur.ha_antropometria ? '#15803D' : '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {cur.ha_antropometria ? <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>✓</Text> : null}
          </View>
          <Text style={{ fontSize: 12, fontWeight: '600', color: cur.ha_antropometria ? '#166534' : '#64748B' }}>
            {cur.ha_antropometria
              ? '📊 Referto Composizione Corporea ATTIVO e visibile nell’app del paziente'
              : '🙈 Referto Composizione Corporea NASCOSTO (paziente senza visita plicometrica)'}
          </Text>
        </TouchableOpacity>

        {/* Storico Visite Registrate */}
        <View style={{ marginTop: 12 }}>
          <Text style={[s.lbl, { color: '#0369A1' }]}>
            Storico Visite ({(cur.visite_antropometriche || []).length}):
          </Text>
          {(cur.visite_antropometriche || []).length === 0 ? (
            <Text style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic', marginTop: 4 }}>
              Nessuna visita antropometrica ancora registrata. Tocca "+ Nuova Visita" per inserire pliche, circonferenze e diametri.
            </Text>
          ) : (
            (cur.visite_antropometriche || []).map((v, vIdx) => {
              const r = v.risultati || {};
              return (
                <View
                  key={v.id || vIdx}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#BAE6FD',
                    borderRadius: 8,
                    padding: 10,
                    marginTop: 6,
                  }}
                >
                  <View style={s.rowBet}>
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0F172A' }}>
                      📅 Visita del {v.data} ({r.peso || cur.peso_visita} kg)
                    </Text>
                    <TouchableOpacity onPress={() => handleDeleteVisit(v.id)} style={{ padding: 2 }}>
                      <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: 'bold' }}>🗑️ Elimina</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={{ fontSize: 12, color: '#334155', marginTop: 4 }}>
                    • Grasso: <Text style={{ fontWeight: 'bold' }}>{r.grasso?.pct ?? '-'}%</Text> ({r.grasso?.kg ?? '-'} kg) • Muscolo: <Text style={{ fontWeight: 'bold' }}>{r.muscolo?.pct ?? '-'}%</Text> ({r.muscolo?.kg ?? '-'} kg)
                  </Text>
                  <Text style={{ fontSize: 11.5, color: '#1E293B', marginTop: 2 }}>
                    🔥 BMR FITcompX: <Text style={{ fontWeight: 'bold', color: '#166534' }}>{r.metabolismo?.bmrFITcompX ?? '-'} kcal</Text> • BMR Harris-Benedict: <Text style={{ fontWeight: 'bold', color: '#1D4ED8' }}>{r.metabolismo?.bmrHarrisBenedict ?? '-'} kcal</Text>
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {r.metabolismo?.bmrFITcompX ? (
                      <TouchableOpacity
                        onPress={() => {
                          const bmrVal = String(r.metabolismo.bmrFITcompX);
                          updPianoRoot('bmr_base', bmrVal);
                          setAntropoSuccessMsg(`✅ BMR FITcompX applicato al piano: ${bmrVal} kcal!`);
                          setTimeout(() => setAntropoSuccessMsg(''), 2500);
                        }}
                        style={{ backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#86EFAC' }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#166534' }}>
                          ⚡ Applica FITcompX ({r.metabolismo.bmrFITcompX} kcal)
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                    {r.metabolismo?.bmrHarrisBenedict ? (
                      <TouchableOpacity
                        onPress={() => {
                          const bmrVal = String(r.metabolismo.bmrHarrisBenedict);
                          updPianoRoot('bmr_base', bmrVal);
                          setAntropoSuccessMsg(`✅ BMR Harris-Benedict applicato al piano: ${bmrVal} kcal!`);
                          setTimeout(() => setAntropoSuccessMsg(''), 2500);
                        }}
                        style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#93C5FD' }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1D4ED8' }}>
                          📊 Applica Harris-Benedict ({r.metabolismo.bmrHarrisBenedict} kcal)
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {antropoSuccessMsg ? (
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#15803D', textAlign: 'center', marginTop: 8 }}>
            {antropoSuccessMsg}
          </Text>
        ) : null}
      </View>

      {/* ─── 3. PARAMETRI NUTRIZIONALI & BASALE ─────────────────────────── */}
      <View style={s.card}>
        <Text style={s.sec}>
          3. Parametri: {metodo === 'BENESSERE' ? '🌱 Benessere' : metodo === 'FITNESS' ? '⚡ Fitness' : '🔥 Atleta'}
        </Text>

        {/* ─── FABBISOGNO BASALE (BMR & LAF) COMUNE A TUTTI I PROFILI ─────── */}
        <View style={[s.wBox, { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', marginBottom: 14 }]}>
          <Text style={[s.bold, { color: '#0F172A', fontSize: 13, marginBottom: 6 }]}>
            ⚙️ Fabbisogno Basale & Livello di Attività (BMR & LAF):
          </Text>
          <View style={s.row}>
            <View style={s.col}>
              <Text style={s.lbl}>Basale / BMR (kcal):</Text>
              <TextInput
                style={s.inp}
                keyboardType="numeric"
                value={String(cur.piano_dati?.bmr_base ?? '1500')}
                onChangeText={(v) => updPianoRoot('bmr_base', v)}
              />
            </View>
            <View style={s.col}>
              <Text style={s.lbl}>Moltiplicatore LAF:</Text>
              <TextInput
                style={s.inp}
                keyboardType="numeric"
                value={String(cur.piano_dati?.coeff_laf ?? '1.2')}
                onChangeText={(v) => updPianoRoot('coeff_laf', v)}
              />
            </View>
          </View>
          <Text style={[s.txt, { fontWeight: 'bold', color: LIME_TEXT, marginTop: 6 }]}>
            Basale stimato: {curBmr} × {curLaf} = ~{bmrLafKcal} kcal/giorno
          </Text>
        </View>

        {/* ─── CASO 1: BENESSERE ────────────────────────────────────────── */}
        {metodo === 'BENESSERE' ? (
          <View style={{ marginTop: 4 }}>
            <Text style={[s.bold, { color: LIME_TEXT, marginBottom: 4 }]}>
              🌱 Target Giornaliero Macro & Calorie:
            </Text>

            {(() => {
              const p = safeNum(cur.piano_dati?.target_benessere?.p || 130);
              const f = safeNum(cur.piano_dati?.target_benessere?.f || 55);
              const c = safeNum(cur.piano_dati?.target_benessere?.c || 180);
              const pKcal = Math.round(p * 4);
              const fKcal = Math.round(f * 9);
              const cKcal = Math.round(c * 4);
              const totKcal = pKcal + fKcal + cKcal;
              const pPct = totKcal > 0 ? Math.round((pKcal / totKcal) * 100) : 0;
              const fPct = totKcal > 0 ? Math.round((fKcal / totKcal) * 100) : 0;
              const cPct = totKcal > 0 ? Math.round((cKcal / totKcal) * 100) : 0;
              const waterEst = ((startWeight * 32) / 1000).toFixed(1);
              const deltaBmr = totKcal - bmrLafKcal;

              return (
                <View>
                  <View style={s.row}>
                    <View style={s.col}>
                      <Text style={s.lbl}>Prot P (g):</Text>
                      <TextInput
                        style={s.inp}
                        keyboardType="numeric"
                        value={String(cur.piano_dati?.target_benessere?.p ?? '130')}
                        onChangeText={(v) => updPiano('target_benessere', 'p', v)}
                      />
                      <Text style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                        {pKcal} kcal ({pPct}%)
                      </Text>
                      <Text style={{ fontSize: 10, color: '#64748B' }}>
                        {M.calcGPerKg(p, startWeight)} g/kg
                      </Text>
                    </View>

                    <View style={s.col}>
                      <Text style={s.lbl}>Grassi L (g):</Text>
                      <TextInput
                        style={s.inp}
                        keyboardType="numeric"
                        value={String(cur.piano_dati?.target_benessere?.f ?? '55')}
                        onChangeText={(v) => updPiano('target_benessere', 'f', v)}
                      />
                      <Text style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                        {fKcal} kcal ({fPct}%)
                      </Text>
                      <Text style={{ fontSize: 10, color: '#64748B' }}>
                        {M.calcGPerKg(f, startWeight)} g/kg
                      </Text>
                    </View>

                    <View style={s.col}>
                      <Text style={s.lbl}>Carbo C (g):</Text>
                      <TextInput
                        style={s.inp}
                        keyboardType="numeric"
                        value={String(cur.piano_dati?.target_benessere?.c ?? '180')}
                        onChangeText={(v) => updPiano('target_benessere', 'c', v)}
                      />
                      <Text style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                        {cKcal} kcal ({cPct}%)
                      </Text>
                      <Text style={{ fontSize: 10, color: '#64748B' }}>
                        {M.calcGPerKg(c, startWeight)} g/kg
                      </Text>
                    </View>
                  </View>

                  <View style={[s.wBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', marginTop: 10 }]}>
                    <Text style={[s.bold, { fontSize: 14, color: '#166534' }]}>
                      🔥 Totale: {totKcal} kcal/die (P: {pKcal} • L: {fKcal} • C: {cKcal} kcal)
                    </Text>
                    <Text style={[s.txt, { fontSize: 12, color: '#15803D', marginTop: 2 }]}>
                      Bilancio vs Fabbisogno ({bmrLafKcal} kcal):{' '}
                      {deltaBmr > 0 ? `+${deltaBmr} kcal (surplus)` : deltaBmr < 0 ? `${deltaBmr} kcal (deficit)` : 'In pareggio'}
                    </Text>
                    <Text style={[s.txt, { fontSize: 11, color: '#64748B', marginTop: 2 }]}>
                      💧 Idratazione stimata: {waterEst} L/giorno
                    </Text>
                  </View>
                </View>
              );
            })()}

            <View style={{ marginTop: 12 }}>
              <Text style={s.lbl}>Target Passi Giornalieri (NEAT):</Text>
              <TextInput
                style={s.tInp}
                keyboardType="numeric"
                placeholder="es. 8000 o 10000"
                value={String(cur.passi_target ?? 8000)}
                onChangeText={(v) => setCur({ ...cur, passi_target: parseInt(v, 10) || 0 })}
              />
            </View>
          </View>
        ) : null}

        {/* ─── CASO 2: FITNESS / AMATORIALE ─────────────────────────────── */}
        {metodo === 'FITNESS' ? (
          <View style={{ marginTop: 4 }}>
            <Text style={[s.bold, { color: LIME_TEXT, marginBottom: 4 }]}>
              🛌 Giorno di Riposo (Base):
            </Text>

            {(() => {
              const p = safeNum(cur.piano_dati?.riposo_fitness?.p || 140);
              const f = safeNum(cur.piano_dati?.riposo_fitness?.f || 60);
              const c = safeNum(cur.piano_dati?.riposo_fitness?.c || 160);
              const pKcal = Math.round(p * 4);
              const fKcal = Math.round(f * 9);
              const cKcal = Math.round(c * 4);
              const totKcal = pKcal + fKcal + cKcal;
              const pPct = totKcal > 0 ? Math.round((pKcal / totKcal) * 100) : 0;
              const fPct = totKcal > 0 ? Math.round((fKcal / totKcal) * 100) : 0;
              const cPct = totKcal > 0 ? Math.round((cKcal / totKcal) * 100) : 0;

              return (
                <View>
                  <View style={s.row}>
                    <View style={s.col}>
                      <Text style={s.lbl}>Prot P (g):</Text>
                      <TextInput
                        style={s.inp}
                        keyboardType="numeric"
                        value={String(cur.piano_dati?.riposo_fitness?.p ?? '140')}
                        onChangeText={(v) => updPiano('riposo_fitness', 'p', v)}
                      />
                      <Text style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{pKcal} kcal ({pPct}%)</Text>
                    </View>
                    <View style={s.col}>
                      <Text style={s.lbl}>Grassi L (g):</Text>
                      <TextInput
                        style={s.inp}
                        keyboardType="numeric"
                        value={String(cur.piano_dati?.riposo_fitness?.f ?? '60')}
                        onChangeText={(v) => updPiano('riposo_fitness', 'f', v)}
                      />
                      <Text style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{fKcal} kcal ({fPct}%)</Text>
                    </View>
                    <View style={s.col}>
                      <Text style={s.lbl}>Carbo C (g):</Text>
                      <TextInput
                        style={s.inp}
                        keyboardType="numeric"
                        value={String(cur.piano_dati?.riposo_fitness?.c ?? '160')}
                        onChangeText={(v) => updPiano('riposo_fitness', 'c', v)}
                      />
                      <Text style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{cKcal} kcal ({cPct}%)</Text>
                    </View>
                  </View>

                  <View style={[s.wBox, { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', marginTop: 6 }]}>
                    <Text style={[s.bold, { color: '#0F172A', fontSize: 13 }]}>
                      Riposo: {totKcal} kcal (P: {pKcal} • L: {fKcal} • C: {cKcal} kcal)
                    </Text>
                    <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                      P: {M.calcGPerKg(p, startWeight)} • L: {M.calcGPerKg(f, startWeight)} • C: {M.calcGPerKg(c, startWeight)} g/kg
                    </Text>
                  </View>
                </View>
              );
            })()}

            <View style={{ marginTop: 14 }}>
              <View style={s.rowBet}>
                <Text style={[s.bold, { color: LIME_TEXT }]}>🔥 Tipologie Giorni di Allenamento (Fino a 10):</Text>
                {(cur.piano_dati?.workouts_fitness || []).length < 10 ? (
                  <TouchableOpacity onPress={handleAddWorkout}>
                    <Text style={{ color: LIME_TEXT, fontWeight: 'bold', fontSize: 13 }}>+ Aggiungi Tipo (max 10)</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {(cur.piano_dati?.workouts_fitness || []).map((w, idx) => {
                const baseP = safeNum(cur.piano_dati?.riposo_fitness?.p || 140);
                const baseF = safeNum(cur.piano_dati?.riposo_fitness?.f || 60);
                const baseC = safeNum(cur.piano_dati?.riposo_fitness?.c || 160);
                const restKcal = (baseP * 4) + (baseF * 9) + (baseC * 4);

                let p = w.p !== undefined && w.p !== '' ? safeNum(w.p) : null;
                let f = w.f !== undefined && w.f !== '' ? safeNum(w.f) : null;
                let c = w.c !== undefined && w.c !== '' ? safeNum(w.c) : null;

                if (p === null || f === null || c === null) {
                  const deltaKcal = safeNum(w.delta_kcal) || 350;
                  p = baseP + Math.round((deltaKcal * 0.20) / 4);
                  f = baseF + Math.round((deltaKcal * 0.20) / 9);
                  c = baseC + Math.round((deltaKcal * 0.60) / 4);
                }

                const pKcal = Math.round(p * 4);
                const fKcal = Math.round(f * 9);
                const cKcal = Math.round(c * 4);
                const totKcal = pKcal + fKcal + cKcal;
                const pPct = totKcal > 0 ? Math.round((pKcal / totKcal) * 100) : 0;
                const fPct = totKcal > 0 ? Math.round((fKcal / totKcal) * 100) : 0;
                const cPct = totKcal > 0 ? Math.round((cKcal / totKcal) * 100) : 0;
                const diffKcal = totKcal - restKcal;

                return (
                  <View key={w.id || idx} style={[s.card, { marginTop: 10, padding: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1' }]}>
                    <View style={s.rowBet}>
                      <TextInput
                        style={[s.bold, { flex: 1, fontSize: 14, color: '#0F172A', borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 4 }]}
                        value={w.nome}
                        placeholder={`Allenamento ${idx + 1}`}
                        onChangeText={(v) => handleUpdWorkout(w.id, 'nome', v)}
                      />
                      {(cur.piano_dati?.workouts_fitness || []).length > 1 ? (
                        <TouchableOpacity onPress={() => handleRemoveWorkout(w.id)} style={{ paddingLeft: 8 }}>
                          <Text style={{ color: '#E53E3E', fontWeight: 'bold' }}>✕ Rimuovi</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    {/* Macro Inputs per questo giorno di allenamento */}
                    <View style={[s.row, { marginTop: 8 }]}>
                      <View style={s.col}>
                        <Text style={s.lbl}>Prot P (g):</Text>
                        <TextInput
                          style={s.inp}
                          keyboardType="numeric"
                          value={String(w.p !== undefined ? w.p : p)}
                          onChangeText={(v) => handleUpdWorkout(w.id, 'p', v)}
                        />
                        <Text style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{pKcal} kcal ({pPct}%)</Text>
                      </View>
                      <View style={s.col}>
                        <Text style={s.lbl}>Grassi L (g):</Text>
                        <TextInput
                          style={s.inp}
                          keyboardType="numeric"
                          value={String(w.f !== undefined ? w.f : f)}
                          onChangeText={(v) => handleUpdWorkout(w.id, 'f', v)}
                        />
                        <Text style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{fKcal} kcal ({fPct}%)</Text>
                      </View>
                      <View style={s.col}>
                        <Text style={s.lbl}>Carbo C (g):</Text>
                        <TextInput
                          style={s.inp}
                          keyboardType="numeric"
                          value={String(w.c !== undefined ? w.c : c)}
                          onChangeText={(v) => handleUpdWorkout(w.id, 'c', v)}
                        />
                        <Text style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{cKcal} kcal ({cPct}%)</Text>
                      </View>
                    </View>

                    {/* Box Riepilogo Calorie e Surplus rispetto al Riposo */}
                    <View style={[s.wBox, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC', marginTop: 4, marginBottom: 4, padding: 8 }]}>
                      <View style={s.rowBet}>
                        <Text style={[s.bold, { color: '#166534', fontSize: 12.5 }]}>
                          Totale: ~{totKcal} kcal ({diffKcal >= 0 ? `+${diffKcal}` : diffKcal} kcal vs Riposo)
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            // Reimposta stima di default bilanciata (+15g P, +8g F, +55g C)
                            handleUpdWorkout(w.id, 'p', String(Math.round(baseP + 15)));
                            handleUpdWorkout(w.id, 'f', String(Math.round(baseF + 8)));
                            handleUpdWorkout(w.id, 'c', String(Math.round(baseC + 55)));
                          }}
                          style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#86EFAC' }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#166534' }}>⚡ Reset Stima (+350 kcal)</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={{ fontSize: 10.5, color: '#15803D', marginTop: 2 }}>
                        P: {M.calcGPerKg(p, startWeight)} • L: {M.calcGPerKg(f, startWeight)} • C: {M.calcGPerKg(c, startWeight)} g/kg • Acqua: +500ml
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* ─── CASO 3: ATLETA / PERFORMANCE ─────────────────────────────── */}
        {metodo === 'ATLETA' ? (
          <View style={{ marginTop: 4 }}>
            <View style={{ marginTop: 8 }}>
              <Text style={[s.bold, { color: LIME_TEXT }]}>📅 Creazione Microciclo a Date Reali:</Text>
              <View style={s.row}>
                <View style={{ flex: 2 }}>
                  <Text style={s.lbl}>Data Inizio (GG/MM/AAAA):</Text>
                  <TextInput
                    style={s.inp}
                    placeholder="es. 26/11/2026"
                    value={athStartDate}
                    onChangeText={setAthStartDate}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={s.lbl}>N° Giorni:</Text>
                  <TextInput
                    style={s.inp}
                    keyboardType="numeric"
                    value={athNumDays}
                    onChangeText={setAthNumDays}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[s.sBtn, { backgroundColor: LIME_SOFT, borderColor: LIME_DARK, marginTop: 8 }]}
                onPress={handleRegenerateAthleteCycle}
              >
                <Text style={[s.sBtnTxt, { color: LIME_TEXT }]}>
                  📅 Genera / Ricalcola Microciclo ({athNumDays} giorni)
                </Text>
              </TouchableOpacity>
            </View>

            {dupFeedback ? (
              <View style={{ marginTop: 8, padding: 8, backgroundColor: '#DCFCE7', borderRadius: 6, borderWidth: 1, borderColor: '#86EFAC' }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#166534' }}>{dupFeedback}</Text>
              </View>
            ) : null}

            <View style={{ marginTop: 14 }}>
              <Text style={[s.bold, { color: '#0F172A', marginBottom: 6 }]}>
                Tabella Giornate Microciclo ({(cur.piano_dati?.giorni_atleta || []).length} giorni):
              </Text>

              {(cur.piano_dati?.giorni_atleta || []).map((g, idx) => {
                const b = safeNum(cur.piano_dati?.bmr_base) || 1500;
                const c = safeNum(cur.piano_dati?.coeff_laf) || 1.2;
                const kj = safeNum(g.kj) || 0;
                const totKcalEst = Math.round((b * c) + kj);

                const ore = safeNum(g.intra?.ore) || 0;
                const gh = safeNum(g.intra?.gh_carbo) || 0;
                const intraC = Math.round(ore * gh);

                // Calcolo post workout
                const postP = safeNum(g.recovery?.p || 30);
                const postC = safeNum(g.recovery?.c || 40);
                const postF = safeNum(g.recovery?.f || 2);
                const postKcal = Math.round((postP * 4) + (postC * 4) + (postF * 9));

                // Macro target
                const totP = safeNum(g.target_macro?.p) || Math.round(startWeight * 1.8);
                const totF = safeNum(g.target_macro?.f) || Math.round(startWeight * 0.9);
                const totC = safeNum(g.target_macro?.c) || Math.max(100, Math.round((totKcalEst - (totP * 4) - (totF * 9)) / 4));
                const pKcal = Math.round(totP * 4);
                const fKcal = Math.round(totF * 9);
                const cKcal = Math.round(totC * 4);
                const totKcalMacro = pKcal + fKcal + cKcal;
                const pPct = totKcalMacro > 0 ? Math.round((pKcal / totKcalMacro) * 100) : 0;
                const fPct = totKcalMacro > 0 ? Math.round((fKcal / totKcalMacro) * 100) : 0;
                const cPct = totKcalMacro > 0 ? Math.round((cKcal / totKcalMacro) * 100) : 0;

                const isDupOpen = dupSourceIdx === idx;

                return (
                  <View key={g.id || idx} style={[s.card, { marginTop: 10, padding: 12, backgroundColor: '#F8FAFC' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                      <TextInput
                        style={[s.bold, { flex: 1, minWidth: 140, fontSize: 15, color: LIME_TEXT, paddingVertical: 4 }]}
                        value={g.nome}
                        onChangeText={(v) => handleUpdAthleteDay(idx, 'nome', v)}
                      />
                      <TouchableOpacity
                        onPress={() => setDupSourceIdx(isDupOpen ? null : idx)}
                        style={{ flexShrink: 0, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: isDupOpen ? '#DBEAFE' : '#FFFFFF', borderRadius: 6, borderWidth: 1, borderColor: '#3B82F6' }}
                      >
                        <Text style={{ color: '#1D4ED8', fontSize: 12, fontWeight: 'bold' }}>
                          {isDupOpen ? '✕ Chiudi' : '📋 Duplica'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* SELETTORE DESTINAZIONE DUPLICAZIONE (Mantiene nome e data del giorno scelto) */}
                    {isDupOpen ? (
                      <View style={{ backgroundColor: '#EFF6FF', borderColor: '#3B82F6', borderWidth: 1.5, borderRadius: 8, padding: 10, marginVertical: 8 }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1E40AF', marginBottom: 4 }}>
                          📋 Duplica parametri di "{g.nome}" in:
                        </Text>
                        <Text style={{ fontSize: 11, color: '#1E3A8A', marginBottom: 8 }}>
                          Tocca il giorno di destinazione (il nome e la data del giorno scelto non cambieranno):
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                          {(cur.piano_dati?.giorni_atleta || []).map((targetDay, tIdx) => {
                            if (tIdx === idx) return null;
                            return (
                              <TouchableOpacity
                                key={targetDay.id || tIdx}
                                style={{ backgroundColor: '#FFFFFF', borderColor: '#3B82F6', borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 }}
                                onPress={() => handleCopyParamsToDay(idx, tIdx)}
                              >
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1D4ED8' }}>
                                  👉 {targetDay.nome}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                          <TouchableOpacity
                            style={{ backgroundColor: '#1E40AF', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 }}
                            onPress={() => handleCopyParamsToAllDays(idx)}
                          >
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#FFFFFF' }}>
                              🌟 Tutti gli altri giorni
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : null}

                    <Text style={[s.lbl, { marginTop: 4 }]}>Data: {g.data}</Text>

                    {/* 1. Spesa Energetica & Fabbisogno Stimato */}
                    <View style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 10, marginTop: 6 }}>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#334155', marginBottom: 4 }}>
                        ⚡ Spesa Energetica & Fabbisogno Stimato:
                      </Text>
                      <View style={s.row}>
                        <View style={s.col}>
                          <Text style={s.lbl}>Spesa Energetica (kJ):</Text>
                          <TextInput
                            style={s.inp}
                            keyboardType="numeric"
                            value={String(g.kj ?? 0)}
                            onChangeText={(v) => handleUpdAthleteDay(idx, 'kj', v)}
                          />
                        </View>
                        <View style={s.col}>
                          <Text style={s.lbl}>Fabbisogno Stimato:</Text>
                          <Text style={[s.bold, { fontSize: 15, color: '#0F172A', marginTop: 8 }]}>
                            ~{totKcalEst} kcal
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* 2. Intra-Workout (nella borraccia) */}
                    <View style={{ backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FCD34D', borderRadius: 8, padding: 10, marginTop: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#B45309', marginBottom: 4 }}>
                        🚴 Intra-Workout (nella borraccia):
                      </Text>
                      <View style={s.row}>
                        <View style={{ flex: 1 }}>
                          <Text style={s.lbl}>Ore allenamento:</Text>
                          <TextInput
                            style={s.inp}
                            keyboardType="numeric"
                            value={String(g.intra?.ore ?? 0)}
                            onChangeText={(v) => handleUpdAthleteNested(idx, 'intra', 'ore', v)}
                          />
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={s.lbl}>g/h Carboidrati:</Text>
                          <TextInput
                            style={s.inp}
                            keyboardType="numeric"
                            value={String(g.intra?.gh_carbo ?? 0)}
                            onChangeText={(v) => handleUpdAthleteNested(idx, 'intra', 'gh_carbo', v)}
                          />
                        </View>
                      </View>
                      {intraC > 0 ? (
                        <Text style={{ fontSize: 11, color: '#92400E', fontWeight: 'bold', marginTop: 4 }}>
                          🍶 Totale borraccia: {intraC}g carboidrati ({g.intra?.nome || 'Maltodestrine/Gel'})
                        </Text>
                      ) : null}
                    </View>

                    {/* 3. Post-Workout Recovery Shake con Scelta Grammi P, C, F e Preset */}
                    <View style={{ backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#86EFAC', borderRadius: 8, padding: 10, marginTop: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#166534', marginBottom: 4 }}>
                        🥤 Post-Workout Recovery (Carboidrati & Proteine):
                      </Text>

                      {/* Preset rapidi per il recovery */}
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginVertical: 4 }}>
                        {M.POST_WORKOUT_PRESETS.map((pst, pIdx) => (
                          <TouchableOpacity
                            key={pIdx}
                            style={{ backgroundColor: '#DCFCE7', borderColor: '#4ADE80', borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}
                            onPress={() => handleApplyPostWorkoutPreset(idx, pst)}
                          >
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#14532D' }}>{pst.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      <TextInput
                        style={[s.tInp, { marginTop: 2, backgroundColor: '#FFFFFF' }]}
                        placeholder="Shake post-workout (es. Recovery Shake 40C/30P)"
                        value={g.recovery?.nome || ''}
                        onChangeText={(v) => handleUpdAthleteNested(idx, 'recovery', 'nome', v)}
                        autoComplete="one-time-code"
                        textContentType="none"
                        autoCorrect={false}
                        spellCheck={false}
                        importantForAutofill="no"
                        inputMode="search"
                      />

                      <View style={s.row}>
                        <View style={s.col}>
                          <Text style={s.lbl}>Prot Recovery (g):</Text>
                          <TextInput
                            style={s.inp}
                            keyboardType="numeric"
                            value={String(g.recovery?.p ?? '30')}
                            onChangeText={(v) => handleUpdAthleteNested(idx, 'recovery', 'p', v)}
                          />
                        </View>
                        <View style={s.col}>
                          <Text style={s.lbl}>Carbo Recovery (g):</Text>
                          <TextInput
                            style={s.inp}
                            keyboardType="numeric"
                            value={String(g.recovery?.c ?? '40')}
                            onChangeText={(v) => handleUpdAthleteNested(idx, 'recovery', 'c', v)}
                          />
                        </View>
                        <View style={s.col}>
                          <Text style={s.lbl}>Grassi (g):</Text>
                          <TextInput
                            style={s.inp}
                            keyboardType="numeric"
                            value={String(g.recovery?.f ?? '2')}
                            onChangeText={(v) => handleUpdAthleteNested(idx, 'recovery', 'f', v)}
                          />
                        </View>
                      </View>
                      <Text style={{ fontSize: 11, color: '#15803D', fontWeight: 'bold', marginTop: 4 }}>
                        Apporto Shake: ~{postKcal} kcal ({postP}g P • {postC}g C • {postF}g L)
                      </Text>
                    </View>

                    {/* 4. Target Macro Dottore con Dettaglio Kcal per Macro e Totale */}
                    <View style={{ backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#93C5FD', borderRadius: 8, padding: 10, marginTop: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1D4ED8', marginBottom: 4 }}>
                        🎯 Target Macro Giornata:
                      </Text>
                      <View style={s.row}>
                        <View style={s.col}>
                          <Text style={s.lbl}>Prot P (g):</Text>
                          <TextInput
                            style={s.inp}
                            keyboardType="numeric"
                            value={String(g.target_macro?.p ?? totP)}
                            onChangeText={(v) => handleUpdAthleteNested(idx, 'target_macro', 'p', v)}
                          />
                          <Text style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                            {pKcal} kcal ({pPct}%)
                          </Text>
                          <Text style={{ fontSize: 10, color: '#64748B' }}>
                            {M.calcGPerKg(totP, startWeight)} g/kg
                          </Text>
                        </View>
                        <View style={s.col}>
                          <Text style={s.lbl}>Grassi L (g):</Text>
                          <TextInput
                            style={s.inp}
                            keyboardType="numeric"
                            value={String(g.target_macro?.f ?? totF)}
                            onChangeText={(v) => handleUpdAthleteNested(idx, 'target_macro', 'f', v)}
                          />
                          <Text style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                            {fKcal} kcal ({fPct}%)
                          </Text>
                          <Text style={{ fontSize: 10, color: '#64748B' }}>
                            {M.calcGPerKg(totF, startWeight)} g/kg
                          </Text>
                        </View>
                        <View style={s.col}>
                          <Text style={s.lbl}>Carbo C (g):</Text>
                          <TextInput
                            style={s.inp}
                            keyboardType="numeric"
                            value={String(g.target_macro?.c ?? totC)}
                            onChangeText={(v) => handleUpdAthleteNested(idx, 'target_macro', 'c', v)}
                          />
                          <Text style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                            {cKcal} kcal ({cPct}%)
                          </Text>
                          <Text style={{ fontSize: 10, color: '#64748B' }}>
                            {M.calcGPerKg(totC, startWeight)} g/kg
                          </Text>
                        </View>
                      </View>

                      <View style={[s.wBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', marginTop: 8 }]}>
                        <Text style={[s.bold, { fontSize: 13, color: '#166534' }]}>
                          🔥 Totale Macro Giornata: {totKcalMacro} kcal (P: {pKcal} • L: {fKcal} • C: {cKcal} kcal)
                        </Text>
                        <Text style={{ fontSize: 11, color: '#15803D', marginTop: 1 }}>
                          Fabbisogno Stimato con kJ: ~{totKcalEst} kcal
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>

      {/* ─── 4. NOTE CLINICHE DEL NUTRIZIONISTA ──────────────────────────── */}
      <View style={s.card}>
        <View style={s.rowBet}>
          <Text style={s.sec}>4. Note Nutrizionali per il Paziente</Text>
          <TouchableOpacity
            onPress={() => setCur({ ...cur, mostra_note_dottore: cur.mostra_note_dottore === false ? true : false })}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: cur.mostra_note_dottore !== false ? '#DCFCE7' : '#F1F5F9',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: cur.mostra_note_dottore !== false ? '#86EFAC' : '#CBD5E1',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: cur.mostra_note_dottore !== false ? '#166534' : '#64748B' }}>
              {cur.mostra_note_dottore !== false ? '👁️ VISIBILI NEL PIANO' : '🙈 NASCOSTE NEL PIANO'}
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={[s.tInp, { minHeight: 70, textAlignVertical: 'top' }]}
          multiline
          placeholder="Indicazioni generali, idratazione, orari pasti, raccomandazioni..."
          value={cur.note_dottore || ''}
          onChangeText={(v) => setCur({ ...cur, note_dottore: v })}
        />

        {/* ─── NOTE PRIVATE RISERVATE DEL DOTTORE ─── */}
        <View style={{ marginTop: 12, padding: 12, backgroundColor: '#FEFCE8', borderWidth: 1.5, borderColor: '#F59E0B', borderRadius: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Text style={{ fontSize: 14 }}>🔒</Text>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#92400E' }}>
              Note Private Cliniche (Riservate a te - MAI visibili al paziente)
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: '#B45309', marginBottom: 6 }}>
            Scrivi qui anamnesi, patologie, impressioni, obiettivi e promemoria per i controlli futuri. Restano sempre visibili quando prepari o aggiorni il piano.
          </Text>
          <TextInput
            style={[s.tInp, { minHeight: 70, textAlignVertical: 'top', backgroundColor: '#FFFFFF', borderColor: '#FDE68A' }]}
            multiline
            placeholder="Es. Riferisce gonfiore coi legumi, monitorare aderenza, esami tiroidei da richiedere..."
            value={cur.note_private_dottore || ''}
            onChangeText={(v) => setCur({ ...cur, note_private_dottore: v })}
          />
        </View>
      </View>

      {/* ─── 5. PROTOCOLLO INTEGRATORI CON MEMORIA FREQUENTI ────────────── */}
      <View style={s.card}>
        <Text style={s.sec}>5. Protocollo Integratori</Text>

        {/* Memoria integratori frequenti del dottore */}
        <Text style={[s.lbl, { fontWeight: 'bold', color: LIME_TEXT }]}>
          ⭐ I tuoi Integratori Frequenti (Tocca per compilare rapido, ✕ per rimuovere):
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginVertical: 6 }}>
          {docSuppLibrary.map((pst, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F0FDF4',
                borderColor: '#86EFAC',
                borderWidth: 1,
                borderRadius: 20,
                paddingLeft: 10,
                paddingRight: 6,
                paddingVertical: 4,
              }}
            >
              <TouchableOpacity onPress={() => handleSelectSuppPreset(pst)}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#166534' }}>
                  +{pst.nome} ({pst.dose})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteFromLibrary(pst.nome)}
                style={{ marginLeft: 6, padding: 2 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <View style={{ gap: 6, marginTop: 4 }}>
          <TextInput
            style={s.tInp}
            placeholder="Cerca integratore (es. Creatina, Omega 3, Vitamina D)"
            value={newIntNome}
            onChangeText={setNewIntNome}
            autoComplete="one-time-code"
            textContentType="none"
            autoCorrect={false}
            spellCheck={false}
            importantForAutofill="no"
            inputMode="search"
            name="search_supplements"
            id="search_supplements"
          />

          {/* Suggerimenti reattivi mentre il dottore digita */}
          {filteredSuppSuggestions.length > 0 && (
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#CBD5E1',
                borderRadius: 8,
                padding: 4,
                marginTop: -2,
                marginBottom: 4,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Text style={{ fontSize: 10, color: '#64748B', fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2 }}>
                SUGGERIMENTI DALLA TUA MEMORIA (TOCCA PER SELEZIONARE):
              </Text>
              {filteredSuppSuggestions.slice(0, 5).map((sug, sIdx) => (
                <TouchableOpacity
                  key={sIdx}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    borderBottomWidth: sIdx === Math.min(filteredSuppSuggestions.length, 5) - 1 ? 0 : 1,
                    borderColor: '#F1F5F9',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onPress={() => handleSelectSuppPreset(sug)}
                >
                  <Text style={{ fontSize: 13, color: '#0F172A', fontWeight: '600' }}>
                    🔍 {sug.nome} <Text style={{ color: '#64748B', fontWeight: 'normal' }}>({sug.dose})</Text>
                  </Text>
                  <Text style={{ fontSize: 11, color: '#16A34A', fontWeight: 'bold' }}>Seleziona</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <TextInput
                style={s.tInp}
                placeholder="Dose (es. 5g, 2 cps)"
                value={newIntDose}
                onChangeText={setNewIntDose}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {M.MOMENTI_INTEGRATORI.slice(0, 4).map((m) => {
                  const mId = Array.isArray(m) ? m[0] : m.id;
                  const mLabel = Array.isArray(m) ? m[1] : m.label;
                  const sel = newIntMomento === mId;
                  return (
                    <TouchableOpacity
                      key={mId}
                      style={[s.chip, sel && s.chipAct, { paddingVertical: 4, paddingHorizontal: 6 }]}
                      onPress={() => setNewIntMomento(mId)}
                    >
                      <Text style={[s.cTxt, sel && s.cTxtAct, { fontSize: 10 }]}>{mLabel.split(' ')[0]}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[s.sBtn, { backgroundColor: LIME_SOFT, borderColor: LIME_DARK, marginTop: 4 }]}
            onPress={handleAddIntegratore}
          >
            <Text style={[s.sBtnTxt, { color: LIME_TEXT }]}>+ Aggiungi Integratore alla Scheda</Text>
          </TouchableOpacity>
        </View>

        {(cur.integratori || []).length > 0 ? (
          <View style={{ marginTop: 10 }}>
            {cur.integratori.map((it) => {
              const mEntry = M.MOMENTI_INTEGRATORI.find((m) => (Array.isArray(m) ? m[0] === it.momento : m.id === it.momento));
              const mLabel = Array.isArray(mEntry) ? mEntry[1] : (mEntry?.label || it.momento);
              return (
                <View
                  key={it.id}
                  style={[s.rowBet, { paddingVertical: 6, borderBottomWidth: 1, borderColor: '#F1F5F9' }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[s.bold, { fontSize: 13 }]}>{it.nome} ({it.dose || it.dosaggio || 'standard'})</Text>
                    <Text style={{ fontSize: 11, color: '#64748B' }}>Momento: {mLabel}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveIntegratore(it.id)}>
                    <Text style={{ color: '#E53E3E', fontWeight: 'bold', fontSize: 14, paddingHorizontal: 8 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={[s.txt, { fontStyle: 'italic', marginTop: 6, color: '#94A3B8' }]}>
            Nessun integratore prescritto.
          </Text>
        )}
      </View>

      {/* ─── 6. DIARIO PESO DEL PAZIENTE ─────────────────────────────────── */}
      <View style={s.card}>
        <Text style={s.sec}>6. Diario Peso ({diary.length} pesate)</Text>
        {diary.length > 0 ? (
          <View>
            <Text style={[s.txt, { fontWeight: 'bold', marginBottom: 8 }]}>
              Visita: {startWeight} kg • Ultimo: {lastWeight} kg ({Number(diffWeight) > 0 ? `+${diffWeight}` : diffWeight} kg)
            </Text>
            {diary.map((e, idx) => (
              <View key={idx} style={[s.rowBet, { paddingVertical: 4, borderBottomWidth: 1, borderColor: '#F1F5F9' }]}>
                <Text style={s.txt}>{e.data}</Text>
                <Text style={[s.bold, { color: '#0F172A' }]}>{e.peso} kg</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[s.txt, { fontStyle: 'italic', color: '#94A3B8' }]}>
            Nessuna pesata registrata dal paziente.
          </Text>
        )}
      </View>

      {/* ─── SALVATAGGIO & ELIMINAZIONE ─────────────────────────────────── */}
      <TouchableOpacity
        style={[s.btn, { backgroundColor: LIME_DARK, marginTop: 12, paddingVertical: 14 }]}
        onPress={onSave}
        disabled={loading}
      >
        <Text style={[s.btnTxt, { fontSize: 16 }]}>
          {loading ? 'Salvataggio in corso...' : '💾 Salva Scheda Paziente'}
        </Text>
      </TouchableOpacity>

      {!isNew && onDelete ? (
        <TouchableOpacity
          style={[
            s.sBtn,
            { backgroundColor: '#FEF2F2', borderColor: '#EF4444', marginTop: 10, paddingVertical: 12 },
          ]}
          onPress={onDelete}
          disabled={loading}
        >
          <Text style={[s.sBtnTxt, { color: '#DC2626', fontWeight: 'bold', fontSize: 14 }]}>
            🗑️ Elimina Paziente dall’Elenco
          </Text>
        </TouchableOpacity>
      ) : null}

      {msg ? (
        <Text style={[s.txt, { color: msg.includes('✅') ? '#16A34A' : '#DC2626', fontWeight: 'bold', textAlign: 'center', marginTop: 10 }]}>
          {msg}
        </Text>
      ) : null}

      {/* ─── MODAL COMPILAZIONE VISITA ANTROPOMETRICA (FITCOMPX) ─────────── */}
      <Modal visible={showAntropoModal} transparent animationType="slide" onRequestClose={() => setShowAntropoModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.75)', justifyContent: 'center', alignItems: 'center', padding: 12 }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, width: '100%', maxWidth: 560, maxHeight: '92%', borderWidth: 1, borderColor: '#CBD5E1' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0F172A' }}>
                  {lastVisit ? `🩺 Visita di Controllo (Visita #${(cur.visite_antropometriche || []).length + 1})` : '🩺 Nuova Visita Antropometrica (Prima Visita)'}
                </Text>
                <Text style={{ fontSize: 12, color: '#64748B' }}>
                  {cur.anagrafica?.nome ? `${cur.anagrafica.nome} ${cur.anagrafica.cognome || ''}` : cur.codice}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAntropoModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={{ fontSize: 14, color: '#94A3B8', fontWeight: 'bold' }}>✕ Chiudi</Text>
              </TouchableOpacity>
            </View>

            {/* Banner Visita Successiva con Azioni Rapide */}
            {lastVisit ? (
              <View style={{ backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#93C5FD', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                  <View style={{ flex: 1, minWidth: 200 }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1E40AF' }}>
                      🔄 Dati Visita Precedente ({lastVisit.data || 'Registrata'})
                    </Text>
                    <Text style={{ fontSize: 11, color: '#3B82F6', marginTop: 1 }}>
                      Altezza e diametri ossei fissi ereditati. I valori precedenti sono indicati accanto ad ogni voce.
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      onPress={handlePrefillAllFromLast}
                      style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#93C5FD' }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1E40AF' }}>📋 Clona Pliche</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleResetPlicheOnly}
                      style={{ backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1' }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#475569' }}>🧹 Azzera Pliche</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
              {/* 1. Dati Generali */}
              <View style={[s.card, { padding: 10, marginBottom: 10 }]}>
                <Text style={[s.lbl, { color: '#0369A1', marginBottom: 6 }]}>1. Parametri Generali:</Text>
                <View style={s.row}>
                  <View style={{ flex: 1, marginRight: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#475569' }}>Data Visita:</Text>
                    <TextInput
                      style={s.tInp}
                      value={antropoForm.dataVisita}
                      onChangeText={(v) => setAntropoForm({ ...antropoForm, dataVisita: v })}
                    />
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#475569' }}>Peso (kg):</Text>
                    <TextInput
                      style={s.tInp}
                      keyboardType="numeric"
                      value={antropoForm.peso}
                      onChangeText={(v) => setAntropoForm({ ...antropoForm, peso: v })}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#475569' }}>Altezza (cm):</Text>
                    <TextInput
                      style={s.tInp}
                      keyboardType="numeric"
                      value={antropoForm.altezza}
                      onChangeText={(v) => setAntropoForm({ ...antropoForm, altezza: v })}
                    />
                  </View>
                </View>
                <View style={{ marginTop: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#475569' }}>Frequenza Cardiaca a Riposo (bpm):</Text>
                  <TextInput
                    style={[s.tInp, { width: 120 }]}
                    keyboardType="numeric"
                    placeholder="es. 55"
                    value={antropoForm.fcr}
                    onChangeText={(v) => setAntropoForm({ ...antropoForm, fcr: v })}
                  />
                </View>
              </View>

              {/* 2. Plicometria */}
              <View style={[s.card, { padding: 10, marginBottom: 10 }]}>
                <Text style={[s.lbl, { color: '#0369A1', marginBottom: 6 }]}>2. Plicometria (6 Pliche in mm):</Text>
                {[
                  ['tricipite', 'Tricipite', getLastVisitData()?.tricipite],
                  ['scapola', 'Sottoscapolare', getLastVisitData()?.scapola],
                  ['torace', 'Torace / Petto', getLastVisitData()?.torace],
                  ['addominale', 'Addominale', getLastVisitData()?.addominale],
                  ['iliaca', 'Soprailiaca', getLastVisitData()?.iliaca],
                  ['coscia', 'Coscia', getLastVisitData()?.coscia],
                ].map(([fKey, fLbl, pVal]) => (
                  <View key={fKey} style={[s.rowBet, { alignItems: 'center', marginBottom: 6 }]}>
                    <Text style={{ fontSize: 12, color: '#334155', flex: 1 }}>
                      • {fLbl} {Boolean(pVal) ? <Text style={{ color: '#94A3B8', fontSize: 11 }}>(prec: {pVal}mm)</Text> : null}
                    </Text>
                    <TextInput
                      style={[s.inp, { width: 90, height: 38, paddingVertical: 0 }]}
                      keyboardType="numeric"
                      value={String(antropoForm[fKey] || '')}
                      onChangeText={(v) => setAntropoForm({ ...antropoForm, [fKey]: v })}
                    />
                  </View>
                ))}
              </View>

              {/* 3. Circonferenze */}
              <View style={[s.card, { padding: 10, marginBottom: 10 }]}>
                <Text style={[s.lbl, { color: '#0369A1', marginBottom: 6 }]}>3. Circonferenze Corporee (cm):</Text>
                {[
                  ['braccio', 'Braccio', getLastVisitData()?.braccio],
                  ['vita', 'Vita (addome stretto)', getLastVisitData()?.vita],
                  ['fianchi', 'Fianchi (massimo trocantere)', getLastVisitData()?.fianchi],
                  ['cosciaRadice', 'Coscia Radice (piega glutea)', getLastVisitData()?.cosciaRadice],
                  ['cosciaMediana', 'Coscia Mediana (metà)', getLastVisitData()?.cosciaMediana],
                ].map(([fKey, fLbl, pVal]) => (
                  <View key={fKey} style={[s.rowBet, { alignItems: 'center', marginBottom: 6 }]}>
                    <Text style={{ fontSize: 12, color: '#334155', flex: 1 }}>
                      • {fLbl} {Boolean(pVal) ? <Text style={{ color: '#94A3B8', fontSize: 11 }}>(prec: {pVal}cm)</Text> : null}
                    </Text>
                    <TextInput
                      style={[s.inp, { width: 90, height: 38, paddingVertical: 0 }]}
                      keyboardType="numeric"
                      value={String(antropoForm[fKey] || '')}
                      onChangeText={(v) => setAntropoForm({ ...antropoForm, [fKey]: v })}
                    />
                  </View>
                ))}
              </View>

              {/* 4. Diametri Ossei */}
              <View style={[s.card, { padding: 10, marginBottom: 10 }]}>
                <Text style={[s.lbl, { color: '#0369A1', marginBottom: 6 }]}>4. Diametri Ossei (cm con calibro):</Text>
                {[
                  ['polso', 'Polso (bistiloideo)', getLastVisitData()?.polso],
                  ['gomito', 'Gomito (omero)', getLastVisitData()?.gomito],
                  ['ginocchio', 'Ginocchio (femore)', getLastVisitData()?.ginocchio],
                  ['caviglia', 'Caviglia (bimalleolare)', getLastVisitData()?.caviglia],
                ].map(([fKey, fLbl, pVal]) => (
                  <View key={fKey} style={[s.rowBet, { alignItems: 'center', marginBottom: 6 }]}>
                    <Text style={{ fontSize: 12, color: '#334155', flex: 1 }}>
                      • {fLbl} {Boolean(pVal) ? <Text style={{ color: '#94A3B8', fontSize: 11 }}>(prec: {pVal}cm)</Text> : null}
                    </Text>
                    <TextInput
                      style={[s.inp, { width: 90, height: 38, paddingVertical: 0 }]}
                      keyboardType="numeric"
                      value={String(antropoForm[fKey] || '')}
                      onChangeText={(v) => setAntropoForm({ ...antropoForm, [fKey]: v })}
                    />
                  </View>
                ))}
              </View>

              {/* Tasto Calcola Referto */}
              <TouchableOpacity
                style={[s.btn, { backgroundColor: '#0284C7', borderColor: '#0369A1', marginVertical: 8 }]}
                onPress={handleCalcAntropo}
              >
                <Text style={[s.btnTxt, { color: '#FFFFFF', fontSize: 14 }]}>⚡ Calcola Referto (Anteprima)</Text>
              </TouchableOpacity>

              {/* Anteprima Risultati Calcolati */}
              {antropoPreview ? (
                <View style={{ backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#38BDF8', borderRadius: 10, padding: 12, marginVertical: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0284C7', marginBottom: 8 }}>
                    📊 Risultati a 4 Compartimenti:
                  </Text>

                  {/* Barra Multicolore Accessibile Daltonici */}
                  <View style={{ height: 26, flexDirection: 'row', borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
                    <View style={{ flex: antropoPreview.muscolo.pct, backgroundColor: COLORBLIND_PALETTE.muscolo.bg, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>{antropoPreview.muscolo.pct}%</Text>
                    </View>
                    <View style={{ flex: antropoPreview.grasso.pct, backgroundColor: COLORBLIND_PALETTE.grasso.bg, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>{antropoPreview.grasso.pct}%</Text>
                    </View>
                    <View style={{ flex: antropoPreview.ossa.pct, backgroundColor: COLORBLIND_PALETTE.ossa.bg, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>{antropoPreview.ossa.pct}%</Text>
                    </View>
                    <View style={{ flex: antropoPreview.altro.pct, backgroundColor: COLORBLIND_PALETTE.altro.bg, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>{antropoPreview.altro.pct}%</Text>
                    </View>
                  </View>

                  <Text style={{ fontSize: 12, color: '#0F172A', marginBottom: 2 }}>
                    🥩 <Text style={{ fontWeight: 'bold' }}>Muscolo:</Text> {antropoPreview.muscolo.kg} kg ({antropoPreview.muscolo.pct}% peso, {antropoPreview.muscolo.suMassaMagraPct}% FFM)
                  </Text>
                  <Text style={{ fontSize: 12, color: '#0F172A', marginBottom: 2 }}>
                    ⚪ <Text style={{ fontWeight: 'bold' }}>Grasso:</Text> {antropoPreview.grasso.kg} kg ({antropoPreview.grasso.pct}%)
                  </Text>
                  <Text style={{ fontSize: 12, color: '#0F172A', marginBottom: 2 }}>
                    🟡 <Text style={{ fontWeight: 'bold' }}>Ossa:</Text> {antropoPreview.ossa.kg} kg ({antropoPreview.ossa.pct}%, biotipo {antropoPreview.ossa.biotipo})
                  </Text>
                  <Text style={{ fontSize: 12, color: '#0F172A', marginBottom: 6 }}>
                    💧 <Text style={{ fontWeight: 'bold' }}>Liquidi / Altro:</Text> {antropoPreview.altro.kg} kg ({antropoPreview.altro.pct}%)
                  </Text>

                  <View style={{ borderTopWidth: 1, borderColor: '#E2E8F0', paddingTop: 6, marginTop: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#166534', marginBottom: 6 }}>
                      🔥 BMR FITcompX: {antropoPreview.metabolismo.bmrFITcompX} kcal • Harris-Benedict: {antropoPreview.metabolismo.bmrHarrisBenedict} kcal
                    </Text>
                    <View style={{ gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => {
                          const bmrVal = String(antropoPreview.metabolismo.bmrFITcompX);
                          updPianoRoot('bmr_base', bmrVal);
                          setAntropoSuccessMsg(`✅ BMR del piano aggiornato a ${bmrVal} kcal (FITcompX)!`);
                          setTimeout(() => setAntropoSuccessMsg(''), 2500);
                        }}
                        style={{ backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#86EFAC', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, alignItems: 'center' }}
                      >
                        <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#15803D' }}>
                          ⚡ Applica FITcompX ({antropoPreview.metabolismo.bmrFITcompX} kcal) come BMR del piano
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          const bmrVal = String(antropoPreview.metabolismo.bmrHarrisBenedict);
                          updPianoRoot('bmr_base', bmrVal);
                          setAntropoSuccessMsg(`✅ BMR del piano aggiornato a ${bmrVal} kcal (Harris-Benedict)!`);
                          setTimeout(() => setAntropoSuccessMsg(''), 2500);
                        }}
                        style={{ backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#93C5FD', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, alignItems: 'center' }}
                      >
                        <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1D4ED8' }}>
                          📊 Applica Harris-Benedict ({antropoPreview.metabolismo.bmrHarrisBenedict} kcal) come BMR del piano
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : null}

              {antropoSuccessMsg ? (
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#15803D', textAlign: 'center', marginVertical: 8 }}>
                  {antropoSuccessMsg}
                </Text>
              ) : null}

              {/* Pulsante Salva Visita */}
              <TouchableOpacity
                style={[s.btn, { backgroundColor: LIME_DARK, borderColor: '#3F6212', marginVertical: 10 }]}
                onPress={handleSaveAntropo}
              >
                <Text style={[s.btnTxt, { color: '#FFFFFF', fontSize: 15 }]}>💾 Salva Visita nello Storico</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* ─── MODAL PRESENTAZIONE STUDIO: CONFRONTO PROGRESSI AL PAZIENTE ─── */}
      <Modal
        visible={showComparisonModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowComparisonModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(15, 23, 42, 0.85)", justifyContent: "center", alignItems: "center", padding: 12 }}>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 20,
              width: "100%",
              maxWidth: 960,
              maxHeight: "94%",
              borderWidth: 1,
              borderColor: "#CBD5E1",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header Presentazione Studio */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: 14,
                borderBottomWidth: 1,
                borderColor: "#E2E8F0",
                marginBottom: 14,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: "#0284C7",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 24 }}>📈</Text>
                </View>
                <View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Text style={{ fontSize: 18, fontWeight: "800", color: "#0F172A" }}>
                      Evoluzione & Ricomposizione Corporea
                    </Text>
                    <View style={{ backgroundColor: "#E0F2FE", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: "bold", color: "#0369A1" }}>FITcompX</Text>
                    </View>
                    <View style={{ backgroundColor: "#DCFCE7", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: "bold", color: "#166534" }}>🖥️ Modalità Studio</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
                    Paziente:{" "}
                    <Text style={{ fontWeight: "bold", color: "#0F172A" }}>
                      {cur.anagrafica?.nome ? `${cur.anagrafica.nome} ${cur.anagrafica.cognome || ""}` : cur.codice}
                    </Text>{" "}
                    • Codice: <Text style={{ fontWeight: "bold" }}>{cur.codice}</Text> •{" "}
                    <Text style={{ fontWeight: "600", color: "#0284C7" }}>
                      {comparisonData?.count || 0} {(comparisonData?.count || 0) === 1 ? "Rilevazione registrata" : "Controlli registrati"}
                    </Text>
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowComparisonModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View
                  style={{
                    backgroundColor: "#F1F5F9",
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "#CBD5E1",
                  }}
                >
                  <Text style={{ fontSize: 13, color: "#475569", fontWeight: "bold" }}>✕ Chiudi</Text>
                </View>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
              {!comparisonData || comparisonData.count === 0 ? (
                <View style={{ padding: 20, alignItems: "center" }}>
                  <Text style={{ fontSize: 14, color: "#64748B" }}>Nessuna visita registrata.</Text>
                </View>
              ) : comparisonData.count === 1 ? (
                <View>
                  <View style={{ backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#93C5FD", borderRadius: 10, padding: 14, marginBottom: 14 }}>
                    <Text style={{ fontSize: 14, fontWeight: "bold", color: "#1E40AF", marginBottom: 4 }}>
                      ℹ️ Prima Visita (Baseline Iniziale del {comparisonData.first.data})
                    </Text>
                    <Text style={{ fontSize: 12, color: "#2563EB", lineHeight: 18 }}>
                      Questa è la prima rilevazione antropometrica del paziente. Alla prossima visita di controllo, in questa schermata compariranno automaticamente tutti i grafici di ricomposizione corporea e i delta (kg e % di grasso persi, muscolo guadagnato, calo somma pliche e circonferenza vita).
                    </Text>
                  </View>
                  <View style={[s.card, { padding: 14 }]}>
                    <Text style={{ fontSize: 14, fontWeight: "bold", color: "#0F172A", marginBottom: 6 }}>
                      Ripartizione a 4 Compartimenti (Totale 100%):
                    </Text>
                    <View style={{ height: 32, flexDirection: "row", borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: "#CBD5E1" }}>
                      <View style={{ flex: comparisonData.fRes.muscolo?.pct || 40, backgroundColor: COLORBLIND_PALETTE.muscolo.bg, justifyContent: "center", alignItems: "center" }}>
                        <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "bold" }}>{comparisonData.fRes.muscolo?.pct}%</Text>
                      </View>
                      <View style={{ flex: comparisonData.fRes.grasso?.pct || 20, backgroundColor: COLORBLIND_PALETTE.grasso.bg, justifyContent: "center", alignItems: "center" }}>
                        <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "bold" }}>{comparisonData.fRes.grasso?.pct}%</Text>
                      </View>
                      <View style={{ flex: comparisonData.fRes.ossa?.pct || 15, backgroundColor: COLORBLIND_PALETTE.ossa.bg, justifyContent: "center", alignItems: "center" }}>
                        <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "bold" }}>{comparisonData.fRes.ossa?.pct}%</Text>
                      </View>
                      <View style={{ flex: comparisonData.fRes.altro?.pct || 25, backgroundColor: COLORBLIND_PALETTE.altro.bg, justifyContent: "center", alignItems: "center" }}>
                        <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "bold" }}>{comparisonData.fRes.altro?.pct}%</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <View>
                  {/* SEZIONE 1: 4 KPI CARD DI IMPATTO (DALL INIZIO DEL PERCORSO) */}
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, fontWeight: "bold", color: "#0369A1", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      🏆 Variazioni Complessive dall’Inizio Percorso ({comparisonData.first.data} ➔ {comparisonData.last.data}):
                    </Text>

                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                      {/* KPI 1: PESO */}
                      <View style={{ flex: 1, minWidth: 200, backgroundColor: "#F8FAFC", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#E2E8F0" }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                          <Text style={{ fontSize: 12, fontWeight: "bold", color: "#64748B" }}>⚖️ Peso Corporeo</Text>
                          <Text style={{ fontSize: 11, color: "#94A3B8" }}>{comparisonData.first.risultati?.peso} ➔ {comparisonData.last.risultati?.peso} kg</Text>
                        </View>
                        <Text style={{ fontSize: 22, fontWeight: "800", color: "#0F172A", marginTop: 4 }}>
                          {comparisonData.last.risultati?.peso} <Text style={{ fontSize: 13, fontWeight: "normal", color: "#64748B" }}>kg</Text>
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                          <Text style={{ fontSize: 12, fontWeight: "bold", color: comparisonData.deltaTot.peso.val <= 0 ? "#166534" : "#1E40AF" }}>
                            {comparisonData.deltaTot.peso.str} kg
                          </Text>
                          <Text style={{ fontSize: 11, color: "#64748B" }}>totale</Text>
                        </View>
                      </View>

                      {/* KPI 2: MASSA GRASSA */}
                      <View style={{ flex: 1, minWidth: 200, backgroundColor: comparisonData.deltaTot.fatKg.val <= 0 ? "#F0FDF4" : "#FEF2F2", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: comparisonData.deltaTot.fatKg.val <= 0 ? "#86EFAC" : "#FECACA" }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                          <Text style={{ fontSize: 12, fontWeight: "bold", color: comparisonData.deltaTot.fatKg.val <= 0 ? "#15803D" : "#B91C1C" }}>
                            ⚪ Massa Grassa (Adipe)
                          </Text>
                          <Text style={{ fontSize: 11, color: comparisonData.deltaTot.fatKg.val <= 0 ? "#166534" : "#991B1B" }}>
                            {comparisonData.first.risultati?.grasso?.pct}% ➔ {comparisonData.last.risultati?.grasso?.pct}%
                          </Text>
                        </View>
                        <Text style={{ fontSize: 22, fontWeight: "800", color: comparisonData.deltaTot.fatKg.val <= 0 ? "#14532D" : "#7F1D1D", marginTop: 4 }}>
                          {comparisonData.last.risultati?.grasso?.kg} <Text style={{ fontSize: 13, fontWeight: "normal" }}>kg ({comparisonData.last.risultati?.grasso?.pct}%)</Text>
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                          <Text style={{ fontSize: 12, fontWeight: "bold", color: comparisonData.deltaTot.fatKg.val <= 0 ? "#15803D" : "#DC2626" }}>
                            {comparisonData.deltaTot.fatKg.val <= 0 ? "📉 " : "📈 "}{comparisonData.deltaTot.fatKg.str} kg ({comparisonData.deltaTot.fatPct.str}%)
                          </Text>
                        </View>
                      </View>

                      {/* KPI 3: MASSA MUSCOLARE */}
                      <View style={{ flex: 1, minWidth: 200, backgroundColor: comparisonData.deltaTot.muscKg.val >= 0 ? "#F0FDF4" : "#F8FAFC", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: comparisonData.deltaTot.muscKg.val >= 0 ? "#86EFAC" : "#E2E8F0" }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                          <Text style={{ fontSize: 12, fontWeight: "bold", color: comparisonData.deltaTot.muscKg.val >= 0 ? "#15803D" : "#475569" }}>
                            🥩 Massa Muscolare Attiva
                          </Text>
                          <Text style={{ fontSize: 11, color: "#64748B" }}>
                            {comparisonData.first.risultati?.muscolo?.pct}% ➔ {comparisonData.last.risultati?.muscolo?.pct}%
                          </Text>
                        </View>
                        <Text style={{ fontSize: 22, fontWeight: "800", color: comparisonData.deltaTot.muscKg.val >= 0 ? "#14532D" : "#0F172A", marginTop: 4 }}>
                          {comparisonData.last.risultati?.muscolo?.kg} <Text style={{ fontSize: 13, fontWeight: "normal" }}>kg ({comparisonData.last.risultati?.muscolo?.pct}%)</Text>
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                          <Text style={{ fontSize: 12, fontWeight: "bold", color: comparisonData.deltaTot.muscKg.val >= 0 ? "#15803D" : "#64748B" }}>
                            {comparisonData.deltaTot.muscKg.val >= 0 ? "📈 " : ""}{comparisonData.deltaTot.muscKg.str} kg ({comparisonData.deltaTot.muscPct.str}%)
                          </Text>
                          <Text style={{ fontSize: 11, color: "#64748B" }}>tonificazione</Text>
                        </View>
                      </View>

                      {/* KPI 4: PLICOMETRIA & CIRCONFERENZE */}
                      <View style={{ flex: 1, minWidth: 200, backgroundColor: "#F8FAFC", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#E2E8F0" }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                          <Text style={{ fontSize: 12, fontWeight: "bold", color: "#64748B" }}>📏 Somma 6 Pliche</Text>
                          <Text style={{ fontSize: 11, color: "#64748B" }}>Vita: {comparisonData.last.risultati?.circ?.vita || "-"} cm</Text>
                        </View>
                        <Text style={{ fontSize: 22, fontWeight: "800", color: "#0F172A", marginTop: 4 }}>
                          {comparisonData.last.risultati?.pliche?.sommaPliche || "-"} <Text style={{ fontSize: 13, fontWeight: "normal", color: "#64748B" }}>mm</Text>
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                          <Text style={{ fontSize: 12, fontWeight: "bold", color: comparisonData.deltaTot.sommaPliche.val <= 0 ? "#166534" : "#DC2626" }}>
                            {comparisonData.deltaTot.sommaPliche.str} mm
                          </Text>
                          <Text style={{ fontSize: 11, color: "#64748B" }}>• Vita: {comparisonData.deltaTot.vita.str} cm</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* SEZIONE 2: CONFRONTO GRAFICO VISIVO PRIMA VS ULTIMA VISITA */}
                  <View style={[s.card, { padding: 14, marginBottom: 16 }]}>
                    <Text style={{ fontSize: 13, fontWeight: "bold", color: "#0369A1", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      📊 Confronto Visivo Ricomposizione Corporea (Prima Visita vs Oggi):
                    </Text>

                    {/* Barra Prima Visita */}
                    <View style={{ marginBottom: 10 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                        <Text style={{ fontSize: 12, fontWeight: "bold", color: "#475569" }}>
                          📅 Inizio: {comparisonData.first.data} ({comparisonData.first.risultati?.peso} kg)
                        </Text>
                        <Text style={{ fontSize: 11, color: "#64748B" }}>
                          Muscolo {comparisonData.first.risultati?.muscolo?.pct}% • Grasso {comparisonData.first.risultati?.grasso?.pct}%
                        </Text>
                      </View>
                      <View style={{ height: 26, flexDirection: "row", borderRadius: 6, overflow: "hidden", borderWidth: 1, borderColor: "#CBD5E1" }}>
                        <View style={{ flex: comparisonData.first.risultati?.muscolo?.pct || 40, backgroundColor: COLORBLIND_PALETTE.muscolo.bg, justifyContent: "center", alignItems: "center" }}>
                          <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "bold" }}>{comparisonData.first.risultati?.muscolo?.pct}%</Text>
                        </View>
                        <View style={{ flex: comparisonData.first.risultati?.grasso?.pct || 20, backgroundColor: COLORBLIND_PALETTE.grasso.bg, justifyContent: "center", alignItems: "center" }}>
                          <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "bold" }}>{comparisonData.first.risultati?.grasso?.pct}%</Text>
                        </View>
                        <View style={{ flex: comparisonData.first.risultati?.ossa?.pct || 15, backgroundColor: COLORBLIND_PALETTE.ossa.bg, justifyContent: "center", alignItems: "center" }}>
                          <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "bold" }}>{comparisonData.first.risultati?.ossa?.pct}%</Text>
                        </View>
                        <View style={{ flex: comparisonData.first.risultati?.altro?.pct || 25, backgroundColor: COLORBLIND_PALETTE.altro.bg, justifyContent: "center", alignItems: "center" }}>
                          <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "bold" }}>{comparisonData.first.risultati?.altro?.pct}%</Text>
                        </View>
                      </View>
                    </View>

                    {/* Barra Ultima Visita */}
                    <View style={{ marginBottom: 10 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                        <Text style={{ fontSize: 12, fontWeight: "bold", color: "#0F172A" }}>
                          📅 Oggi: {comparisonData.last.data} ({comparisonData.last.risultati?.peso} kg)
                        </Text>
                        <Text style={{ fontSize: 11, fontWeight: "bold", color: "#166534" }}>
                          Muscolo {comparisonData.last.risultati?.muscolo?.pct}% • Grasso {comparisonData.last.risultati?.grasso?.pct}%
                        </Text>
                      </View>
                      <View style={{ height: 26, flexDirection: "row", borderRadius: 6, overflow: "hidden", borderWidth: 1, borderColor: "#86EFAC" }}>
                        <View style={{ flex: comparisonData.last.risultati?.muscolo?.pct || 40, backgroundColor: COLORBLIND_PALETTE.muscolo.bg, justifyContent: "center", alignItems: "center" }}>
                          <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "bold" }}>{comparisonData.last.risultati?.muscolo?.pct}%</Text>
                        </View>
                        <View style={{ flex: comparisonData.last.risultati?.grasso?.pct || 20, backgroundColor: COLORBLIND_PALETTE.grasso.bg, justifyContent: "center", alignItems: "center" }}>
                          <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "bold" }}>{comparisonData.last.risultati?.grasso?.pct}%</Text>
                        </View>
                        <View style={{ flex: comparisonData.last.risultati?.ossa?.pct || 15, backgroundColor: COLORBLIND_PALETTE.ossa.bg, justifyContent: "center", alignItems: "center" }}>
                          <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "bold" }}>{comparisonData.last.risultati?.ossa?.pct}%</Text>
                        </View>
                        <View style={{ flex: comparisonData.last.risultati?.altro?.pct || 25, backgroundColor: COLORBLIND_PALETTE.altro.bg, justifyContent: "center", alignItems: "center" }}>
                          <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "bold" }}>{comparisonData.last.risultati?.altro?.pct}%</Text>
                        </View>
                      </View>
                    </View>

                    {/* Legenda Colori */}
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <View style={{ width: 12, height: 12, backgroundColor: COLORBLIND_PALETTE.muscolo.bg, borderRadius: 3 }} />
                        <Text style={{ fontSize: 11, color: "#475569" }}>Muscolo (Massa Magra attiva)</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <View style={{ width: 12, height: 12, backgroundColor: COLORBLIND_PALETTE.grasso.bg, borderRadius: 3 }} />
                        <Text style={{ fontSize: 11, color: "#475569" }}>Grasso (Adipe totale)</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <View style={{ width: 12, height: 12, backgroundColor: COLORBLIND_PALETTE.ossa.bg, borderRadius: 3 }} />
                        <Text style={{ fontSize: 11, color: "#475569" }}>Ossa (Scheletro)</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <View style={{ width: 12, height: 12, backgroundColor: COLORBLIND_PALETTE.altro.bg, borderRadius: 3 }} />
                        <Text style={{ fontSize: 11, color: "#475569" }}>Altro / Liquidi</Text>
                      </View>
                    </View>
                  </View>

                  {/* SEZIONE 3: TABELLA COMPARATIVA DETTAGLIATA MULTI-VISITA */}
                  <View style={[s.card, { padding: 14, marginBottom: 16 }]}>
                    <Text style={{ fontSize: 13, fontWeight: "bold", color: "#0369A1", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      📋 Tabella Comparativa Completa di Tutte le Visite:
                    </Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator>
                      <View style={{ minWidth: 620 }}>
                        {/* Riga Intestazione */}
                        <View style={{ flexDirection: "row", backgroundColor: "#0F172A", borderTopLeftRadius: 8, borderTopRightRadius: 8, paddingVertical: 8, paddingHorizontal: 6 }}>
                          <Text style={{ width: 190, fontSize: 11, fontWeight: "bold", color: "#FFFFFF" }}>PARAMETRO CLINICO</Text>
                          {comparisonData.sorted.map((v, i) => (
                            <Text key={v.id || i} style={{ width: 100, fontSize: 11, fontWeight: "bold", color: "#38BDF8", textAlign: "center" }}>
                              {i === 0 ? `V1 (${v.data})` : (i === comparisonData.sorted.length - 1 ? `Oggi (${v.data})` : `V${i+1} (${v.data})`)}
                            </Text>
                          ))}
                          <Text style={{ width: 90, fontSize: 11, fontWeight: "bold", color: "#4ADE80", textAlign: "center" }}>
                            Δ TOTALE
                          </Text>
                        </View>

                        {/* Righe Tabella */}
                        {[
                          ["Peso Corporeo", (r) => `${r.peso || "-"} kg`, comparisonData.deltaTot.peso.str + " kg", true],
                          ["Massa Muscolare (kg)", (r) => `${r.muscolo?.kg || "-"} kg`, comparisonData.deltaTot.muscKg.str + " kg", true, "#F0FDF4"],
                          ["Massa Muscolare (%)", (r) => `${r.muscolo?.pct || "-"}%`, comparisonData.deltaTot.muscPct.str + "%", true, "#F0FDF4"],
                          ["Massa Grassa (kg)", (r) => `${r.grasso?.kg || "-"} kg`, comparisonData.deltaTot.fatKg.str + " kg", true, "#FEF2F2"],
                          ["Massa Grassa (%)", (r) => `${r.grasso?.pct || "-"}%`, comparisonData.deltaTot.fatPct.str + "%", true, "#FEF2F2"],
                          ["Grasso Essenziale (%)", (r) => `${r.grasso?.essenziale || "-"}%`, "-", false],
                          ["Grasso Viscerale (%)", (r) => `${r.grasso?.viscerale || "-"}%`, "-", false],
                          ["Massa Ossea (kg)", (r) => `${r.ossa?.kg || "-"} kg`, "-", false],
                          ["Liquidi / Residuo (kg)", (r) => `${r.altro?.kg || "-"} kg`, "-", false],
                          ["BMR FITcompX (kcal)", (r) => `${r.metabolismo?.bmrFITcompX || "-"}`, comparisonData.deltaTot.bmr.str, false],
                          ["SOMMA 6 PLICHE (mm)", (r) => `${r.pliche?.sommaPliche || "-"} mm`, comparisonData.deltaTot.sommaPliche.str + " mm", true, "#EFF6FF"],
                          ["• Tricipite (mm)", (r) => `${r.pliche?.tricipite || "-"}`, "-", false],
                          ["• Sottoscapolare (mm)", (r) => `${r.pliche?.scapola || "-"}`, "-", false],
                          ["• Torace / Petto (mm)", (r) => `${r.pliche?.torace || "-"}`, "-", false],
                          ["• Addominale (mm)", (r) => `${r.pliche?.addominale || "-"}`, "-", false],
                          ["• Soprailiaca (mm)", (r) => `${r.pliche?.iliaca || "-"}`, "-", false],
                          ["• Coscia (mm)", (r) => `${r.pliche?.coscia || "-"}`, "-", false],
                          ["Circonferenza Vita (cm)", (r) => `${r.circ?.vita || "-"} cm`, comparisonData.deltaTot.vita.str + " cm", true],
                          ["Circonferenza Fianchi (cm)", (r) => `${r.circ?.fianchi || "-"} cm`, comparisonData.deltaTot.fianchi.str + " cm", false],
                          ["Circonferenza Braccio (cm)", (r) => `${r.circ?.braccio || "-"} cm`, comparisonData.deltaTot.braccio.str + " cm", false],
                        ].map(([label, getVal, dVal, isBold, bgCol], rowIdx) => (
                          <View
                            key={rowIdx}
                            style={{
                              flexDirection: "row",
                              paddingVertical: 6,
                              paddingHorizontal: 6,
                              backgroundColor: bgCol || (rowIdx % 2 === 0 ? "#FFFFFF" : "#F8FAFC"),
                              borderBottomWidth: 1,
                              borderColor: "#E2E8F0",
                              alignItems: "center",
                            }}
                          >
                            <Text style={{ width: 190, fontSize: 11, fontWeight: isBold ? "bold" : "normal", color: "#1E293B" }}>
                              {label}
                            </Text>
                            {comparisonData.sorted.map((v, i) => (
                              <Text key={v.id || i} style={{ width: 100, fontSize: 11, color: "#334155", textAlign: "center", fontWeight: isBold ? "600" : "normal" }}>
                                {getVal(v.risultati || {})}
                              </Text>
                            ))}
                            <Text style={{ width: 90, fontSize: 11, fontWeight: "bold", color: "#166534", textAlign: "center" }}>
                              {dVal}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  </View>

                  {/* SEZIONE 4: DIAGNOSI CLINICA DELL ULTIMA VISITA */}
                  {comparisonData.last.risultati?.diagnosi ? (
                    <View style={{ backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#86EFAC", borderRadius: 10, padding: 12 }}>
                      <Text style={{ fontSize: 12, fontWeight: "bold", color: "#166534", marginBottom: 4 }}>
                        🩺 Valutazione Clinica Ultima Visita ({comparisonData.last.data}):
                      </Text>
                      <Text style={{ fontSize: 12, color: "#14532D", lineHeight: 18 }}>
                        {comparisonData.last.risultati.diagnosi}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}
