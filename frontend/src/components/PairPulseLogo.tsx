export default function PairPulseLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className}>
      <defs>
        <linearGradient id="pairPulseGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00C6FF" />
          <stop offset="60%" stopColor="#0072FF" />
          <stop offset="100%" stopColor="#FF5722" />
        </linearGradient>
        <filter id="tabDropShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.3"/>
        </filter>
      </defs>
      <g filter="url(#tabDropShadow)">
        <path 
          d="M96 352V160C96 115.817 131.817 80 176 80H288C354.274 80 408 133.726 408 200C408 266.274 354.274 320 288 320H160M160 224H320M96 288L144 240L208 304L272 208L336 272L384 224" 
          fill="none" 
          stroke="url(#pairPulseGrad)" 
          strokeWidth="36" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <circle cx="288" cy="80" r="14" fill="#FF5722" />
        <circle cx="96" cy="352" r="14" fill="#00C6FF" />
      </g>
    </svg>
  )
}