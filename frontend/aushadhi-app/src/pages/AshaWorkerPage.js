import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';
import useAshaSession from '../hooks/useAshaSession';
import { useLang } from '../i18n/LanguageContext';
import T from '../i18n/translations';

export default function AshaWorkerPage() {
  const navigate = useNavigate();
  const { session, clearSession } = useAshaSession();
  const { lang } = useLang();
  const t = (key) => (T[key] && T[key][lang]) || T[key]?.en || key;
  const [patientPhone, setPatientPhone] = useState('');
  const [status, setStatus] = useState({ message: '', isError: false });
  const [medicineCards, setMedicineCards] = useState([]);
  const [smsPreview, setSmsPreview] = useState('');

  useEffect(() => {
    if (!session || !session.nhm_id) { navigate('/asha-login'); return; }
    const cached = localStorage.getItem('currentPatientPhone') || '';
    if (cached.length === 10) setPatientPhone(cached);
  }, [session, navigate]);

  const getCurrentPhone = useCallback(() => {
    const phone = patientPhone.replace(/\D/g, '');
    if (phone.length === 10) { localStorage.setItem('currentPatientPhone', phone); return phone; }
    const stored = localStorage.getItem('currentPatientPhone') || '';
    return stored.length === 10 ? stored : '';
  }, [patientPhone]);

  const fetchDashboard = useCallback(async () => {
    if (!session) return;
    try {
      const dashRes = await fetch(API_BASE + '/asha/dashboard?nhm_id=' + encodeURIComponent(session.nhm_id));
      const dashJson = await dashRes.json();
      if (!dashRes.ok || !dashJson.success) throw new Error(dashJson.error || 'Dashboard fetch failed');
      const phone = getCurrentPhone();
      const histUrl = API_BASE + '/asha/workflows/history?nhm_id=' + encodeURIComponent(session.nhm_id) + (phone ? '&patient_phone=' + encodeURIComponent(phone) : '') + '&limit=5';
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
          timestamp: item.created_at
        });
      });
      sc.forEach(item => {
        const rx = item.prescription || {};
        const meds = rx.medicines || rx.medications || [];
        meds.forEach(m => {
          combinedCards.push({
            type: 'prescription',
            drug_name: m.name || m.medicine_name || 'Rx Med',
            dosage: m.dosage || m.dose || '',
            frequency: m.frequency || '',
            duration: m.duration || '',
            timestamp: item.created_at
          });
        });
      });
      combinedCards.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

      setMedicineCards(combinedCards);
      setSmsPreview(buildSmsPreview(vf, sc, phone));
      setStatus({ message: 'Dashboard synced.', isError: false });
    } catch (err) { setStatus({ message: err.message, isError: true }); }
  }, [session, getCurrentPhone]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  function buildSmsPreview(vf, sc, phone) {
    const allHistory = [...vf, ...sc].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    if (allHistory.length === 0) return t('noVerificationData');

    const latestItem = allHistory.find(item => item.explanation || item.kannada_explanation);
    if (latestItem) {
      return lang === 'en' ? (latestItem.explanation || latestItem.kannada_explanation) : (latestItem.kannada_explanation || latestItem.explanation);
    }

    return 'Hello. Update for patient ' + (phone || 'N/A') + '. No instructions available.';
  }

  async function handlePhoneChange() {
    const phone = getCurrentPhone();
    if (phone.length !== 10) { setStatus({ message: t('validationError'), isError: true }); return; }
    try {
      await fetch(API_BASE + '/asha/patients/upsert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nhm_id: session.nhm_id, phone, area: session.village || '' }) });
      await fetchDashboard();
    } catch (_err) { setStatus({ message: 'Sync failed.', isError: true }); }
  }

  async function handleSendSms() {
    const phone = getCurrentPhone();
    if (phone.length !== 10) { setStatus({ message: 'Enter patient phone first.', isError: true }); return; }
    try {
      const res = await fetch(API_BASE + '/asha/workflows/send-sms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nhm_id: session.nhm_id, patient_phone: phone, message: smsPreview }) });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to queue SMS');
      setStatus({ message: 'SMS workflow logged.', isError: false });
      await fetchDashboard();
    } catch (err) { setStatus({ message: err.message, isError: true }); }
  }

  function handleLogout() { clearSession(); navigate('/asha-login'); }

  if (!session) return null;

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen pb-24">
      <header className="bg-white shadow-sm border-b border-slate-100 flex justify-between items-center w-full px-4 h-16 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border-2 border-primary-container">
            <img className="w-full h-full object-cover" alt="Worker" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcf7uGVt9Vze4vEC3HGE9qnvlKg4OZcxoZbbquwDQrirgLY40E7gua3yyWcNs-ofXT7KWOMxvpuqArVlGthaZohoAvfGumN7Y83UnnvQG0sDUVOyuzgvW8I7jHJrLlr84L7nN1W1x8Lp3zmdZCa03fh_gXmjoPEnC7n9gQQllGjccvYDKyn0AON7QKboDvYW8dZUBYcseN5QTxEFz4frJA2nIPleEb3T7hWJDmrC-0EvPYU1-mA3IUeTzceSIikIuU_xf4byJR0RE" />
          </div>
          <div>
            <p className="font-h3 text-base text-[#005D67] leading-none">{session.full_name || t('ashaWorker')}</p>
            <p className="text-[10px] text-outline font-label-caps uppercase">{session.nhm_id || ''} • NHM ID</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-stack_md">
        <section className="space-y-stack_sm">
          <label className="font-label-caps text-on-surface-variant block ml-1">{t('patientPhone')}</label>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">call</span>
            <input value={patientPhone} onChange={e => setPatientPhone(e.target.value)} onBlur={handlePhoneChange} className="w-full h-[56px] pl-12 pr-4 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container focus:border-primary-container transition-all text-body-lg" placeholder={t('enterPhone')} type="tel" />
          </div>
          {status.message && <p className={`text-sm ml-1 ${status.isError ? 'text-error' : 'text-secondary'}`}>{status.message}</p>}
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative group overflow-hidden rounded-[24px] bg-white border border-slate-100 shadow-[0_8px_24px_-12px_rgba(0,93,103,0.05)] p-6 transition-all hover:shadow-lg">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-6 -mt-6"></div>
            <div className="flex flex-col h-full relative z-10">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4"><span className="material-symbols-outlined text-primary text-2xl">document_scanner</span></div>
              <h3 className="font-h3 text-xl text-primary mb-2 leading-tight">{t('scanPrescription') || 'Prescription'}</h3>
              <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">Extract medicines from a prescription image and get a Kannada voice explanation.</p>
              <div className="mt-auto grid grid-cols-2 gap-3">
                <button onClick={() => navigate('/scan-prescription', { state: { mode: 'camera' } })} className="w-full bg-[#00444b] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#003338] transition-colors shadow-md">
                  <span className="material-symbols-outlined text-[20px]">camera_alt</span>{t('capture') || 'Camera'}
                </button>
                <button onClick={() => navigate('/scan-prescription', { state: { mode: 'gallery' } })} className="w-full bg-white text-[#00444b] border-2 border-[#00444b]/10 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">upload_file</span>{t('upload') || 'Upload'}
                </button>
              </div>
            </div>
          </div>

          <div className="relative group overflow-hidden rounded-[24px] bg-white border border-slate-100 shadow-[0_8px_24px_-12px_rgba(0,93,103,0.05)] p-6 transition-all hover:shadow-lg">
            <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-bl-full -mr-6 -mt-6"></div>
            <div className="flex flex-col h-full relative z-10">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4"><span className="material-symbols-outlined text-secondary text-2xl">fact_check</span></div>
              <h3 className="font-h3 text-xl text-secondary mb-2 leading-tight">{t('medVerify') || 'Medicine Verify'}</h3>
              <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">Verify safety, check expiry, and fetch batch details of a medicine package.</p>
              <div className="mt-auto grid grid-cols-2 gap-3">
                <button onClick={() => navigate('/med-verification', { state: { mode: 'camera' } })} className="w-full bg-[#006c4b] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#00553b] transition-colors shadow-md">
                  <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>{t('capture') || 'Camera'}
                </button>
                <button onClick={() => navigate('/med-verification', { state: { mode: 'gallery' } })} className="w-full bg-white text-[#006c4b] border-2 border-[#006c4b]/10 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">upload</span>{t('upload') || 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <section className="space-y-stack_sm">
          <h3 className="font-h3 text-lg flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined">medical_information</span>{t('scannedMedicines')}
          </h3>
          <div className="space-y-3">
            {medicineCards.length === 0 ? (
              <div className="bg-white rounded-2xl p-4 border border-slate-100 text-on-surface-variant">{t('noVerificationData')}</div>
            ) : medicineCards.map((item, i) => {
              if (item.type === 'verification') {
                const st = item.status;
                const badge = st === 'GREEN' ? 'bg-secondary-container text-on-secondary-container' : st === 'YELLOW' ? 'bg-yellow-100 text-yellow-700' : 'bg-error-container text-error';
                return (
                  <div key={i} className="bg-white p-4 rounded-2xl shadow-[0_4px_16px_rgba(0,93,103,0.04)] border border-slate-50">
                    <div className="flex justify-between items-start gap-4">
                      <div><h4 className="font-bold text-body-lg text-on-surface leading-tight">{item.drug_name} <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded ml-2">Verification</span></h4><p className="text-on-surface-variant font-medium mt-1">{item.dosage}</p><p className="text-sm text-on-surface-variant mt-2">{item.reason}</p></div>
                      <span className={`${badge} text-[10px] px-2 py-0.5 rounded-full font-bold`}>{st}</span>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={i} className="bg-white p-4 rounded-2xl shadow-[0_4px_16px_rgba(0,93,103,0.04)] border border-slate-50">
                    <div className="flex justify-between items-start gap-4">
                      <div><h4 className="font-bold text-body-lg text-on-surface leading-tight">{item.drug_name} <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded ml-2">Prescription</span></h4><p className="text-on-surface-variant font-medium mt-1">{item.dosage} {item.frequency ? `• ${item.frequency}` : ''}</p><p className="text-sm text-on-surface-variant mt-2">{item.duration}</p></div>
                      <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Rx</span>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </section>

        <section className="space-y-stack_sm">
          <label className="font-label-caps text-on-surface-variant block ml-1 uppercase">{t('smsPreview')}</label>
          <div className="bg-slate-100 p-4 rounded-2xl border-2 border-dashed border-outline-variant font-body-md text-on-surface-variant italic whitespace-pre-line">{smsPreview || t('noVerificationData')}</div>
        </section>

        <button onClick={handleSendSms} className="w-full bg-[#005D67] text-white py-5 rounded-2xl font-h3 text-lg flex items-center justify-center gap-3 shadow-lg shadow-primary-container/20 transition-transform active:scale-[0.98] border-b-4 border-primary">
          <span className="material-symbols-outlined">send</span>{t('sendSms')}
        </button>

        <div className="flex justify-center pt-8 pb-12">
          <button onClick={handleLogout} className="flex items-center gap-2 text-outline hover:text-error transition-colors font-medium"><span className="material-symbols-outlined">logout</span>{t('logout')}</button>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-3 bg-white border-t border-slate-100 shadow-[0_-4px_16px_rgba(0,93,103,0.04)]">
        <button onClick={() => navigate('/')} className="flex flex-col items-center justify-center text-slate-500 px-4 py-1 active:scale-90 transition-transform"><span className="material-symbols-outlined">home</span><span className="font-manrope text-[12px] font-medium">{t('home')}</span></button>
        <button onClick={() => navigate('/asha-history')} className="flex flex-col items-center justify-center text-slate-500 px-4 py-1 active:scale-90 transition-transform"><span className="material-symbols-outlined">history</span><span className="font-manrope text-[12px] font-medium">{t('history')}</span></button>
        <button onClick={() => navigate('/med-verification')} className="flex flex-col items-center justify-center bg-teal-50 text-[#005D67] rounded-2xl px-4 py-1"><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>fact_check</span><span className="font-manrope text-[12px] font-bold">{t('verify')}</span></button>
        <button onClick={handleLogout} className="flex flex-col items-center justify-center text-slate-500 px-4 py-1"><span className="material-symbols-outlined">logout</span><span className="font-manrope text-[12px] font-medium">{t('logout')}</span></button>
      </nav>
    </div>
  );
}
