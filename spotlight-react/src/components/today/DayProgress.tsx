/**
 * DayProgress - Visual progress tracker for current day
 *
 * Features:
 * - Circular progress ring showing day completion
 * - Activity checklist with completed/upcoming items
 * - Time block indicators (morning/afternoon/evening)
 * - Next activity highlight
 * - Beautiful animations
 */

import { motion } from 'framer-motion';
import { Check, Circle, Clock, MapPin } from 'lucide-react';

interface Activity {
  name: string;
  block?: 'morning' | 'afternoon' | 'evening';
  address?: string;
  [key: string]: any;
}

interface DayProgressProps {
  dayNumber: number;
  location: string;
  activities: Activity[];
  completedActivities: Set<string>;
  currentTimeBlock: 'morning' | 'afternoon' | 'evening';
  progressPercent: number;
}

export function DayProgress({
  dayNumber,
  location,
  activities,
  completedActivities,
  currentTimeBlock,
  progressPercent
}: DayProgressProps) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Group activities by time block
  const activitiesByBlock = {
    morning: activities.filter(a => a.block === 'morning'),
    afternoon: activities.filter(a => a.block === 'afternoon'),
    evening: activities.filter(a => a.block === 'evening')
  };

  const blocks = [
    { id: 'morning', label: 'Morning', icon: '🌅', activities: activitiesByBlock.morning },
    { id: 'afternoon', label: 'Afternoon', icon: '☀️', activities: activitiesByBlock.afternoon },
    { id: 'evening', label: 'Evening', icon: '🌆', activities: activitiesByBlock.evening }
  ] as const;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Header with progress circle */}
      <div className="flex items-start gap-6 mb-6">
        {/* Circular progress */}
        <div className="relative flex-shrink-0">
          <svg width="140" height="140" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke="#e5e7eb"
              strokeWidth="12"
              fill="none"
            />
            {/* Progress circle */}
            <motion.circle
              cx="70"
              cy="70"
              r={radius}
              stroke="url(#progressGradient)"
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-900">{Math.round(progressPercent)}%</span>
            <span className="text-xs text-gray-500 font-medium">Complete</span>
          </div>
        </div>

        {/* Day info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">Day {dayNumber}</h2>
            <span className="px-3 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full">
              {currentTimeBlock}
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-600 mb-4">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">{location}</span>
          </div>

          <div className="flex gap-2">
            {blocks.map((block) => {
              const blockCompleted = block.activities.every(a => completedActivities.has(a.name));
              const isCurrentBlock = block.id === currentTimeBlock;

              return (
                <div
                  key={block.id}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${isCurrentBlock
                      ? 'bg-teal-100 text-teal-700 ring-2 ring-teal-300'
                      : blockCompleted
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }
                  `}
                >
                  <span>{block.icon}</span>
                  <span>{block.label}</span>
                  {blockCompleted && <Check className="w-3 h-3" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activity list */}
      <div className="space-y-3">
        {blocks.map((block) => {
          if (block.activities.length === 0) return null;

          return (
            <div key={block.id}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{block.icon}</span>
                <h3 className="text-sm font-semibold text-gray-700">{block.label}</h3>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <div className="space-y-2">
                {block.activities.map((activity, index) => {
                  const isCompleted = completedActivities.has(activity.name);
                  const isNext = !isCompleted && block.id === currentTimeBlock && index === 0;

                  return (
                    <motion.div
                      key={activity.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`
                        flex items-center gap-3 p-3 rounded-xl transition-all
                        ${isNext
                          ? 'bg-gradient-to-r from-teal-50 to-blue-50 border-2 border-teal-300'
                          : isCompleted
                            ? 'bg-green-50 border-2 border-green-200'
                            : 'bg-gray-50 border-2 border-gray-200'
                        }
                      `}
                    >
                      {/* Checkbox */}
                      <div
                        className={`
                          w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                          ${isCompleted
                            ? 'bg-green-500'
                            : isNext
                              ? 'bg-teal-500 animate-pulse'
                              : 'bg-white border-2 border-gray-300'
                          }
                        `}
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4 text-white" />
                        ) : isNext ? (
                          <Clock className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <Circle className="w-3 h-3 text-gray-400" />
                        )}
                      </div>

                      {/* Activity info */}
                      <div className="flex-1 min-w-0">
                        <h4
                          className={`
                            text-sm font-medium truncate
                            ${isCompleted
                              ? 'text-green-700 line-through'
                              : isNext
                                ? 'text-teal-900 font-semibold'
                                : 'text-gray-700'
                            }
                          `}
                        >
                          {activity.name}
                        </h4>
                        {activity.address && (
                          <p className="text-xs text-gray-500 truncate">{activity.address}</p>
                        )}
                      </div>

                      {/* Next indicator */}
                      {isNext && (
                        <span className="px-2 py-1 bg-teal-500 text-white text-xs font-bold rounded-full">
                          NEXT
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {activities.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No activities planned for today</p>
          </div>
        )}
      </div>
    </div>
  );
}
