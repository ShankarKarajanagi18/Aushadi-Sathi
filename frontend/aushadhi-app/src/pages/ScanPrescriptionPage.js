import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE, fileToBase64 } from '../api';
import { useLang } from '../i18n/LanguageContext';
import T from '../i18n/translations';
import LoadingFacts from '../LoadingFacts';

export default function ScanPrescriptionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.state?.mode;
  const { lang } = useLang();
  const t = (key) => (T[key] && T[key][lang]) || T[key]?.en || key;
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const galleryInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  function getAshaSession() { try { const r = localStorage.getItem('ashaSession'); return r ? JSON.parse(r) : null; } catch (_e) { return null; } }

  async function uploadPrescription(file) {
    setLoading(true); setStatusMsg(t('processingPrescription')); setIsError(false);
    try {
      const base64 = await fileToBase64(file);
      const ashaSession = getAshaSession();
      const isAshaFlow = ashaSession && ashaSession.nhm_id;
      let response, json;
      if (isAshaFlow) {
        const patientPhone = localStorage.getItem('currentPatientPhone') || '';
        if (patientPhone.replace(/\D/g, '').length !== 10) { setStatusMsg('Please set a patient phone number in ASHA dashboard first.'); setIsError(true); setLoading(false); return; }
        response = await fetch(API_BASE + '/asha/workflows/prescription-scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nhm_id: ashaSession.nhm_id, patient_phone: patientPhone, image: base64, language: lang }) });
      } else {
        response = await fetch(API_BASE + '/read-prescription', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64, language: lang }) });
      }
      json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || 'Unable to process prescription.');
      localStorage.setItem('latestPrescription', JSON.stringify(json));
      if (isAshaFlow) { setStatusMsg('Success. Returning to dashboard...'); setIsError(false); setTimeout(() => navigate('/asha-worker'), 600); }
      else { setResultData(json); setShowResults(true); setStatusMsg(''); }
    } catch (err) { setStatusMsg(err.message); setIsError(true); }
    finally { setLoading(false); }
  }

  function handleFileChange(e) { const file = e.target.files && e.target.files[0]; if (!file) return; uploadPrescription(file); e.target.value = ''; }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      }, 100);
    } catch (err) {
      setStatusMsg('Camera access denied or unavailable.'); setIsError(true);
    }
  }

  function stopCamera() {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  }

  function capturePhoto() {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
          stopCamera();
          uploadPrescription(file);
        }
      }, 'image/jpeg');
    }
  }

  function renderResults() {
    if (!resultData) return null;
    const rx = resultData.prescription || {};
    const meds = rx.medicines || rx.medications || [];
    return (
      <div className="fixed inset-0 z-40 bg-background overflow-y-auto pb-20">
        <div className="max-w-lg mx-auto px-4 py-6 pb-28">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-h2 text-h2 text-primary">{t('result')}</h2>
            <button onClick={() => navigate('/')} className="px-5 py-2 bg-[#005D67] text-white rounded-lg font-manrope font-semibold text-sm">{t('home')}</button>
          </div>
          <div className="mb-6">
            <h3 className="font-h3 text-h3 text-on-surface mb-3">{t('prescriptionDetails')}</h3>
            <div className="space-y-3">
              {meds.length === 0 ? <p className="text-on-surface-variant text-sm">{t('noMedicinesDetected')}</p> : meds.map((m, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="font-manrope font-bold text-on-surface">{m.name || m.medicine_name || 'Unknown'}</p>
                  {(m.dosage || m.dose) && <p className="text-sm text-on-surface-variant">{t('dosage')}: {m.dosage || m.dose}</p>}
                  {m.frequency && <p className="text-sm text-on-surface-variant">{t('frequency')}: {m.frequency}</p>}
                  {m.duration && <p className="text-sm text-on-surface-variant">{t('duration')}: {m.duration}</p>}
                </div>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-5">
              <h4 className="font-manrope font-bold text-on-surface mb-3">{lang === 'en' ? 'Explanation' : t('kannadaExplanation')}</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">{lang === 'en' ? (resultData.explanation || t('noExplanation')) : (resultData.kannada_explanation || t('noExplanation'))}</p>
            </div>
          </div>
          {(lang === 'en' ? resultData.explanation_audio : resultData.kannada_explanation_audio) && (
            <div className="mb-6"><div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"><h4 className="font-manrope font-bold text-on-surface mb-3">{lang === 'en' ? 'Audio Guide' : t('kannadaAudio')}</h4><audio controls className="w-full" src={`data:audio/mp3;base64,${lang === 'en' ? resultData.explanation_audio : resultData.kannada_explanation_audio}`}></audio></div></div>
          )}
          <button onClick={() => { setShowResults(false); setResultData(null); }} className="w-full py-3 bg-primary text-white font-manrope font-bold rounded-xl">{t('scanAnother')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-100 shadow-[0_16px_32px_-12px_rgba(0,93,103,0.04)] fixed top-0 w-full z-50 flex justify-between items-center px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 active:scale-95"><span className="material-symbols-outlined text-[#005D67]">arrow_back</span></button>
          <h1 className="font-manrope text-lg font-bold tracking-tight text-[#005D67]">{t('scanPrescription')}</h1>
        </div>
      </header>

      <main className="mt-16 flex-grow flex flex-col items-center px-4 py-8 overflow-y-auto">
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

          {showCamera && (
            <div className="fixed inset-0 z-50 bg-black flex flex-col">
              <div className="flex justify-between items-center p-4 bg-black/50 text-white absolute top-0 w-full z-10">
                <button onClick={stopCamera} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30"><span className="material-symbols-outlined">close</span></button>
                <h3 className="font-bold">Take Photo</h3>
                <div className="w-10"></div>
              </div>
              <div className="flex-grow flex items-center justify-center bg-black relative">
                <video ref={videoRef} playsInline className="w-full h-full object-cover"></video>
                <div className="absolute inset-0 pointer-events-none border-[6px] border-black/30"></div>
                <div className="absolute inset-0 pointer-events-none border-2 border-white/50 m-8 rounded-2xl"></div>
              </div>
              <div className="h-32 bg-black flex items-center justify-center pb-8">
                <button onClick={capturePhoto} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"><div className="w-16 h-16 bg-white rounded-full"></div></button>
              </div>
              <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
          )}

          <div className={`grid ${(!mode || (mode !== 'camera' && mode !== 'gallery')) ? 'grid-cols-2' : 'grid-cols-1'} gap-4 mb-6`}>
            {(!mode || mode === 'camera') && (
              <button disabled={loading} onClick={startCamera} className="flex items-center justify-center gap-2 py-4 px-6 bg-[#005D67] text-white rounded-2xl font-manrope font-bold shadow-lg active:scale-95 transition-all"><span className="material-symbols-outlined">photo_camera</span>{t('capture')}</button>
            )}
            {(!mode || mode === 'gallery') && (
              <button disabled={loading} onClick={() => galleryInputRef.current?.click()} className="flex items-center justify-center gap-2 py-4 px-6 bg-secondary text-white rounded-2xl font-manrope font-bold shadow-lg active:scale-95 transition-all"><span className="material-symbols-outlined">upload</span>{t('upload')}</button>
            )}
          </div>
          <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          {loading && <LoadingFacts />}
          {!loading && statusMsg && <p className={`text-center text-sm mt-2 ${isError ? 'text-error' : 'text-secondary'}`}>{statusMsg}</p>}
        </section>
      </main>
      {showResults && renderResults()}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center h-20 px-4 pb-2 bg-white/95 backdrop-blur-md rounded-t-2xl border-t border-slate-100 shadow-[0_-8px_24px_-10px_rgba(0,0,0,0.08)] z-50">
        <button onClick={() => navigate('/')} className="flex flex-col items-center justify-center text-slate-400 px-5 py-1.5"><span className="material-symbols-outlined">home</span><span className="font-manrope text-[11px] font-semibold">{t('home')}</span></button>
        <button className="flex flex-col items-center justify-center text-slate-400 px-5 py-1.5"><span className="material-symbols-outlined">medical_services</span><span className="font-manrope text-[11px] font-semibold">{t('health')}</span></button>
        <button className="flex flex-col items-center justify-center bg-[#005D67]/10 text-[#005D67] rounded-xl px-5 py-1.5"><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>document_scanner</span><span className="font-manrope text-[11px] font-semibold">{t('scan')}</span></button>
        <button onClick={() => navigate('/asha-history')} className="flex flex-col items-center text-slate-400 px-4 py-1.5 active:scale-95"><span className="material-symbols-outlined">history</span><span className="font-manrope text-[11px] font-semibold uppercase">{t('history')}</span></button>
      </nav>
    </div>
  );
}
