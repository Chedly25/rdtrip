/**
 * Agent Orchestration Visualizer V4
 * Phase 1: 3-Column Layout with Agent Personalities
 */

import { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import {
  Calendar,
  Sparkles,
  UtensilsCrossed,
  Hotel,
  Palmtree,
  Cloud,
  PartyPopper,
  Info,
  DollarSign,
  Check,
  Loader2,
  Clock
} from 'lucide-react';
import type { AgentNode } from './AgentOrchestrationVisualizer';
import type { PartialItinerary } from './ProgressiveItineraryPreview';

interface Props {
  agents: AgentNode[];
  partialResults: PartialItinerary;
}

interface DiscoveredPlace {
  id: string;
  name: string;
  type: 'activity' | 'restaurant' | 'accommodation' | 'scenic';
  photo: string;
  rating?: number;
  city?: string;
  agent: string;
}

// Count-up animation component
function AnimatedNumber({ value }: { value: number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const motionValue = useSpring(0, { stiffness: 100, damping: 20 });
  const rounded = useTransform(motionValue, (latest) => Math.round(latest));

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = rounded.on('change', (latest) => {
      if (nodeRef.current) {
        nodeRef.current.textContent = latest.toString();
      }
    });
    return unsubscribe;
  }, [rounded]);

  return <span ref={nodeRef}>0</span>;
}

// Agent activity messages
const AGENT_ACTIVITIES = {
  dayPlanner: {
    running: ['Planning your route...', 'Analyzing waypoints...', 'Optimizing stops...'],
    completed: 'Route structure complete'
  },
  googleActivities: {
    running: ['Searching for activities...', 'Finding top attractions...', 'Discovering experiences...'],
    completed: 'Activities discovered'
  },
  activities: {
    running: ['Searching for activities...', 'Finding top attractions...', 'Discovering experiences...'],
    completed: 'Activities discovered'
  },
  googleRestaurants: {
    running: ['Finding restaurants...', 'Discovering dining spots...', 'Searching for cuisines...'],
    completed: 'Restaurants found'
  },
  restaurants: {
    running: ['Finding restaurants...', 'Discovering dining spots...', 'Searching for cuisines...'],
    completed: 'Restaurants found'
  },
  googleAccommodations: {
    running: ['Searching for hotels...', 'Finding accommodations...', 'Checking availability...'],
    completed: 'Hotels located'
  },
  accommodations: {
    running: ['Searching for hotels...', 'Finding accommodations...', 'Checking availability...'],
    completed: 'Hotels located'
  },
  scenicStops: {
    running: ['Discovering scenic routes...', 'Finding viewpoints...', 'Locating photo spots...'],
    completed: 'Scenic stops found'
  },
  weather: {
    running: ['Checking weather...', 'Getting forecasts...', 'Analyzing conditions...'],
    completed: 'Weather data ready'
  },
  events: {
    running: ['Finding local events...', 'Searching festivals...', 'Checking calendars...'],
    completed: 'Events discovered'
  },
  practicalInfo: {
    running: ['Gathering tips...', 'Finding parking info...', 'Collecting insights...'],
    completed: 'Practical info ready'
  },
  budget: {
    running: ['Calculating costs...', 'Estimating budget...', 'Analyzing prices...'],
    completed: 'Budget calculated'
  }
};

// Agent theme configuration
const AGENT_THEMES = {
  dayPlanner: {
    icon: Calendar,
    color: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.4)',
    label: 'Day Planner'
  },
  activities: {
    icon: Sparkles,
    color: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.4)',
    label: 'Activities'
  },
  googleActivities: {
    icon: Sparkles,
    color: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.4)',
    label: 'Activities'
  },
  restaurants: {
    icon: UtensilsCrossed,
    color: '#f97316',
    glow: 'rgba(249, 115, 22, 0.4)',
    label: 'Restaurants'
  },
  googleRestaurants: {
    icon: UtensilsCrossed,
    color: '#f97316',
    glow: 'rgba(249, 115, 22, 0.4)',
    label: 'Restaurants'
  },
  accommodations: {
    icon: Hotel,
    color: '#14b8a6',
    glow: 'rgba(20, 184, 166, 0.4)',
    label: 'Hotels'
  },
  googleAccommodations: {
    icon: Hotel,
    color: '#14b8a6',
    glow: 'rgba(20, 184, 166, 0.4)',
    label: 'Hotels'
  },
  scenicStops: {
    icon: Palmtree,
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.4)',
    label: 'Scenic Stops'
  },
  weather: {
    icon: Cloud,
    color: '#eab308',
    glow: 'rgba(234, 179, 8, 0.4)',
    label: 'Weather'
  },
  events: {
    icon: PartyPopper,
    color: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.4)',
    label: 'Events'
  },
  practicalInfo: {
    icon: Info,
    color: '#6b7280',
    glow: 'rgba(107, 114, 128, 0.4)',
    label: 'Practical Info'
  },
  budget: {
    icon: DollarSign,
    color: '#059669',
    glow: 'rgba(5, 150, 105, 0.4)',
    label: 'Budget'
  }
};

// Get theme for agent
function getAgentTheme(agentId: string) {
  return AGENT_THEMES[agentId as keyof typeof AGENT_THEMES] || {
    icon: Sparkles,
    color: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.4)',
    label: agentId
  };
}

// Phase indicator bar
function PhaseIndicator({ currentPhase }: { currentPhase: number }) {
  const phases = [
    { id: 1, label: 'Discovery', icon: Sparkles },
    { id: 2, label: 'Planning', icon: Calendar },
    { id: 3, label: 'Enrichment', icon: Palmtree },
    { id: 4, label: 'Done', icon: Check }
  ];

  return (
    <div className="flex items-center justify-center gap-2 px-6 py-4">
      {phases.map((phase, index) => {
        const Icon = phase.icon;
        const isActive = currentPhase >= phase.id;
        const isCurrent = currentPhase === phase.id;

        return (
          <div key={phase.id} className="flex items-center gap-2">
            <motion.div
              className="flex items-center gap-3 px-4 py-2 rounded-full transition-all"
              style={{
                background: isActive
                  ? 'rgba(139, 92, 246, 0.15)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: isCurrent
                  ? '1px solid rgba(139, 92, 246, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.1)'
              }}
              animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Icon
                className="w-4 h-4"
                style={{
                  color: isActive ? '#8b5cf6' : 'rgba(255, 255, 255, 0.4)'
                }}
              />
              <span
                className="text-sm font-medium"
                style={{
                  color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.4)'
                }}
              >
                {phase.label}
              </span>
            </motion.div>

            {index < phases.length - 1 && (
              <div
                className="w-12 h-0.5 transition-all"
                style={{
                  background: currentPhase > phase.id
                    ? 'rgba(139, 92, 246, 0.5)'
                    : 'rgba(255, 255, 255, 0.1)'
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Agent card in sidebar
function AgentCard({ agent }: { agent: AgentNode }) {
  const theme = getAgentTheme(agent.name);
  const Icon = theme.icon;
  const [activityIndex, setActivityIndex] = useState(0);
  const activities = AGENT_ACTIVITIES[agent.name as keyof typeof AGENT_ACTIVITIES];

  // Rotate through activity messages for running agents
  useEffect(() => {
    if (agent.status === 'running' && activities?.running) {
      const interval = setInterval(() => {
        setActivityIndex((prev) => (prev + 1) % activities.running.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [agent.status, activities]);

  const getStatusIcon = () => {
    switch (agent.status) {
      case 'completed':
        return <Check className="w-4 h-4 text-green-400" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'error':
        return <span className="w-4 h-4 text-red-400">✗</span>;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="relative overflow-hidden rounded-xl transition-all"
      style={{
        backdropFilter: 'blur(20px)',
        background: agent.status === 'running'
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderLeft: `3px solid ${theme.color}`,
        padding: '16px',
        boxShadow: agent.status === 'running'
          ? `0 0 20px ${theme.glow}`
          : 'none'
      }}
    >
      {/* Icon and title */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <motion.div
            className="p-2 rounded-lg"
            style={{
              background: `${theme.color}15`,
              boxShadow: agent.status === 'running' ? `0 0 15px ${theme.glow}` : 'none'
            }}
            animate={agent.status === 'running' ? {
              scale: [1, 1.1, 1],
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Icon className="w-5 h-5" style={{ color: theme.color }} />
          </motion.div>
          <div>
            <div className="text-sm font-semibold text-white">{theme.label}</div>
            <div className="flex items-center gap-1.5 mt-1">
              {getStatusIcon()}
              <span className="text-xs text-white/60 capitalize">
                {agent.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity feed with rotating messages */}
      {agent.status === 'running' && activities?.running && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3"
        >
          <motion.div
            key={activityIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-xs text-white/80 flex items-center gap-2"
          >
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              ⚡
            </motion.span>
            {activities.running[activityIndex]}
          </motion.div>
        </motion.div>
      )}

      {agent.status === 'completed' && activities?.completed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="mt-3"
        >
          <div className="text-xs text-green-400 flex items-center gap-2">
            <span>✓</span>
            {activities.completed}
          </div>
        </motion.div>
      )}

      {/* Animated progress bar */}
      {agent.status === 'running' && (
        <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${theme.color}, ${theme.glow})`,
            }}
            initial={{ width: '0%' }}
            animate={{ width: `${agent.progress}%` }}
            transition={{ type: 'spring', stiffness: 50, damping: 20 }}
          />
        </div>
      )}
    </motion.div>
  );
}

// Progress sidebar with real discovered counts
function ProgressSidebar({ agents, elapsedTime, partialResults }: { agents: AgentNode[]; elapsedTime: number; partialResults: PartialItinerary }) {
  const completed = agents.filter(a => a.status === 'completed').length;
  const total = agents.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  // Calculate real discovered counts
  const placesCount = (partialResults.activities?.length || 0) +
                      (partialResults.restaurants?.length || 0) +
                      (partialResults.accommodations?.length || 0) +
                      (partialResults.scenicStops?.length || 0);

  const photosCount = [
    ...(partialResults.activities || []),
    ...(partialResults.restaurants || []),
    ...(partialResults.accommodations || []),
    ...(partialResults.scenicStops || [])
  ].reduce((sum, item) => sum + (item.photos?.length || 0), 0);

  const hotelsCount = partialResults.accommodations?.length || 0;

  return (
    <div className="space-y-6">
      {/* Time and progress */}
      <div
        className="rounded-2xl p-6"
        style={{
          backdropFilter: 'blur(20px) saturate(180%)',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="text-xs uppercase tracking-wider text-white/60">Progress</div>
          <div className="text-sm font-mono text-white/80">
            <AnimatedNumber value={elapsedTime} />s
          </div>
        </div>

        {/* Circular progress */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="8"
                fill="none"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="56"
                stroke="url(#progressGradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDasharray: '0 352' }}
                animate={{
                  strokeDasharray: `${(progress / 100) * 352} 352`
                }}
                transition={{ type: 'spring', stiffness: 50, damping: 20 }}
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-white">
                <AnimatedNumber value={completed} />
              </div>
              <div className="text-xs text-white/60">/ {total}</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">Completed</span>
            <span className="font-semibold text-white">
              <AnimatedNumber value={completed} />/{total}
            </span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full"
              style={{
                background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)'
              }}
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 50, damping: 20 }}
            />
          </div>
        </div>
      </div>

      {/* Discovery stats with real counts */}
      <motion.div
        className="rounded-2xl p-6"
        style={{
          backdropFilter: 'blur(20px)',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Discovered
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Places</span>
            <motion.span
              className="text-lg font-bold text-white"
              key={placesCount}
              initial={{ scale: 1.5, color: '#8b5cf6' }}
              animate={{ scale: 1, color: '#ffffff' }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <AnimatedNumber value={placesCount} />
            </motion.span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Photos</span>
            <motion.span
              className="text-lg font-bold text-white"
              key={photosCount}
              initial={{ scale: 1.5, color: '#06b6d4' }}
              animate={{ scale: 1, color: '#ffffff' }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <AnimatedNumber value={photosCount} />
            </motion.span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Hotels</span>
            <motion.span
              className="text-lg font-bold text-white"
              key={hotelsCount}
              initial={{ scale: 1.5, color: '#f97316' }}
              animate={{ scale: 1, color: '#ffffff' }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <AnimatedNumber value={hotelsCount} />
            </motion.span>
          </div>
        </div>
      </motion.div>

      {/* Next up */}
      <motion.div
        className="rounded-2xl p-6"
        style={{
          backdropFilter: 'blur(20px)',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="text-sm font-semibold text-white mb-3">Next Up</div>
        <div className="space-y-2">
          {agents
            .filter(a => a.status === 'waiting')
            .slice(0, 3)
            .map(agent => {
              const theme = getAgentTheme(agent.name);
              const Icon = theme.icon;
              return (
                <motion.div
                  key={agent.id}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: theme.color }} />
                  <span className="text-xs text-white/70">{theme.label}</span>
                </motion.div>
              );
            })}
        </div>
      </motion.div>
    </div>
  );
}

// Content Discovery Grid - Phase 2
function ContentDiscoveryGrid({ partialResults }: { partialResults: PartialItinerary }) {
  // Extract all places with photos from partial results
  const discoveredPlaces: DiscoveredPlace[] = [];

  // Extract activities
  if (partialResults.activities) {
    partialResults.activities.forEach(activity => {
      if (activity.photos && activity.photos.length > 0) {
        discoveredPlaces.push({
          id: activity.id,
          name: activity.name,
          type: 'activity',
          photo: activity.photos[0].url,
          rating: activity.rating,
          city: activity.city,
          agent: 'Activities'
        });
      }
    });
  }

  // Extract restaurants
  if (partialResults.restaurants) {
    partialResults.restaurants.forEach(restaurant => {
      if (restaurant.photos && restaurant.photos.length > 0) {
        discoveredPlaces.push({
          id: restaurant.id,
          name: restaurant.name,
          type: 'restaurant',
          photo: restaurant.photos[0].url,
          rating: restaurant.rating,
          agent: 'Restaurants'
        });
      }
    });
  }

  // Extract accommodations
  if (partialResults.accommodations) {
    partialResults.accommodations.forEach(accommodation => {
      if (accommodation.photos && accommodation.photos.length > 0) {
        discoveredPlaces.push({
          id: accommodation.id,
          name: accommodation.name,
          type: 'accommodation',
          photo: accommodation.photos[0].url,
          rating: accommodation.rating,
          agent: 'Hotels'
        });
      }
    });
  }

  // Extract scenic stops
  if (partialResults.scenicStops) {
    partialResults.scenicStops.forEach(scenic => {
      if (scenic.photos && scenic.photos.length > 0) {
        discoveredPlaces.push({
          id: scenic.id,
          name: scenic.name,
          type: 'scenic',
          photo: scenic.photos[0].url,
          agent: 'Scenic Stops'
        });
      }
    });
  }

  if (discoveredPlaces.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
          <div className="text-white/60 text-sm">
            Discovering amazing places for your trip...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Statistics header with count-up animation */}
      <motion.div
        className="mb-6 flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <div className="text-white">
          <motion.div
            className="text-2xl font-bold"
            key={discoveredPlaces.length}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <AnimatedNumber value={discoveredPlaces.length} />
          </motion.div>
          <div className="text-sm text-white/60">Places Discovered</div>
        </div>
        <div className="flex gap-2">
          {['activity', 'restaurant', 'accommodation', 'scenic'].map(type => {
            const count = discoveredPlaces.filter(p => p.type === type).length;
            if (count === 0) return null;
            return (
              <motion.div
                key={type}
                className="px-3 py-1 rounded-full text-xs"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 150, damping: 15 }}
              >
                <span className="text-white/80 capitalize">{type}s: <AnimatedNumber value={count} /></span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Masonry grid with spring physics */}
      <div className="grid grid-cols-3 gap-4">
        {discoveredPlaces.map((place, index) => (
          <motion.div
            key={place.id}
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              type: 'spring',
              stiffness: 100,
              damping: 15,
              delay: index * 0.05
            }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="relative group overflow-hidden rounded-xl cursor-pointer"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              aspectRatio: '1'
            }}
          >
            {/* Image with blur-to-sharp reveal */}
            <motion.img
              src={place.photo}
              alt={place.name}
              className="w-full h-full object-cover"
              initial={{ filter: 'blur(20px)', scale: 1.1 }}
              animate={{ filter: 'blur(0px)', scale: 1 }}
              transition={{
                filter: { duration: 0.5, delay: index * 0.05 + 0.1 },
                scale: { type: 'spring', stiffness: 100, damping: 20, delay: index * 0.05 + 0.1 }
              }}
              loading="lazy"
            />

            {/* Overlay with info */}
            <motion.div
              className="absolute inset-0 flex flex-col justify-end p-3"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)'
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 100,
                damping: 20,
                delay: index * 0.05 + 0.2
              }}
            >
              <div className="text-white text-sm font-medium line-clamp-2 mb-1">
                {place.name}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/70 capitalize">{place.agent}</div>
                {place.rating && (
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400 text-xs">⭐</span>
                    <span className="text-white text-xs">{place.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Hover glow effect with spring physics */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.4), transparent)',
                opacity: 0
              }}
              whileHover={{ opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />

            {/* Shimmer effect on hover */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
                backgroundSize: '200% 200%'
              }}
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.6 }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Main component
export function AgentOrchestrationVisualizerV4({ agents, partialResults }: Props) {
  const [elapsedTime, setElapsedTime] = useState(0);

  // Track elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine current phase based on agent progress
  const getCurrentPhase = () => {
    const completedCount = agents.filter(a => a.status === 'completed').length;
    const totalCount = agents.length;
    const progress = totalCount > 0 ? completedCount / totalCount : 0;

    if (progress === 1) return 4; // Done
    if (progress > 0.6) return 3; // Enrichment
    if (progress > 0.3) return 2; // Planning
    return 1; // Discovery
  };

  return (
    <div
      className="relative w-full min-h-screen flex flex-col overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 30% 40%, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.1) 40%, #0a0a0f 80%)'
      }}
    >
      {/* Animated mesh spots */}
      <div className="absolute inset-0 opacity-15">
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
            filter: 'blur(200px)',
            left: '20%',
            top: '30%'
          }}
          animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
          transition={{ duration: 60, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)',
            filter: 'blur(200px)',
            right: '15%',
            top: '20%'
          }}
          animate={{ x: [0, -80, 0], y: [0, 100, 0] }}
          transition={{ duration: 50, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[550px] h-[550px] rounded-full"
          style={{
            background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)',
            filter: 'blur(200px)',
            left: '50%',
            bottom: '20%'
          }}
          animate={{ x: [0, 60, 0], y: [0, -70, 0] }}
          transition={{ duration: 55, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Grain texture */}
      <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      {/* Phase indicator */}
      <div className="relative z-10">
        <PhaseIndicator currentPhase={getCurrentPhase()} />
      </div>

      {/* 3-column layout */}
      <div className="relative z-10 flex-1 flex gap-6 px-6 pb-6">
        {/* Left sidebar - Agents */}
        <div className="w-80 space-y-3 overflow-y-auto">
          <div className="text-xs uppercase tracking-wider text-white/60 mb-3 px-2">
            Agents
          </div>
          {agents.map(agent => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>

        {/* Center - Content discovery (Phase 2) */}
        <div
          className="flex-1 rounded-3xl overflow-hidden"
          style={{
            backdropFilter: 'blur(20px)',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          <ContentDiscoveryGrid partialResults={partialResults} />
        </div>

        {/* Right sidebar - Progress */}
        <div className="w-72">
          <ProgressSidebar agents={agents} elapsedTime={elapsedTime} partialResults={partialResults} />
        </div>
      </div>
    </div>
  );
}
