-- ==============================================================================
-- B-SPORTLAB - DOTT. FEDERICO BALDASSARRE
-- MIGRAZIONE SUPABASE: CALCOLO SERVER-SIDE ANTROPOMETRIA (PUNTO D) & SICUREZZA NOTE
-- ==============================================================================

-- 1. FUNZIONE RPC SERVER-SIDE: calcola_antropometria
-- Esegue i calcoli a 4 compartimenti (FITcompX / Rocha / Jackson-Pollock / Martin)
-- interamente sul server Supabase per proteggere le formule proprietarie.
CREATE OR REPLACE FUNCTION public.calcola_antropometria(p_misure jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_peso NUMERIC;
  v_altezza NUMERIC;
  v_sesso TEXT;
  v_eta NUMERIC;
  v_fcr NUMERIC;
  
  -- Pliche (mm)
  v_tri NUMERIC;
  v_sub NUMERIC;
  v_tor NUMERIC;
  v_add NUMERIC;
  v_ili NUMERIC;
  v_cos NUMERIC;
  v_somma NUMERIC;
  
  -- Circonferenze (cm)
  v_c_braccio NUMERIC;
  v_c_vita NUMERIC;
  v_c_fianchi NUMERIC;
  v_c_coscia_rad NUMERIC;
  v_c_coscia_med NUMERIC;
  
  -- Diametri (cm)
  v_d_polso NUMERIC;
  v_d_gomito NUMERIC;
  v_d_ginocchio NUMERIC;
  v_d_caviglia NUMERIC;
  
  -- Risultati calcolo
  v_bmi NUMERIC;
  v_densita NUMERIC;
  v_fat_pct NUMERIC;
  v_fat_kg NUMERIC;
  v_ffm_kg NUMERIC;
  
  v_bone_kg NUMERIC;
  v_bone_pct NUMERIC;
  
  v_muscle_kg NUMERIC;
  v_muscle_pct NUMERIC;
  v_muscle_pct_ffm NUMERIC;
  
  v_res_kg NUMERIC;
  v_res_pct NUMERIC;
  
  v_bmr_fitcompx NUMERIC;
  v_bmr_hb NUMERIC;
  v_tbw NUMERIC;
  v_glicogeno NUMERIC;
  v_whr NUMERIC;
  v_whr_val TEXT;
  v_fc_aero NUMERIC;
  v_fc_anaero NUMERIC;
  v_fc_max NUMERIC;
  v_diagnosi TEXT;
  
BEGIN
  -- Estrazione parametri con fallback
  v_peso := COALESCE((p_misure->>'peso')::NUMERIC, 70);
  v_altezza := COALESCE((p_misure->>'altezza')::NUMERIC, 175);
  v_sesso := UPPER(COALESCE(p_misure->>'sesso', 'M'));
  v_eta := COALESCE((p_misure->>'eta')::NUMERIC, 25);
  v_fcr := COALESCE((p_misure->>'fcr')::NUMERIC, 60);
  
  -- Pliche
  v_tri := COALESCE((p_misure->'pliche'->>'tricipite')::NUMERIC, 6);
  v_sub := COALESCE((p_misure->'pliche'->>'sottoscapola')::NUMERIC, 8);
  v_tor := COALESCE((p_misure->'pliche'->>'torace')::NUMERIC, 6);
  v_add := COALESCE((p_misure->'pliche'->>'addominale')::NUMERIC, 10);
  v_ili := COALESCE((p_misure->'pliche'->>'iliaca')::NUMERIC, 6);
  v_cos := COALESCE((p_misure->'pliche'->>'coscia')::NUMERIC, 8);
  v_somma := v_tri + v_sub + v_tor + v_add + v_ili + v_cos;
  
  -- Circonferenze
  v_c_braccio := COALESCE((p_misure->'circonferenze'->>'braccio')::NUMERIC, 30);
  v_c_vita := COALESCE((p_misure->'circonferenze'->>'vita')::NUMERIC, 78);
  v_c_fianchi := COALESCE((p_misure->'circonferenze'->>'fianchi')::NUMERIC, 95);
  v_c_coscia_rad := COALESCE((p_misure->'circonferenze'->>'coscia_radice')::NUMERIC, 54);
  v_c_coscia_med := COALESCE((p_misure->'circonferenze'->>'coscia_mediana')::NUMERIC, 50);
  
  -- Diametri
  v_d_polso := COALESCE((p_misure->'diametri'->>'polso')::NUMERIC, 5.5);
  v_d_gomito := COALESCE((p_misure->'diametri'->>'gomito')::NUMERIC, 6.8);
  v_d_ginocchio := COALESCE((p_misure->'diametri'->>'ginocchio')::NUMERIC, 9.5);
  v_d_caviglia := COALESCE((p_misure->'diametri'->>'caviglia')::NUMERIC, 7.0);
  
  -- 1. BMI
  v_bmi := ROUND(v_peso / POWER(v_altezza / 100.0, 2), 1);
  
  -- 2. Massa Grassa (Jackson-Pollock 6 pliche + Siri)
  IF v_sesso = 'F' THEN
    v_densita := 1.0970 - (0.00046971 * v_somma) + (0.00000056 * POWER(v_somma, 2)) - (0.00012828 * v_eta);
  ELSE
    v_densita := 1.1098 - (0.00052 * v_somma) - (0.00028 * v_eta);
  END IF;
  
  v_fat_pct := ROUND(GREATEST(3.0, LEAST(55.0, ((4.95 / v_densita) - 4.5) * 100.0)), 1);
  v_fat_kg := ROUND((v_peso * v_fat_pct) / 100.0, 2);
  v_ffm_kg := v_peso - v_fat_kg;
  
  -- 3. Massa Ossea (Rocha Multi-Diametro)
  DECLARE
    v_diam_ratio NUMERIC;
  BEGIN
    v_diam_ratio := ((v_d_polso / 5.5) + (v_d_gomito / 6.8) + (v_d_ginocchio / 9.5) + (v_d_caviglia / 7.0)) / 4.0;
    v_bone_kg := ROUND(3.02 * POWER(POWER(v_altezza / 100.0, 2) * (v_d_polso / 100.0) * (v_d_ginocchio / 100.0) * 400.0, 0.712) * v_diam_ratio, 2);
    v_bone_pct := ROUND((v_bone_kg / v_peso) * 100.0, 1);
  END;
  
  -- 4. Massa Muscolare (Martin / Marchesi FFM-Proporzionale)
  DECLARE
    v_smm_ratio NUMERIC;
  BEGIN
    v_smm_ratio := 0.30 + ((v_c_braccio / 28.0) * 0.125) + ((v_c_coscia_med / 55.0) * 0.188);
    IF v_sesso = 'F' THEN
      v_smm_ratio := v_smm_ratio * 0.92;
    END IF;
    v_muscle_kg := ROUND(GREATEST(v_ffm_kg * 0.40, LEAST(v_ffm_kg * 0.75, v_ffm_kg * v_smm_ratio)), 2);
    v_muscle_pct := ROUND((v_muscle_kg / v_peso) * 100.0, 1);
    v_muscle_pct_ffm := ROUND((v_muscle_kg / v_ffm_kg) * 100.0, 1);
  END;
  
  -- 5. Massa Residua (Organi, Sangue, Fluidi)
  v_res_kg := ROUND(GREATEST(0, v_peso - v_fat_kg - v_bone_kg - v_muscle_kg), 2);
  v_res_pct := ROUND(100.0 - v_muscle_pct - v_fat_pct - v_bone_pct, 1);
  
  -- 6. Metabolismo Basale (BMR FITcompX vs Harris-Benedict)
  v_bmr_fitcompx := ROUND(370.0 + (21.6 * v_ffm_kg) + (13.8 * v_muscle_kg));
  IF v_sesso = 'F' THEN
    v_bmr_hb := ROUND(655.1 + (9.563 * v_peso) + (1.850 * v_altezza) - (4.676 * v_eta));
  ELSE
    v_bmr_hb := ROUND(66.5 + (13.75 * v_peso) + (5.003 * v_altezza) - (6.75 * v_eta));
  END IF;
  
  -- 7. Fisiologia & Frequenze
  v_tbw := ROUND(v_ffm_kg * 0.732, 1);
  v_glicogeno := ROUND(100 + (v_muscle_kg * 9.5));
  v_whr := ROUND(v_c_vita / GREATEST(1, v_c_fianchi), 2);
  IF (v_sesso = 'M' AND v_whr <= 0.90) OR (v_sesso = 'F' AND v_whr <= 0.80) THEN
    v_whr_val := 'Ginoide / Basso Rischio Cardiovascolare';
  ELSE
    v_whr_val := 'Androide / Attenzione Viscerale';
  END IF;
  
  v_fc_max := 220 - v_eta;
  v_fc_aero := ROUND(v_fcr + ((v_fc_max - v_fcr) * 0.65));
  v_fc_anaero := ROUND(v_fcr + ((v_fc_max - v_fcr) * 0.85));
  
  -- 8. Diagnosi Clinica Automatica
  IF v_fat_pct < 8.0 THEN
    v_diagnosi := 'Condizione atletica di altissimo livello agonistico. Massa muscolare eccellente (' || v_muscle_pct || '%), grasso essenziale (' || v_fat_pct || '%). Supportare con adeguata ricarica glucidica e idratazione.';
  ELSIF v_fat_pct <= 14.0 THEN
    v_diagnosi := 'Ottima composizione corporea con perfetto equilibrio tra massa muscolare attiva (' || v_muscle_pct || '%) e massa grassa (' || v_fat_pct || '%). Indicato per fase di performance sportiva.';
  ELSIF v_fat_pct <= 22.0 THEN
    v_diagnosi := 'Composizione corporea nella norma fitness/amatoriale. Buona struttura muscolare. Ottimizzare la ricomposizione corporea con lavoro aerobico e target proteico costante.';
  ELSE
    v_diagnosi := 'Percentuale di massa grassa superiore ai target ottimali (' || v_fat_pct || '%). Si consiglia strategia nutrizionale ipocalorica mirata alla preservazione del tessuto muscolare e riduzione del grasso viscerale.';
  END IF;

  RETURN jsonb_build_object(
    'peso', v_peso,
    'altezza', v_altezza,
    'sesso', v_sesso,
    'eta', v_eta,
    'bmi', v_bmi,
    'fcr', v_fcr,
    'sommaPliche', v_somma,
    'whr', v_whr,
    'whr_valutazione', v_whr_val,
    'tbw', v_tbw,
    'glicogeno', v_glicogeno,
    'grasso', jsonb_build_object('kg', v_fat_kg, 'pct', v_fat_pct),
    'muscolo', jsonb_build_object('kg', v_muscle_kg, 'pct', v_muscle_pct, 'pct_ffm', v_muscle_pct_ffm),
    'ossa', jsonb_build_object('kg', v_bone_kg, 'pct', v_bone_pct),
    'altro', jsonb_build_object('kg', v_res_kg, 'pct', v_res_pct),
    'metabolismo', jsonb_build_object('bmrFITcompX', v_bmr_fitcompx, 'bmrHarrisBenedict', v_bmr_hb),
    'frequenze', jsonb_build_object('aerobica', v_fc_aero, 'anaerobica', v_fc_anaero, 'massima', v_fc_max),
    'diagnosi', v_diagnosi
  );
END;
$$;

-- Permetti l'esecuzione della RPC a ruoli anon e authenticated
GRANT EXECUTE ON FUNCTION public.calcola_antropometria(jsonb) TO anon, authenticated, service_role;
