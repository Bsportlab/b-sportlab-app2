import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Linking,
} from 'react-native';
import { ALL_RECIPES as RECIPES } from './ricette';
import { s } from './stile';
import * as M from './motore';
import { getPaziente, savePaziente, salvaPesoPaziente, eliminaPesoPaziente, signInDoctor, signOutDoctor, restoreSession } from './supabase';
import { confirmAction, ConfirmModalContainer } from './confirm';
import AdminPanel from './admin';
import SchermataCodicePaziente from './SchermataCodicePaziente';
import { RecipeCard, WeightTab, PrefsTab, FavsTab, ShopTab, SupplementsPanel, PeriWorkoutCard, ProfileTab, ComponiPiattoView, DiarioLiberoView, TipsTab } from './paziente_tabs';
import { TourGuidatoModal, TOUR_STORAGE_KEY } from './tour_guidato';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LANGS, UI } from './lingue';
import { ErrorBoundary } from './ErrorBoundary';

const WHATSAPP_PHONE = '393519246513';
const DEFAULT_WA_MESSAGE =
  'Ciao Federico Baldassarre, vorrei richiedere o recuperare il mio codice paziente per B-sportlab.';

const LIME_ACCENT = '#A3E635';
const LIME_DARK = '#4D7C0F';
const LIME_TEXT = '#3F6212';
const BG_BLACK = '#050505';
const BG_WHITE = '#FFFFFF';
const TEXT_DARK = '#0F172A';
const TEXT_MUTED = '#475569';
const LOGIN_MUTED = '#94A3B8';
const BORDER_LIGHT = '#E2E8F0';
const LOGIN_BORDER = '#27272A';

export default function App() {
  const initialDay = M.DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  const [lang, setLang] = useState('it');
  const [role, setRole] = useState(null);
  const [paziente, setPaziente] = useState(null);
  const [passInput, setPassInput] = useState('');
  const [passErr, setPassErr] = useState('');
  const [waMessage] = useState(DEFAULT_WA_MESSAGE);
  const [quizDone, setQuizDone] = useState(false);
  const [prepMode, setPrepMode] = useState('all');
  const [tab, setTab] = useState('calc');
  const [meal, setMeal] = useState('Colazione');
  const [mealKinds, setMealKinds] = useState({ Colazione: 'all', Merenda: 'all' });
  const [dayType, setDayType] = useState('ON');
  const [dayName, setDayName] = useState(initialDay);
  const [slot1, setSlot1] = useState('afternoon');
  const [slot2, setSlot2] = useState('none');
  const [athleteDayId, setAthleteDayId] = useState(null);
  const [fitnessWorkoutId, setFitnessWorkoutId] = useState(null);
  const [pesoOggi, setPesoOggi] = useState('');
  const [pesoMsg, setPesoMsg] = useState('');
  const [pantry, setPantry] = useState({ Colazione: '', Pranzo: '', Merenda: '', Cena: '' });
  const [results, setResults] = useState({ Colazione: [], Pranzo: [], Merenda: [], Cena: [] });
  const [flt, setFlt] = useState([]);
  const [season, setSeason] = useState('all');
  const [bad, setBad] = useState('');
  const [weekPlan, setWeekPlan] = useState({ Lun: {}, Mar: {}, Mer: {}, Gio: {}, Ven: {}, Sab: {}, Dom: {} });
  const [shopDay, setShopDay] = useState(initialDay);
  const [favs, setFavs] = useState([]);
const [consumedPlateItems, setConsumedPlateItems] = useState({});
const [diaryEntries, setDiaryEntries] = useState({ Colazione: [], Pranzo: [], Merenda: [], Cena: [] });
  const [loaded, setLoaded] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const t = UI[lang] || UI.it;
  const tRef = useRef(t);
  tRef.current = t;

  const langBar = useMemo(
    () => (
      <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 10 }}>
        {LANGS.map(([k, lbl]) => {
          const active = lang === k;
          return (
            <TouchableOpacity
              key={k}
              onPress={() => setLang(k)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: active ? LIME_DARK : BORDER_LIGHT,
                backgroundColor: active ? LIME_ACCENT : BG_WHITE,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: active ? TEXT_DARK : TEXT_MUTED }}>
                {lbl}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    ),
    [lang]
  );

  const loginLangBar = useMemo(
    () => (
      <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'flex-end', marginBottom: 16 }}>
        {LANGS.map(([k, lbl]) => {
          const active = lang === k;
          return (
            <TouchableOpacity
              key={k}
              onPress={() => setLang(k)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: active ? LIME_ACCENT : LOGIN_BORDER,
                backgroundColor: active ? LIME_ACCENT : BG_BLACK,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: active ? BG_BLACK : LOGIN_MUTED }}>
                {lbl}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    ),
    [lang]
  );

  const syncPaziente = useCallback(async (code) => {
    try {
      const data = await getPaziente(code);
      if (!data || !data.attivo) {
        setRole(null);
        setPassErr(tRef.current.loginErr);
      } else {
        setPaziente(data);
        setFlt(data.intolleranze || []);
        setSeason(data.stagione || 'all');
        if (data.piano_dati?.lingua) setLang(data.piano_dati.lingua);
        setRole('patient');
        setPassErr('');
      }
    } catch (e) {
      setPassErr(tRef.current.connErr);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([M.loadLocal(), restoreSession()]).then(([d, session]) => {
      if (!active) return;
      if (d) {
        if (d.lang) setLang(d.lang);
        if (d.pantry) setPantry(d.pantry);
        if (d.bad) setBad(d.bad);
        if (d.weekPlan) setWeekPlan(d.weekPlan);
        if (d.favs) setFavs(d.favs);
      }
      if (session) {
        setRole('doctor');
      } else if (d?.savedCode) {
        syncPaziente(d.savedCode);
      }
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [syncPaziente]);

  useEffect(() => {
    if (!loaded) return;

    setWeekPlan((prev) => M.cleanWeekPlanByFilters(prev, flt, bad));

    setResults((prev) => {
      const next = {};
      M.MEALS.forEach((m) => {
        next[m] = (prev[m] || []).filter((r) => M.isRecipeCompatible(r, flt, bad));
      });
      return next;
    });
  }, [flt, bad, loaded]);

  const savedCode = paziente?.codice || '';
  useEffect(() => {
    if (loaded) {
      M.saveLocal({ lang, savedCode, pantry, bad, weekPlan, favs });
    }
  }, [lang, savedCode, pantry, bad, weekPlan, favs, loaded]);

  useEffect(() => {
    if (role === 'patient' && paziente?.codice) {
      AsyncStorage.getItem(TOUR_STORAGE_KEY)
        .then((done) => {
          if (!done) {
            setShowTour(true);
          }
        })
        .catch(() => {});
    }
  }, [role, paziente?.codice]);

  const handleCodeSubmit = async (cleanCode) => {
    setPassInput(cleanCode);
    await syncPaziente(cleanCode);
  };

  const handleDoctorLogin = async (email, password) => {
    await signInDoctor(email, password);
    setRole('doctor');
    setPassErr('');
  };

  const handleSaveWeight = async () => {
    const raw = String(pesoOggi || '').trim().replace(',', '.');
    const val = parseFloat(raw);
    if (isNaN(val) || val < 30 || val > 250) {
      setPesoMsg('⚠️ Inserisci un peso valido (es. 71.5)');
      setTimeout(() => setPesoMsg(''), 3000);
      return;
    }
    const todayStr = new Date().toLocaleDateString('it-IT');
    const updatedPaz = {
      ...paziente,
      diario_peso: [...(paziente?.diario_peso || []).filter((x) => x.data !== todayStr), { data: todayStr, peso: val }],
    };
    setPaziente(updatedPaz);
    setPesoOggi('');
    setPesoMsg(t.weightSaved || '✅ Peso salvato!');
    setTimeout(() => setPesoMsg(''), 3000);
    try {
      await salvaPesoPaziente(paziente.codice, val, todayStr);
    } catch (e) {
      console.warn('Errore salvataggio peso:', e);
    }
  };

  const handleDeleteWeight = async (dataStr) => {
    if (!paziente) return;
    const updatedDiario = (paziente.diario_peso || []).filter((x) => x.data !== dataStr);
    const updatedPaz = {
      ...paziente,
      diario_peso: updatedDiario,
    };
    setPaziente(updatedPaz);
    try {
      await eliminaPesoPaziente(paziente.codice, dataStr);
    } catch (e) {
      console.warn('Errore eliminazione peso:', e);
    }
  };

  const handleLogout = () => {
    confirmAction({
      title: t?.confirmLogoutTitle || 'Conferma uscita',
      message: t?.confirmLogoutMsg || 'Sei sicuro di voler uscire dal tuo piano?',
      confirmText: t?.confirmExitBtn || 'Esci',
      cancelText: t?.confirmCancelBtn || 'Annulla',
      isDestructive: true,
      onConfirm: () => {
        setRole(null);
        setPaziente(null);
        setPassInput('');
        setQuizDone(false);
      },
    });
  };

  const normPaz = useMemo(() => (paziente ? M.normalizePaziente(paziente) : null), [paziente]);
const isFixedMode = Boolean(normPaz?.modalita_uso && normPaz.modalita_uso !== 'LIBERA');
const [dietMode, setDietMode] = useState('PIATTO');

useEffect(() => {
  if (isFixedMode && normPaz?.modalita_uso) {
    setDietMode(normPaz.modalita_uso);
  }
}, [normPaz?.modalita_uso, isFixedMode]);

const handleToggleConsumedPlate = (mealKey, itemId, itemData) => {
  const key = `${mealKey}_${itemId}`;
  setConsumedPlateItems((prev) => {
    const next = { ...prev };
    if (next[key]) {
      delete next[key];
    } else {
      next[key] = {
        meal: mealKey,
        id: itemId,
        nome: itemData.nome,
        gCrudo: itemData.gCrudo,
        gCotto: itemData.gCotto,
        kcal: itemData.kcal,
        p: itemData.p,
        c: itemData.c,
        f: itemData.f,
      };
    }
    return next;
  });
};

const handleAddDiaryEntry = (mealKey, entry) => {
  setDiaryEntries((prev) => ({
    ...prev,
    [mealKey]: [...(prev[mealKey] || []), entry],
  }));
};

const handleRemoveDiaryEntry = (mealKey, entryId) => {
  setDiaryEntries((prev) => ({
    ...prev,
    [mealKey]: (prev[mealKey] || []).filter((x) => x.id !== entryId),
  }));
};
  const todayDMY = useMemo(() => M.formatDateDMY(new Date()), []);
  const athleteDays = useMemo(() => normPaz?.piano_dati?.giorni_atleta || [], [normPaz]);

  const activeAthleteDay = useMemo(() => {
    if (normPaz?.metodo !== 'ATLETA' || athleteDays.length === 0) return null;
    if (athleteDayId) {
      const found = athleteDays.find((g) => g.id === athleteDayId);
      if (found) return found;
    }
    const matchToday = athleteDays.find((g) => g.data === todayDMY || g.data === M.formatIsoDate(new Date()));
    if (matchToday) return matchToday;
    return athleteDays[0];
  }, [normPaz?.metodo, athleteDays, athleteDayId, todayDMY]);

const allTargetDays = useMemo(() => {
  if (normPaz?.metodo === 'ATLETA' && athleteDays.length > 0) {
    return athleteDays.map((g, idx) => ({
      id: g.id || `ath_${idx}`,
      label: g.nome ? `${g.nome} (${g.data})` : g.data,
      shortLabel: g.nome || g.data,
      dayKey: g.data,
      isAthlete: true,
      athleteDay: g,
    }));
  }
  return M.DAYS.map((d) => ({
    id: d,
    label: t.days[d]?.toUpperCase() || d,
    shortLabel: t.days[d] || d,
    dayKey: d,
    isAthlete: false,
  }));
}, [normPaz, athleteDays, t]);


  const penultimateDay = useMemo(() => {
    if (normPaz?.metodo !== 'ATLETA' || athleteDays.length < 2) return null;
    return athleteDays[athleteDays.length - 2];
  }, [normPaz?.metodo, athleteDays]);

  const isPenultimateDay = useMemo(() => {
    if (!penultimateDay) return false;
    return todayDMY === penultimateDay.data || activeAthleteDay?.id === penultimateDay.id;
  }, [penultimateDay, todayDMY, activeAthleteDay]);

  const isPlanExpired = useMemo(() => {
    if (normPaz?.metodo !== 'ATLETA' || athleteDays.length === 0) return false;
    const lastDay = athleteDays[athleteDays.length - 1];
    return M.isDateAfter(todayDMY, lastDay.data);
  }, [normPaz?.metodo, athleteDays, todayDMY]);

  const daily = useMemo(() => {
    if (!paziente) return null;
    return M.computeDailyTargets(paziente, {
      dayType,
      dayName: normPaz?.metodo === 'ATLETA' ? (activeAthleteDay?.nome || activeAthleteDay?.data) : dayName,
      slots: [slot1, slot2],
      athleteDayIndex: normPaz?.metodo === 'ATLETA' && activeAthleteDay
        ? athleteDays.findIndex((g) => g.id === activeAthleteDay.id)
        : null,
      fitnessWorkoutId,
    });
  }, [paziente, normPaz, dayType, dayName, slot1, slot2, activeAthleteDay, athleteDays, fitnessWorkoutId]);

  // Paziente non visualizza macro grammi, g/kg o kJ (solo dosi da pesare nel menù ed intra/recovery)
  const showMacro = false;

  const profileBadge = useMemo(() => {
    if (!normPaz) return { lbl: '', bg: '#F1F5F9', col: '#334155' };
    if (normPaz.metodo === 'BENESSERE') return { lbl: '🌱 Benessere', bg: '#DCFCE7', col: '#166534' };
    if (normPaz.metodo === 'FITNESS') return { lbl: '⚡ Fitness', bg: '#E0F2FE', col: '#0369A1' };
    return { lbl: '🔥 Atleta', bg: '#FEE2E2', col: '#991B1B' };
  }, [normPaz]);

  const currentDayLabel = useMemo(() => {
    if (!normPaz) return '';
    if (normPaz.metodo === 'BENESSERE') return 'Benessere & Salute';
    if (normPaz.metodo === 'FITNESS') {
      if (dayType === 'OFF' && !fitnessWorkoutId) return `🛌 ${t.dayOff}`;
      const matched = (normPaz.piano_dati?.workouts_fitness || []).find((w) => w.id === fitnessWorkoutId);
      return `🔥 ${matched?.nome || t.dayOn}`;
    }
    if (normPaz.metodo === 'ATLETA') {
      return `🔥 ${activeAthleteDay?.nome || activeAthleteDay?.data || 'Microciclo'}`;
    }
    return (normPaz.metodo === 'KJ' || normPaz._rawMetodo === 'KJ')
      ? (t.days[dayName] || dayName)
      : (dayType === 'ON' ? t.dayOn : t.dayOff);
  }, [normPaz, dayType, fitnessWorkoutId, activeAthleteDay, dayName, t]);

  useEffect(() => {
    if (quizDone && daily && daily.mealTargets) {
      setResults((prev) => {
        const next = {};
        let hasChanges = false;
        M.MEALS.forEach((m) => {
          const curT = daily.mealTargets[m];
          const curList = prev[m] || [];
          if (curList.length > 0 && curT) {
            hasChanges = true;
            next[m] = curList.map((r) => M.calcOne(r, curT.c, curT.p, curT.f));
          } else {
            next[m] = curList;
          }
        });
        return hasChanges ? next : prev;
      });
    }
  }, [daily, quizDone]);

  const startWithQuiz = (selectedMood) => {
    setPrepMode(selectedMood);
    if (daily) {
      setResults(M.generateAllMeals(RECIPES, { daily, prepMode: selectedMood, mealKinds, flt, season, bad, pantry }));
    }
    setQuizDone(true);
  };

  let screenContent = null;

  if (role === 'doctor') {
    screenContent = (
      <AdminPanel
        onLogout={async () => {
          await signOutDoctor();
          setRole(null);
          setPassInput('');
        }}
      />
    );
  } else if (role !== 'patient' || !paziente) {
    screenContent = (
      <SchermataCodicePaziente
        onSubmitCode={handleCodeSubmit}
        onDoctorLogin={handleDoctorLogin}
        initialCode={passInput}
        errorMessage={passErr}
        initialWaMessage={waMessage}
        logoSource={require('./assets/logo.png')}
        headerSlot={loginLangBar}
        lang={lang}
      />
    );
  } else if (!quizDone) {
    screenContent = (
      <SafeAreaView style={[s.bg, { backgroundColor: BG_WHITE }]}>
        <View style={s.top}>
          <Image
            source={require('./assets/logo.png')}
            style={s.topLogo}
            resizeMode="contain"
          />
          <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <Text style={s.brand}>B-sportlab</Text>
              <View style={{ backgroundColor: profileBadge.bg, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: profileBadge.col }}>{profileBadge.lbl}</Text>
              </View>
            </View>
            <Text style={s.doc} numberOfLines={1}>{t.patientLbl}: {paziente.codice}</Text>
          </View>
          <View style={{ flexShrink: 0 }}>
            <TouchableOpacity onPress={handleLogout}>
              <Text style={[s.saveBadge, { color: LIME_TEXT, borderColor: LIME_DARK, paddingHorizontal: 8, paddingVertical: 5, fontSize: 11 }]}>{t.changeBtn}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView contentContainerStyle={s.pad}>
          <View style={s.wBox}>
            <Text style={s.wTit}>{t.quizTitle}</Text>
            <Text style={s.wSub}>{t.quizSub}</Text>
          </View>

          {/* Promemoria WhatsApp penultimo giorno (Atleta) */}
          {normPaz?.metodo === 'ATLETA' && isPenultimateDay && penultimateDay ? (
            <View style={[s.wBox, { backgroundColor: '#FEF3C7', borderColor: '#D97706', marginBottom: 12 }]}>
              <Text style={[s.wTit, { color: '#92400E' }]}>📢 Promemoria Rinnovo Microciclo</Text>
              <Text style={[s.wSub, { color: '#B45309', marginBottom: 8 }]}>
                Domani finisce il tuo piano nutrizionale ({penultimateDay.nome}). Avvisa il Dott. Baldassarre su WhatsApp per predisporre il prossimo ciclo:
              </Text>
              <TouchableOpacity
                style={[s.btn, { backgroundColor: '#25D366', borderColor: '#16A34A', paddingVertical: 9, marginTop: 0 }]}
                onPress={() => {
                  const msg = t?.penultimateWaMsg || 'Ciao Federico Baldassarre, domani finisce il mio piano nutrizionale per B-sportlab. Vorrei accordarmi per il prossimo ciclo.';
                  Linking.openURL(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`);
                }}
              >
                <Text style={[s.btnTxt, { color: '#FFFFFF', fontSize: 13 }]}>
                  {t?.notifyWaBtn || '📲 Avvisa il Dottore su WhatsApp'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Avviso piano scaduto (Atleta) */}
          {normPaz?.metodo === 'ATLETA' && isPlanExpired ? (
            <View style={[s.wBox, { backgroundColor: '#EFF6FF', borderColor: '#2563EB', marginBottom: 12 }]}>
              <Text style={[s.wTit, { color: '#1E40AF' }]}>📅 Microciclo Terminato</Text>
              <Text style={[s.wSub, { color: '#1D4ED8' }]}>
                {t?.expiredPlanNotice || 'Il microciclo corrente si è concluso. In attesa del nuovo piano del dottore, puoi continuare selezionando una qualsiasi delle giornate:'}
              </Text>
            </View>
          ) : null}

          {/* DOMANDA 1 IN BASE AL PROFILO */}
          {normPaz?.metodo === 'BENESSERE' ? (
            <View style={s.card}>
              <Text style={[s.bold, { fontSize: 14, color: '#166534', marginBottom: 4 }]}>
                🌱 {t.q1Benessere || 'Piano Benessere & Salute'}
              </Text>
              <Text style={[s.txt, { fontSize: 12, marginBottom: 8 }]}>
                Unica giornata standard equilibrata, personalizzata per il tuo stile di vita.
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1, backgroundColor: '#F0FDF4', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#86EFAC' }}>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#166534' }}>🎯 OBIETTIVO PASSI</Text>
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#14532D', marginTop: 2 }}>{normPaz.passi_target} / die</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#EFF6FF', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#93C5FD' }}>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1E40AF' }}>💧 IDRATAZIONE</Text>
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#1E3A8A', marginTop: 2 }}>{daily?.waterLiters || '2.2'} Litri</Text>
                </View>
              </View>
            </View>
          ) : normPaz?.metodo === 'FITNESS' ? (
            <View style={s.card}>
              <Text style={s.bold}>{t.q1Fitness || '1. Che giornata è oggi?'}</Text>
              <View style={[s.row, { flexWrap: 'wrap', gap: 6, marginBottom: 4 }]}>
                <TouchableOpacity
                  style={[s.mBtn, !fitnessWorkoutId && dayType === 'OFF' && s.mAct, { minWidth: 100 }]}
                  onPress={() => { setDayType('OFF'); setFitnessWorkoutId(null); }}
                >
                  <Text style={[s.mTxt, !fitnessWorkoutId && dayType === 'OFF' && s.mTxtAct]}>🛌 {t.dayOff}</Text>
                </TouchableOpacity>
                {(normPaz.piano_dati?.workouts_fitness || []).map((w) => {
                  const active = fitnessWorkoutId === w.id || (dayType === 'ON' && !fitnessWorkoutId && w.id === normPaz.piano_dati.workouts_fitness[0]?.id);
                  return (
                    <TouchableOpacity
                      key={w.id}
                      style={[s.mBtn, active && s.mAct, { minWidth: 120 }]}
                      onPress={() => { setDayType('ON'); setFitnessWorkoutId(w.id); }}
                    >
                      <Text style={[s.mTxt, active && s.mTxtAct]}>🔥 {w.nome}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {dayType === 'ON' || Boolean(fitnessWorkoutId) ? (
                <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: '#EDF2F7' }}>
                  <Text style={s.bold}>{t.q2Title}</Text>
                  <Text style={s.lbl}>{t.w1}</Text>
                  <View style={s.chips}>
                    {M.WORKOUT_SLOTS.map(([k]) => (
                      <TouchableOpacity key={k} style={[s.chip, slot1 === k && s.chipAct]} onPress={() => setSlot1(k)}>
                        <Text style={[s.cTxt, slot1 === k && s.cTxtAct]}>{t.slots[k]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={s.lbl}>{t.w2}</Text>
                  <View style={s.chips}>
                    {M.WORKOUT_SLOTS.map(([k]) => (
                      <TouchableOpacity key={k} style={[s.chip, slot2 === k && s.chipAct]} onPress={() => setSlot2(k)}>
                        <Text style={[s.cTxt, slot2 === k && s.cTxtAct]}>{t.slots[k]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          ) : normPaz?.metodo === 'ATLETA' ? (
            <View style={s.card}>
              <Text style={s.bold}>{t.q1Atleta || '1. Seleziona la giornata del tuo microciclo:'}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {athleteDays.map((g) => {
                  const active = g.id === activeAthleteDay?.id;
                  return (
                    <TouchableOpacity
                      key={g.id}
                      style={[
                        s.chip,
                        active && s.chipAct,
                        {
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderWidth: active ? 2 : 1,
                          borderColor: active ? '#4D7C0F' : '#CBD5E1',
                        },
                      ]}
                      onPress={() => setAthleteDayId(g.id)}
                    >
                      <Text style={[s.cTxt, active && s.cTxtAct, { fontWeight: 'bold' }]}>
                        📅 {g.data} • {g.nome}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Banner Promemoria Rinnovo Microciclo (mostrato solo qui all'apertura del giorno) */}
              {isPenultimateDay && penultimateDay ? (
                <View style={[s.wBox, { backgroundColor: '#FEF3C7', borderColor: '#D97706', marginTop: 12, marginBottom: 4 }]}>
                  <Text style={[s.wTit, { color: '#92400E' }]}>📢 Promemoria Rinnovo Microciclo</Text>
                  <Text style={[s.wSub, { color: '#B45309', marginBottom: 8 }]}>
                    Domani finisce il tuo piano nutrizionale ({penultimateDay.nome}). Avvisa il Dott. Baldassarre su WhatsApp per predisporre il prossimo ciclo:
                  </Text>
                  <TouchableOpacity
                    style={[s.btn, { backgroundColor: '#25D366', borderColor: '#16A34A', paddingVertical: 8, marginTop: 0 }]}
                    onPress={() => {
                      const msg = t?.penultimateWaMsg || 'Ciao Federico Baldassarre, domani finisce il mio piano nutrizionale per B-sportlab. Vorrei accordarmi per il prossimo ciclo.';
                      Linking.openURL(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`);
                    }}
                  >
                    <Text style={[s.btnTxt, { color: '#FFFFFF', fontSize: 13 }]}>
                      {t?.notifyWaBtn || '📲 Avvisa il Dottore su WhatsApp'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {activeAthleteDay && Number(activeAthleteDay.kj) > 0 ? (
                <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: '#EDF2F7' }}>
                  <Text style={s.bold}>{t.q2Title}</Text>
                  <Text style={s.lbl}>{t.w1}</Text>
                  <View style={s.chips}>
                    {M.WORKOUT_SLOTS.map(([k]) => (
                      <TouchableOpacity key={k} style={[s.chip, slot1 === k && s.chipAct]} onPress={() => setSlot1(k)}>
                        <Text style={[s.cTxt, slot1 === k && s.cTxtAct]}>{t.slots[k]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={s.lbl}>{t.w2}</Text>
                  <View style={s.chips}>
                    {M.WORKOUT_SLOTS.map(([k]) => (
                      <TouchableOpacity key={k} style={[s.chip, slot2 === k && s.chipAct]} onPress={() => setSlot2(k)}>
                        <Text style={[s.cTxt, slot2 === k && s.cTxtAct]}>{t.slots[k]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* SELEZIONE MODALITÀ D'USO E TEMPO PREPARAZIONE */}
          {!isFixedMode ? (
            <View style={{ marginTop: 10 }}>
              <Text style={[s.bold, { fontSize: 13.5, marginBottom: 4 }]}>
                {normPaz?.metodo === 'BENESSERE' ? '2. Come vuoi gestire i tuoi pasti oggi?' : '3. Come vuoi gestire i tuoi pasti oggi?'}
              </Text>
              <Text style={[s.txt, { fontSize: 11.5, color: '#64748B', marginBottom: 8 }]}>
                Scegli la modalità che preferisci per la tua giornata di oggi.
              </Text>

              {/* Opzione 1: Componi Piatto Semplice */}
              <TouchableOpacity
                style={[
                  s.card,
                  {
                    borderLeftWidth: 4,
                    borderColor: '#0284C7',
                    marginBottom: 8,
                    backgroundColor: dietMode === 'PIATTO' ? '#F0F9FF' : '#FFFFFF',
                  },
                ]}
                onPress={() => {
                  setDietMode('PIATTO');
                  setQuizDone(true);
                }}
              >
                <View style={s.rowBet}>
                  <Text style={[s.rTitle, { marginBottom: 2, fontSize: 13.5 }]}>🍽️ Componi Piatto Semplice</Text>
                  <Text style={{ fontSize: 13 }}>👉</Text>
                </View>
                <Text style={[s.txt, { fontSize: 11.5 }]}>
                  {t.modePlateDesc || '«Scegli tra gli ingredienti semplici e le alternative pesate per te»'}
                </Text>
              </TouchableOpacity>

              {/* Opzione 2: Ricettario B-sportlab */}
              <TouchableOpacity
                style={[
                  s.card,
                  {
                    borderLeftWidth: 4,
                    borderColor: LIME_DARK,
                    marginBottom: 8,
                    backgroundColor: dietMode === 'RICETTE' ? '#F7FEE7' : '#FFFFFF',
                  },
                ]}
                onPress={() => setDietMode('RICETTE')}
              >
                <View style={s.rowBet}>
                  <Text style={[s.rTitle, { marginBottom: 2, fontSize: 13.5 }]}>🥗 Ricettario B-sportlab</Text>
                  <Text style={{ fontSize: 13 }}>👉</Text>
                </View>
                <Text style={[s.txt, { fontSize: 11.5 }]}>
                  {t.modeRecipesDesc || '«Scegli piatti e ricette bilanciate con tempo di preparazione»'}
                </Text>
              </TouchableOpacity>

              {/* Sotto-domanda: Tempo preparazione se scelto Ricettario */}
              {dietMode === 'RICETTE' ? (
                <View style={{ marginLeft: 8, paddingLeft: 10, borderLeftWidth: 2, borderColor: LIME_DARK, marginBottom: 10 }}>
                  <Text style={[s.bold, { fontSize: 12.5, color: TEXT_DARK, marginBottom: 4, marginTop: 4 }]}>
                    ⏱️ Quanto tempo hai per cucinare oggi?
                  </Text>
                  {M.MOODS.map(([k]) => (
                    <TouchableOpacity
                      key={k}
                      style={[s.card, { borderLeftWidth: 3, borderColor: LIME_DARK, marginTop: 4, paddingVertical: 8 }]}
                      onPress={() => startWithQuiz(k)}
                    >
                      <Text style={[s.rTitle, { marginBottom: 2, fontSize: 12.5 }]}>{t.moods[k]?.at(0)}</Text>
                      <Text style={[s.txt, { fontSize: 11 }]}>{t.moods[k]?.at(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}

              {/* Opzione 3: Diario Libero */}
              <TouchableOpacity
                style={[
                  s.card,
                  {
                    borderLeftWidth: 4,
                    borderColor: '#8B5CF6',
                    marginBottom: 8,
                    backgroundColor: dietMode === 'DIARIO' ? '#F5F3FF' : '#FFFFFF',
                  },
                ]}
                onPress={() => {
                  setDietMode('DIARIO');
                  setQuizDone(true);
                }}
              >
                <View style={s.rowBet}>
                  <Text style={[s.rTitle, { marginBottom: 2, fontSize: 13.5 }]}>🎯 Diario Libero</Text>
                  <Text style={{ fontSize: 13 }}>👉</Text>
                </View>
                <Text style={[s.txt, { fontSize: 11.5 }]}>
                  {t.modeDiaryDesc || '«Componi liberamente ciò che mangi e raggiungi il tuo target»'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Modalità Fissa impostata dal Dottore */
            <View style={{ marginTop: 12 }}>
              {normPaz?.modalita_uso === 'RICETTE' ? (
                <View>
                  <Text style={[s.bold, { fontSize: 13.5, marginBottom: 6 }]}>
                    {t.q3Title || 'Quanto tempo hai per preparare i pasti oggi?'}
                  </Text>
                  {M.MOODS.map(([k]) => (
                    <TouchableOpacity
                      key={k}
                      style={[s.card, { borderLeftWidth: 4, borderColor: LIME_DARK, marginTop: 6 }]}
                      onPress={() => startWithQuiz(k)}
                    >
                      <Text style={[s.rTitle, { marginBottom: 4 }]}>{t.moods[k]?.at(0)}</Text>
                      <Text style={s.txt}>{t.moods[k]?.at(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <TouchableOpacity
                  style={[s.btn, { backgroundColor: '#1E293B', marginTop: 8 }]}
                  onPress={() => setQuizDone(true)}
                >
                  <Text style={[s.btnTxt, { color: '#FFFFFF', fontSize: 14 }]}>
                    👉 Accedi al Piano ({normPaz?.modalita_uso === 'PIATTO' ? 'Componi Piatto' : 'Diario Libero'})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  } else {
    const curTarget = daily?.mealTargets?.[meal] || { p: 30, f: 15, c: 50 };
    const shuffleMeal = () =>
      setResults((p) =>
        M.shuffleAndRebalance(RECIPES, p, meal, { daily, prepMode, mealKinds, flt, season, bad, pantry })
      );

    screenContent = (
    <SafeAreaView style={[s.bg, { backgroundColor: BG_WHITE }]}>
      <View style={s.top}>
        <Image
          source={require('./assets/logo.png')}
          style={s.topLogo}
          resizeMode="contain"
        />
        <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <Text style={s.brand}>B-sportlab</Text>
            <View style={{ backgroundColor: profileBadge.bg, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: profileBadge.col }}>{profileBadge.lbl}</Text>
            </View>
          </View>
          <Text style={s.doc} numberOfLines={1}>{t.patientLbl}: {paziente.codice}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <TouchableOpacity onPress={() => setQuizDone(false)}>
            <Text style={[s.saveBadge, { color: LIME_TEXT, borderColor: LIME_DARK, paddingHorizontal: 8, paddingVertical: 5, fontSize: 11 }]}>
              {normPaz?.metodo === 'BENESSERE' ? '🔄 Prep' : '🔄 Giorno'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={[s.saveBadge, { color: LIME_TEXT, borderColor: LIME_DARK, paddingHorizontal: 8, paddingVertical: 5, fontSize: 11 }]}>{t.exitBtn}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.nav}>
        {[
          ['calc', t.tabPlan || '🥗 Il Tuo Piano'],
          ['shop', t.tabShop || '📅 Menù Settimana'],
          ['tips', t.tabTips || '💡 Consigli'],
          ['profile', t.tabProfile || '👤 Profilo'],
        ].map(([k, l]) => (
          <TouchableOpacity key={k} style={[s.nBtn, tab === k && s.nAct]} onPress={() => setTab(k)}>
            <Text style={[s.nTxt, tab === k && s.nTxtAct, { fontSize: 11, textAlign: 'center' }]} numberOfLines={2}>
              {l}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.pad}>
        {tab === 'calc' ? (
          <View>
            {paziente.note_dottore && normPaz?.mostra_note_dottore !== false ? (
              <View style={[s.wBox, { backgroundColor: '#FEFCBF', borderColor: '#D69E2E' }]}>
                <Text style={[s.wTit, { color: '#744210' }]}>{t.notesTitle}</Text>
                <Text style={[s.wSub, { color: '#744210' }]}>{paziente.note_dottore}</Text>
              </View>
            ) : null}



            {/* Card Riepilogo Giornata Attiva (selezione gestita dal pulsante 'Giorno' in alto) */}
            <View style={[s.card, { paddingVertical: 10, paddingHorizontal: 14, marginBottom: 12 }]}>
              <Text style={[s.bold, { fontSize: 14 }]}>📅 Giornata: {currentDayLabel}</Text>
              {normPaz?.metodo === 'ATLETA' ? (
                <Text style={{ fontSize: 12, color: daily?.hasWorkout ? LIME_TEXT : TEXT_MUTED, marginTop: 2 }}>
                  {daily?.hasWorkout ? '🏃‍♂️ Allenamento con strategia peri-workout' : '🛌 Giornata di riposo muscolare'}
                </Text>
              ) : normPaz?.metodo === 'FITNESS' ? (
                <Text style={{ fontSize: 12, color: daily?.hasWorkout ? LIME_TEXT : TEXT_MUTED, marginTop: 2 }}>
                  {daily?.hasWorkout ? '⚡ Giornata di allenamento attiva' : '🛌 Giornata di riposo'}
                </Text>
              ) : null}
            </View>

            {/* Card Obiettivo Benessere (Passi + Idratazione) */}
            {normPaz?.metodo === 'BENESSERE' ? (
              <View style={[s.card, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
                <View style={s.rowBet}>
                  <Text style={[s.bold, { color: '#166534' }]}>🎯 {normPaz.passi_target} passi al giorno</Text>
                  <Text style={{ fontWeight: 'bold', color: '#15803D' }}>💧 {daily?.waterLiters || '2.2'} L d’acqua</Text>
                </View>
                <Text style={[s.txt, { fontSize: 12, color: '#166534', marginTop: 4 }]}>
                  Idratazione calibrata sul peso ({normPaz.peso_visita} kg) e sul raggiungimento dell’obiettivo di passi.
                </Text>
              </View>
            ) : null}

            {/* Card Peri-Workout per Atleta */}
            <PeriWorkoutCard daily={daily} lang={lang} />

            {/* Idratazione Giornaliera (solo in Litri, senza nota sali/sodio) */}
            <View style={s.card}>
              <View style={s.rowBet}>
                <Text style={s.bold}>{t.waterTitle}</Text>
                <Text style={[s.rTitle, { color: LIME_TEXT }]}>{daily?.waterLiters || '2.2'} {t.liters}</Text>
              </View>
              <Text style={s.hint}>{t.setOnText} {currentDayLabel} {t.tapDayHint}</Text>
            </View>

            {/* Protocollo Integratori */}
            <SupplementsPanel paziente={normPaz} daily={daily} lang={lang} />

{/* Modalità 1: Componi Piatto Semplice */}
{dietMode === 'PIATTO' ? (
  <ComponiPiattoView
    daily={daily}
    flt={flt}
    bad={bad ? bad.split(',').map((x) => x.trim()) : []}
    isFixedMode={isFixedMode}
    consumedItems={consumedPlateItems}
    onToggleConsumed={handleToggleConsumedPlate}
    lang={lang}
  />
) : null}

{/* Modalità 2: Ricettario B-sportlab */}
{dietMode === 'RICETTE' ? (
  <View>
    {/* Selezione Pasti del Giorno */}
    <View style={s.row}>
      {M.MEALS.map((m) => (
        <TouchableOpacity key={m} style={[s.mBtn, meal === m && s.mAct]} onPress={() => setMeal(m)}>
          <Text style={[s.mTxt, meal === m && s.mTxtAct]}>{t.meals[m] || m}</Text>
        </TouchableOpacity>
      ))}
    </View>

    <View style={s.card}>
      {showMacro && curTarget ? (
        <Text style={s.rTag}>
          {t.meals[meal] || meal}: P {curTarget.p}g | L {curTarget.f}g | C {curTarget.c}g
        </Text>
      ) : null}
      {(meal === 'Colazione' || meal === 'Merenda') ? (
        <View style={s.row}>
          {M.SWEET_SAVORY.map(([k]) => (
            <TouchableOpacity
              key={k}
              style={[s.mBtn, mealKinds[meal] === k && s.mAct]}
              onPress={() => setMealKinds((p) => ({ ...p, [meal]: k }))}
            >
              <Text style={[s.mTxt, mealKinds[meal] === k && s.mTxtAct]}>{t.kinds[k]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
      <Text style={s.lbl}>{t.pantryLbl} {(t.meals[meal] || meal).toLowerCase()}?</Text>
      <TextInput
        style={s.tInp}
        placeholder={t.pantryPh}
        value={pantry[meal]}
        onChangeText={(v) => setPantry((p) => ({ ...p, [meal]: v }))}
      />
      <TouchableOpacity
        style={[s.btn, { backgroundColor: LIME_ACCENT, borderWidth: 1, borderColor: LIME_DARK }]}
        onPress={shuffleMeal}
      >
        <Text style={[s.btnTxt, { color: TEXT_DARK }]}>{t.shuffleBtn} ({t.meals[meal] || meal})</Text>
      </TouchableOpacity>
    </View>

    {(results[meal] || []).map((it, i) => (
      <RecipeCard
        key={it.id}
        it={it}
        isBest={i === 0}
        isPeriWorkout={curTarget.isPeriWorkout}
        isAdded={weekPlan[shopDay]?.[it.m]?.id === it.id}
        isFav={favs.includes(it.id)}
        shopDay={shopDay}
        flt={flt}
        showMacro={showMacro}
        lang={lang}
        onToggleFav={() => setFavs((p) => (p.includes(it.id) ? p.filter((x) => x !== it.id) : [...p, it.id]))}
        onAdd={() => setWeekPlan((p) => ({ ...p, [shopDay]: { ...p[shopDay], [it.m]: it } }))}
      />
    ))}
  </View>
) : null}

{/* Modalità 3: Diario Libero */}
{dietMode === 'DIARIO' ? (
  <DiarioLiberoView
    daily={daily}
    diaryEntries={diaryEntries}
    onAddEntry={handleAddDiaryEntry}
    onRemoveEntry={handleRemoveDiaryEntry}
    consumedPlateItems={consumedPlateItems}
    weekPlan={weekPlan}
    shopDay={shopDay}
    flt={flt}
    bad={bad ? bad.split(',').map((x) => x.trim()) : []}
    lang={lang}
  />
) : null}
          </View>
        ) : null}

        {tab === 'tips' ? (
          <TipsTab lang={lang} />
        ) : null}

        {tab === 'prefs' ? (
          <PrefsTab
            season={season}
            setSeason={setSeason}
            flt={flt}
            setFlt={setFlt}
            bad={bad}
            setBad={setBad}
            lang={lang}
          />
        ) : null}

        {tab === 'favs' ? (
          <FavsTab
            recipes={RECIPES}
            favs={favs}
            setFavs={setFavs}
            meal={meal}
            setMeal={setMeal}
            daily={daily}
            shopDay={shopDay}
            weekPlan={weekPlan}
            setWeekPlan={setWeekPlan}
            flt={flt}
            bad={bad}
            showMacro={showMacro}
            lang={lang}
          />
        ) : null}

        {tab === 'shop' ? (
          <ShopTab
            targetDays={allTargetDays}
            shopDay={shopDay}
            setShopDay={setShopDay}
            weekPlan={weekPlan}
            setWeekPlan={setWeekPlan}
            flt={flt}
            lang={lang}
            onSelectMealToPick={(m) => {
              setMeal(m);
              setTab('calc');
            }}
            onFillDay={(targetDay, overwrite) => {
              setWeekPlan((prev) =>
                M.fillDayMeals(
                  prev,
                  targetDay,
                  RECIPES,
                  { daily, prepMode, mealKinds, flt, season, bad, pantry },
                  overwrite
                )
              );
            }}
          />
        ) : null}

        {tab === 'profile' ? (
          <ProfileTab
            paziente={normPaz}
            daily={daily}
            results={results}
            weekPlan={weekPlan}
            setWeekPlan={setWeekPlan}
            shopDay={shopDay}
            flt={flt}
            setFlt={setFlt}
            season={season}
            setSeason={setSeason}
            bad={bad}
            setBad={setBad}
            favs={favs}
            setFavs={setFavs}
            recipes={RECIPES}
            meal={meal}
            setMeal={setMeal}
            showMacro={showMacro}
            onLogout={handleLogout}
            lang={lang}
            setLang={setLang}
            pesoOggi={pesoOggi}
            setPesoOggi={setPesoOggi}
            handleSaveWeight={handleSaveWeight}
            onDeleteWeight={handleDeleteWeight}
            pesoMsg={pesoMsg}
            onOpenTour={() => setShowTour(true)}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
  }

  return (
    <ErrorBoundary>
      <View style={{ flex: 1 }}>
        {screenContent}
        <TourGuidatoModal
          visible={showTour}
          onClose={() => setShowTour(false)}
          paziente={normPaz}
        />
        <ConfirmModalContainer />
      </View>
    </ErrorBoundary>
  );
}