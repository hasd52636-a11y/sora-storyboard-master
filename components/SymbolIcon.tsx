
import React from 'react';
import { SymbolCategory } from '../types';

interface SymbolIconProps {
  category: SymbolCategory;
  icon: string;
  className?: string;
  text?: string;
}

const SymbolIcon: React.FC<SymbolIconProps> = ({ category, icon, className = '', text }) => {
  // 1. Reference Box (Red Dashed)
  if (category === SymbolCategory.REFERENCE || icon === 'ref-box') {
    return (
      <div className={`w-full h-full flex items-center justify-center ${className}`}>
        <div className="w-full h-full border-4 border-dashed border-red-500 bg-transparent flex items-center justify-center opacity-90">
             <span className="text-red-500 font-bold text-[10px] bg-white/80 px-1 rounded uppercase tracking-wider">REF</span>
        </div>
      </div>
    );
  }

  // 2. Custom Uploaded Icons
  if (icon && icon.startsWith('data:')) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${className}`}>
        <img src={icon} className="w-full h-full object-contain filter grayscale contrast-125 drop-shadow-sm" alt="custom" />
      </div>
    );
  }

  // 3. SVG Logic
  const strokeWidth = 1.2; // Thinner lines for non-ref symbols
  
  // Color Mapping
  let strokeColor = 'currentColor';
  if (category === SymbolCategory.CAMERA) strokeColor = '#2563EB'; // Blue-600
  if (category === SymbolCategory.ACTION) strokeColor = '#EA580C'; // Orange-600
  if (category === SymbolCategory.DIALOGUE) strokeColor = '#059669'; // Emerald-600
  if (category === SymbolCategory.EMOTION) strokeColor = '#C026D3'; // Purple-600 - 鲜艳的紫色，与其他颜色显著区别

  // SVG Paths Map
  const getPath = (key: string) => {
    switch(key) {
        // Camera
        case 'zoom-in': return (
            <>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
            </>
        );
        case 'zoom-out': return (
            <>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="8" y1="11" x2="14" y2="11" />
            </>
        );
        case 'pan-left': return (
            <>
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
            </>
        );
        case 'pan-right': return (
            <>
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
            </>
        );
        case 'tilt-up': return (
            <>
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
            </>
        );
        case 'tilt-down': return (
            <>
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
            </>
        );
        case 'tracking': return (
            <>
                <rect x="2" y="7" width="20" height="10" rx="2" />
                <circle cx="6" cy="17" r="2" />
                <circle cx="18" cy="17" r="2" />
                <path d="M2 12h20" strokeDasharray="2 2"/>
            </>
        );
        case 'hitchcock': return (
            <>
                <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-4-4 10 10 0 0 0-10-10z" />
                <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.2"/>
            </>
        );
        
        // Action
        case 'move-fwd': return (
            <>
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </>
        );
        case 'jump': return (
            <>
                <path d="M12 5v14" />
                <path d="M5 12l7-7 7 7" />
                <path d="M4 19h16" strokeDasharray="4 2"/>
            </>
        );
        case 'turn': return (
            <>
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
            </>
        );
        case 'fight': return (
            <>
                <line x1="14.5" y1="17.5" x2="19" y2="22" />
                <line x1="5" y1="2" x2="19" y2="16" />
                <line x1="2" y1="5" x2="16" y2="19" />
                <line x1="9.5" y1="17.5" x2="5" y2="22" />
            </>
        );
        case 'fall': return (
            <>
               <path d="M12 5v14" strokeDasharray="4 2"/>
               <polyline points="19 13 12 20 5 13" />
            </>
        );

        // Dialogue
        case 'speech-bubble': return (
            <>
               <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </>
        );

        // Emotion
        case 'happy': return (
            <>
                <circle cx="12" cy="12" r="10" />
                <circle cx="8" cy="10" r="1" fill="currentColor" />
                <circle cx="16" cy="10" r="1" fill="currentColor" />
                <path d="M8 14c1.5 2 4.5 2 6 0" />
            </>
        );
        case 'angry': return (
            <>
                <circle cx="12" cy="12" r="10" />
                <path d="M8 10l1.5 1.5" />
                <path d="M16 10l-1.5 1.5" />
                <path d="M8 14l4-2 4 2" />
                <path d="M12 8l0-2" />
            </>
        );
        case 'sad': return (
            <>
                <circle cx="12" cy="12" r="10" />
                <circle cx="8" cy="10" r="1" fill="currentColor" />
                <circle cx="16" cy="10" r="1" fill="currentColor" />
                <path d="M8 14c1.5-2 4.5-2 6 0" />
            </>
        );
        case 'laughing': return (
            <>
                <circle cx="12" cy="12" r="10" />
                <circle cx="8" cy="10" r="1" fill="currentColor" />
                <circle cx="16" cy="10" r="1" fill="currentColor" />
                <path d="M8 14c1.5 2 4.5 2 6 0" />
                <path d="M7 8l1.5-1.5" />
                <path d="M17 8l-1.5-1.5" />
            </>
        );
        case 'surprised': return (
            <>
                <circle cx="12" cy="12" r="10" />
                <circle cx="8" cy="10" r="1" fill="currentColor" />
                <circle cx="16" cy="10" r="1" fill="currentColor" />
                <circle cx="12" cy="14" r="1" fill="currentColor" />
            </>
        );
        case 'confused': return (
            <>
                <circle cx="12" cy="12" r="10" />
                <circle cx="8" cy="10" r="1" fill="currentColor" />
                <circle cx="16" cy="10" r="1" fill="currentColor" />
                <path d="M10 14c0.5 1 1.5 1 2 0" />
                <path d="M12 8l0-2" />
                <path d="M14 8l-1-1" />
            </>
        );
        case 'fearful': return (
            <>
                <circle cx="12" cy="12" r="10" />
                <path d="M8 9l1.5 1.5" />
                <path d="M16 9l-1.5 1.5" />
                <path d="M8 15l4-2 4 2" />
                <path d="M12 8l0-3" />
            </>
        );

        // Additional Action Symbols
        case 'jump-arrow': return (
            <>
                <path d="M12 2v16" />
                <path d="M8 12l4 4 4-4" />
            </>
        );
        case 'rotate-arrow': return (
            <>
                <path d="M12 2a10 10 0 0 1 10 10" />
                <path d="M12 12h10" />
                <path d="M20 10l2 2-2 2" />
            </>
        );
        case 'continuous-jump-arrow': return (
            <>
                <path d="M12 2v16" />
                <path d="M8 6l4 4 4-4" />
                <path d="M8 12l4 4 4-4" />
                <path d="M8 18l4 4 4-4" />
            </>
        );

        default: return <circle cx="12" cy="12" r="10" />;
    }
  };

  return (
    <div className={`w-full h-full flex items-center justify-center ${className}`}>
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="w-full h-full drop-shadow-sm filter"
            style={{ 
                maxWidth: '90%', 
                maxHeight: '90%'
            }}
        >
            {getPath(icon)}
            
            {/* Render custom text inside bubble if present */}
            {category === SymbolCategory.DIALOGUE && text && (
                <foreignObject x="4" y="8" width="16" height="8">
                    <div className="w-full h-full flex items-center justify-center text-center">
                        <span className="text-[4px] font-bold text-emerald-800 leading-none overflow-hidden">{text}</span>
                    </div>
                </foreignObject>
            )}
        </svg>
    </div>
  );
};

export default SymbolIcon;
