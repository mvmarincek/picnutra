interface BowlLogoProps {
  className?: string;
}

export default function BowlLogo({ className = "w-8 h-8" }: BowlLogoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <ellipse cx="12" cy="15.5" rx="8" ry="4.5" fill="currentColor"/>
      <path d="M4 15.5Q4 10 12 10Q20 10 20 15.5" fill="currentColor"/>
      <ellipse cx="12" cy="10" rx="8" ry="2" fill="currentColor" opacity="0.4"/>
      <path d="M7 9Q7.3 6.5 8.5 9" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.7"/>
      <path d="M11.5 8Q12 5 12.5 8" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.7"/>
      <path d="M15.5 9Q16.7 6.5 17 9" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.7"/>
    </svg>
  );
}
