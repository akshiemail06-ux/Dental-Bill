import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  subtitleClassName?: string;
  showText?: boolean;
}

const IdBLogoIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Small Tooth Accent */}
    <path 
      d="M17 4.5C17 3.5 16.2 3 15.5 3C14.8 3 14.5 3.5 14.5 4.5C14.5 5.5 15 6.5 15 8C15 9.5 14.5 10.5 14.5 11C14.5 11.5 15 11.5 15.5 11.5C16 11.5 17 11.5 17.5 10.5C18 9.5 18 8 18 6.5C18 5 17 4.5 17 4.5Z" 
      fill="currentColor"
      className="opacity-90"
    />
    {/* IdB Text */}
    <text 
      x="2" 
      y="18" 
      fill="currentColor" 
      style={{ 
        fontFamily: 'system-ui, sans-serif', 
        fontWeight: '900', 
        fontSize: '14px',
        letterSpacing: '-1px'
      }}
    >
      IdB
    </text>
  </svg>
);

export function Logo({ 
  className, 
  iconClassName, 
  textClassName, 
  subtitleClassName,
  showText = true 
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3 group", className)}>
      <div className={cn(
        "relative flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-300",
        iconClassName
      )}>
        <IdBLogoIcon size={22} />
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            "text-xl font-bold tracking-tight text-gray-900 leading-tight block truncate max-w-[200px]",
            textClassName
          )}>
            Instant<span className="text-blue-600">Dental</span>Bill
          </span>
          <span className={cn(
            "text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] leading-none block",
            subtitleClassName
          )}>
            Smart Clinic ERP
          </span>
        </div>
      )}
    </div>
  );
}
