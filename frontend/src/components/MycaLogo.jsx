import React from 'react';

export default function MycaLogo({ 
  size = 28, 
  showText = true, 
  textSize = 'text-lg',
  className = ''
}) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Mycelium Constellation Node Cluster Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Filament Interconnections */}
        <line x1="20" y1="13" x2="13" y2="18" stroke="#A8B99A" strokeWidth="1.2" strokeOpacity="0.75" />
        <line x1="20" y1="13" x2="27" y2="18" stroke="#A8B99A" strokeWidth="1.2" strokeOpacity="0.75" />
        <line x1="13" y1="18" x2="13" y2="26" stroke="#A8B99A" strokeWidth="1.2" strokeOpacity="0.75" />
        <line x1="27" y1="18" x2="27" y2="26" stroke="#A8B99A" strokeWidth="1.2" strokeOpacity="0.75" />
        <line x1="13" y1="26" x2="20" y2="31" stroke="#A8B99A" strokeWidth="1.2" strokeOpacity="0.75" />
        <line x1="27" y1="26" x2="20" y2="31" stroke="#A8B99A" strokeWidth="1.2" strokeOpacity="0.75" />
        
        {/* Branch Extensions */}
        <line x1="20" y1="13" x2="20" y2="6" stroke="#A8B99A" strokeWidth="1" strokeOpacity="0.6" strokeDasharray="1 1" />
        <line x1="13" y1="18" x2="6" y2="15" stroke="#A8B99A" strokeWidth="1" strokeOpacity="0.6" strokeDasharray="1 1" />
        <line x1="27" y1="18" x2="34" y2="15" stroke="#D1B878" strokeWidth="1" strokeOpacity="0.7" strokeDasharray="1 1" />
        <line x1="20" y1="31" x2="20" y2="36" stroke="#A8B99A" strokeWidth="1" strokeOpacity="0.6" strokeDasharray="1 1" />

        {/* Nodes */}
        <circle cx="20" cy="13" r="2.8" fill="#A8B99A" />
        <circle cx="13" cy="18" r="2.5" fill="#A8B99A" />
        <circle cx="27" cy="18" r="2.8" fill="#D1B878" /> {/* Antique brass node */}
        <circle cx="13" cy="26" r="2.5" fill="#A8B99A" />
        <circle cx="27" cy="26" r="2.5" fill="#A8B99A" />
        <circle cx="20" cy="31" r="2.8" fill="#A8B99A" />

        {/* Outer subtle tip nodes */}
        <circle cx="20" cy="6" r="1.5" fill="#A8B99A" fillOpacity="0.8" />
        <circle cx="6" cy="15" r="1.5" fill="#A8B99A" fillOpacity="0.8" />
        <circle cx="34" cy="15" r="1.8" fill="#D1B878" />
        <circle cx="20" cy="36" r="1.5" fill="#A8B99A" fillOpacity="0.8" />
      </svg>

      {showText && (
        <span className={`font-serif tracking-[0.2em] font-normal uppercase text-[#E8EDE7] ${textSize}`}>
          MYCA
        </span>
      )}
    </div>
  );
}
