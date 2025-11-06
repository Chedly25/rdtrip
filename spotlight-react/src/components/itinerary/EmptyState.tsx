import { Plus, Search, MapPin } from 'lucide-react';

interface EmptyStateProps {
  type: 'activities' | 'restaurants' | 'accommodation';
  cityName?: string;
  onAddClick?: () => void;
}

export function EmptyState({ type, cityName, onAddClick }: EmptyStateProps) {
  const config = {
    activities: {
      icon: MapPin,
      title: 'No activities yet',
      description: cityName
        ? `We haven't found any activities in ${cityName} yet`
        : 'No activities planned for this day',
      action: 'Discover Activities',
      secondaryAction: 'Add Custom Activity'
    },
    restaurants: {
      icon: Search,
      title: 'No restaurants yet',
      description: cityName
        ? `We haven't found any restaurants in ${cityName} yet`
        : 'No dining options planned for this day',
      action: 'Find Restaurants',
      secondaryAction: 'Add Custom Restaurant'
    },
    accommodation: {
      icon: MapPin,
      title: 'No accommodation yet',
      description: cityName
        ? `We haven't found accommodation in ${cityName} yet`
        : 'No place to stay planned for this night',
      action: 'Find Hotels',
      secondaryAction: 'Add Custom Accommodation'
    }
  };

  const { icon: Icon, title, description, action, secondaryAction } = config[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>

      {/* Text */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-6 max-w-md">{description}</p>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onAddClick}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Search className="h-4 w-4" />
          {action}
        </button>
        <button
          onClick={onAddClick}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {secondaryAction}
        </button>
      </div>
    </div>
  );
}
