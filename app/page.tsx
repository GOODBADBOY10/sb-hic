'use client';

import { useEffect, useState } from 'react';
import RevealOnScroll from '@/components/RevealOnScroll';
import MemoryLanePlayer from '@/components/MemoryLanePlayer';
import CampHighlights from '@/components/CampHighlights';
import Gallery from '@/components/Gallery';
import Lecturers from '@/components/Lecturers';

const CLASSES = [
  {
    tag: 'JSS1 – JSS3',
    name: 'Lower Class',
    copy: 'For junior secondary students beginning their journey with the fundamentals of the standard.',
  },
  {
    tag: 'SS1 – SS3',
    name: 'Upper Class',
    copy: "For senior secondary students building on that foundation as they prepare for what's next.",
  },
  {
    tag: 'School Leaver · Undergraduate · Graduate',
    name: 'Dawah Class',
    copy: 'For those carrying the standard forward — into higher education, work, and the wider community.',
  },
];

const ENQUIRIES = [
  ['Osun (Osogbo)', '09053444178'],
  ['Ile-Ife', '08103692449'],
  ['Ilesa', '08134747377'],
  ['Abuja', '08067275275'],
  ['Kano', '08066942387'],
  ['Ondo', '08106764258'],
  ['Ekiti', '08128387390'],
  ['Kwara', '07010239060'],
];

function useCountdown(target: string) {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    const d = Math.max(0, Math.ceil((new Date(target).getTime() - Date.now()) / 86400000));
    setDays(d);
  }, [target]);
  return days;
}

export default function Home() {
  const days = useCountdown('2026-12-23T00:00:00');

  return (
    <main className="bg-[#F7F3E8] text-[#14170F]">
      {/* NAV */}
      <header className="sticky top-0 z-30 bg-[#0F3D2E] text-[#F7F3E8]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5 font-extrabold">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8B923] text-xs font-black text-[#0A2A20]">
              SB
            </div>
            <div className="leading-tight">
              Standard Bearers
              <small className="block text-[11px] font-normal opacity-75">Islamic Organization · Osun State</small>
            </div>
          </div>
          <a href="/register" className="rounded-full bg-[#E8B923] px-4.5 py-2.5 text-sm font-bold text-[#0A2A20]">
            Register for Camp
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-[#0F3D2E] pt-16 text-[#F7F3E8]">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-end gap-12 px-6 pb-14 md:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="mb-3 text-sm font-semibold text-[#E8B923]">Holiday Islamic Course</p>
            <h1 className="font-black leading-[0.95] tracking-tight text-[clamp(46px,8vw,92px)]">
              SB HIC<br />
              <span className="text-[#E8B923]">2026</span>
            </h1>
            <p className="mt-4 max-w-md text-lg text-[#C9D6C4]">
              Five days of learning, brotherhood and sisterhood for JSS students through graduates — grouped
              into a class built for where you are.
            </p>
            <p className="mt-5 text-[15px] opacity-90">23–27 December · Oduduwa College, Ile-Ife</p>
            <div className="mt-8 flex flex-wrap gap-3.5">
              <a href="/register" className="rounded-full bg-[#E8B923] px-6.5 py-3.5 font-bold text-[#0A2A20]">
                Register for Camp
              </a>
              <a
                href="#classes"
                className="rounded-full border-[1.5px] border-[#F7F3E8] px-6 py-3 font-semibold opacity-90"
              >
                Learn More
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <div className="rounded-2xl bg-[#E8B923] p-5 text-[#0A2A20] shadow-2xl">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Early Bird Rate</p>
              <p className="mt-1 text-[26px] font-black">
                ₦8,500 <span className="text-base font-bold text-[#9AA090] line-through">₦12,000</span>
              </p>
              <p className="mt-1.5 text-[13px] text-[#4B5347]">
                {days !== null ? `${days} days to camp · ` : ''}Closes 30 November
              </p>
            </div>
            <div className="rounded-2xl bg-[#F7F3E8] p-5 text-[#14170F] shadow-2xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#4A5D23]">Pay how it suits you</p>
              <p className="mt-1 text-lg font-black">Full payment or 10 instalments</p>
              <p className="mt-1.5 text-[13px] text-[#4B5347]">
                Instalment plan must be completed before the early-bird date
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CLASSES */}
      <section id="classes" className="py-18">
        <div className="mx-auto max-w-5xl px-6">
          <RevealOnScroll className="mb-10 max-w-xl">
            <p className="text-sm font-semibold text-[#4A5D23]">Your class</p>
            <h2 className="mt-1 text-[clamp(30px,4vw,44px)] font-black">
              You don&apos;t choose a class — we place you in one.
            </h2>
            <p className="mt-2 text-[#4B5347]">
              Register with your school category and zone, and your class is assigned automatically.
            </p>
          </RevealOnScroll>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {CLASSES.map((c) => (
              <RevealOnScroll key={c.name}>
                <div className="h-full rounded-2xl border border-[#0F3D2E]/10 bg-white p-7">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#4A5D23]">{c.tag}</p>
                  <h3 className="mt-2 text-2xl font-extrabold">{c.name}</h3>
                  <p className="mt-2 text-sm text-[#4B5347]">{c.copy}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* CAMP HIGHLIGHTS — real scrollytelling, 9 panels, real photos + video */}
      <section className="bg-[#0A2A20] py-18 text-[#F7F3E8]">
        <div className="mx-auto max-w-5xl px-6">
          <RevealOnScroll className="mb-4 max-w-xl">
            <p className="text-sm font-semibold text-[#E8B923]">A day at SB HIC</p>
            <h2 className="mt-1 text-[clamp(30px,4vw,44px)] font-black italic">
              Every camp leaves a story behind.
            </h2>
            <p className="mt-2 text-[#C9D6C4]">
              Scroll through what a real day looks like — from pre-dawn Tahajjud to the closing seminar.
            </p>
          </RevealOnScroll>
          <CampHighlights />
        </div>
      </section>

      {/* GALLERY — real photos from past camps */}
      <section className="py-18">
        <div className="mx-auto max-w-5xl px-6">
          <RevealOnScroll className="mb-6 max-w-xl">
            <p className="text-sm font-semibold text-[#4A5D23]">Camp Memories</p>
            <h2 className="mt-1 text-[clamp(30px,4vw,44px)] font-black">
              Moments from HIC 2025.
            </h2>
            <p className="mt-2 text-[#4B5347]">
              A look back at the people, the lectures, and the brotherhood from last year&apos;s camp.
            </p>
          </RevealOnScroll>
          <Gallery />
        </div>
      </section>

      {/* LECTURERS */}
      <section className="py-18">
        <div className="mx-auto max-w-5xl px-6">
          <RevealOnScroll className="mb-6 max-w-xl">
            <p className="text-sm font-semibold text-[#4A5D23]">Meet the faculty</p>
            <h2 className="mt-1 text-[clamp(30px,4vw,44px)] font-black">
              Learn from the people leading the sessions.
            </h2>
            <p className="mt-2 text-[#4B5347]">
              Our scholars for SB HIC 2026.
            </p>
          </RevealOnScroll>
          <Lecturers />
        </div>
      </section>

      {/* PRICING / REGISTER */}
      <section id="register" className="py-18">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 items-center gap-8 rounded-[28px] bg-[#0F3D2E] p-11 text-[#F7F3E8] md:grid-cols-2">
            <div>
              <h2 className="text-[clamp(26px,3.4vw,36px)] font-black">
                Register before 30 November to lock in the early-bird rate.
              </h2>
              <p className="mt-3 text-sm text-[#C9D6C4]">
                After that, registration stays open right up to camp — just at the flat rate. Every fee covers
                accommodation, feeding, and welfare for all five days.
              </p>
              <a href="/register" className="mt-4 inline-block rounded-full bg-[#E8B923] px-6.5 py-3.5 font-bold text-[#0A2A20]">
                Start Registration
              </a>
            </div>
            <div className="flex gap-4">
              <div className="flex-1 rounded-2xl bg-[#E8B923] p-4.5 text-[#0A2A20]">
                <p className="text-xs font-semibold uppercase opacity-80">Early Bird</p>
                <p className="mt-1.5 text-3xl font-black">₦8,500</p>
                <p className="mt-1 text-xs opacity-85">Register &amp; pay before 30 Nov</p>
              </div>
              <div className="flex-1 rounded-2xl border border-[#E8B923]/35 bg-white/5 p-4.5">
                <p className="text-xs font-semibold uppercase opacity-80">Flat Rate</p>
                <p className="mt-1.5 text-3xl font-black">₦12,000</p>
                <p className="mt-1 text-xs opacity-85">From 1 Dec through camp</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0A2A20] py-14 text-[#F7F3E8]">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-6 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-xl font-extrabold">
              Standard Bearers <span className="text-[#E8B923]">SB HIC 2026</span>
            </p>
            <p className="mt-2 max-w-xs text-sm text-[#C9D6C4]">
              Upholding the standard — a Holiday Islamic Course for students and young adults across Osun
              State and beyond.
            </p>
          </div>
          <div>
            <h4 className="mb-3.5 text-xs font-semibold uppercase tracking-wide text-[#E8B923]">Enquiries</h4>
            <ul className="grid grid-cols-2 gap-x-5 gap-y-2 text-sm text-[#C9D6C4]">
              {ENQUIRIES.map(([state, number]) => (
                <li key={state}>
                  <strong className="font-semibold text-[#F7F3E8]">{state}:</strong> {number}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-10 flex max-w-5xl flex-wrap justify-between gap-3 border-t border-white/10 px-6 pt-6 text-xs text-[#C9D6C4]">
          <span>© 2026 Standard Bearers Islamic Organization, Osun State</span>
          <span>X @SbOsun_State · Instagram @sbosun_state · Facebook StandardBearersIO</span>
        </div>
      </footer>

      <MemoryLanePlayer />
    </main>
  );
}
