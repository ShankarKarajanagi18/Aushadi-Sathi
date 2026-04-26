import { useState, useEffect } from 'react';
import { useLang } from './i18n/LanguageContext';
const HEALTH_FACTS = [
  { icon: 'medication', fact: 'India is the largest provider of generic medicines globally, supplying over 50% of global demand for vaccines.', fact_kn: 'ಭಾರತವು ಜಾಗತಿಕವಾಗಿ ಜೆನೆರಿಕ್ ಔಷಧಿಗಳ ಅತಿದೊಡ್ಡ ಪೂರೈಕೆದಾರರಾಗಿದ್ದು, ಜಾಗತಿಕ ಲಸಿಕೆ ಬೇಡಿಕೆಯ 50% ಕ್ಕಿಂತ ಹೆಚ್ಚಿನದನ್ನು ಪೂರೈಸುತ್ತದೆ.' },
  { icon: 'vaccines', fact: 'ASHA workers cover over 900,000 villages across India, serving as the first point of healthcare contact.', fact_kn: 'ಆಶಾ ಕಾರ್ಯಕರ್ತರು ಭಾರತದಾದ್ಯಂತ 900,000 ಕ್ಕೂ ಹೆಚ್ಚು ಹಳ್ಳಿಗಳನ್ನು ತಲುಪಿದ್ದಾರೆ ಮತ್ತು ಆರೋಗ್ಯ ಸೇವೆಯ ಮೊದಲ ಸಂಪರ್ಕವಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿದ್ದಾರೆ.' },
  { icon: 'local_pharmacy', fact: 'Counterfeit medicines account for nearly 25% of all medicines sold in developing countries, according to WHO.', fact_kn: 'WHO ಪ್ರಕಾರ, ಅಭಿವೃದ್ಧಿಶೀಲ ರಾಷ್ಟ್ರಗಳಲ್ಲಿ ಮಾರಾಟವಾಗುವ ಎಲ್ಲಾ ಔಷಧಿಗಳಲ್ಲಿ ನಕಲಿ ಔಷಧಿಗಳು ಶೇಕಡಾ 25 ರಷ್ಟಿವೆ.' },
  { icon: 'health_and_safety', fact: 'India has over 10 lakh registered pharmacies — always verify your medicine batch number before use.', fact_kn: 'ಭಾರತದಲ್ಲಿ 10 ಲಕ್ಷಕ್ಕೂ ಹೆಚ್ಚು ನೋಂದಾಯಿತ ಔಷಧಾಲಯಗಳಿವೆ - ಬಳಸುವ ಮೊದಲು ನಿಮ್ಮ ಔಷಧಿಯ ಬ್ಯಾಚ್ ಸಂಖ್ಯೆಯನ್ನು ಯಾವಾಗಲೂ ಪರಿಶೀಲಿಸಿ.' },
  { icon: 'ecg_heart', fact: 'Hypertension affects 1 in 4 adults in India. Regular BP monitoring and correct medication can reduce risk by 40%.', fact_kn: 'ಭಾರತದಲ್ಲಿ 4 ವಯಸ್ಕರಲ್ಲಿ 1 ವ್ಯಕ್ತಿ ಅಧಿಕ ರಕ್ತದೊತ್ತಡದಿಂದ ಬಳಲುತ್ತಿದ್ದಾನೆ. ನಿಯಮಿತ ಬಿಪಿ ತಪಾಸಣೆ ಮತ್ತು ಸರಿಯಾದ ಔಷಧಿಯು ಅಪಾಯವನ್ನು 40% ರಷ್ಟು ಕಡಿಮೆ ಮಾಡುತ್ತದೆ.' },
  { icon: 'science', fact: 'AushadhiSaathi uses AI-powered OCR to read handwritten prescriptions, making healthcare accessible in rural areas.', fact_kn: 'ಔಷಧಿ ಸಾಥಿ ಅಪ್ಲಿಕೇಶನ್ ಕೈಬರಹದ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್‌ಗಳನ್ನು ಓದಲು AI-ಚಾಲಿತ OCR ಅನ್ನು ಬಳಸುತ್ತದೆ, ಗ್ರಾಮೀಣ ಪ್ರದೇಶಗಳಲ್ಲಿ ಆರೋಗ್ಯ ಸೇವೆ ಸುಲಭವಾಗಿಸುತ್ತದೆ.' },
  { icon: 'translate', fact: 'Our app explains prescriptions in Kannada with voice output, bridging the language barrier in healthcare.', fact_kn: 'ನಮ್ಮ ಅಪ್ಲಿಕೇಶನ್ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್‌ಗಳನ್ನು ಧ್ವನಿಯೊಂದಿಗೆ ಕನ್ನಡದಲ್ಲಿ ವಿವರಿಸುತ್ತದೆ, ಆರೋಗ್ಯ ಸೇವೆಯಲ್ಲಿನ ಭಾಷೆಯ ತಡೆಯನ್ನು ನಿವಾರಿಸುತ್ತದೆ.' },
  { icon: 'verified_user', fact: 'Always check the expiry date and batch number on medicine packaging. AushadhiSaathi automates this for you.', fact_kn: 'ಔಷಧಿ ಪ್ಯಾಕೇಜಿಂಗ್‌ನಲ್ಲಿ ಯಾವಾಗಲೂ ಮುಕ್ತಾಯ ದಿನಾಂಕ ಮತ್ತು ಬ್ಯಾಚ್ ಸಂಖ್ಯೆಯನ್ನು ಪರಿಶೀಲಿಸಿ. ಔಷಧಿ ಸಾಥಿ ನಿಮಗಾಗಿ ಇದನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಮಾಡುತ್ತದೆ.' },
  { icon: 'groups', fact: 'There are over 1 million ASHA workers in India — unsung heroes connecting rural communities to healthcare.', fact_kn: 'ಭಾರತದಲ್ಲಿ 1 ಮಿಲಿಯನ್‌ಗಿಂತಲೂ ಹೆಚ್ಚು ಆಶಾ ಕಾರ್ಯಕರ್ತರಿದ್ದಾರೆ - ಗ್ರಾಮೀಣ ಸಮುದಾಯಗಳನ್ನು ಆರೋಗ್ಯ ಸೇವೆಗೆ ಸಂಪರ್ಕಿಸುವ ತೆರೆಮರೆಯ ಹೀರೋಗಳು.' },
  { icon: 'local_hospital', fact: 'The Jan Aushadhi scheme provides quality medicines at affordable prices through 10,000+ stores across India.', fact_kn: 'ಜನ ಔಷಧಿ ಯೋಜನೆಯು ಭಾರತದಾದ್ಯಂತ 10,000 ಕ್ಕೂ ಹೆಚ್ಚು ಮಳಿಗೆಗಳ ಮೂಲಕ ಕೈಗೆಟುಕುವ ದರದಲ್ಲಿ ಗುಣಮಟ್ಟದ ಔಷಧಿಗಳನ್ನು ಒದಗಿಸುತ್ತದೆ.' },
  { icon: 'schedule', fact: 'Taking medicines at the same time every day improves their effectiveness by up to 30%.', fact_kn: 'ಪ್ರತಿದಿನ ಒಂದೇ ಸಮಯದಲ್ಲಿ ಔಷಧಿಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳುವುದರಿಂದ ಅವುಗಳ ಪರಿಣಾಮಕಾರಿತ್ವವು 30% ರಷ್ಟು ಸುಧಾರಿಸುತ್ತದೆ.' },
  { icon: 'water_drop', fact: 'Always take tablets with a full glass of water unless your doctor advises otherwise.', fact_kn: 'ವೈದ್ಯರು ಬೇರೆ ರೀತಿಯಲ್ಲಿ ಸೂಚಿಸದ ಹೊರತು ಯಾವಾಗಲೂ ಒಂದು ಲೋಟ ನೀರಿನೊಂದಿಗೆ ಮಾತ್ರೆಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಿ.' },
  { icon: 'warning', fact: 'Never share prescription medicines with others — a medicine safe for you might be harmful to someone else.', fact_kn: 'ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಔಷಧಿಗಳನ್ನು ಎಂದಿಗೂ ಇತರರೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ - ನಿಮಗೆ ಸುರಕ್ಷಿತವಾದ ಔಷಧಿಯು ಬೇರೆಯವರಿಗೆ ಹಾನಿಕಾರಕವಾಗಬಹುದು.' },
  { icon: 'psychology', fact: 'AushadhiSaathi cross-references CDSCO alerts to detect fake and substandard medicines instantly.', fact_kn: 'ನಕಲಿ ಮತ್ತು ಕಳಪೆ ಔಷಧಿಗಳನ್ನು ತಕ್ಷಣವೇ ಪತ್ತೆಹಚ್ಚಲು ಔಷಧಿ ಸಾಥಿ CDSCO ಎಚ್ಚರಿಕೆಗಳನ್ನು ಬಳಸುತ್ತದೆ.' },
];

export default function LoadingFacts() {
  const { lang } = useLang();
  const [currentFact, setCurrentFact] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    setCurrentFact(Math.floor(Math.random() * HEALTH_FACTS.length));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentFact((prev) => (prev + 1) % HEALTH_FACTS.length);
        setFadeIn(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fact = HEALTH_FACTS[currentFact];

  return (
    <div className="w-full max-w-md mx-auto mt-6 px-2 pb-24">
      {/* Animated spinner */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-16 h-16 mb-3">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-700"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#005D67] dark:border-t-teal-400 animate-spin"></div>
          <div
            className="absolute inset-2 rounded-full border-4 border-transparent border-b-[#0e3f6e] dark:border-b-sky-400 animate-spin"
            style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
          ></div>
        </div>
        <p className="text-sm font-semibold text-[#005D67] dark:text-teal-400 font-manrope animate-pulse">
          {lang === 'kn' ? 'ನಿಮ್ಮ ಚಿತ್ರವನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...' : 'Analyzing your image...'}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mb-5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-[#005D67] dark:bg-teal-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s`, animationDuration: '1.2s' }}
          />
        ))}
      </div>

      {/* Fact card */}
      <div
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-lg"
        style={{ opacity: fadeIn ? 1 : 0, transform: fadeIn ? 'translateY(0)' : 'translateY(6px)', transition: 'opacity 0.4s ease, transform 0.4s ease' }}
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 flex-shrink-0 bg-[#005D67]/10 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-[#005D67] dark:text-teal-400" style={{ fontVariationSettings: "'FILL' 1" }}>
              {fact.icon}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#005D67] dark:text-teal-400 font-manrope mb-1.5">
              {lang === 'kn' ? 'ನಿಮಗೆ ಗೊತ್ತೇ?' : 'Did you know?'}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-manrope">
              {lang === 'kn' ? fact.fact_kn : fact.fact}
            </p>
          </div>
        </div>
      </div>

      {/* Progress bar dots */}
      <div className="flex justify-center mt-3 gap-1">
        {HEALTH_FACTS.map((_, i) => (
          <div
            key={i}
            className="h-1 rounded-full transition-all duration-300"
            style={{
              width: i === currentFact ? '16px' : '4px',
              backgroundColor: i === currentFact ? '#005D67' : '#e2e8f0',
            }}
          />
        ))}
      </div>
    </div>
  );
}
