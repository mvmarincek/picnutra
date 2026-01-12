interface BowlLogoProps {
  className?: string;
}

export default function BowlLogo({ className = "w-8 h-8" }: BowlLogoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="5" width="20" height="15.5" rx="3.5" fill="currentColor"/>
      <rect x="5.5" y="2.5" width="6" height="3" rx="1.2" fill="currentColor"/>
      <circle cx="18" cy="7.5" r="1.6" fill="currentColor"/>
      <circle cx="18" cy="7.5" r="1" fill="currentColor" opacity="0.3"/>
      <circle cx="11.5" cy="13" r="6" fill="currentColor"/>
      <circle cx="11.5" cy="13" r="5.4" fill="currentColor" opacity="0.8"/>
      <circle cx="11.5" cy="13" r="4.9" fill="currentColor"/>
      <circle cx="11.5" cy="13" r="4.3" fill="#faf5ff"/>
      <path d="M11.5 13L11.5 8.7A4.3 4.3 0 0 1 15.2 11.2Z" fill="#fb923c"/>
      <path d="M11.5 13L15.2 11.2A4.3 4.3 0 0 1 15.8 13L15.8 14.5A4.3 4.3 0 0 1 14 16Z" fill="#22c55e"/>
      <path d="M11.5 13L14 16A4.3 4.3 0 0 1 9 16Z" fill="#fef3c7"/>
      <path d="M11.5 13L9 16A4.3 4.3 0 0 1 7.2 14.5L7.2 13A4.3 4.3 0 0 1 8 11Z" fill="#c084fc"/>
      <path d="M11.5 13L8 11A4.3 4.3 0 0 1 11.5 8.7Z" fill="#86efac"/>
      <circle cx="11.5" cy="13" r="1.3" fill="#fef3c7"/>
      <circle cx="11.5" cy="13" r="0.7" fill="#fb923c"/>
    </svg>
  );
}
