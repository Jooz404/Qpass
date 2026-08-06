import React from 'react';

/**
 * Reusable premium SVG Logo Component for Q-PASS
 * Supports vertical, horizontal, iconOnly, light, dark, and custom sizing options.
 */
export default function Logo({ 
  variant = 'horizontal', // 'horizontal' | 'vertical' | 'iconOnly'
  theme = 'light',        // 'light' | 'dark' | 'white' | 'black'
  className = '', 
  height = '40' 
}) {
  const h = parseInt(height) || 40;
  const ratio = h / 40;

  let textPrimary = '#003B73';
  let textSecondary = '#64748B';
  let accentBlue = '#003B73';

  if (theme === 'dark') {
    textPrimary = '#FFFFFF';
    textSecondary = '#94A3B8';
  }

  const logoImg = (
    <img
      src="/logo1.png"
      alt="Q-PASS Logo"
      style={{ height: `${h}px`, width: 'auto' }}
      className="inline-block flex-shrink-0 object-contain transition-transform duration-300 hover:scale-105"
    />
  );

  if (variant === 'iconOnly') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {logoImg}
      </div>
    );
  }

  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center gap-2 ${className}`}>
        {logoImg}
        <div>
          <div className="font-extrabold tracking-tight leading-none text-xl">
            <span style={{ color: '#003B73' }}>Q</span>
            <span style={{ color: textPrimary }}>-PASS</span>
          </div>
          <div className="font-semibold tracking-widest text-[9px] uppercase mt-1" style={{ color: textSecondary, letterSpacing: '0.15em' }}>
            Quality & Quantity Assurance
          </div>
          <div className="font-bold text-[8px] uppercase tracking-wider mt-0.5" style={{ color: accentBlue }}>
            Integrated Terminal Bitung
          </div>
        </div>
      </div>
    );
  }

  // Default: horizontal
  return (
    <div className={`flex items-center gap-2 max-w-full overflow-hidden ${className}`}>
      {logoImg}
      <div className="flex flex-col justify-center min-w-0 overflow-hidden">
        <div className="font-black tracking-tight leading-none text-base sm:text-lg truncate">
          <span style={{ color: '#003B73' }}>Q</span>
          <span className="dark:text-white text-slate-800">-PASS</span>
        </div>
        <div className="font-semibold tracking-wider text-[7.5px] sm:text-[8.5px] uppercase mt-0.5 truncate" style={{ color: textSecondary, letterSpacing: '0.03em' }}>
          Quality & Quantity Assurance
        </div>
        <div className="font-bold text-[6.5px] sm:text-[7.5px] uppercase tracking-wider leading-tight truncate" style={{ color: accentBlue }}>
          Integrated Terminal Bitung
        </div>
      </div>
    </div>
  );
}
