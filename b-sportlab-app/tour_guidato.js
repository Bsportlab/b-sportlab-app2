import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { s, LIME, LIME_DARK, LIME_TEXT } from './stile';

export const TOUR_STORAGE_KEY = '@bsportlab_tour_completed_v1';

export function TourGuidatoModal({ visible, onClose, paziente, onNeverShowAgain }) {
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  const hasAntropo = Boolean(
    (paziente?.visite_antropometriche && paziente.visite_antropometriche.length > 0) ||
    paziente?.ha_antropometria === true
  );

  // Costruzione dinamica delle slide in base al piano e profilo del paziente
  const slides = useMemo(() => {
    const list = [];

    // ─── SLIDE 1: BENVENUTO ───
    list.push({
      id: 'welcome',
      icon: '🏆',
      title: 'Benvenuto in B-sportlab!',
      subtitle: 'Il tuo ecosistema nutrizionale e atletico personalizzato.',
      body: (
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 13.5, color: '#334155', lineHeight: 19 }}>
            Questa applicazione è stata creata dal <Text style={{ fontWeight: 'bold', color: '#0F172A' }}>Dott. Federico Baldassarre</Text> per darti uno strumento completo, scientifico e flessibile per raggiungere i tuoi obiettivi di salute, ricomposizione corporea e performance.
          </Text>
          <View style={{ backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#86EFAC', borderRadius: 8, padding: 10 }}>
            <Text style={{ fontSize: 12.5, color: '#166534', fontWeight: '600' }}>
              💡 Flessibilità totale: i pasti non sono una gabbia rigida, ma un percorso su misura adattabile ai tuoi impegni e preferenze quotidiane.
            </Text>
          </View>
        </View>
      ),
    });

    // ─── SLIDE 2: LE 3 MODALITÀ DEL PIANO ───
    list.push({
      id: 'modes',
      icon: '🍽️',
      title: 'Come Gestire i Tuoi Pasti',
      subtitle: 'Scegli la modalità più comoda per la tua giornata.',
      body: (
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 13, color: '#475569', lineHeight: 18 }}>
            Nel tab <Text style={{ fontWeight: 'bold', color: '#0F172A' }}>🥗 Il Tuo Piano</Text> hai a disposizione 3 modalità pratiche:
          </Text>

          <View style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 9 }}>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0F172A' }}>1. 🍲 Ricettario Personalizzato</Text>
            <Text style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
              Piatti pronti bilanciati con ingredienti dosati al grammo esatto per il tuo fabbisogno.
            </Text>
          </View>

          <View style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 9 }}>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0F172A' }}>2. 🍽️ Componi Piatto Semplice</Text>
            <Text style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
              Massima rapidità: scegli la tua fonte di carboidrati, proteine e grassi preferita con i pesi già calcolati a crudo/cotto.
            </Text>
          </View>

          <View style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 9 }}>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0F172A' }}>3. 📖 Diario Libero (Macro-Tracker)</Text>
            <Text style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
              Libertà di comporre il pasto pesando a piacere gli alimenti, con indicatore real-time dei macronutrienti rimanenti.
            </Text>
          </View>
        </View>
      ),
    });

    // ─── SLIDE 2B: COME FUNZIONA IL DIARIO LIBERO ───
    list.push({
      id: 'diario_libero',
      icon: '📖',
      title: 'Come Funziona il Diario Libero',
      subtitle: 'Massima flessibilità per pasti fuori casa o imprevisti.',
      body: (
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 13, color: '#475569', lineHeight: 18 }}>
            Se mangi al ristorante, prepari una ricetta tua o non puoi seguire il menù fisso, usa il <Text style={{ fontWeight: 'bold', color: '#0F172A' }}>Diario Libero</Text> in 3 semplici passaggi:
          </Text>

          <View style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 8 }}>
            <Text style={{ fontSize: 12.5, fontWeight: 'bold', color: '#0F172A' }}>1️⃣ Scegli il pasto e cerca l’alimento</Text>
            <Text style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>
              Tocca "+ Aggiungi" (es. a Pranzo o Cena) e cerca il cibo nel catalogo certificato CREA.
            </Text>
          </View>

          <View style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 8 }}>
            <Text style={{ fontSize: 12.5, fontWeight: 'bold', color: '#0F172A' }}>2️⃣ Inserisci i grammi (crudo o cotto)</Text>
            <Text style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>
              Pesa gli alimenti. Se hai pesato riso o pasta già cotti, attiva lo switch "Peso Cotto": l'app converte automaticamente i valori!
            </Text>
          </View>

          <View style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 8 }}>
            <Text style={{ fontSize: 12.5, fontWeight: 'bold', color: '#0F172A' }}>3️⃣ Segui la barra dei target in alto</Text>
            <Text style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>
              La barra scura si aggiorna in tempo reale mostrandoti quante Proteine, Carboidrati e Grassi ti mancano per completare la giornata.
            </Text>
          </View>

          <View style={{ backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#86EFAC', borderRadius: 8, padding: 9 }}>
            <Text style={{ fontSize: 12, color: '#166534', fontWeight: 'bold' }}>
              💡 Regola del Dott. Baldassarre:
            </Text>
            <Text style={{ fontSize: 11.5, color: '#14532D', marginTop: 2, lineHeight: 16 }}>
              Non serve la perfezione maniacale al grammo! Punta ad avvicinarti ai target a fine giornata, dando sempre priorità alla quota proteica e alle verdure.
            </Text>
          </View>
        </View>
      ),
    });

    // ─── SLIDE 3: COMPOSIZIONE CORPOREA (Se presente) ───
    if (hasAntropo) {
      list.push({
        id: 'antropo',
        icon: '📊',
        title: 'La Tua Composizione Corporea',
        subtitle: 'Oltre il semplice numero sulla bilancia.',
        body: (
          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 13, color: '#334155', lineHeight: 19 }}>
              Grazie alla visita specialistica con plicometro e calibro osseo, nella sezione <Text style={{ fontWeight: 'bold', color: '#0F172A' }}>👤 Profilo ➔ Composizione Corporea</Text> puoi consultare:
            </Text>

            <View style={{ backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 8, padding: 10 }}>
              <Text style={{ fontSize: 12.5, color: '#1E40AF', fontWeight: 'bold', marginBottom: 3 }}>
                🥩 Modello Clinico a 4 Compartimenti:
              </Text>
              <Text style={{ fontSize: 12, color: '#1E3A8A' }}>
                • <Text style={{ fontWeight: 'bold' }}>Massa Muscolare Scheletrica</Text> (kg e % su FFM){'\n'}
                • <Text style={{ fontWeight: 'bold' }}>Massa Grassa</Text> (essenziale, sottocutanea e viscerale){'\n'}
                • <Text style={{ fontWeight: 'bold' }}>Tessuto Osseo</Text> e Biotipo{'\n'}
                • <Text style={{ fontWeight: 'bold' }}>Liquidi & Metabolismo Basale Muscolare</Text>
              </Text>
            </View>

            <Text style={{ fontSize: 12, color: '#64748B' }}>
              📄 Puoi scaricare o stampare in ogni momento il tuo referto clinico completo in PDF vettoriale ad alta definizione.
            </Text>
          </View>
        ),
      });
    }

    // ─── SLIDE 4: MENU SETTIMANA & SPESA ───
    list.push({
      id: 'shop',
      icon: '📅',
      title: 'Menù Settimana & Spesa Facile',
      subtitle: 'Organizza in anticipo per risparmiare tempo e stress.',
      body: (
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 13, color: '#334155', lineHeight: 19 }}>
            Nel tab <Text style={{ fontWeight: 'bold', color: '#0F172A' }}>📅 Menù Settimana</Text> puoi pre-impostare i tuoi pasti per i diversi giorni della settimana (Lunedì-Domenica).
          </Text>
          <View style={{ backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FCD34D', borderRadius: 8, padding: 10 }}>
            <Text style={{ fontSize: 12.5, color: '#92400E', fontWeight: 'bold', marginBottom: 2 }}>
              🛒 Lista della Spesa Intelligente:
            </Text>
            <Text style={{ fontSize: 12, color: '#78350F' }}>
              Tocca il pulsante Spesa per raggruppare automaticamente tutti gli ingredienti necessari divisi per reparto, pronti da spuntare al supermercato!
            </Text>
          </View>
        </View>
      ),
    });

    // ─── SLIDE 5: CONSIGLI & LINEE GUIDA ───
    list.push({
      id: 'tips',
      icon: '💡',
      title: 'Guida & Consigli del Nutrizionista',
      subtitle: 'Le regole d’oro per salute, recupero e longevità.',
      body: (
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 13, color: '#334155', lineHeight: 19 }}>
            Nel tab <Text style={{ fontWeight: 'bold', color: '#0F172A' }}>💡 Consigli</Text> trovi 12 capitoli pratici basati su evidenze scientifiche:
          </Text>
          <View style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 10 }}>
            <Text style={{ fontSize: 12, color: '#334155', lineHeight: 18 }}>
              • Microplastiche, padelle rovinate e conservazione sicura{'\n'}
              • Idratazione e l'importanza del <Text style={{ fontWeight: 'bold' }}>Sale Iodato</Text>{'\n'}
              • Caffeina: perché massimo 3 caffè al giorno{'\n'}
              • Sonno, ormoni del recupero e digestione senza gonfiore
            </Text>
          </View>
        </View>
      ),
    });

    // ─── SLIDE 6: PROFILO, PESO E SALVATAGGIO ───
    list.push({
      id: 'profile',
      icon: '👤',
      title: 'Profilo, Diario Peso & PDF',
      subtitle: 'Il tuo centro di controllo personale.',
      body: (
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 13, color: '#334155', lineHeight: 19 }}>
            Nel tab <Text style={{ fontWeight: 'bold', color: '#0F172A' }}>👤 Profilo</Text> puoi:
          </Text>
          <View style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 10 }}>
            <Text style={{ fontSize: 12, color: '#334155', lineHeight: 18 }}>
              • Registrare periodicamente il tuo peso nel <Text style={{ fontWeight: 'bold' }}>Diario Peso</Text>{'\n'}
              • Impostare intolleranze o alimenti esclusi nei <Text style={{ fontWeight: 'bold' }}>Filtri</Text>{'\n'}
              • Ritrovare le ricette salvate con il cuoricino nei <Text style={{ fontWeight: 'bold' }}>Preferiti</Text>{'\n'}
              • Scaricare la scheda completa in <Text style={{ fontWeight: 'bold' }}>PDF stampabile</Text>
            </Text>
          </View>
        </View>
      ),
    });

    return list;
  }, [hasAntropo]);

  const curSlide = slides[step] || slides[0];
  const isLast = step === slides.length - 1;

  const handleFinish = async () => {
    if (dontShowAgain) {
      try {
        await AsyncStorage.setItem(TOUR_STORAGE_KEY, 'true');
        onNeverShowAgain?.();
      } catch (e) {
        console.warn('Errore salvataggio tour:', e);
      }
    }
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleFinish}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
        }}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 480,
            maxHeight: '90%',
            borderWidth: 1,
            borderColor: '#CBD5E1',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          {/* Header con Tasto Salta */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: LIME_DARK, letterSpacing: 1 }}>
                GUIDA INTERATTIVA ({step + 1}/{slides.length})
              </Text>
            </View>
            <TouchableOpacity onPress={handleFinish} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ fontSize: 13, color: '#94A3B8', fontWeight: 'bold' }}>✕ Salta</Text>
            </TouchableOpacity>
          </View>

          {/* Icona & Titolo */}
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#F7FEE7',
                borderWidth: 2,
                borderColor: LIME_DARK,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
              }}
            >
              <Text style={{ fontSize: 30 }}>{curSlide.icon}</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', textAlign: 'center' }}>
              {curSlide.title}
            </Text>
            <Text style={{ fontSize: 12.5, color: '#64748B', textAlign: 'center', marginTop: 2 }}>
              {curSlide.subtitle}
            </Text>
          </View>

          {/* Corpo Scorrevole */}
          <ScrollView style={{ maxHeight: 250, marginVertical: 6 }} showsVerticalScrollIndicator={false}>
            {curSlide.body}
          </ScrollView>

          {/* Indicatori Dots */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginVertical: 14 }}>
            {slides.map((sItem, idx) => (
              <View
                key={sItem.id}
                style={{
                  width: idx === step ? 20 : 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: idx === step ? LIME_DARK : '#CBD5E1',
                }}
              />
            ))}
          </View>

          {/* Opzione Non mostrare più */}
          <TouchableOpacity
            onPress={() => setDontShowAgain(!dontShowAgain)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 }}
          >
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                borderWidth: 1.5,
                borderColor: dontShowAgain ? LIME_DARK : '#94A3B8',
                backgroundColor: dontShowAgain ? LIME_DARK : '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {dontShowAgain ? <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>✓</Text> : null}
            </View>
            <Text style={{ fontSize: 12, color: '#475569', fontWeight: '500' }}>
              Non mostrare più all'avvio
            </Text>
          </TouchableOpacity>

          {/* Pulsanti Navigazione */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {step > 0 ? (
              <TouchableOpacity
                onPress={() => setStep((prev) => prev - 1)}
                style={{
                  flex: 1,
                  backgroundColor: '#F1F5F9',
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#475569' }}>← Indietro</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={isLast ? handleFinish : () => setStep((prev) => prev + 1)}
              style={{
                flex: 2,
                backgroundColor: LIME,
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: LIME_DARK,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0F172A' }}>
                {isLast ? 'Inizia Subito 🚀' : 'Avanti →'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
