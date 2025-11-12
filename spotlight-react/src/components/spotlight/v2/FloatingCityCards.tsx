import { motion } from 'framer-motion';
import { useSpotlightStoreV2 } from '../../../stores/spotlightStoreV2';
import { MapPin, Moon, Plus } from 'lucide-react';
import { useState } from 'react';

const FloatingCityCards = () => {
  const {
    route,
    selectedCityIndex,
    setSelectedCity,
    setIsAddingLandmark,
    getCityName,
    getAgentColors
  } = useSpotlightStoreV2();

  const agentColors = getAgentColors();
  const [scrollPosition] = useState(0);

  if (!route) return null;

  const handleCityClick = (index: number) => {
    setSelectedCity(index === selectedCityIndex ? null : index);
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-40 pb-8">
      {/* Floating Add Button (FAB) */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 20 }}
        onClick={() => setIsAddingLandmark(true)}
        className="absolute right-8 -top-20 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform"
        style={{
          background: `linear-gradient(135deg, ${agentColors.primary}, ${agentColors.secondary})`
        }}
        title="Add City or Landmark"
      >
        <Plus className="w-8 h-8" />
      </motion.button>

      {/* City Cards Container */}
      <div className="max-w-screen-2xl mx-auto px-8">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative"
        >
          {/* Glass morphism container */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
            {/* Horizontal scrollable city cards */}
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {route.cities.map((city, index) => {
                const cityName = getCityName(city.city);
                const isSelected = selectedCityIndex === index;

                return (
                  <motion.div
                    key={`city-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleCityClick(index)}
                    className={`flex-shrink-0 w-64 p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? 'ring-2 shadow-lg scale-105'
                        : 'hover:bg-white/5'
                    }`}
                    style={{
                      background: isSelected
                        ? `linear-gradient(135deg, ${agentColors.primary}40, ${agentColors.secondary}40)`
                        : 'transparent',
                      ...(isSelected ? { '--tw-ring-color': agentColors.accent } as any : {})
                    }}
                  >
                    {/* City header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{
                            background: `linear-gradient(135deg, ${agentColors.primary}, ${agentColors.secondary})`
                          }}
                        >
                          {index + 1}
                        </div>
                        <h3 className="text-white font-semibold text-lg">{cityName}</h3>
                      </div>
                    </div>

                    {/* City info */}
                    <div className="flex items-center gap-4 text-sm text-gray-300">
                      <div className="flex items-center gap-1">
                        <Moon className="w-4 h-4" />
                        <span>{city.nights} {city.nights === 1 ? 'night' : 'nights'}</span>
                      </div>

                      {city.activities && city.activities.length > 0 && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{city.activities.length} activities</span>
                        </div>
                      )}
                    </div>

                    {/* Expand indicator */}
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 pt-3 border-t border-white/10"
                      >
                        <p className="text-gray-400 text-xs">Click to view details</p>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Scroll indicator if needed */}
            {route.cities.length > 4 && (
              <div className="flex justify-center mt-4 gap-1">
                {Array.from({ length: Math.ceil(route.cities.length / 4) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full transition-colors"
                    style={{
                      background: i === Math.floor(scrollPosition / 4)
                        ? agentColors.accent
                        : 'rgba(255, 255, 255, 0.2)'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FloatingCityCards;
