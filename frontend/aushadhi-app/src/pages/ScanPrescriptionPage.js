import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, fileToBase64 } from '../api';

export default function ScanPrescriptionPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [resultData, setResultData] = useState(null);

  // Determine flow based on localStorage
  function getAshaSession() {
    try {
      const raw = localStorage.getItem('ashaSession');
      return raw ? JSON.parse(raw) : null;
    } catch (_e) { return null; }
  }

  function setStatus(msg, err) { setStatusMsg(msg); setIsError(err); }

  async function uploadPrescription(file) {
    setLoading(true); setStatus('Processing prescription...', false);
    try {
      const base64 = await fileToBase64(file);
      const ashaSession = getAshaSession();
      const isAshaFlow = ashaSession && ashaSession.nhm_id;
      let response, json;

      if (isAshaFlow) {
        const patientPhone = localStorage.getItem('currentPatientPhone') || '';
        if (patientPhone.replace(/\D/g, '').length !== 10) { setStatus('Please set a patient phone number in ASHA dashboard first.', true); setLoading(false); return; }
        response = await fetch(API_BASE + '/asha/workflows/prescription-scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nhm_id: ashaSession.nhm_id, patient_phone: patientPhone, image: base64 }) });
      } else {
        response = await fetch(API_BASE + '/read-prescription', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64 }) });
      }

      json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || 'Unable to process prescription.');
      localStorage.setItem('latestPrescription', JSON.stringify(json));

      if (isAshaFlow) {
        setStatus('Prescription processed successfully. Returning to dashboard...', false);
        setTimeout(() => navigate('/asha-worker'), 600);
      } else {
        setResultData(json);
        setShowResults(true);
        setStatus('', false);
      }
    } catch (err) { setStatus(err.message || 'Unable to process prescription.', true); }
    finally { setLoading(false); }
  }

  function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    uploadPrescription(file);
    e.target.value = '';
  }

  function handleScanAgain() {
    setShowResults(false);
    setResultData(null);
    setStatus('', false);
  }

  // Render results
  function renderResults() {
    if (!resultData) return null;
    const rx = resultData.prescription || {};
    const meds = rx.medicines || rx.medications || [];
    return (
      <div className="fixed inset-0 z-40 bg-background overflow-y-auto pb-20">
        <div className="max-w-lg mx-auto px-4 py-6 pb-28">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-h2 text-h2 text-primary">Result</h2>
            <button onClick={() => navigate('/')} className="px-5 py-2 bg-[#005D67] text-white rounded-lg font-manrope font-semibold text-sm hover:opacity-90 transition-all">Home</button>
          </div>
          <div className="mb-6">
            <h3 className="font-h3 text-h3 text-on-surface mb-3">Prescription Details</h3>
            <div className="space-y-3">
              {meds.length === 0 ? (
                <p className="text-on-surface-variant text-sm">No medicines were detected in this prescription.</p>
              ) : meds.map((m, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="font-manrope font-bold text-on-surface">{m.name || m.medicine_name || 'Unknown'}</p>
                  {(m.dosage || m.dose) && <p className="text-sm text-on-surface-variant">Dosage: {m.dosage || m.dose}</p>}
                  {m.frequency && <p className="text-sm text-on-surface-variant">Frequency: {m.frequency}</p>}
                  {m.duration && <p className="text-sm text-on-surface-variant">Duration: {m.duration}</p>}
                </div>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-5">
              <h4 className="font-manrope font-bold text-on-surface mb-3">Kannada Explanation</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">{resultData.kannada_explanation || 'No explanation available.'}</p>
              {resultData.kannada_explanation_audio_path && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800 break-all">Audio saved at: {resultData.kannada_explanation_audio_path}</div>
              )}
            </div>
          </div>
          {resultData.kannada_explanation_audio && (
            <div className="mb-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h4 className="font-manrope font-bold text-on-surface mb-3">Kannada Audio</h4>
                <audio controls className="w-full" src={`data:audio/mp3;base64,${resultData.kannada_explanation_audio}`}></audio>
              </div>
            </div>
          )}
          <button onClick={handleScanAgain} className="w-full py-3 bg-primary text-white font-manrope font-bold rounded-xl hover:opacity-90 transition-all">Scan Another Prescription</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-[0_16px_32px_-12px_rgba(0,93,103,0.04)] fixed top-0 w-full z-50 flex justify-between items-center px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-95 duration-150">
            <span className="material-symbols-outlined text-[#005D67]">arrow_back</span>
          </button>
          <h1 className="font-manrope text-lg font-bold tracking-tight text-[#005D67]">Scan Prescription</h1>
        </div>
      </header>

      <main className="mt-16 flex-grow flex flex-col items-center justify-center px-4 py-8">
        <section className="w-full max-w-md">
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-slate-900 shadow-xl border-4 border-white mb-6">
            <img className="w-full h-full object-cover opacity-50" alt="Scanner" src="https://lh3.googleusercontent.com/aida-public/AB6AXuADJt1KyZtfRTaFoxqVjuIL_eFz3FmIxMN5oJpXh3gHI5H3SZhk3O7dxFb2UtNK2q1bnR8_g1IIFYq3p-v8IwIFy7PpxCwkwdl84Rl7h-XmPDjMNt0H9Ld1K2R8UgGSBklrLcEwNjvwfbwA5Y-W_B2r0cMjxEsatG4pzlnJl10b2NjJL3iJCXLk5bHLcDy_-5a-7Fz5k9SxbvJLN5RtHbTZmyR1vc4j7fvXSqiJNq1X_xFnHpRiOxjV63rWRKsI0mUMaWnL7m4" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div className="relative w-full h-full border-2 border-dashed border-secondary-fixed/50 rounded-2xl">
                <div className="scanner-line absolute w-full left-0"></div>
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-secondary-fixed rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-secondary-fixed rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-secondary-fixed rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-secondary-fixed rounded-br-lg"></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <button disabled={loading} onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 py-4 px-6 bg-[#005D67] text-white rounded-2xl font-manrope font-bold shadow-lg active:scale-95 transition-all">
              <span className="material-symbols-outlined">photo_camera</span>Capture
            </button>
            <button disabled={loading} onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 py-4 px-6 bg-secondary text-white rounded-2xl font-manrope font-bold shadow-lg active:scale-95 transition-all">
              <span className="material-symbols-outlined">upload</span>Upload
            </button>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          {loading && (
            <div className="text-center py-4">
              <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
              <p className="text-sm text-on-surface-variant mt-2">Processing...</p>
            </div>
          )}
          {statusMsg && <p className={`text-center text-sm mt-2 ${isError ? 'text-error' : 'text-secondary'}`}>{statusMsg}</p>}
        </section>
      </main>

      {showResults && renderResults()}

      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center h-20 px-4 pb-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-t-2xl border-t border-slate-100 dark:border-slate-800 shadow-[0_-8px_24px_-10px_rgba(0,0,0,0.08)] z-50">
        <button onClick={() => navigate('/')} className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-5 py-1.5 hover:text-[#005D67] transition-colors"><span className="material-symbols-outlined">home</span><span className="font-manrope text-[11px] font-semibold">Home</span></button>
        <button className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-5 py-1.5"><span className="material-symbols-outlined">medical_services</span><span className="font-manrope text-[11px] font-semibold">Health</span></button>
        <button className="flex flex-col items-center justify-center bg-[#005D67]/10 dark:bg-teal-900/30 text-[#005D67] dark:text-teal-300 rounded-xl px-5 py-1.5"><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>document_scanner</span><span className="font-manrope text-[11px] font-semibold">Scan</span></button>
        <button className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-5 py-1.5"><span className="material-symbols-outlined">person</span><span className="font-manrope text-[11px] font-semibold">Profile</span></button>
      </nav>
    </div>
  );
}
