import { motion } from 'framer-motion';
import { Moon, MapPin, Utensils, ChevronRight, Minus, Plus, Star } from 'lucide-react';
import { useSpotlightStoreV2, type CityData } from '../../../stores/spotlightStoreV2';
import { getCityHighlight } from '../../../utils/cityHighlights';

interface SelectedCityPanelProps {
  city: CityData;
  cityIndex: number;
  onNightsChange: (nights: number) => void;
  onViewDetails?: () => void;
}

const SelectedCityPanel = ({
  city,
  cityIndex,
  onNightsChange,
  onViewDetails,
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
      className="h-full bg-neutral-50 rounded-2xl p-4 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-lg bg-neutral-900 text-white text-xs font-semibold flex items-center justify-center">
              {cityIndex + 1}
            </span>
            <h3 className="text-lg font-semibold text-neutral-900">{cityName}</h3>
          </div>
          <p className="text-sm text-neutral-500">{highlight}</p>
        </div>

        {/* Night Stepper */}
        <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm">
          <button
            onClick={() => onNightsChange(Math.max(0, nights - 1))}
            disabled={nights === 0}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="px-3 flex items-center gap-1.5">
            <Moon className="w-4 h-4 text-neutral-400" />
            <span className="text-sm font-semibold text-neutral-900 min-w-[20px] text-center">
              {nights}
            </span>
          </div>
          <button
            onClick={() => onNightsChange(Math.min(14, nights + 1))}
            disabled={nights >= 14}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-neutral-200">
        {activitiesCount > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-neutral-600">
            <MapPin className="w-4 h-4 text-neutral-400" />
            <span>{activitiesCount} {activitiesCount === 1 ? 'activity' : 'activities'}</span>
          </div>
        )}
        {restaurantsCount > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-neutral-600">
            <Utensils className="w-4 h-4 text-neutral-400" />
            <span>{restaurantsCount} {restaurantsCount === 1 ? 'restaurant' : 'restaurants'}</span>
          </div>
        )}
        {activitiesCount === 0 && restaurantsCount === 0 && (
          <span className="text-sm text-neutral-400">No activities added yet</span>
        )}
      </div>

      {/* Highlights Section */}
      {topActivities.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">
            Highlights
          </h4>
          <div className="space-y-2">
            {topActivities.map((activity: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-neutral-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {activity.name || activity}
                  </p>
                  {activity.description && (
                    <p className="text-xs text-neutral-500 truncate">
                      {activity.description}
                    </p>
                  )}
                </div>
                {activity.rating && (
                  <div className="flex items-center gap-0.5 text-xs text-amber-600">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{activity.rating}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* View Details Button */}
      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="w-full py-3 flex items-center justify-center gap-2 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors"
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
