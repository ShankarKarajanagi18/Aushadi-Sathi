import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n/LanguageContext';
import T from '../i18n/translations';
import LanguageSwitcher from '../i18n/LanguageSwitcher';


export default function HomePage() {
  const { lang } = useLang();
  const t = (key) => (T[key] && T[key][lang]) || T[key]?.en || key;
  const [sessionName, setSessionName] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ashaSession');
      if (raw) { const s = JSON.parse(raw); if (s && s.full_name) setSessionName(s.full_name.split(' ')[0]); }
    } catch (_e) { /* ignore */ }
  }, []);

  const features = [
    { icon: 'language', title: t('multiLang'), desc: t('multiLangDesc') },
    { icon: 'verified_user', title: t('secureRecords'), desc: t('secureRecordsDesc') },
    { icon: 'group', title: t('communityLed'), desc: t('communityLedDesc') },
    { icon: 'bolt', title: t('rapidResponse'), desc: t('rapidResponseDesc') },
  ];

  return (
    <div>
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
          <nav className="hidden md:flex gap-6 items-center">
            <span onClick={() => navigate('/')} className="text-[#005D67] dark:text-teal-400 font-bold font-manrope text-sm cursor-pointer">{t('home')}</span>

            <div className="relative group cursor-pointer py-2">
              <span className="text-slate-500 dark:text-slate-400 font-manrope text-sm hover:text-[#005D67] transition-colors flex items-center gap-1 font-bold">
                Patients <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </span>
              <div className="absolute top-full left-0 mt-0 w-60 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2 flex flex-col gap-1">
                  <div onClick={() => navigate('/scan-prescription')} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-[#005D67] dark:hover:text-teal-400 transition-colors flex items-center gap-3 font-manrope">
                    <span className="material-symbols-outlined text-[20px] text-primary">document_scanner</span>
                    <span className="font-semibold">Scan Prescription</span>
                  </div>
                  <div onClick={() => navigate('/med-verification')} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-[#005D67] dark:hover:text-teal-400 transition-colors flex items-center gap-3 font-manrope">
                    <span className="material-symbols-outlined text-[20px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>fact_check</span>
                    <span className="font-semibold">Medicine Verification</span>
                  </div>
                </div>
              </div>
            </div>

            <span onClick={() => sessionName ? navigate('/asha-worker') : navigate('/asha-login')} className="text-slate-500 dark:text-slate-400 font-manrope text-sm hover:text-[#005D67] cursor-pointer transition-colors font-bold uppercase tracking-wider text-[12px]">
              ASHA WORKER
            </span>

            <span onClick={() => navigate('/health-chat')} className="text-slate-500 dark:text-slate-400 font-manrope text-sm hover:text-[#005D67] cursor-pointer transition-colors font-bold uppercase tracking-wider text-[12px]">
              CHAT BOT
            </span>

            <LanguageSwitcher className="ml-2" />
            <button onClick={() => sessionName ? navigate('/asha-worker') : navigate('/asha-login')} className="bg-[#005D67] text-white px-5 py-2 rounded-lg font-manrope font-semibold text-sm hover:opacity-90 transition-all">
              {sessionName ? `Dashboard: ${sessionName}` : t('signIn')}
            </button>
          </nav>
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher />
            <button className="flex items-center p-2 text-primary"><span className="material-symbols-outlined">menu</span></button>
          </div>

        </div>
      </header>

      <main className="relative">
        <div className="absolute inset-0 hero-pattern pointer-events-none"></div>
        <section className="relative pt-12 pb-20 px-6 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container font-label-caps mb-6">{t('heroTag')}</span>
            <h2 className="font-h1 text-h1 text-primary mb-6 leading-tight">{t('heroTitle')}</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">{t('heroDesc')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="relative group overflow-hidden rounded-[32px] bg-white border border-slate-100 shadow-[0_16px_32px_-12px_rgba(0,93,103,0.04)] p-10 transition-all hover:shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8"></div>
              <div className="flex flex-col h-full">
                <div className="w-16 h-16 bg-surface-container rounded-2xl flex items-center justify-center mb-8"><span className="material-symbols-outlined text-primary text-3xl">person</span></div>
                <h3 className="font-h2 text-h2 text-primary mb-3">{t('patient')}</h3>
                <p className="font-body-md text-on-surface-variant mb-10 text-lg">{t('patientDesc')}</p>
                <div className="mt-auto space-y-3">
                  <button onClick={() => navigate('/scan-prescription')} className="w-full bg-[#00444b] text-white font-manrope font-bold py-3 px-6 rounded-2xl flex items-center justify-center gap-2 group-hover:scale-[1.02] transition-transform shadow-lg shadow-primary/10">
                    <span className="material-symbols-outlined">document_scanner</span>{t('scanPrescription')}
                  </button>
                  <button onClick={() => navigate('/med-verification')} className="w-full bg-white text-[#00444b] border-2 border-[#00444b]/20 font-manrope font-bold py-3 px-6 rounded-2xl flex items-center justify-center gap-2 group-hover:scale-[1.02] transition-transform shadow-sm">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>fact_check</span>{t('medVerify')}
                  </button>
                </div>
              </div>
            </div>
            <div className="relative group overflow-hidden rounded-[32px] bg-white border border-slate-100 shadow-[0_16px_32px_-12px_rgba(0,93,103,0.04)] p-10 transition-all hover:shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-bl-full -mr-8 -mt-8"></div>
              <div className="flex flex-col h-full">
                <div className="w-16 h-16 bg-secondary-container rounded-2xl flex items-center justify-center mb-8"><span className="material-symbols-outlined text-on-secondary-container text-3xl">medical_services</span></div>
                <h3 className="font-h2 text-h2 text-secondary mb-3">{t('ashaWorker')}</h3>
                <p className="font-body-md text-on-surface-variant mb-10 text-lg">{t('ashaDesc')}</p>
                <div className="mt-auto">
                  <button onClick={() => sessionName ? navigate('/asha-worker') : navigate('/asha-login')} className="w-full bg-[#006c4b] text-white font-manrope font-bold py-4 px-8 rounded-2xl flex items-center justify-center gap-2 group-hover:scale-[1.02] transition-transform shadow-lg shadow-secondary/10">
                    {sessionName ? t('goToDashboard') : t('loginNhm')}<span className="material-symbols-outlined">{sessionName ? 'dashboard' : 'login'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => navigate('/health-chat')} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm group">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-tertiary-fixed rounded-xl flex items-center justify-center"><span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span></div>
                <div className="text-left"><h4 className="font-manrope font-bold text-on-surface">{t('chatHealthAssist')}</h4><p className="text-sm text-on-surface-variant">{t('instantAnswers')}</p></div>
              </div>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
            </button>
            <button onClick={() => navigate('/nearest-asha')} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm group">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-error-container rounded-xl flex items-center justify-center"><span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>call</span></div>
                <div className="text-left"><h4 className="font-manrope font-bold text-on-surface">{t('callNearestAsha')}</h4><p className="text-sm text-on-surface-variant">{t('emergencySupport')}</p></div>
              </div>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-error transition-colors">chevron_right</span>
            </button>
          </div>
        </section>

        <section className="bg-surface-container py-20 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative rounded-[40px] overflow-hidden aspect-video shadow-2xl">
              <img alt="Healthcare in India" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfbpQ3b95anR045wrpw_7Hp6DEPbWs_DKqsbeoY6Z-9MqJYI1AQhAp04En_c2s73Wyfb3stSj9zq9zZeEUI5XbyyPKZt98AzeCHyftjKZ1aaaQJp-9jWmaaLlPR_JVUoTf5PY5ZzG59NOfGetWX81XKEgiqJEp77cRvqsbjpdIkAAxYIsdyt3LPC84JnGtMGfSM3W4nBX7EzEeREUvv4t9nxZ_6pHRYjrWxNg4CG8qU6MiPZazls5_tWKSiJcwr1RcNGPJUkT3WKM" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            </div>
            <div className="space-y-8">
              <h3 className="font-h2 text-h2 text-primary">{t('trustedCare')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {features.map((f, i) => (
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

      <footer className="bg-white border-t border-slate-100 pt-16 pb-24 md:pb-8 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-[#005D67] rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>pill</span>
              </div>
              <h2 className="font-manrope text-lg font-bold tracking-tight text-[#005D67]">AushadhiSaathi</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed font-manrope pr-4">
              A digital health initiative aimed at bridging the gap between urban technology and rural healthcare accessibility.
            </p>
          </div>

          <div className="col-span-1">
            <h3 className="font-manrope font-bold text-[#005D67] mb-6 text-base">Platform</h3>
            <ul className="space-y-4">
              <li><a href="#patient-portal" className="text-sm text-slate-600 hover:text-[#005D67] transition-colors font-manrope">Patient Portal</a></li>
              <li><a href="#asha-dashboard" className="text-sm text-slate-600 hover:text-[#005D67] transition-colors font-manrope">ASHA Dashboard</a></li>
              <li><a href="#medical-directory" className="text-sm text-slate-600 hover:text-[#005D67] transition-colors font-manrope">Medical Directory</a></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="font-manrope font-bold text-[#005D67] mb-6 text-base">Support</h3>
            <ul className="space-y-4">
              <li><a href="#help-center" className="text-sm text-slate-600 hover:text-[#005D67] transition-colors font-manrope">Help Center</a></li>
              <li><a href="#nhm-guidelines" className="text-sm text-slate-600 hover:text-[#005D67] transition-colors font-manrope">NHM Guidelines</a></li>
              <li><a href="#contact" className="text-sm text-slate-600 hover:text-[#005D67] transition-colors font-manrope">Contact Us</a></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="font-manrope font-bold text-[#005D67] mb-6 text-base">Legal</h3>
            <ul className="space-y-4">
              <li><a href="#privacy" className="text-sm text-slate-600 hover:text-[#005D67] transition-colors font-manrope">Privacy Policy</a></li>
              <li><a href="#data-security" className="text-sm text-slate-600 hover:text-[#005D67] transition-colors font-manrope">Data Security</a></li>
              <li><a href="#terms" className="text-sm text-slate-600 hover:text-[#005D67] transition-colors font-manrope">Terms of Use</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-400 font-manrope">© 2026 AushadhiSaathi Project. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-[#005D67] transition-colors"><span className="material-symbols-outlined text-[20px]">language</span></button>
            <button className="text-slate-400 hover:text-[#005D67] transition-colors"><span className="material-symbols-outlined text-[20px]">mail</span></button>
          </div>
        </div>
      </footer>

      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-20 px-4 pb-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-50 rounded-t-2xl border-t border-slate-100 dark:border-slate-800 shadow-[0_-8px_24px_-10px_rgba(0,0,0,0.08)]">
        <button className="flex flex-col items-center justify-center bg-[#005D67]/10 dark:bg-teal-900/30 text-[#005D67] dark:text-teal-300 rounded-xl px-5 py-1.5 transition-all duration-200 active:scale-90">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="font-manrope text-[11px] font-semibold">{t('home')}</span>
        </button>
        <button onClick={() => navigate('/nearest-asha')} className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-5 py-1.5 hover:text-[#005D67] transition-all">
          <span className="material-symbols-outlined">medical_services</span>
          <span className="font-manrope text-[11px] font-semibold">{t('health')}</span>
        </button>
        <button onClick={() => navigate('/health-chat')} className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-5 py-1.5 hover:text-[#005D67] transition-all">
          <span className="material-symbols-outlined">contact_support</span>
          <span className="font-manrope text-[11px] font-semibold">{t('support')}</span>
        </button>
        <button className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-5 py-1.5 hover:text-[#005D67] transition-all">
          <span className="material-symbols-outlined">person</span>
          <span className="font-manrope text-[11px] font-semibold">{t('profile')}</span>
        </button>
      </nav>
    </div>
  );
}
