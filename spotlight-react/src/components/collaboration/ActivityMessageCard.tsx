import { MapPin, Clock, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface Activity {
  name: string;
  city?: string;
  duration?: string;
  description?: string;
  url?: string;
}

interface ActivityMessageCardProps {
  activity: Activity;
  isCurrentUser: boolean;
}

export function ActivityMessageCard({ activity, isCurrentUser }: ActivityMessageCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`rounded-lg border overflow-hidden ${
        isCurrentUser
          ? 'bg-blue-600 border-blue-500'
          : 'bg-white border-gray-200'
      }`}
    >
      {/* Header */}
      <div
        className={`px-3 py-2 border-b ${
          isCurrentUser ? 'border-blue-500' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <MapPin className={`w-4 h-4 ${isCurrentUser ? 'text-blue-100' : 'text-blue-600'}`} />
          <span
            className={`text-sm font-semibold ${
              isCurrentUser ? 'text-white' : 'text-gray-900'
            }`}
          >
            Shared Activity
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h4
          className={`font-medium mb-1 ${
            isCurrentUser ? 'text-white' : 'text-gray-900'
          }`}
        >
          {activity.name}
        </h4>

        {/* Metadata */}
        <div className="flex flex-wrap gap-3 text-xs mb-2">
          {activity.city && (
            <div className="flex items-center gap-1">
              <MapPin className={`w-3 h-3 ${isCurrentUser ? 'text-blue-200' : 'text-gray-500'}`} />
              <span className={isCurrentUser ? 'text-blue-100' : 'text-gray-600'}>
                {activity.city}
              </span>
            </div>
          )}
          {activity.duration && (
            <div className="flex items-center gap-1">
              <Clock className={`w-3 h-3 ${isCurrentUser ? 'text-blue-200' : 'text-gray-500'}`} />
              <span className={isCurrentUser ? 'text-blue-100' : 'text-gray-600'}>
                {activity.duration}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {activity.description && (
          <p
            className={`text-sm mb-2 line-clamp-3 ${
              isCurrentUser ? 'text-blue-50' : 'text-gray-700'
            }`}
          >
            {activity.description}
          </p>
        )}

        {/* Link */}
        {activity.url && (
          <a
            href={activity.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${
              isCurrentUser
                ? 'text-blue-100 hover:text-white'
                : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            <span>View details</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </motion.div>
  );
}
