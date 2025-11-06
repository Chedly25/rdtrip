/**
 * Agent Orchestration Visualizer V4
 * Phase 1: 3-Column Layout with Agent Personalities
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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

interface Props {
  agents: AgentNode[];
}

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
          <div
            className="p-2 rounded-lg"
            style={{
              background: `${theme.color}15`,
              boxShadow: `0 0 15px ${theme.glow}`
            }}
          >
            <Icon className="w-5 h-5" style={{ color: theme.color }} />
          </div>
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

      {/* Activity feed (placeholder for Phase 2) */}
      {agent.status === 'running' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 space-y-1.5"
        >
          <div className="text-xs text-white/80">
            ⏳ Working...
          </div>
        </motion.div>
      )}

      {agent.status === 'completed' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 space-y-1.5"
        >
          <div className="text-xs text-green-400">
            ✓ Complete
          </div>
        </motion.div>
      )}

      {/* Progress bar */}
      {agent.status === 'running' && (
        <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: theme.color }}
            initial={{ width: '0%' }}
            animate={{ width: `${agent.progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}
    </motion.div>
  );
}

// Progress sidebar
function ProgressSidebar({ agents, elapsedTime }: { agents: AgentNode[]; elapsedTime: number }) {
  const completed = agents.filter(a => a.status === 'completed').length;
  const total = agents.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

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
          <div className="text-sm font-mono text-white/80">{elapsedTime}s</div>
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
                transition={{ duration: 0.8, ease: 'easeInOut' }}
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-white">{completed}</div>
              <div className="text-xs text-white/60">/ {total}</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">Completed</span>
            <span className="font-semibold text-white">{completed}/{total}</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full"
              style={{
                background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)'
              }}
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        </div>
      </div>

      {/* Discovery stats (placeholder for Phase 2) */}
      <div
        className="rounded-2xl p-6"
        style={{
          backdropFilter: 'blur(20px)',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="text-sm font-semibold text-white mb-4">Discovered</div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Places</span>
            <span className="text-lg font-bold text-white">0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Photos</span>
            <span className="text-lg font-bold text-white">0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Hotels</span>
            <span className="text-lg font-bold text-white">0</span>
          </div>
        </div>
      </div>

      {/* Next up */}
      <div
        className="rounded-2xl p-6"
        style={{
          backdropFilter: 'blur(20px)',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
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
                <div key={agent.id} className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" style={{ color: theme.color }} />
                  <span className="text-xs text-white/70">{theme.label}</span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

// Main component
export function AgentOrchestrationVisualizerV4({ agents }: Props) {
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
          className="flex-1 rounded-3xl flex items-center justify-center"
          style={{
            backdropFilter: 'blur(20px)',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          <div className="text-center">
            <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
            <div className="text-white/60 text-sm">
              Content discovery will appear here in Phase 2
            </div>
          </div>
        </div>

        {/* Right sidebar - Progress */}
        <div className="w-72">
          <ProgressSidebar agents={agents} elapsedTime={elapsedTime} />
        </div>
      </div>
    </div>
  );
}
