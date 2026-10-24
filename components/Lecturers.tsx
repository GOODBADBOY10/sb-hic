'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

interface Speaker {
  id: string;
  name: string;
  role: string;
  image: string | null; // null = no real photo yet, shows an initials placeholder instead
}

const speakers: Speaker[] = [
  { id: 'sheikh_dhikrullah', name: "Sheikh Dhikrullah Shafi'i", role: 'Eminent Scholar & Spiritual Director', image: '/images/lecturers/sheikh-dhikrullah-shafii.jpg' },
  { id: 'sheikh_abdulkabir', name: 'Sheikh Abdulkabir Hamzah', role: 'Tafseer Expert & OTM Chief Imam', image: null },
  { id: 'ustadh_rasheed', name: 'Ustadh Rasheed Hashim', role: 'Digital Safety Counselor', image: null },
  { id: 'sheikh_isa', name: 'Sheikh Isa Akindede', role: 'Spiritual Guide & Quran Scholar', image: null },
];

function initials(name: string) {
  return name
    .split(' ')
    .filter((w) => w[0] === w[0]?.toUpperCase())
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
}

export default function Lecturers() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
      const totalScrollable = scrollWidth - clientWidth;
      if (totalScrollable > 0) setScrollProgress((scrollLeft / totalScrollable) * 100);
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollState);
      updateScrollState();
      window.addEventListener('resize', updateScrollState);
    }
    return () => {
      if (el) el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const cardWidth = 330;
      scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -cardWidth : cardWidth, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full py-10">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 font-mono text-xs font-bold text-[#0F3D2E]">
          <Sparkles className="h-3.5 w-3.5 animate-pulse text-[#E8B923]" />
          <span>Swipe or drag to explore our certified scholars</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-300 ${
              canScrollLeft ? 'border-[#0F3D2E] text-[#0F3D2E] hover:bg-[#0F3D2E] hover:text-white' : 'cursor-not-allowed border-slate-200 text-slate-300'
            }`}
            aria-label="Scroll left"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-300 ${
              canScrollRight ? 'border-[#0F3D2E] text-[#0F3D2E] hover:bg-[#0F3D2E] hover:text-white' : 'cursor-not-allowed border-slate-200 text-slate-300'
            }`}
            aria-label="Scroll right"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex w-full snap-x snap-mandatory gap-6 overflow-x-auto pb-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {speakers.map((speaker, idx) => (
          <motion.div
            key={speaker.id}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: idx * 0.1, ease: 'easeOut' }}
            whileHover={{ y: -8 }}
            className="relative flex h-[460px] w-[290px] flex-shrink-0 snap-start flex-col justify-between overflow-hidden rounded-[32px] border border-emerald-800/30 bg-[#0F3D2E] shadow-xl sm:h-[500px] sm:w-[320px]"
          >
            <div className="p-7 pb-5 text-left">
              <h4 className="font-serif text-xl font-black uppercase leading-tight tracking-tight text-white sm:text-2xl">
                {speaker.name}
              </h4>
              <p className="mt-1.5 text-xs font-bold leading-normal tracking-wide text-[#E8B923] sm:text-sm">{speaker.role}</p>
            </div>

            <div className="relative h-full w-full flex-1 overflow-hidden rounded-b-[32px] bg-[#0F3D2E]">
              {speaker.image ? (
                <img
                  src={speaker.image}
                  alt={speaker.name}
                  className="h-full w-full object-cover brightness-110 contrast-105 transition-transform duration-700 hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#145237] to-[#0A2A20]">
                  <span className="text-6xl font-black text-[#E8B923]/30">{initials(speaker.name)}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mx-auto mt-4 h-1 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-[#0F3D2E] transition-all duration-150" style={{ width: `${Math.max(5, scrollProgress)}%` }} />
      </div>
    </div>
  );
}
