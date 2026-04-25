import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';

export default function HealthChatPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    setMessages([{ role: 'bot', text: 'Namaskara. I am connected to the live backend now. Ask any medicine or dosage question.' }]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function sendMessage(text) {
    const msg = (text || '').trim();
    if (!msg || sending) return;
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setInput(''); setSending(true);
    try {
      let ashaSession = null;
      try { const r = localStorage.getItem('ashaSession'); ashaSession = r ? JSON.parse(r) : null; } catch (_e) { /* */ }
      const res = await fetch(API_BASE + '/assistant/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nhm_id: ashaSession?.nhm_id || '', patient_phone: localStorage.getItem('currentPatientPhone') || '', message: msg, language: 'EN' }) });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Chat request failed');
      setMessages(prev => [...prev, { role: 'bot', text: json.answer || 'No answer returned.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: err.message || 'Unable to get response from backend.' }]);
    } finally { setSending(false); }
  }

  function handleKeyDown(e) { if (e.key === 'Enter') { e.preventDefault(); sendMessage(input); } }

  const chips = [
    { icon: 'notifications_active', label: 'Set Reminder', prompt: 'Set medicine reminder for 8 PM' },
    { icon: 'warning', label: 'Side Effects', prompt: 'Tell me side effects of this medicine' },
    { icon: 'location_on', label: 'Doctor Nearby', prompt: 'Find doctor nearby' },
    { icon: 'translate', label: 'ಕನ್ನಡದಲ್ಲಿ ವಿವರಿಸಿ', prompt: 'Explain in Kannada' },
  ];

  return (
    <div className="font-body-md text-on-surface min-h-screen bg-background flex flex-col">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-[0_16px_32px_-12px_rgba(0,93,103,0.04)] fixed top-0 w-full z-50">
        <div className="flex justify-between items-center px-4 py-4 w-full">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/')} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors p-2 rounded-full active:scale-95 duration-150">
              <span className="material-symbols-outlined text-[#005D67]">arrow_back</span>
            </button>
            <div className="flex flex-col">
              <h1 className="font-manrope text-base font-bold tracking-tight text-[#005D67] dark:text-teal-400">Health Assistant</h1>
              <span className="text-[10px] uppercase tracking-widest font-bold text-secondary flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-secondary rounded-full"></span>Online
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary-container">smart_toy</span>
            </div>
          </div>
        </div>
      </header>

      <main ref={scrollRef} className="pt-24 pb-44 px-4 md:px-margin_desktop max-w-4xl mx-auto flex-1 overflow-y-auto no-scrollbar" style={{ height: 'calc(100vh - 160px)' }}>
        <div className="flex justify-center my-stack_md">
          <span className="bg-surface-variant/30 text-outline px-4 py-1 rounded-full font-label-caps uppercase text-[10px]">Today</span>
        </div>
        <div className="space-y-stack_md">
          {messages.map((m, i) => m.role === 'bot' ? (
            <div key={i} className="flex gap-3 max-w-[85%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center self-start">
                <span className="material-symbols-outlined text-surface-tint text-sm">smart_toy</span>
              </div>
              <div className="space-y-1">
                <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-tl-none p-4 text-on-surface">
                  <p className="font-body-md whitespace-pre-wrap">{m.text}</p>
                </div>
                <span className="text-[10px] text-slate-400 ml-1">just now</span>
              </div>
            </div>
          ) : (
            <div key={i} className="flex flex-row-reverse gap-3 ml-auto max-w-[85%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center self-start">
                <span className="material-symbols-outlined text-primary-container text-sm">person</span>
              </div>
              <div className="space-y-1 text-right">
                <div className="bg-primary-container text-white shadow-md rounded-2xl rounded-tr-none p-4 text-left">
                  <p className="font-body-md">{m.text}</p>
                </div>
                <span className="text-[10px] text-slate-400 mr-1">just now</span>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center self-start">
                <span className="material-symbols-outlined text-surface-tint text-sm">smart_toy</span>
              </div>
              <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-tl-none p-4">
                <div className="flex gap-1"><div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></div><div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></div><div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></div></div>
              </div>
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md z-40 pb-4 border-t border-slate-100">
        <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
          {chips.map((c, i) => (
            <button key={i} onClick={() => sendMessage(c.prompt)} className="whitespace-nowrap flex items-center gap-2 px-4 py-2 bg-surface-container-low border border-surface-container rounded-full text-primary-container font-label-caps text-[11px] hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-sm">{c.icon}</span>{c.label}
            </button>
          ))}
        </div>
        <div className="px-4 flex items-center gap-3">
          <div className="flex-1 relative flex items-center">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} className="w-full h-14 pl-5 pr-12 bg-slate-50 border-slate-200 rounded-2xl focus:ring-primary-container focus:border-primary-container text-body-md" placeholder="Type or speak in Kannada/English..." type="text" />
          </div>
          <button onClick={() => sendMessage(input)} disabled={sending} className="w-14 h-14 bg-primary-container text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
