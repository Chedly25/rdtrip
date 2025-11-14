/**
 * QuickActions - Context-aware action buttons
 *
 * Features:
 * - Navigate to next activity
 * - Find nearby restaurants/cafes
 * - Call accommodation
 * - Emergency services
 * - Share location
 * - Context-aware suggestions based on location/time
 */

import { motion } from 'framer-motion';
import { Navigation, Coffee, Utensils, Share2, AlertCircle, MapPin, Check, X } from 'lucide-react';
import { useState } from 'react';

interface Activity {
  name: string;
  address?: string;
  location?: {
    lat: number;
    lng: number;
  };
  phone?: string;
  [key: string]: any;
}

interface QuickActionsProps {
  nextActivity: Activity | null;
  currentLocation: {
    latitude: number;
    longitude: number;
    city?: string;
  } | null;
  distanceToNext: number | null; // meters
  timeBlock: 'morning' | 'afternoon' | 'evening';
  onMarkCompleted?: (activity: Activity) => void;
  onSkipActivity?: (activity: Activity) => void;
}

export function QuickActions({
  nextActivity,
  currentLocation,
  distanceToNext,
  timeBlock,
  onMarkCompleted,
  onSkipActivity
}: QuickActionsProps) {
  const [showMoreActions, setShowMoreActions] = useState(false);

  // Navigate to next activity
  const handleNavigate = () => {
    if (!nextActivity?.location) {
      alert('No destination coordinates available');
      return;
    }

    const { lat, lng } = nextActivity.location;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  // Find nearby places
  const handleFindNearby = (type: 'restaurant' | 'cafe' | 'gas' | 'parking') => {
    if (!currentLocation) {
      alert('Location not available');
      return;
    }

    const { latitude, longitude } = currentLocation;
    const queries = {
      restaurant: 'restaurant',
      cafe: 'cafe',
      gas: 'gas+station',
      parking: 'parking'
    };

    const url = `https://www.google.com/maps/search/${queries[type]}/@${latitude},${longitude},15z`;
    window.open(url, '_blank');
  };

  // Share current location
  const handleShareLocation = async () => {
    if (!currentLocation) {
      alert('Location not available');
      return;
    }

    const { latitude, longitude, city } = currentLocation;
    const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const text = `I'm currently in ${city || 'unknown location'}.\n${locationUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Current Location',
          text,
          url: locationUrl
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(text);
      alert('Location copied to clipboard!');
    }
  };

  // Emergency services
  const handleEmergency = () => {
    const confirmed = confirm('Do you need emergency assistance? This will show nearby emergency services.');
    if (confirmed && currentLocation) {
      const { latitude, longitude } = currentLocation;
      const url = `https://www.google.com/maps/search/hospital/@${latitude},${longitude},13z`;
      window.open(url, '_blank');
    }
  };

  // Format distance
  const formatDistance = (meters: number | null): string => {
    if (meters === null) return '';

    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  };

  // Primary actions (always visible)
  const primaryActions = [
    {
      id: 'navigate',
      label: 'Navigate',
      sublabel: distanceToNext ? formatDistance(distanceToNext) : 'To next activity',
      icon: Navigation,
      color: 'bg-teal-500',
      hoverColor: 'hover:bg-teal-600',
      action: handleNavigate,
      disabled: !nextActivity,
      prominent: true
    },
    {
      id: 'complete',
      label: 'Complete',
      sublabel: 'Mark as done',
      icon: Check,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      action: () => nextActivity && onMarkCompleted?.(nextActivity),
      disabled: !nextActivity
    },
    {
      id: 'skip',
      label: 'Skip',
      sublabel: 'Not doing this',
      icon: X,
      color: 'bg-gray-400',
      hoverColor: 'hover:bg-gray-500',
      action: () => nextActivity && onSkipActivity?.(nextActivity),
      disabled: !nextActivity
    }
  ];

  // Context-aware quick actions
  const contextActions = [
    {
      id: 'restaurant',
      label: timeBlock === 'morning' ? 'Breakfast' : timeBlock === 'afternoon' ? 'Lunch' : 'Dinner',
      icon: Utensils,
      action: () => handleFindNearby('restaurant')
    },
    {
      id: 'cafe',
      label: 'Coffee',
      icon: Coffee,
      action: () => handleFindNearby('cafe')
    },
    {
      id: 'share',
      label: 'Share Location',
      icon: Share2,
      action: handleShareLocation
    },
    {
      id: 'emergency',
      label: 'Emergency',
      icon: AlertCircle,
      action: handleEmergency,
      color: 'text-red-600'
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-teal-600" />
        Quick Actions
      </h3>

      {/* Primary actions - Large buttons */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {primaryActions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={action.action}
            disabled={action.disabled}
            className={`
              ${action.prominent ? 'col-span-3' : 'col-span-1'}
              ${action.color} ${action.hoverColor}
              text-white rounded-xl p-4 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              flex flex-col items-center justify-center gap-2
              shadow-md hover:shadow-lg active:scale-95
            `}
          >
            <action.icon className={action.prominent ? 'w-8 h-8' : 'w-6 h-6'} />
            <div className="text-center">
              <div className={`font-bold ${action.prominent ? 'text-lg' : 'text-sm'}`}>
                {action.label}
              </div>
              <div className="text-xs opacity-90">{action.sublabel}</div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Context actions - Compact buttons */}
      <div>
        <button
          onClick={() => setShowMoreActions(!showMoreActions)}
          className="w-full text-sm font-medium text-gray-600 hover:text-gray-900 py-2 flex items-center justify-center gap-2 transition-colors"
        >
          {showMoreActions ? 'Hide' : 'Show'} More Actions
          <motion.div
            animate={{ rotate: showMoreActions ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ▼
          </motion.div>
        </button>

        {showMoreActions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 gap-2 mt-3"
          >
            {contextActions.map((action, index) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={action.action}
                className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border-2 border-gray-200"
              >
                <action.icon className={`w-5 h-5 ${action.color || 'text-gray-600'}`} />
                <span className="text-sm font-medium text-gray-700">{action.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Next activity preview */}
      {nextActivity && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl border-2 border-teal-200"
        >
          <div className="text-xs font-semibold text-teal-700 mb-1">UP NEXT</div>
          <div className="text-sm font-bold text-gray-900">{nextActivity.name}</div>
          {nextActivity.address && (
            <div className="text-xs text-gray-600 mt-1">{nextActivity.address}</div>
          )}
        </motion.div>
      )}
    </div>
  );
}
