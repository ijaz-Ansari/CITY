import React from 'react';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showSubtitle?: boolean;
}

const SIZE_MAP = {
  xs: 'w-7 h-7',
  sm: 'w-9 h-9',
  md: 'w-11 h-11',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
  '2xl': 'w-28 h-28',
};

const PIXELS_MAP = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 56,
  xl: 80,
  '2xl': 112,
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  const px = PIXELS_MAP[size] || PIXELS_MAP.md;

  return (
    <div
      className={`relative rounded-full bg-slate-900/5 p-0.5 border border-slate-700/60 shadow-xs shrink-0 flex items-center justify-center overflow-hidden ${sizeClass} ${className}`}
      style={{
        width: `${px}px`,
        height: `${px}px`,
        minWidth: `${px}px`,
        minHeight: `${px}px`,
        maxWidth: `${px}px`,
        maxHeight: `${px}px`,
      }}
      title="City CON & Allied Health Sciences Nowshera Virkan"
    >
      <img
        src="/logo.png"
        alt="City CON & Allied Health Sciences Logo"
        width={px}
        height={px}
        style={{
          width: '100%',
          height: '100%',
          maxWidth: `${px}px`,
          maxHeight: `${px}px`,
          objectFit: 'contain',
          borderRadius: '9999px',
          display: 'block',
        }}
        className="w-full h-full object-contain rounded-full select-none"
        loading="eager"
        onError={(e) => {
          // Fallback to jpg if png not loaded
          const target = e.currentTarget;
          if (!target.src.endsWith('/logo.jpg')) {
            target.src = '/logo.jpg';
          }
        }}
      />
    </div>
  );
};
