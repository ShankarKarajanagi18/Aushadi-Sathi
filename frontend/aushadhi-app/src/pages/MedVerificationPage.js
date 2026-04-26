import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE, fileToBase64 } from '../api';
import { useLang } from '../i18n/LanguageContext';
import T from '../i18n/translations';
import LoadingFacts from '../LoadingFacts';

export default function MedVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.state?.mode;
  const { lang } = useLang();
  const t = (key) => (T[key] && T[key][lang]) || T[key]?.en || key;
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  function getAshaSession() { try { const r = localStorage.getItem('ashaSession'); return r ? JSON.parse(r) : null; } catch (_e) { return null; } }

  useEffect(() => {
    if (data && data.verdict && data.verdict.status === 'RED') {
      try {
        if ('vibrate' in navigator) {
          navigator.vibrate([500, 250, 500, 250, 500, 250, 500, 250, 500]);
        }
      } catch (e) { }

      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'square';
          osc.connect(gain);
          gain.connect(ctx.destination);

          const now = ctx.currentTime;
          for (let i = 0; i < 3; i++) {
            osc.frequency.setValueAtTime(800, now + i);
            osc.frequency.setValueAtTime(600, now + i + 0.5);
          }

          gain.gain.setValueAtTime(0.05, now);
          osc.start(now);
          osc.stop(now + 3);
        }
      } catch (e) { console.error("Audio siren failed", e); }
    }
  }, [data]);

  async function handleUpload(e) {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    processFile(file);
    e.target.value = '';
  }

  async function processFile(file) {
    const session = getAshaSession();
    const isAshaFlow = session && session.nhm_id;

    try {
      setStatusMsg('Verifying...'); setIsError(false); setLoading(true);
      const image = await fileToBase64(file);
      let res, json;

      if (isAshaFlow) {
        const phone = localStorage.getItem('currentPatientPhone') || '';
        if (!phone || phone.replace(/\D/g, '').length !== 10) { setStatusMsg('Set a patient phone number in dashboard first.'); setIsError(true); return; }
        res = await fetch(API_BASE + '/asha/workflows/medicine-verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nhm_id: session.nhm_id, patient_phone: phone, image, language: lang }) });
      } else {
        res = await fetch(API_BASE + '/verify-medicine', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image, language: lang }) });
      }

      json = await res.json(); if (!res.ok || !json.success) throw new Error(json.error || 'Failed');
      const record = {
        id: 'latest',
        image: image,
        scan_result: json.scan_result,
        verdict: json.verdict,
        kannada_explanation: json.kannada_explanation,
        kannada_explanation_audio: json.kannada_explanation_audio,
        explanation: json.explanation,
        explanation_audio: json.explanation_audio
      };
      setData(record);
      if (isAshaFlow) localStorage.setItem('latestVerification', JSON.stringify(record));
      setStatusMsg('Completed.'); setIsError(false);
    } catch (err) { setStatusMsg(err.message); setIsError(true); }
    finally { setLoading(false); }
  }

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
          processFile(file);
        }
      }, 'image/jpeg');
    }
  }

  async function handleHearVerdict() {
    if (data?.kannada_explanation_audio) {
      setStatusMsg('Audio is already available above.');
      return;
    }
    const scan = data?.scan_result || {}; const verdict = data?.verdict || {};
    try {
      const res = await fetch(API_BASE + '/speak', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: data?.explanation || data?.kannada_explanation || 'Verification status is ' + (verdict.status || 'UNKNOWN') + '. ' + (scan.composition || '') }) });
      const json = await res.json();
      if (json.audio) {
        setData(prev => ({ ...prev, kannada_explanation_audio: json.audio }));
        setStatusMsg('Audio generated.');
        setIsError(false);
      } else {
        setStatusMsg('Audio failed.'); setIsError(true);
      }
    } catch (_err) { setStatusMsg('Audio failed.'); setIsError(true); }
  }

  const scan = data?.scan_result || {}; const verdict = data?.verdict || {};
  const st = verdict.status || 'UNKNOWN';
  const isRed = st === 'RED';
  const stColor = st === 'GREEN' ? 'text-secondary' : st === 'YELLOW' ? 'text-yellow-700' : (isRed ? 'text-red-600' : 'text-error');
  const isExpired = verdict.reason === "Medicine is expired";
  const isBatchBad = verdict.reason === "This batch is in CDSCO's fake/substandard drug list";

  const checks = [
    { label: t('batchNumber'), value: isBatchBad ? 'FAIL' : (scan.batch_number ? 'PASS' : 'CHECK'), detail: scan.batch_number || 'N/A' },
    { label: t('expiryDate'), value: isExpired ? 'FAIL' : (scan.expiry_date ? 'PASS' : 'CHECK'), detail: scan.expiry_date || 'N/A' },
    { label: t('manufacturer'), value: scan.manufacturer ? 'PASS' : 'CHECK', detail: scan.manufacturer || 'N/A' },
    { label: 'Overall', value: st, detail: verdict.reason || 'N/A' }
  ];

  return (
    <div className="bg-background font-body-md text-on-background min-h-screen">
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-6 h-16 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 active:scale-95"><span className="material-symbols-outlined text-teal-800">arrow_back</span></button>
            <h1 className="text-xl font-extrabold text-teal-800">{t('medVerify')}</h1>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-10 pb-32">
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

        {!data ? (
          <div className="flex flex-col items-center max-w-md mx-auto pt-4">
            <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden bg-slate-900 shadow-xl border-4 border-white mb-8">
              <img className="w-full h-full object-cover opacity-50" alt="Scanner" src="https://lh3.googleusercontent.com/aida-public/AB6AXuADJt1KyZtfRTaFoxqVjuIL_eFz3FmIxMN5oJpXh3gHI5H3SZhk3O7dxFb2UtNK2q1bnR8_g1IIFYq3p-v8IwIFy7PpxCwkwdl84Rl7h-XmPDjMNt0H9Ld1K2R8UgGSBklrLcEwNjvwfbwA5Y-W_B2r0cMjxEsatG4pzlnJl10b2NjJL3iJCXLk5bHLcDy_-5a-7Fz5k9SxbvJLN5RtHbTZmyR1vc4j7fvXSqiJNq1X_xFnHpRiOxjV63rWRKsI0mUMaWnL7m4" />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <div className="relative w-full h-full border-2 border-dashed border-secondary-fixed/50 rounded-2xl">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-secondary-fixed rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-secondary-fixed rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-secondary-fixed rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-secondary-fixed rounded-br-lg"></div>
                </div>
              </div>
            </div>
            <div className={`grid ${(!mode || (mode !== 'camera' && mode !== 'gallery')) ? 'grid-cols-2' : 'grid-cols-1'} gap-4 w-full`}>
              {(!mode || mode === 'camera') && (
                <button onClick={startCamera} className="w-full bg-[#005D67] text-white font-h3 py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all"><span className="material-symbols-outlined text-2xl">photo_camera</span>{t('capture')}</button>
              )}
              {(!mode || mode === 'gallery') && (
                <button onClick={() => galleryInputRef.current?.click()} className="w-full bg-secondary text-white font-h3 py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all"><span className="material-symbols-outlined text-2xl">upload_file</span>{t('upload')}</button>
              )}
            </div>
            {loading && <LoadingFacts />}
            {!loading && statusMsg && <p className={`text-sm text-center mt-6 ${isError ? 'text-error' : 'text-secondary'}`}>{statusMsg}</p>}
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
              <div className="space-y-1"><h2 className="font-h2 text-h2 text-primary">{t('result')}</h2></div>
              <div className={`flex items-center gap-3 px-6 py-3 rounded-full border ${isRed ? 'bg-red-100 border-red-500 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-secondary/10 border-secondary/20'}`}>
                <span className={`material-symbols-outlined text-[32px] ${isRed ? 'text-red-600' : 'text-secondary'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {isRed ? 'warning' : 'verified'}
                </span>
                <span className={`font-bold text-h3 tracking-widest ${stColor}`}>{st === 'UNKNOWN' ? 'SAFE' : st}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 bento-card p-6 flex flex-col justify-between border border-primary-container/10">
                <div>
                  <span className="font-label-caps text-label-caps text-primary uppercase mb-4 block">{t('productView')}</span>
                  <div className="aspect-square rounded-xl bg-surface-container-low flex items-center justify-center overflow-hidden mb-6"><img alt="Medicine" className="object-cover w-full h-full" src={data.image ? `data:image/jpeg;base64,${data.image}` : "https://lh3.googleusercontent.com/aida-public/AB6AXuCYsTNn_MdF1v6SN1dE4LYZHkXZG3S0dwrAcB4eA_ACZ-y9ismxP5Lq8d5vN606oqLts1NtVH-qVJ8DU81TxEJMOWZhnB0QL-1gEjnmPL-dHczC9KadKTp24WN8Qy9JQtzJ3fzSKV9BezVITlyvzCdcW2ThH8S47MqauAEJqbmsVFj3MbSXeN1mPHUqv77yB1WgQhqgj6WMbEwZj5WtkPcCA8DNKBj4fhiMSo49wJPgl0hsGKkD5Pv5mDtbkw1v4B6f4K8SDP1sbjE"} /></div>
                  <h3 className="font-h3 text-h3 text-on-background">{scan.drug_name || 'Medicine'}</h3>
                  <p className="text-primary font-semibold">{scan.manufacturer || t('manufacturer')}</p>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100"><div className="flex items-center gap-2 text-secondary"><span className="material-symbols-outlined text-sm">payments</span><span className="font-h3 text-h3">{scan.price || 'N/A'}</span></div></div>
              </div>
              <div className="md:col-span-2 bento-card p-8 border border-primary-container/5">
                <span className="font-label-caps text-label-caps text-primary uppercase mb-6 block">{t('medicineDetails')}</span>
                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                  <div className="space-y-1"><p className="text-sm font-semibold text-outline">{t('batchNumber')}</p><p className="font-h3 text-on-background">{scan.batch_number || 'N/A'}</p></div>
                  <div className="space-y-1"><p className="text-sm font-semibold text-outline">{t('expiryDate')}</p><p className="font-h3 text-on-background text-error">{scan.expiry_date || 'N/A'}</p></div>
                  <div className="col-span-2 space-y-1"><p className="text-sm font-semibold text-outline">{t('composition')}</p><p className="font-body-lg text-on-background">{scan.composition || 'N/A'}</p></div>
                  <div className="space-y-1"><p className="text-sm font-semibold text-outline">{t('securityHologram')}</p><div className="flex items-center gap-2 text-secondary"><span className="material-symbols-outlined">shutter_speed</span><p className="font-semibold">{scan.hologram_present ? t('present') : t('notFound')}</p></div></div>
                  <div className="space-y-1"><p className="text-sm font-semibold text-outline">{t('verificationId')}</p><p className="font-body-md text-on-surface-variant font-mono">{data?.id || 'Pending'}</p></div>
                </div>
              </div>
              <div className="md:col-span-3 bento-card overflow-hidden border border-primary-container/5">
                <div className="px-8 py-6 bg-teal-50/30 flex justify-between items-center border-b border-teal-100"><span className="font-label-caps text-label-caps text-teal-800 uppercase">{t('safetyChecks')}</span></div>
                <div className="p-4">
                  <table className="w-full text-left"><thead><tr className="text-outline text-xs uppercase tracking-widest border-b border-slate-50"><th className="px-4 py-3 font-bold">{t('checkpoint')}</th><th className="px-4 py-3 font-bold text-right">{t('status')}</th></tr></thead>
                    <tbody className="divide-y divide-slate-50">{checks.map((row, i) => { const ok = row.value === 'PASS' || row.value === 'GREEN'; return (<tr key={i} className="hover:bg-slate-50"><td className="px-4 py-5"><p className="font-semibold text-on-background">{row.label}</p><p className="text-xs text-outline">{row.detail}</p></td><td className="px-4 py-5 text-right"><span className={`inline-flex items-center gap-1.5 ${ok ? 'bg-secondary/10 text-secondary' : 'bg-error-container text-error'} font-bold px-3 py-1.5 rounded-full text-xs`}>{row.value}</span></td></tr>); })}</tbody></table>
                </div>
              </div>
            </div>

            {(data.explanation || data.kannada_explanation || data.explanation_audio || data.kannada_explanation_audio) && (
              <div className="mt-8 space-y-4">
                {(lang === 'en' ? data.explanation : data.kannada_explanation) && (
                  <div className="bg-slate-100 border border-slate-200 rounded-xl p-5">
                    <h4 className="font-manrope font-bold text-on-surface mb-3">{lang === 'en' ? 'Explanation' : t('kannadaExplanation')}</h4>
                    <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">{lang === 'en' ? data.explanation : data.kannada_explanation}</p>
                  </div>
                )}
                {(lang === 'en' ? data.explanation_audio : data.kannada_explanation_audio) && (
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <h4 className="font-manrope font-bold text-on-surface mb-3">{lang === 'en' ? 'Audio Guide' : t('kannadaAudio')}</h4>
                    <audio controls className="w-full" src={`data:audio/mp3;base64,${lang === 'en' ? data.explanation_audio : data.kannada_explanation_audio}`}></audio>
                  </div>
                )}
              </div>
            )}

            <div className="mt-12 space-y-4">
              {!(lang === 'en' ? data.explanation_audio : data.kannada_explanation_audio) && (
                <button onClick={handleHearVerdict} className="w-full bg-[#FF7D29] hover:bg-[#E66A1F] text-white font-h3 py-5 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all"><span className="material-symbols-outlined text-2xl">volume_up</span>{t('hearVerdict')}</button>
              )}
              <button onClick={() => { setData(null); setStatusMsg(''); }} className="w-full bg-white border-2 border-primary/20 text-primary hover:bg-slate-50 font-h3 py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
                {t('scanAnother') || 'Scan Another Medicine'}
              </button>
            </div>
          </>
        )}
        <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </main>
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-3 bg-white/90 backdrop-blur-lg border-t border-slate-100 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <button onClick={() => navigate('/')} className="flex flex-col items-center text-slate-400 px-4 py-1.5"><span className="material-symbols-outlined">home</span><span className="font-manrope text-[11px] font-semibold uppercase">{t('home')}</span></button>
        <button className="flex flex-col items-center text-teal-800 bg-teal-50/50 rounded-xl px-4 py-1.5"><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>document_scanner</span><span className="font-manrope text-[11px] font-semibold uppercase">{t('scan')}</span></button>
        <button onClick={() => navigate('/asha-history')} className="flex flex-col items-center text-slate-400 px-4 py-1.5 active:scale-95"><span className="material-symbols-outlined">history</span><span className="font-manrope text-[11px] font-semibold uppercase">{t('history')}</span></button>
        <button className="flex flex-col items-center text-slate-400 px-4 py-1.5"><span className="material-symbols-outlined">settings</span><span className="font-manrope text-[11px] font-semibold uppercase">{t('settings')}</span></button>
      </nav>
    </div>
  );
}
