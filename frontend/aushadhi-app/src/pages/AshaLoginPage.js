import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';
import useAshaSession from '../hooks/useAshaSession';

export default function AshaLoginPage() {
  const navigate = useNavigate();
  const { saveSession } = useAshaSession();
  const [fullName, setFullName] = useState('');
  const [nhmId, setNhmId] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    const payload = { full_name: fullName.trim(), nhm_id: nhmId.trim().toUpperCase(), phone: phone.trim(), village: village.trim(), language: 'EN' };
    if (!payload.full_name || !payload.nhm_id || payload.phone.replace(/\D/g, '').length !== 10) {
      setError('Please enter full name, NHM ID, and a valid 10-digit phone number.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(API_BASE + '/asha/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to login at this time.');
      saveSession(result.worker || {});
      setSuccess('Login successful. Redirecting to dashboard...');
      setTimeout(() => navigate('/asha-worker'), 500);
    } catch (err) {
      setError(err.message || 'Unable to reach backend. Make sure Flask is running on port 5000.');
    } finally { setLoading(false); }
  }

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-[0_16px_32px_-12px_rgba(0,93,103,0.04)] sticky top-0 z-50">
        <div className="flex justify-between items-center px-4 md:px-6 py-4 w-full">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-[#005D67] dark:text-teal-400 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-full flex items-center justify-center active:scale-95 duration-150">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="font-manrope text-base md:text-lg font-bold tracking-tight text-[#005D67] dark:text-teal-400">AushadhiSaathi</h1>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-margin_mobile md:px-margin_desktop py-stack_lg">
        <div className="w-full max-w-lg">
          <div className="mb-stack_lg text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary-container mb-stack_sm">
              <span className="material-symbols-outlined text-on-secondary-container text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
            </div>
            <h2 className="font-h2 text-h2 text-primary mb-2">ASHA Worker Login</h2>
            <h3 className="font-h3 text-h3 text-primary-container">ಆಶಾ ಕಾರ್ಯಕರ್ತರ ಲಾಗಿನ್</h3>
            <p className="text-on-surface-variant mt-2 font-body-md">Enter your professional details to access the portal.</p>
          </div>

          <div className="bg-surface-container-lowest rounded-xl shadow-[0_16px_32px_-12px_rgba(0,93,103,0.04)] p-8 border border-outline-variant/30">
            <form className="space-y-stack_md" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="font-label-caps text-label-caps text-on-surface-variant block uppercase tracking-wider">Full Name / ಪೂರ್ಣ ಹೆಸರು</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">person</span>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full h-[56px] pl-12 pr-4 rounded-lg border border-outline-variant focus:border-surface-tint focus:ring-1 focus:ring-surface-tint bg-white outline-none transition-all font-body-md text-on-surface" placeholder="Enter your full name" type="text" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-label-caps text-on-surface-variant block uppercase tracking-wider">NHM ID / ಎನ್.ಎಚ್.ಎಂ ಐಡಿ</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">badge</span>
                  <input value={nhmId} onChange={e => setNhmId(e.target.value)} className="w-full h-[56px] pl-12 pr-4 rounded-lg border border-outline-variant focus:border-surface-tint focus:ring-1 focus:ring-surface-tint bg-white outline-none transition-all font-body-md text-on-surface" placeholder="e.g. ASHA001" type="text" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-label-caps text-on-surface-variant block uppercase tracking-wider">Phone Number / ಫೋನ್ ಸಂಖ್ಯೆ</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">call</span>
                  <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full h-[56px] pl-12 pr-4 rounded-lg border border-outline-variant focus:border-surface-tint focus:ring-1 focus:ring-surface-tint bg-white outline-none transition-all font-body-md text-on-surface" placeholder="10-digit mobile number" type="tel" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-label-caps text-on-surface-variant block uppercase tracking-wider">Village/Area / ಗ್ರಾಮ/ಪ್ರದೇಶ</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">location_on</span>
                  <select value={village} onChange={e => setVillage(e.target.value)} className="w-full h-[56px] pl-12 pr-4 rounded-lg border border-outline-variant focus:border-surface-tint focus:ring-1 focus:ring-surface-tint bg-white outline-none transition-all font-body-md text-on-surface appearance-none">
                    <option disabled value="">Select your work area</option>
                    <option value="hassan">Hassan District</option>
                    <option value="mandya">Mandya District</option>
                    <option value="mysuru">Mysuru District</option>
                    <option value="chikkamagaluru">Chikkamagaluru</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                </div>
              </div>
              {error && <p className="text-sm text-error">{error}</p>}
              {success && <p className="text-sm text-secondary">{success}</p>}
              <button disabled={loading} type="submit" className={`w-full h-[56px] bg-secondary text-white font-manrope font-bold text-body-lg rounded-xl shadow-lg shadow-secondary/20 hover:bg-on-secondary-container transition-colors active:scale-95 duration-150 border-b-2 border-on-secondary-fixed-variant flex items-center justify-center gap-2 mt-stack_lg ${loading ? 'opacity-70' : ''}`}>
                <span>Login / ಲಾಗಿನ್</span>
                <span className="material-symbols-outlined">login</span>
              </button>
            </form>
          </div>

          <div className="mt-stack_lg bg-surface-container-low rounded-xl p-6 border border-surface-tint/10 flex gap-4 items-start shadow-sm">
            <div className="bg-primary-container/10 p-2 rounded-lg">
              <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
            </div>
            <div>
              <h4 className="font-h3 text-[16px] text-primary mb-1">Demo Tip</h4>
              <p className="text-on-surface-variant text-body-md">Demo: Use <span className="font-bold text-primary">NHM ID = ASHA001</span> to quickly test the dashboard features.</p>
            </div>
          </div>
        </div>
      </main>

      <nav className="md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md fixed bottom-0 left-0 w-full flex justify-around items-center h-20 px-4 pb-2 border-t border-slate-100 dark:border-slate-800 shadow-[0_-8px_24px_-10px_rgba(0,0,0,0.08)] z-50">
        <button onClick={() => navigate('/')} className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-5 py-1.5 transition-colors"><span className="material-symbols-outlined">home</span><span className="font-manrope text-[11px] font-semibold">Home</span></button>
        <button className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-5 py-1.5 transition-colors"><span className="material-symbols-outlined">medical_services</span><span className="font-manrope text-[11px] font-semibold">Health</span></button>
        <button className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-5 py-1.5 transition-colors"><span className="material-symbols-outlined">contact_support</span><span className="font-manrope text-[11px] font-semibold">Support</span></button>
        <button className="flex flex-col items-center justify-center bg-[#005D67]/10 dark:bg-teal-900/30 text-[#005D67] dark:text-teal-300 rounded-xl px-5 py-1.5"><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span><span className="font-manrope text-[11px] font-semibold">Profile</span></button>
      </nav>
    </div>
  );
}
