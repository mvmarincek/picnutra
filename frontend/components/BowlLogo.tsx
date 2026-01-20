interface BowlLogoProps {
  className?: string;
}

export default function BowlLogo({ className = "w-8 h-8" }: BowlLogoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.15"/>
      <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
      <path d="M12 3V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 18.5V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M3 12H5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M18.5 12H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="8.5" cy="10" r="1" fill="#22c55e"/>
      <circle cx="15" cy="9.5" r="0.8" fill="#fb923c"/>
      <circle cx="14" cy="14" r="1.2" fill="#ef4444"/>
      <circle cx="9" cy="14.5" r="0.9" fill="#eab308"/>
      <rect x="17" y="2" width="5" height="4" rx="1" fill="currentColor"/>
      <circle cx="19.5" cy="4" r="1" fill="currentColor" opacity="0.4"/>
    </svg>
  );
}
