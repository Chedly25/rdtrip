/**
 * Editorial Day Card
 *
 * A beautiful, expandable day card that displays activities and restaurants
 * in the Wanderlust Editorial design style.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  MapPin,
  Clock,
  Sun,
  Sunset,
  Moon,
  Coffee,
  Utensils,
  Star,
  Sparkles
} from 'lucide-react';

interface Activity {
  name: string;
  description?: string;
  address?: string;
  duration?: string;
  suggestedTime?: string;
  rating?: number;
  photos?: string[];
  placeId?: string;
  category?: string;
}

interface Restaurant {
  name: string;
  cuisine?: string;
  address?: string;
  rating?: number;
  priceLevel?: number;
  mealType?: string;
  photos?: string[];
  placeId?: string;
}

interface DayData {
  date?: string;
  city: string;
  dayNumber?: number;
  weather?: {
    temp?: number;
    condition?: string;
    icon?: string;
  };
  activities?: {
    morning?: Activity[];
    afternoon?: Activity[];
    evening?: Activity[];
  };
  restaurants?: {
    breakfast?: Restaurant[];
    lunch?: Restaurant[];
    dinner?: Restaurant[];
  };
}

interface EditorialDayCardProps {
  day: DayData;
  dayNumber: number;
  activities?: any[];
  restaurants?: any[];
}

const timeIcons = {
  morning: Sun,
  afternoon: Sunset,
  evening: Moon,
};

const mealIcons = {
  breakfast: Coffee,
  lunch: Utensils,
  dinner: Moon,
};

const mealColors = {
  breakfast: { bg: 'bg-[#D4A853]/10', text: 'text-[#D4A853]', border: 'border-[#D4A853]/30' },
  lunch: { bg: 'bg-[#C45830]/10', text: 'text-[#C45830]', border: 'border-[#C45830]/30' },
  dinner: { bg: 'bg-[#4A6FA5]/10', text: 'text-[#4A6FA5]', border: 'border-[#4A6FA5]/30' },
};

export const EditorialDayCard = ({
  day,
  dayNumber,
  activities = [],
  restaurants = []
}: EditorialDayCardProps) => {
  const [isExpanded, setIsExpanded] = useState(dayNumber === 1); // First day expanded by default

  // Parse date for display
  const dateObj = day.date ? new Date(day.date) : null;
  const dayName = dateObj ? dateObj.toLocaleDateString('en-US', { weekday: 'long' }) : '';
  const dateStr = dateObj ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

  // Organize activities by time of day
  const morningActivities = day.activities?.morning || activities.filter((a: any) => a.timeOfDay === 'morning');
  const afternoonActivities = day.activities?.afternoon || activities.filter((a: any) => a.timeOfDay === 'afternoon');
  const eveningActivities = day.activities?.evening || activities.filter((a: any) => a.timeOfDay === 'evening');

  // Check if activities have time categorization - if not, show all as uncategorized
  const hasCategorizedActivities = morningActivities.length > 0 || afternoonActivities.length > 0 || eveningActivities.length > 0;
  const uncategorizedActivities = !hasCategorizedActivities ? activities : [];

  // Organize restaurants by meal
  const breakfastPlaces = day.restaurants?.breakfast || restaurants.filter((r: any) => r.mealType === 'breakfast');
  const lunchPlaces = day.restaurants?.lunch || restaurants.filter((r: any) => r.mealType === 'lunch');
  const dinnerPlaces = day.restaurants?.dinner || restaurants.filter((r: any) => r.mealType === 'dinner');

  // Check if restaurants have meal categorization
  const hasCategorizedRestaurants = breakfastPlaces.length > 0 || lunchPlaces.length > 0 || dinnerPlaces.length > 0;
  const uncategorizedRestaurants = !hasCategorizedRestaurants ? restaurants : [];

  const hasActivities = hasCategorizedActivities || uncategorizedActivities.length > 0;
  const hasRestaurants = hasCategorizedRestaurants || uncategorizedRestaurants.length > 0;
  const totalActivityCount = morningActivities.length + afternoonActivities.length + eveningActivities.length + uncategorizedActivities.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: dayNumber * 0.1 }}
      className="bg-white rounded-3xl border border-[#E8DFD3] shadow-sm overflow-hidden"
    >
      {/* Card Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-[#FAF7F2] transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* Day Number Badge */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C45830] to-[#D4A853] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-serif text-lg font-semibold">
              {dayNumber}
            </span>
          </div>

          {/* Day Info */}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-lg text-[#2C2417] font-semibold">
                {day.city}
              </h3>
              {day.weather && (
                <span className="text-sm text-[#8B7355]">
                  {day.weather.temp}°
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-[#8B7355]">
              {dateStr && <span>{dayName}, {dateStr}</span>}
              <span className="text-[#E8DFD3]">•</span>
              <span>{totalActivityCount} activities</span>
            </div>
          </div>
        </div>

        {/* Expand/Collapse Icon */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5 text-[#8B7355]" />
        </motion.div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-6 border-t border-[#E8DFD3]">
              {/* Activities Section */}
              {hasActivities && (
                <div className="pt-6 space-y-5">
                  <h4 className="text-xs font-semibold text-[#8B7355] uppercase tracking-wider">
                    Activities
                  </h4>

                  {/* Morning */}
                  {morningActivities.length > 0 && (
                    <TimePeriodSection
                      period="morning"
                      activities={morningActivities}
                    />
                  )}

                  {/* Afternoon */}
                  {afternoonActivities.length > 0 && (
                    <TimePeriodSection
                      period="afternoon"
                      activities={afternoonActivities}
                    />
                  )}

                  {/* Evening */}
                  {eveningActivities.length > 0 && (
                    <TimePeriodSection
                      period="evening"
                      activities={eveningActivities}
                    />
                  )}

                  {/* Uncategorized Activities (when no timeOfDay) */}
                  {uncategorizedActivities.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#C45830]" />
                        <span className="text-sm font-medium text-[#2C2417]">Planned</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {uncategorizedActivities.map((activity, idx) => (
                          <ActivityCard key={idx} activity={activity} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Restaurants Section */}
              {hasRestaurants && (
                <div className="pt-2 space-y-4">
                  <h4 className="text-xs font-semibold text-[#8B7355] uppercase tracking-wider">
                    Dining
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Breakfast */}
                    {breakfastPlaces.length > 0 && (
                      <MealSection
                        meal="breakfast"
                        restaurants={breakfastPlaces}
                      />
                    )}

                    {/* Lunch */}
                    {lunchPlaces.length > 0 && (
                      <MealSection
                        meal="lunch"
                        restaurants={lunchPlaces}
                      />
                    )}

                    {/* Dinner */}
                    {dinnerPlaces.length > 0 && (
                      <MealSection
                        meal="dinner"
                        restaurants={dinnerPlaces}
                      />
                    )}
                  </div>

                  {/* Uncategorized Restaurants */}
                  {uncategorizedRestaurants.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      {uncategorizedRestaurants.map((restaurant: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD3]">
                          <div className="flex items-center gap-2 mb-2">
                            <Utensils className="w-4 h-4 text-[#C45830]" />
                            <span className="text-xs font-medium text-[#C45830] uppercase tracking-wide">
                              Recommended
                            </span>
                          </div>
                          <h5 className="font-medium text-[#2C2417] text-sm">{restaurant.name}</h5>
                          {restaurant.cuisine && (
                            <p className="text-xs text-[#8B7355] mt-1">{restaurant.cuisine}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {restaurant.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-[#D4A853] fill-[#D4A853]" />
                                <span className="text-xs text-[#8B7355]">{restaurant.rating}</span>
                              </div>
                            )}
                            {restaurant.priceLevel && (
                              <span className="text-xs text-[#8B7355]">
                                {'€'.repeat(restaurant.priceLevel)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Empty State */}
              {!hasActivities && !hasRestaurants && (
                <div className="pt-6 text-center py-8">
                  <Sparkles className="w-8 h-8 text-[#D4A853] mx-auto mb-3" />
                  <p className="text-[#8B7355]">
                    Activities will appear here once generated
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Time Period Section Component
const TimePeriodSection = ({
  period,
  activities
}: {
  period: 'morning' | 'afternoon' | 'evening';
  activities: Activity[];
}) => {
  const Icon = timeIcons[period];
  const labels = {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening'
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-[#C45830]" />
        <span className="text-sm font-medium text-[#2C2417]">{labels[period]}</span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {activities.map((activity, idx) => (
          <ActivityCard key={idx} activity={activity} />
        ))}
      </div>
    </div>
  );
};

// Activity Card Component
const ActivityCard = ({ activity }: { activity: Activity }) => {
  const photo = activity.photos?.[0];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="group flex items-start gap-3 p-3 rounded-2xl bg-[#FAF7F2] hover:bg-[#F5F0E8] transition-colors cursor-pointer"
    >
      {/* Photo */}
      {photo && (
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
          <img
            src={photo}
            alt={activity.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h5 className="font-medium text-[#2C2417] text-sm line-clamp-1">
            {activity.name}
          </h5>
          {activity.rating && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="w-3 h-3 text-[#D4A853] fill-[#D4A853]" />
              <span className="text-xs text-[#8B7355]">{activity.rating}</span>
            </div>
          )}
        </div>

        {activity.description && (
          <p className="text-xs text-[#8B7355] line-clamp-2 mt-1">
            {activity.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2">
          {activity.suggestedTime && (
            <div className="flex items-center gap-1 text-xs text-[#8B7355]">
              <Clock className="w-3 h-3" />
              <span>{activity.suggestedTime}</span>
            </div>
          )}
          {activity.address && (
            <div className="flex items-center gap-1 text-xs text-[#8B7355]">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[120px]">{activity.address}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Meal Section Component
const MealSection = ({
  meal,
  restaurants
}: {
  meal: 'breakfast' | 'lunch' | 'dinner';
  restaurants: Restaurant[];
}) => {
  const Icon = mealIcons[meal];
  const colors = mealColors[meal];
  const labels = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner'
  };

  const restaurant = restaurants[0]; // Show primary recommendation

  return (
    <div className={`p-4 rounded-2xl ${colors.bg} border ${colors.border}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${colors.text}`} />
        <span className={`text-xs font-medium ${colors.text} uppercase tracking-wide`}>
          {labels[meal]}
        </span>
      </div>

      {restaurant && (
        <div className="space-y-2">
          <h5 className="font-medium text-[#2C2417] text-sm line-clamp-1">
            {restaurant.name}
          </h5>

          {restaurant.cuisine && (
            <p className="text-xs text-[#8B7355]">
              {restaurant.cuisine}
            </p>
          )}

          <div className="flex items-center gap-2">
            {restaurant.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-[#D4A853] fill-[#D4A853]" />
                <span className="text-xs text-[#8B7355]">{restaurant.rating}</span>
              </div>
            )}
            {restaurant.priceLevel && (
              <span className="text-xs text-[#8B7355]">
                {'€'.repeat(restaurant.priceLevel)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorialDayCard;
