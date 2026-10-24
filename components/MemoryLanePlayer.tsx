'use client';

import { useRef, useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'motion/react';

// Your real highlight-reel audio, at public/memory_lane.mp3.
const LOCAL_AUDIO = '/memory_lane.mp3';
// Graceful fallback if the local file is ever missing — a public-domain
// Quranic recitation CDN. Remove FALLBACK_AUDIO entirely if you'd rather
// it just fail silently than substitute different audio.
const FALLBACK_AUDIO = 'https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/17.mp3';

export default function MemoryLanePlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [audioSrc, setAudioSrc] = useState(LOCAL_AUDIO);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleAudioError = () => {
    if (audioSrc === LOCAL_AUDIO) setAudioSrc(FALLBACK_AUDIO);
  };

  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(0);
  // const lastScrollTime = useRef(Date.now());
  const speedTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // const speedTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = 0.4;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const currentTime = Date.now();
      const dist = Math.abs(currentScrollY - lastScrollY.current);
      const timeDiff = Math.max(1, currentTime - lastScrollTime.current);
      const speed = dist / timeDiff;
      const targetSpeedScale = Math.min(3.5, 1 + speed * 2.5);

      setScrollSpeed(targetSpeedScale);

      if (audioRef.current && isPlaying) {
        const targetVolume = Math.min(0.85, 0.4 + speed * 0.18);
        audioRef.current.volume = targetVolume;
      }

      lastScrollY.current = currentScrollY;
      lastScrollTime.current = currentTime;

      if (speedTimeoutRef.current) clearTimeout(speedTimeoutRef.current);
      speedTimeoutRef.current = setTimeout(() => {
        setScrollSpeed(1);
        if (audioRef.current && isPlaying) audioRef.current.volume = 0.4;
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (speedTimeoutRef.current) clearTimeout(speedTimeoutRef.current);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          audioRef.current!.volume = 0.4;
        })
        .catch(() => setIsPlaying(false));
    }
  };

  const waveBarVariants: Variants = {
    animate: (custom: { baseDuration: number }) => ({
      scaleY: [0.3, 1, 0.3],
      transition: {
        duration: custom.baseDuration,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    }),
  };

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 select-none">
      <audio ref={audioRef} src={audioSrc} onError={handleAudioError} loop />

      <motion.button
        onClick={togglePlay}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="pointer-events-auto flex h-14 items-center gap-3 rounded-full border-2 border-[#E8B923]/40 bg-linear-to-r from-[#0F3D2E] via-[#145237] to-[#1F7A52] px-6 font-bold text-[#E8B923] shadow-2xl"
      >
        <div className="relative flex h-5 w-5 items-center justify-center">
          {isPlaying ? (
            <Pause className="h-5 w-5 fill-[#E8B923] text-[#E8B923]" />
          ) : (
            <Play className="h-5 w-5 translate-x-0.5 fill-[#E8B923] text-[#E8B923]" />
          )}
        </div>
        <span className="text-sm font-semibold tracking-wide text-white">
          {isPlaying ? 'Pause Memory Lane' : 'Play Memory Lane'}
        </span>

        <AnimatePresence>
          {isPlaying && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex h-3.5 items-end gap-0.75"
            >
              <motion.div custom={{ baseDuration: 0.8 }} variants={waveBarVariants} animate="animate" className="h-full w-0.5 origin-bottom rounded-full bg-emerald-400" />
              <motion.div custom={{ baseDuration: 1.1 }} variants={waveBarVariants} animate="animate" className="h-full w-0.5 origin-bottom rounded-full bg-emerald-400" />
              <motion.div custom={{ baseDuration: 0.6 }} variants={waveBarVariants} animate="animate" className="h-full w-0.5 origin-bottom rounded-full bg-emerald-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
