import { motion } from 'framer-motion';
import { Loader, Check, AlertCircle, type LucideIcon } from 'lucide-react';
import type { AgentStatus } from './GenerationProgress';

interface AgentProgressCardProps {
  icon: LucideIcon;
  name: string;
  agent?: AgentStatus;
  description: string;
  themeColor?: string;
}

export function AgentProgressCard({
  icon: Icon,
  name,
  agent,
  description,
  themeColor = '#064d51' // default to best-overall theme
}: AgentProgressCardProps) {
  const statusConfig = {
    waiting: {
      borderColor: '#e5e7eb',
      bgColor: 'bg-gray-50',
      iconColor: '#9ca3af',
      indicator: <Loader className="h-4 w-4 text-gray-400" />
    },
    running: {
      borderColor: themeColor,
      bgColor: 'bg-white',
      iconColor: themeColor,
      indicator: <Loader className="h-4 w-4 animate-spin" style={{ color: themeColor }} />
    },
    completed: {
      borderColor: '#10b981',
      bgColor: 'bg-green-50',
      iconColor: '#059669',
      indicator: <Check className="h-4 w-4 text-green-600" />
    },
    error: {
      borderColor: '#ef4444',
      bgColor: 'bg-red-50',
      iconColor: '#dc2626',
      indicator: <AlertCircle className="h-4 w-4 text-red-600" />
    }
  };

  const config = statusConfig[agent?.status || 'waiting'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-xl border-2 p-4 transition-all ${config.bgColor}`}
      style={{
        borderColor: config.borderColor
      }}
    >
      {/* Animated border glow when running */}
      {agent?.status === 'running' && (
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${themeColor}20, ${themeColor}40)`
          }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <div className="relative">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" style={{ color: config.iconColor }} />
            <h3 className="font-semibold text-gray-900">{name}</h3>
          </div>
          {config.indicator}
        </div>

        {/* Description */}
        <p className="mb-3 text-xs text-gray-600">{description}</p>

        {/* Progress bar (if applicable) */}
        {agent?.progress && agent.status === 'running' && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{agent.progress.current} of {agent.progress.total}</span>
              <span>{Math.round((agent.progress.current / agent.progress.total) * 100)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: themeColor }}
                initial={{ width: 0 }}
                animate={{ width: `${(agent.progress.current / agent.progress.total) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Duration (if completed) */}
        {agent?.status === 'completed' && agent.duration && (
          <div className="mt-2 text-xs text-green-600">
            Completed in {(agent.duration / 1000).toFixed(1)}s
          </div>
        )}

        {/* Error message */}
        {agent?.status === 'error' && agent.error && (
          <div className="mt-2 text-xs text-red-600">
            {agent.error}
          </div>
        )}
      </div>
    </motion.div>
  );
}
