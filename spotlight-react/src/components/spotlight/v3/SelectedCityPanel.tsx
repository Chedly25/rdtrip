import { motion } from 'framer-motion';
import { Moon, MapPin, Utensils, ChevronRight, Minus, Plus, Star, X, Sparkles } from 'lucide-react';
import { useSpotlightStoreV2, type CityData } from '../../../stores/spotlightStoreV2';
import { getCityHighlight } from '../../../utils/cityHighlights';

interface SelectedCityPanelProps {
  city: CityData;
  cityIndex: number;
  onNightsChange: (nights: number) => void;
  onViewDetails?: () => void;
  onClose?: () => void;
}

const SelectedCityPanel = ({
  city,
  cityIndex,
  onNightsChange,
  onViewDetails,
  onClose,
}: SelectedCityPanelProps) => {
  const { getCityName } = useSpotlightStoreV2();

  const cityName = getCityName(city.city);
  const country = typeof city.city === 'object' ? city.city.country : undefined;
  const highlight = getCityHighlight(cityName, city, country);
  const nights = city.nights || 0;
  const activitiesCount = city.activities?.length || 0;
  const restaurantsCount = city.restaurants?.length || 0;

  // Get top 3 activities for highlights
  const topActivities = (city.activities || []).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full bg-[#FAF7F2] rounded-2xl p-4 overflow-hidden relative border border-[#E8DFD3]"
    >
      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-[#8B7355] hover:text-[#2C2417] hover:bg-[#F5F0E8] transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4 pr-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-lg bg-[#C45830] text-white text-xs font-bold flex items-center justify-center">
              {cityIndex + 1}
            </span>
            <h3 className="font-semibold text-lg text-[#2C2417]">{cityName}</h3>
            {country && (
              <span className="text-sm text-[#8B7355]">· {country}</span>
            )}
          </div>
          <p className="text-sm text-[#8B7355]">{highlight}</p>
        </div>
      </div>

      {/* Night Stepper - Full Width */}
      <div className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm border border-[#E8DFD3] mb-4">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-[#8B7355]" />
          <span className="text-sm font-medium text-[#2C2417]">Nights in {cityName}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNightsChange(Math.max(0, nights - 1))}
            disabled={nights === 0}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8B7355] hover:bg-[#F5F0E8] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-lg font-semibold text-[#2C2417] min-w-[32px] text-center">
            {nights}
          </span>
          <button
            onClick={() => onNightsChange(Math.min(14, nights + 1))}
            disabled={nights >= 14}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8B7355] hover:bg-[#F5F0E8] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#E8DFD3]">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F5F0E8] rounded-full">
          <MapPin className="w-3.5 h-3.5 text-[#8B7355]" />
          <span className="text-xs font-medium text-[#8B7355]">{activitiesCount} activities</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F5F0E8] rounded-full">
          <Utensils className="w-3.5 h-3.5 text-[#8B7355]" />
          <span className="text-xs font-medium text-[#8B7355]">{restaurantsCount} restaurants</span>
        </div>
      </div>

      {/* Content Area */}
      {topActivities.length > 0 ? (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-[#8B7355] uppercase tracking-wide mb-2">
            Highlights
          </h4>
          <div className="space-y-2">
            {topActivities.map((activity: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 shadow-sm border border-[#E8DFD3]"
              >
                <div className="w-8 h-8 rounded-lg bg-[#FFF0EB] flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-[#C45830]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#2C2417] truncate">
                    {activity.name || activity}
                  </p>
                  {activity.description && (
                    <p className="text-xs text-[#8B7355] truncate">
                      {activity.description}
                    </p>
                  )}
                </div>
                {activity.rating && (
                  <div className="flex items-center gap-0.5 text-xs text-[#D4A853]">
                    <Star className="w-3 h-3 fill-[#D4A853] text-[#D4A853]" />
                    <span>{activity.rating}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="mb-4 bg-white rounded-xl p-4 text-center border border-[#E8DFD3]">
          <div className="w-12 h-12 rounded-full bg-[#FFF0EB] flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-[#C45830]" />
          </div>
          <p className="text-sm font-medium text-[#2C2417] mb-1">No activities yet</p>
          <p className="text-xs text-[#8B7355] mb-3">
            Add activities to make the most of your time in {cityName}
          </p>
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="text-xs font-medium text-[#C45830] underline underline-offset-2 hover:text-[#A03820] transition-colors"
            >
              Add activities
            </button>
          )}
        </div>
      )}

      {/* View Details Button */}
      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="w-full py-3 flex items-center justify-center gap-2 bg-[#C45830] text-white rounded-xl font-medium hover:bg-[#A03820] shadow-md transition-colors"
        >
          View Full Details
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};

export { SelectedCityPanel };
export type { SelectedCityPanelProps };
