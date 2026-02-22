interface ConstellationDividerProps {
  className?: string;
}

export function ConstellationDivider({ className = "" }: ConstellationDividerProps) {
  return (
    <svg
      viewBox="0 0 200 10"
      className={`w-full opacity-20 text-muted-foreground ${className}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line x1="0" y1="5" x2="82" y2="5" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="87" cy="5" r="1" fill="currentColor" />
      <circle cx="97" cy="3" r="1.5" fill="currentColor" />
      <circle cx="103" cy="7" r="1" fill="currentColor" />
      <circle cx="113" cy="5" r="1" fill="currentColor" />
      <line x1="118" y1="5" x2="200" y2="5" stroke="currentColor" strokeWidth="0.5" />
      {/* subtle connecting lines between the dots */}
      <line x1="87" y1="5" x2="97" y2="3" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />
      <line x1="97" y1="3" x2="103" y2="7" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />
      <line x1="103" y1="7" x2="113" y2="5" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />
    </svg>
  );
}
