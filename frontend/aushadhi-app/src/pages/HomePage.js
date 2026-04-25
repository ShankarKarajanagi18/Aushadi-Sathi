import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const [lang, setLang] = useState('en');
  const [sessionName, setSessionName] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ashaSession');
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.full_name) setSessionName(s.full_name.split(' ')[0]);
      }
    } catch (_e) { /* ignore */ }
  }, []);

  function setLanguage(l) { setLang(l); }
  function toggleMobileLanguage() { setLang(prev => prev === 'en' ? 'kn' : 'en'); }

  return (
    <div data-lang={lang}>
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-[0_16px_32px_-12px_rgba(0,93,103,0.04)] sticky top-0 z-50">
        <div className="flex justify-between items-center px-6 py-4 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>pill</span>
            </div>
            <h1 className="font-manrope text-lg font-bold tracking-tight text-[#005D67] dark:text-teal-400">
              AushadhiSaathi | <span className="font-normal opacity-80">ಔಷಧಿ ಸಾಥಿ</span>
            </h1>
          </div>
          <nav className="hidden md:flex gap-8 items-center">
            <span className="text-[#005D67] dark:text-teal-400 font-bold font-manrope text-sm cursor-pointer">
              {lang === 'en' ? 'Home' : 'ಮುಖಪುಟ'}
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-manrope text-sm hover:text-[#005D67] cursor-pointer transition-colors">
              {lang === 'en' ? 'Support' : 'ಬೆಂಬಲ'}
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-manrope text-sm hover:text-[#005D67] cursor-pointer transition-colors">
              {lang === 'en' ? 'Health' : 'ಆರೋಗ್ಯ'}
            </span>
            {/* Language Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-slate-700 ml-2">
              <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all ${lang === 'en' ? 'bg-white dark:bg-[#005D67] text-[#005D67] dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50'}`}>EN</button>
              <button onClick={() => setLanguage('kn')} className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all ${lang === 'kn' ? 'bg-white dark:bg-[#005D67] text-[#005D67] dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50'}`}>ಕನ್ನಡ</button>
            </div>
            <button onClick={() => sessionName ? navigate('/asha-worker') : navigate('/asha-login')} className="bg-[#005D67] text-white px-5 py-2 rounded-lg font-manrope font-semibold text-sm hover:opacity-90 transition-all">
              {sessionName ? `Dashboard: ${sessionName}` : (lang === 'en' ? 'Sign In' : 'ಸೈನ್ ಇನ್')}
            </button>
          </nav>
          <div className="flex items-center gap-4 md:hidden">
            <button onClick={toggleMobileLanguage} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-primary dark:text-teal-400">
              <span className="material-symbols-outlined text-sm">language</span>
              <span className="text-xs font-bold font-manrope uppercase">{lang === 'en' ? 'EN' : 'ಕನ್ನಡ'}</span>
            </button>
            <button className="flex items-center p-2 text-primary">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative">
        <div className="absolute inset-0 hero-pattern pointer-events-none"></div>
        <section className="relative pt-12 pb-20 px-6 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container font-label-caps mb-6">
              {lang === 'en' ? 'DIGITAL HEALTH COMPANION' : 'ಡಿಜಿಟಲ್ ಆರೋಗ್ಯ ಸಹಚರ'}
            </span>
            <h2 className="font-h1 text-h1 text-primary mb-6 leading-tight">
              {lang === 'en' ? 'Reliable Healthcare, Simplified for Everyone.' : 'ವಿಶ್ವಾಸಾರ್ಹ ಆರೋಗ್ಯ ಸೇವೆ, ಎಲ್ಲರಿಗೂ ಸರಳವಾಗಿದೆ.'}
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              {lang === 'en' ? 'Access prescriptions, connect with ASHA workers, and manage your health records in your preferred language.' : 'ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್‌ಗಳನ್ನು ಪ್ರವೇಶಿಸಿ, ಆಶಾ ಕಾರ್ಯಕರ್ತರೊಂದಿಗೆ ಸಂಪರ್ಕ ಸಾಧಿಸಿ ಮತ್ತು ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯಲ್ಲಿ ನಿಮ್ಮ ಆರೋಗ್ಯ ದಾಖಲೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ.'}
            </p>
          </div>

          {/* Patient / ASHA Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Patient Card */}
            <div className="relative group overflow-hidden rounded-[32px] bg-white border border-slate-100 shadow-[0_16px_32px_-12px_rgba(0,93,103,0.04)] p-10 transition-all hover:shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8"></div>
              <div className="flex flex-col h-full">
                <div className="w-16 h-16 bg-surface-container rounded-2xl flex items-center justify-center mb-8">
                  <span className="material-symbols-outlined text-primary text-3xl">person</span>
                </div>
                <h3 className="font-h2 text-h2 text-primary mb-3">{lang === 'en' ? 'Patient' : 'ರೋಗಿ'}</h3>
                <p className="font-body-md text-on-surface-variant mb-10 text-lg">
                  {lang === 'en' ? 'No login needed. Instantly view your records and find help.' : 'ಲಾಗಿನ್ ಅಗತ್ಯವಿಲ್ಲ. ತಕ್ಷಣ ನಿಮ್ಮ ದಾಖಲೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ ಮತ್ತು ಸಹಾಯ ಪಡೆಯಿರಿ.'}
                </p>
                <div className="mt-auto">
                  <button onClick={() => navigate('/scan-prescription')} className="w-full bg-[#00444b] text-white font-manrope font-bold py-4 px-8 rounded-2xl flex items-center justify-center gap-2 group-hover:scale-[1.02] transition-transform shadow-lg shadow-primary/10">
                    {lang === 'en' ? 'Enter as Patient' : 'ರೋಗಿಯಾಗಿ ಪ್ರವೇಶಿಸಿ'}
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ASHA Card */}
            <div className="relative group overflow-hidden rounded-[32px] bg-white border border-slate-100 shadow-[0_16px_32px_-12px_rgba(0,93,103,0.04)] p-10 transition-all hover:shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-bl-full -mr-8 -mt-8"></div>
              <div className="flex flex-col h-full">
                <div className="w-16 h-16 bg-secondary-container rounded-2xl flex items-center justify-center mb-8">
                  <span className="material-symbols-outlined text-on-secondary-container text-3xl">medical_services</span>
                </div>
                <h3 className="font-h2 text-h2 text-secondary mb-3">{lang === 'en' ? 'ASHA Worker' : 'ಆಶಾ ಕಾರ್ಯಕರ್ತೆ'}</h3>
                <p className="font-body-md text-on-surface-variant mb-10 text-lg">
                  {lang === 'en' ? 'Secure access for community health workers with NHM ID.' : 'NHM ಐಡಿ ಹೊಂದಿರುವ ಸಮುದಾಯ ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತರಿಗೆ ಸುರಕ್ಷಿತ ಪ್ರವೇಶ.'}
                </p>
                <div className="mt-auto">
                  <button onClick={() => navigate('/asha-login')} className="w-full bg-[#006c4b] text-white font-manrope font-bold py-4 px-8 rounded-2xl flex items-center justify-center gap-2 group-hover:scale-[1.02] transition-transform shadow-lg shadow-secondary/10">
                    {lang === 'en' ? 'Login with NHM ID' : 'NHM ಐಡಿ ಮೂಲಕ ಲಾಗಿನ್ ಮಾಡಿ'}
                    <span className="material-symbols-outlined">login</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => navigate('/health-chat')} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm group">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-tertiary-fixed rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
                </div>
                <div className="text-left">
                  <h4 className="font-manrope font-bold text-on-surface">{lang === 'en' ? 'Chat with Health Assistant' : 'ಆರೋಗ್ಯ ಸಹಾಯಕರೊಂದಿಗೆ ಚಾಟ್ ಮಾಡಿ'}</h4>
                  <p className="text-sm text-on-surface-variant">{lang === 'en' ? 'Instant answers to medical queries' : 'ವೈದ್ಯಕೀಯ ಪ್ರಶ್ನೆಗಳಿಗೆ ತಕ್ಷಣದ ಉತ್ತರಗಳು'}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
            </button>
            <button onClick={() => navigate('/nearest-asha')} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm group">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-error-container rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
                </div>
                <div className="text-left">
                  <h4 className="font-manrope font-bold text-on-surface">{lang === 'en' ? 'Call Nearest ASHA Worker' : 'ಹತ್ತಿರದ ಆಶಾ ಕಾರ್ಯಕರ್ತರಿಗೆ ಕರೆ ಮಾಡಿ'}</h4>
                  <p className="text-sm text-on-surface-variant">{lang === 'en' ? 'Emergency and guidance support' : 'ತುರ್ತು ಮತ್ತು ಮಾರ್ಗದರ್ಶನ ಬೆಂಬಲ'}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-error transition-colors">chevron_right</span>
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-surface-container py-20 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative rounded-[40px] overflow-hidden aspect-video shadow-2xl">
              <img alt="Healthcare in India" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfbpQ3b95anR045wrpw_7Hp6DEPbWs_DKqsbeoY6Z-9MqJYI1AQhAp04En_c2s73Wyfb3stSj9zq9zZeEUI5XbyyPKZt98AzeCHyftjKZ1aaaQJp-9jWmaaLlPR_JVUoTf5PY5ZzG59NOfGetWX81XKEgiqJEp77cRvqsbjpdIkAAxYIsdyt3LPC84JnGtMGfSM3W4nBX7EzEeREUvv4t9nxZ_6pHRYjrWxNg4CG8qU6MiPZazls5_tWKSiJcwr1RcNGPJUkT3WKM" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            </div>
            <div className="space-y-8">
              <h3 className="font-h2 text-h2 text-primary">{lang === 'en' ? 'Trusted Care, Digital Precision' : 'ವಿಶ್ವಾಸಾರ್ಹ ಆರೈಕೆ, ಡಿಜಿಟಲ್ ನಿಖರತೆ'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: 'language', title: lang === 'en' ? 'Multilingual Support' : 'ಬಹುಭಾಷಾ ಬೆಂಬಲ', desc: lang === 'en' ? 'Available in English, Kannada, and other regional languages.' : 'ಇಂಗ್ಲಿಷ್, ಕನ್ನಡ ಮತ್ತು ಇತರ ಪ್ರಾದೇಶಿಕ ಭಾಷೆಗಳಲ್ಲಿ ಲಭ್ಯವಿದೆ.' },
                  { icon: 'verified_user', title: lang === 'en' ? 'Secure Records' : 'ಸುರಕ್ಷಿತ ದಾಖಲೆಗಳು', desc: lang === 'en' ? 'Your medical history is encrypted and accessible only by you.' : 'ನಿಮ್ಮ ವೈದ್ಯಕೀಯ ಇತಿಹಾಸವನ್ನು ಎನ್‌ಕ್ರಿಪ್ಟ್ ಮಾಡಲಾಗಿದೆ ಮತ್ತು ನಿಮಗೆ ಮಾತ್ರ ಪ್ರವೇಶವಿರುತ್ತದೆ.' },
                  { icon: 'group', title: lang === 'en' ? 'Community Led' : 'ಸಮುದಾಯ ನೇತೃತ್ವದ', desc: lang === 'en' ? 'Empowering ASHA workers to provide better ground-level care.' : 'ಉತ್ತಮ ಭೂಮಟ್ಟದ ಆರೈಕೆಯನ್ನು ನೀಡಲು ಆಶಾ ಕಾರ್ಯಕರ್ತರನ್ನು ಸಬಲೀಕರಣಗೊಳಿಸುವುದು.' },
                  { icon: 'bolt', title: lang === 'en' ? 'Rapid Response' : 'ತ್ವರಿತ ಪ್ರತಿಕ್ರಿಯೆ', desc: lang === 'en' ? 'Direct link to nearest health support for emergencies.' : 'ತುರ್ತು ಸಂದರ್ಭಗಳಿಗಾಗಿ ಹತ್ತಿರದ ಆರೋಗ್ಯ ಬೆಂಬಲಕ್ಕೆ ನೇರ ಸಂಪರ್ಕ.' },
                ].map((f, i) => (
                  <div key={i} className="p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white">
                    <span className="material-symbols-outlined text-primary mb-4">{f.icon}</span>
                    <h5 className="font-manrope font-bold mb-2">{f.title}</h5>
                    <p className="text-sm text-on-surface-variant">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 pt-16 pb-24 md:pb-8 px-6">
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-400">© 2026 AushadhiSaathi Project. All rights reserved.</p>
        </div>
      </footer>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-20 px-4 pb-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-50 rounded-t-2xl border-t border-slate-100 dark:border-slate-800 shadow-[0_-8px_24px_-10px_rgba(0,0,0,0.08)]">
        <button className="flex flex-col items-center justify-center bg-[#005D67]/10 dark:bg-teal-900/30 text-[#005D67] dark:text-teal-300 rounded-xl px-5 py-1.5 transition-all duration-200 active:scale-90">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="font-manrope text-[11px] font-semibold">{lang === 'en' ? 'Home' : 'ಮುಖಪುಟ'}</span>
        </button>
        <button onClick={() => navigate('/nearest-asha')} className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-5 py-1.5 hover:text-[#005D67] transition-all">
          <span className="material-symbols-outlined">medical_services</span>
          <span className="font-manrope text-[11px] font-semibold">{lang === 'en' ? 'Health' : 'ಆರೋಗ್ಯ'}</span>
        </button>
        <button onClick={() => navigate('/health-chat')} className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-5 py-1.5 hover:text-[#005D67] transition-all">
          <span className="material-symbols-outlined">contact_support</span>
          <span className="font-manrope text-[11px] font-semibold">{lang === 'en' ? 'Support' : 'ಬೆಂಬಲ'}</span>
        </button>
        <button className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-5 py-1.5 hover:text-[#005D67] transition-all">
          <span className="material-symbols-outlined">person</span>
          <span className="font-manrope text-[11px] font-semibold">{lang === 'en' ? 'Profile' : 'ಪ್ರೊಫೈಲ್'}</span>
        </button>
      </nav>
    </div>
  );
}
