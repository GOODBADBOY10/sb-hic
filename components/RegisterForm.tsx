'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import TransferInstructions, { type TransferDetails } from './TransferInstructions';
import { Calendar, Wallet, CheckCircle, Calculator, ChevronRight, ShieldCheck, Heart } from 'lucide-react';

const ZONES = [
  'Ile-Ife', 'Osogbo', 'Ede', 'Ilesha', 'Ikirun', 'Ila', 'Inisa', 'Okuku',
  'Owena', 'Akure', 'Ekiti', 'olode', 'Osu', 'Moro', 'Iwo', 'Ejigbo',
  'OAU', 'UNIOSUN', 'FOUNTAIN',
];

// Kept exactly as originally specified — these are the real category
// values the backend's Class.eligibleCategories now matches against.
const CATEGORIES = ['JSS 1-3', 'SS1- SSS 3', 'School Leaver', 'Undergraduate', 'Graduate', 'Others'];

const AGE_GROUPS = ['10 - 20', '21 - 30', '31 - 40', '40 above'];

interface FormState {
  surname: string;
  otherName: string;
  gender: 'male' | 'female';
  ageGroup: string;
  classLevel: string;
  zone: string;
  phone: string;
  email: string;
  healthIssue: string;
  isMinor: boolean;
  guardianName: string;
  guardianContact: string;
  paymentType: 'full' | 'instalment';
}

const EMPTY_FORM: FormState = {
  surname: '', otherName: '', gender: 'male', ageGroup: '10 - 20',
  classLevel: 'Undergraduate', zone: 'Osogbo', phone: '', email: '',
  healthIssue: '', isMinor: false, guardianName: '', guardianContact: '',
  paymentType: 'full',
};

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0F3D2E] focus:ring-1 focus:ring-[#0F3D2E] outline-none text-sm transition-all font-semibold text-slate-800';

export default function RegisterForm() {
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationResponse, setRegistrationResponse] = useState<{
    registrationId: string;
    participantId: string;
    class: string;
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.surname || !formData.otherName || !formData.email || !formData.phone) {
      setError('Please fill in all required fields.');
      return;
    }
    if (formData.isMinor && (!formData.guardianName || !formData.guardianContact)) {
      setError("Guardian name and contact are required for participants under 18.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surname: formData.surname.trim(),
          otherName: formData.otherName.trim(),
          gender: formData.gender === 'male' ? 'MALE' : 'FEMALE',
          ageGroup: formData.ageGroup,
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          category: formData.classLevel,
          zone: formData.zone,
          healthChallenges: formData.healthIssue.trim(),
          isMinor: formData.isMinor,
          guardianName: formData.isMinor ? formData.guardianName.trim() : undefined,
          guardianContact: formData.isMinor ? formData.guardianContact.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed. Please try again.');
      setRegistrationResponse(data);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Real checkout handoff — calls our actual Paystack-backed initialize route
  // and redirects to Paystack's hosted page. No self-reported "I've paid"
  // button and no fake bank-transfer panel; payment is only ever confirmed
  // server-side via the webhook once Paystack actually processes it.
  const [transfer, setTransfer] = useState<TransferDetails | null>(null);

  const goToCheckout = async () => {
    if (!registrationResponse) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: registrationResponse.participantId,
          paymentType: formData.paymentType === 'full' ? 'FULL' : 'INSTALLMENT',
          installmentNumber: formData.paymentType === 'instalment' ? 1 : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start payment.');
      setTransfer({
        transactionId: data.transactionId,
        amount: data.amount,
        account: data.account,
        whatsapp: data.whatsapp,
        registrationId: data.registrationId,
        name: data.name,
        label: data.label,
      });
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const startAnother = () => {
    setFormData(EMPTY_FORM);
    setRegistrationResponse(null);
    setTransfer(null);
    setIsSubmitted(false);
    setError(null);
  };

  return (
    <div className="grid w-full grid-cols-1 overflow-hidden rounded-3xl border border-[#0F3D2E]/10 bg-[#EBF4F0] text-left shadow-xl lg:grid-cols-12">
      {/* Sidebar */}
      <div className="flex flex-col justify-between bg-gradient-to-b from-[#0F3D2E] to-[#051e13] p-8 text-white lg:col-span-5">
        <div>
          <span className="rounded-xl border border-emerald-500/10 bg-[#145237] px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#E8B923]">
            Registration Details
          </span>
          <h3 className="mb-3 mt-4 font-serif text-3xl font-black leading-tight tracking-tight text-white">
            Uphold the Standard
          </h3>
          <p className="mb-6 text-sm font-medium leading-relaxed text-slate-300">
            Your registration fee fully covers your hostel accommodation, daily meals, welfare, study guides, and camp sports packages for all 5 days of camp.
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#E8B923]" />
              <div>
                <h5 className="text-sm font-bold text-[#E8B923]">Timeline Limit</h5>
                <p className="text-xs text-slate-300">
                  Early-bird rate of <span className="font-bold text-white">₦8,500</span> closes Nov 30, 2026. Flat rate is ₦12,000.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <Wallet className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#E8B923]" />
              <div>
                <h5 className="text-sm font-bold text-[#E8B923]">Instalment Flexibility</h5>
                <p className="text-xs text-slate-300">Split your payment into 10 parts (₦850 each). Must be completed by Nov 30.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6">
          <div className="mb-2 flex items-center gap-2 font-mono text-xs text-slate-400">
            <Calculator className="h-3.5 w-3.5" />
            <span>INSTALMENT CALCULATOR</span>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-[#E8B923]/20 bg-[#0c2f1d] p-4 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span>Total Camp Fee:</span>
              <span className="text-sm font-bold text-white">₦8,500</span>
            </div>
            {formData.paymentType === 'instalment' ? (
              <div className="mt-2 flex flex-col gap-1.5 border-t border-white/5 pt-2 font-mono text-slate-300">
                <div className="flex justify-between font-bold text-amber-300">
                  <span>1st Instalment (1/10):</span>
                  <span>₦850</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Instalments 2 to 10:</span>
                  <span>₦850 each</span>
                </div>
              </div>
            ) : (
              <div className="mt-2 rounded bg-[#145237]/40 py-2 text-center font-bold text-emerald-400">
                ✓ Full single payment selected
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form area */}
      <div className="flex flex-col justify-center bg-white p-8 lg:col-span-7">
        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="font-serif text-xl font-bold text-slate-900">Delegate Registration Form</h4>
                <p className="text-xs font-medium text-slate-500">Provide accurate details below for camp verification.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                <div className="flex flex-col gap-1.5 sm:col-span-4">
                  <label className="text-xs font-bold text-slate-700">Surname *</label>
                  <input name="surname" required placeholder="e.g. Alao" value={formData.surname} onChange={handleInputChange} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-4">
                  <label className="text-xs font-bold text-slate-700">Other Name *</label>
                  <input name="otherName" required placeholder="e.g. Ibrahim Adebayo" value={formData.otherName} onChange={handleInputChange} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-4">
                  <label className="text-xs font-bold text-slate-700">Sex *</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange} className={`${inputClass} cursor-pointer bg-white`}>
                    <option value="male">Brother (Male)</option>
                    <option value="female">Sister (Female)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                <div className="flex flex-col gap-1.5 sm:col-span-4">
                  <label className="text-xs font-bold text-slate-700">Age Bracket *</label>
                  <select name="ageGroup" value={formData.ageGroup} onChange={handleInputChange} className={`${inputClass} cursor-pointer bg-white`}>
                    {AGE_GROUPS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-8">
                  <label className="text-xs font-bold text-slate-700">Email Address *</label>
                  <input type="email" name="email" required placeholder="name@example.com" value={formData.email} onChange={handleInputChange} className={inputClass} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Phone / WhatsApp *</label>
                <input type="tel" name="phone" required placeholder="e.g. 08123456789" value={formData.phone} onChange={handleInputChange} className={inputClass} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Category *</label>
                  <select name="classLevel" value={formData.classLevel} onChange={handleInputChange} className={`${inputClass} cursor-pointer bg-white`}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Zone *</label>
                  <select name="zone" value={formData.zone} onChange={handleInputChange} className={`${inputClass} cursor-pointer bg-white`}>
                    {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1 text-xs font-bold text-[#b45309]">
                  <Heart className="h-3.5 w-3.5 fill-amber-600 text-amber-600" />
                  Health Challenges (specify if any, or state &apos;None&apos;)
                </label>
                <input
                  name="healthIssue"
                  placeholder="e.g. Asthma, Allergies, Ulcer, or 'None'"
                  value={formData.healthIssue}
                  onChange={handleInputChange}
                  className={`${inputClass} font-medium`}
                />
              </div>

              {/* Explicit Under-18 toggle, replacing the old age-bracket inference */}
              <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={formData.isMinor}
                  onChange={(e) => setFormData((p) => ({ ...p, isMinor: e.target.checked }))}
                  className="h-4 w-4 accent-[#0F3D2E]"
                />
                <span className="text-sm font-semibold text-slate-800">This participant is under 18</span>
              </label>

              {formData.isMinor && (
                <div className="grid grid-cols-1 gap-4 rounded-xl border border-[#E8B923]/40 bg-[#E8B923]/10 p-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">Guardian Name *</label>
                    <input name="guardianName" value={formData.guardianName} onChange={handleInputChange} className={inputClass} placeholder="e.g. Mrs. Alao" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">Guardian Phone/Email *</label>
                    <input name="guardianContact" value={formData.guardianContact} onChange={handleInputChange} className={inputClass} placeholder="e.g. 09053444178" />
                  </div>
                </div>
              )}

              <div className="mt-2 flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700">Payment Option *</label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setFormData((prev) => ({ ...prev, paymentType: 'full' }))}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 p-3 transition-all ${
                      formData.paymentType === 'full' ? 'border-[#0F3D2E] bg-emerald-50/40 text-[#0F3D2E]' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold">Pay in Full</span>
                    <span className="text-[10px]">₦8,500 once</span>
                  </div>
                  <div
                    onClick={() => setFormData((prev) => ({ ...prev, paymentType: 'instalment' }))}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 p-3 transition-all ${
                      formData.paymentType === 'instalment' ? 'border-[#0F3D2E] bg-emerald-50/40 text-[#0F3D2E]' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold">Split Payments</span>
                    <span className="text-[10px]">10 Instalments</span>
                  </div>
                </div>
              </div>

              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F3D2E] px-6 py-3 text-sm font-extrabold tracking-wide text-[#E8B923] shadow-lg transition-all hover:bg-emerald-900 hover:shadow-xl disabled:opacity-50"
              >
                {isLoading ? 'Submitting…' : 'Submit Registration'}
                <ChevronRight className="h-4 w-4" />
              </button>
            </motion.form>
          ) : (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 px-4 py-10 text-center">
              <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-300 bg-emerald-100 text-emerald-600">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h4 className="font-serif text-2xl font-black text-[#0F3D2E]">Registration Submitted!</h4>
              <p className="max-w-md text-sm font-medium leading-relaxed text-slate-600">
                Assalamu Alaykum, <span className="font-bold text-slate-900">{formData.surname} {formData.otherName}</span>. Your spot is reserved — complete payment below to confirm it.
              </p>

              <div className="mt-4 flex w-full max-w-sm flex-col gap-1.5 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-left font-mono text-xs text-emerald-900">
                <div className="flex justify-between"><span>DELEGATE ID:</span><span className="font-bold text-[#0F3D2E]">{registrationResponse?.registrationId}</span></div>
                <div className="flex justify-between"><span>SEX / GENDER:</span><span className="font-bold uppercase text-[#0F3D2E]">{formData.gender}</span></div>
                <div className="flex justify-between"><span>CLASS:</span><span className="font-bold uppercase text-[#0F3D2E]">{registrationResponse?.class}</span></div>
                <div className="flex justify-between"><span>ZONE:</span><span className="font-bold uppercase text-[#0F3D2E]">{formData.zone}</span></div>
                <div className="flex justify-between"><span>HOSTEL:</span><span className="font-bold text-[#0F3D2E]">Assigned after payment</span></div>
              </div>

              <div className="mt-2 flex w-full max-w-sm items-center justify-center gap-2 rounded-xl bg-emerald-50 p-2.5 text-[10px] font-semibold text-emerald-700">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Pay by bank transfer — we never ask for your card or banking passwords.</span>
              </div>

              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</p>}

              {transfer ? (
                <TransferInstructions details={transfer} />
              ) : (
                <button
                  onClick={goToCheckout}
                  disabled={isLoading}
                  className="mt-2 w-full max-w-sm rounded-full bg-[#E8B923] px-6 py-3.5 text-sm font-black text-[#0A2A20] shadow-lg disabled:opacity-50"
                >
                  {isLoading ? 'Getting account details…' : 'Get Payment Details'}
                </button>
              )}
              <button onClick={startAnother} className="rounded-full bg-[#0F3D2E] px-6 py-2.5 text-xs font-bold text-[#E8B923] hover:bg-[#0c2f1d]">
                Register Another Delegate
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
