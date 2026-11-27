import React, { useState, useMemo } from 'react';
import { Text, View, TextInput, TouchableOpacity, Linking, ScrollView, Share, Platform } from 'react-native';
import { s } from './stile';
import * as M from './motore';
import { searchAlimenti, ALIMENTI_DB } from './alimenti_db';
import { UI, trFood, trRecipeText, LANGS } from './lingue';
import { confirmAction } from './confirm';
import { copyToClipboard } from './clipboard';
import { TipsTab, CONSIGLI_DATA } from './consigli_guida';
import { COLORBLIND_PALETTE } from './antropometria';

export { TipsTab, CONSIGLI_DATA };

// Logo B-sportlab in formato JPEG base64 compresso per inclusione vettoriale nel PDF (self-contained)
const BSPORTLAB_LOGO_JPG_B64 =
  '/9j/4AAQSkZJRgABAQAASABIAAD/4QBMRXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAeKADAAQAAAABAAAAeAAAAAD/wAARCAB4AHgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9sAQwACAgICAgIDAgIDBQMDAwUGBQUFBQYIBgYGBgYICggICAgICAoKCgoKCgoKDAwMDAwMDg4ODg4PDw8PDw8PDw8P/9sAQwECAgIEBAQHBAQHEAsJCxAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQ/90ABAAI/9oADAMBAAIRAxEAPwD8BYmZQ5U4OB/Oj7RN/fNIn3X+g/nUVAE32ib++aPtE3981DS7TRYCX7RN/fNH2ib++aiwaMGnYCX7RN/fNH2ib++aiwaMGiwEv2ib++aPtE3981Fg0YNFgJftE3980faJv75qLBowaLAS/aJv75o+0Tf3zUW09KSkBLKzNtLHJxUVSP0X6VHQB//Q/ARPuv8AQfzqKpU+6/0H86ioAK+wPDHhr4LeFvgNoPxK8f8Ah3UPEGpa3q9/YAWt+LRI47RImU4Mb5JL18f19YeK/wDk0HwF/wBjJrX/AKKt68fNoubo07tJy1s2vsye69DnxG8V5/ozP/4Tn9lv/om+s/8Ag6X/AOMUf8Jz+y3/ANE31n/wdL/8Yp3wX/ZF+Mfx78O3Xij4eWNrc2NlP9mkM1ykLeZt3cK3JGO9euy/8E1v2o4kLjRrFyB0W/iyfzFfOYvOcloVZUa2L5ZLRp1JXX4nLPFYeLcZTs/U8g/4Tn9lv/om+s/+Dpf/AIxR/wAJz+y3/wBE31n/AMHS/wDxiuG+K37P3xd+CskS/Ejw1c6RFcMVinYCSCQjssqFlJ9s5rxivdwmCwtemqtCq5RfVTk1+Z004wmuaLuvU+oP+E5/Zb/6JvrP/g6X/wCMUf8ACc/st/8ARN9Z/wDB0v8A8Yr5foro/sal/NL/AMDl/maexifUH/Cc/st/9E31n/wdL/8AGKP+E5/Zb/6JvrP/AIOl/wDjFfL9FH9jUv5pf+By/wAw9jE+hPEvi/8AZ4vvD99aeGPAmq6bq0qYtrmbVlmjifI5aPyV3DGeMivnuiiu7DYaNKPLFt+rb/MuEEtESP0X6VHUj9F+lR10FH//0fwET7r/AEH86iqVPuv9B/OoqACvrDxX/wAmgeAv+xk1r/0Vb18n19YeK/8Ak0DwF/2Mmtf+irevLzH+Lh/8f/tsjnr/ABQ9f0Z+rH/BKX/kiniT/sMf+0RWz+13+2x4y/Zt+MOieENM0W01bRbywhvLgSlkny8jowRhwOF4yOtY3/BKX/kiniT/ALDH/tEV6z+0p+xBpH7SHxN0nx7rXiabS7XT7OKzktYbcO0ixuzkiQsAud2PunFfy/jMVltLijGSzWN6fvdG9bK2x8bUnSjjKjrK61PbPizonhf44fs66yuo2gl0/W9DbUbdZRloZRAZ4mB7MjcZHv61/JxOhjkaM/wkj8jX9Nv7XnxXl/Z++AdzoHhTw7f6ibnT/wCyLe5jiY2llC0Xk+ZPN03Beg7nkkV/NNpeh614huTa6LZTahcAFikEbSNjucKCcV+k+CtGVLLq1ackqbldarTvfsexw9Hloyk3pcxaK7r/AIVl8QycDw1qP/gLL/8AE1xc8EttK0E6GOSMlWVhggjggj1FfstHE06l/ZyT9GmfQRqRl8LuQ0UUVsUFFFFAEj9F+lR1I/RfpUdAH//S/ARPuv8AQfzqKpU+6/0H86ioAK+sPFf/ACaB4C/7GTWv/RVvXyfX1h4r/wCTQfAX/Yya1/6Kt68rMf4uH/x/+2yOev8AFD1/Rn6sf8Epf+SKeJP+wx/7RFeL/wDBRf45fFr4U/HbQbfwB4ovdFtv7HguGggkxC8nnSZLIQQcgAHPavaP+CU3HwT8Rn/qMf8AtEV7F+0f+xF4a/aR+I2meO/EPiS50yKws47NrW3hRzIkbs+fMY/KTux0Nfzas4weA4rxlfHq9N8y2vq7dD5H28KeNnKotNT6I+HWpw/GT4JaFqfim2SWPxbo8f22IqNrefHsk46cnJHpX89HwT+M2n/sd/tA+KdSm0l9dgsjfaWkUcoiOPOwG3EHoE6V/QJ4/wDHvw//AGafhGdS1S5isNN8PWK29hbuw8yeSJNsMSL1ZmIGcD1Nfye+JtbufEviHUfEN4cz6lcS3D/70rFj/OvpPCHJXiMNjFXg/YVGkk7rv/wDtyLD88J8691n7TL/AMFd9CVgx+HlxgHPF6v/AMTX4v8Ai7W08S+KNW8QpGYRqd3PchCclBM5faT3xmucor9kyPhfA5bzfU6fLzb6t7ep9Bh8HTpX9mrXCiiivfOkKKKKAJH6L9KjqR+i/So6AP/T/ARPuv8AQfzqKpU+6/0H86ioAK+sPFf/ACaB4C/7GTWv/RVvXyfX1j4qGf2QfAIHfxLrX/oq3rysy/iYf/H/AO2SOevvD1/RnkXgf44fFz4a6ZNo3gLxXf6FZXEnnSQ2suxGkxjcR64rsz+1n+0mRg/EXWP/AAINRJ8ALy18K2ev+JfFei+H7/VLI6hZaXfXDx3dxbc7XGEaNPM2nYHdS2OBXgXlPyQMgdTRTw2DxDc1Ti3fVuP6tajj7OWqX4HU+LfH/jfx5drfeNNevdbnT7rXk7zbc/3dxIH4VyOc1KInbOBnFCwu3CjOa9OEFFcsVZI2VloRUV6h4e+EfjHX9bOgNbf2ddnS5tXQXWYxJaQxNLvXg53Kp2+teZiJ2OByTUU68JtqLvYSmnsMx3pK9H8N/D648ReC/FXi+O6WFPC4tC8RUlpftUhjG0jptxk5rzxo2QfN24pwqxk5Ri9Vo/uT/UUZp3SI6KKK0LJJARtz6VHU8/VfpUFAH//U/ARPuv8AQfzqKpU+6/0H86ioAK+sfFX/ACaF4Bx/0Mutf+irevk6vrDxVz+yB4B/7GTWv/RVvXlZl/Ew/wDj/wDbJHPX3h6/oz1/4feH/EHjPwrotr8c9L0jU/AdvpMwtfEIvIIr3S4Y0doYt0UgkdlkwohkRj82BxyO3stI8W2ejfCtfBVloI8KXmi2kmvyXkdkrvEZZA8l2Z8ShTEPlMfPp81fmCss6oYt7bOu3PH5V2nizx3rfi+z0Ky1IRxx6Bp8WmweUCu6GEsVL88t8xzXmYjhyU5L3lbXS2iv1Svv5q2utjCeCu9z7f0S2hOgof2a4tImzr+pJq/9ofZXkGn+d/oZb7aci2MOclPm/vc4rnPiP4t8G+BPCvi26+D40xUuvF0trBMIYbl1sjZgyLAJgzLC0udrY6YANfBitLHny2K54ODjIpuHxjtXTT4egpuU3dem+t9e9unZFrBq+rP1YfXfEfjXx74O1K5u7GbStV8CXdpZzCSztw+oNZSRyQswKFCGwAsmAD0rwP4MfCDxj4F8V6hf+JlgtL+DTZLiys4LjTLu4vmEqRukLSvLDGyBt5LfNtB2gmviYPOAAGOF6DPSlElwGDB2BHQ5qIZBKFOVKE0ou2nL2+f3/gJYOycU9H5H6x3xt7W9+ITfD8aRb+ItW0HQbiO3up7J1e/ErCYIOLZrgAcgAKDk4zivjr9oyEx6X4NfxTHYxeP5Le6OtrYeSFEfmKLPzltv3InK7923nbt3c18v7pgdwY59c0j+Y7FnJZj1JOTTy3h5YaopqV7W6a6RUdXfbS9u46GEUHe/9WsR0U7a3pRtb0r6Kx2Es/VfpUFSyknbn0qKkB//1fwET7r/AEH86iqVPuv9B/OoqACvqvwb8XvhKPhFpXww+JvhXUtYGj6jd38E9hfpaD/S1jVlZWjfONgwc18qU7cwGM1y4rBwrJKd9HdWdnfb9TOpTUtz6o/4S/8AZL/6J/4i/wDBzF/8Yo/4S/8AZL/6J/4i/wDBzF/8Yr5X3N60bm9a5/7Kh/PL/wACZH1aPd/efVH/AAl/7Jf/AET/AMRf+DmL/wCMUf8ACX/sl/8ARP8AxF/4OYv/AIxXyvub1o3N60f2VD+eX/gTD6tHu/vPqj/hL/2S/wDon/iL/wAHMX/xij/hL/2S/wDon/iL/wAHMX/xivlfc3rRub1o/sqH88v/AAJh9Wj3f3n1R/wl/wCyX/0T/wARf+DmL/4xR/wl/wCyX/0T/wARf+DmL/4xXyvub1o3N60f2VD+eX/gTD6tHu/vPqj/AIS/9kv/AKJ/4i/8HMX/AMYo/wCEv/ZL/wCif+Iv/BzF/wDGK+V9zetG5vWj+yofzy/8CYvq0e7+87v4iah4B1LXFuPhzpN5o2leUo8i9uVupfMGdzb1RBg+mK4KpHOQv0/rUdd9OCjFRXQ3irKx/9b8BIxlXA9B/Om7G9KdF1NPoAi2N6UbG9KlooAi2N6UbG9KlooAi2N6UbG9KlooAi2N6UbG9KlooAi2N6UbG9KlooAi2N6UbG9KlooAjkBG0H0qOpZeoqKgD//Z';

const LIME_DARK = '#4D7C0F';
const LIME_TEXT = '#3F6212';

export function RecipeCard({
  it,
  isBest,
  isPeriWorkout,
  isAdded,
  isFav,
  shopDay,
  flt,
  showMacro,
  lang = 'it',
  canAdd = true,
  onAdd,
  onToggleFav,
}) {
  const t = UI[lang] || UI.it;
  const seaKey = it.sea.includes('summer') ? 'summer' : it.sea.includes('winter') ? 'winter' : 'all';
  const seaLabel = t.seaBadges[seaKey];
  const mealLabel = (t.meals[it.m] || it.m).toUpperCase();
  const dayLabel = t.days[shopDay] || shopDay;
  const trRec = trRecipeText(it, lang);

  const dosi = [];
  if (it.gP > 0) dosi.push(`${it.gP}g ${trFood(M.fmtName(it.nomeP, flt), lang)}`);
  if (it.gC > 0) dosi.push(`${it.gC}g ${trFood(M.fmtName(it.nomeC, flt), lang)}`);
  if (it.gF > 0) dosi.push(`${it.gF}g ${trFood(M.fmtName(it.nomeF, flt), lang)}`);
  if (it.gV > 10) dosi.push(`${it.gV}g ${trFood(M.fmtName(it.nomeV, flt), lang)}`);

  return (
    <View style={[s.rCard, isBest && s.best]}>
      <View style={[s.banner, { backgroundColor: it.bg }]}>
        <Text style={s.ico}>{it.ico}</Text>
        <Text style={s.seaPill}>{seaLabel}</Text>
        <Text style={s.mealPill}>{mealLabel}</Text>
      </View>
      <View style={s.rBody}>
        <View style={s.rowBet}>
          <View style={{ flex: 1 }}>
            {it.hits > 0 ? <Text style={s.gBadge}>{t.inPantry} ({it.hits})</Text> : null}
            {isPeriWorkout ? <Text style={s.badge}>{t.periBadge}</Text> : null}
            <Text style={s.rTitle}>{trRec.title}</Text>
          </View>
          <TouchableOpacity onPress={onToggleFav} style={{ paddingLeft: 8 }}>
            <Text style={{ fontSize: 22 }}>{isFav ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>
        {showMacro ? (
          <Text style={s.rTag}>~{it.kcal} kcal • P: {it.totP}g | L: {it.totF}g | C: {it.totC}g</Text>
        ) : null}
        <Text style={s.bold}>{t.prepTitle}</Text>
        <Text style={[s.txt, { marginBottom: 6 }]}>
          <Text style={s.bTxt}>{t.useWord} </Text>{dosi.join(', ')}.
        </Text>
        <Text style={s.txt}>{trRec.steps}</Text>
        {canAdd ? (
          <TouchableOpacity style={[s.sBtn, isAdded && s.sBtnOk]} onPress={onAdd}>
            <Text style={s.sBtnTxt}>
              {isAdded ? `${t.addedMenuBtn} (${dayLabel})` : `${t.addMenuBtn} (${dayLabel})`}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export function WeightTab({ paziente, pesoOggi, setPesoOggi, handleSaveWeight, onDeleteWeight, pesoMsg, lang = 'it' }) {
  const t = UI[lang] || UI.it;
  const startW = parseFloat(String(paziente?.peso_visita || '0').replace(',', '.')) || 0;
  const diary = paziente?.diario_peso || [];
  const lastW = diary.length > 0 ? Number(diary.at(-1).peso) : null;
  const diffW = lastW !== null && startW > 0 ? (lastW - startW).toFixed(1) : null;

  return (
    <View>
      <Text style={s.sec}>{t.weightTitle || '⚖️ Monitoraggio Peso Corporeo'}</Text>
      <View style={s.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <TextInput
            style={[s.inp, { flex: 1, height: 44, paddingVertical: 0, paddingHorizontal: 12, outlineStyle: 'none' }]}
            inputMode="decimal"
            placeholder="es. 71.5"
            value={pesoOggi}
            onChangeText={setPesoOggi}
            onSubmitEditing={handleSaveWeight}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[s.btn, { marginTop: 0, height: 44, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', flexShrink: 0 }]}
            onPress={handleSaveWeight}
          >
            <Text style={s.btnTxt}>{t.saveBtn || 'Salva'}</Text>
          </TouchableOpacity>
        </View>
        {pesoMsg ? <Text style={{ color: pesoMsg.includes('⚠️') ? '#DC2626' : '#15803D', fontWeight: 'bold', marginTop: 6, textAlign: 'center' }}>{pesoMsg}</Text> : null}
      </View>
      <View style={s.card}>
        <View style={s.rowBet}>
          <Text style={s.bold}>{t.historyLbl}</Text>
          {diffW !== null ? (
            <Text style={{ fontWeight: 'bold', color: LIME_TEXT, fontSize: 12 }}>
              Start: {startW} kg ({Number(diffW) > 0 ? `+${diffW}` : diffW} kg)
            </Text>
          ) : null}
        </View>
        {diary.length === 0 ? (
          <Text style={s.txt}>{t.noWeights}</Text>
        ) : (
          diary.slice().reverse().map((item, idx) => {
            const pct = startW > 0 ? Math.max(20, Math.min(100, Math.round((Number(item.peso) / (startW * 1.15)) * 100))) : 60;
            return (
              <View key={idx} style={{ marginTop: 6 }}>
                <View style={s.rowBet}>
                  <Text style={s.txt}>📅 {item.data}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={s.bTxt}>{item.peso} kg</Text>
                    {onDeleteWeight ? (
                      <TouchableOpacity
                        onPress={() => {
                          const wTitle = t?.confirmDeleteWeightTitle || 'Elimina pesata';
                          const wMsg = t?.confirmDeleteWeightMsg || 'Vuoi eliminare questa pesata dallo storico?';
                          confirmAction({
                            title: wTitle,
                            message: `${wMsg}\n(${item.data} • ${item.peso} kg)`,
                            confirmText: t?.deleteBtn || 'Elimina',
                            cancelText: t?.confirmCancelBtn || 'Annulla',
                            onConfirm: () => onDeleteWeight(item.data),
                          });
                        }}
                        style={{ marginLeft: 10, paddingHorizontal: 6, paddingVertical: 2 }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: 'bold' }}>✕</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
                <View style={{ height: 6, backgroundColor: '#EDF2F7', borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ width: `${pct}%`, height: '100%', backgroundColor: LIME_DARK }} />
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

export function PrefsTab({ season, setSeason, flt, setFlt, bad, setBad, lang = 'it' }) {
  const t = UI[lang] || UI.it;
  return (
    <View>
      <Text style={s.sec}>{t.prefsTitle}</Text>
      <View style={s.card}>
        <Text style={s.lbl}>{t.seasonLbl}</Text>
        <View style={s.chips}>
          {M.SEASONS.map(([k]) => (
            <TouchableOpacity key={k} style={[s.chip, season === k && s.chipAct]} onPress={() => setSeason(k)}>
              <Text style={[s.cTxt, season === k && s.cTxtAct]}>{t.seasons[k]}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.lbl}>{t.fltLbl}</Text>
        <View style={s.chips}>
          {M.FILTERS.map(([k]) => (
            <TouchableOpacity key={k} style={[s.chip, flt.includes(k) && s.chipAct]} onPress={() => setFlt((p) => (p.includes(k) ? p.filter((i) => i !== k) : [...p, k]))}>
              <Text style={[s.cTxt, flt.includes(k) && s.cTxtAct]}>{t.filters[k]}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.lbl}>{t.badLbl}</Text>
        <TextInput style={s.tInp} placeholder={t.badPh} value={bad} onChangeText={setBad} />
      </View>
    </View>
  );
}

export function FavsTab({
  recipes,
  favs,
  setFavs,
  meal,
  setMeal,
  daily,
  shopDay,
  weekPlan,
  setWeekPlan,
  flt,
  bad = '',
  showMacro,
  lang = 'it',
}) {
  const t = UI[lang] || UI.it;
  const curTarget = daily?.mealTargets?.[meal] || { c: 50, p: 30, f: 15 };
  const favRecipes = useMemo(() => {
    return (recipes || [])
      .filter((r) => (favs || []).includes(r.id))
      .map((r) => {
        const compatible = M.isRecipeCompatible(r, flt, bad);
        return {
          ...M.calcOne(r, curTarget.c, curTarget.p, curTarget.f),
          _isCompatible: compatible,
        };
      });
  }, [recipes, favs, curTarget.c, curTarget.p, curTarget.f, flt, bad]);

  const warningText =
    t.favIncompatibleWarning ||
    '⚠️ Non più compatibile con le intolleranze o gli alimenti esclusi impostati.';

  return (
    <View>
      <Text style={s.sec}>{t.favTitle}</Text>
      <View style={s.row}>
        {M.MEALS.map((m) => (
          <TouchableOpacity key={m} style={[s.mBtn, meal === m && s.mAct]} onPress={() => setMeal(m)}>
            <Text style={[s.mTxt, meal === m && s.mTxtAct]}>{t.meals[m] || m}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {favRecipes.length === 0 ? (
        <View style={s.card}>
          <Text style={s.txt}>{t.favEmpty}</Text>
        </View>
      ) : (
        favRecipes.map((it) => (
          <View key={it.id} style={{ marginBottom: 8 }}>
            {!it._isCompatible ? (
              <View
                style={[
                  s.wBox,
                  {
                    backgroundColor: '#FFF5F5',
                    borderColor: '#E53E3E',
                    marginBottom: 6,
                  },
                ]}
              >
                <Text style={[s.txt, { color: '#9B2C2C', fontWeight: 'bold' }]}>{warningText}</Text>
              </View>
            ) : null}
            <RecipeCard
              it={it}
              isBest={false}
              isPeriWorkout={curTarget.isPeriWorkout}
              isAdded={weekPlan[shopDay]?.[meal]?.id === it.id}
              isFav={true}
              shopDay={shopDay}
              flt={flt}
              showMacro={showMacro}
              lang={lang}
              canAdd={it._isCompatible}
              onToggleFav={() => setFavs((p) => p.filter((x) => x !== it.id))}
              onAdd={() => {
                if (!it._isCompatible) return;
                setWeekPlan((p) => ({ ...p, [shopDay]: { ...p[shopDay], [meal]: it } }));
              }}
            />
          </View>
        ))
      )}
    </View>
  );
}

export function ShopTab({
  shopDay,
  setShopDay,
  weekPlan,
  setWeekPlan,
  flt,
  lang = 'it',
  onSelectMealToPick,
  onFillDay,
  targetDays = [],
}) {
  const activeDaysList = targetDays.length > 0
    ? targetDays
    : M.DAYS.map((d) => ({ id: d, dayKey: d, shortLabel: UI[lang]?.days?.[d] || d, label: UI[lang]?.days?.[d] || d }));
  const t = UI[lang] || UI.it;
  const [selectedCopyDays, setSelectedCopyDays] = useState([]);
  const [copiedMsg, setCopiedMsg] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');

  const groupedAisles = useMemo(() => {
    return M.getWeekShopByAisle(weekPlan, flt);
  }, [weekPlan, flt]);

  const triggerCopyFeedback = (text) => {
    setCopyFeedback(text);
    setTimeout(() => setCopyFeedback(''), 2500);
  };

  const buildShoppingText = () => {
    const lines = [t.shopShareHeader, ''];
    groupedAisles.forEach((group) => {
      lines.push(t.aisles[group.aisle] || group.aisle);
      group.items.forEach(([k, g]) => {
        lines.push(`• ${trFood(k, lang)}: ${g}g`);
      });
      lines.push('');
    });
    return lines.join('\n').trim();
  };

  const handleShareWhatsApp = () => {
    if (groupedAisles.length === 0) return;
    const text = buildShoppingText();
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  const handleCopyClipboard = async () => {
    if (groupedAisles.length === 0) return;
    const text = buildShoppingText();
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedMsg(t.copiedClipboardMsg);
      setTimeout(() => setCopiedMsg(''), 2500);
    }
  };

  const activeDayObj = activeDaysList.find((x) => x.dayKey === shopDay || x.id === shopDay);
  const currentDayDisplay = activeDayObj ? (activeDayObj.shortLabel || activeDayObj.label) : (t.days[shopDay] || shopDay);

  const toggleCopyTarget = (d) => {
    if (d === shopDay) return;
    setSelectedCopyDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const applyCopyToSelected = () => {
    if (selectedCopyDays.length === 0) return;
    const targetsLabel = selectedCopyDays.map((dKey) => {
      const match = activeDaysList.find((x) => x.dayKey === dKey || x.id === dKey);
      return match ? (match.shortLabel || match.label) : (t.days[dKey] || dKey);
    }).join(', ');
    setWeekPlan((prev) => M.copyDayPlan(prev, shopDay, selectedCopyDays));
    setSelectedCopyDays([]);
    triggerCopyFeedback(`✅ ${currentDayDisplay} → ${targetsLabel}`);
  };

  const applyCopyToAll = () => {
    const cpTitle = t?.confirmCopyAllTitle || 'Copia su tutta la settimana';
    const cpMsg = t?.confirmCopyAllMsg || 'Vuoi copiare questo menù su tutti gli altri giorni? I pasti già scelti negli altri giorni verranno sostituiti.';
    confirmAction({
      title: cpTitle,
      message: `${cpMsg}\n(${currentDayDisplay})`,
      confirmText: t?.copyBtn || 'Copia',
      cancelText: t?.confirmCancelBtn || 'Annulla',
      isDestructive: false,
      onConfirm: () => {
        setWeekPlan((prev) => M.copyDayPlan(prev, shopDay, activeDaysList.map((x) => x.dayKey || x.id)));
        triggerCopyFeedback(`✅ ${t.copyAllDaysBtn || 'Copia'} (${currentDayDisplay})`);
      },
    });
  };

  return (
    <View>
      <Text style={s.sec}>{t.shopTitle}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 10 }}>
        {activeDaysList.map((d) => {
          const dKey = d.dayKey || d.id;
          const isActive = shopDay === dKey || shopDay === d.id;
          return (
            <TouchableOpacity
              key={d.id || dKey}
              style={[s.chip, isActive && s.chipAct, { paddingVertical: 6, paddingHorizontal: 12 }]}
              onPress={() => {
                setShopDay(dKey);
                setSelectedCopyDays((prev) => prev.filter((x) => x !== dKey));
              }}
            >
              <Text style={[s.cTxt, isActive && s.cTxtAct, { fontWeight: 'bold' }]}>
                {d.shortLabel || d.label || dKey}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={s.card}>
        <Text style={s.bold}>{t.menuLbl} {currentDayDisplay}:</Text>
        {M.MEALS.map((m) => (
          <View key={m} style={s.sRow}>
            <Text style={s.bTxt}>{t.meals[m] || m}: </Text>
            <Text style={{ flex: 1 }}>
              {weekPlan[shopDay]?.[m] ? trRecipeText(weekPlan[shopDay][m], lang).title : t.noneLbl}
            </Text>
            {onSelectMealToPick ? (
              <TouchableOpacity onPress={() => onSelectMealToPick(m)} style={{ marginRight: 10 }}>
                <Text style={{ color: LIME_TEXT, fontWeight: 'bold', fontSize: 12 }}>{t.pickMealBtn}</Text>
              </TouchableOpacity>
            ) : null}
            {weekPlan[shopDay]?.[m] ? (
              <TouchableOpacity
                onPress={() => {
                  const mealName = t.meals[m] || m;
                  const dayName = t.days[shopDay] || shopDay;
                  const delTitle = t?.confirmDeleteMealTitle || 'Rimuovi pasto';
                  const delMsg = t?.confirmDeleteMealMsg || 'Vuoi rimuovere questo pasto dal menù?';
                  confirmAction({
                    title: delTitle,
                    message: `${delMsg}\n(${mealName} • ${dayName})`,
                    confirmText: t?.deleteBtn || 'Elimina',
                    cancelText: t?.confirmCancelBtn || 'Annulla',
                    isDestructive: true,
                    onConfirm: () => setWeekPlan((p) => ({ ...p, [shopDay]: { ...p[shopDay], [m]: null } })),
                  });
                }}
              >
                <Text style={{ color: '#E53E3E', fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))}

        {onFillDay ? (
          <View style={[s.row, { marginTop: 10, marginBottom: 4 }]}>
            <TouchableOpacity style={[s.sBtn, { flex: 1, marginTop: 0, marginRight: 4 }]} onPress={() => onFillDay(shopDay, false)}>
              <Text style={s.sBtnTxt}>{t.fillMissingBtn}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.sBtn, { flex: 1, marginTop: 0, marginLeft: 4 }]}
              onPress={() => {
                const dayName = t.days[shopDay] || shopDay;
                const fillTitle = t?.confirmFillAllTitle || 'Rigenera pasti';
                const fillMsg = t?.confirmFillAllMsg || 'Vuoi rigenerare tutti i 4 pasti? I pasti già scelti per questa giornata verranno sostituiti.';
                confirmAction({
                  title: fillTitle,
                  message: `${fillMsg}\n(${dayName})`,
                  confirmText: t?.regenerateBtn || 'Rigenera',
                  cancelText: t?.confirmCancelBtn || 'Annulla',
                  isDestructive: false,
                  onConfirm: () => onFillDay(shopDay, true),
                });
              }}
            >
              <Text style={s.sBtnTxt}>{t.fillAllBtn}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderColor: '#EDF2F7' }}>
          <TouchableOpacity style={[s.sBtn, { marginTop: 0 }]} onPress={applyCopyToAll}>
            <Text style={s.sBtnTxt}>{t.copyAllDaysBtn} ({currentDayDisplay})</Text>
          </TouchableOpacity>

          <Text style={[s.lbl, { marginTop: 8 }]}>{t.copySelectHint}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {activeDaysList.filter((d) => (d.dayKey || d.id) !== shopDay).map((d) => {
              const dKey = d.dayKey || d.id;
              const active = selectedCopyDays.includes(dKey);
              return (
                <TouchableOpacity
                  key={d.id || dKey}
                  style={[s.chip, active && s.chipAct, { paddingVertical: 5, paddingHorizontal: 10 }]}
                  onPress={() => toggleCopyTarget(dKey)}
                >
                  <Text style={[s.cTxt, active && s.cTxtAct]}>
                    {d.shortLabel || d.label || dKey}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedCopyDays.length > 0 ? (
            <TouchableOpacity style={[s.sBtn, s.sBtnOk, { marginTop: 6 }]} onPress={applyCopyToSelected}>
              <Text style={s.sBtnTxt}>
                ✓ {currentDayDisplay} → {selectedCopyDays.map((dKey) => {
                  const match = activeDaysList.find((x) => x.dayKey === dKey || x.id === dKey);
                  return match ? (match.shortLabel || match.label) : (t.days[dKey] || dKey);
                }).join(', ')}
              </Text>
            </TouchableOpacity>
          ) : null}

          {copyFeedback ? (
            <Text style={{ color: '#15803D', fontWeight: 'bold', marginTop: 8, textAlign: 'center' }}>
              {copyFeedback}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.bold}>{t.shopListLbl}</Text>
        {groupedAisles.length === 0 ? (
<View style={{ marginTop: 8 }}>
  <Text style={[s.txt, { color: '#64748B', marginBottom: 12 }]}>
    {t.shopEmpty}
  </Text>
  <View style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
    <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0F172A', marginBottom: 6 }}>
      {t.pantryBaseTitle || '📦 Dispensa Base per «Componi Piatto Semplice»:'}
    </Text>
    <Text style={{ fontSize: 12, color: '#334155', lineHeight: 18, marginBottom: 8 }}>
      {t.pantryBaseDesc || 'In modalità Componi Piatto puoi fare la spesa rifornendo la tua dispensa con questi alimenti base nelle quantità più comode per la settimana:'}
    </Text>
    <Text style={{ fontSize: 11.5, color: '#1E293B', marginBottom: 4 }}>
      🌾 <Text style={{ fontWeight: 'bold' }}>Carboidrati:</Text> Pasta di semola/riso, pane di segale, fiocchi d'avena, patate.
    </Text>
    <Text style={{ fontSize: 11.5, color: '#1E293B', marginBottom: 4 }}>
      🥩 <Text style={{ fontWeight: 'bold' }}>Proteine:</Text> Petto di pollo/tacchino, salmone/merluzzo, uova fresche, yogurt greco 0%, tonno al naturale.
    </Text>
    <Text style={{ fontSize: 11.5, color: '#1E293B', marginBottom: 4 }}>
      🫒 <Text style={{ fontWeight: 'bold' }}>Grassi & Condimenti:</Text> Olio extravergine d'oliva, mandorle/noci, burro d'arachidi 100%.
    </Text>
    <Text style={{ fontSize: 11.5, color: '#1E293B' }}>
      🥗 <Text style={{ fontWeight: 'bold' }}>Verdure & Frutta:</Text> Verdure fresche o surgelate e frutta di stagione a piacere.
    </Text>
  </View>
</View>
        ) : (
          <View>
            {groupedAisles.map((group) => (
              <View key={group.aisle} style={{ marginTop: 8 }}>
                <Text style={[s.bold, { color: LIME_TEXT }]}>{t.aisles[group.aisle] || group.aisle}</Text>
                {group.items.map(([k, g]) => (
                  <Text key={k} style={s.sItem}>
                    ☑️ {trFood(k, lang)}: <Text style={s.bTxt}>{g}g</Text>
                  </Text>
                ))}
              </View>
            ))}

            <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderColor: '#EDF2F7' }}>
              <TouchableOpacity
                style={[s.sBtn, { backgroundColor: '#25D366', marginTop: 0 }]}
                onPress={handleShareWhatsApp}
              >
                <Text style={[s.sBtnTxt, { color: '#FFF' }]}>{t.shareWhatsAppBtn}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.sBtn, { marginTop: 8 }]}
                onPress={handleCopyClipboard}
              >
                <Text style={s.sBtnTxt}>{t.copyClipboardBtn}</Text>
              </TouchableOpacity>

              {copiedMsg ? (
                <Text style={{ color: '#15803D', fontWeight: 'bold', marginTop: 8, textAlign: 'center' }}>
                  {copiedMsg}
                </Text>
              ) : null}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── PANNELLO INTEGRATORI (3 PROFILI) ─────────────────────────────────────────
export function SupplementsPanel({ paziente, daily, lang = 'it' }) {
  const t = UI[lang] || UI.it;
  const norm = M.normalizePaziente(paziente);
  const nomePaziente = [norm.anagrafica?.nome, norm.anagrafica?.cognome].filter(Boolean).join(' ') || (norm.anagrafica?.nome || '').trim();
  const integratori = norm.integratori || [];
  const metodo = norm.metodo;

  if (integratori.length === 0) {
    return (
      <View style={s.card}>
        <Text style={s.bold}>{t.supplementsTitle || '💊 Protocollo Integrazione'}</Text>
        <Text style={s.txt}>{t.noSupplements || 'Nessun integratore prescritto per questo piano.'}</Text>
      </View>
    );
  }

  const getMomentoLabel = (id) => {
    const found = M.MOMENTI_INTEGRATORI.find((m) => m.id === id);
    return found ? found.label : id;
  };

  const renderItem = (it) => (
    <View
      key={it.id}
      style={{
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 10,
        marginBottom: 8,
      }}
    >
      <View style={s.rowBet}>
        <Text style={[s.bold, { fontSize: 14, color: '#0F172A' }]}>{it.nome}</Text>
        <Text
          style={{
            fontSize: 12,
            fontWeight: 'bold',
            color: '#3F6212',
            backgroundColor: '#F7FEE7',
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: '#A3E635',
          }}
        >
          {it.dosaggio}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
        <Text style={{ fontSize: 11, color: '#475569', fontWeight: '600' }}>
          ⏱️ {getMomentoLabel(it.momento)}
        </Text>
      </View>
      {it.note ? (
        <Text style={[s.txt, { fontSize: 12, fontStyle: 'italic', marginTop: 4, color: '#64748B' }]}>
          💡 {it.note}
        </Text>
      ) : null}
    </View>
  );

  // 1. BENESSERE: Lista unica e lineare con momento preferito
  if (metodo === 'BENESSERE') {
    return (
      <View style={s.card}>
        <View style={s.rowBet}>
          <Text style={s.bold}>{t.supplementsTitle || '💊 Protocollo Integrazione'}</Text>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#15803D' }}>🌱 Benessere</Text>
        </View>
        <Text style={[s.hint, { marginBottom: 10 }]}>
          Integratori da assumere nel corso della giornata secondo le indicazioni:
        </Text>
        {integratori.map(renderItem)}
      </View>
    );
  }

  // 2. FITNESS: 2 sezioni (Tutti i giorni vs Solo giorni di sport)
  if (metodo === 'FITNESS') {
    const sportKeys = ['solo_sport', 'pre_workout', 'intra_workout', 'post_workout'];
    const quotidiani = integratori.filter((it) => !sportKeys.includes(it.momento));
    const sportivi = integratori.filter((it) => sportKeys.includes(it.momento));

    return (
      <View style={s.card}>
        <View style={s.rowBet}>
          <Text style={s.bold}>{t.supplementsTitle || '💊 Protocollo Integrazione'}</Text>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0284C7' }}>⚡ Fitness</Text>
        </View>

        <Text style={[s.bold, { color: '#0F172A', marginTop: 8, marginBottom: 6 }]}>
          📅 1. Tutti i giorni (Base quotidiana):
        </Text>
        {quotidiani.length > 0 ? (
          quotidiani.map(renderItem)
        ) : (
          <Text style={[s.txt, { marginBottom: 8, fontStyle: 'italic' }]}>Nessun integratore quotidiano fisso.</Text>
        )}

        <Text style={[s.bold, { color: '#B45309', marginTop: 10, marginBottom: 6 }]}>
          ⚡ 2. Solo nei giorni di sport (Pre / Intra / Post):
        </Text>
        {sportivi.length > 0 ? (
          sportivi.map(renderItem)
        ) : (
          <Text style={[s.txt, { fontStyle: 'italic' }]}>Nessun integratore specifico per lo sport.</Text>
        )}
      </View>
    );
  }

  // 3. ATLETA: 4 sezioni per timing (Pre, Intra, Post, Altri)
  const preList = integratori.filter((it) => it.momento === 'pre_workout');
  const intraList = integratori.filter((it) => it.momento === 'intra_workout');
  const postList = integratori.filter((it) => it.momento === 'post_workout');
  const altriList = integratori.filter(
    (it) => !['pre_workout', 'intra_workout', 'post_workout'].includes(it.momento)
  );

  return (
    <View style={s.card}>
      <View style={s.rowBet}>
        <Text style={s.bold}>{t.supplementsTitle || '💊 Protocollo Integrazione'}</Text>
        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#DC2626' }}>🔥 Atleta</Text>
      </View>
      <Text style={[s.hint, { marginBottom: 10 }]}>
        Organizzazione oraria sincronizzata con l’allenamento:
      </Text>

      {preList.length > 0 ? (
        <View style={{ marginBottom: 8 }}>
          <Text style={[s.bold, { color: '#D97706', marginBottom: 4 }]}>⏳ Pre-Workout (30-45 min prima):</Text>
          {preList.map(renderItem)}
        </View>
      ) : null}

      {intraList.length > 0 ? (
        <View style={{ marginBottom: 8 }}>
          <Text style={[s.bold, { color: '#2563EB', marginBottom: 4 }]}>🍶 Intra-Workout (durante l’allenamento):</Text>
          {intraList.map(renderItem)}
        </View>
      ) : null}

      {postList.length > 0 ? (
        <View style={{ marginBottom: 8 }}>
          <Text style={[s.bold, { color: '#16A34A', marginBottom: 4 }]}>🥤 Post-Workout / Recupero Immediato:</Text>
          {postList.map(renderItem)}
        </View>
      ) : null}

      {altriList.length > 0 ? (
        <View style={{ marginBottom: 4 }}>
          <Text style={[s.bold, { color: '#475569', marginBottom: 4 }]}>📅 Altri momenti della giornata (Pasti / Notte):</Text>
          {altriList.map(renderItem)}
        </View>
      ) : null}
    </View>
  );
}

// ─── PERI-WORKOUT CARD PER ATLETA ────────────────────────────────────────────
export function PeriWorkoutCard({ daily, lang = 'it' }) {
  const t = UI[lang] || UI.it;
  if (!daily || daily.metodo !== 'ATLETA' || !daily.hasWorkout) return null;

  const hasIntra = Boolean(daily.intraC > 0 || daily.intraNome);
  const hasRecovery = Boolean(daily.postC > 0 || daily.postP > 0 || daily.postNome);

  if (!hasIntra && !hasRecovery) return null;

  return (
    <View
      style={[
        s.wBox,
        {
          backgroundColor: '#F0FDF4',
          borderColor: '#16A34A',
          borderLeftWidth: 4,
          marginBottom: 12,
        },
      ]}
    >
      <Text style={[s.wTit, { color: '#166534', fontSize: 15 }]}>
        ⚡ Strategia Peri-Workout
      </Text>
      <Text style={[s.wSub, { color: '#15803D', marginBottom: 8 }]}>
        Calibrato per sostenere la performance e ottimizzare il recupero muscolare.
      </Text>

      {hasIntra ? (
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#BBF7D0',
            borderRadius: 8,
            padding: 10,
            marginBottom: 8,
          }}
        >
          <View style={s.rowBet}>
            <Text style={[s.bold, { color: '#15803D' }]}>
              {t.intraTitle || '🍶 Intra-Workout (in borraccia)'}
            </Text>
            <Text style={{ fontWeight: 'bold', color: '#166534', fontSize: 13 }}>
              {daily.intraC}g Carbo
            </Text>
          </View>
          <Text style={[s.txt, { fontSize: 12, marginTop: 2 }]}>
            {daily.intraNome || 'Maltodestrine / Gel'} sciolti in borraccia con acqua ({daily.curAthleteDay?.intra?.ore || 2}h @ {daily.curAthleteDay?.intra?.gh_carbo || 60}g/h).
          </Text>
        </View>
      ) : null}

      {hasRecovery ? (
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#BBF7D0',
            borderRadius: 8,
            padding: 10,
          }}
        >
          <View style={s.rowBet}>
            <Text style={[s.bold, { color: '#15803D' }]}>
              {t.recoveryTitle || '🥤 Post-Workout Immediato (Recovery Shake)'}
            </Text>
            <Text style={{ fontWeight: 'bold', color: '#166534', fontSize: 13 }}>
              P: {daily.postP}g | C: {daily.postC}g
            </Text>
          </View>
          <Text style={[s.txt, { fontSize: 12, marginTop: 2 }]}>
            {daily.postNome || 'Recovery Shake'}: assumere entro 30 minuti dal termine dell’allenamento.
          </Text>
        </View>
      ) : null}

      <Text style={[s.hint, { color: '#15803D', marginTop: 6 }]}>
        ℹ️ I pasti pre e post allenamento sono calibrati con l’apporto ottimale di carboidrati per sostenere la performance e il recupero.
      </Text>
    </View>
  );
}

// ─── TESTO COMPLETO DEL PROSPETTO PER CONDIVISIONE / COPIA ────────────────────
export const buildProspectusText = (paziente, daily, lang = 'it') => {
  const norm = M.normalizePaziente(paziente);
  const pData = norm.piano_dati || {};
  const peso = parseFloat(norm.peso_visita) || 70;
  const lines = [
    '========================================',
    'B-SPORTLAB • DR. FEDERICO BALDASSARRE',
    'Biologo Nutrizionista Sportivo',
    '========================================',
    `Paziente: ${norm.codice}`,
    `Profilo: ${norm.metodo}`,
    `Peso Visita: ${peso} kg`,
    '',
  ];

  if (norm.metodo === 'BENESSERE') {
    lines.push('--- PROSPETTO BENESSERE & SALUTE ---');
    lines.push(`• Fabbisogno Stimato: ${daily?.kcalGiorno || 0} kcal`);
    lines.push(`• Proteine: ${daily?.totP || 0}g (${daily?.gPerKg?.p || '-'} g/kg)`);
    lines.push(`• Carboidrati: ${daily?.totC || 0}g (${daily?.gPerKg?.c || '-'} g/kg)`);
    lines.push(`• Grassi: ${daily?.totF || 0}g (${daily?.gPerKg?.f || '-'} g/kg)`);
    lines.push(`• Obiettivo Passi: ${norm.passi_target} passi/giorno`);
    lines.push(`• Idratazione Base: ${daily?.waterLiters || '2.2'} Litri/giorno`);
  } else if (norm.metodo === 'FITNESS') {
    const r = pData.riposo_fitness || {};
    const kcalRiposo = (Number(r.p || 0) * 4) + (Number(r.f || 0) * 9) + (Number(r.c || 0) * 4);
    lines.push('--- PROSPETTO FITNESS / AMATORIALE ---');
    lines.push(`• Giornata di Riposo: ~${kcalRiposo} kcal`);
    lines.push(`  P: ${r.p}g | L: ${r.f}g | C: ${r.c}g`);
    (pData.workouts_fitness || []).forEach((w, idx) => {
      let pW = Number(w.p);
      let fW = Number(w.f);
      let cW = Number(w.c);
      if (isNaN(pW) || isNaN(cW) || isNaN(fW) || (!w.p && !w.c)) {
        const deltaKcal = Number(w.delta_kcal) || 350;
        pW = Number(r.p || 0) + Math.round((deltaKcal * 0.20) / 4);
        fW = Number(r.f || 0) + Math.round((deltaKcal * 0.20) / 9);
        cW = Number(r.c || 0) + Math.round((deltaKcal * 0.60) / 4);
      }
      const totKcal = (pW * 4) + (fW * 9) + (cW * 4);
      const diffKcal = totKcal - kcalRiposo;
      lines.push(`• ${w.nome || `Allenamento ${idx + 1}`}: ~${totKcal} kcal (${diffKcal >= 0 ? `+${diffKcal}` : diffKcal} kcal vs riposo)`);
      lines.push(`  P: ${pW}g | L: ${fW}g | C: ${cW}g`);
    });
    lines.push(`• Idratazione: ${(peso * 33 / 1000).toFixed(1)} L (riposo) / ${((peso * 33 + 500) / 1000).toFixed(1)} L (allenamento)`);
  } else if (norm.metodo === 'ATLETA') {
    lines.push('--- PROSPETTO ATLETA / PERFORMANCE ---');
    lines.push(`• BMR Basale: ${pData.bmr_base || 1500} kcal | Moltiplicatore LAF: ${pData.coeff_laf || 1.2}`);
    lines.push(`• Inizio Microciclo: ${pData.data_inizio || '-'}`);
    lines.push('CALENDARIO MICROCICLO:');
    (pData.giorni_atleta || []).forEach((g) => {
      const gKcal = Math.round((Number(pData.bmr_base || 1500) * Number(pData.coeff_laf || 1.2)) + (Number(g.kj) || 0));
      lines.push(`- ${g.data} (${g.nome}): ${g.kj || 0} kJ (~${gKcal} kcal)`);
      if (g.target_macro) {
        lines.push(`  P ${g.target_macro.p}g | C ${g.target_macro.c}g | L ${g.target_macro.f}g`);
      }
      if (Number(g.kj) > 0) {
        lines.push(`  Intra: ${g.intra?.ore || 0}h @ ${g.intra?.gh_carbo || 0}g/h (${g.intra?.nome || 'Maltodestrine/gel'})`);
        lines.push(`  Recupero: ${g.recovery?.nome || 'Recovery Shake'}`);
      }
    });
  }

  lines.push('');
  lines.push('--- PROTOCOLLO INTEGRATORI ---');
  if (norm.integratori && norm.integratori.length > 0) {
    norm.integratori.forEach((it) => {
      const mLabel = M.MOMENTI_INTEGRATORI.find((m) => m.id === it.momento)?.label || it.momento;
      lines.push(`• [${mLabel}] ${it.nome} - ${it.dosaggio}${it.note ? ` (${it.note})` : ''}`);
    });
  } else {
    lines.push('Nessun integratore prescritto.');
  }

  if (norm.note_dottore) {
    lines.push('');
    lines.push('--- INDICAZIONI DEL NUTRIZIONISTA ---');
    lines.push(norm.note_dottore);
  }

  lines.push('');
  lines.push('B-sportlab • Dr. Federico Baldassarre');
  return lines.join('\n');
};

// Tabella di lookup Base64 a 64 caratteri (indipendente dall'ambiente: Web, iOS, Android, JSC)
const B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const B64_LOOKUP = new Uint8Array(256);
for (let i = 0; i < 64; i++) B64_LOOKUP[B64_CHARS.charCodeAt(i)] = i;

function decodeBase64ToBytes(b64) {
  if (!b64 || typeof b64 !== "string") return new Uint8Array(0);
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, "");
  const len = clean.length;
  if (len === 0) return new Uint8Array(0);
  const bytesLen = Math.floor((len * 3) / 4);
  const bytes = new Uint8Array(bytesLen);

  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const enc1 = B64_LOOKUP[clean.charCodeAt(i)] || 0;
    const enc2 = B64_LOOKUP[clean.charCodeAt(i + 1)] || 0;
    const enc3 = B64_LOOKUP[clean.charCodeAt(i + 2)] || 0;
    const enc4 = B64_LOOKUP[clean.charCodeAt(i + 3)] || 0;

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    if (p < bytesLen) bytes[p++] = chr1;
    if (i + 2 < len && p < bytesLen) bytes[p++] = chr2;
    if (i + 3 < len && p < bytesLen) bytes[p++] = chr3;
  }
  return bytes.subarray(0, p);
}

function bytesToBase64(bytes) {
  if (!bytes || bytes.length === 0) return "";
  let b64 = "";
  const len = bytes.length;
  const remainder = len % 3;
  const mainLen = len - remainder;

  for (let i = 0; i < mainLen; i += 3) {
    const chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    b64 += B64_CHARS[(chunk >> 18) & 63] +
           B64_CHARS[(chunk >> 12) & 63] +
           B64_CHARS[(chunk >> 6) & 63] +
           B64_CHARS[chunk & 63];
  }

  if (remainder === 1) {
    const chunk = bytes[mainLen];
    b64 += B64_CHARS[(chunk >> 2) & 63] +
           B64_CHARS[(chunk << 4) & 63] +
           "==";
  } else if (remainder === 2) {
    const chunk = (bytes[mainLen] << 8) | bytes[mainLen + 1];
    b64 += B64_CHARS[(chunk >> 10) & 63] +
           B64_CHARS[(chunk >> 4) & 63] +
           B64_CHARS[(chunk << 2) & 63] +
           "=";
  }
  return b64;
}

// ─── TESTO COMPLETO DEL MENU (PER CONDIVISIONE DA APP NATIVA) ────────────────
export const buildFullMenuText = ({ norm, allTargetDays, pdfDay, weekPlan, results, shopDay, daily, flt, lang = 'it' }) => {
  const lines = [buildProspectusText(norm, daily, lang), ''];
  lines.push('========================================');
  lines.push('MENÙ DEI PASTI:');
  lines.push('========================================');

  let daysToRender = allTargetDays;
  if (pdfDay !== 'ALL') {
    const found = allTargetDays.find((d) => d.id === pdfDay || d.dayKey === pdfDay);
    daysToRender = found ? [found] : allTargetDays;
  }

  daysToRender.forEach((target) => {
    lines.push(`\n📅 ${target.label.toUpperCase()}`);
const targetDaily = (target.isAthlete && target.athleteDay)
  ? (M.calcAthleteDay ? M.calcAthleteDay(norm, target.dayKey, target.athleteDay.tipo_wo || 'REST', target.athleteDay) : daily)
  : daily;
const plateMeals = M.buildComponiPiattoMeals(targetDaily || daily, flt, []);

M.MEALS.forEach((m) => {
  const mData = plateMeals[m];
  if (!mData) return;
  lines.push(`\n🍽️ ${m.toUpperCase()}${mData.isPeriWorkout ? '  [Target Carboidrati Pre/Post ~2.0 g/kg]' : ''}:`);
  
  if (mData.carbo?.primary?.length > 0) {
    lines.push(`  • Carboidrati (1 scelta tra):`);
    mData.carbo.primary.forEach((it) => {
      const cottoTxt = it.cookedRatio && it.cookedRatio !== 1.0 ? ` (~${it.gCotto}g ${it.cookedLabel})` : '';
      const unitTxt = it.servingUnit ? ` [${it.servingUnit}]` : '';
      lines.push(`    - ${it.nome}: ${it.gCrudo}g a crudo${cottoTxt}${unitTxt}`);
    });
  }
  if (mData.protein?.primary?.length > 0) {
    lines.push(`  • Proteine (1 scelta tra):`);
    mData.protein.primary.forEach((it) => {
      const cottoTxt = it.cookedRatio && it.cookedRatio !== 1.0 ? ` (~${it.gCotto}g ${it.cookedLabel})` : '';
      const unitTxt = it.servingUnit ? ` [${it.servingUnit}]` : '';
      lines.push(`    - ${it.nome}: ${it.gCrudo}g a crudo${cottoTxt}${unitTxt}`);
    });
  }
  if (mData.fat?.primary?.length > 0) {
    const fats = mData.fat.primary.map((it) => `${it.nome} ${it.gCrudo}g${it.servingUnit ? ` (${it.servingUnit})` : ''}`).join(' / ');
    lines.push(`  • Grassi / Condimento: ${fats}`);
  }
  if (mData.veggies?.primary?.length > 0) {
    lines.push(`  • Verdure: ~200g a piacere crude o cotte (zucchine, insalata, finocchi...)`);
  }
  if (mData.fruits?.primary?.length > 0) {
    lines.push(`  • Frutta fresca di stagione: ~150g (1 mela, banana o arancia media)`);
  }
});
  });

  return lines.join('\n');
};

// ─── GENERATORE VETTORIALE PDF MENÙ (CON LOGO & INTESTAZIONE STUDIO) ──────────
function buildMenuPdfData({ norm, allTargetDays, pdfDay, weekPlan, results, shopDay, daily, flt, lang }) {
  const pageW = 595.28;
  const pageH = 841.89;
  const marginX = 40.0;
  const marginY = 45.0;

  const logoBytes = decodeBase64ToBytes(BSPORTLAB_LOGO_JPG_B64);
  const hasLogo = logoBytes && logoBytes.length > 0;

  const lines = [];

  const addWrappedText = (text, size = 9, bold = false, color = [0.1, 0.1, 0.1], maxLen = 80) => {
    if (!text) return;
    const cleanStr = String(text).replace(/[\r\n\t]+/g, ' ').trim();
    if (cleanStr.length <= maxLen) {
      lines.push({ text: cleanStr, size, bold, color });
      return;
    }
    const words = cleanStr.split(' ');
    let cur = '';
    words.forEach((w) => {
      if ((cur + ' ' + w).trim().length > maxLen) {
        if (cur.trim()) lines.push({ text: cur.trim(), size, bold, color });
        cur = w;
      } else {
        cur += (cur ? ' ' : '') + w;
      }
    });
    if (cur.trim()) {
      lines.push({ text: cur.trim(), size, bold, color });
    }
  };

  const metodoLabel = norm.metodo === 'BENESSERE' ? 'Benessere' : norm.metodo === 'FITNESS' ? 'Fitness' : 'Atleta';
  addWrappedText(
    `Paziente: ${norm.codice}  |  Peso Visita: ${norm.peso_visita || 70} kg  |  Profilo: ${metodoLabel}  |  Data: ${M.formatDateDMY(new Date())}`,
    10,
    true,
    [0.1, 0.1, 0.1],
    85
  );

  const waterStr = `Idratazione consigliata: ${daily?.waterLiters || '2.2'} Litri al giorno${norm.metodo === 'BENESSERE' ? `  |  Passi target (NEAT): ${norm.passi_target || 8000}/die` : ''}`;
  addWrappedText(waterStr, 9, false, [0.1, 0.3, 0.6], 85);
  lines.push({ text: '--------------------------------------------------------------------------------', size: 8, color: [0.7, 0.7, 0.7] });

  // Giorni da includere nel PDF
  let daysToRender = allTargetDays;
  if (pdfDay !== 'ALL') {
    const found = allTargetDays.find((d) => d.id === pdfDay || d.dayKey === pdfDay);
    daysToRender = found ? [found] : allTargetDays;
  }

  daysToRender.forEach((target) => {
    lines.push({ text: `GIORNO: ${target.label.toUpperCase()}`, size: 12, bold: true, color: [0.1, 0.25, 0.45] });

    // Peri-workout se applicabile
    if (target.isAthlete && target.athleteDay && Number(target.athleteDay.kj) > 0) {
      const intraC = Math.round((Number(target.athleteDay.intra?.ore) || 0) * (Number(target.athleteDay.intra?.gh_carbo) || 0));
      addWrappedText(
        `* Peri-Workout: Borraccia ${intraC}g carbo (${target.athleteDay.intra?.nome || 'Maltodestrine/gel'}) | ${target.athleteDay.recovery?.nome || 'Recovery Shake post-workout'}`,
        9,
        true,
        [0.8, 0.4, 0.0],
        80
      );
    } else if (daily?.hasWorkout && (daily.intraC > 0 || daily.postNome)) {
      addWrappedText(
        `* Peri-Workout: ${daily.intraC > 0 ? `Borraccia ${daily.intraC}g carbo | ` : ''}${daily.postNome ? `${daily.postNome} post-workout` : ''}`,
        9,
        true,
        [0.8, 0.4, 0.0],
        80
      );
    }

// Pasti Componi Piatto Semplice
const targetDaily = (target.isAthlete && target.athleteDay)
  ? (M.calcAthleteDay ? M.calcAthleteDay(norm, target.dayKey, target.athleteDay.tipo_wo || 'REST', target.athleteDay) : daily)
  : daily;
const plateMeals = M.buildComponiPiattoMeals(targetDaily || daily, flt, []);

M.MEALS.forEach((m) => {
  const mData = plateMeals[m];
  if (!mData) return;

  const periTag = mData.isPeriWorkout ? ' [Target Carbo Pre/Post ~2.0 g/kg]' : '';
  lines.push({ text: `${m.toUpperCase()}${periTag}`, size: 10, bold: true, color: [0.1, 0.25, 0.45] });

  if (mData.carbo?.primary?.length > 0) {
    const cStr = mData.carbo.primary
      .map((it) => {
        const cotto = it.cookedRatio && it.cookedRatio !== 1.0 ? ` (~${it.gCotto}g ${it.cookedLabel})` : '';
        return `${it.nome}: ${it.gCrudo}g crudo${cotto}`;
      })
      .join('  |  ');
    addWrappedText(`* Carboidrati (1 a scelta): ${cStr}`, 8.5, false, [0.15, 0.15, 0.15], 84);
  }

  if (mData.protein?.primary?.length > 0) {
    const pStr = mData.protein.primary
      .map((it) => {
        const cotto = it.cookedRatio && it.cookedRatio !== 1.0 ? ` (~${it.gCotto}g ${it.cookedLabel})` : '';
        return `${it.nome}: ${it.gCrudo}g crudo${cotto}`;
      })
      .join('  |  ');
    addWrappedText(`* Proteine (1 a scelta): ${pStr}`, 8.5, false, [0.15, 0.15, 0.15], 84);
  }

  if (mData.fat?.primary?.length > 0) {
    const fStr = mData.fat.primary
      .map((it) => `${it.nome}: ${it.gCrudo}g${it.servingUnit ? ` (${it.servingUnit})` : ''}`)
      .join('  |  ');
    addWrappedText(`* Grassi / Condimento: ${fStr}`, 8.5, false, [0.2, 0.2, 0.2], 84);
  }

  if (mData.veggies?.primary?.length > 0) {
    addWrappedText(`* Verdure: ~200g a piacere crude o cotte (insalata, zucchine, pomodori, spinaci)`, 8, false, [0.35, 0.35, 0.35], 84);
  }
  if (mData.fruits?.primary?.length > 0) {
    addWrappedText(`* Frutta fresca: ~150g (1 frutto medio di stagione)`, 8, false, [0.35, 0.35, 0.35], 84);
  }
});
    lines.push({ text: '--------------------------------------------------------------------------------', size: 8, color: [0.8, 0.8, 0.8] });
  });

  // Integratori
  lines.push({ text: 'PROTOCOLLO INTEGRATORI:', size: 11, bold: true, color: [0.1, 0.4, 0.1] });
  if (norm.integratori && norm.integratori.length > 0) {
    norm.integratori.forEach((it) => {
      const mEntry = M.MOMENTI_INTEGRATORI.find((m) => (Array.isArray(m) ? m[0] === it.momento : m.id === it.momento));
      const mLabel = Array.isArray(mEntry) ? mEntry[1] : (mEntry?.label || it.momento);
      addWrappedText(`* [${mLabel}] ${it.nome} (${it.dose || it.dosaggio || 'standard'})${it.note ? ` - ${it.note}` : ''}`, 9, false, [0.2, 0.2, 0.2], 82);
    });
  } else {
    lines.push({ text: 'Nessun integratore prescritto.', size: 9, color: [0.5, 0.5, 0.5] });
  }

  // Note Dottore
  if (norm.note_dottore) {
    lines.push({ text: 'INDICAZIONI DEL NUTRIZIONISTA:', size: 11, bold: true, color: [0.1, 0.4, 0.1] });
    addWrappedText(norm.note_dottore, 9, false, [0.25, 0.25, 0.25], 82);
  }

  // Costruzione Pagine e Layout Vettoriale
  const pages = [];
  let curPage = [];
  let curY = hasLogo ? (pageH - 120) : (pageH - marginY);

  lines.forEach((item) => {
    const size = item.size || 10;
    const lineH = size * 1.35;
    if (curY - lineH < 56.0) {
      pages.push(curPage);
      curPage = [];
      curY = pageH - marginY - 30;
    }
    curPage.push({
      text: item.text,
      size,
      bold: item.bold || false,
      x: marginX,
      y: curY,
      color: item.color || [0, 0, 0],
    });
    curY -= lineH;
  });
  if (curPage.length > 0) pages.push(curPage);
  if (pages.length === 0) pages.push([]);

  const totPages = pages.length;
  const f1Id = 3 + totPages * 2;
  const f2Id = f1Id + 1;
  const imgId = hasLogo ? f2Id + 1 : null;
  const maxObjId = hasLogo ? imgId : f2Id;

  function sanitizePdfText(str) {
    if (!str) return '';
    let clean = '';
    const s = String(str).replace(/[\r\n\t]+/g, ' ');
    for (let i = 0; i < s.length; i++) {
      const code = s.charCodeAt(i);
      if (code === 8216 || code === 8217) clean += "'";
      else if (code === 8220 || code === 8221) clean += '"';
      else if (code === 8211 || code === 8212) clean += '-';
      else if (code === 8226) clean += '*';
      else if (code === 92) clean += '\\\\';
      else if (code === 40) clean += '\\(';
      else if (code === 41) clean += '\\)';
      else if (code === 224) clean += "a'"; // à
      else if (code === 228) clean += "a";  // ä
      else if (code === 232 || code === 233) clean += "e'"; // è, é
      else if (code === 236) clean += "i'"; // ì
      else if (code === 242) clean += "o'"; // ò
      else if (code === 249) clean += "u'"; // ù
      else if (code === 192) clean += "A'"; // À
      else if (code === 200 || code === 201) clean += "E'"; // È, É
      else if (code === 204) clean += "I'"; // Ì
      else if (code === 210) clean += "O'"; // Ò
      else if (code === 217) clean += "U'"; // Ù
      else if (code > 255) clean += ' ';
      else if (code < 32) clean += ' ';
      else clean += s[i];
    }
    return clean;
  }

  const contentStreams = [];
  pages.forEach((pg, idx) => {
    let s = '';
    if (idx === 0) {
      if (hasLogo) {
        // Logo vettoriale B-SportLab
        s += 'q\n48 0 0 48 40.00 746.00 cm\n/Im1 Do\nQ\n';
        s += 'BT\n';
        // Titolo Studio & Dottore (Sinistra)
        s += '0.1 0.15 0.2 rg\n/F2 14 Tf\n1 0 0 1 98.00 778.00 Tm\n(Dr. Federico Baldassarre) Tj\n';
        s += '0.35 0.4 0.45 rg\n/F1 9 Tf\n1 0 0 1 98.00 762.00 Tm\n(biologo nutrizionista sportivo) Tj\n';
        // Contatti Testata (Destra)
        s += '0.32 0.65 0.05 rg\n/F2 8.5 Tf\n1 0 0 1 450.00 778.00 Tm\n(Website:) Tj\n';
        s += '0.15 0.2 0.25 rg\n/F1 8.5 Tf\n1 0 0 1 450.00 764.00 Tm\n(www.b-sportlab.com) Tj\n';
        s += 'ET\n';
      } else {
        s += 'BT\n';
        s += '0.1 0.15 0.2 rg\n/F2 14 Tf\n1 0 0 1 40.00 780.00 Tm\n(Dr. Federico Baldassarre) Tj\n';
        s += '0.35 0.4 0.45 rg\n/F1 9.5 Tf\n1 0 0 1 40.00 765.00 Tm\n(biologo nutrizionista sportivo | Piano Nutrizionale) Tj\n';
        s += '0.32 0.65 0.05 rg\n/F2 8.5 Tf\n1 0 0 1 450.00 780.00 Tm\n(Website:) Tj\n';
        s += '0.15 0.2 0.25 rg\n/F1 8.5 Tf\n1 0 0 1 450.00 766.00 Tm\n(www.b-sportlab.com) Tj\n';
        s += 'ET\n';
      }
    } else {
      s += 'BT\n';
      s += '0.25 0.55 0.05 rg\n/F2 9 Tf\n1 0 0 1 40.00 805.00 Tm\n(B-SPORTLAB - Dr. Federico Baldassarre | biologo nutrizionista sportivo) Tj\n';
      s += '0.3 0.35 0.4 rg\n/F1 8 Tf\n1 0 0 1 465.00 805.00 Tm\n(www.b-sportlab.com) Tj\n';
      s += '0.75 0.75 0.75 rg\n/F1 8 Tf\n1 0 0 1 40.00 795.00 Tm\n(--------------------------------------------------------------------------------) Tj\n';
      s += 'ET\n';
    }

    s += 'BT\n';
    pg.forEach((l) => {
      const font = l.bold ? '/F2' : '/F1';
      const [r, g, b] = l.color;
      s += `${r} ${g} ${b} rg\n${font} ${l.size} Tf\n1 0 0 1 ${l.x.toFixed(2)} ${l.y.toFixed(2)} Tm\n`;
      const clean = sanitizePdfText(l.text || '');
      s += `(${clean}) Tj\n`;
    });
    s += 'ET\n';

    // Piè di pagina (Footer) su TUTTE le pagine con i contatti ufficiali dello studio
    // Linea divisoria footer
    s += 'q\n0.82 0.85 0.82 RG\n0.5 w\n40.00 46.00 m\n555.00 46.00 l\nS\nQ\n';
    s += 'BT\n';
    // Colonna 1: Cellulare
    s += '0.32 0.65 0.05 rg\n/F2 7.5 Tf\n1 0 0 1 40.00 34.00 Tm\n(Cellulare:) Tj\n';
    s += '0.2 0.25 0.3 rg\n/F1 7.5 Tf\n1 0 0 1 40.00 23.00 Tm\n(+39 3519246513) Tj\n';
    // Colonna 2: P. IVA & Pagina
    s += '0.32 0.65 0.05 rg\n/F2 7.5 Tf\n1 0 0 1 220.00 34.00 Tm\n(P. IVA: 13364110018) Tj\n';
    s += `0.45 0.5 0.55 rg\n/F1 7.5 Tf\n1 0 0 1 220.00 23.00 Tm\n(B-sportlab  |  Pagina ${idx + 1} di ${totPages}) Tj\n`;
    // Colonna 3: Indirizzi sedi
    s += '0.32 0.65 0.05 rg\n/F2 7.5 Tf\n1 0 0 1 410.00 34.00 Tm\n(Indirizzo:) Tj\n';
    s += '0.2 0.25 0.3 rg\n/F1 7 Tf\n1 0 0 1 410.00 24.00 Tm\n(Torino - Corso Moncalieri 47) Tj\n';
    s += '0.2 0.25 0.3 rg\n/F1 7 Tf\n1 0 0 1 410.00 15.00 Tm\n(Sanremo - Piazza C. Colombo 4) Tj\n';
    // Copyright B-sportlab
    s += '0.45 0.5 0.55 rg\n/F1 6.5 Tf\n1 0 0 1 40.00 8.00 Tm\n(Copyright \\(c\\) 2026 B-sportlab di Federico Baldassarre. Tutti i diritti riservati - Biologo Nutrizionista Sportivo) Tj\n';
    s += 'ET\n';

    contentStreams.push(s);
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [];

  offsets.push(pdf.length);
  pdf += '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';

  offsets.push(pdf.length);
  const kids = Array.from({ length: totPages }, (_, i) => `${3 + i} 0 R`).join(' ');
  pdf += `2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${totPages} >>\nendobj\n`;

  const resXObject = hasLogo ? ` /XObject << /Im1 ${imgId} 0 R >>` : '';
  for (let i = 0; i < totPages; i++) {
    const cid = 3 + totPages + i;
    offsets.push(pdf.length);
    pdf += `${3 + i} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents ${cid} 0 R /Resources << /Font << /F1 ${f1Id} 0 R /F2 ${f2Id} 0 R >>${resXObject} >> >>\nendobj\n`;
  }

  for (let i = 0; i < totPages; i++) {
    const st = contentStreams[i];
    offsets.push(pdf.length);
    pdf += `${3 + totPages + i} 0 obj\n<< /Length ${st.length} >>\nstream\n${st}endstream\nendobj\n`;
  }

  offsets.push(pdf.length);
  pdf += `${f1Id} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n`;

  offsets.push(pdf.length);
  pdf += `${f2Id} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n`;

  if (hasLogo) {
    let imgBinaryStr = '';
    for (let i = 0; i < logoBytes.length; i++) {
      imgBinaryStr += String.fromCharCode(logoBytes[i]);
    }
    offsets.push(pdf.length);
    pdf += `${imgId} 0 obj\n<< /Type /XObject /Subtype /Image /Width 120 /Height 120 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoBytes.length} >>\nstream\n${imgBinaryStr}\nendstream\nendobj\n`;
  }

  const xOff = pdf.length;
  pdf += `xref\n0 ${maxObjId + 1}\n0000000000 65535 f \r\n`;
  offsets.forEach((o) => {
    pdf += String(o).padStart(10, '0') + ' 00000 n \r\n';
  });
  pdf += `trailer\n<< /Size ${maxObjId + 1} /Root 1 0 R >>\nstartxref\n${xOff}\n%%EOF\n`;

  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) {
    bytes[i] = pdf.charCodeAt(i) & 0xff;
  }

  return bytes;
}

export function buildMenuPdfBlob(params) {
  const bytes = buildMenuPdfData(params);
  return new Blob([bytes], { type: 'application/pdf' });
}

export function buildMenuPdfBase64(params) {
  const bytes = buildMenuPdfData(params);
  return bytesToBase64(bytes);
}

// ─── GENERATORE VETTORIALE PDF REFERTO ANTROPOMETRICO (4 COMPARTIMENTI) ────
export function buildAntropoPdfData({ norm, visit, lang = 'it' }) {
  const pageW = 595.28;
  const pageH = 841.89;

  const logoBytes = decodeBase64ToBytes(BSPORTLAB_LOGO_JPG_B64);
  const hasLogo = logoBytes && logoBytes.length > 0;

  const res = visit?.risultati || {};
  const mis = visit?.misure || {};
  const pliche = mis.pliche || {};
  const circ = mis.circonferenze || {};
  const diam = mis.diametri || {};
  const meta = res.metabolismo || {};
  const fq = res.frequenze || {};
  const anag = norm?.anagrafica || {};

  const nomeCompleto = [anag.nome, anag.cognome].filter(Boolean).join(' ') || norm.codice || 'Paziente';

  function sanitize(str) {
    if (!str) return '';
    let clean = '';
    const s = String(str).replace(/[\r\n\t]+/g, ' ');
    for (let i = 0; i < s.length; i++) {
      const code = s.charCodeAt(i);
      if (code === 8216 || code === 8217) clean += "'";
      else if (code === 8220 || code === 8221) clean += '"';
      else if (code === 8211 || code === 8212) clean += '-';
      else if (code === 8226) clean += '*';
      else if (code === 92) clean += '\\\\';
      else if (code === 40) clean += '\\(';
      else if (code === 41) clean += '\\)';
      else if (code === 224) clean += "a'";
      else if (code === 232 || code === 233) clean += "e'";
      else if (code === 236) clean += "i'";
      else if (code === 242) clean += "o'";
      else if (code === 249) clean += "u'";
      else if (code > 255 || code < 32) clean += ' ';
      else clean += s[i];
    }
    return clean;
  }

  let s = '';

  // 1. Header con Logo e Dati Studio
  if (hasLogo) {
    s += 'q\n48 0 0 48 40.00 746.00 cm\n/Im1 Do\nQ\n';
    s += 'BT\n';
    s += '0.1 0.15 0.2 rg\n/F2 13 Tf\n1 0 0 1 98.00 778.00 Tm\n(Dr. Federico Baldassarre) Tj\n';
    s += '0.35 0.4 0.45 rg\n/F1 9 Tf\n1 0 0 1 98.00 764.00 Tm\n(Biologo Nutrizionista Sportivo | B-sportlab) Tj\n';
    s += '0.32 0.65 0.05 rg\n/F2 8 Tf\n1 0 0 1 370.00 780.00 Tm\n(Sedi: Torino - C.so Moncalieri 47 | Sanremo - P.za Colombo 4) Tj\n';
    s += '0.2 0.25 0.3 rg\n/F1 8 Tf\n1 0 0 1 370.00 766.00 Tm\n(Tel: +39 3519246513 | www.b-sportlab.com) Tj\n';
    s += 'ET\n';
  } else {
    s += 'BT\n';
    s += '0.1 0.15 0.2 rg\n/F2 14 Tf\n1 0 0 1 40.00 780.00 Tm\n(Dr. Federico Baldassarre - B-sportlab) Tj\n';
    s += '0.35 0.4 0.45 rg\n/F1 9.5 Tf\n1 0 0 1 40.00 765.00 Tm\n(Biologo Nutrizionista Sportivo | Valutazione Antropometrica) Tj\n';
    s += '0.2 0.25 0.3 rg\n/F1 8.5 Tf\n1 0 0 1 370.00 770.00 Tm\n(Tel: +39 3519246513 | www.b-sportlab.com) Tj\n';
    s += 'ET\n';
  }

  // Linea sotto header
  s += 'q\n0.82 0.85 0.82 RG\n0.8 w\n40.00 738.00 m\n555.00 738.00 l\nS\nQ\n';

  // Titolo Documento
  s += 'q\n0.94 0.98 0.90 rg\n40.00 708.00 515.00 24.00 re\nf\nQ\n';
  s += 'q\n0.40 0.70 0.10 RG\n1 w\n40.00 708.00 515.00 24.00 re\ns\nQ\n';
  s += 'BT\n';
  s += '0.15 0.35 0.05 rg\n/F2 11 Tf\n1 0 0 1 48.00 715.00 Tm\n(VALUTAZIONE ANTROPOMETRICA E COMPOSIZIONE CORPOREA \\(4 COMPARTIMENTI\\)) Tj\n';
  s += 'ET\n';

  // Box Dati Paziente
  s += 'BT\n';
  s += '0.1 0.15 0.2 rg\n/F2 9.5 Tf\n1 0 0 1 40.00 690.00 Tm\n(' + sanitize(`Paziente: ${nomeCompleto}  (Codice: ${norm.codice})`) + ') Tj\n';
  s += '0.3 0.35 0.4 rg\n/F1 8.5 Tf\n1 0 0 1 40.00 676.00 Tm\n(' + sanitize(`Data Visita: ${visit?.data || '-'}   |   Sesso: ${res.sesso || '-'}   |   Eta: ${res.eta ? res.eta + ' anni' : '-'}   |   FCR: ${res.fcr ? res.fcr + ' bpm' : '-'}`) + ') Tj\n';
  s += '0.3 0.35 0.4 rg\n/F1 8.5 Tf\n1 0 0 1 40.00 663.00 Tm\n(' + sanitize(`Peso Corporeo: ${res.peso || '-'} kg   |   Altezza: ${res.altezza || '-'} cm   |   BMI: ${res.bmi || '-'} kg/m2   |   WHR: ${res.whr || '-'} (${res.whr_valutazione || '-'})`) + ') Tj\n';
  s += 'ET\n';

  s += 'q\n0.88 0.90 0.92 RG\n0.5 w\n40.00 653.00 m\n555.00 653.00 l\nS\nQ\n';

  // SEZIONE 1: RIPARTIZIONE A 4 COMPARTIMENTI
  s += 'BT\n';
  s += '0.05 0.35 0.65 rg\n/F2 10 Tf\n1 0 0 1 40.00 638.00 Tm\n(1. RIPARTIZIONE A 4 COMPARTIMENTI \\(MODELLO FITCOMPX\\)) Tj\n';
  s += 'ET\n';

  s += 'q\n0.96 0.98 1.00 rg\n40.00 550.00 515.00 78.00 re\nf\nQ\n';
  s += 'q\n0.75 0.85 0.95 RG\n0.8 w\n40.00 550.00 515.00 78.00 re\ns\nQ\n';

  s += 'BT\n';
  s += '0.01 0.45 0.75 rg\n/F2 9 Tf\n1 0 0 1 50.00 610.00 Tm\n(Massa Muscolare Scheletrica \\(SMM\\):) Tj\n';
  s += '0.1 0.15 0.2 rg\n/F1 9 Tf\n1 0 0 1 240.00 610.00 Tm\n(' + sanitize(`${res.muscolo?.kg || '-'} kg  (${res.muscolo?.pct || '-'}% sul peso totale  |  ${res.muscolo?.pct_ffm || '-'}% su massa magra FFM)`) + ') Tj\n';

  s += '0.10 0.25 0.65 rg\n/F2 9 Tf\n1 0 0 1 50.00 594.00 Tm\n(Massa Grassa \\(FM - Jackson-Pollock 6P / Siri\\):) Tj\n';
  s += '0.1 0.15 0.2 rg\n/F1 9 Tf\n1 0 0 1 240.00 594.00 Tm\n(' + sanitize(`${res.grasso?.kg || '-'} kg  (${res.grasso?.pct || '-'}% sul peso totale)`) + ') Tj\n';

  s += '0.70 0.40 0.05 rg\n/F2 9 Tf\n1 0 0 1 50.00 578.00 Tm\n(Massa Ossea \\(BM - Formula Rocha multi-diametro\\):) Tj\n';
  s += '0.1 0.15 0.2 rg\n/F1 9 Tf\n1 0 0 1 240.00 578.00 Tm\n(' + sanitize(`${res.ossa?.kg || '-'} kg  (${res.ossa?.pct || '-'}% sul peso totale)`) + ') Tj\n';

  s += '0.20 0.25 0.35 rg\n/F2 9 Tf\n1 0 0 1 50.00 562.00 Tm\n(Massa Residua \\(organi interni, sangue, fluidi\\):) Tj\n';
  s += '0.1 0.15 0.2 rg\n/F1 9 Tf\n1 0 0 1 240.00 562.00 Tm\n(' + sanitize(`${res.altro?.kg || '-'} kg  (${res.altro?.pct || '-'}% sul peso totale)`) + ') Tj\n';
  s += 'ET\n';

  // SEZIONE 2: MISURE ANTROPOMETRICHE RILEVATE
  s += 'BT\n';
  s += '0.25 0.50 0.10 rg\n/F2 10 Tf\n1 0 0 1 40.00 532.00 Tm\n(2. MISURE ANTROPOMETRICHE CLINICHE RILEVATE) Tj\n';
  s += 'ET\n';

  s += 'q\n0.98 0.99 0.98 rg\n40.00 442.00 515.00 80.00 re\nf\nQ\n';
  s += 'q\n0.82 0.88 0.82 RG\n0.8 w\n40.00 442.00 515.00 80.00 re\ns\nQ\n';

  s += 'BT\n';
  s += '0.15 0.30 0.05 rg\n/F2 8.5 Tf\n1 0 0 1 50.00 508.00 Tm\n(Plicometria \\(mm\\):) Tj\n';
  s += '0.2 0.25 0.3 rg\n/F1 8 Tf\n1 0 0 1 145.00 508.00 Tm\n(' + sanitize(`Tricipite: ${pliche.tricipite ?? '-'} | Sottoscap.: ${pliche.sottoscapola ?? '-'} | Torace: ${pliche.torace ?? '-'} | Addome: ${pliche.addominale ?? '-'} | Ileo: ${pliche.iliaca ?? '-'} | Coscia: ${pliche.coscia ?? '-'}`) + ') Tj\n';
  s += '0.15 0.30 0.05 rg\n/F2 8 Tf\n1 0 0 1 475.00 508.00 Tm\n(' + sanitize(`Somma: ${res.sommaPliche || '-'} mm`) + ') Tj\n';

  s += '0.15 0.30 0.05 rg\n/F2 8.5 Tf\n1 0 0 1 50.00 488.00 Tm\n(Circonferenze \\(cm\\):) Tj\n';
  s += '0.2 0.25 0.3 rg\n/F1 8 Tf\n1 0 0 1 145.00 488.00 Tm\n(' + sanitize(`Braccio: ${circ.braccio ?? '-'} | Vita: ${circ.vita ?? '-'} | Fianchi: ${circ.fianchi ?? '-'} | Coscia radice: ${circ.coscia_radice ?? '-'} | Coscia med.: ${circ.coscia_mediana ?? '-'}`) + ') Tj\n';

  s += '0.15 0.30 0.05 rg\n/F2 8.5 Tf\n1 0 0 1 50.00 468.00 Tm\n(Diametri Ossei \\(cm\\):) Tj\n';
  s += '0.2 0.25 0.3 rg\n/F1 8 Tf\n1 0 0 1 145.00 468.00 Tm\n(' + sanitize(`Polso: ${diam.polso ?? '-'} | Gomito: ${diam.gomito ?? '-'} | Ginocchio: ${diam.ginocchio ?? '-'} | Caviglia: ${diam.caviglia ?? '-'}`) + ') Tj\n';

  if (res.distretti) {
    s += '0.15 0.30 0.05 rg\n/F2 8.5 Tf\n1 0 0 1 50.00 448.00 Tm\n(Stima Segmentale:) Tj\n';
    s += '0.2 0.25 0.3 rg\n/F1 8 Tf\n1 0 0 1 145.00 448.00 Tm\n(' + sanitize(`Muscolo Braccio: ~${res.distretti.braccio?.muscolo_kg || '-'} kg (${res.distretti.braccio?.muscolo_pct || '-'}%)  |  Muscolo Coscia: ~${res.distretti.coscia?.muscolo_kg || '-'} kg (${res.distretti.coscia?.muscolo_pct || '-'}%)`) + ') Tj\n';
  }
  s += 'ET\n';

  // SEZIONE 3: METABOLISMO BASALE & FISIOLOGIA
  s += 'BT\n';
  s += '0.70 0.35 0.05 rg\n/F2 10 Tf\n1 0 0 1 40.00 422.00 Tm\n(3. METABOLISMO BASALE & PARAMETRI FISIOLOGICI) Tj\n';
  s += 'ET\n';

  s += 'q\n0.99 0.98 0.95 rg\n40.00 342.00 515.00 70.00 re\nf\nQ\n';
  s += 'q\n0.90 0.80 0.70 RG\n0.8 w\n40.00 342.00 515.00 70.00 re\ns\nQ\n';

  s += 'BT\n';
  s += '0.55 0.25 0.05 rg\n/F2 9 Tf\n1 0 0 1 50.00 395.00 Tm\n(BMR Basale Muscolare \\(FITcompX - massa magra e muscolo\\):) Tj\n';
  s += '0.1 0.15 0.2 rg\n/F2 9.5 Tf\n1 0 0 1 360.00 395.00 Tm\n(' + sanitize(`${meta.bmrFITcompX || '-'} kcal / die`) + ') Tj\n';

  s += '0.4 0.45 0.5 rg\n/F1 8.5 Tf\n1 0 0 1 50.00 380.00 Tm\n(BMR Basale Standard \\(Formula Harris-Benedict\\):) Tj\n';
  s += '0.3 0.35 0.4 rg\n/F1 8.5 Tf\n1 0 0 1 360.00 380.00 Tm\n(' + sanitize(`${meta.bmrHarrisBenedict || '-'} kcal / die`) + ') Tj\n';

  s += '0.2 0.25 0.3 rg\n/F1 8 Tf\n1 0 0 1 50.00 365.00 Tm\n(' + sanitize(`Acqua Corporea Totale (TBW): ${res.tbw ? res.tbw + ' litri' : '-'}   |   Riserve Glicogeno muscolare + epatico stimato: ${res.glicogeno ? res.glicogeno + ' g' : '-'}`) + ') Tj\n';

  s += '0.2 0.25 0.3 rg\n/F1 8 Tf\n1 0 0 1 50.00 351.00 Tm\n(' + sanitize(`Frequenze Cardiache Allenamento (Karvonen): Aerobica: ${fq.aerobica ? fq.aerobica + ' bpm' : '-'}  |  Anaerobica: ${fq.anaerobica ? fq.anaerobica + ' bpm' : '-'}  |  FC Max: ${fq.massima ? fq.massima + ' bpm' : '-'}`) + ') Tj\n';
  s += 'ET\n';

  // SEZIONE 4: VALUTAZIONE CLINICA DEL NUTRIZIONISTA
  s += 'BT\n';
  s += '0.10 0.45 0.20 rg\n/F2 10 Tf\n1 0 0 1 40.00 322.00 Tm\n(4. VALUTAZIONE CLINICA DEL NUTRIZIONISTA) Tj\n';
  s += 'ET\n';

  s += 'q\n0.95 0.98 0.94 rg\n40.00 70.00 515.00 242.00 re\nf\nQ\n';
  s += 'q\n0.65 0.85 0.65 RG\n0.8 w\n40.00 70.00 515.00 242.00 re\ns\nQ\n';

  s += 'BT\n';
  s += '0.10 0.35 0.15 rg\n/F2 8.5 Tf\n1 0 0 1 50.00 294.00 Tm\n(Referto e Diagnosi Funzionale:) Tj\n';
  s += '0.15 0.25 0.15 rg\n/F1 8.5 Tf\n';

  const diagnosiText = res.diagnosi || 'Valutazione della composizione corporea effettuata mediante metodica antropometrica e plicometrica a 4 compartimenti. La distribuzione dei tessuti e il metabolismo basale calcolato forniscono la base per la pianificazione nutrizionale personalizzata.';
  const diagWords = diagnosiText.split(' ');
  let curLine = '';
  let curY = 278.00;
  diagWords.forEach((w) => {
    if ((curLine + ' ' + w).trim().length > 82) {
      s += `1 0 0 1 50.00 ${curY.toFixed(2)} Tm\n(${sanitize(curLine.trim())}) Tj\n`;
      curY -= 13.00;
      curLine = w;
    } else {
      curLine += (curLine ? ' ' : '') + w;
    }
  });
  if (curLine.trim()) {
    s += `1 0 0 1 50.00 ${curY.toFixed(2)} Tm\n(${sanitize(curLine.trim())}) Tj\n`;
  }
  s += 'ET\n';

  // FOOTER SU FONDO PAGINA
  s += 'q\n0.82 0.85 0.82 RG\n0.5 w\n40.00 46.00 m\n555.00 46.00 l\nS\nQ\n';
  s += 'BT\n';
  s += '0.32 0.65 0.05 rg\n/F2 7.5 Tf\n1 0 0 1 40.00 34.00 Tm\n(Cellulare:) Tj\n';
  s += '0.2 0.25 0.3 rg\n/F1 7.5 Tf\n1 0 0 1 40.00 23.00 Tm\n(+39 3519246513) Tj\n';

  s += '0.32 0.65 0.05 rg\n/F2 7.5 Tf\n1 0 0 1 220.00 34.00 Tm\n(P. IVA: 13364110018) Tj\n';
  s += '0.45 0.5 0.55 rg\n/F1 7.5 Tf\n1 0 0 1 220.00 23.00 Tm\n(B-sportlab  |  Referto Antropometrico) Tj\n';

  s += '0.32 0.65 0.05 rg\n/F2 7.5 Tf\n1 0 0 1 410.00 34.00 Tm\n(Indirizzo:) Tj\n';
  s += '0.2 0.25 0.3 rg\n/F1 7 Tf\n1 0 0 1 410.00 24.00 Tm\n(Torino - Corso Moncalieri 47) Tj\n';
  s += '0.2 0.25 0.3 rg\n/F1 7 Tf\n1 0 0 1 410.00 15.00 Tm\n(Sanremo - Piazza C. Colombo 4) Tj\n';

  // LINEA COPYRIGHT B-SPORTLAB
  s += '0.45 0.5 0.55 rg\n/F1 6.5 Tf\n1 0 0 1 40.00 8.00 Tm\n(Copyright \\(c\\) 2026 B-sportlab di Federico Baldassarre. Tutti i diritti riservati - Biologo Nutrizionista Sportivo) Tj\n';
  s += 'ET\n';

  let imgBinaryStr = '';
  if (hasLogo) {
    for (let i = 0; i < logoBytes.length; i++) {
      imgBinaryStr += String.fromCharCode(logoBytes[i]);
    }
  }

  const f1Id = 5;
  const f2Id = 6;
  const imgId = hasLogo ? 7 : null;
  const maxObjId = hasLogo ? 7 : 6;
  const resXObject = hasLogo ? ` /XObject << /Im1 ${imgId} 0 R >>` : '';

  const offsets = [];
  let pdf = '%PDF-1.4\n';

  offsets.push(pdf.length);
  pdf += '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';

  offsets.push(pdf.length);
  pdf += '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';

  offsets.push(pdf.length);
  pdf += `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << /Font << /F1 ${f1Id} 0 R /F2 ${f2Id} 0 R >>${resXObject} >> >>\nendobj\n`;

  offsets.push(pdf.length);
  pdf += `4 0 obj\n<< /Length ${s.length} >>\nstream\n${s}endstream\nendobj\n`;

  offsets.push(pdf.length);
  pdf += `${f1Id} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n`;

  offsets.push(pdf.length);
  pdf += `${f2Id} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n`;

  if (hasLogo) {
    offsets.push(pdf.length);
    pdf += `${imgId} 0 obj\n<< /Type /XObject /Subtype /Image /Width 120 /Height 120 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoBytes.length} >>\nstream\n${imgBinaryStr}\nendstream\nendobj\n`;
  }

  const xOff = pdf.length;
  pdf += `xref\n0 ${maxObjId + 1}\n0000000000 65535 f \r\n`;
  offsets.forEach((o) => {
    pdf += String(o).padStart(10, '0') + ' 00000 n \r\n';
  });
  pdf += `trailer\n<< /Size ${maxObjId + 1} /Root 1 0 R >>\nstartxref\n${xOff}\n%%EOF\n`;

  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) {
    bytes[i] = pdf.charCodeAt(i) & 0xff;
  }
  return bytes;
}

// ─── TAB COMPOSIZIONE CORPOREA (MODELLO FITCOMPX) ───────────────────────────
export function ComposizioneCorporeaTab({ paziente, lang = 'it' }) {
  const norm = M.normalizePaziente(paziente);
  const visite = norm.visite_antropometriche || [];
  const ultima = visite.length > 0 ? visite[visite.length - 1] : null;
  const res = ultima?.risultati || {};

  const [downloading, setDownloading] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState('');
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState('');
  const [pdfFilename, setPdfFilename] = useState('');

  const handleDownloadAntropoPdf = async () => {
    if (!ultima || !res.grasso) return;
    try {
      setDownloading(true);
      setDownloadMsg("Generazione referto antropometrico PDF in corso...");
      const pdfBytes = buildAntropoPdfData({ norm, visit: ultima, lang });
      const filename = `Referto_Antropometria_${(norm.codice || 'Bsportlab').replace(/[^a-zA-Z0-9_-]/g, '_')}_${(ultima.data || 'visita').replace(/\//g, '-')}.pdf`;
      setPdfFilename(filename);

      if (Platform.OS !== "web" || typeof window === "undefined" || typeof document === "undefined") {
        const b64 = bytesToBase64(pdfBytes);
        const dataUri = `data:application/pdf;base64,${b64}`;
        setPdfDownloadUrl(dataUri);

        try {
          if (Platform.OS === "ios") {
            await Share.share({ url: dataUri, title: filename });
            setDownloadMsg("✅ Referto PDF pronto nella schermata di visualizzazione/salvataggio!");
          } else {
            try {
              await Share.share({ title: filename, message: filename, url: dataUri });
              setDownloadMsg("✅ Referto PDF pronto!");
            } catch (shareErr) {
              await Linking.openURL(dataUri);
              setDownloadMsg("✅ Referto PDF aperto!");
            }
          }
        } catch (sharePdfErr) {
          console.warn("Share PDF nativo:", sharePdfErr);
          setDownloadMsg("✅ PDF generato! Tocca il pulsante verde qui sotto per aprirlo.");
        }
        setTimeout(() => setDownloadMsg(""), 8000);
        return;
      }

      // Web
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfDownloadUrl(url);

      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          if (document.body.contains(a)) document.body.removeChild(a);
        }, 2000);
      } catch (clickErr) {
        console.warn("Download web bloccato:", clickErr);
      }
      setDownloadMsg("✅ Referto PDF generato con successo!");
      setTimeout(() => setDownloadMsg(""), 12000);
    } catch (err) {
      console.error("Errore creazione PDF antropometria:", err);
      setDownloadMsg(`❌ Errore creazione PDF: ${err?.message || "Riprova"}`);
    } finally {
      setDownloading(false);
    }
  };

  if (!ultima || !res.grasso) {
    return (
      <View style={s.card}>
        <Text style={[s.bold, { fontSize: 15, color: '#0F172A', marginBottom: 6 }]}>
          📊 Composizione Corporea
        </Text>
        <Text style={[s.txt, { color: '#64748B' }]}>
          Nessuna rilevazione antropometrica registrata per il tuo profilo.
        </Text>
      </View>
    );
  }

  const p = COLORBLIND_PALETTE;

  return (
    <View style={{ marginBottom: 20 }}>
      <View style={[s.card, { borderWidth: 1.5, borderColor: '#0284C7', backgroundColor: '#FFFFFF' }]}>
        <View style={s.rowBet}>
          <View>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>
              📊 Composizione Corporea
            </Text>
            <Text style={{ fontSize: 12, color: '#64748B' }}>
              Analisi rilevata il {ultima.data} • {res.peso} kg • {res.altezza} cm
            </Text>
          </View>
          <View style={{ backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#0369A1' }}>
              BMI {res.bmi}
            </Text>
          </View>
        </View>

        {/* Barra Grafica a 4 Compartimenti Accessibile per Daltonismo */}
        <View style={{ marginTop: 14 }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#334155', marginBottom: 6 }}>
            Ripartizione a 4 Compartimenti (Totale 100%):
          </Text>
          <View style={{ height: 32, flexDirection: 'row', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#CBD5E1' }}>
            <View style={{ flex: res.muscolo.pct, backgroundColor: p.muscolo.bg, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: p.muscolo.text, fontSize: 11, fontWeight: 'bold' }}>{res.muscolo.pct}%</Text>
            </View>
            <View style={{ flex: res.grasso.pct, backgroundColor: p.grasso.bg, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: p.grasso.text, fontSize: 11, fontWeight: 'bold' }}>{res.grasso.pct}%</Text>
            </View>
            <View style={{ flex: res.ossa.pct, backgroundColor: p.ossa.bg, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: p.ossa.text, fontSize: 11, fontWeight: 'bold' }}>{res.ossa.pct}%</Text>
            </View>
            <View style={{ flex: res.altro.pct, backgroundColor: p.altro.bg, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: p.altro.text, fontSize: 11, fontWeight: 'bold' }}>{res.altro.pct}%</Text>
            </View>
          </View>

          {/* Legenda con icone e kg */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: p.muscolo.light, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
              <Text>{p.muscolo.icon}</Text>
              <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: p.muscolo.darkText }}>
                {p.muscolo.label}: {res.muscolo.kg} kg ({res.muscolo.pct}%)
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: p.grasso.light, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
              <Text>{p.grasso.icon}</Text>
              <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: p.grasso.darkText }}>
                {p.grasso.label}: {res.grasso.kg} kg ({res.grasso.pct}%)
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: p.ossa.light, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
              <Text>{p.ossa.icon}</Text>
              <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: p.ossa.darkText }}>
                {p.ossa.label}: {res.ossa.kg} kg ({res.ossa.pct}%)
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: p.altro.light, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
              <Text>{p.altro.icon}</Text>
              <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: p.altro.darkText }}>
                {p.altro.label}: {res.altro.kg} kg ({res.altro.pct}%)
              </Text>
            </View>
          </View>
        </View>

        {/* Metabolismo Basale & Densità Muscolare */}
        <View style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, marginTop: 14 }}>
          <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0F172A', marginBottom: 4 }}>
            🔥 Metabolismo Basale FITcompX: {res.metabolismo?.bmrFITcompX} kcal/giorno
          </Text>
          <Text style={{ fontSize: 12, color: '#475569', lineHeight: 17 }}>
            Fabbisogno metabolico a riposo stimato a <Text style={{ fontWeight: 'bold', color: '#166534' }}>{res.metabolismo?.bmrFITcompX} kcal</Text> (rispetto a {Math.round(res.metabolismo?.bmrHarrisBenedict || 0)} kcal standard), valorizzato dalla massa muscolare attiva ({res.muscolo?.suMassaMagraPct}% della massa magra).
          </Text>
        </View>

        {/* Storico Visite nel Tempo */}
        {visite.length > 1 ? (
          <View style={{ marginTop: 14 }}>
            <Text style={{ fontSize: 12.5, fontWeight: 'bold', color: '#0F172A', marginBottom: 6 }}>
              📈 Evoluzione Storica dei Controlli ({visite.length} visite):
            </Text>
            {visite.slice().reverse().map((v, vIdx) => {
              const vr = v.risultati || {};
              return (
                <View key={v.id || vIdx} style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 8, marginBottom: 6 }}>
                  <View style={s.rowBet}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0F172A' }}>📅 {v.data}</Text>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#475569' }}>{vr.peso} kg</Text>
                  </View>
                  <Text style={{ fontSize: 11.5, color: '#334155', marginTop: 2 }}>
                    Grasso: <Text style={{ fontWeight: 'bold', color: p.grasso.darkText }}>{vr.grasso?.pct}%</Text> ({vr.grasso?.kg}kg) • Muscolo: <Text style={{ fontWeight: 'bold', color: p.muscolo.darkText }}>{vr.muscolo?.pct}%</Text> ({vr.muscolo?.kg}kg) • BMR: {vr.metabolismo?.bmrFITcompX} kcal
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Diagnosi Clinica */}
        {res.diagnosi ? (
          <View style={{ backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#86EFAC', borderRadius: 10, padding: 12, marginTop: 14 }}>
            <Text style={{ fontSize: 12.5, fontWeight: 'bold', color: '#166534', marginBottom: 4 }}>
              🩺 Valutazione Clinica del Nutrizionista:
            </Text>
            <Text style={{ fontSize: 12, color: '#14532D', lineHeight: 17 }}>
              {res.diagnosi}
            </Text>
          </View>
        ) : null}

        {/* ─── TASTO DOWNLOAD REFERTO PDF COMPOSIZIONE CORPOREA ─── */}
        <View style={{ marginTop: 16 }}>
          <TouchableOpacity
            style={[
              s.btn,
              {
                backgroundColor: downloading ? '#94A3B8' : '#0284C7',
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              },
            ]}
            onPress={handleDownloadAntropoPdf}
            disabled={downloading}
          >
            <Text style={[s.btnTxt, { color: '#FFFFFF', fontWeight: 'bold' }]}>
              {downloading ? '⏳ Generazione Referto PDF...' : '📥 Scarica Referto Antropometrico (PDF)'}
            </Text>
          </TouchableOpacity>
        </View>

        {downloadMsg ? (
          <View style={{ marginTop: 8, padding: 8, backgroundColor: '#F0FDF4', borderRadius: 8 }}>
            <Text style={{ fontSize: 12, color: '#166534', textAlign: 'center' }}>{downloadMsg}</Text>
          </View>
        ) : null}

        {pdfDownloadUrl ? (
          <View style={{ marginTop: 8 }}>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: '#16A34A', paddingVertical: 10 }]}
              onPress={() => {
                if (typeof window !== 'undefined') {
                  const opened = window.open(pdfDownloadUrl, '_blank');
                  if (!opened) window.location.href = pdfDownloadUrl;
                } else {
                  Linking.openURL(pdfDownloadUrl).catch(console.warn);
                }
              }}
            >
              <Text style={[s.btnTxt, { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }]}>
                📄 Tocca qui per Aprire / Salvare il Referto PDF ({pdfFilename})
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ─── PROFILO TAB & DOWNLOAD DIRETTO PDF (3 PROFILI) ─────────────────────────
export function ProfileTab({
  paziente,
  daily,
  results = {},
  weekPlan = {},
  setWeekPlan,
  shopDay = "Lun",
  flt = [],
  setFlt,
  season,
  setSeason,
  bad,
  setBad,
  favs = [],
  setFavs,
  recipes = [],
  meal = "Colazione",
  setMeal,
  showMacro = true,
  onLogout,
  lang = "it",
  setLang,
  pesoOggi,
  setPesoOggi,
  handleSaveWeight,
  onDeleteWeight,
  pesoMsg,
  onOpenTour,
}) {
  const t = UI[lang] || UI.it;
  const norm = M.normalizePaziente(paziente);
  const peso = parseFloat(norm.peso_visita) || 70;
  const hasAntropo = Boolean(
    (norm.visite_antropometriche && norm.visite_antropometriche.length > 0) ||
    norm.ha_antropometria === true
  );
  const [profileSubTab, setProfileSubTab] = useState("menu"); // 'menu' | 'filtri' | 'preferiti'
  const [pdfDay, setPdfDay] = useState("ALL");
  const [downloading, setDownloading] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState("");
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState("");
  const [pdfFilename, setPdfFilename] = useState("");

  // Elenco giorni per export completo:
  // Se Atleta: tutti i giorni del microciclo
  // Se Fitness/Benessere o standard: tutti i 7 giorni della settimana
  const allTargetDays = useMemo(() => {
    if (norm.metodo === "ATLETA" && (norm.piano_dati?.giorni_atleta || []).length > 0) {
      return norm.piano_dati.giorni_atleta.map((g) => ({
        id: g.id,
        label: `${g.nome} (${g.data})`,
        dayKey: g.data,
        isAthlete: true,
        athleteDay: g,
      }));
    }
    return M.DAYS.map((d) => ({
      id: d,
      label: t.days[d]?.toUpperCase() || d,
      dayKey: d,
      isAthlete: false,
    }));
  }, [norm, t]);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    setDownloadMsg("");
    try {
      const filename = `Menu-Bsportlab-${norm.codice}${pdfDay === "ALL" ? "-Tutti-i-Giorni" : `-${pdfDay}`}.pdf`;
      setPdfFilename(filename);

      // Calcolo dati vettoriali PDF
      const pdfBytes = buildMenuPdfData({
        norm,
        allTargetDays,
        pdfDay,
        weekPlan,
        results,
        shopDay,
        daily,
        flt,
        lang,
      });

      // 1. App Nativa (iOS / Android in React Native o Expo Go)
      if (Platform.OS !== "web" || typeof window === "undefined" || typeof document === "undefined") {
        const b64 = bytesToBase64(pdfBytes);
        const dataUri = `data:application/pdf;base64,${b64}`;
        setPdfDownloadUrl(dataUri);

        try {
          if (Platform.OS === "ios") {
            await Share.share({
              url: dataUri,
              title: filename,
            });
            setDownloadMsg("✅ Menù PDF pronto nella schermata di visualizzazione/salvataggio!");
          } else {
            try {
              await Share.share({
                title: filename,
                message: filename,
                url: dataUri,
              });
              setDownloadMsg("✅ Menù PDF pronto!");
            } catch (shareErr) {
              await Linking.openURL(dataUri);
              setDownloadMsg("✅ Menù PDF aperto!");
            }
          }
        } catch (sharePdfErr) {
          console.warn("Share PDF nativo:", sharePdfErr);
          setDownloadMsg("✅ PDF generato! Tocca il pulsante verde qui sotto per aprirlo.");
        }
        setTimeout(() => setDownloadMsg(""), 8000);
        return;
      }

      // 2. Ambiente Web (Browser Desktop / Safari / Chrome / PWA)
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfDownloadUrl(url);

      // Download automatico standard del browser
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          if (document.body.contains(a)) document.body.removeChild(a);
        }, 2000);
      } catch (clickErr) {
        console.warn("Download automatico web bloccato:", clickErr);
      }

      setDownloadMsg("✅ PDF generato con successo! Se non si apre automaticamente, tocca il pulsante verde qui sotto.");
      setTimeout(() => setDownloadMsg(""), 12000);
    } catch (err) {
      console.error("Errore creazione PDF:", err);
      setDownloadMsg(`❌ Errore nella creazione del PDF: ${err?.message || "Riprova"}`);
    } finally {
      setDownloading(false);
    }
  };

  const profileBadge = {
    BENESSERE: { lbl: "🌱 Benessere", bg: "#DCFCE7", col: "#166534" },
    FITNESS: { lbl: "⚡ Fitness", bg: "#E0F2FE", col: "#0369A1" },
    ATLETA: { lbl: "🔥 Atleta", bg: "#FEE2E2", col: "#991B1B" },
  }[norm.metodo] || { lbl: norm.metodo, bg: "#F1F5F9", col: "#334155" };

  const mealIcons = { Colazione: "🥞", Pranzo: "🥗", Merenda: "🥪", Cena: "🍽️" };

  const renderSingleMealCard = (m, it) => {
    if (!it) {
      return (
        <View key={m} style={{ marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderColor: "#F1F5F9" }}>
          <Text style={[s.bold, { color: "#0F172A" }]}>{mealIcons[m] || "🍽️"} {m.toUpperCase()}</Text>
          <Text style={[s.txt, { fontStyle: "italic", color: "#94A3B8" }]}>Da selezionare nel piano pasti.</Text>
        </View>
      );
    }

    const trRec = trRecipeText(it, lang);
    const dosi = [];
    if (it.gP > 0) dosi.push(`${it.gP}g ${trFood(M.fmtName(it.nomeP, flt), lang)}`);
    if (it.gC > 0) dosi.push(`${it.gC}g ${trFood(M.fmtName(it.nomeC, flt), lang)}`);
    if (it.gF > 0) dosi.push(`${it.gF}g ${trFood(M.fmtName(it.nomeF, flt), lang)}`);
    if (it.gV > 10) dosi.push(`${it.gV}g ${trFood(M.fmtName(it.nomeV, flt), lang)}`);

    return (
      <View
        key={m}
        style={{
          backgroundColor: "#FAFAFA",
          borderWidth: 1,
          borderColor: "#E2E8F0",
          borderRadius: 8,
          padding: 10,
          marginBottom: 10,
        }}
      >
        <View style={s.rowBet}>
          <Text style={[s.bold, { color: "#0F172A", fontSize: 14 }]}>
            {mealIcons[m] || "🍽️"} {m.toUpperCase()}: {trRec.title}
          </Text>
        </View>

        <Text style={[s.txt, { marginTop: 4, color: "#0F172A" }]}>
          <Text style={s.bTxt}>Dosi da pesare (a crudo): </Text>
          {dosi.length > 0 ? dosi.join(", ") : "Come da indicazioni"}.
        </Text>

        {trRec.steps ? (
          <Text style={[s.txt, { fontSize: 12, color: "#64748B", marginTop: 4 }]}>
            💡 {trRec.steps}
          </Text>
        ) : null}
      </View>
    );
  };

  return (
    <View style={{ marginBottom: 40 }}>
      {/* ─── SCHEDA HEADER PROFILO CON DATI E CAMBIO LINGUA ─── */}
      <View
        style={[
          s.card,
          {
            padding: 14,
            marginBottom: 14,
            borderLeftWidth: 4,
            borderLeftColor: "#0F172A",
          },
        ]}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
          <View style={{ flex: 1, minWidth: 160 }}>
            <Text style={[s.bold, { fontSize: 16, color: "#0F172A" }]}>
              {nomePaziente ? `${nomePaziente} (${norm.codice})` : `${t.patientLbl || "Paziente"}: ${norm.codice}`}
            </Text>
            <Text style={[s.txt, { color: "#64748B", marginTop: 2 }]}>
              Peso Visita: {peso} kg • Data: {M.formatDateDMY(new Date())}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: profileBadge.bg,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 8,
              alignSelf: "flex-start",
              flexShrink: 0,
            }}
          >
            <Text style={{ fontWeight: "bold", fontSize: 12, color: profileBadge.col }}>
              {profileBadge.lbl}
            </Text>
          </View>
        </View>

        {/* Selettore Lingua nel Profilo */}
        {setLang ? (
          <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderColor: "#F1F5F9" }}>
            <Text style={[s.lbl, { fontSize: 11, marginBottom: 6, color: "#64748B" }]}>
              🌐 {lang === "en" ? "App Language" : lang === "fr" ? "Langue de l'app" : "Lingua Applicazione"}:
            </Text>
            <View style={{ flexDirection: "row", gap: 6 }}>
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
                      borderColor: active ? "#0F172A" : "#E2E8F0",
                      backgroundColor: active ? "#0F172A" : "#F8FAFC",
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "bold", color: active ? "#FFFFFF" : "#475569" }}>
                      {lbl}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>

      {/* ─── SUB-NAV: Scheda & PDF | Filtri & Dieta | Preferiti ─── */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#F1F5F9",
          borderRadius: 10,
          padding: 4,
          marginBottom: 16,
          gap: 4,
        }}
      >
        {[
          ["menu", "📋 Scheda & PDF"],
          ...(hasAntropo ? [["antropo", "📊 Composizione Corporea"]] : []),
          ["peso", t.tabWeightSub || "⚖️ Diario Peso"],
          ["filtri", "⚙️ Filtri & Dieta"],
          ["preferiti", `❤️ Preferiti (${(favs || []).length})`],
        ].map(([subKey, subLbl]) => {
          const isAct = profileSubTab === subKey;
          return (
            <TouchableOpacity
              key={subKey}
              onPress={() => setProfileSubTab(subKey)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: isAct ? "#FFFFFF" : "transparent",
                alignItems: "center",
                borderWidth: isAct ? 1 : 0,
                borderColor: isAct ? "#CBD5E1" : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: isAct ? "bold" : "600",
                  color: isAct ? "#0F172A" : "#64748B",
                }}
              >
                {subLbl}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ─── CONTENUTO SUB-TAB: DIARIO PESO ─── */}
      {profileSubTab === "peso" ? (
        <WeightTab
          paziente={norm}
          pesoOggi={pesoOggi}
          setPesoOggi={setPesoOggi}
          handleSaveWeight={handleSaveWeight}
          onDeleteWeight={onDeleteWeight}
          pesoMsg={pesoMsg}
          lang={lang}
        />
      ) : null}

      {/* ─── CONTENUTO SUB-TAB: COMPOSIZIONE CORPOREA ─── */}
      {profileSubTab === "antropo" ? (
        <ComposizioneCorporeaTab paziente={norm} lang={lang} />
      ) : null}

      {/* ─── CONTENUTO SUB-TAB: FILTRI & DIETA ─── */}
      {profileSubTab === "filtri" ? (
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

      {profileSubTab === "preferiti" ? (
        <FavsTab
          recipes={recipes}
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

      {/* ─── CONTENUTO SUB-TAB: SCHEDA & PDF ─── */}
      {profileSubTab === "menu" ? (
        <View>
          <View style={s.rowBet}>
            <Text style={s.sec}>Menù & Salvataggio PDF</Text>
          </View>

      {/* Selettore Reattivo Giornate per il PDF */}
      <View style={{ marginBottom: 12 }}>
        <Text style={[s.lbl, { marginBottom: 4 }]}>Seleziona contenuto del PDF:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          <TouchableOpacity
            style={[s.chip, pdfDay === "ALL" && s.chipAct, { paddingVertical: 6, paddingHorizontal: 12 }]}
            onPress={() => setPdfDay("ALL")}
          >
            <Text style={[s.cTxt, pdfDay === "ALL" && s.cTxtAct, { fontWeight: "bold" }]}>
              📅 Tutti i Giorni ({allTargetDays.length})
            </Text>
          </TouchableOpacity>
          {allTargetDays.map((d) => {
            const dKey = d.dayKey || d.id;
            const hasMeals = Boolean(weekPlan?.[dKey] && Object.keys(weekPlan[dKey]).length > 0);
            const isToday = dKey === shopDay || d.id === shopDay;
            return (
              <TouchableOpacity
                key={d.id || dKey}
                style={[s.chip, pdfDay === dKey && s.chipAct, { paddingVertical: 6, paddingHorizontal: 10 }]}
                onPress={() => setPdfDay(dKey)}
              >
                <Text style={[s.cTxt, pdfDay === dKey && s.cTxtAct]}>
                  {isToday ? `⭐ ${d.shortLabel || d.label || dKey}` : (d.shortLabel || d.label || dKey)} {hasMeals ? "✓" : ""}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Pulsante Download Diretto PDF */}
      <View style={{ marginBottom: 14 }}>
        <TouchableOpacity
          style={[
            s.sBtn,
            {
              backgroundColor: "#0F172A",
              borderColor: "#0F172A",
              paddingVertical: 14,
              marginTop: 0,
              marginBottom: 4,
            },
          ]}
          onPress={handleDownloadPdf}
          disabled={downloading}
        >
          <Text style={[s.sBtnTxt, { color: "#FFFFFF", fontSize: 13, fontWeight: "bold" }]}>
            {downloading ? "⏳ Generazione PDF in corso..." : "📥 Salva Menù in PDF"}
          </Text>
        </TouchableOpacity>

        {pdfDownloadUrl ? (
          <TouchableOpacity
            style={{
              backgroundColor: "#166534",
              borderColor: "#15803D",
              borderWidth: 1,
              borderRadius: 8,
              paddingVertical: 12,
              paddingHorizontal: 12,
              marginTop: 6,
              alignItems: "center",
            }}
            onPress={async () => {
              if (Platform.OS === "web" && typeof window !== "undefined") {
                const opened = window.open(pdfDownloadUrl, "_blank");
                if (!opened) {
                  window.location.href = pdfDownloadUrl;
                }
              } else {
                try {
                  await Share.share({
                    url: pdfDownloadUrl,
                    title: pdfFilename || "Menu-Bsportlab.pdf",
                    message: pdfFilename || "Menu-Bsportlab.pdf",
                  });
                } catch (e) {
                  Linking.openURL(pdfDownloadUrl).catch(console.warn);
                }
              }
            }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 12, textAlign: "center" }}>
              📄 Tocca qui per Aprire / Salvare il PDF ({pdfFilename})
            </Text>
          </TouchableOpacity>
        ) : null}

        
{downloadMsg ? (
          <View
            style={{
              backgroundColor: downloadMsg.startsWith("❌") ? "#FEE2E2" : "#DCFCE7",
              borderWidth: 1,
              borderColor: downloadMsg.startsWith("❌") ? "#EF4444" : "#86EFAC",
              borderRadius: 8,
              padding: 8,
              marginTop: 6,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: downloadMsg.startsWith("❌") ? "#991B1B" : "#166534",
                textAlign: "center",
              }}
            >
              {downloadMsg}
            </Text>
          </View>
        ) : null}
      </View>

      {/* SCHEDA CLINICA E MENÙ STAMPABILE CON ID PER CONVERSIONE DIRETTA IN PDF */}
      <View
        nativeID="b-sportlab-printable-sheet"
        id="b-sportlab-printable-sheet"
        style={[
          s.card,
          {
            borderWidth: 2,
            borderColor: "#0F172A",
            padding: 16,
            backgroundColor: "#FFFFFF",
          },
        ]}
      >
        {/* Header Clinico */}
        <View
          style={{
            borderBottomWidth: 2,
            borderColor: "#0F172A",
            paddingBottom: 10,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "900", color: "#0F172A" }}>
            B-SPORTLAB
          </Text>
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#475569" }}>
            Dr. Federico Baldassarre • Biologo Nutrizionista Sportivo
          </Text>
        </View>

        {/* Dati Paziente & Profilo (anti-overflow con flexWrap) */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <View style={{ flex: 1, minWidth: 160 }}>
            <Text style={[s.bold, { fontSize: 16 }]}>Paziente: {norm.codice}</Text>
            <Text style={s.txt}>Peso Visita: {peso} kg • Data: {M.formatDateDMY(new Date())}</Text>
          </View>
          <View
            style={{
              backgroundColor: profileBadge.bg,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 8,
              alignSelf: "flex-start",
              flexShrink: 0,
            }}
          >
            <Text style={{ fontWeight: "bold", fontSize: 12, color: profileBadge.col }}>
              {profileBadge.lbl}
            </Text>
          </View>
        </View>

        {/* Idratazione & Stile di Vita */}
        <View
          style={{
            backgroundColor: "#F8FAFC",
            borderWidth: 1,
            borderColor: "#E2E8F0",
            borderRadius: 8,
            padding: 10,
            marginBottom: 14,
          }}
        >
          <Text style={[s.bold, { color: "#0F172A" }]}>
            💧 Idratazione Consigliata: {daily?.waterLiters || "2.2"} Litri al giorno
          </Text>
          {norm.metodo === "BENESSERE" ? (
            <Text style={[s.txt, { color: "#166534", fontWeight: "bold", marginTop: 2 }]}>
              🎯 Obiettivo Passi: {norm.passi_target} passi al giorno
            </Text>
          ) : null}
        </View>

        {/* ─── IL MENÙ DEI PASTI REATTIVO (TUTTI I GIORNI O GIORNATA SINGOLA) ─── */}
        {pdfDay === "ALL" ? (
          allTargetDays.map((target) => (
            <View key={target.id} style={{ marginBottom: 18, borderBottomWidth: 1.5, borderColor: "#CBD5E1", paddingBottom: 12 }}>
              <Text style={[s.bold, { fontSize: 15, color: "#0F172A", marginBottom: 8 }]}>
                📅 {target.label}
              </Text>
              {M.MEALS.map((m) => {
                const it = weekPlan?.[target.dayKey]?.[m] || results?.[m]?.[0] || null;
                return renderSingleMealCard(m, it);
              })}
              {target.isAthlete && target.athleteDay && Number(target.athleteDay.kj) > 0 ? (
                <View style={{ marginTop: 6, padding: 8, backgroundColor: "#F0FDF4", borderRadius: 6, borderWidth: 1, borderColor: "#BBF7D0" }}>
                  <Text style={[s.bold, { color: "#166534", fontSize: 12 }]}>⚡ Peri-Workout della Giornata:</Text>
                  <Text style={[s.txt, { fontSize: 12, color: "#15803D" }]}>
                    • Borraccia Intra: {Math.round((Number(target.athleteDay.intra?.ore) || 0) * (Number(target.athleteDay.intra?.gh_carbo) || 0))}g Carbo ({target.athleteDay.intra?.nome || "Maltodestrine/Gel"})
                  </Text>
                  <Text style={[s.txt, { fontSize: 12, color: "#15803D" }]}>
                    • Shaker Post: {target.athleteDay.recovery?.nome || "Recovery Shake"} entro 30 min.
                  </Text>
                </View>
              ) : null}
            </View>
          ))
        ) : (
          <View>
            <Text style={[s.bold, { fontSize: 16, color: "#0F172A", marginBottom: 10, borderBottomWidth: 1, borderColor: "#CBD5E1", paddingBottom: 4 }]}>
              🍽️ MENÙ DEI PASTI {pdfDay !== "OGGI" ? `(${t.days[pdfDay] || pdfDay})` : ""}
            </Text>
            {M.MEALS.map((m) => {
              const it = pdfDay === "OGGI"
                ? (results?.[m]?.[0] || weekPlan?.[shopDay]?.[m] || null)
                : (weekPlan?.[pdfDay]?.[m] || results?.[m]?.[0] || null);
              return renderSingleMealCard(m, it);
            })}
          </View>
        )}

        {/* ─── STRATEGIA PERI-WORKOUT (SE ALLENAMENTO) ───────────────────── */}
        {daily?.hasWorkout && (daily.intraC > 0 || daily.postNome) ? (
          <View style={{ marginTop: 8, marginBottom: 12, padding: 10, backgroundColor: "#F0FDF4", borderRadius: 8, borderWidth: 1, borderColor: "#86EFAC" }}>
            <Text style={[s.bold, { color: "#166534", fontSize: 14, marginBottom: 4 }]}>
              ⚡ STRATEGIA PERI-WORKOUT
            </Text>
            {daily.intraC > 0 ? (
              <Text style={[s.txt, { color: "#15803D", fontSize: 13, marginBottom: 3 }]}>
                🍶 <Text style={s.bTxt}>Durante l’allenamento: </Text>
                {daily.intraC}g carboidrati ({daily.intraNome || "Maltodestrine / Gel"}) sciolti in borraccia con acqua.
              </Text>
            ) : null}
            {daily.postNome ? (
              <Text style={[s.txt, { color: "#15803D", fontSize: 13 }]}>
                🥤 <Text style={s.bTxt}>Post-Workout Immediato: </Text>
                {daily.postNome}: assumere entro 30 minuti dal termine dell’attività.
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* ─── PROTOCOLLO INTEGRATORI ───────────────────────────────────── */}
        <View style={{ marginTop: 6, borderTopWidth: 1, borderColor: "#CBD5E1", paddingTop: 10 }}>
          <Text style={[s.bold, { fontSize: 14, marginBottom: 6 }]}>
            💊 Protocollo Integrazione:
          </Text>
          {norm.integratori && norm.integratori.length > 0 ? (
            norm.integratori.map((it) => {
              const mEntry = M.MOMENTI_INTEGRATORI.find((m) => (Array.isArray(m) ? m[0] === it.momento : m.id === it.momento));
              const mLabel = Array.isArray(mEntry) ? mEntry[1] : (mEntry?.label || it.momento);
              return (
                <Text key={it.id} style={[s.txt, { fontSize: 12, marginBottom: 3 }]}>
                  • <Text style={s.bTxt}>[{mLabel}]</Text> {it.nome} ({it.dose || it.dosaggio || "standard"})
                  {it.note ? ` - ${it.note}` : ""}
                </Text>
              );
            })
          ) : (
            <Text style={[s.txt, { fontStyle: "italic", fontSize: 12 }]}>
              Nessun integratore prescritto.
            </Text>
          )}
        </View>

        {/* ─── NOTE DEL NUTRIZIONISTA ───────────────────────────────────── */}
        {norm.note_dottore && norm.mostra_note_dottore !== false ? (
          <View style={{ marginTop: 10, borderTopWidth: 1, borderColor: "#CBD5E1", paddingTop: 10 }}>
            <Text style={[s.bold, { fontSize: 14, marginBottom: 4 }]}>
              Note & Indicazioni del Dottore:
            </Text>
            <Text style={[s.txt, { fontSize: 12, color: "#334155" }]}>
              {norm.note_dottore}
            </Text>
          </View>
        ) : null}
      </View>
        </View>
      ) : null}

      {/* ─── TASTO RIVEDI IL TOUR GUIDATO ─── */}
      {onOpenTour ? (
        <View style={{ marginTop: 14 }}>
          <TouchableOpacity
            onPress={onOpenTour}
            style={{
              backgroundColor: "#F8FAFC",
              borderWidth: 1,
              borderColor: "#CBD5E1",
              borderRadius: 10,
              paddingVertical: 12,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "bold", color: "#334155" }}>
              🎓 Rivedi il Tour Guidato dell’App
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ─── COPYRIGHT & RISERVATEZZA ─── */}
      <View style={{ marginTop: 20, marginBottom: 8, alignItems: "center" }}>
        <Text style={{ fontSize: 11, color: "#94A3B8", textAlign: "center" }}>
          © 2026 B-sportlab di Federico Baldassarre. Tutti i diritti riservati.{'\n'}
          Software e contenuti protetti da copyright.
        </Text>
      </View>

      {/* ─── PULSANTE LOGOUT ─── */}
      {onLogout ? (
        <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderColor: "#E2E8F0" }}>
          <TouchableOpacity
            onPress={onLogout}
            style={{
              backgroundColor: "#FFF1F2",
              borderWidth: 1,
              borderColor: "#FECDD3",
              borderRadius: 10,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#BE123C", fontWeight: "bold", fontSize: 13 }}>
              🚪 {t.exitBtn || "Esci dall'Account"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

// ─── 1. VISTA COMPONI PIATTO SEMPLICE ───────────────────────────────────────
export function ComponiPiattoView({
  daily,
  flt = [],
  bad = [],
  isFixedMode = false,
  consumedItems = {},
  onToggleConsumed,
  lang = 'it',
}) {
  const t = UI[lang] || UI.it;
  const plateMeals = useMemo(() => {
    return M.buildComponiPiattoMeals(daily, flt, bad);
  }, [daily, flt, bad]);

  const [expandedCats, setExpandedCats] = useState({});

  const toggleExpand = (key) => {
    setExpandedCats((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const mealIcons = {
    Colazione: '🌅',
    Pranzo: '☀️',
    Merenda: '🍎',
    Cena: '🌙',
  };

  const renderPlateItem = (m, item, isPrimary = true) => {
    const isChecked = Boolean(consumedItems[`${m}_${item.id}`]);
    const shortCooked = item.cookedLabel ? item.cookedLabel.split('/')[0].split('(')[0].trim() : 'cotto';
    return (
      <TouchableOpacity
        key={item.id}
        disabled={isFixedMode}
        onPress={() => onToggleConsumed && onToggleConsumed(m, item.id, item)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 7,
          paddingHorizontal: 10,
          borderRadius: 8,
          backgroundColor: isChecked ? '#DCFCE7' : (isPrimary ? '#FFFFFF' : '#FFFDF5'),
          marginBottom: 4,
          borderWidth: 1,
          borderColor: isChecked ? '#16A34A' : (isPrimary ? '#E2E8F0' : '#FDE68A'),
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, marginRight: 8 }}>
          {!isFixedMode ? (
            <Text style={{ fontSize: 16 }}>{isChecked ? '☑️' : '⚪'}</Text>
          ) : (
            <Text style={{ color: '#64748B', fontSize: 14 }}>•</Text>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 13.5, fontWeight: '700', color: '#0F172A' }}>
              {item.nome}
            </Text>
            {item.servingUnit ? (
              <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                {item.servingUnit}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={{ alignItems: 'flex-end', flexShrink: 0, minWidth: 64 }}>
          <View style={{ backgroundColor: isChecked ? '#BBF7D0' : '#F1F5F9', paddingVertical: 2, paddingHorizontal: 7, borderRadius: 5 }}>
            <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#0F172A' }}>
              {item.gCrudo}g{item.isCookable ? <Text style={{ fontSize: 11, fontWeight: '500', color: '#475569' }}> crudo</Text> : null}
            </Text>
          </View>
          {item.isCookable && item.gCotto !== item.gCrudo ? (
            <Text style={{ fontSize: 11, color: '#0284C7', fontWeight: '600', marginTop: 2 }}>
              ~{item.gCotto}g {shortCooked}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ marginBottom: 20 }}>
      {M.MEALS.map((m) => {
        const mealData = plateMeals[m];
        if (!mealData) return null;
        const target = mealData.target || {};
        const isPeri = mealData.isPeriWorkout;

        return (
          <View
            key={m}
            style={[
              s.card,
              {
                borderWidth: isPeri ? 2 : 1,
                borderColor: isPeri ? '#F59E0B' : '#E2E8F0',
                marginBottom: 16,
              },
            ]}
          >
            {/* Intestazione Pasto */}
            <View style={s.rowBet}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 18 }}>{mealIcons[m] || '🍽️'}</Text>
                <Text style={[s.sec, { fontSize: 16, marginBottom: 0 }]}>{m.toUpperCase()}</Text>
              </View>
              <View style={{ backgroundColor: '#F1F5F9', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#334155' }}>
                  P {target.p}g | C {target.c}g | G {target.f}g
                </Text>
              </View>
            </View>

            {/* Banner Peri-Workout per Atleta se applicabile */}
            {isPeri ? (
              <View
                style={{
                  backgroundColor: '#FEF3C7',
                  borderWidth: 1,
                  borderColor: '#F59E0B',
                  borderRadius: 6,
                  padding: 6,
                  marginTop: 8,
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#B45309', textAlign: 'center' }}>
                  ⚡ Pasto Peri-Workout (Target carboidrati strategico ~2.0 g/kg)
                </Text>
              </View>
            ) : null}

            {/* 1. CARBOIDRATI */}
            {mealData.carbo?.primary?.length > 0 ? (
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 12.5, fontWeight: 'bold', color: '#B45309', marginBottom: 5 }}>
                  🌾 CARBOIDRATI (scegli 1 opzione):
                </Text>
                {mealData.carbo.primary.map((item) => renderPlateItem(m, item, true))}

                {/* Espansione Altre Alternative */}
                {mealData.carbo.alternatives.length > 0 ? (
                  <View style={{ marginTop: 3 }}>
                    <TouchableOpacity
                      onPress={() => toggleExpand(`${m}_C`)}
                      style={{ paddingVertical: 4, paddingHorizontal: 4 }}
                    >
                      <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#D97706' }}>
                        {expandedCats[`${m}_C`] ? (t.hideAltsBtn || '▲ Nascondi alternative') : `+ ${t.showAltsBtn || 'Altre alternative'} (${mealData.carbo.alternatives.length})`}
                      </Text>
                    </TouchableOpacity>
                    {expandedCats[`${m}_C`] ? (
                      <View style={{ backgroundColor: '#FFFBEB', padding: 6, borderRadius: 8, marginTop: 4 }}>
                        {mealData.carbo.alternatives.map((item) => renderPlateItem(m, item, false))}
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* 2. PROTEINE */}
            {mealData.protein?.primary?.length > 0 ? (
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 12.5, fontWeight: 'bold', color: '#1E40AF', marginBottom: 5 }}>
                  🥩 PROTEINE (scegli 1 opzione):
                </Text>
                {mealData.protein.primary.map((item) => renderPlateItem(m, item, true))}

                {/* Espansione Altre Alternative */}
                {mealData.protein.alternatives.length > 0 ? (
                  <View style={{ marginTop: 3 }}>
                    <TouchableOpacity
                      onPress={() => toggleExpand(`${m}_P`)}
                      style={{ paddingVertical: 4, paddingHorizontal: 4 }}
                    >
                      <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#2563EB' }}>
                        {expandedCats[`${m}_P`] ? (t.hideAltsBtn || '▲ Nascondi alternative') : `+ ${t.showAltsBtn || 'Altre alternative'} (${mealData.protein.alternatives.length})`}
                      </Text>
                    </TouchableOpacity>
                    {expandedCats[`${m}_P`] ? (
                      <View style={{ backgroundColor: '#EFF6FF', padding: 6, borderRadius: 8, marginTop: 4 }}>
                        {mealData.protein.alternatives.map((item) => renderPlateItem(m, item, false))}
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* 3. GRASSI BUONI / CONDIMENTO */}
            {mealData.fat?.primary?.length > 0 ? (
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 12.5, fontWeight: 'bold', color: '#15803D', marginBottom: 5 }}>
                  🫒 GRASSI BUONI (condimento / spuntino):
                </Text>
                {mealData.fat.primary.map((item) => renderPlateItem(m, item, true))}

                {/* Espansione Altre Alternative */}
                {mealData.fat.alternatives.length > 0 ? (
                  <View style={{ marginTop: 3 }}>
                    <TouchableOpacity
                      onPress={() => toggleExpand(`${m}_F`)}
                      style={{ paddingVertical: 4, paddingHorizontal: 4 }}
                    >
                      <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#16A34A' }}>
                        {expandedCats[`${m}_F`] ? (t.hideAltsBtn || '▲ Nascondi alternative') : `+ ${t.showAltsBtn || 'Altre alternative'} (${mealData.fat.alternatives.length})`}
                      </Text>
                    </TouchableOpacity>
                    {expandedCats[`${m}_F`] ? (
                      <View style={{ backgroundColor: '#F0FDF4', padding: 6, borderRadius: 8, marginTop: 4 }}>
                        {mealData.fat.alternatives.map((item) => renderPlateItem(m, item, false))}
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* 4. VERDURE (Pranzo e Cena) */}
            {mealData.veggies?.primary?.length > 0 ? (
              <View style={{ marginTop: 10, backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0F172A', marginBottom: 2 }}>
                  🥗 VERDURE A PIACERE:
                </Text>
                <Text style={{ fontSize: 11.5, color: '#334155' }}>
                  ~200g o libera assunzione a crudo o al vapore (zucchine, insalata mista, finocchi, pomodori, spinaci).
                </Text>
              </View>
            ) : null}

            {/* 5. FRUTTA FRESCA (Colazione e Merenda) */}
            {mealData.fruits?.primary?.length > 0 ? (
              <View style={{ marginTop: 10, backgroundColor: '#FFFDF5', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FDE68A' }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#B45309', marginBottom: 2 }}>
                  🍎 FRUTTA FRESCA DI STAGIONE:
                </Text>
                <Text style={{ fontSize: 11.5, color: '#78350F' }}>
                  ~150g (1 mela, banana o arancia media, oppure frutti di bosco).
                </Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export function DiarioLiberoView({
  daily,
  diaryEntries = {},
  onAddEntry,
  onRemoveEntry,
  consumedPlateItems = {},
  weekPlan = {},
  shopDay = 'Lun',
  flt = [],
  bad = [],
  lang = 'it',
}) {
  const t = UI[lang] || UI.it;
  const [activeMealSearch, setActiveMealSearch] = useState(null);
  const [query, setQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);
  const [gramsInput, setGramsInput] = useState('100');
  const [isCookedChoice, setIsCookedChoice] = useState(false);

  // Pasti scelti dal Ricettario nella giornata attiva (memoizzato per stabilità dei riferimenti di useMemo)
  const todayRecipes = useMemo(() => {
    return weekPlan?.[shopDay] || {};
  }, [weekPlan, shopDay]);

  // Calcolo totale macro consumati
  const consumedTotals = useMemo(() => {
    let kcal = 0;
    let p = 0;
    let c = 0;
    let f = 0;

    // 1. Voci inserite manualmente nel diario
    Object.values(diaryEntries || {}).forEach((entries) => {
      (entries || []).forEach((entry) => {
        kcal += entry.kcal || 0;
        p += entry.p || 0;
        c += entry.c || 0;
        f += entry.f || 0;
      });
    });

    // 2. Voci spuntate da Componi Piatto
    Object.values(consumedPlateItems || {}).forEach((item) => {
      if (item && item.kcal) {
        kcal += item.kcal || 0;
        p += item.p || 0;
        c += item.c || 0;
        f += item.f || 0;
      }
    });

    // 3. Voci scelte dal Ricettario per oggi (se il pasto non è già coperto da diario o piatto)
    Object.entries(todayRecipes).forEach(([mealKey, recipe]) => {
      if (!recipe) return;
      const hasDiary = (diaryEntries[mealKey] || []).length > 0;
      const hasPlate = Object.values(consumedPlateItems || {}).some((it) => it.meal === mealKey);
      if (!hasDiary && !hasPlate) {
        kcal += recipe.kcal || 0;
        p += recipe.gP || 0;
        c += recipe.gC || 0;
        f += recipe.gF || 0;
      }
    });

    return {
      kcal: Math.round(kcal),
      p: Math.round(p),
      c: Math.round(c),
      f: Math.round(f),
    };
  }, [diaryEntries, consumedPlateItems, todayRecipes]);

  const targetKcal = daily?.kcalGiorno || 2000;
  const targetP = daily?.totP || 140;
  const targetC = daily?.totC || 200;
  const targetF = daily?.totF || 60;

  const remKcal = Math.max(0, targetKcal - consumedTotals.kcal);
  const remP = Math.max(0, targetP - consumedTotals.p);
  const remC = Math.max(0, targetC - consumedTotals.c);
  const remF = Math.max(0, targetF - consumedTotals.f);

  const searchResults = useMemo(() => {
    if (!query || query.trim().length < 2) return [];
    return searchAlimenti(query, {
      glutenFree: flt.includes('gf'),
      dairyFree: flt.includes('lf'),
      vegetarian: flt.includes('veg'),
    });
  }, [query, flt]);

  const handleConfirmAdd = () => {
    if (!selectedFood || !activeMealSearch) return;
    const gNum = parseFloat(String(gramsInput).replace(',', '.')) || 100;
    const effectiveRawGrams = isCookedChoice && selectedFood.cookedRatio > 0
      ? Math.round(gNum / selectedFood.cookedRatio)
      : gNum;

    const entry = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      foodId: selectedFood.id,
      nome: selectedFood.nome,
      grams: gNum,
      isCooked: isCookedChoice,
      kcal: Math.round(((selectedFood.kcal || 0) * effectiveRawGrams) / 100),
      p: Math.round(((selectedFood.p || 0) * effectiveRawGrams) / 100),
      c: Math.round(((selectedFood.c || 0) * effectiveRawGrams) / 100),
      f: Math.round(((selectedFood.f || 0) * effectiveRawGrams) / 100),
    };

    onAddEntry && onAddEntry(activeMealSearch, entry);
    setSelectedFood(null);
    setQuery('');
    setGramsInput('100');
    setIsCookedChoice(false);
    setActiveMealSearch(null);
  };

  return (
    <View style={{ marginBottom: 20 }}>
      {/* ─── INDICATORE VISUALE TARGET & REMAINING MACRO ─────────────────────── */}
      <View style={[s.card, { backgroundColor: '#0F172A', borderColor: '#1E293B', padding: 14, marginBottom: 16 }]}>
        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
          🎯 {t.targetMacroLbl || 'Target Macro del Giorno'}
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
          <View>
            <Text style={{ fontSize: 26, fontWeight: '900', color: '#A3E635' }}>
              {remKcal} <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#CBD5E1' }}>kcal {t.remainingLbl || 'rimanenti'}</Text>
            </Text>
            <Text style={{ fontSize: 11, color: '#64748B' }}>
              Consumate: {consumedTotals.kcal} / {targetKcal} kcal
            </Text>
          </View>
        </View>

        {/* 3 Colonne Macro */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Proteine */}
          <View style={{ flex: 1, backgroundColor: '#1E293B', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#334155' }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#60A5FA', textTransform: 'uppercase' }}>Proteine</Text>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#FFFFFF', marginTop: 2 }}>{remP}g</Text>
            <Text style={{ fontSize: 9.5, color: '#94A3B8' }}>su {targetP}g</Text>
          </View>

          {/* Carboidrati */}
          <View style={{ flex: 1, backgroundColor: '#1E293B', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#334155' }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#FBBF24', textTransform: 'uppercase' }}>Carbo</Text>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#FFFFFF', marginTop: 2 }}>{remC}g</Text>
            <Text style={{ fontSize: 9.5, color: '#94A3B8' }}>su {targetC}g</Text>
          </View>

          {/* Grassi */}
          <View style={{ flex: 1, backgroundColor: '#1E293B', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#334155' }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#4ADE80', textTransform: 'uppercase' }}>Grassi</Text>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#FFFFFF', marginTop: 2 }}>{remF}g</Text>
            <Text style={{ fontSize: 9.5, color: '#94A3B8' }}>su {targetF}g</Text>
          </View>
        </View>
      </View>

      {/* ─── REGISTRAZIONE PASTI DEL GIORNO ─────────────────────────────────── */}
      {M.MEALS.map((m) => {
        const mealTarget = daily?.mealTargets?.[m] || { p: 30, c: 50, f: 15, isPeriWorkout: false };
        const mealTargetKcal = Math.round((mealTarget.c * 4) + (mealTarget.p * 4) + (mealTarget.f * 9));
        const isPeri = Boolean(mealTarget.isPeriWorkout);

        const entries = diaryEntries[m] || [];
        const plateConsumedForMeal = Object.values(consumedPlateItems || {}).filter((x) => x.meal === m);
        const recipeForMeal = todayRecipes[m];
        const isRecipeActive = Boolean(recipeForMeal && entries.length === 0 && plateConsumedForMeal.length === 0);

        let mKcal = 0, mP = 0, mC = 0, mF = 0;
        entries.forEach((e) => { mKcal += e.kcal || 0; mP += e.p || 0; mC += e.c || 0; mF += e.f || 0; });
        plateConsumedForMeal.forEach((p) => { mKcal += p.kcal || 0; mP += p.p || 0; mC += p.c || 0; mF += p.f || 0; });
        if (isRecipeActive && recipeForMeal) {
          mKcal += recipeForMeal.kcal || 0;
          mP += recipeForMeal.gP || 0;
          mC += recipeForMeal.gC || 0;
          mF += recipeForMeal.gF || 0;
        }

        const isOverC = m !== 'Cena' && mealTarget.c > 0 && mC > Math.round(mealTarget.c * 1.15);
        const isOverKcal = m !== 'Cena' && mealTargetKcal > 0 && mKcal > Math.round(mealTargetKcal * 1.20);

        return (
          <View key={m} style={[s.card, { marginBottom: 14, borderWidth: isPeri ? 2 : 1, borderColor: isPeri ? '#F59E0B' : '#E2E8F0' }]}>
            <View style={s.rowBet}>
              <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                <Text style={[s.bold, { fontSize: 14.5 }]}>{m.toUpperCase()}</Text>
                <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                  Budget pasto: {mealTargetKcal} kcal • C {mealTarget.c}g | P {mealTarget.p}g | G {mealTarget.f}g
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setActiveMealSearch(m);
                  setQuery('');
                  setSelectedFood(null);
                }}
                style={{ backgroundColor: '#0F172A', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 }}
              >
                <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#FFFFFF' }}>+ Aggiungi cibo</Text>
              </TouchableOpacity>
            </View>

            {/* Banner Peri-Workout per Atleta (2g/kg) */}
            {isPeri ? (
              <View style={{ backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#F59E0B', borderRadius: 6, padding: 6, marginTop: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#B45309', textAlign: 'center' }}>
                  ⚡ Pasto Peri-Workout (Target carboidrati strategico ~2.0 g/kg: {mealTarget.c}g)
                </Text>
              </View>
            ) : null}

            {/* Riepilogo consumato nel pasto */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', paddingVertical: 5, paddingHorizontal: 8, borderRadius: 6, marginTop: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: (isOverC || isOverKcal) ? '#DC2626' : '#334155' }}>
                Consumati: {mKcal} / {mealTargetKcal} kcal
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '600', color: (isOverC || isOverKcal) ? '#DC2626' : '#475569' }}>
                C: {mC}/{mealTarget.c}g | P: {mP}/{mealTarget.p}g | G: {mF}/{mealTarget.f}g
              </Text>
            </View>

            {/* Avviso superamento budget pasto per proteggere la cena */}
            {(isOverC || isOverKcal) ? (
              <View style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 6, padding: 6, marginTop: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#B91C1C' }}>
                  ⚠️ Questo pasto supera il budget consigliato (+{mC - mealTarget.c}g carbo). Attenzione a non togliere troppi macro alla cena!
                </Text>
              </View>
            ) : null}

            {/* Ricetta dal Ricettario se attiva */}
            {isRecipeActive ? (
              <View style={{ backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#86EFAC', borderRadius: 8, padding: 8, marginTop: 8, marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#166534', flex: 1 }}>
                    🥗 {recipeForMeal.nome} <Text style={{ fontSize: 10.5, fontWeight: 'normal', color: '#15803D' }}>(dal Ricettario B-sportlab)</Text>
                  </Text>
                  <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#166534', marginLeft: 8 }}>
                    {recipeForMeal.kcal} kcal
                  </Text>
                </View>
                <Text style={{ fontSize: 10.5, color: '#15803D', marginTop: 2 }}>
                  P {recipeForMeal.gP}g | C {recipeForMeal.gC}g | G {recipeForMeal.gF}g
                </Text>
              </View>
            ) : null}

            {/* Voci da Componi Piatto */}
            {plateConsumedForMeal.map((item) => (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 5,
                  paddingHorizontal: 8,
                  backgroundColor: '#DCFCE7',
                  borderRadius: 6,
                  marginTop: 6,
                }}
              >
                <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#166534' }}>
                    🍽️ {item.nome} ({item.gCrudo}g crudo)
                  </Text>
                </View>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#166534' }}>
                  {item.kcal} kcal | P {item.p}g | C {item.c}g | G {item.f}g
                </Text>
              </View>
            ))}

            {/* Voci registrate manualmente */}
            {entries.length === 0 && plateConsumedForMeal.length === 0 && !isRecipeActive ? (
              <Text style={{ fontSize: 11.5, color: '#94A3B8', fontStyle: 'italic', marginTop: 6 }}>
                Nessun alimento registrato per {m.toLowerCase()}.
              </Text>
            ) : null}

            {entries.map((entry) => (
              <View
                key={entry.id}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 5,
                  paddingHorizontal: 8,
                  backgroundColor: '#F8FAFC',
                  borderRadius: 6,
                  marginTop: 6,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}
              >
                <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#0F172A' }}>
                    {entry.nome} ({entry.grams}g {entry.isCooked ? 'cotto' : 'crudo'})
                  </Text>
                  <Text style={{ fontSize: 10.5, color: '#64748B' }}>
                    {entry.kcal} kcal | P {entry.p}g | C {entry.c}g | G {entry.f}g
                  </Text>
                </View>
                <TouchableOpacity onPress={() => onRemoveEntry && onRemoveEntry(m, entry.id)}>
                  <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: 'bold', padding: 4 }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        );
      })}

      {/* ─── MODALE DI RICERCA ALIMENTI CREA ─────────────────────────────────── */}
      {activeMealSearch ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
            zIndex: 9999,
          }}
        >
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, width: '100%', maxWidth: 440, maxHeight: '90%' }}>
            <View style={s.rowBet}>
              <Text style={[s.bold, { fontSize: 15 }]}>Aggiungi a {activeMealSearch}</Text>
              <TouchableOpacity onPress={() => setActiveMealSearch(null)}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#64748B' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Barra di ricerca */}
            <TextInput
              style={[s.tInp, { marginTop: 10, outlineStyle: 'none' }]}
              placeholder={t.searchFoodPh || "Cerca alimento (es. latte, muesli, avena, pollo)..."}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />

            {/* Risultati ricerca */}
            {searchResults.length > 0 && !selectedFood ? (
              <ScrollView style={{ maxHeight: 200, marginBottom: 10 }}>
                {searchResults.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      setSelectedFood(item);
                      setIsCookedChoice(false);
                      const mTarget = daily?.mealTargets?.[activeMealSearch] || { c: 50, p: 30, f: 15 };
                      const mEntries = diaryEntries[activeMealSearch] || [];
                      let curC = 0, curP = 0;
                      mEntries.forEach((e) => { curC += e.c || 0; curP += e.p || 0; });

                      let suggested = 100;
                      if (item.cat === 'C' && item.c > 0) {
                        const remC = Math.max(20, mTarget.c - curC);
                        suggested = Math.round(remC / (item.c / 100));
                        suggested = Math.max(30, Math.min(220, suggested));
                      } else if (item.cat === 'P' && item.p > 0) {
                        const remP = Math.max(15, mTarget.p - curP);
                        suggested = Math.round(remP / (item.p / 100));
                        suggested = Math.max(50, Math.min(250, suggested));
                      } else if (item.cat === 'F') {
                        suggested = item.id.includes('olio') ? 10 : 25;
                      } else if (item.cat === 'V') {
                        suggested = 200;
                      } else if (item.cat === 'FR') {
                        suggested = 150;
                      }
                      setGramsInput(String(suggested));
                    }}
                    style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: '#F1F5F9' }}
                  >
                    <Text style={{ fontSize: 12.5, fontWeight: '600', color: '#0F172A' }}>{item.nome}</Text>
                    <Text style={{ fontSize: 10.5, color: '#64748B' }}>
                      100g: {item.kcal} kcal | P {item.p}g | C {item.c}g | G {item.f}g
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}

            {/* Form Grammi se alimento selezionato */}
            {selectedFood ? (
              <View style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, marginTop: 6, marginBottom: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0F172A', marginBottom: 6 }}>
                  {selectedFood.nome}
                </Text>

                {/* Scelta Crudo o Cotto */}
                {selectedFood.cookedRatio && selectedFood.cookedRatio !== 1.0 ? (
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                    <TouchableOpacity
                      onPress={() => setIsCookedChoice(false)}
                      style={[s.chip, !isCookedChoice && s.chipAct, { flex: 1, alignItems: 'center' }]}
                    >
                      <Text style={[s.cTxt, !isCookedChoice && s.cTxtAct]}>Peso a Crudo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setIsCookedChoice(true)}
                      style={[s.chip, isCookedChoice && s.chipAct, { flex: 1, alignItems: 'center' }]}
                    >
                      <Text style={[s.cTxt, isCookedChoice && s.cTxtAct]}>Peso da Cotto</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#475569' }}>
                    Grammi da consumare:
                  </Text>
                  <Text style={{ fontSize: 10.5, color: '#0284C7', fontWeight: 'bold' }}>
                    💡 Suggeriti per questo pasto: {gramsInput}g
                  </Text>
                </View>
                <TextInput
                  style={[s.inp, { textAlign: 'center', marginBottom: 10, outlineStyle: 'none' }]}
                  inputMode="decimal"
                  value={gramsInput}
                  onChangeText={setGramsInput}
                />

                <TouchableOpacity
                  style={[s.btn, { backgroundColor: '#16A34A', marginTop: 0 }]}
                  onPress={handleConfirmAdd}
                >
                  <Text style={[s.btnTxt, { color: '#FFFFFF' }]}>✓ Conferma e Aggiungi</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}
