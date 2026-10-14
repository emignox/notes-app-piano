// ─────────────────────────────────────────────────────────────────────────────
// Le lingue dell'app: italiano (quella in cui è scritta), inglese, francese.
//
// Il testo italiano è la CHIAVE: `t('Oggi')` dà "Today" in inglese, "Aujourd'hui"
// in francese, "Oggi" in italiano. Se una frase non è nel dizionario resta in
// italiano: un'app mezza tradotta funziona lo stesso, e niente può rompersi.
// Per i testi con numeri o nomi: `t('Hai {n} note', { n: 3 })` — i segnaposto
// {nome} restano uguali in tutte le lingue.
//
// I dizionari stanno in `i18n/<lingua>/*.ts` (uno per area) e si caricano solo
// quando la lingua è scelta: chi usa l'italiano non scarica niente in più.
// ─────────────────────────────────────────────────────────────────────────────

import { useSyncExternalStore } from 'react';

export type Lang = 'it' | 'en' | 'fr';

export const LANGS: { id: Lang; label: string }[] = [
  { id: 'it', label: 'Italiano' },
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'Français' },
];

const STORAGE_KEY = 'piano-lang';
const KNOWN = new Set<string>(LANGS.map(l => l.id));

function stored(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && KNOWN.has(v)) return v as Lang;
  } catch {
    /* niente memoria del dispositivo: italiano */
  }
  return 'it';
}

let current: Lang = 'it';
const listeners = new Set<() => void>();
const dictionaries: Record<Exclude<Lang, 'it'>, Record<string, string>> = { en: {}, fr: {} };

/** I file di dizionario: uno per area, caricati a richiesta. */
const loaders = {
  en: import.meta.glob<{ default: Record<string, string> }>('./en/*.ts'),
  fr: import.meta.glob<{ default: Record<string, string> }>('./fr/*.ts'),
};

async function load(lang: Lang): Promise<void> {
  if (lang === 'it') return;
  const target = dictionaries[lang];
  if (Object.keys(target).length > 0) return;
  const mods = await Promise.all(Object.values(loaders[lang]).map(f => f()));
  for (const m of mods) Object.assign(target, m.default);
}

function apply(lang: Lang) {
  current = lang;
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
  listeners.forEach(f => f());
}

/** Da chiamare prima di disegnare l'app: carica la lingua scelta, se non è l'italiano. */
export async function initI18n(): Promise<void> {
  const lang = stored();
  try {
    await load(lang);
    apply(lang);
  } catch {
    apply('it'); // dizionario non raggiungibile: l'app resta in italiano
  }
}

/** Cambia lingua (si ricorda sul dispositivo). */
export async function setLang(lang: Lang): Promise<void> {
  try {
    await load(lang);
  } catch {
    return; // dizionario non raggiungibile (offline la prima volta): non si cambia
  }
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* si cambia comunque, finché l'app è aperta */
  }
  apply(lang);
}

export const getLang = (): Lang => current;

/** La lingua corrente; chi la usa si ridisegna quando cambia. */
export function useLang(): Lang {
  return useSyncExternalStore(
    cb => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getLang,
  );
}

/** Sostituisce i segnaposto {nome}. */
function fill(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** Traduce un testo italiano nella lingua corrente. */
export function t(it: string, vars?: Record<string, string | number>): string {
  const text = current === 'it' ? it : (dictionaries[current][it] ?? it);
  return fill(text, vars);
}

/**
 * Traduce solo i campi di testo di un dato (lezioni, brani, termini…) senza
 * toccare gli identificatori: `fields` dice quali chiavi sono testo da mostrare.
 * Cammina negli oggetti e negli elenchi; ciò che non è nel dizionario resta com'è.
 */
export function localize<T>(value: T, fields: ReadonlySet<string>, key?: string): T {
  if (current === 'it') return value;
  if (typeof value === 'string') return (key && fields.has(key) ? t(value) : value) as T;
  if (Array.isArray(value)) return value.map(v => localize(v, fields, key)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = localize(v, fields, k);
    return out as T;
  }
  return value;
}
