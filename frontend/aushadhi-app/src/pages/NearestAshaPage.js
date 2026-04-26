import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';
import { useLang } from '../i18n/LanguageContext';
import T from '../i18n/translations';

const STATIC_WORKERS = [
  { full_name: 'Lakshmi Devi', nhm_id: '8849-552', village: 'Sector 14, Marathahalli Village', village_kn: 'ಸೆಕ್ಟರ್ 14, ಮಾರತಹಳ್ಳಿ ಗ್ರಾಮ', distance_km: 0.8, phone: '', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGBWwZeXEU3uRBNVY6H22jPtnnkiONFqt2zBdoZrze-ocJtmYkG4ACAgZ1ybUI8-FjLDNp4oT4npOEYnJDpJ0TybNOlNZLVSSENOYXrvdtmvUBVEE8hye1l7-uLl4vyTe60bjz4NqeOda9CyW1iNZDhNQP-RtAu1J0f3_gspRl7UY7tLVMHpatkWSEwa3JycEdopBV4QeOYTw_bIosFCm8lOOGIeXL3E9wqoTienbMZYwIWdohm39SLoWUXNtBlYIHMufBghSxm_4' },
  { full_name: 'Geetha Sharma', nhm_id: '9021-331', village: 'Varthur Main Road, Colony Area', village_kn: 'ವರ್ತೂರು ಮುಖ್ಯ ರಸ್ತೆ, ಕಾಲೋನಿ ಪ್ರದೇಶ', distance_km: 1.5, phone: '', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDiCcv9B0rbkP4v7yDMHLlkTHN1TDI1JQeDVNHe_8gEVu73UmukL1hrAoYl_MKkUKHY1Nx5iqRjCMW7cwtRRLihL88BYOL79uFPfcAm7DmLroaq6dFl8XLaI_rFA4sLYcBnLFbfJeNVAOQ1Tx4WX__loNkZzOWFpBjZ0e3aRinPwULmhhttcFnK3QdWDpFgF5XCugVAlSY-Lgh9RYuwJwAVEFNxognQKZwpPmPrXmqzW7iWIcmOeTD8I9Ol-IoOdm0lUZqJMihuuEA' },
  { full_name: 'Manjula Rao', nhm_id: '7712-440', village: 'Brookefield Ext., Block B', village_kn: 'ಬ್ರೂಕ್\u200Cಫೀಲ್ಡ್ ಎಕ್ಸ್\u200Cಟೆಂಷನ್, ಬ್ಲಾಕ್ ಬಿ', distance_km: 2.2, phone: '', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAAulOIHl23HoqTjRSvt32uwGMEQd3493YJnhhw2XfIiXD_2u7Y4OPVIVDnzcEYsuZi4091bOwyT9HMx9Lk7uM6yD4TdmnVJbjVIe9aXkmiDne1iAltMVgz0fwdfMkMvm02uQVqCJqMgwgZoPSSxWemELzzqarPvx7qfHxzAJ0OKEyc4-3LpkwXOiP3Ja6PuX4SEn4JriuJRt5AZKe5i7KJIfnBkFVC0dR9r4SbIbgWY2Y75dlrYvDpOMl4fWCejpB0aN9Z8IE75tc' },
];

export default function NearestAshaPage() {
  const navigate = useNavigate();
  const { lang, toggleLang } = useLang();
  const t = (key) => (T[key] && T[key][lang]) || T[key]?.en || key;
  const [workers, setWorkers] = useState(STATIC_WORKERS);
  const [statusMsg, setStatusMsg] = useState('');

  const fetchWorkers = useCallback(async (lat, lng) => {
    try {
      const params = new URLSearchParams({ limit: '10' });
      if (typeof lat === 'number') { params.set('lat', String(lat)); params.set('lng', String(lng)); }
      const res = await fetch(API_BASE + '/asha/workers/nearest?' + params.toString());
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed');
      if (json.workers && json.workers.length > 0) setWorkers(json.workers);
      setStatusMsg('Live data loaded.');
    } catch (err) { setStatusMsg(err.message); }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) { navigator.geolocation.getCurrentPosition(pos => fetchWorkers(pos.coords.latitude, pos.coords.longitude), () => fetchWorkers()); }
    else { fetchWorkers(); }
  }, [fetchWorkers]);

  return (
    <div className="font-body-md text-on-surface min-h-screen" style={{ backgroundColor: '#f8f9ff' }}>
      <header className="bg-white sticky top-0 z-50 border-b border-slate-100 shadow-[0_16px_32px_-12px_rgba(0,93,103,0.04)] flex justify-between items-center px-6 py-4 w-full gap-2">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="material-symbols-outlined text-[#005D67] hover:bg-slate-50 transition-colors p-2 rounded-full">arrow_back</button>
          <h1 className="font-manrope text-lg font-bold tracking-tight text-[#005D67]">AushadhiSaathi | ಔಷಧಿ ಸಾಥಿ</h1>
        </div>
        <button onClick={toggleLang} className="flex items-center gap-1 px-2 py-1 rounded-lg border border-[#005D67]/20 hover:bg-[#005D67]/5 transition-colors">
          <span className={`font-manrope text-sm ${lang === 'en' ? 'font-bold text-[#005D67]' : 'font-medium text-slate-500'}`}>EN</span>
          <span className="text-slate-300">|</span>
          <span className={`font-manrope text-sm ${lang === 'kn' ? 'font-bold text-[#005D67]' : 'font-medium text-slate-500'}`}>ಕನ್ನಡ</span>
        </button>
      </header>

      <main className="max-w-screen-md mx-auto px-4 pt-8 pb-32">
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-2"><span className="material-symbols-outlined text-primary text-3xl">location_on</span><h2 className="font-h2 text-primary">{t('nearestAsha')}</h2></div>
          <p className="font-body-md text-on-surface-variant">{t('nearestAshaDesc')}</p>
        </section>

        <div className="flex flex-col gap-6">
          {workers.map((w, i) => {
            const name = w.full_name || t('ashaWorker');
            const nhmId = w.nhm_id || w.id || 'N/A';
            const village = lang === 'kn' && w.village_kn ? w.village_kn : (w.village || '');
            const dist = w.distance_km != null ? w.distance_km + ' ' + t('km') : t('nearby');
            const phone = w.phone || '';
            return (
              <div key={i} className="bg-white rounded-xl shadow-[0_4px_16px_-4px_rgba(0,0,0,0.04)] border border-slate-50 overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-full bg-surface-container overflow-hidden ring-4 ring-primary-fixed/30 flex items-center justify-center">{w.img ? <img alt={name} className="w-full h-full object-cover" src={w.img} /> : <span className="material-symbols-outlined text-primary">person</span>}</div>
                      <div><h3 className="font-h3 text-on-surface">{name}</h3><p className="font-label-caps text-secondary-container bg-secondary px-2 py-0.5 rounded inline-block">NHM ID: {nhmId}</p></div>
                    </div>
                    <div className="text-right"><span className="text-primary font-bold block">{dist}</span><span className="text-slate-400 text-xs">{t('distance')}</span></div>
                  </div>
                  <div className="flex items-center gap-2 mb-6 text-on-surface-variant bg-surface-container-low p-3 rounded-lg"><span className="material-symbols-outlined text-sm">home_pin</span><span className="text-sm">{village}</span></div>
                  <div className="grid grid-cols-2 gap-3">
                    <a href={phone ? `tel:${phone}` : '#'} className="flex items-center justify-center gap-2 py-3 px-4 bg-secondary text-white rounded-xl font-semibold shadow-sm hover:opacity-90 transition-all active:scale-95"><span className="material-symbols-outlined">call</span>{t('callNow')}</a>
                    <a href={phone ? `https://wa.me/91${phone}` : '#'} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3 px-4 bg-secondary-container text-on-secondary-container rounded-xl font-semibold hover:bg-secondary-fixed transition-all active:scale-95 border-b-2 border-secondary/20"><span className="material-symbols-outlined">chat</span>{t('whatsapp')}</a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {statusMsg && <p className="text-sm text-on-surface-variant mt-3">{statusMsg}</p>}

        <div className="mt-10 bg-primary-container/10 border border-primary-container/20 rounded-2xl p-6 flex gap-4 items-start">
          <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
          <div><p className="font-body-md text-primary font-semibold">{t('govCertified')}</p><p className="text-sm text-on-primary-fixed-variant leading-relaxed">{t('govCertifiedDesc')}</p></div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center h-20 px-4 pb-2 bg-white/95 backdrop-blur-md z-50 rounded-t-2xl border-t border-slate-100 shadow-[0_-8px_24px_-10px_rgba(0,0,0,0.08)]">
        <button onClick={() => navigate('/')} className="flex flex-col items-center text-slate-400 px-5 py-1.5 hover:text-[#005D67]"><span className="material-symbols-outlined">home</span><span className="font-manrope text-[11px] font-semibold">{t('home')}</span></button>
        <button className="flex flex-col items-center text-slate-400 px-5 py-1.5"><span className="material-symbols-outlined">medical_services</span><span className="font-manrope text-[11px] font-semibold">{t('support')}</span></button>
        <div className="flex flex-col items-center bg-[#005D67]/10 text-[#005D67] rounded-xl px-5 py-1.5"><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>group</span><span className="font-manrope text-[11px] font-semibold">{t('health')}</span></div>
        <button className="flex flex-col items-center text-slate-400 px-5 py-1.5"><span className="material-symbols-outlined">person</span><span className="font-manrope text-[11px] font-semibold">{t('profile')}</span></button>
      </nav>
    </div>
  );
}
