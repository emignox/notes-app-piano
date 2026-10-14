// Testo con i termini musicali toccabili.
//
// Il problema che risolve: una spiegazione usa parole come "sensibile" o
// "condotta delle voci" dandole per scontate, e chi legge si blocca lì. Qui
// ogni parola del glossario diventa toccabile e apre la sua definizione, senza
// far perdere il segno nella lettura.
//
// Per non trasformare il testo in un tappeto di link si evidenzia solo la PRIMA
// occorrenza di ogni termine dentro lo stesso blocco.

import { useCallback, useContext, useMemo, useState } from 'react';
import { BookOpen, X } from 'lucide-react';
import { glossario, termById, termForms } from '../data/glossario';
import type { Term } from '../data/glossario';
import type { AudioApi } from '../hooks/useAudio';
import { t, useLang } from '../i18n';
import type { Lang } from '../i18n';

import { GlossarioCtx as Ctx } from '../hooks/useGlossario';

/** Sfugge i caratteri speciali: senza, "m7♭5" romperebbe l'espressione. */
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Come si cercano i termini in un testo: una sola espressione e la mappa forma → voce. */
interface Finder {
  re: RegExp;
  idOf: (form: string) => string | undefined;
}

// Una sola espressione per tutte le forme, dalla più lunga alla più corta.
// I confini non sono \b perché le parole italiane contengono accenti e apostrofi.
const regexOf = (forms: string[]) => new RegExp(`(?<![\\p{L}])(${forms.map(escapeRe).join('|')})(?![\\p{L}])`, 'giu');

const IT_FORM_TO_ID = new Map(termForms.map(f => [f.form.toLowerCase(), f.id]));
const IT_FINDER: Finder = {
  re: regexOf(termForms.map(f => f.form)),
  idOf: form => IT_FORM_TO_ID.get(form.toLowerCase()),
};

/**
 * Parole che in inglese e in francese hanno, da sole, un altro senso molto più
 * comune ("key" = tasto, "third" = terzo, "ton" = tuo…): restano il titolo
 * della voce, ma non si agganciano da sole nel testo (le forme più lunghe
 * sì: "major key", "tierce majeure").
 */
const NO_LINK: Record<'en' | 'fr', Set<string>> = {
  en: new Set(['key', 'keys', 'third', 'fifth', 'tone', 'relative', 'parallel']),
  fr: new Set(['ton', 'temps', 'reprise', 'liaison', 'point', 'ligne']),
};

const finders = new Map<Lang, Finder>();

/** Le forme riconoscibili nella lingua corrente: parole e sinonimi, tradotti. */
function finderFor(lang: Lang): Finder {
  if (lang === 'it') return IT_FINDER;
  const cached = finders.get(lang);
  if (cached) return cached;
  const skip = NO_LINK[lang];
  const map = new Map<string, string>();
  for (const term of glossario) {
    for (const form of [term.word, ...(term.aka ?? [])]) {
      const f = t(form).trim().toLowerCase();
      if (f && !skip.has(f) && !map.has(f)) map.set(f, term.id);
    }
  }
  const forms = [...map.keys()].sort((a, b) => b.length - a.length);
  const finder: Finder = { re: regexOf(forms), idOf: form => map.get(form.toLowerCase()) };
  finders.set(lang, finder);
  return finder;
}

/** Il testo spezzato in pezzi normali e pezzi cliccabili. */
export function RichText({ text, className = '' }: { text: string; className?: string }) {
  const api = useContext(Ctx);
  const lang = useLang();
  const parts = useMemo(() => {
    if (!api) return [{ text }];
    const { re, idOf } = finderFor(lang);
    const out: { text: string; id?: string }[] = [];
    const visti = new Set<string>();
    let last = 0;
    for (const m of text.matchAll(re)) {
      const id = idOf(m[0]);
      if (!id || visti.has(id)) continue; // solo la prima volta per blocco
      visti.add(id);
      if (m.index > last) out.push({ text: text.slice(last, m.index) });
      out.push({ text: m[0], id });
      last = m.index + m[0].length;
    }
    if (last < text.length) out.push({ text: text.slice(last) });
    return out;
  }, [text, api, lang]);

  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.id ? (
          <button
            key={i}
            type="button"
            onClick={() => api?.open(p.id!)}
            className="text-brand underline decoration-dotted decoration-from-font underline-offset-2"
          >
            {p.text}
          </button>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </span>
  );
}

/** La scheda che si apre dal basso con la definizione. */
function Sheet({ term, onClose, onGo, audio }: { term: Term; onClose: () => void; onGo: (id: string) => void; audio?: AudioApi }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <button type="button" aria-label={t('Chiudi')} onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div className="anim-up relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border-t border-line bg-surface p-5 pb-8 safe-bottom">
        <div className="mb-3 flex items-start gap-3">
          <BookOpen className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand" />
          <h2 className="min-w-0 flex-1 text-xl font-black text-ink">{t(term.word)}</h2>
          <button type="button" onClick={onClose} className="rounded-lg bg-surface2 p-2 text-ink2 active:scale-95">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm font-semibold leading-relaxed text-ink">{t(term.short)}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink2">{t(term.long)}</p>

        {term.demo && audio && (
          <button
            type="button"
            onClick={() => {
              if (term.demo!.together) audio.playChord(term.demo!.notes, 1.6);
              else audio.playSequence(term.demo!.notes.map(n => ({ toneNote: n, durationSec: 0.55 })));
            }}
            className="mt-3 w-full rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm font-semibold text-ink"
          >
            🔊 {t(term.demo.label)}
          </button>
        )}

        {term.see && term.see.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] uppercase tracking-wider text-ink3">{t('vedi anche')}</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {term.see.map(id => {
                const see = termById(id);
                if (!see) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onGo(id)}
                    className="rounded-lg border border-line bg-surface2 px-3 py-1.5 text-xs font-semibold text-ink2"
                  >
                    {t(see.word)}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Da mettere attorno all'app: fornisce la scheda a tutti i testi. */
export function GlossarioProvider({ children, audio }: { children: React.ReactNode; audio?: AudioApi }) {
  useLang(); // la scheda aperta si ridisegna se cambia la lingua
  const [openId, setOpenId] = useState<string | null>(null);
  const open = useCallback((id: string) => setOpenId(id), []);
  const api = useMemo(() => ({ open }), [open]);
  const term = openId ? termById(openId) : undefined;

  return (
    <Ctx.Provider value={api}>
      {children}
      {term && <Sheet term={term} audio={audio} onClose={() => setOpenId(null)} onGo={setOpenId} />}
    </Ctx.Provider>
  );
}
