import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  Linking,
  Alert,
  ScrollView,
} from 'react-native';

const WHATSAPP_PHONE = '393519246513';

const COPY = {
  it: {
    defaultWaMessage:
      'Ciao, vorrei richiedere o recuperare il mio codice paziente per B-sportlab.',
    subtitle:
      'Inserisci il codice assegnato dal tuo nutrizionista per accedere al piano.',
    codeLabel: 'CODICE PAZIENTE',
    emptyCodeError: 'Inserisci il tuo codice paziente per continuare.',
    enterBtn: 'ENTRA NEL PIANO',
    contactTitle: 'Contatta il tuo nutrizionista',
    contactHint:
      'Modifica pure il messaggio qui sotto prima di inviarlo su WhatsApp:',
    waPlaceholder: 'Scrivi qui il tuo messaggio per WhatsApp...',
    waBtn: 'INVIA SU WHATSAPP',
    waUnavailableTitle: 'WhatsApp non disponibile',
    waUnavailableMsg: 'Puoi scrivere direttamente al numero +39 351 924 6513.',
    waErrorTitle: 'Errore apertura WhatsApp',
    waErrorMsg:
      'Controlla la connessione o scrivi al numero +39 351 924 6513.',
    doctorToggle: '👨‍⚕️ Accesso Dottore',
    doctorEmailPh: 'Email',
    doctorPassPh: 'Password',
    doctorLoginBtn: 'ACCEDI COME DOTTORE',
    doctorLoading: 'ACCESSO IN CORSO...',
    doctorFieldsError: 'Inserisci email e password.',
  },
  en: {
    defaultWaMessage:
      'Hi, I would like to request or recover my patient code for B-sportlab.',
    subtitle:
      'Enter the code assigned by your nutritionist to access your plan.',
    codeLabel: 'PATIENT CODE',
    emptyCodeError: 'Enter your patient code to continue.',
    enterBtn: 'ENTER PLAN',
    contactTitle: 'Contact your nutritionist',
    contactHint:
      'Feel free to edit the message below before sending it on WhatsApp:',
    waPlaceholder: 'Write your WhatsApp message here...',
    waBtn: 'SEND ON WHATSAPP',
    waUnavailableTitle: 'WhatsApp unavailable',
    waUnavailableMsg: 'You can message +39 351 924 6513 directly.',
    waErrorTitle: 'Error opening WhatsApp',
    waErrorMsg:
      'Check your connection or message +39 351 924 6513.',
    doctorToggle: '👨‍⚕️ Doctor Access',
    doctorEmailPh: 'Email',
    doctorPassPh: 'Password',
    doctorLoginBtn: 'LOG IN AS DOCTOR',
    doctorLoading: 'LOGGING IN...',
    doctorFieldsError: 'Enter email and password.',
  },
  fr: {
    defaultWaMessage:
      'Bonjour, je souhaiterais demander ou récupérer mon code patient pour B-sportlab.',
    subtitle:
      'Saisissez le code attribué par votre nutritionniste pour accéder au programme.',
    codeLabel: 'CODE PATIENT',
    emptyCodeError: 'Saisissez votre code patient pour continuer.',
    enterBtn: 'ACCÉDER AU PROGRAMME',
    contactTitle: 'Contacter votre nutritionniste',
    contactHint:
      'Vous pouvez modifier le message ci-dessous avant de l\u2019envoyer sur WhatsApp :',
    waPlaceholder: 'Écrivez ici votre message WhatsApp...',
    waBtn: 'ENVOYER SUR WHATSAPP',
    waUnavailableTitle: 'WhatsApp indisponible',
    waUnavailableMsg: 'Vous pouvez écrire directement au +39 351 924 6513.',
    waErrorTitle: 'Erreur lors de l\u2019ouverture de WhatsApp',
    waErrorMsg:
      'Vérifiez votre connexion ou écrivez au +39 351 924 6513.',
    doctorToggle: '👨‍⚕️ Accès Médecin',
    doctorEmailPh: 'E-mail',
    doctorPassPh: 'Mot de passe',
    doctorLoginBtn: 'SE CONNECTER',
    doctorLoading: 'CONNEXION...',
    doctorFieldsError: 'Saisissez l\u2019e-mail et le mot de passe.',
  },
};

export default function SchermataCodicePaziente({
  onSubmitCode,
  onDoctorLogin,
  initialCode = '',
  errorMessage = '',
  initialWaMessage = null,
  logoUri = null,
  logoSource = null,
  headerSlot = null,
  lang = 'it',
}) {
  const safeLang = COPY[lang] ? lang : 'it';
  const txt = COPY[safeLang];
  const resolvedDefaultWa = initialWaMessage || txt.defaultWaMessage;

  // ─── Stato paziente ────────────────────────────────
  const [codice, setCodice] = useState(initialCode);
  const [localError, setLocalError] = useState('');
  const [messaggioWa, setMessaggioWa] = useState(resolvedDefaultWa);
  const [waEdited, setWaEdited] = useState(false);

  // ─── Stato dottore ─────────────────────────────────
  const [showDoctor, setShowDoctor] = useState(false);
  const [docEmail, setDocEmail] = useState('');
  const [docPass, setDocPass] = useState('');
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState('');

  useEffect(() => {
    setCodice((prev) => (prev === initialCode ? prev : initialCode));
  }, [initialCode]);

  const displayedWaMessage = waEdited ? messaggioWa : resolvedDefaultWa;

  // ─── Handler paziente ──────────────────────────────
  const handleCodeChange = (text) => {
    setCodice(text.toUpperCase().replace(/\s+/g, ''));
    if (localError) setLocalError('');
  };

  const handleEnter = () => {
    const cleanCode = codice.trim().toUpperCase();
    if (!cleanCode) {
      setLocalError(txt.emptyCodeError);
      return;
    }
    setLocalError('');
    if (typeof onSubmitCode === 'function') {
      onSubmitCode(cleanCode);
    }
  };

  // ─── Handler WhatsApp ──────────────────────────────
  const handleWaChange = (text) => {
    setWaEdited(true);
    setMessaggioWa(text);
  };

  const handleOpenWhatsApp = async () => {
    const textToSend = (displayedWaMessage || '').trim() || resolvedDefaultWa;
    const encodedText = encodeURIComponent(textToSend);
    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedText}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported || Platform.OS === 'web') {
        await Linking.openURL(url);
      } else {
        Alert.alert(txt.waUnavailableTitle, txt.waUnavailableMsg);
      }
    } catch {
      Alert.alert(txt.waErrorTitle, txt.waErrorMsg);
    }
  };

  // ─── Handler dottore ───────────────────────────────
  const handleDoctorSubmit = async () => {
    if (!docEmail.trim() || !docPass) {
      setDocError(txt.doctorFieldsError);
      return;
    }
    setDocLoading(true);
    setDocError('');
    try {
      await onDoctorLogin(docEmail.trim(), docPass);
    } catch (e) {
      setDocError(e.message || 'Errore di accesso.');
    }
    setDocLoading(false);
  };

  const shownError = localError || errorMessage;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {headerSlot}

          <View style={styles.brandHeader}>
            {logoSource ? (
              <Image
                source={logoSource}
                style={styles.logoImage}
                resizeMode="contain"
              />
            ) : logoUri ? (
              <Image
                source={{ uri: logoUri }}
                style={styles.logoImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.logoFrame}>
                <Text style={styles.logoBig}>B-</Text>
                <Text style={styles.logoSub}>SportLab</Text>
              </View>
            )}
            <Text style={styles.subtitle}>{txt.subtitle}</Text>
          </View>

          {/* ─── Sezione Paziente ─── */}
          <View style={styles.formSection}>
            <Text style={styles.label}>{txt.codeLabel}</Text>
            <TextInput
              value={codice}
              onChangeText={handleCodeChange}
              onSubmitEditing={handleEnter}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="go"
              style={[
                styles.input,
                shownError ? styles.inputError : codice ? styles.inputActive : null,
              ]}
            />

            {shownError ? <Text style={styles.errorText}>{shownError}</Text> : null}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleEnter}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>{txt.enterBtn}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* ─── Sezione WhatsApp ─── */}
          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>{txt.contactTitle}</Text>
            <Text style={styles.contactHint}>{txt.contactHint}</Text>

            <TextInput
              value={displayedWaMessage}
              onChangeText={handleWaChange}
              placeholder={txt.waPlaceholder}
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={styles.waTextarea}
            />

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleOpenWhatsApp}
              style={styles.waBtn}
            >
              <Text style={styles.waBtnText}>{txt.waBtn}</Text>
            </TouchableOpacity>
          </View>

          {/* ─── Sezione Login Dottore ─── */}
          {onDoctorLogin ? (
            <>
              <View style={styles.divider} />

              <TouchableOpacity
                onPress={() => { setShowDoctor(!showDoctor); setDocError(''); }}
                style={styles.doctorToggleBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.doctorToggleText}>
                  {showDoctor ? '▾' : '▸'} {txt.doctorToggle}
                </Text>
              </TouchableOpacity>

              {showDoctor ? (
                <View style={styles.doctorSection}>
                  <TextInput
                    value={docEmail}
                    onChangeText={(v) => { setDocEmail(v); setDocError(''); }}
                    placeholder={txt.doctorEmailPh}
                    placeholderTextColor="#64748B"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    style={styles.doctorInput}
                  />
                  <TextInput
                    value={docPass}
                    onChangeText={(v) => { setDocPass(v); setDocError(''); }}
                    placeholder={txt.doctorPassPh}
                    placeholderTextColor="#64748B"
                    secureTextEntry
                    onSubmitEditing={handleDoctorSubmit}
                    returnKeyType="go"
                    style={styles.doctorInput}
                  />

                  {docError ? <Text style={styles.errorText}>{docError}</Text> : null}

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleDoctorSubmit}
                    style={styles.doctorBtn}
                    disabled={docLoading}
                  >
                    <Text style={styles.doctorBtnText}>
                      {docLoading ? txt.doctorLoading : txt.doctorLoginBtn}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </>
          ) : null}

          {/* Copyright notice */}
          <View style={{ marginTop: 32, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: '#52525B', textAlign: 'center' }}>
              © 2025-2026 B-sportlab di Federico Baldassarre
            </Text>
            <Text style={{ fontSize: 10, color: '#3F3F46', textAlign: 'center', marginTop: 2 }}>
              Tutti i diritti riservati • Biologo Nutrizionista Sportivo
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const LIME = '#A3E635';
const LIME_BRIGHT = '#BEF264';
const BG_BLACK = '#050505';
const TEXT_WHITE = '#F8FAFC';
const TEXT_MUTED = '#94A3B8';
const BORDER_SUBTLE = '#27272A';
const ERROR_RED = '#F87171';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG_BLACK,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 28,
    paddingBottom: 40,
  },
  container: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  brandHeader: {
    marginBottom: 24,
  },
  logoImage: {
    width: 140,
    height: 140,
    marginBottom: 14,
  },
  logoFrame: {
    alignSelf: 'flex-start',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: LIME,
    paddingTop: 8,
    paddingLeft: 12,
    paddingRight: 18,
    paddingBottom: 10,
    marginBottom: 14,
  },
  logoBig: {
    color: LIME_BRIGHT,
    fontSize: 44,
    fontWeight: '900',
    lineHeight: 46,
    letterSpacing: -1,
  },
  logoSub: {
    color: LIME,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 26,
    marginTop: 2,
  },
  subtitle: {
    color: TEXT_MUTED,
    fontSize: 15,
    lineHeight: 22,
  },
  formSection: {
    gap: 12,
  },
  label: {
    color: LIME,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  input: {
    color: TEXT_WHITE,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: BORDER_SUBTLE,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  inputActive: {
    borderColor: LIME,
  },
  inputError: {
    borderColor: ERROR_RED,
  },
  errorText: {
    color: ERROR_RED,
    fontSize: 13,
    lineHeight: 18,
  },
  primaryBtn: {
    marginTop: 6,
    backgroundColor: LIME,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: BG_BLACK,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER_SUBTLE,
    marginVertical: 24,
  },
  contactSection: {
    gap: 10,
  },
  contactTitle: {
    color: TEXT_WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
  contactHint: {
    color: TEXT_MUTED,
    fontSize: 14,
    lineHeight: 20,
  },
  waTextarea: {
    color: TEXT_WHITE,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 80,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: BORDER_SUBTLE,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  waBtn: {
    marginTop: 2,
    borderWidth: 1.5,
    borderColor: LIME,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  waBtnText: {
    color: LIME_BRIGHT,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  // ─── Sezione Dottore ────────────────────────────────
  doctorToggleBtn: {
    paddingVertical: 6,
  },
  doctorToggleText: {
    color: TEXT_MUTED,
    fontSize: 14,
    fontWeight: '600',
  },
  doctorSection: {
    gap: 10,
    marginTop: 10,
  },
  doctorInput: {
    color: TEXT_WHITE,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: BORDER_SUBTLE,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  doctorBtn: {
    marginTop: 4,
    borderWidth: 1.5,
    borderColor: LIME,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  doctorBtnText: {
    color: LIME_BRIGHT,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});
