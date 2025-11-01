import { motion } from 'framer-motion';
import { Calendar, Map, Utensils, Hotel, Navigation, Info, Cloud, PartyPopper, DollarSign } from 'lucide-react';
import { AgentProgressCard } from './AgentProgressCard';

export interface AgentStatus {
  name: string;
  status: 'waiting' | 'running' | 'completed' | 'error';
  progress?: { current: number; total: number };
  duration?: number;
  error?: string;
}

interface GenerationProgressProps {
  agents: AgentStatus[];
  onComplete?: () => void;
}

export function GenerationProgress({ agents }: GenerationProgressProps) {
  const completedCount = agents.filter(a => a.status === 'completed').length;
  const totalCount = agents.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  return (
    <div className="space-y-6">
      {/* Overall progress bar */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">Generating your itinerary...</span>
          <span className="text-gray-500">
            {completedCount} / {totalCount} complete
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Agent cards grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AgentProgressCard
          icon={Calendar}
          name="Day Structure"
          agent={agents.find(a => a.name === 'day_planner')}
          description="Planning daily flow and timing"
        />
        <AgentProgressCard
          icon={Map}
          name="City Activities"
          agent={agents.find(a => a.name === 'activities')}
          description="Finding things to do"
        />
        <AgentProgressCard
          icon={Utensils}
          name="Restaurants"
          agent={agents.find(a => a.name === 'restaurants')}
          description="Curating dining experiences"
        />
        <AgentProgressCard
          icon={Hotel}
          name="Accommodations"
          agent={agents.find(a => a.name === 'accommodations')}
          description="Selecting places to stay"
        />
        <AgentProgressCard
          icon={Navigation}
          name="Scenic Stops"
          agent={agents.find(a => a.name === 'scenic_stops')}
          description="Discovering route highlights"
        />
        <AgentProgressCard
          icon={Info}
          name="Practical Tips"
          agent={agents.find(a => a.name === 'practical_info')}
          description="Gathering local insights"
        />
        <AgentProgressCard
          icon={Cloud}
          name="Weather"
          agent={agents.find(a => a.name === 'weather')}
          description="Checking forecasts"
        />
        <AgentProgressCard
          icon={PartyPopper}
          name="Local Events"
          agent={agents.find(a => a.name === 'events')}
          description="Finding special happenings"
        />
        <AgentProgressCard
          icon={DollarSign}
          name="Budget"
          agent={agents.find(a => a.name === 'budget')}
          description="Calculating costs"
        />
      </div>
    </div>
  );
}
