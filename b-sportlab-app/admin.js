import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { s } from './stile';
import { getAllPazienti, savePaziente, deletePaziente } from './supabase';
import AdminForm from './admin_form';
import { confirmAction } from './confirm';
import { normalizePaziente, parseDMY } from './motore';

const LIME_DARK = '#4D7C0F';

const getAthleteEndInfo = (p) => {
  if (p.metodo !== 'ATLETA') return null;
  const days = p.piano_dati?.giorni_atleta;
  if (!Array.isArray(days) || days.length === 0) return null;
  const lastDay = days[days.length - 1];
  if (!lastDay?.data) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = parseDMY(lastDay.data);
  end.setHours(0, 0, 0, 0);
  const diff = Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return {
    date: lastDay.data,
    diff,
    isExpired: diff < 0,
    isToday: diff === 0,
    isTomorrow: diff === 1,
  };
};

export default function AdminPanel({ onLogout }) {
  const [list, setList] = useState([]);
  const [cur, setCur] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [search, setSearch] = useState('');

  const loadList = async () => {
    setLoading(true);
    try {
      const raw = (await getAllPazienti()) || [];
      setList(raw.map(normalizePaziente));
    } catch (e) {
      setMsg('Errore Supabase.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadList();
  }, []);

  const openEdit = (p) => {
    setMsg('');
    setShowNewModal(false);
    if (!p) {
      setShowNewModal(true);
      return;
    }
    const norm = normalizePaziente(p);
    norm._initialCodice = norm.codice;
    norm._isNew = false;
    setCur(norm);
  };

  const openNewWithMetodo = (targetMetodo = 'BENESSERE') => {
    setMsg('');
    setShowNewModal(false);
    const norm = normalizePaziente({
      codice: '',
      attivo: true,
      peso_visita: '70',
      metodo: targetMetodo,
      coeff_carbo: '2.0',
      note_dottore: '',
      passi_target: 8000,
      intolleranze: [],
      stagione: 'all',
      integratori: [],
      storico_piani: [],
      piano_dati: {
        metodo: targetMetodo,
        bmr_base: '1500',
        coeff_laf: '1.2',
      },
    });
    norm._isNew = true;
    norm._initialCodice = '';
    setCur(norm);
  };

  const handleDeletePaziente = (codice) => {
    if (!codice) return;
    confirmAction({
      title: 'Elimina Paziente',
      message: `Sei sicuro di voler eliminare definitivamente il paziente ${codice}? Tutti i dati, il piano e il diario peso verranno cancellati per sempre.`,
      confirmText: 'Elimina',
      cancelText: 'Annulla',
      onConfirm: async () => {
        setLoading(true);
        setMsg('');
        try {
          await deletePaziente(codice);
          if (cur && cur.codice === codice) {
            setCur(null);
          }
          await loadList();
          setMsg(`✅ Paziente ${codice} eliminato con successo.`);
        } catch (e) {
          setMsg(`❌ Errore eliminazione: ${e?.message || 'Impossibile eliminare'}`);
        }
        setLoading(false);
      },
    });
  };

  const executeSave = async () => {
    setLoading(true);
    setMsg('');
    try {
      await savePaziente(cur);
      await loadList();
      setMsg('✅ Scheda salvata con successo!');
    } catch (e) {
      setMsg(`❌ Errore salvataggio: ${e?.message || 'Controlla la connessione'}`);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    const code = cur.codice ? cur.codice.trim().toUpperCase() : '';
    if (!code) {
      setMsg('Inserisci un Codice Paziente.');
      return;
    }

    const isDuplicate = cur._isNew && list.some((p) => p.codice.trim().toUpperCase() === code);
    if (isDuplicate) {
      confirmAction({
        title: 'Codice Paziente Già Esistente',
        message: `Attenzione: Esiste già un paziente con codice "${code}". Se procedi, la sua scheda verrà completamente SOVRASCRITTA. Vuoi davvero continuare?`,
        confirmText: 'Sì, sovrascrivi scheda',
        cancelText: 'Annulla',
        onConfirm: executeSave,
      });
      return;
    }

    await executeSave();
  };

  return (
    <SafeAreaView style={[s.bg, { flex: 1, minHeight: 0 }]}>
      <View style={s.top}>
        <Image
          source={require('./assets/logo.png')}
          style={{ width: 42, height: 42, borderRadius: 8, marginRight: 10, backgroundColor: '#000' }}
          resizeMode="contain"
        />
        <View style={{ flex: 1 }}>
          <Text style={s.brand}>B-sportlab • Dottore</Text>
          <Text style={s.doc}>Federico Baldassarre</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            confirmAction({
              title: 'Conferma uscita',
              message: 'Vuoi uscire dal pannello Dottore?',
              confirmText: 'Esci',
              cancelText: 'Annulla',
              onConfirm: onLogout,
            });
          }}
        >
          <Text style={s.saveBadge}>🔒 Esci</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, minHeight: 0 }} contentContainerStyle={[s.pad, { flexGrow: 1, paddingBottom: 120 }]}>
        {!cur ? (
          <View>
            <View style={s.rowBet}>
              <Text style={s.sec}>Pazienti ({list.length})</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  style={[s.btn, { marginTop: 0, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#EFF6FF', borderColor: '#3B82F6' }]}
                  onPress={() => openNewWithMetodo('BENESSERE')}
                >
                  <Text style={[s.btnTxt, { color: '#1D4ED8', fontSize: 12 }]}>🩺 Nuova Visita</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.btn, { marginTop: 0, paddingVertical: 8, paddingHorizontal: 12 }]}
                  onPress={() => setShowNewModal(!showNewModal)}
                >
                  <Text style={s.btnTxt}>{showNewModal ? '✕ Annulla' : '+ Nuovo Paziente'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Barra Ricerca Pazienti */}
            <View style={{ marginVertical: 10 }}>
              <TextInput
                style={[s.inp, { textAlign: 'left', fontSize: 13, paddingHorizontal: 12, outlineStyle: 'none' }]}
                placeholder="🔍 Cerca paziente per nome, cognome o codice..."
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {/* SELETTORE PROFILO INIZIALE PER IL NUOVO PAZIENTE */}
            {showNewModal ? (
              <View style={[s.card, { borderWidth: 2, borderColor: LIME_DARK, backgroundColor: '#F7FEE7', marginVertical: 12, padding: 14 }]}>
                <Text style={[s.bold, { fontSize: 16, color: '#166534', marginBottom: 2 }]}>
                  Seleziona il Profilo del Nuovo Paziente:
                </Text>
                <Text style={[s.txt, { fontSize: 12, marginBottom: 12, color: '#15803D' }]}>
                  Tocca il modello clinico desiderato per aprire la scheda preconfigurata:
                </Text>
                {[
                  { id: 'BENESSERE', label: '🌱 Benessere & Salute', desc: '1 sola giornata standard equilibrata, passi e idratazione' },
                  { id: 'FITNESS', label: '⚡ Fitness / Amatoriale', desc: 'Giorno di riposo + 1-3 allenamenti a calorie e carbo aumentati' },
                  { id: 'ATLETA', label: '🔥 Atleta / Performance', desc: 'BMR x coeff + kJ giornalieri, peri-workout (intra/post) e microciclo a date reali' },
                ].map((prof) => (
                  <TouchableOpacity
                    key={prof.id}
                    style={[s.card, { backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', marginBottom: 8, padding: 12 }]}
                    onPress={() => openNewWithMetodo(prof.id)}
                  >
                    <Text style={[s.bold, { fontSize: 15, color: '#0F172A' }]}>{prof.label}</Text>
                    <Text style={[s.txt, { fontSize: 12, color: '#64748B', marginTop: 2 }]}>{prof.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {loading ? <ActivityIndicator size="large" color={LIME_DARK} style={{ marginVertical: 16 }} /> : null}
            {msg ? <Text style={s.errTxt}>{msg}</Text> : null}

            {list
              .filter((p) => {
                const q = search.trim().toLowerCase();
                if (!q) return true;
                const cod = (p.codice || '').toLowerCase();
                const n = (p.anagrafica?.nome || '').toLowerCase();
                const c = (p.anagrafica?.cognome || '').toLowerCase();
                const full = `${n} ${c}`.trim();
                return cod.includes(q) || n.includes(q) || c.includes(q) || full.includes(q);
              })
              .map((p) => {
                const athInfo = getAthleteEndInfo(p);
                const fullName = p.anagrafica?.nome || p.anagrafica?.cognome
                  ? `${p.anagrafica.nome || ''} ${p.anagrafica.cognome || ''}`.trim().toUpperCase()
                  : '';
                const numVisite = (p.visite_antropometriche || []).length;
                return (
                  <TouchableOpacity
                    key={p.codice}
                    style={[s.card, { borderLeftWidth: 4, borderColor: p.attivo ? '#15803D' : '#E53E3E' }]}
                    onPress={() => openEdit(p)}
                  >
                    <View style={s.rowBet}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[s.rTitle, { fontSize: 15.5, color: '#0F172A', marginBottom: 2 }]}>
                          {fullName || p.codice}
                        </Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B' }}>
                          🔑 Codice: <Text style={{ color: '#0F172A' }}>{p.codice}</Text>
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 12, color: p.attivo ? '#15803D' : '#E53E3E' }}>
                          {p.attivo ? '● ATTIVO' : '● BLOCCATO'}
                        </Text>
                        <TouchableOpacity
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            handleDeletePaziente(p.codice);
                          }}
                          style={{ paddingHorizontal: 6, paddingVertical: 2, marginLeft: 4 }}
                        >
                          <Text style={{ fontSize: 15 }}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      <Text style={s.txt}>
                        {p.peso_visita} kg • {p.metodo === 'ATLETA' ? '🔥 Atleta' : p.metodo === 'BENESSERE' ? '🌱 Benessere' : '⚡ Fitness'}
                      </Text>
                      {numVisite > 0 ? (
                        <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                          <Text style={{ fontSize: 10.5, fontWeight: 'bold', color: '#1E40AF' }}>
                            📊 {numVisite} {numVisite === 1 ? 'visita' : 'visite'}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                  {athInfo ? (
                    <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>
                      <View
                        style={{
                          backgroundColor: athInfo.isExpired
                            ? '#FEE2E2'
                            : athInfo.isToday || athInfo.isTomorrow || athInfo.diff <= 2
                            ? '#FEF3C7'
                            : '#F0FDF4',
                          borderWidth: 1,
                          borderColor: athInfo.isExpired
                            ? '#FCA5A5'
                            : athInfo.isToday || athInfo.isTomorrow || athInfo.diff <= 2
                            ? '#FCD34D'
                            : '#86EFAC',
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 6,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: 'bold',
                            color: athInfo.isExpired
                              ? '#991B1B'
                              : athInfo.isToday || athInfo.isTomorrow || athInfo.diff <= 2
                              ? '#92400E'
                              : '#166534',
                          }}
                        >
                          {athInfo.isExpired
                            ? `🔴 Terminato il ${athInfo.date}`
                            : athInfo.isToday
                            ? `⚠️ Scade OGGI (${athInfo.date})`
                            : athInfo.isTomorrow
                            ? `⚠️ Scade DOMANI (${athInfo.date})`
                            : `🏁 Fine piano: ${athInfo.date} (${athInfo.diff} gg rimasti)`}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <AdminForm
            cur={cur}
            setCur={setCur}
            onBack={() => setCur(null)}
            onSave={handleSave}
            onDelete={() => handleDeletePaziente(cur.codice)}
            existingCodes={list.map((p) => p.codice)}
            isNew={Boolean(cur._isNew)}
            initialCodice={cur._initialCodice || cur.codice}
            loading={loading}
            msg={msg}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
