import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';
import { useLang } from '../i18n/LanguageContext';
import LanguageSwitcher from '../i18n/LanguageSwitcher';
import T from '../i18n/translations';

export default function HealthChatPage() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const t = (key) => (T[key] && T[key][lang]) || T[key]?.en || key;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  // Update initial greeting when language changes, only before first user message
  useEffect(() => {
    setMessages(prev => {
      if (prev.length <= 1) {
        return [{ role: 'bot', text: t('welcomeMsg'), isGreeting: true }];
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  async function sendMessage(text) {
    const msg = (text || '').trim(); if (!msg || sending) return;
    setMessages(prev => [...prev, { role: 'user', text: msg }]); setInput(''); setSending(true);
    try {
      let ashaSession = null; try { const r = localStorage.getItem('ashaSession'); ashaSession = r ? JSON.parse(r) : null; } catch (_e) {}
      const chatLang = lang === 'kn' ? 'KN' : (lang === 'hi' ? 'HI' : 'EN');
      const res = await fetch(API_BASE + '/assistant/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nhm_id: ashaSession?.nhm_id || '', patient_phone: localStorage.getItem('currentPatientPhone') || '', message: msg, language: chatLang }) });
      const json = await res.json(); if (!res.ok || !json.success) throw new Error(json.error || 'Chat request failed');
      setMessages(prev => [...prev, { role: 'bot', text: json.answer || 'No answer.' }]);
    } catch (err) { setMessages(prev => [...prev, { role: 'bot', text: err.message }]); }
    finally { setSending(false); }
  }

  const greetingSuggestions = [
    { text: t('suggestionWhenTake'), prompt: t('suggestionWhenTake'), icon: 'schedule' },
    { text: t('suggestionMissedDose'), prompt: t('suggestionMissedDose'), icon: 'history_toggle_off' },
    { text: t('suggestionAfterFood'), prompt: t('suggestionAfterFood'), icon: 'restaurant' },
  ];

  const chips = [
    { icon: 'schedule', label: t('suggestionWhenTake'), prompt: t('suggestionWhenTake') },
    { icon: 'history_toggle_off', label: t('suggestionMissedDose'), prompt: t('suggestionMissedDose') },
    { icon: 'restaurant', label: t('suggestionAfterFood'), prompt: t('suggestionAfterFood') },
    { icon: 'warning', label: t('sideEffects'), prompt: lang === 'kn' ? 'ಈ ಔಷಧಿಯ ಅಡ್ಡ ಪರಿಣಾಮಗಳನ್ನು ತಿಳಿಸಿ' : lang === 'hi' ? 'इस दवा के साइड इफेक्ट्स बताएं' : 'Tell me side effects of this medicine' },
    { icon: 'location_on', label: t('doctorNearby'), prompt: lang === 'kn' ? 'ಹತ್ತಿರದ ವೈದ್ಯರು ಯಾರು?' : lang === 'hi' ? 'नज़दीकी डॉक्टर की जानकारी दें' : 'Find doctor nearby' },
  ];

  return (
    <div className="font-body-md text-on-surface min-h-screen bg-background flex flex-col">
      <header className="bg-white border-b border-slate-100 shadow-[0_16px_32px_-12px_rgba(0,93,103,0.04)] fixed top-0 w-full z-50">
        <div className="flex justify-between items-center px-4 py-4 w-full max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/')} className="hover:bg-slate-50 transition-colors p-2 rounded-full active:scale-95"><span className="material-symbols-outlined text-[#005D67]">arrow_back</span></button>
            <div className="flex flex-col">
              <h1 className="font-manrope text-base font-bold tracking-tight text-[#005D67]">{t('healthAssistant')}</h1>
              <span className="text-[10px] uppercase tracking-widest font-bold text-secondary flex items-center gap-1"><span className="w-1.5 h-1.5 bg-secondary rounded-full"></span>{t('online')}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center"><span className="material-symbols-outlined text-primary-container">smart_toy</span></div>
          </div>
        </div>
      </header>

      <main ref={scrollRef} className="pt-24 pb-44 px-4 max-w-4xl mx-auto flex-1 overflow-y-auto no-scrollbar" style={{ height: 'calc(100vh - 160px)' }}>
        <div className="flex justify-center my-stack_md"><span className="bg-surface-variant/30 text-outline px-4 py-1 rounded-full font-label-caps uppercase text-[10px]">{t('today')}</span></div>
        <div className="space-y-stack_md">
          {messages.map((m, i) => m.role === 'bot' ? (
            <div key={i} className="flex gap-3 max-w-[92%] sm:max-w-[85%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center self-start"><span className="material-symbols-outlined text-surface-tint text-sm">smart_toy</span></div>
              <div className="space-y-2">
                <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-tl-none p-4 text-on-surface">
                  <p className="font-body-md whitespace-pre-wrap">{m.text}</p>
                </div>
                {Boolean(m.isGreeting || i === 0) && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {greetingSuggestions.map((chip, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => sendMessage(chip.prompt)}
                        disabled={sending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/90 hover:bg-emerald-100 hover:border-emerald-300 transition-all shadow-xs active:scale-95 text-left"
                      >
                        <span className="material-symbols-outlined text-[15px] text-emerald-600">{chip.icon}</span>
                        <span>{chip.text}</span>
                      </button>
                    ))}
                  </div>
                )}
                <span className="text-[10px] text-slate-400 ml-1">{t('justNow')}</span>
              </div>
            </div>
          ) : (
            <div key={i} className="flex flex-row-reverse gap-3 ml-auto max-w-[85%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center self-start"><span className="material-symbols-outlined text-primary-container text-sm">person</span></div>
              <div className="space-y-1 text-right"><div className="bg-primary-container text-white shadow-md rounded-2xl rounded-tr-none p-4 text-left"><p className="font-body-md">{m.text}</p></div><span className="text-[10px] text-slate-400 mr-1">{t('justNow')}</span></div>
            </div>
          ))}
          {sending && (
            <div className="flex gap-3 max-w-[85%]"><div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center self-start"><span className="material-symbols-outlined text-surface-tint text-sm">smart_toy</span></div><div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-tl-none p-4"><div className="flex gap-1"><div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></div><div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></div><div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></div></div></div></div>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md z-40 pb-4 border-t border-slate-100">
        <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
          {chips.map((c, i) => (<button key={i} onClick={() => sendMessage(c.prompt)} className="whitespace-nowrap flex items-center gap-2 px-4 py-2 bg-surface-container-low border border-surface-container rounded-full text-primary-container font-label-caps text-[11px] hover:bg-surface-container transition-colors"><span className="material-symbols-outlined text-sm">{c.icon}</span>{c.label}</button>))}
        </div>
        <div className="px-4 flex items-center gap-3">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(input); } }} className="flex-1 h-14 pl-5 pr-12 bg-slate-50 border-slate-200 rounded-2xl focus:ring-primary-container focus:border-primary-container text-body-md" placeholder={t('typePlaceholder')} type="text" />
          <button onClick={() => sendMessage(input)} disabled={sending} className="w-14 h-14 bg-primary-container text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span></button>
        </div>
      </div>
    </div>
  );
}
