'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Heart, MapPin, Share2, Sparkles } from 'lucide-react';

interface GalleryItem {
  id: string;
  src: string;
  title: string;
  categoryLabel: string;
  location: string;
  year: string;
  description: string;
  colSpan: string;
}

// Captions were AI-drafted from the photos themselves during export — worth
// a skim for accuracy (specific numbers, location names) before you treat
// them as final copy.
const galleryItems: GalleryItem[] = [
  { id: '1', src: '/images/gallery/memory_1.jpg', title: 'Our Grand Camp Arrival', categoryLabel: 'Camp Happy Moments Scenes', location: 'Oduduwa College Campus', year: 'HIC 2025', description: 'More than 450 delegates standing together under the banner of faith, reflecting unity, purpose, and mutual love.', colSpan: 'md:col-span-2' },
  { id: '2', src: '/images/gallery/memory_2.jpg', title: 'Interactive Knowledge Assembly', categoryLabel: 'Camp Happy Moments Scenes', location: 'Main Auditorium', year: 'HIC 2025', description: 'Attentive delegates listening, taking notes, and engaging in deep discussions during the morning academic series.', colSpan: 'md:col-span-1' },
  { id: '3', src: '/images/gallery/memory_3.jpg', title: 'Scholarly Dars Sessions', categoryLabel: 'Camp Happy Moments Scenes', location: 'Central Lecture Theatre', year: 'HIC 2025', description: 'Acquiring authentic divine knowledge and guidelines under the tutelage of highly respected scholars and national mentors.', colSpan: 'md:col-span-1' },
  { id: '4', src: '/images/gallery/memory_4.jpg', title: 'Quranic Focus & Deep Tilawah', categoryLabel: 'Camp Happy Moments Scenes', location: 'Central Musollah', year: 'HIC 2025', description: 'Individual reflection and beautiful recitations during quiet morning and evening Quran memorization hours.', colSpan: 'md:col-span-1' },
  { id: '5', src: '/images/gallery/memory_5.jpg', title: 'Campus Walk & Shared Reflection', categoryLabel: 'Camp Happy Moments Scenes', location: 'Oduduwa Courtyard', year: 'HIC 2025', description: 'Forging lifelong bonds of Islamic brotherhood during informal strolls and cozy team-building campfire sessions.', colSpan: 'md:col-span-1' },
  { id: '6', src: '/images/gallery/memory_6.jpg', title: 'Youth Moral Integrity Seminar', categoryLabel: 'Camp Happy Moments Scenes', location: 'Seminar Hall A', year: 'HIC 2025', description: 'An engaging panel discussion addressing modern societal challenges, moral uprightness, and professional excellence.', colSpan: 'md:col-span-1' },
  { id: '7', src: '/images/gallery/memory_7.jpg', title: 'Spiritual Attentiveness', categoryLabel: 'Camp Happy Moments Scenes', location: 'Central Musollah', year: 'HIC 2025', description: 'Focusing on purification of the soul through individual supplications and silent devotion between congregational solat.', colSpan: 'md:col-span-1' },
  { id: '8', src: '/images/gallery/memory_8.jpg', title: 'Quranic Recitation Finalists', categoryLabel: 'Camp Happy Moments Scenes', location: 'Main Auditorium', year: 'HIC 2025', description: 'A serene platform celebrating the finalists of our annual high-stakes Tajweed accuracy and memorization challenge.', colSpan: 'md:col-span-1' },
  { id: '9', src: '/images/gallery/memory_9.jpg', title: 'Smiling Faces of Brotherhood', categoryLabel: 'Camp Happy Moments Scenes', location: 'Oduduwa Gardens', year: 'HIC 2025', description: 'Delegates radiating genuine joy and spiritual fulfillment, building a solid support network for academic and personal life.', colSpan: 'md:col-span-1' },
  { id: '10', src: '/images/gallery/memory_10.jpg', title: 'Mentors Guidance Circle', categoryLabel: 'Camp Happy Moments Scenes', location: 'Conference Room B', year: 'HIC 2025', description: 'Mentors and counselors leading active leadership forums to prepare delegates as shining standard-bearers in society.', colSpan: 'md:col-span-1' },
  { id: '11', src: '/images/gallery/memory_11.jpg', title: 'Morning Campfire Stories', categoryLabel: 'Camp Happy Moments Scenes', location: 'SB Campfire Arena', year: 'HIC 2025', description: 'Sharing inspiring experiences, historical narratives, and standard bearer challenges during chilly campfire gatherings.', colSpan: 'md:col-span-1' },
  { id: '12', src: '/images/gallery/memory_12.jpg', title: 'Digital Tech Workshops', categoryLabel: 'Camp Happy Moments Scenes', location: 'IT Innovation Lab', year: 'HIC 2025', description: 'Hands-on training session covering digital ethics, professional technology pathways, and cybersecurity literacy.', colSpan: 'md:col-span-1' },
  { id: '13', src: '/images/gallery/memory_13.jpg', title: 'Resilient Scholar Presentation', categoryLabel: 'Camp Happy Moments Scenes', location: 'Main Auditorium', year: 'HIC 2025', description: 'Scholars unlocking classical Islamic sciences and offering blueprints to build sound, resilient family frameworks.', colSpan: 'md:col-span-1' },
  { id: '14', src: '/images/gallery/memory_14.jpg', title: 'Moments of Sincere Supplication', categoryLabel: 'Camp Happy Moments Scenes', location: 'Central Musollah', year: 'HIC 2025', description: 'Delegates raising their hands in emotional and deep personal dua, seeking forgiveness and success in this world and the next.', colSpan: 'md:col-span-1' },
  { id: '15', src: '/images/gallery/memory_15.jpg', title: 'Standing in Congregation', categoryLabel: 'Camp Happy Moments Scenes', location: 'Sab Arena Field', year: 'HIC 2025', description: 'Rows of delegates standing shoulder to shoulder, embodying unity and discipline during congregational prayer.', colSpan: 'md:col-span-1' },
  { id: '16', src: '/images/gallery/memory_16.jpg', title: 'Pre-Dawn Night Prayers', categoryLabel: 'Camp Happy Moments Scenes', location: 'Oduduwa Courtyard', year: 'HIC 2025', description: 'Standing in Qiyamul Layl under starlit nights, pouring out sincere prostrations during the sacred Tahajjud hours.', colSpan: 'md:col-span-1' },
  { id: '17', src: '/images/gallery/memory_17.jpg', title: 'Camp Brotherhood Meals', categoryLabel: 'Camp Happy Moments Scenes', location: 'Dining Hall Complex', year: 'HIC 2025', description: 'Sharing warm nutritious meals in absolute humility, embodying the sunnah of eating together and avoiding waste.', colSpan: 'md:col-span-1' },
  { id: '18', src: '/images/gallery/memory_18.jpg', title: 'Fresh Morning Assembly', categoryLabel: 'Camp Happy Moments Scenes', location: 'Camp Assembly Field', year: 'HIC 2025', description: 'Starting the day with fresh morning Adhkar, brief physical warm-ups, and a review of the daily high-impact events.', colSpan: 'md:col-span-1' },
  { id: '19', src: '/images/gallery/memory_19.jpg', title: 'Graduates Leadership Forum', categoryLabel: 'Camp Happy Moments Scenes', location: 'Auditorium Quad', year: 'HIC 2025', description: "A special group photo with senior mentors and speakers after a highly empowering moral session.", colSpan: 'md:col-span-1' },
  { id: '20', src: '/images/gallery/memory_20.jpg', title: 'Vibrant Quiz Tournament', categoryLabel: 'Camp Happy Moments Scenes', location: 'Activity Center', year: 'HIC 2025', description: 'Stimulating board games and rapid-fire quiz tournaments fostering healthy competition and mental strategy.', colSpan: 'md:col-span-1' },
  { id: '21', src: '/images/gallery/memory_21.jpg', title: 'Dedicated Worship Rows', categoryLabel: 'Camp Happy Moments Scenes', location: 'Oduduwa College Ground', year: 'HIC 2025', description: 'Organized rows reflecting absolute humility, focus, and submission before Allah the Almighty.', colSpan: 'md:col-span-1' },
  { id: '22', src: '/images/gallery/memory_22.jpg', title: 'Healthy Physical Fitness', categoryLabel: 'Camp Happy Moments Scenes', location: 'Sports Ground', year: 'HIC 2025', description: 'Daily morning exercises and energetic sports leagues reinforcing standard physical and cardiovascular fitness.', colSpan: 'md:col-span-2' },
];

export default function Gallery() {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  return (
    <div className="w-full py-4">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {galleryItems.map((item, idx) => (
          <motion.div
            key={item.id}
            className={`group relative h-[280px] cursor-pointer overflow-hidden rounded-3xl border border-slate-800/85 bg-slate-900 shadow-md sm:h-[320px] ${item.colSpan}`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: idx * 0.05, ease: 'easeOut' }}
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
            onClick={() => setSelectedItem(item)}
          >
            <div className="relative h-full w-full overflow-hidden">
              <img
                src={item.src}
                alt={item.title}
                className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/15 transition-colors duration-300 group-hover:bg-black/30" />
              <div className="absolute left-4 top-4">
                <span className="flex items-center gap-1 rounded-full border border-[#E8B923]/20 bg-[#E8B923] px-3.5 py-1.5 text-[10px] font-extrabold uppercase text-[#0F3D2E] shadow-lg">
                  <Sparkles className="h-3 w-3" />
                  {item.categoryLabel}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/95 p-4 sm:p-8"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25 }}
              className="flex max-h-[90vh] w-full max-w-4xl cursor-default flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative flex min-h-[300px] max-h-[60vh] flex-1 items-center justify-center overflow-hidden bg-black">
                <img src={selectedItem.src} alt={selectedItem.title} className="h-full max-h-[60vh] w-full object-contain" />
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 font-bold text-white shadow-xl transition-all hover:bg-black"
                >
                  ✕
                </button>
              </div>

              <div className="border-t border-slate-800 bg-slate-950 p-6 text-white sm:p-8">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
                  <span className="rounded-xl border border-emerald-500/20 bg-[#0F3D2E] px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-[#E8B923] shadow-sm">
                    {selectedItem.categoryLabel}
                  </span>
                  <div className="flex items-center gap-4 font-mono text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-bold text-[#E8B923]">
                      <Calendar className="h-3.5 w-3.5" />
                      {selectedItem.year}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {selectedItem.location}
                    </span>
                  </div>
                </div>

                <h3 className="mb-2 font-serif text-2xl font-black tracking-tight text-white">{selectedItem.title}</h3>
                <p className="text-sm leading-relaxed text-slate-300">{selectedItem.description}</p>

                <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-500">
                  <span>Standard Bearers Islamic Organization, Osun State</span>
                  <div className="flex gap-4">
                    <button className="flex items-center gap-1 transition-colors hover:text-[#E8B923]">
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                      Liked by Delegates
                    </button>
                    <button className="flex items-center gap-1 transition-colors hover:text-[#E8B923]">
                      <Share2 className="h-4 w-4" />
                      Share Memory
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
