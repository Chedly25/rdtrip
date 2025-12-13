/**
 * CityTabs
 *
 * Horizontal tabs to switch between cities in the route.
 * Shows: city name, nights, item count, origin/destination labels.
 */

import { motion } from 'framer-motion';
import { MapPin, Check, Home, Flag } from 'lucide-react';
import type { CityTabsProps, CityTabData } from '../../types/planning';

interface CityTabProps {
  city: CityTabData;
  isActive: boolean;
  onClick: () => void;
}

function CityTab({ city, isActive, onClick }: CityTabProps) {
  const isOrigin = city.isOrigin;
  const isDestination = city.isDestination;

  return (
    <button
      onClick={onClick}
      disabled={isOrigin}
      className={`
        relative flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4
        font-['Satoshi',sans-serif] text-sm sm:text-base
        transition-all duration-200 ease-out
        border-b-2 -mb-px
        ${isActive
          ? 'border-[#C45830] text-[#2C2417] font-semibold bg-[#FFFBF5]'
          : isOrigin
            ? 'border-transparent text-[#C4B8A5] cursor-default'
            : 'border-transparent text-[#8B7355] hover:text-[#2C2417] hover:bg-[#FFFBF5]/50'
        }
      `}
    >
      {/* City Name */}
      <div className="flex items-center gap-2">
        {isOrigin && <Home className="h-3.5 w-3.5 text-[#C4B8A5]" />}
        {isDestination && <Flag className="h-3.5 w-3.5 text-[#4A90A4]" />}
        <span className="uppercase tracking-wide">{city.name}</span>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-2 mt-1 text-xs">
        {isOrigin ? (
          <span className="text-[#C4B8A5]">origin</span>
        ) : (
          <>
            <span className={isActive ? 'text-[#8B7355]' : 'text-[#C4B8A5]'}>
              {city.nights} {city.nights === 1 ? 'night' : 'nights'}
            </span>
            {city.itemCount > 0 && (
              <>
                <span className="text-[#E5DDD0]">·</span>
                <span className={`flex items-center gap-1 ${isActive ? 'text-[#4A7C59]' : 'text-[#C4B8A5]'}`}>
                  <MapPin className="h-3 w-3" />
                  {city.itemCount}
                </span>
              </>
            )}
            {city.isComplete && (
              <span className="flex items-center gap-1 text-[#4A7C59]">
                <Check className="h-3 w-3" />
              </span>
            )}
          </>
        )}
      </div>

      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="cityTabIndicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C45830]"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </button>
  );
}

export function CityTabs({ cities, currentCityId, onCityChange }: CityTabsProps) {
  return (
    <div className="bg-[#FAF7F2] border-b border-[#E5DDD0]">
      <div className="max-w-7xl mx-auto">
        {/* Scrollable tabs container */}
        <div className="flex overflow-x-auto scrollbar-hide">
          {cities.map((city) => (
            <CityTab
              key={city.id}
              city={city}
              isActive={city.id === currentCityId}
              onClick={() => !city.isOrigin && onCityChange(city.id)}
            />
          ))}

          {/* Route visual connector (desktop only) */}
          <div className="hidden lg:flex items-center px-4 text-[#E5DDD0]">
            <div className="flex items-center gap-1">
              {cities.slice(0, -1).map((_, i) => (
                <div key={i} className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-[#E5DDD0]" />
                  <div className="w-8 h-0.5 bg-[#E5DDD0]" />
                </div>
              ))}
              <div className="w-2 h-2 rounded-full bg-[#E5DDD0]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CityTabs;
