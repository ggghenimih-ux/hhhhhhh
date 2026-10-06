import React from 'react';
import { useStore } from '../context/StoreContext';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showTagline = true,
}) => {
  const { navigateTo, settings } = useStore();

  const imgDimensions = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }[size];

  const logoSrc = settings?.logoUrl?.trim() || '/logo.jpg';
  const brandName = settings?.storeName || 'Outils Réparation GSM';

  return (
    <div
      onClick={() => navigateTo('home')}
      className={`inline-flex items-center gap-2.5 cursor-pointer select-none group ${className}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigateTo('home');
        }
      }}
      aria-label={`${brandName} - Accueil`}
    >
      <div className={`relative flex-shrink-0 ${imgDimensions} rounded-full overflow-hidden border border-slate-200/80 bg-white shadow-xs group-hover:scale-105 transition-transform duration-200`}>
        <img
          src={logoSrc}
          alt={brandName}
          className="w-full h-full object-contain"
          onError={(e) => {
            // Graceful fallback to default logo if path fails
            if (e.currentTarget.src !== '/logo.jpg') {
              e.currentTarget.src = '/logo.jpg';
            }
          }}
        />
      </div>

      <div className="flex flex-col text-start">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg group-hover:text-orange-600 transition-colors leading-tight">
            {brandName}
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200/70 rounded">
            Tunisie 🇹🇳
          </span>
        </div>
        {showTagline && (
          <span className="text-[11px] text-slate-500 font-medium hidden md:inline-block leading-tight">
            Outillage & Équipements Professionnels
          </span>
        )}
      </div>
    </div>
  );
};
