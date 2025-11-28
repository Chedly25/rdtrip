import { motion } from 'framer-motion';
import { Moon, MapPin, Utensils, ChevronRight, Minus, Plus, Star, X, Sparkles, Clock } from 'lucide-react';
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
      className="h-full bg-rui-grey-2 rounded-rui-24 p-4 overflow-hidden relative"
    >
      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-rui-white shadow-rui-1 flex items-center justify-center text-rui-grey-50 hover:text-rui-black hover:bg-rui-grey-5 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4 pr-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-rui-8 bg-rui-accent text-white text-xs font-semibold flex items-center justify-center">
              {cityIndex + 1}
            </span>
            <h3 className="font-marketing text-heading-3 text-rui-black">{cityName}</h3>
            {country && (
              <span className="text-body-2 text-rui-grey-50">· {country}</span>
            )}
          </div>
          <p className="text-body-2 text-rui-grey-50">{highlight}</p>
        </div>
      </div>

      {/* Night Stepper - Full Width */}
      <div className="flex items-center justify-between bg-rui-white rounded-rui-16 p-3 shadow-rui-1 mb-4">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-rui-grey-50" />
          <span className="text-body-2 font-medium text-rui-black">Nights in {cityName}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNightsChange(Math.max(0, nights - 1))}
            disabled={nights === 0}
            className="w-8 h-8 rounded-rui-8 flex items-center justify-center text-rui-grey-50 hover:bg-rui-grey-5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-emphasis-1 text-rui-black min-w-[32px] text-center">
            {nights}
          </span>
          <button
            onClick={() => onNightsChange(Math.min(14, nights + 1))}
            disabled={nights >= 14}
            className="w-8 h-8 rounded-rui-8 flex items-center justify-center text-rui-grey-50 hover:bg-rui-grey-5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-rui-grey-10">
        <div className="flex items-center gap-1.5 text-body-2 text-rui-black">
          <MapPin className="w-4 h-4 text-rui-grey-50" />
          <span>{activitiesCount} {activitiesCount === 1 ? 'activity' : 'activities'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-body-2 text-rui-black">
          <Utensils className="w-4 h-4 text-rui-grey-50" />
          <span>{restaurantsCount} {restaurantsCount === 1 ? 'restaurant' : 'restaurants'}</span>
        </div>
        {nights > 0 && (
          <div className="flex items-center gap-1.5 text-body-2 text-rui-black">
            <Clock className="w-4 h-4 text-rui-grey-50" />
            <span>{nights} {nights === 1 ? 'night' : 'nights'}</span>
          </div>
        )}
      </div>

      {/* Content Area */}
      {topActivities.length > 0 ? (
        <div className="mb-4">
          <h4 className="text-body-3 font-semibold text-rui-grey-50 uppercase tracking-wide mb-2">
            Highlights
          </h4>
          <div className="space-y-2">
            {topActivities.map((activity: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 bg-rui-white rounded-rui-12 px-3 py-2.5 shadow-rui-1"
              >
                <div className="w-8 h-8 rounded-rui-8 bg-rui-accent-light flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-rui-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-2 font-medium text-rui-black truncate">
                    {activity.name || activity}
                  </p>
                  {activity.description && (
                    <p className="text-body-3 text-rui-grey-50 truncate">
                      {activity.description}
                    </p>
                  )}
                </div>
                {activity.rating && (
                  <div className="flex items-center gap-0.5 text-body-3 text-warning">
                    <Star className="w-3 h-3 fill-warning text-warning" />
                    <span>{activity.rating}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="mb-4 bg-rui-white rounded-rui-16 p-4 text-center">
          <div className="w-12 h-12 rounded-full bg-rui-accent-light flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-rui-accent" />
          </div>
          <p className="text-body-2 font-medium text-rui-black mb-1">No activities yet</p>
          <p className="text-body-3 text-rui-grey-50 mb-3">
            Add activities to make the most of your time in {cityName}
          </p>
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="text-body-3 font-medium text-rui-accent underline underline-offset-2 hover:text-rui-accent/80 transition-colors"
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
          className="w-full py-3 flex items-center justify-center gap-2 bg-rui-accent text-white rounded-rui-12 font-medium hover:bg-rui-accent/90 shadow-accent transition-colors"
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
