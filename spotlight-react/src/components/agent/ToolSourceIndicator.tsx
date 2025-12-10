/**
 * ToolSourceIndicator - Visual badge showing live data sources
 *
 * When the agent uses tools to get real data, this component shows
 * elegant "pill" indicators that communicate credibility and freshness:
 * - "Powered by Google Places" for activities/restaurants
 * - "Live Weather Data" for weather forecasts
 * - "Real-time Availability" for hotels
 *
 * Design: Minimal, refined pills with subtle gradients and micro-animations
 * Aesthetic: Premium travel app feel - trustworthy and polished
 */

import { motion } from 'framer-motion';
import {
  MapPin,
  CloudSun,
  Building2,
  Route,
  Globe,
  Sparkles,
  Zap,
  Database
} from 'lucide-react';

// Tool-to-source mapping
const toolSources: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  glowColor: string;
}> = {
  searchActivities: {
    label: 'Google Places',
    icon: MapPin,
    gradient: 'from-emerald-500/90 to-teal-500/90',
    glowColor: 'shadow-emerald-500/20',
  },
  searchHotels: {
    label: 'Live Availability',
    icon: Building2,
    gradient: 'from-sky-500/90 to-blue-500/90',
    glowColor: 'shadow-sky-500/20',
  },
  checkWeather: {
    label: 'Weather API',
    icon: CloudSun,
    gradient: 'from-amber-500/90 to-orange-500/90',
    glowColor: 'shadow-amber-500/20',
  },
  getDirections: {
    label: 'Maps API',
    icon: Route,
    gradient: 'from-violet-500/90 to-purple-500/90',
    glowColor: 'shadow-violet-500/20',
  },
  getCityInfo: {
    label: 'Travel Data',
    icon: Globe,
    gradient: 'from-rose-500/90 to-pink-500/90',
    glowColor: 'shadow-rose-500/20',
  },
  webSearch: {
    label: 'Web Search',
    icon: Globe,
    gradient: 'from-slate-500/90 to-gray-500/90',
    glowColor: 'shadow-slate-500/20',
  },
  mentionPlace: {
    label: 'Google Places',
    icon: MapPin,
    gradient: 'from-emerald-500/90 to-teal-500/90',
    glowColor: 'shadow-emerald-500/20',
  },
  findAlternative: {
    label: 'Google Places',
    icon: Sparkles,
    gradient: 'from-indigo-500/90 to-blue-500/90',
    glowColor: 'shadow-indigo-500/20',
  },
};

interface ToolSourceIndicatorProps {
  toolsUsed: string[];
  className?: string;
}

export function ToolSourceIndicator({ toolsUsed, className = '' }: ToolSourceIndicatorProps) {
  if (!toolsUsed || toolsUsed.length === 0) {
    return null;
  }

  // Deduplicate and get source info
  const uniqueSources = [...new Set(toolsUsed)]
    .map(tool => ({ tool, ...toolSources[tool] }))
    .filter(source => source.label);

  if (uniqueSources.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className={`flex flex-wrap items-center gap-2 ${className}`}
    >
      {/* "Powered by" prefix */}
      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase tracking-wider font-medium">
        <Zap className="w-3 h-3" />
        <span>Live data</span>
      </div>

      {/* Source pills */}
      {uniqueSources.slice(0, 3).map((source, index) => {
        const IconComponent = source.icon;
        return (
          <motion.div
            key={source.tool}
            initial={{ opacity: 0, scale: 0.8, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{
              delay: 0.4 + index * 0.1,
              type: 'spring',
              stiffness: 300,
              damping: 20,
            }}
            className={`
              relative inline-flex items-center gap-1.5
              px-2.5 py-1 rounded-full
              bg-gradient-to-r ${source.gradient}
              text-white text-[10px] font-medium
              shadow-lg ${source.glowColor}
              backdrop-blur-sm
            `}
          >
            {/* Subtle inner glow */}
            <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Icon */}
            <IconComponent className="w-3 h-3 relative z-10" />

            {/* Label */}
            <span className="relative z-10">{source.label}</span>

            {/* Live indicator dot */}
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
            </span>
          </motion.div>
        );
      })}

      {/* Overflow indicator */}
      {uniqueSources.length > 3 && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-[10px] text-gray-400 font-medium"
        >
          +{uniqueSources.length - 3} more
        </motion.span>
      )}
    </motion.div>
  );
}

/**
 * Compact version for inline use in message headers
 */
export function ToolSourceBadge({ toolsUsed }: { toolsUsed: string[] }) {
  if (!toolsUsed || toolsUsed.length === 0) {
    return null;
  }

  // Get unique tools that have source mappings
  const validTools = [...new Set(toolsUsed)].filter(t => toolSources[t]);

  if (validTools.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 border border-teal-100"
    >
      <Database className="w-3 h-3 text-teal-600" />
      <span className="text-[10px] font-medium text-teal-700">
        {validTools.length} live source{validTools.length > 1 ? 's' : ''}
      </span>
    </motion.div>
  );
}

/**
 * Extract tool names from tool calls array (from message metadata)
 */
export function extractToolNames(toolCalls: Array<{ name: string }> | null | undefined): string[] {
  if (!toolCalls || !Array.isArray(toolCalls)) {
    return [];
  }
  return toolCalls.map(tc => tc.name).filter(Boolean);
}

export default ToolSourceIndicator;
