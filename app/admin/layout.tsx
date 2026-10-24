'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AdminProfile {
  name: string;
  role: string;
  zone: string | null;
}

const NAV = [
  { label: 'Dashboard', href: '/admin/dashboard' },
  { label: 'Participants', href: '/admin/participants' },
  { label: 'Payments', href: '/admin/payments' },
  { label: 'Check-In Mode', href: '/admin/check-in' },
  { label: 'Houses', href: '/admin/houses' },
  { label: 'Reports', href: '/admin/reports' },
  { label: 'Admin Users', href: '/admin/users' },
  { label: 'Settings', href: '/admin/settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminProfile | null>(null);

  // The login page has no session to check and no sidebar to show.
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) return;
    fetch('/api/admin/me')
      .then((res) => {
        if (res.status === 401) {
          window.location.href = '/admin/login';
          return null;
        }
        return res.json();
      })
      .then((data) => data && setAdmin(data));
  }, [isLoginPage]);

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  if (isLoginPage) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-[#F7F3E8]">
      <aside className="hidden w-60 flex-shrink-0 flex-col bg-[#0F3D2E] p-5 text-[#F7F3E8] md:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8B923] text-xs font-black text-[#0A2A20]">SB</div>
          <span className="text-sm font-extrabold">SB HIC Admin</span>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`block rounded-xl px-3.5 py-2.5 text-sm font-semibold ${
                pathname === item.href ? 'bg-white/10 text-[#F7F3E8]' : 'text-[#C9D6C4] hover:bg-white/5 hover:text-[#F7F3E8]'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
        {admin && (
          <div className="mt-6 border-t border-white/10 pt-4 text-xs text-[#C9D6C4]">
            <p className="font-semibold text-[#F7F3E8]">{admin.name}</p>
            <p>{admin.role.replace('_', ' ')}{admin.zone ? ` · ${admin.zone}` : ''}</p>
            <button onClick={logout} className="mt-3 text-[#E8B923] underline">
              Log out
            </button>
          </div>
        )}
      </aside>

      <div className="flex-1">
        {/* Mobile top bar — sidebar is desktop-only for now */}
        <div className="flex items-center justify-between border-b border-[#0F3D2E]/10 bg-white px-4 py-3 md:hidden">
          <span className="text-sm font-extrabold text-[#0F3D2E]">SB HIC Admin</span>
          <button onClick={logout} className="rounded-full border border-[#0F3D2E]/20 px-3 py-1.5 text-xs font-semibold text-[#0F3D2E]">
            Log out
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
