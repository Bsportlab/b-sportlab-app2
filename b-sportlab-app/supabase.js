import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://jkfhpjtzbkhjtxuktjag.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-ZcWi99q9MV9fUfhAX31Mg_74vG3Xrr';

const cleanUrl = SUPABASE_URL.trim().replace(/\/+$/,'');
const AUTH_STORAGE_KEY = '@bsportlab_auth_v1';

// ─── Sessione interna ──────────────────────────────────
let cachedSession = null;

function makeHeaders(accessToken) {
  const token = accessToken || SUPABASE_ANON_KEY;
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function getAccessToken() {
  const s = await getSession();
  return s?.access_token || null;
}

// ─── Auth Dottore ──────────────────────────────────────
export async function getSession() {
  if (cachedSession) return cachedSession;
  try {
    const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) cachedSession = JSON.parse(raw);
  } catch (err) {
    console.warn('Errore recupero sessione locale:', err);
  }
  return cachedSession;
}

export function isAuthenticated() {
  return Boolean(cachedSession?.access_token);
}

export async function signInDoctor(email, password) {
  const res = await fetch(`${cleanUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || err.msg || 'Email o password non validi.');
  }

  const data = await res.json();
  cachedSession = data;
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  return data;
}

export async function signOutDoctor() {
  const session = cachedSession;
  cachedSession = null;
  await AsyncStorage.removeItem(AUTH_STORAGE_KEY).catch(() => {});

  if (session?.access_token) {
    fetch(`${cleanUrl}/auth/v1/logout`, {
      method: 'POST',
      headers: makeHeaders(session.access_token),
    }).catch(() => {});
  }
}

export async function restoreSession() {
  const session = await getSession();
  if (!session?.access_token) return null;

  // Verifica che il token sia ancora valido
  const res = await fetch(`${cleanUrl}/auth/v1/user`, {
    headers: makeHeaders(session.access_token),
  });

  if (res.ok) return session;

  // Token scaduto → prova refresh
  if (session.refresh_token) {
    try {
      const rRes = await fetch(`${cleanUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      });

      if (rRes.ok) {
        const fresh = await rRes.json();
        cachedSession = fresh;
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fresh));
        return fresh;
      }
    } catch (err) {
      console.warn('Errore refresh token sessione:', err);
    }
  }

  // Sessione non più valida → pulisci
  cachedSession = null;
  await AsyncStorage.removeItem(AUTH_STORAGE_KEY).catch(() => {});
  return null;
}

// ─── API Dati Pazienti ─────────────────────────────────
export async function getPaziente(codice) {
  const clean = codice.trim().toUpperCase();
  const res = await fetch(
    `${cleanUrl}/rest/v1/pazienti?codice=eq.${encodeURIComponent(clean)}&select=*`,
    { headers: makeHeaders() },
  );
  if (!res.ok) throw new Error('Errore connessione database');
  const rows = await res.json();
  if (rows.length === 0) return null;
const row = rows[0];
if (!row.integratori && row.piano_dati?.integratori) {
  row.integratori = row.piano_dati.integratori;
}
// Sanificazione rigorosa di privacy clinica: le note private del dottore NON devono MAI raggiungere l'app del paziente
if (row.piano_dati?.note_private_dottore) {
  delete row.piano_dati.note_private_dottore;
}
if (row.note_private_dottore) {
  delete row.note_private_dottore;
}
return row;
}

export async function getAllPazienti() {
  const token = await getAccessToken();
  if (!token) throw new Error('Accesso non autorizzato. Effettua il login.');

  const res = await fetch(
    `${cleanUrl}/rest/v1/pazienti?select=*&order=aggiornato_il.desc`,
    { headers: makeHeaders(token) },
  );
  if (!res.ok) throw new Error('Errore lettura pazienti');
  const list = await res.json();
return list.map((row) => {
  if (!row.integratori && row.piano_dati?.integratori) {
    row.integratori = row.piano_dati.integratori;
  }
  return row;
});
}

export async function savePaziente(paziente) {
  const token = await getAccessToken();

  const pesoNum = parseFloat(String(paziente.peso_visita || '70').replace(',', '.')) || 70;
  const coeffNum = parseFloat(String(paziente.coeff_carbo || '2.0').replace(',', '.')) || 2.0;

  const rawMetodo = paziente.metodo || paziente.piano_dati?.metodo || 'BENESSERE';

  const pianoDati = {
    ...(paziente.piano_dati || {}),
    metodo: rawMetodo,
    passi_target: Number(paziente.passi_target ?? 8000),
    integratori: Array.isArray(paziente.integratori) ? paziente.integratori : (Array.isArray(paziente.piano_dati?.integratori) ? paziente.piano_dati.integratori : []),
    storico_piani: Array.isArray(paziente.storico_piani) ? paziente.storico_piani : [],
    anagrafica: paziente.anagrafica || paziente.piano_dati?.anagrafica || {},
    note_private_dottore: paziente.note_private_dottore || paziente.piano_dati?.note_private_dottore || '',
    mostra_note_dottore: paziente.mostra_note_dottore !== undefined ? Boolean(paziente.mostra_note_dottore) : (paziente.piano_dati?.mostra_note_dottore !== undefined ? Boolean(paziente.piano_dati.mostra_note_dottore) : true),
    visite_antropometriche: Array.isArray(paziente.visite_antropometriche) ? paziente.visite_antropometriche : (Array.isArray(paziente.piano_dati?.visite_antropometriche) ? paziente.piano_dati.visite_antropometriche : []),
  };

  const payload = {
    codice: paziente.codice.trim().toUpperCase(),
    attivo: Boolean(paziente.attivo),
    peso_visita: pesoNum,
    metodo: rawMetodo,
    coeff_carbo: coeffNum,
    note_dottore: paziente.note_dottore || '',
    intolleranze: Array.isArray(paziente.intolleranze) ? paziente.intolleranze : [],
    stagione: paziente.stagione || 'all',
    piano_dati: pianoDati,
    peri_workout: paziente.peri_workout || {},
    diario_peso: Array.isArray(paziente.diario_peso) ? paziente.diario_peso : [],
    aggiornato_il: new Date().toISOString(),
  };

  let res = await fetch(`${cleanUrl}/rest/v1/pazienti?on_conflict=codice`, {
    method: 'POST',
    headers: {
      ...makeHeaders(token),
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    // Se la colonna 'metodo' su Supabase ha un vincolo legacy check (es. solo ON_OFF / KJ),
    // salva il metodo legacy nella colonna ma preserva rawMetodo ('BENESSERE') in piano_dati
    if (errText.includes('check constraint') || errText.includes('violates') || errText.includes('metodo')) {
      const legacyDbMetodo = rawMetodo === 'ATLETA' ? 'KJ' : 'ON_OFF';
      const fallbackPayload = { ...payload, metodo: legacyDbMetodo };
      res = await fetch(`${cleanUrl}/rest/v1/pazienti?on_conflict=codice`, {
        method: 'POST',
        headers: {
          ...makeHeaders(token),
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify(fallbackPayload),
      });
      if (!res.ok) {
        const fallbackErr = await res.text();
        console.log('Dettaglio errore fallback Supabase:', fallbackErr);
        throw new Error(fallbackErr);
      }
    } else {
      console.log('Dettaglio errore Supabase:', errText);
      throw new Error(errText);
    }
  }
  return await res.json();
}

export async function salvaPesoPaziente(codice, peso, data) {
  const res = await fetch(`${cleanUrl}/rest/v1/rpc/salva_peso_paziente`, {
    method: 'POST',
    headers: makeHeaders(),
    body: JSON.stringify({
      p_codice: codice.trim().toUpperCase(),
      p_peso: peso,
      p_data: data,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.warn('Dettaglio errore salvataggio peso:', errText);
    throw new Error('Impossibile salvare il peso sul database.');
  }

  return await res.json();
}

export async function deletePaziente(codice) {
  const token = await getAccessToken();
  if (!token) throw new Error('Accesso non autorizzato. Effettua il login.');

  const res = await fetch(
    `${cleanUrl}/rest/v1/pazienti?codice=eq.${encodeURIComponent(codice.trim().toUpperCase())}`,
    {
      method: 'DELETE',
      headers: makeHeaders(token),
    },
  );

  if (!res.ok) {
    const errText = await res.text();
    console.warn('Dettaglio errore eliminazione Supabase:', errText);
    throw new Error(errText || 'Impossibile eliminare il paziente.');
  }

  return true;
}

export async function eliminaPesoPaziente(codice, data) {
  const res = await fetch(`${cleanUrl}/rest/v1/rpc/elimina_peso_paziente`, {
    method: 'POST',
    headers: makeHeaders(),
    body: JSON.stringify({
      p_codice: codice.trim().toUpperCase(),
      p_data: data,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.warn('Dettaglio errore eliminazione peso:', errText);
    throw new Error('Impossibile eliminare il peso sul database.');
  }

  return await res.json();
}

export async function calcolaAntropometriaServer(misure) {
  try {
    const formattedPayload = {
      peso: parseFloat(String(misure.peso || 70).replace(',', '.')),
      altezza: parseFloat(String(misure.altezza || 175).replace(',', '.')),
      sesso: String(misure.sesso || 'M').toUpperCase(),
      eta: parseFloat(String(misure.eta || 25).replace(',', '.')),
      fcr: parseFloat(String(misure.fcr || 60).replace(',', '.')),
      pliche: {
        tricipite: parseFloat(String(misure.tricipite || misure.pliche?.tricipite || 6).replace(',', '.')),
        sottoscapola: parseFloat(String(misure.scapola || misure.sottoscapola || misure.pliche?.sottoscapola || 8).replace(',', '.')),
        scapola: parseFloat(String(misure.scapola || misure.sottoscapola || misure.pliche?.scapola || 8).replace(',', '.')),
        torace: parseFloat(String(misure.torace || misure.pliche?.torace || 6).replace(',', '.')),
        addominale: parseFloat(String(misure.addominale || misure.pliche?.addominale || 10).replace(',', '.')),
        iliaca: parseFloat(String(misure.iliaca || misure.pliche?.iliaca || 6).replace(',', '.')),
        coscia: parseFloat(String(misure.coscia || misure.pliche?.coscia || 8).replace(',', '.')),
      },
      circonferenze: {
        braccio: parseFloat(String(misure.braccio || misure.circonferenze?.braccio || 30).replace(',', '.')),
        vita: parseFloat(String(misure.vita || misure.circonferenze?.vita || 78).replace(',', '.')),
        fianchi: parseFloat(String(misure.fianchi || misure.circonferenze?.fianchi || 95).replace(',', '.')),
        coscia_radice: parseFloat(String(misure.cosciaRadice || misure.coscia_radice || misure.circonferenze?.coscia_radice || 54).replace(',', '.')),
        coscia_mediana: parseFloat(String(misure.cosciaMediana || misure.coscia_mediana || misure.circonferenze?.coscia_mediana || 50).replace(',', '.')),
      },
      diametri: {
        polso: parseFloat(String(misure.polso || misure.diametri?.polso || 5.5).replace(',', '.')),
        gomito: parseFloat(String(misure.gomito || misure.diametri?.gomito || 6.8).replace(',', '.')),
        ginocchio: parseFloat(String(misure.ginocchio || misure.diametri?.ginocchio || 9.5).replace(',', '.')),
        caviglia: parseFloat(String(misure.caviglia || misure.diametri?.caviglia || 7.0).replace(',', '.')),
      },
      ...misure,
    };
    const res = await fetch(`${cleanUrl}/rest/v1/rpc/calcola_antropometria`, {
      method: 'POST',
      headers: makeHeaders(),
      body: JSON.stringify({ p_misure: formattedPayload }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.grasso && data.muscolo) {
        return data;
      }
    }
  } catch (e) {
    console.warn('Fallback calcolo antropometria locale:', e);
  }
  return null;
}
