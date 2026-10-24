interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = '', size = 48 }: LogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" className="h-full w-full select-none drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="94" fill="none" stroke="#0F3D2E" strokeWidth="6" />
        <circle cx="100" cy="100" r="86" fill="none" stroke="#D32F2F" strokeWidth="2" />
        <circle cx="100" cy="100" r="82" fill="#EBF4F0" />

        <line x1="90" y1="130" x2="90" y2="40" stroke="#E8B923" strokeWidth="5" strokeLinecap="round" />
        <circle cx="90" cy="38" r="3" fill="#E8B923" />

        <path d="M 90 45 C 110 40, 120 52, 140 46 L 140 80 C 120 86, 110 74, 90 80 Z" fill="#1F2937" stroke="#111827" strokeWidth="1" />

        <path d="M 112 58 A 6 6 0 1 0 112 70 A 5 5 0 1 1 112 58 Z" fill="#FFFFFF" />
        <polygon points="117,61 119,64 122,64 120,66 121,69 117,67 114,69 115,66 113,64 116,64" fill="#FFFFFF" />

        <path d="M 40 100 Q 60 98, 80 94 L 80 112 Q 60 114, 40 108 Z" fill="#6D4C41" stroke="#4E342E" strokeWidth="1.5" />
        <rect x="78" y="90" width="16" height="26" rx="6" fill="#5D4037" stroke="#3E2723" strokeWidth="1.5" />
        <path
          d="M 82 94 L 92 94 M 82 100 L 92 100 M 82 106 L 92 106 M 82 112 L 92 112"
          stroke="#3E2723"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        <defs>
          <path id="textPathTop" d="M 28 100 A 72 72 0 0 1 172 100" fill="none" />
          <path id="textPathBottom" d="M 172 100 A 72 72 0 0 1 28 100" fill="none" />
        </defs>

        <text className="fill-[#0F3D2E] font-sans font-extrabold uppercase" fontSize="11" letterSpacing="1.2">
          <textPath href="#textPathTop" startOffset="50%" textAnchor="middle">
            Standard Bearers
          </textPath>
        </text>
        <text className="fill-[#0F3D2E] font-sans font-semibold italic" fontSize="8.5">
          <textPath href="#textPathBottom" startOffset="50%" textAnchor="middle">
            Upholding the standard...
          </textPath>
        </text>
      </svg>
    </div>
  );
}
