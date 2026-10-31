import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE } from '../api';

export default function DoseScheduleSection({ prescriptionData, lang, t }) {
  const [scheduleData, setScheduleData] = useState(null);
  const [audioData, setAudioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAudioLang, setActiveAudioLang] = useState(lang || 'en');
  const [activeSlotTab, setActiveSlotTab] = useState('all'); // 'all' | 'morning' | 'afternoon' | 'night'
  const audioElementRef = useRef(null);

  // Sync activeAudioLang with global language changes
  useEffect(() => {
    setActiveAudioLang(lang || 'en');
  }, [lang]);

  // Fetch Schedule and Safety Check
  const fetchSchedule = useCallback(async () => {
    if (!prescriptionData) return;
    setLoading(true);
    setError(null);
    try {
      const rx = prescriptionData.prescription || prescriptionData;
      const response = await fetch(`${API_BASE}/api/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescription: rx,
          language: lang || 'en',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate schedule.');
      }

      setScheduleData(data);
      setAudioData({
        en: data.audio_en,
        kn: data.audio_kn,
        hi: data.audio_hi,
        current: data.audio,
      });
    } catch (err) {
      console.error('Schedule fetch error:', err);
      setError(err.message || 'Unable to load schedule.');
    } finally {
      setLoading(false);
    }
  }, [prescriptionData, lang]);

  useEffect(() => {
    fetchSchedule();
    return () => {
      stopAudio();
    };
  }, [fetchSchedule]);

  // Audio Playback Handler
  const stopAudio = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  const handlePlayAudio = (targetLang) => {
    const desiredLang = targetLang || activeAudioLang;

    // Toggle pause if already playing same language
    if (isPlaying && (!targetLang || targetLang === activeAudioLang)) {
      stopAudio();
      return;
    }

    stopAudio();
    setActiveAudioLang(desiredLang);

    const base64Audio = (
      desiredLang === 'hi'
        ? (audioData?.hi || (lang === 'hi' ? audioData?.current : null))
        : desiredLang === 'kn'
        ? (audioData?.kn || (lang === 'kn' ? audioData?.current : null))
        : (audioData?.en || audioData?.current)
    );

    if (base64Audio) {
      try {
        const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
        audioElementRef.current = audio;
        audio.onplay = () => setIsPlaying(true);
        audio.onended = () => {
          setIsPlaying(false);
          audioElementRef.current = null;
        };
        audio.onerror = () => {
          console.warn('Backend audio failed, falling back to Web Speech API');
          fallbackSpeech(desiredLang);
        };
        audio.play().catch(() => fallbackSpeech(desiredLang));
        return;
      } catch (e) {
        console.warn('Audio play exception:', e);
      }
    }

    // Fallback: browser SpeechSynthesis
    fallbackSpeech(desiredLang);
  };

  const fallbackSpeech = (desiredLang) => {
    if (!('speechSynthesis' in window)) {
      setIsPlaying(false);
      return;
    }
    window.speechSynthesis.cancel();
    const textToSpeak = desiredLang === 'hi'
      ? (scheduleData?.summary_hi || 'यह आपकी दवा समय-सारणी है। किसी भी परेशानी में डॉक्टर से पूछें।')
      : desiredLang === 'kn'
      ? (scheduleData?.summary_kn || 'ಇದು ನಿಮ್ಮ ಔಷಧಿ ವೇಳಾಪಟ್ಟಿ. ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.')
      : (scheduleData?.summary_en || 'Here is your daily dose schedule. Please consult your doctor.');

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = desiredLang === 'hi' ? 'hi-IN' : desiredLang === 'kn' ? 'kn-IN' : 'en-US';
    utterance.rate = 0.95;
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  // Helper for food badges and icons
  const getFoodBadge = (foodText) => {
    const raw = String(foodText || '').toLowerCase();
    if (raw.includes('before') || raw.includes('ac') || raw.includes('ಮುಂಚೆ') || raw.includes('ಮೊದಲು') || raw.includes('पहले')) {
      return {
        label: t('beforeFood'),
        icon: 'restaurant',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        iconColor: 'text-emerald-600',
      };
    }
    if (raw.includes('after') || raw.includes('pc') || raw.includes('ನಂತರ') || raw.includes('बाद')) {
      return {
        label: t('afterFood'),
        icon: 'flatware',
        className: 'bg-sky-50 text-sky-700 border-sky-200',
        iconColor: 'text-sky-600',
      };
    }
    if (raw.includes('with') || raw.includes('ಜೊತೆಗೆ') || raw.includes('साथ')) {
      return {
        label: t('withFood'),
        icon: 'soup_kitchen',
        className: 'bg-purple-50 text-purple-700 border-purple-200',
        iconColor: 'text-purple-600',
      };
    }
    return {
      label: t('askPharmacist'),
      icon: 'help_outline',
      className: 'bg-amber-50 text-amber-800 border-amber-200',
      iconColor: 'text-amber-600',
    };
  };


  // Helper for interaction risk styling
  const getRiskDetails = (risk) => {
    const r = String(risk || '').toLowerCase();
    if (r === 'high') {
      return {
        badgeText: t('highRisk'),
        icon: 'report',
        boxClass: 'bg-rose-50 border-rose-300 text-rose-950',
        badgeClass: 'bg-rose-100 text-rose-800 border border-rose-200',
        iconColor: 'text-rose-600',
      };
    }
    if (r === 'medium') {
      return {
        badgeText: t('mediumRisk'),
        icon: 'warning',
        boxClass: 'bg-amber-50 border-amber-300 text-amber-950',
        badgeClass: 'bg-amber-100 text-amber-800 border border-amber-200',
        iconColor: 'text-amber-600',
      };
    }
    return {
      badgeText: t('lowRisk'),
      icon: 'check_circle',
      boxClass: 'bg-emerald-50 border-emerald-300 text-emerald-950',
      badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      iconColor: 'text-emerald-600',
    };
  };

  // Render individual medicine card
  const renderMedicineCard = (item, idx) => {
    const medName = item.medicine || item.name || 'Medicine';
    const dose = item.dose;
    const foodInstruction = item.food || item.timing;
    const foodBadge = getFoodBadge(foodInstruction);
    const instruction = item.instruction;

    return (
      <div
        key={idx}
        className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-2"
      >
        <div>
          <div className="flex items-start justify-between gap-1 mb-1">
            <h5 className="font-manrope font-bold text-slate-800 text-sm sm:text-base leading-snug break-words">
              {medName}
            </h5>
          </div>
          {dose && dose !== 'unsure, ask your pharmacist' && (
            <span className="inline-block bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-md mb-2">
              {dose}
            </span>
          )}
        </div>

        {/* Food instruction icon & badge */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${foodBadge.className}`}>
          <span className={`material-symbols-outlined text-[16px] shrink-0 ${foodBadge.iconColor}`}>
            {foodBadge.icon}
          </span>
          <span className="truncate">{foodBadge.label}</span>
        </div>

        {/* Instruction note if present and not redundant */}
        {instruction && !instruction.toLowerCase().includes('take with a glass of water') && (
          <p className="text-[11px] text-slate-500 leading-tight italic">
            {instruction}
          </p>
        )}
      </div>
    );
  };

  // Render a column for morning, afternoon, or night
  const renderSlotColumn = (slotKey, title, timeRange, iconName, headerGradient, items) => {
    return (
      <div className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/60 overflow-hidden shadow-xs">
        {/* Slot Header */}
        <div className={`p-3 border-b border-slate-200 flex items-center justify-between ${headerGradient}`}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">{iconName}</span>
            <div>
              <h4 className="font-manrope font-bold text-sm tracking-tight">{title}</h4>
              <p className="text-[11px] opacity-80">{timeRange}</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/70 shadow-xs">
            {items.length}
          </span>
        </div>

        {/* Slot Content */}
        <div className="p-2 sm:p-3 space-y-2 flex-grow min-h-[140px] flex flex-col">
          {items.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center p-4 text-center text-slate-400">
              <span className="material-symbols-outlined text-2xl mb-1 opacity-50">event_available</span>
              <p className="text-xs font-medium">{t('noMedicinesInSlot')}</p>
            </div>
          ) : (
            items.map((m, i) => renderMedicineCard(m, i))
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="mb-6 bg-white border border-teal-100 rounded-2xl p-6 shadow-sm text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#005D67]/10 text-[#005D67] mb-3 animate-spin">
          <span className="material-symbols-outlined text-2xl">sync</span>
        </div>
        <h4 className="font-manrope font-bold text-slate-800 text-sm sm:text-base mb-1">
          {t('dailyDoseSchedule')}
        </h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {t('loadingSchedule')}
        </p>
      </div>
    );
  }

  if (error && !scheduleData) {
    return (
      <div className="mb-6 bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-rose-500 shrink-0 text-2xl">warning</span>
          <div className="flex-grow">
            <h4 className="font-manrope font-bold text-rose-900 text-sm mb-1">
              {t('dailyDoseSchedule')}
            </h4>
            <p className="text-xs text-rose-700 mb-3">
              {t('scheduleError')}
            </p>
            <button
              onClick={fetchSchedule}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              {t('retrySchedule')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const schedule = scheduleData?.schedule || {};
  const morningList = schedule.morning || [];
  const afternoonList = schedule.afternoon || [];
  const nightList = schedule.night || [];
  const interactions = scheduleData?.interactions || [];
  const warnings = scheduleData?.warnings || [];

  return (
    <div className="mb-6 space-y-6">
      {/* ===== SECTION 1: HEADER & AUDIO LISTEN ACTION ===== */}
      <div className="bg-gradient-to-r from-[#005D67]/90 to-[#0e3f6e]/90 text-white rounded-2xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-amber-300">calendar_clock</span>
            <h3 className="font-manrope font-extrabold text-base sm:text-lg tracking-tight">
              {t('dailyDoseSchedule')}
            </h3>
          </div>
          <p className="text-xs text-slate-200 max-w-md">
            {t('scheduleSubtitle')}
          </p>
        </div>

        {/* Listen Button & Language Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            onClick={() => handlePlayAudio(activeAudioLang)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-manrope font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 ${
              isPlaying
                ? 'bg-amber-400 text-slate-900 animate-pulse'
                : 'bg-white text-[#005D67] hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {isPlaying ? 'pause_circle' : 'volume_up'}
            </span>
            <span>
              {isPlaying ? t('pauseAudio') : t('listenToSchedule')}
            </span>
          </button>

          {/* Choose speech language */}
          <div className="flex items-center bg-white/20 rounded-xl p-0.5 backdrop-blur-xs">
            {[
              { code: 'en', label: 'EN', titleKey: 'listenInEnglish' },
              { code: 'kn', label: 'KN', titleKey: 'listenInKannada' },
              { code: 'hi', label: 'HI', titleKey: 'listenInHindi' },
            ].map((item) => (
              <button
                key={item.code}
                onClick={() => handlePlayAudio(item.code)}
                title={t(item.titleKey)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeAudioLang === item.code
                    ? 'bg-white text-[#005D67] shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>


      {/* ===== SECTION 2: MOBILE SLOT FILTER TOGGLE (for small screens) ===== */}
      <div className="flex items-center justify-between bg-slate-100 p-1 rounded-xl text-xs font-semibold sm:hidden">
        <button
          onClick={() => setActiveSlotTab('all')}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
            activeSlotTab === 'all'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('allSlots')}
        </button>
        <button
          onClick={() => setActiveSlotTab('morning')}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
            activeSlotTab === 'morning'
              ? 'bg-amber-100 text-amber-900 shadow-xs font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('morning')}
        </button>
        <button
          onClick={() => setActiveSlotTab('afternoon')}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
            activeSlotTab === 'afternoon'
              ? 'bg-sky-100 text-sky-900 shadow-xs font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('afternoon')}
        </button>
        <button
          onClick={() => setActiveSlotTab('night')}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
            activeSlotTab === 'night'
              ? 'bg-indigo-100 text-indigo-900 shadow-xs font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('night')}
        </button>
      </div>

      {/* ===== SECTION 3: 3-COLUMN TIMETABLE ===== */}
      <div
        className={`grid gap-3 sm:gap-4 ${
          activeSlotTab === 'all'
            ? 'grid-cols-1 sm:grid-cols-3'
            : 'grid-cols-1'
        }`}
      >
        {/* Morning Column */}
        {(activeSlotTab === 'all' || activeSlotTab === 'morning') &&
          renderSlotColumn(
            'morning',
            t('morning'),
            t('morningTime'),
            'wb_sunny',
            'bg-amber-50 text-amber-900',
            morningList
          )}

        {/* Afternoon Column */}
        {(activeSlotTab === 'all' || activeSlotTab === 'afternoon') &&
          renderSlotColumn(
            'afternoon',
            t('afternoon'),
            t('afternoonTime'),
            'light_mode',
            'bg-sky-50 text-sky-900',
            afternoonList
          )}

        {/* Night Column */}
        {(activeSlotTab === 'all' || activeSlotTab === 'night') &&
          renderSlotColumn(
            'night',
            t('night'),
            t('nightTime'),
            'bedtime',
            'bg-indigo-50 text-indigo-900',
            nightList
          )}
      </div>

      {/* ===== SECTION 4: SAFETY CHECK & DRUG INTERACTIONS (COLOR-CODED BOXES) ===== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <span className="material-symbols-outlined text-[#005D67]">security</span>
          <h4 className="font-manrope font-bold text-slate-800 text-sm sm:text-base">
            {t('safetyAndInteractions')}
          </h4>
        </div>

        {/* Interaction Warning Boxes */}
        <div className="space-y-3">
          {interactions.length === 0 ? (
            <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-950 flex items-start gap-3">
              <span className="material-symbols-outlined text-emerald-600 text-xl shrink-0 mt-0.5">
                verified
              </span>
              <div>
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 mb-1">
                  {t('lowRisk')}
                </span>
                <p className="text-xs leading-relaxed">
                  {t('noInteractionsDetected')}
                </p>
              </div>
            </div>
          ) : (
            interactions.map((inter, idx) => {
              const details = getRiskDetails(inter.risk);
              const meds = Array.isArray(inter.medicines) ? inter.medicines : [];

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border ${details.boxClass} flex items-start gap-3 transition-shadow hover:shadow-xs`}
                >
                  <span className={`material-symbols-outlined text-xl shrink-0 mt-0.5 ${details.iconColor}`}>
                    {details.icon}
                  </span>
                  <div className="flex-grow space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${details.badgeClass}`}>
                        {details.badgeText}
                      </span>
                      {meds.length > 0 && (
                        <span className="text-xs font-semibold text-slate-700 bg-white/70 px-2 py-0.5 rounded-md border border-slate-200/60">
                          {meds.join(' + ')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed font-medium">
                      {inter.note}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Special Clinical Warnings */}
        {warnings.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <h5 className="font-manrope font-bold text-xs uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-amber-500">notifications</span>
              {t('specialWarnings')}
            </h5>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {warnings.map((w, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-slate-400 mt-0.5">•</span>
                  <span className="leading-relaxed">{w}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ===== SECTION 5: NOT MEDICAL ADVICE DISCLAIMER ===== */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-2.5 text-amber-900">
        <span className="material-symbols-outlined text-amber-600 text-lg shrink-0 mt-0.5">
          health_and_safety
        </span>
        <p className="text-[11px] sm:text-xs leading-relaxed text-amber-800/90 font-medium">
          {t('notMedicalAdviceDisclaimer')}
        </p>
      </div>
    </div>
  );
}
