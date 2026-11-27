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
  const [antropoForm, setAntropoForm] = useState({
    dataVisita: new Date().toLocaleDateString('it-IT'),
    peso: String(cur.peso_visita || '70'),
    altezza: String(cur.anagrafica?.altezza || '175'),
    fcr: '60',
    tricipite: '6.5',
    scapola: '7.5',
    torace: '5.0',
    addominale: '7.0',
    iliaca: '4.5',
    coscia: '7.0',
    braccio: '28.0',
    vita: '75.0',
    fianchi: '90.0',
    cosciaRadice: '58.0',
    cosciaMediana: '55.0',
    polso: '6.0',
    gomito: '7.2',
    ginocchio: '10.0',
    caviglia: '8.0',
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

  const handleOpenAntropoModal = () => {
    if (lastVisit?.input) {
      setAntropoForm({
        ...lastVisit.input,
        dataVisita: new Date().toLocaleDateString('it-IT'),
        peso: String(cur.peso_visita || lastVisit.input.peso || '70'),
      });
    } else {
      setAntropoForm({
        dataVisita: new Date().toLocaleDateString('it-IT'),
        peso: String(cur.peso_visita || '70'),
        altezza: String(cur.anagrafica?.altezza || '175'),
        fcr: '60',
        tricipite: '6.5',
        scapola: '7.5',
        torace: '5.0',
        addominale: '7.0',
        iliaca: '4.5',
        coscia: '7.0',
        braccio: '28.0',
        vita: '75.0',
        fianchi: '90.0',
        cosciaRadice: '58.0',
        cosciaMediana: '55.0',
        polso: '6.0',
        gomito: '7.2',
        ginocchio: '10.0',
        caviglia: '8.0',
      });
    }
    setAntropoPreview(null);
    setShowAntropoModal(true);
  };

  const getAntropoParams = () => ({
    sesso: cur.anagrafica?.sesso || 'M',
    eta: safeNum(cur.anagrafica?.eta) || 25,
    altezza: safeNum(antropoForm.altezza) || 175,
    peso: safeNum(antropoForm.peso) || safeNum(cur.peso_visita) || 70,
    fcr: safeNum(antropoForm.fcr) || 60,
    tricipite: safeNum(antropoForm.tricipite) || 6.5,
    scapola: safeNum(antropoForm.scapola) || 7.5,
    torace: safeNum(antropoForm.torace) || 5.0,
    addominale: safeNum(antropoForm.addominale) || 7.0,
    iliaca: safeNum(antropoForm.iliaca) || 4.5,
    coscia: safeNum(antropoForm.coscia) || 7.0,
    braccio: safeNum(antropoForm.braccio) || 28.0,
    vita: safeNum(antropoForm.vita) || 75.0,
    fianchi: safeNum(antropoForm.fianchi) || 90.0,
    cosciaRadice: safeNum(antropoForm.cosciaRadice) || 58.0,
    cosciaMediana: safeNum(antropoForm.cosciaMediana) || 55.0,
    polso: safeNum(antropoForm.polso) || 6.0,
    gomito: safeNum(antropoForm.gomito) || 7.2,
    ginocchio: safeNum(antropoForm.ginocchio) || 10.0,
    caviglia: safeNum(antropoForm.caviglia) || 8.0,
    dataVisita: antropoForm.dataVisita || new Date().toLocaleDateString('it-IT'),
  });

  const handleCalcAntropo = async () => {
    const params = getAntropoParams();
    let res = null;
    try {
      res = await calcolaAntropometriaServer(params);
    } catch (e) {
      console.warn('Calcolo server non riuscito, uso fallback locale:', e);
    }
    if (!res) {
      res = calcolaAntropometria(params);
    }
    setAntropoPreview(res);
  };

  const handleSaveAntropo = async () => {
    let res = antropoPreview;
    if (!res) {
      const params = getAntropoParams();
      try {
        res = await calcolaAntropometriaServer(params);
      } catch (e) {
        console.warn('Calcolo server non riuscito, uso fallback locale:', e);
      }
      if (!res) {
        res = calcolaAntropometria(params);
      }
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

  // ─── GESTIONE FITNESS WORKOUTS ──────────────────────────────────────────
  const handleAddWorkout = () => {
    const list = cur.piano_dati?.workouts_fitness || [];
    if (list.length >= 3) return;
    const nextIdx = list.length + 1;
    const nextId = `w_${Date.now()}`;
    const newW = {
      id: nextId,
      nome: `Allenamento ${nextIdx}`,
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
    let text = `Ciao! Ecco il tuo accesso personale al piano nutrizionale B-sportlab (Dott. Federico Baldassarre).\n\n🔗 Link Diretto al tuo Piano:\n${directLink}\n\n🔑 Il tuo Codice Paziente: ${code}\n\n(Toccando il link sopra entrerai direttamente nel tuo piano nutrizionale!)`;
    if (l === 'en') {
      text = `Hi! Here is your personal access to your B-sportlab nutrition plan (Dr. Federico Baldassarre).\n\n🔗 Direct Plan Link:\n${directLink}\n\n🔑 Personal Code: ${code}\n\n(Tap the link above to access your plan directly!)`;
    } else if (l === 'fr') {
      text = `Bonjour! Voici votre accès personnel au plan nutritionnel B-sportlab (Dr. Federico Baldassarre).\n\n🔗 Lien direct:\n${directLink}\n\n🔑 Code personnel: ${code}\n\n(Appuyez sur le lien ci-dessus pour accéder directement à votre plan!)`;
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
              placeholder="es. Emanuele"
              value={cur.anagrafica?.nome || ''}
              onChangeText={(v) => updAnagrafica('nome', v)}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <Text style={s.lbl}>Cognome:</Text>
            <TextInput
              style={s.tInp}
              placeholder="es. Parianotti"
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
              placeholder="es. PRNMNL..."
              value={cur.anagrafica?.codice_fiscale || ''}
              onChangeText={(v) => updAnagrafica('codice_fiscale', v)}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <Text style={s.lbl}>Cellulare:</Text>
            <TextInput
              style={s.tInp}
              keyboardType="phone-pad"
              placeholder="es. 340 1234567"
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
              placeholder="es. emanuele@gmail.com"
              value={cur.anagrafica?.email || ''}
              onChangeText={(v) => updAnagrafica('email', v)}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <Text style={s.lbl}>Residenza / Città:</Text>
            <TextInput
              style={s.tInp}
              placeholder="es. Milano"
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
              value={String(cur.peso_visita ?? '70')}
              onChangeText={(v) => setCur({ ...cur, peso_visita: v })}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <Text style={s.lbl}>Altezza (cm):</Text>
            <TextInput
              style={s.inp}
              keyboardType="numeric"
              placeholder="es. 188"
              value={String(cur.anagrafica?.altezza || '175')}
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
          <TouchableOpacity
            style={[s.btn, { marginTop: 0, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#0284C7', borderColor: '#0369A1' }]}
            onPress={handleOpenAntropoModal}
          >
            <Text style={[s.btnTxt, { color: '#FFFFFF', fontSize: 12 }]}>+ Nuova Visita</Text>
          </TouchableOpacity>
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
                    • Grasso: <Text style={{ fontWeight: 'bold' }}>{r.grasso?.pct ?? '-'}%</Text> ({r.grasso?.kg ?? '-'} kg) • Muscolo: <Text style={{ fontWeight: 'bold' }}>{r.muscolo?.pct ?? '-'}%</Text> ({r.muscolo?.kg ?? '-'} kg) • BMR: <Text style={{ fontWeight: 'bold' }}>{r.metabolismo?.bmrFITcompX ?? '-'} kcal</Text>
                  </Text>
                  {r.metabolismo?.bmrFITcompX ? (
                    <TouchableOpacity
                      onPress={() => {
                        const bmrVal = String(r.metabolismo.bmrFITcompX);
                        updPianoRoot('bmr_base', bmrVal);
                        setAntropoSuccessMsg(`✅ BMR applicato: ${bmrVal} kcal!`);
                        setTimeout(() => setAntropoSuccessMsg(''), 2500);
                      }}
                      style={{ marginTop: 6, alignSelf: 'flex-start', backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#86EFAC' }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#166534' }}>
                        💡 Applica {r.metabolismo.bmrFITcompX} kcal come Basale (BMR) del piano
                      </Text>
                    </TouchableOpacity>
                  ) : null}
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
                <Text style={[s.bold, { color: LIME_TEXT }]}>🔥 Tipologie Giorni di Allenamento (Max 3):</Text>
                {(cur.piano_dati?.workouts_fitness || []).length < 3 ? (
                  <TouchableOpacity onPress={handleAddWorkout}>
                    <Text style={{ color: LIME_TEXT, fontWeight: 'bold', fontSize: 13 }}>+ Aggiungi Tipo</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {(cur.piano_dati?.workouts_fitness || []).map((w, idx) => {
                const deltaKcal = safeNum(w.delta_kcal) || 300;
                const extraCarbo = Math.round(deltaKcal / 4);
                const baseP = safeNum(cur.piano_dati?.riposo_fitness?.p || 140);
                const baseF = safeNum(cur.piano_dati?.riposo_fitness?.f || 60);
                const baseC = safeNum(cur.piano_dati?.riposo_fitness?.c || 160);
                const totC = baseC + extraCarbo;
                const totKcal = (baseP * 4) + (baseF * 9) + (totC * 4);
                const pKcal = Math.round(baseP * 4);
                const fKcal = Math.round(baseF * 9);
                const cKcal = Math.round(totC * 4);

                return (
                  <View key={w.id || idx} style={[s.card, { marginTop: 8, padding: 12, backgroundColor: '#F8FAFC' }]}>
                    <View style={s.rowBet}>
                      <TextInput
                        style={[s.bold, { flex: 1, fontSize: 14, color: '#0F172A' }]}
                        value={w.nome}
                        onChangeText={(v) => handleUpdWorkout(w.id, 'nome', v)}
                      />
                      {(cur.piano_dati?.workouts_fitness || []).length > 1 ? (
                        <TouchableOpacity onPress={() => handleRemoveWorkout(w.id)} style={{ paddingLeft: 8 }}>
                          <Text style={{ color: '#E53E3E', fontWeight: 'bold' }}>✕</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <View style={[s.row, { marginTop: 6 }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.lbl}>Delta Calorie (+kcal):</Text>
                        <TextInput
                          style={s.inp}
                          keyboardType="numeric"
                          value={String(w.delta_kcal)}
                          onChangeText={(v) => handleUpdWorkout(w.id, 'delta_kcal', v)}
                        />
                      </View>
                      <View style={{ flex: 2, paddingLeft: 12, justifyContent: 'center' }}>
                        <Text style={[s.txt, { fontWeight: 'bold', color: LIME_TEXT }]}>
                          Totale: ~{totKcal} kcal (+{extraCarbo}g Carbo)
                        </Text>
                        <Text style={[s.txt, { fontSize: 11, color: '#475569', marginTop: 1 }]}>
                          Macro: P {pKcal} • L {fKcal} • C {cKcal} kcal
                        </Text>
                        <Text style={[s.txt, { fontSize: 10, color: '#64748B' }]}>
                          C: {M.calcGPerKg(totC, startWeight)} g/kg • Acqua: +500ml
                        </Text>
                      </View>
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
                  🩺 Nuova Visita Antropometrica
                </Text>
                <Text style={{ fontSize: 12, color: '#64748B' }}>
                  {cur.anagrafica?.nome ? `${cur.anagrafica.nome} ${cur.anagrafica.cognome || ''}` : cur.codice}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAntropoModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={{ fontSize: 14, color: '#94A3B8', fontWeight: 'bold' }}>✕ Chiudi</Text>
              </TouchableOpacity>
            </View>

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
                  ['tricipite', 'Tricipite', lastVisit?.input?.tricipite],
                  ['scapola', 'Sottoscapolare', lastVisit?.input?.scapola],
                  ['torace', 'Torace / Petto', lastVisit?.input?.torace],
                  ['addominale', 'Addominale', lastVisit?.input?.addominale],
                  ['iliaca', 'Soprailiaca', lastVisit?.input?.iliaca],
                  ['coscia', 'Coscia', lastVisit?.input?.coscia],
                ].map(([fKey, fLbl, pVal]) => (
                  <View key={fKey} style={[s.rowBet, { alignItems: 'center', marginBottom: 6 }]}>
                    <Text style={{ fontSize: 12, color: '#334155', flex: 1 }}>
                      • {fLbl} {pVal !== undefined ? <Text style={{ color: '#94A3B8', fontSize: 11 }}>(prec: {pVal}mm)</Text> : null}
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
                  ['braccio', 'Braccio', lastVisit?.input?.braccio],
                  ['vita', 'Vita (addome stretto)', lastVisit?.input?.vita],
                  ['fianchi', 'Fianchi (massimo trocantere)', lastVisit?.input?.fianchi],
                  ['cosciaRadice', 'Coscia Radice (piega glutea)', lastVisit?.input?.cosciaRadice],
                  ['cosciaMediana', 'Coscia Mediana (metà)', lastVisit?.input?.cosciaMediana],
                ].map(([fKey, fLbl, pVal]) => (
                  <View key={fKey} style={[s.rowBet, { alignItems: 'center', marginBottom: 6 }]}>
                    <Text style={{ fontSize: 12, color: '#334155', flex: 1 }}>
                      • {fLbl} {pVal !== undefined ? <Text style={{ color: '#94A3B8', fontSize: 11 }}>(prec: {pVal}cm)</Text> : null}
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
                  ['polso', 'Polso (bistiloideo)', lastVisit?.input?.polso],
                  ['gomito', 'Gomito (omero)', lastVisit?.input?.gomito],
                  ['ginocchio', 'Ginocchio (femore)', lastVisit?.input?.ginocchio],
                  ['caviglia', 'Caviglia (bimalleolare)', lastVisit?.input?.caviglia],
                ].map(([fKey, fLbl, pVal]) => (
                  <View key={fKey} style={[s.rowBet, { alignItems: 'center', marginBottom: 6 }]}>
                    <Text style={{ fontSize: 12, color: '#334155', flex: 1 }}>
                      • {fLbl} {pVal !== undefined ? <Text style={{ color: '#94A3B8', fontSize: 11 }}>(prec: {pVal}cm)</Text> : null}
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
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#166534' }}>
                      🔥 BMR FITcompX: {antropoPreview.metabolismo.bmrFITcompX} kcal (Harris-Benedict: {antropoPreview.metabolismo.bmrHarrisBenedict} kcal)
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        const bmrVal = String(antropoPreview.metabolismo.bmrFITcompX);
                        updPianoRoot('bmr_base', bmrVal);
                        setAntropoSuccessMsg(`✅ BMR del piano aggiornato a ${bmrVal} kcal!`);
                        setTimeout(() => setAntropoSuccessMsg(''), 2500);
                      }}
                      style={{ marginTop: 6, backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#86EFAC', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, alignItems: 'center' }}
                    >
                      <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#15803D' }}>
                        💡 Applica BMR calcolato ({antropoPreview.metabolismo.bmrFITcompX} kcal) come BMR del piano
                      </Text>
                    </TouchableOpacity>
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
    </View>
  );
}
