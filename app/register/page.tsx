import RegisterForm from '@/components/RegisterForm';
import { Logo } from '@/components/Logo';

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[#F7F3E8] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto mb-8 flex max-w-5xl items-center gap-3">
        <Logo size={40} />
        <div>
          <p className="text-sm font-black text-[#0F3D2E]">SB HIC 2026 Registration</p>
          <p className="text-xs text-[#4B5347]">Standard Bearers Islamic Organization · Osun State</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl">
        <RegisterForm />
      </div>
    </main>
  );
}
