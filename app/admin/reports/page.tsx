const REPORTS = [
  { type: 'registrations', title: 'Registration Report', desc: 'Participant, gender, age group, category, class, zone.' },
  { type: 'payments', title: 'Payment Report', desc: 'Participant, amount, payment type, instalment number, status.' },
  { type: 'attendance', title: 'Attendance Report', desc: 'Participant, class, house, check-in status, check-in time.' },
  { type: 'houses', title: 'House Report', desc: 'House, gender, capacity, occupants, available spaces.' },
];

export default function AdminReportsPage() {
  return (
    <main className="min-h-screen bg-[#F7F3E8] px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <a href="/admin/dashboard" className="text-xs text-[#4A5D23] underline">← Back to dashboard</a>
        <h1 className="mt-2 text-2xl font-black text-[#14170F]">Reports</h1>
        <p className="mt-1 text-sm text-[#4B5347]">Export live data as CSV, ready for Excel or Google Sheets.</p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {REPORTS.map((r) => (
            <div key={r.type} className="rounded-2xl border border-[#0F3D2E]/10 bg-white p-6">
              <h2 className="text-sm font-extrabold text-[#14170F]">{r.title}</h2>
              <p className="mt-1.5 text-xs text-[#4B5347]">{r.desc}</p>
              <a
                href={`/api/reports/export?type=${r.type}`}
                className="mt-4 inline-block rounded-full bg-[#0F3D2E] px-5 py-2.5 text-xs font-bold text-[#F7F3E8]"
              >
                Download CSV
              </a>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
