import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';
import useAshaSession from '../hooks/useAshaSession';
import { useLang } from '../i18n/LanguageContext';
import T from '../i18n/translations';

export default function AshaHistoryPage() {
  const navigate = useNavigate();
  const { session, clearSession } = useAshaSession();
  const { lang } = useLang();
  const t = (key) => (T[key] && T[key][lang]) || T[key]?.en || key;
  const [status, setStatus] = useState({ message: '', isError: false });
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!session) return;
    try {
      setIsLoading(true);
      const histUrl = API_BASE + '/asha/workflows/history?nhm_id=' + encodeURIComponent(session.nhm_id) + '&limit=100';
      const histRes = await fetch(histUrl);
      const histJson = await histRes.json();
      if (!histRes.ok || !histJson.success) throw new Error(histJson.error || 'History fetch failed');
      const vf = (histJson.history && histJson.history.verifications) || [];
      const sc = (histJson.history && histJson.history.scans) || [];

      const combinedCards = [];
      vf.forEach(item => {
        combinedCards.push({
          type: 'verification',
          drug_name: item.scan_result?.drug_name || 'Unknown',
          dosage: item.scan_result?.dosage || '',
          status: item.verdict?.status || 'UNKNOWN',
          reason: item.verdict?.reason || '',
          timestamp: item.created_at,
          phone: item.patient_phone
        });
      });
      sc.forEach(item => {
        const rx = item.prescription || {};
        const meds = rx.medicines || rx.medications || [];
        if (meds.length === 0) {
           combinedCards.push({
             type: 'prescription',
             drug_name: 'No medicines detected',
             timestamp: item.created_at,
             phone: item.patient_phone
           });
        } else {
           meds.forEach(m => {
             combinedCards.push({
               type: 'prescription',
               drug_name: m.name || m.medicine_name || 'Rx Med',
               dosage: m.dosage || m.dose || '',
               frequency: m.frequency || '',
               duration: m.duration || '',
               timestamp: item.created_at,
               phone: item.patient_phone
             });
           });
        }
      });
      combinedCards.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

      setHistoryItems(combinedCards);
      setStatus({ message: '', isError: false });
    } catch (err) { 
      setStatus({ message: err.message, isError: true }); 
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  function handleLogout() { clearSession(); navigate('/asha-login'); }

  if (!session) return null;

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen pb-24">
      <header className="bg-white shadow-sm border-b border-slate-100 flex items-center gap-4 w-full px-6 h-16 sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 active:scale-95"><span className="material-symbols-outlined text-[#005D67]">arrow_back</span></button>
        <h1 className="text-xl font-extrabold text-[#005D67]">{t('history') || 'History'}</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        <section>
          {status.message && <p className={`text-sm ml-1 mb-4 ${status.isError ? 'text-error' : 'text-secondary'}`}>{status.message}</p>}
          
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center p-8 text-outline">Loading...</div>
            ) : historyItems.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center text-on-surface-variant flex flex-col items-center">
                <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">history</span>
                {t('noVerificationData') || 'No history found.'}
              </div>
            ) : historyItems.map((item, i) => {
              const dateObj = new Date(item.timestamp);
              const dateStr = isNaN(dateObj) ? '' : dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              if (item.type === 'verification') {
                const st = item.status;
                const badge = st === 'GREEN' ? 'bg-secondary-container text-on-secondary-container' : st === 'YELLOW' ? 'bg-yellow-100 text-yellow-700' : 'bg-error-container text-error';
                return (
                  <div key={i} className="bg-white p-5 rounded-2xl shadow-[0_4px_16px_rgba(0,93,103,0.04)] border border-slate-50 relative">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-body-lg text-on-surface leading-tight">{item.drug_name}</h4>
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase font-bold">Verify</span>
                        </div>
                        {item.phone && <p className="text-xs text-primary font-mono mb-1"><span className="material-symbols-outlined text-[12px] align-middle mr-1">call</span>{item.phone}</p>}
                        <p className="text-on-surface-variant font-medium mt-1">{item.dosage}</p>
                        <p className="text-sm text-on-surface-variant mt-2">{item.reason}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`${badge} text-[10px] px-2 py-0.5 rounded-full font-bold`}>{st}</span>
                        <span className="text-[10px] text-outline whitespace-nowrap">{dateStr}</span>
                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={i} className="bg-white p-5 rounded-2xl shadow-[0_4px_16px_rgba(0,93,103,0.04)] border border-slate-50 relative">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-body-lg text-on-surface leading-tight">{item.drug_name}</h4>
                          <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Rx</span>
                        </div>
                        {item.phone && <p className="text-xs text-primary font-mono mb-1"><span className="material-symbols-outlined text-[12px] align-middle mr-1">call</span>{item.phone}</p>}
                        {item.dosage && <p className="text-on-surface-variant font-medium mt-1">{item.dosage} {item.frequency ? `• ${item.frequency}` : ''}</p>}
                        {item.duration && <p className="text-sm text-on-surface-variant mt-1">{item.duration}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] text-outline whitespace-nowrap mt-1">{dateStr}</span>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-3 bg-white border-t border-slate-100 shadow-[0_-4px_16px_rgba(0,93,103,0.04)]">
        <button onClick={() => navigate('/asha-worker')} className="flex flex-col items-center justify-center text-slate-500 px-4 py-1 active:scale-90 transition-transform"><span className="material-symbols-outlined">home</span><span className="font-manrope text-[12px] font-medium">{t('home')}</span></button>
        <button className="flex flex-col items-center justify-center bg-teal-50 text-[#005D67] rounded-2xl px-4 py-1"><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>history</span><span className="font-manrope text-[12px] font-bold">{t('history')}</span></button>
        <button onClick={() => navigate('/med-verification')} className="flex flex-col items-center justify-center text-slate-500 px-4 py-1 active:scale-90 transition-transform"><span className="material-symbols-outlined">fact_check</span><span className="font-manrope text-[12px] font-medium">{t('verify')}</span></button>
        <button onClick={handleLogout} className="flex flex-col items-center justify-center text-slate-500 px-4 py-1"><span className="material-symbols-outlined">logout</span><span className="font-manrope text-[12px] font-medium">{t('logout')}</span></button>
      </nav>
    </div>
  );
}
