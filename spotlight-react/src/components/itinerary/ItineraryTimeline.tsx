import { motion } from 'framer-motion';
import { DayCard } from './DayCard';
import { BudgetSummary } from './BudgetSummary';
import { Download, Calendar, Share2 } from 'lucide-react';

interface ItineraryTimelineProps {
  itinerary: any;
  agentType: string;
}

export function ItineraryTimeline({ itinerary, agentType }: ItineraryTimelineProps) {
  if (!itinerary) return null;

  const { dayStructure, activities, restaurants, accommodations, scenicStops, practicalInfo, weather, events, budget } = itinerary;

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Itinerary</h2>
          <p className="mt-1 text-sm text-gray-500">
            {dayStructure?.days?.length || 0} days • Tailored for {agentType}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download className="h-4 w-4" />
            Export PDF
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Calendar className="h-4 w-4" />
            Add to Calendar
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>

      {/* Budget Summary */}
      {budget && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <BudgetSummary budget={budget} />
        </motion.div>
      )}

      {/* Days Timeline */}
      <div className="space-y-6">
        {dayStructure?.days?.map((day: any, index: number) => (
          <motion.div
            key={day.day}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <DayCard
              day={day}
              activities={activities?.filter((a: any) => a.day === day.day) || []}
              restaurants={restaurants?.filter((r: any) => r.day === day.day) || []}
              accommodation={accommodations?.find((h: any) => h.night === day.day)}
              scenicStops={scenicStops?.filter((s: any) => s.day === day.day) || []}
              practicalInfo={practicalInfo?.find((p: any) => p.city === day.overnight)}
              weather={weather?.find((w: any) => w.day === day.day)}
              events={events?.filter((e: any) => e.day === day.day) || []}
              agentType={agentType}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
