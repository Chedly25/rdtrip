import { MapPin, Clock, DollarSign, Star } from 'lucide-react';
import type { ThemeConfig } from '../../config/theme';

interface ActivityCardProps {
  activity: any;
  theme: ThemeConfig;
}

export function ActivityCard({ activity, theme }: ActivityCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${theme.primary}15` }}
        >
          <MapPin className="h-5 w-5" style={{ color: theme.primary }} />
        </div>
        <div className="flex-1">
          <h5 className="font-semibold text-gray-900">{activity.name}</h5>
          <p className="mt-1 text-sm text-gray-600">{activity.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {activity.timeSlot && (
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{activity.timeSlot}</span>
              </div>
            )}
            {activity.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{activity.duration}</span>
              </div>
            )}
            {activity.cost && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                <span>{activity.cost}</span>
              </div>
            )}
            {activity.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span>{activity.rating}</span>
              </div>
            )}
          </div>

          {activity.whyVisit && (
            <div className="mt-2 rounded-md bg-gray-50 p-2 text-xs italic text-gray-600">
              "{activity.whyVisit}"
            </div>
          )}

          {activity.tips && (
            <div className="mt-2 text-xs text-gray-500">
              💡 {activity.tips}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
