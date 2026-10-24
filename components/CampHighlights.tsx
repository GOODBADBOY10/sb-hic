'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play, Volume2, Maximize, Trophy, ShieldAlert, Award, Users,
  Laptop, Moon, Sun, Flame, BookOpen,
} from 'lucide-react';

interface HighlightItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
}

const highlights: HighlightItem[] = [
  { id: 'tahajjud', title: 'Sacred Tahajjud Prayers', subtitle: 'Daily at 4:00 AM — Standing in Devotion', description: 'Experience deep spiritual tranquility in the quiet hours of the night. Stand in congregation under the stars, connecting with your Lord.', icon: <Moon className="h-5 w-5 text-[#E8B923]" /> },
  { id: 'congregation', title: 'Congregational Solah (All Solaat)', subtitle: 'Unity in Devotion — Five Times Daily', description: 'Establish standard prayers in perfect alignment. Build deep bonds, punctuality, and spiritual strength by joining hundreds of brothers and sisters.', icon: <Users className="h-5 w-5 text-[#E8B923]" /> },
  { id: 'muaayasha', title: "Mu'aayasha & Morning Riyadoh", subtitle: 'Daily at 6:20 AM — Adhkar & Team Bonding', description: 'Moments of morning physical fitness, Hisnul Muslim Adhkar memorizations, and cozy campfire stories cultivating deep social integration.', icon: <Flame className="h-5 w-5 text-[#E8B923]" /> },
  { id: 'duha', title: 'Solaatul Duhaa & Tilawah', subtitle: 'Daily at 10:31 AM — Morning Serenity', description: 'Dedicated quiet hours for individual morning Duhaa prayer, personal dua, and structured Tilawat-ul-Quran.', icon: <Sun className="h-5 w-5 text-[#E8B923]" /> },
  { id: 'lecture', title: 'Transformative Lectures', subtitle: 'Led by Renowned National Scholars', description: 'Exquisite sessions unlocking classical wisdom, exegesis (Tafseer), everyday worship habits, and Quranic perspectives on modern challenges.', icon: <BookOpen className="h-5 w-5 text-[#E8B923]" /> },
  { id: 'it_session', title: 'IT & Digital Skills Session', subtitle: 'Digital Safety & Technological Literacy', description: 'A cutting-edge workshop teaching safe internet habits, cyber ethics, modern digital safety tools, and essential tech skills.', icon: <Laptop className="h-5 w-5 text-[#E8B923]" /> },
  { id: 'sports', title: 'Sports & Games (Football/Scrabble)', subtitle: 'Teamwork, Fitness & Mental Strategy', description: 'Lace up for our competitive football cup tournament or test your lexicon in the scrabble league.', icon: <Trophy className="h-5 w-5 text-[#E8B923]" /> },
  { id: 'quranic', title: 'Quranic Musabaqoh & Competitions', subtitle: 'The Prestigious Quranic Arena', description: 'An inspiring annual platform celebrating memorization, beautiful recitation, tajweed accuracy, and high-pressure quiz challenges.', icon: <Award className="h-5 w-5 text-[#E8B923]" /> },
  { id: 'single', title: 'Single Seminar Panel', subtitle: 'Morality, Identity & Career Growth', description: 'Empowering conversations for secondary students and graduates navigating modern peer pressure, digital ethics, and self-discipline.', icon: <ShieldAlert className="h-5 w-5 text-[#E8B923]" /> },
];

const sportsImages = ['/images/sports/sports_1.jpg', '/images/sports/sports_2.jpg', '/images/sports/sports_3.jpg', '/images/sports/sports_4.jpg', '/images/sports/sports_5.jpg'];
const lectureImages = ['/images/highlights/feature_6_2.jpg', '/images/highlights/feature_5_2.jpg', '/images/highlights/feature_5_3.jpg', '/images/highlights/feature_5_4.jpg', '/images/highlights/feature_5_5.jpg', '/images/highlights/feature_5_6.jpg', '/images/highlights/feature_5_7.jpg', '/images/highlights/feature_5_8.jpg', '/images/highlights/feature_5_9.jpg'];
const itImages = ['/images/highlights/feature_6_1.jpg', '/images/highlights/feature_6_2.jpg', '/images/highlights/feature_6_3.jpg'];
const seminarImages = ['/images/highlights/feature_9_1.jpg', '/images/highlights/feature_9_2.jpg', '/images/highlights/feature_9_3.jpg'];

function Carousel({ images, index, setIndex, label }: { images: string[]; index: number; setIndex: (fn: (p: number) => number) => void; label: string }) {
  return (
    <div className="group relative my-3 flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-emerald-500/20 bg-black">
      <AnimatePresence mode="wait">
        <motion.img
          key={index}
          src={images[index]}
          alt={`${label} ${index + 1}`}
          initial={{ opacity: 0, scale: 0.96, filter: 'blur(4px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(4px)' }}
          transition={{ duration: 0.3 }}
          className="h-full w-full object-cover object-center"
        />
      </AnimatePresence>

      <button onClick={(e) => { e.stopPropagation(); setIndex((p) => (p - 1 + images.length) % images.length); }} className="absolute left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 font-bold text-white transition-all hover:bg-[#145237] active:scale-90">←</button>
      <button onClick={(e) => { e.stopPropagation(); setIndex((p) => (p + 1) % images.length); }} className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 font-bold text-white transition-all hover:bg-[#145237] active:scale-90">→</button>

      <div className="absolute inset-x-0 bottom-3 z-10 flex flex-wrap justify-center gap-1.5 px-4">
        {images.map((_, idx) => (
          <button key={idx} onClick={(e) => { e.stopPropagation(); setIndex(() => idx); }} className={`h-1.5 rounded-full transition-all ${index === idx ? 'w-3 bg-[#E8B923]' : 'w-1.5 bg-white/40 hover:bg-white'}`} />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
    </div>
  );
}

export default function CampHighlights() {
  const [activeId, setActiveId] = useState<string>('tahajjud');
  const [tahajjudGender, setTahajjudGender] = useState<'female' | 'male'>('female');
  const [sportsIdx, setSportsIdx] = useState(0);
  const [lectureIdx, setLectureIdx] = useState(0);
  const [itIdx, setItIdx] = useState(0);
  const [seminarIdx, setSeminarIdx] = useState(0);

  useEffect(() => {
    const observerOptions = { root: null, rootMargin: '-48% 0px -48% 0px', threshold: 0 };
    let activeTimeoutId: ReturnType<typeof setTimeout>;

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const cleanId = entry.target.id.replace('section-', '');
          clearTimeout(activeTimeoutId);
          activeTimeoutId = setTimeout(() => setActiveId(cleanId), 100);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    highlights.forEach((item) => {
      const el = document.getElementById(`section-${item.id}`);
      if (el) observer.observe(el);
    });
    return () => {
      observer.disconnect();
      clearTimeout(activeTimeoutId);
    };
  }, []);

  useEffect(() => {
    if (activeId !== 'tahajjud') return;
    const timer = setInterval(() => setTahajjudGender((p) => (p === 'female' ? 'male' : 'female')), 4000);
    return () => clearInterval(timer);
  }, [activeId]);

  useEffect(() => {
    if (activeId !== 'sports') return;
    const timer = setInterval(() => setSportsIdx((p) => (p + 1) % 5), 3500);
    return () => clearInterval(timer);
  }, [activeId]);

  useEffect(() => {
    if (activeId !== 'lecture') return;
    const timer = setInterval(() => setLectureIdx((p) => (p + 1) % 9), 3500);
    return () => clearInterval(timer);
  }, [activeId]);

  useEffect(() => {
    if (activeId !== 'it_session') return;
    const timer = setInterval(() => setItIdx((p) => (p + 1) % 3), 3500);
    return () => clearInterval(timer);
  }, [activeId]);

  useEffect(() => {
    if (activeId !== 'single') return;
    const timer = setInterval(() => setSeminarIdx((p) => (p + 1) % 3), 3500);
    return () => clearInterval(timer);
  }, [activeId]);

  return (
    <div className="grid w-full grid-cols-1 gap-12 py-12 lg:grid-cols-12">
      {/* Scrollable highlight cards */}
      <div className="flex flex-col gap-24 pb-32 lg:col-span-5 lg:gap-36">
        {highlights.map((item, idx) => (
          <motion.div
            key={item.id}
            id={`section-${item.id}`}
            className={`cursor-pointer rounded-3xl border p-8 text-left transition-all duration-500 ${
              activeId === item.id ? 'border-[#E8B923]/40 bg-gradient-to-br from-[#0F3D2E] to-[#0A2A20] text-white shadow-xl' : 'border-slate-100 bg-white text-slate-800 hover:border-slate-200'
            }`}
            onClick={() => { setActiveId(item.id); document.getElementById(`section-${item.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${activeId === item.id ? 'bg-[#18533F]' : 'bg-amber-50'}`}>{item.icon}</div>
              <span className={`text-[10px] font-black uppercase tracking-wider ${activeId === item.id ? 'text-[#E8B923]' : 'text-[#0F3D2E]'}`}>CAMP FEATURE {idx + 1}</span>
            </div>
            <h3 className="mb-2 font-serif text-2xl font-black tracking-tight">{item.title}</h3>
            <p className={`mb-4 text-xs font-bold uppercase tracking-wider ${activeId === item.id ? 'text-emerald-400' : 'text-amber-700'}`}>{item.subtitle}</p>
            <p className={`text-sm leading-relaxed ${activeId === item.id ? 'text-emerald-100/90' : 'text-slate-600'}`}>{item.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Sticky panel */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="flex h-[420px] flex-col overflow-hidden rounded-3xl border-4 border-slate-900 bg-slate-950 shadow-2xl sm:h-[480px] lg:sticky lg:top-24 lg:col-span-7 lg:h-[520px]"
      >
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
            <span className="h-3 w-3 rounded-full bg-yellow-500" />
            <span className="h-3 w-3 rounded-full bg-green-500" />
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-emerald-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Live Render · SB HIC 4K
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-black p-6">
          <AnimatePresence mode="wait">
            {activeId === 'tahajjud' && (
              <motion.div key="tahajjud" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.4 }} className="flex h-full w-full flex-col justify-between text-left">
                <div className="flex items-center justify-between font-mono text-[10px] text-[#E8B923]">
                  <span>ATMOSPHERE: PRE-DAWN DEVOTION</span>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setTahajjudGender('female'); }} className={`rounded px-2 py-0.5 font-bold transition-all ${tahajjudGender === 'female' ? 'bg-[#E8B923] text-[#0F3D2E]' : 'bg-slate-900 text-slate-400'}`}>Sisters</button>
                    <button onClick={(e) => { e.stopPropagation(); setTahajjudGender('male'); }} className={`rounded px-2 py-0.5 font-bold transition-all ${tahajjudGender === 'male' ? 'bg-[#E8B923] text-[#0F3D2E]' : 'bg-slate-900 text-slate-400'}`}>Brothers</button>
                  </div>
                </div>
                <div className="group relative my-3 flex-1 overflow-hidden rounded-2xl border border-emerald-500/20">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={tahajjudGender}
                      src={tahajjudGender === 'female' ? '/images/my_tahajjud_female.jpg' : '/images/my_tahajjud_male.jpg'}
                      alt={tahajjudGender === 'female' ? 'Sisters Sacred Tahajjud Prayers' : 'Brothers Sacred Tahajjud Prayers'}
                      initial={{ opacity: 0, filter: 'blur(5px)' }}
                      animate={{ opacity: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, filter: 'blur(5px)' }}
                      transition={{ duration: 0.4 }}
                      className={`h-full w-full object-cover ${tahajjudGender === 'male' ? 'object-bottom' : ''}`}
                    />
                  </AnimatePresence>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 font-mono text-[9px] text-white backdrop-blur-md">
                    <span className="h-1.5 w-1.5 animate-ping rounded-full bg-red-500" />
                    <span>HIC Night Worship · {tahajjudGender === 'female' ? "Sisters' Courtyard" : "Brothers' Arena"}</span>
                  </div>
                </div>
                <div className="rounded border border-[#145237]/60 bg-[#145237]/60 py-2 text-center text-xs font-semibold text-white/90">✨ Reviving the heart through tranquil pre-dawn prostrations and sincere congregational worship</div>
              </motion.div>
            )}

            {activeId === 'congregation' && (
              <motion.div key="congregation" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.4 }} className="flex h-full w-full flex-col justify-between text-left">
                <div className="flex items-center justify-between font-mono text-[10px] text-[#E8B923]">
                  <span>CONGREGATION: FIVE DAILY PRAYERS</span>
                  <span>STATUS: LIVE FEED (MUTED)</span>
                </div>
                <div className="group relative my-3 flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-emerald-500/20 bg-black">
                  <video src="/videos/camp_feature_2.mp4" className="h-full w-full object-cover" controls autoPlay muted playsInline loop preload="auto" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
                <div className="rounded border border-[#145237]/60 bg-[#145237]/60 py-2 text-center text-xs font-semibold text-white/90">🤲 Establishing Solah on time, standing shoulder-to-shoulder in complete submission</div>
              </motion.div>
            )}

            {activeId === 'muaayasha' && (
              <motion.div key="muaayasha" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.4 }} className="flex h-full w-full flex-col justify-between text-left">
                <div className="flex justify-between font-mono text-[10px] text-[#E8B923]">
                  <span>CAMPFIRE & TEAM BONDING</span>
                  <span>STATUS: ADHKAR & REFLECTION</span>
                </div>
                <div className="relative my-3 flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-emerald-500/20 bg-black">
                  <img src="/images/highlights/feature_3_1.jpg" alt="Mu'aayasha & Morning Riyadoh" className="h-full w-full object-cover object-center" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
                <div className="rounded border border-[#145237]/60 bg-[#145237]/60 py-2 text-center text-xs font-semibold text-white/90">🔥 Interactive circles cultivating deep bonds, fitness routines, and campfire story nights</div>
              </motion.div>
            )}

            {activeId === 'duha' && (
              <motion.div key="duha" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.4 }} className="flex h-full w-full flex-col justify-between text-left">
                <div className="flex justify-between font-mono text-[10px] text-[#E8B923]">
                  <span>FORENOON: SOLAATUL DUHAA</span>
                  <span>THEME: TILAWAT-UL-QURAN & DUA</span>
                </div>
                <div className="relative my-3 flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-emerald-500/20 bg-black">
                  <img src="/images/highlights/feature_4_1.jpg" alt="Solaatul Duhaa & Tilawah" className="h-full w-full object-cover object-center" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
                <div className="rounded border border-[#145237]/60 bg-[#145237]/60 py-2 text-center text-xs font-semibold text-white/90">☀️ Nurturing morning mindfulness and individual worship before daily seminars begin</div>
              </motion.div>
            )}

            {activeId === 'lecture' && (
              <motion.div key="lecture" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.4 }} className="flex h-full w-full flex-col justify-between text-left">
                <div className="flex justify-between font-mono text-[10px] text-[#E8B923]">
                  <span>TRANSFORMATIVE LECTURES & SERMONS</span>
                  <span className="font-bold tracking-wider">PHOTO {lectureIdx + 1} OF 9</span>
                </div>
                <Carousel images={lectureImages} index={lectureIdx} setIndex={setLectureIdx} label="Transformative Lecture Highlight" />
                <div className="rounded border border-[#145237]/60 bg-[#145237]/60 py-2 text-center text-xs font-semibold text-white/90">📖 Pursuing authentic intellectual growth and purifying daily action with divine knowledge</div>
              </motion.div>
            )}

            {activeId === 'it_session' && (
              <motion.div key="it_session" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.4 }} className="flex h-full w-full flex-col justify-between text-left">
                <div className="flex justify-between font-mono text-[10px] text-[#E8B923]">
                  <span>IT & DIGITAL SKILLS WORKSHOPS</span>
                  <span className="font-bold tracking-wider">PHOTO {itIdx + 1} OF 3</span>
                </div>
                <Carousel images={itImages} index={itIdx} setIndex={setItIdx} label="IT Workshop Highlight" />
                <div className="rounded border border-[#145237]/60 bg-[#145237]/60 py-2 text-center text-xs font-semibold text-white/90">💻 Harnessing modern digital tools to add value and build ethical tech careers</div>
              </motion.div>
            )}

            {activeId === 'sports' && (
              <motion.div key="sports" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.4 }} className="flex h-full w-full flex-col justify-between text-left">
                <div className="flex justify-between font-mono text-[10px] text-[#E8B923]">
                  <span>ATHLETICS & INDOOR GAMES</span>
                  <span className="font-bold tracking-wider">PHOTO {sportsIdx + 1} OF 5</span>
                </div>
                <Carousel images={sportsImages} index={sportsIdx} setIndex={setSportsIdx} label="Camp Sports Highlight" />
                <div className="rounded border border-[#145237]/60 bg-[#145237]/60 py-2 text-center text-xs font-semibold text-white/90">⚽ Sports & Athletics: Nurturing fitness, friendly sportsmanship, and mental vocabulary challenges</div>
              </motion.div>
            )}

            {activeId === 'quranic' && (
              <motion.div key="quranic" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.4 }} className="flex h-full w-full flex-col justify-between text-left">
                <div className="flex justify-between font-mono text-[10px] text-[#E8B923]">
                  <span>QURANIC COMPETITIONS (MUSABAQOH)</span>
                  <span>STATUS: LIVE STREAM / REPLAY</span>
                </div>
                <div className="relative my-3 flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-emerald-500/20 bg-black">
                  <video src="/videos/camp_feature_8.mp4" className="h-full w-full object-cover" controls autoPlay playsInline loop preload="auto" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
                <div className="rounded border border-[#145237]/60 bg-[#145237]/60 py-2 text-center text-xs font-semibold text-white/90">🔊 Press play to hear the soul-stirring, beautiful recitations of our Quranic contestants</div>
              </motion.div>
            )}

            {activeId === 'single' && (
              <motion.div key="single" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.4 }} className="flex h-full w-full flex-col justify-between text-left">
                <div className="flex justify-between font-mono text-[10px] text-[#E8B923]">
                  <span>SINGLE SEMINAR PANEL</span>
                  <span className="font-bold tracking-wider">PHOTO {seminarIdx + 1} OF 3</span>
                </div>
                <Carousel images={seminarImages} index={seminarIdx} setIndex={setSeminarIdx} label="Single Seminar Highlight" />
                <div className="rounded border border-[#145237]/60 bg-[#145237]/60 py-2 text-center text-xs font-semibold text-white/90">🎓 Morality, Identity, and Career growth seminars for secondary students and graduates</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900 px-5 py-4 font-mono text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <Play className="h-4 w-4 fill-slate-300 text-slate-300 transition-colors hover:fill-white hover:text-white" />
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-ping rounded-full bg-red-600" />
              <span>00:15 / 00:15 LIVE</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Volume2 className="h-4 w-4 cursor-pointer transition-colors hover:text-white" />
            <div className="h-1 w-16 overflow-hidden rounded-full bg-slate-700">
              <div className="h-full w-10 bg-[#E8B923]" />
            </div>
            <Maximize className="h-4 w-4 cursor-pointer transition-colors hover:text-white" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
