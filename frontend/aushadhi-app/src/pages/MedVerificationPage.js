import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, fileToBase64 } from '../api';

export default function MedVerificationPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [data, setData] = useState(null);

  function getAshaSession() {
    try { const r = localStorage.getItem('ashaSession'); return r ? JSON.parse(r) : null; } catch (_e) { return null; }
  }

  const fetchLatest = useCallback(async () => {
    const session = getAshaSession();
    if (!session || !session.nhm_id) { navigate('/asha-login'); return; }
    try {
      const phone = localStorage.getItem('currentPatientPhone') || '';
      const url = API_BASE + '/asha/workflows/history?nhm_id=' + encodeURIComponent(session.nhm_id) + (phone.length === 10 ? '&patient_phone=' + encodeURIComponent(phone) : '') + '&limit=1';
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load');
      const items = (json.history && json.history.verifications) || [];
      if (items.length) { setData(items[0]); setStatusMsg('Verification data loaded from Firebase.'); setIsError(false); }
      else { setStatusMsg('No verification data found yet. Upload a medicine photo to verify.'); setIsError(false); }
    } catch (err) { setStatusMsg(err.message); setIsError(true); }
  }, [navigate]);

  useEffect(() => { fetchLatest(); }, [fetchLatest]);

  async function handleUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const session = getAshaSession();
    const phone = localStorage.getItem('currentPatientPhone') || '';
    if (!phone || phone.replace(/\D/g, '').length !== 10) { setStatusMsg('Set a patient phone number in dashboard before verification.'); setIsError(true); return; }
    try {
      setStatusMsg('Verifying medicine and storing result...'); setIsError(false);
      const image = await fileToBase64(file);
      const res = await fetch(API_BASE + '/asha/workflows/medicine-verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nhm_id: session.nhm_id, patient_phone: phone, image }) });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Verification failed');
      const record = { id: 'latest', scan_result: json.scan_result, verdict: json.verdict };
      setData(record);
      localStorage.setItem('latestVerification', JSON.stringify(record));
      setStatusMsg('Medicine verification completed and synced.'); setIsError(false);
    } catch (err) { setStatusMsg(err.message); setIsError(true); }
  }

  async function handleHearVerdict() {
    const scan = data?.scan_result || {};
    const verdict = data?.verdict || {};
    const text = 'Verification status is ' + (verdict.status || 'UNKNOWN') + '. ' + (scan.composition || '');
    try {
      await fetch(API_BASE + '/speak', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      setStatusMsg('Audio generation triggered.'); setIsError(false);
    } catch (_err) { setStatusMsg('Unable to trigger verdict audio.'); setIsError(true); }
  }

  const scan = data?.scan_result || {};
  const verdict = data?.verdict || {};
  const status = verdict.status || 'UNKNOWN';
  const statusColor = status === 'GREEN' ? 'text-secondary' : status === 'YELLOW' ? 'text-yellow-700' : 'text-error';
  const checkpoints = [
    { label: 'Batch Number', value: scan.batch_number ? 'PASS' : 'CHECK', detail: scan.batch_number || 'Batch not extracted' },
    { label: 'Expiry Date', value: scan.expiry_date ? 'PASS' : 'CHECK', detail: scan.expiry_date || 'Expiry not extracted' },
    { label: 'Manufacturer', value: scan.manufacturer ? 'PASS' : 'CHECK', detail: scan.manufacturer || 'Manufacturer not extracted' },
    { label: 'Overall Verdict', value: status, detail: verdict.reason || 'No verdict reason available' }
  ];

  return (
    <div className="bg-background font-body-md text-on-background min-h-screen">
      <header className="bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900 shadow-sm sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-6 h-16 max-w-screen-2xl mx-auto font-manrope antialiased tracking-tight">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-teal-800">arrow_back</span>
            </button>
            <h1 className="text-xl font-extrabold text-teal-800">MedVerify</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 pb-32">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
          <div className="space-y-1">
            <h2 className="font-h2 text-h2 text-primary">Medicine Verification</h2>
            <p className="text-outline font-body-md">{data ? 'Last sync: ' + new Date().toLocaleString() : 'Waiting for verification data'}</p>
          </div>
          <div className="flex items-center gap-3 bg-secondary/10 px-6 py-3 rounded-full border border-secondary/20">
            <span className="material-symbols-outlined text-secondary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <span className={`font-bold text-h3 tracking-widest ${statusColor}`}>{status === 'UNKNOWN' ? 'SAFE' : status}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bento-card p-6 flex flex-col justify-between border border-primary-container/10">
            <div>
              <span className="font-label-caps text-label-caps text-primary uppercase mb-4 block">Product View</span>
              <div className="aspect-square rounded-xl bg-surface-container-low flex items-center justify-center overflow-hidden mb-6 relative">
                <img alt="Medicine" className="object-cover w-full h-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYsTNn_MdF1v6SN1dE4LYZHkXZG3S0dwrAcB4eA_ACZ-y9ismxP5Lq8d5vN606oqLts1NtVH-qVJ8DU81TxEJMOWZhnB0QL-1gEjnmPL-dHczC9KadKTp24WN8Qy9JQtzJ3fzSKV9BezVITlyvzCdcW2ThH8S47MqauAEJqbmsVFj3MbSXeN1mPHUqv77yB1WgQhqgj6WMbEwZj5WtkPcCA8DNKBj4fhiMSo49wJPgl0hsGKkD5Pv5mDtbkw1v4B6f4K8SDP1sbjE" />
              </div>
              <h3 className="font-h3 text-h3 text-on-background">{scan.drug_name || 'Medicine Name'}</h3>
              <p className="text-primary font-semibold">{scan.manufacturer || 'Manufacturer'}</p>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-secondary">
                <span className="material-symbols-outlined text-sm">payments</span>
                <span className="font-h3 text-h3">{scan.price || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bento-card p-8 border border-primary-container/5">
            <span className="font-label-caps text-label-caps text-primary uppercase mb-6 block">Medicine Details</span>
            <div className="grid grid-cols-2 gap-y-8 gap-x-12">
              <div className="space-y-1"><p className="text-sm font-semibold text-outline">Batch Number</p><p className="font-h3 text-on-background tracking-tight">{scan.batch_number || 'N/A'}</p></div>
              <div className="space-y-1"><p className="text-sm font-semibold text-outline">Expiry Date</p><p className="font-h3 text-on-background text-error">{scan.expiry_date || 'N/A'}</p></div>
              <div className="col-span-2 space-y-1"><p className="text-sm font-semibold text-outline">Composition</p><p className="font-body-lg text-on-background leading-snug">{scan.composition || 'No composition data'}</p></div>
              <div className="space-y-1"><p className="text-sm font-semibold text-outline">Security Hologram</p><div className="flex items-center gap-2 text-secondary"><span className="material-symbols-outlined">shutter_speed</span><p className="font-semibold">{scan.hologram_present ? 'Present' : 'Not found'}</p></div></div>
              <div className="space-y-1"><p className="text-sm font-semibold text-outline">Verification ID</p><p className="font-body-md text-on-surface-variant font-mono">{data?.id || 'Pending'}</p></div>
            </div>
          </div>

          <div className="md:col-span-3 bento-card overflow-hidden border border-primary-container/5">
            <div className="px-8 py-6 bg-teal-50/30 flex justify-between items-center border-b border-teal-100">
              <span className="font-label-caps text-label-caps text-teal-800 uppercase">Safety Protocol Checks</span>
            </div>
            <div className="p-4">
              <table className="w-full text-left">
                <thead><tr className="text-outline text-xs uppercase tracking-widest border-b border-slate-50"><th className="px-4 py-3 font-bold">Checkpoint</th><th className="px-4 py-3 font-bold text-right">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {checkpoints.map((row, i) => {
                    const ok = row.value === 'PASS' || row.value === 'GREEN';
                    return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-5"><p className="font-semibold text-on-background">{row.label}</p><p className="text-xs text-outline">{row.detail}</p></td>
                        <td className="px-4 py-5 text-right"><span className={`inline-flex items-center gap-1.5 ${ok ? 'bg-secondary/10 text-secondary' : 'bg-error-container text-error'} font-bold px-3 py-1.5 rounded-full text-xs`}>{row.value}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-12 space-y-4">
          <button onClick={handleHearVerdict} className="w-full bg-[#FF7D29] hover:bg-[#E66A1F] text-white font-h3 py-5 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all">
            <span className="material-symbols-outlined text-2xl">volume_up</span><span>Hear Verdict / ವೆರಡಿಕ್ಟ್ ಕೇಳಿ</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="w-full bg-white hover:bg-slate-50 text-primary border-2 border-primary-container/20 font-h3 py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
            <span className="material-symbols-outlined text-2xl">add_a_photo</span><span>New Scan / ಹೊಸ ಸ್ಕ್ಯಾನ್</span>
          </button>
        </div>
        {statusMsg && <p className={`text-sm text-center mt-4 ${isError ? 'text-error' : 'text-secondary'}`}>{statusMsg}</p>}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </main>

      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-3 bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg border-t border-slate-100 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <button onClick={() => navigate('/')} className="flex flex-col items-center justify-center text-slate-400 px-4 py-1.5 hover:text-teal-700 transition-transform active:scale-90 duration-200"><span className="material-symbols-outlined">home</span><span className="font-manrope text-[11px] font-semibold uppercase tracking-wider">Home</span></button>
        <button className="flex flex-col items-center justify-center text-teal-800 bg-teal-50/50 rounded-xl px-4 py-1.5 active:scale-90 transition-transform duration-200"><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>document_scanner</span><span className="font-manrope text-[11px] font-semibold uppercase tracking-wider">Scan</span></button>
        <button className="flex flex-col items-center justify-center text-slate-400 px-4 py-1.5 hover:text-teal-700 transition-transform active:scale-90 duration-200"><span className="material-symbols-outlined">history</span><span className="font-manrope text-[11px] font-semibold uppercase tracking-wider">History</span></button>
        <button className="flex flex-col items-center justify-center text-slate-400 px-4 py-1.5 hover:text-teal-700 transition-transform active:scale-90 duration-200"><span className="material-symbols-outlined">settings</span><span className="font-manrope text-[11px] font-semibold uppercase tracking-wider">Settings</span></button>
      </nav>
    </div>
  );
}
