import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';
import useAshaSession from '../hooks/useAshaSession';

export default function AshaWorkerPage() {
  const navigate = useNavigate();
  const { session, clearSession } = useAshaSession();
  const [patientPhone, setPatientPhone] = useState('');
  const [status, setStatus] = useState({ message: '', isError: false });
  const [medicineCards, setMedicineCards] = useState([]);
  const [smsPreview, setSmsPreview] = useState('No verified medicine entries available yet for SMS.');

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
      setMedicineCards(vf);
      setSmsPreview(buildSmsPreview(vf, phone));
      setStatus({ message: 'Dashboard synced with Firebase data.', isError: false });
    } catch (err) { setStatus({ message: err.message, isError: true }); }
  }, [session, getCurrentPhone]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  function buildSmsPreview(verifications, phone) {
    if (!Array.isArray(verifications) || verifications.length === 0) return 'No verified medicine entries available yet for SMS.';
    const lines = verifications.slice(0, 3).map((item, i) => { const s = item.scan_result || {}; const v = item.verdict || {}; return (i + 1) + '. ' + (s.drug_name || 'Medicine') + ' - ' + (v.status || 'UNKNOWN'); });
    return 'Hello. Verified medicine update for patient ' + (phone || 'N/A') + ':\n' + lines.join('\n') + '\nPlease follow ASHA worker guidance.';
  }

  async function handlePhoneChange() {
    const phone = getCurrentPhone();
    if (phone.length !== 10) { setStatus({ message: 'Enter a valid 10-digit patient number.', isError: true }); return; }
    try {
      await fetch(API_BASE + '/asha/patients/upsert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nhm_id: session.nhm_id, phone, area: session.village || '' }) });
      await fetchDashboard();
    } catch (_err) { setStatus({ message: 'Patient context saved locally, but backend sync failed.', isError: true }); }
  }

  async function handleSendSms() {
    const phone = getCurrentPhone();
    if (phone.length !== 10) { setStatus({ message: 'Enter patient phone before sending SMS.', isError: true }); return; }
    if (!smsPreview.trim()) { setStatus({ message: 'No SMS content available to send.', isError: true }); return; }
    try {
      const res = await fetch(API_BASE + '/asha/workflows/send-sms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nhm_id: session.nhm_id, patient_phone: phone, message: smsPreview }) });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to queue SMS');
      setStatus({ message: 'SMS workflow logged in Firebase.', isError: false });
      await fetchDashboard();
    } catch (err) { setStatus({ message: err.message, isError: true }); }
  }

  function handleLogout() { clearSession(); navigate('/asha-login'); }

  if (!session) return null;

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen pb-24">
      <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-100 dark:border-slate-800 flex justify-between items-center w-full px-4 h-16 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border-2 border-primary-container">
            <img className="w-full h-full object-cover" alt="Worker" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcf7uGVt9Vze4vEC3HGE9qnvlKg4OZcxoZbbquwDQrirgLY40E7gua3yyWcNs-ofXT7KWOMxvpuqArVlGthaZohoAvfGumN7Y83UnnvQG0sDUVOyuzgvW8I7jHJrLlr84L7nN1W1x8Lp3zmdZCa03fh_gXmjoPEnC7n9gQQllGjccvYDKyn0AON7QKboDvYW8dZUBYcseN5QTxEFz4frJA2nIPleEb3T7hWJDmrC-0EvPYU1-mA3IUeTzceSIikIuU_xf4byJR0RE" />
          </div>
          <div>
            <p className="font-h3 text-base text-[#005D67] leading-none">{session.full_name || 'ASHA Worker'}</p>
            <p className="text-[10px] text-outline font-label-caps uppercase">{session.nhm_id || ''} • NHM ID</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-stack_md">
        <section className="space-y-stack_sm">
          <label className="font-label-caps text-on-surface-variant block ml-1">PATIENT PHONE NUMBER / ರೋಗಿಯ ಫೋನ್ ಸಂಖ್ಯೆ</label>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">call</span>
            <input value={patientPhone} onChange={e => setPatientPhone(e.target.value)} onBlur={handlePhoneChange} className="w-full h-[56px] pl-12 pr-4 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container focus:border-primary-container transition-all text-body-lg" placeholder="Enter 10 digit number" type="tel" />
          </div>
          {status.message && <p className={`text-sm ml-1 ${status.isError ? 'text-error' : 'text-secondary'}`}>{status.message}</p>}
        </section>

        <div className="grid grid-cols-2 gap-3 p-1 bg-surface-container rounded-2xl">
          <button onClick={() => navigate('/scan-prescription')} className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-body-md transition-all text-slate-500 hover:bg-white/50">
            <span className="material-symbols-outlined">document_scanner</span><span>Scan</span>
          </button>
          <button onClick={() => navigate('/med-verification')} className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-body-md transition-all bg-white text-[#005D67] shadow-sm">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>fact_check</span><span>Verify</span>
          </button>
        </div>

        <section className="space-y-stack_sm">
          <h3 className="font-h3 text-lg flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined">medical_information</span>Scanned Medicines / ಸ್ಕ್ಯಾನ್ ಮಾಡಿದ ಔಷಧಿಗಳು
          </h3>
          <div className="space-y-3">
            {medicineCards.length === 0 ? (
              <div className="bg-white rounded-2xl p-4 border border-slate-100 text-on-surface-variant">No verification data yet. Scan and verify medicine to see live results.</div>
            ) : medicineCards.map((item, i) => {
              const scan = item.scan_result || {};
              const verdict = item.verdict || {};
              const status = verdict.status || 'UNKNOWN';
              const badgeClass = status === 'GREEN' ? 'bg-secondary-container text-on-secondary-container' : status === 'YELLOW' ? 'bg-yellow-100 text-yellow-700' : 'bg-error-container text-error';
              return (
                <div key={i} className="bg-white p-4 rounded-2xl shadow-[0_4px_16px_rgba(0,93,103,0.04)] border border-slate-50">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-bold text-body-lg text-on-surface leading-tight">{scan.drug_name || 'Unknown Medicine'}</h4>
                      <p className="text-on-surface-variant font-medium mt-1">{scan.dosage || 'Dose not extracted'}</p>
                      <p className="text-sm text-on-surface-variant mt-2">{verdict.reason || 'No reason provided'}</p>
                    </div>
                    <span className={`${badgeClass} text-[10px] px-2 py-0.5 rounded-full font-bold`}>{status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-stack_sm">
          <label className="font-label-caps text-on-surface-variant block ml-1 uppercase">SMS Preview / ಸಂದೇಶದ ಮುನ್ನೋಟ</label>
          <div className="bg-slate-100 p-4 rounded-2xl border-2 border-dashed border-outline-variant font-body-md text-on-surface-variant italic whitespace-pre-line">{smsPreview}</div>
        </section>

        <button onClick={handleSendSms} className="w-full bg-[#005D67] text-white py-5 rounded-2xl font-h3 text-lg flex items-center justify-center gap-3 shadow-lg shadow-primary-container/20 transition-transform active:scale-[0.98] border-b-4 border-primary">
          <span className="material-symbols-outlined">send</span>Send SMS to Patient / ರೋಗಿಗೆ SMS ಕಳುಹಿಸಿ
        </button>

        <div className="flex justify-center pt-8 pb-12">
          <button onClick={handleLogout} className="flex items-center gap-2 text-outline hover:text-error transition-colors font-medium">
            <span className="material-symbols-outlined">logout</span>Logout / ನಿರ್ಗಮಿಸಿ
          </button>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-3 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_16px_rgba(0,93,103,0.04)]">
        <button onClick={() => navigate('/')} className="flex flex-col items-center justify-center text-slate-500 px-4 py-1 active:scale-90 transition-transform duration-200"><span className="material-symbols-outlined">home</span><span className="font-manrope text-[12px] font-medium">Home</span></button>
        <button className="flex flex-col items-center justify-center text-slate-500 px-4 py-1 active:scale-90 transition-transform duration-200"><span className="material-symbols-outlined">history</span><span className="font-manrope text-[12px] font-medium">History</span></button>
        <button onClick={() => navigate('/med-verification')} className="flex flex-col items-center justify-center bg-teal-50 dark:bg-teal-900/30 text-[#005D67] dark:text-teal-200 rounded-2xl px-4 py-1 active:scale-90 transition-transform duration-200"><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>fact_check</span><span className="font-manrope text-[12px] font-bold">Verify</span></button>
        <button onClick={handleLogout} className="flex flex-col items-center justify-center text-slate-500 px-4 py-1 active:scale-90 transition-transform duration-200"><span className="material-symbols-outlined">logout</span><span className="font-manrope text-[12px] font-medium">Logout</span></button>
      </nav>
    </div>
  );
}
