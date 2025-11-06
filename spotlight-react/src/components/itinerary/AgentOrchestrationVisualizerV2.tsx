import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { Check, X } from 'lucide-react';

export interface AgentNode {
  id: string;
  name: string;
  label: string;
  status: 'waiting' | 'running' | 'completed' | 'error';
  progress: number;
  startTime?: number;
  endTime?: number;
  dependencies: string[];
  phase: number;
  activities?: ActivityLog[];
}

interface ActivityLog {
  type: 'info' | 'success' | 'error' | 'progress';
  message: string;
  timestamp: number;
  details?: string;
  subItems?: string[];
}

interface Position {
  x: number;
  y: number;
}

// Grain texture SVG
function GrainTexture() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none">
      <filter id="noiseFilter">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves="4"
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noiseFilter)" opacity="0.4" />
    </svg>
  );
}

// Animated gradient mesh background
function GradientMesh() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `
          radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(6, 182, 212, 0.12) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 60%)
        `,
      }}
      animate={{
        backgroundPosition: [
          '20% 30%, 80% 70%, 50% 50%',
          '25% 35%, 75% 65%, 55% 45%',
          '20% 30%, 80% 70%, 50% 50%',
        ],
      }}
      transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

// Particle for node effects
function Particle({ delay, angle }: { delay: number; angle: number }) {
  return (
    <motion.div
      className="absolute w-0.5 h-0.5 rounded-full bg-blue-400"
      initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
      animate={{
        scale: [0, 1, 0],
        x: Math.cos(angle) * 40,
        y: Math.sin(angle) * 40,
        opacity: [0, 0.8, 0],
      }}
      transition={{
        duration: 0.8,
        delay,
        ease: 'easeOut',
      }}
    />
  );
}

// Confetti particle for completion
function Confetti({ delay, angle, color }: { delay: number; angle: number; color: string }) {
  return (
    <motion.div
      className="absolute w-1 h-2 rounded-sm"
      style={{ backgroundColor: color }}
      initial={{ scale: 0, x: 0, y: 0, opacity: 1, rotate: 0 }}
      animate={{
        scale: [0, 1, 0.5],
        x: Math.cos(angle) * 60,
        y: [0, Math.sin(angle) * -30, Math.sin(angle) * 60],
        opacity: [1, 1, 0],
        rotate: [0, 360],
      }}
      transition={{
        duration: 1.2,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    />
  );
}

// Individual agent node
function AgentNodeComponent({
  agent,
  position,
  onClick,
  isExpanded,
}: {
  agent: AgentNode;
  position: Position;
  onClick: () => void;
  isExpanded: boolean;
}) {
  const duration = agent.endTime && agent.startTime
    ? ((agent.endTime - agent.startTime) / 1000).toFixed(1)
    : agent.startTime
    ? ((Date.now() - agent.startTime) / 1000).toFixed(1)
    : null;

  const getStatusColor = () => {
    switch (agent.status) {
      case 'running':
        return { primary: '#8b5cf6', secondary: '#06b6d4' };
      case 'completed':
        return { primary: '#10b981', secondary: '#059669' };
      case 'error':
        return { primary: '#ef4444', secondary: '#dc2626' };
      default:
        return { primary: 'rgba(255,255,255,0.3)', secondary: 'rgba(255,255,255,0.1)' };
    }
  };

  const colors = getStatusColor();

  // Expanded panel
  if (isExpanded) {
    return (
      <motion.div
        layoutId={`node-${agent.id}`}
        className="absolute bg-[#1a1a24]/95 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
        style={{
          left: position.x - 200,
          top: position.y - 50,
          width: 400,
          height: 600,
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-purple-900/20 to-cyan-900/20">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              }}
            >
              {agent.status === 'completed' && <Check className="w-6 h-6" />}
              {agent.status === 'error' && <X className="w-6 h-6" />}
              {agent.status === 'running' && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {agent.status === 'waiting' && <div className="w-3 h-3 bg-white/40 rounded-full" />}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">{agent.label}</h3>
              <div className="flex items-center gap-2 text-xs text-white/60 mt-1">
                <span className="capitalize">{agent.status}</span>
                {duration && <span>• {duration}s</span>}
              </div>
            </div>
            <button
              onClick={onClick}
              className="w-8 h-8 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="p-6 overflow-y-auto h-[calc(100%-120px)] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <h4 className="text-sm font-semibold text-white/80 mb-4">Activity Timeline</h4>
          <div className="space-y-3">
            {(agent.activities || mockActivities[agent.name] || []).map((activity, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex gap-3"
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      activity.type === 'success'
                        ? 'bg-green-500'
                        : activity.type === 'error'
                        ? 'bg-red-500'
                        : 'bg-blue-500'
                    } ${idx === (agent.activities?.length || 0) - 1 ? 'animate-pulse' : ''}`}
                  />
                  {idx < (agent.activities?.length || mockActivities[agent.name]?.length || 0) - 1 && (
                    <div className="w-px h-full bg-white/10 flex-1 mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm text-white/90 leading-relaxed">{activity.message}</p>
                  {activity.details && (
                    <p className="text-xs text-white/50 mt-1">{activity.details}</p>
                  )}
                  {activity.subItems && (
                    <div className="mt-2 space-y-1 pl-3 border-l-2 border-white/10">
                      {activity.subItems.map((sub, subIdx) => (
                        <p key={subIdx} className="text-xs text-white/60">
                          {sub}
                        </p>
                      ))}
                    </div>
                  )}
                  <span className="text-xs text-white/40 mt-1 inline-block">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // Normal node view
  return (
    <motion.g
      layoutId={`node-${agent.id}`}
      onClick={onClick}
      style={{ cursor: (agent.status === 'running' || agent.status === 'completed') ? 'pointer' : 'default' }}
      whileHover={(agent.status === 'running' || agent.status === 'completed') ? { scale: 1.05 } : {}}
    >
      {/* Outer glow */}
      <motion.circle
        cx={position.x}
        cy={position.y}
        r={50}
        fill={colors.primary}
        opacity={0.2}
        filter="blur(20px)"
        animate={
          agent.status === 'running'
            ? {
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.3, 0.2],
              }
            : {}
        }
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Main circle - frosted glass effect */}
      <motion.circle
        cx={position.x}
        cy={position.y}
        r={40}
        fill="rgba(255, 255, 255, 0.1)"
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="1"
        filter="blur(0.5px)"
        style={{ backdropFilter: 'blur(20px)' }}
        animate={
          agent.status === 'waiting'
            ? {
                scale: [1, 1.05, 1],
              }
            : agent.status === 'completed'
            ? { scale: 1 }
            : {}
        }
        transition={
          agent.status === 'waiting'
            ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
            : {}
        }
      />

      {/* Rotating gradient border for running state */}
      {agent.status === 'running' && (
        <motion.circle
          cx={position.x}
          cy={position.y}
          r={40}
          fill="none"
          stroke="url(#gradient-border)"
          strokeWidth="3"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: `${position.x}px ${position.y}px` }}
        />
      )}

      {/* Filled circle for completed/error states */}
      {(agent.status === 'completed' || agent.status === 'error') && (
        <motion.circle
          cx={position.x}
          cy={position.y}
          r={40}
          fill={`url(#gradient-${agent.status})`}
          initial={{ scale: 1 }}
          animate={
            agent.status === 'completed'
              ? { scale: [1, 1.2, 1] }
              : agent.status === 'error'
              ? { x: [0, -3, 3, -3, 3, 0] }
              : {}
          }
          transition={
            agent.status === 'completed'
              ? { duration: 0.3, times: [0, 0.5, 1] }
              : agent.status === 'error'
              ? { duration: 0.3 }
              : {}
          }
        />
      )}

      {/* Icon */}
      <foreignObject
        x={position.x - 15}
        y={position.y - 15}
        width={30}
        height={30}
        style={{ pointerEvents: 'none' }}
      >
        <div className="w-full h-full flex items-center justify-center text-white">
          {agent.status === 'completed' && <Check className="w-6 h-6" />}
          {agent.status === 'error' && <X className="w-6 h-6" />}
          {agent.status === 'running' && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {agent.status === 'waiting' && <div className="w-2 h-2 bg-white/40 rounded-full" />}
        </div>
      </foreignObject>

      {/* Label */}
      <text
        x={position.x}
        y={position.y + 60}
        textAnchor="middle"
        className="text-sm font-medium pointer-events-none"
        fill={agent.status === 'running' ? colors.primary : 'rgba(255, 255, 255, 0.7)'}
        style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}
      >
        {agent.label}
      </text>

      {/* Duration */}
      {duration && (
        <text
          x={position.x}
          y={position.y + 76}
          textAnchor="middle"
          className="text-xs pointer-events-none"
          fill="rgba(255, 255, 255, 0.5)"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          {duration}s
        </text>
      )}

      {/* Particles for running state */}
      {agent.status === 'running' && (
        <foreignObject
          x={position.x - 40}
          y={position.y - 40}
          width={80}
          height={80}
          style={{ pointerEvents: 'none' }}
        >
          <div className="relative w-full h-full">
            {Array.from({ length: 20 }).map((_, i) => (
              <Particle
                key={i}
                delay={(i * 0.8) / 20}
                angle={(i * Math.PI * 2) / 20}
              />
            ))}
          </div>
        </foreignObject>
      )}

      {/* Confetti for completed state */}
      {agent.status === 'completed' && (
        <foreignObject
          x={position.x - 60}
          y={position.y - 60}
          width={120}
          height={120}
          style={{ pointerEvents: 'none' }}
        >
          <div className="relative w-full h-full">
            {Array.from({ length: 12 }).map((_, i) => (
              <Confetti
                key={i}
                delay={i * 0.05}
                angle={(i * Math.PI * 2) / 12}
                color={['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'][i % 4]}
              />
            ))}
          </div>
        </foreignObject>
      )}
    </motion.g>
  );
}

// Curved edge between nodes
function CurvedEdge({
  from,
  to,
  active,
  fromPos,
  toPos,
}: {
  from: string;
  to: string;
  active: boolean;
  fromPos: Position;
  toPos: Position;
}) {
  const midX = (fromPos.x + toPos.x) / 2;
  const midY = (fromPos.y + toPos.y) / 2 - 50;
  const path = `M ${fromPos.x} ${fromPos.y} Q ${midX} ${midY} ${toPos.x} ${toPos.y}`;

  return (
    <g>
      {/* Base path */}
      <path
        d={path}
        fill="none"
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth="2"
      />

      {/* Active gradient path */}
      {active && (
        <>
          <defs>
            <linearGradient id={`edge-gradient-${from}-${to}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <motion.path
            d={path}
            fill="none"
            stroke={`url(#edge-gradient-${from}-${to})`}
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
          {/* Animated dash */}
          <motion.path
            d={path}
            fill="none"
            stroke="rgba(255, 255, 255, 0.6)"
            strokeWidth="3"
            strokeDasharray="10 90"
            initial={{ strokeDashoffset: 100 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
        </>
      )}
    </g>
  );
}

// Global progress indicator
function GlobalProgress({ agents }: { agents: AgentNode[] }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const firstStart = Math.min(
      ...agents.filter((a) => a.startTime).map((a) => a.startTime!)
    );

    if (!firstStart || firstStart === Infinity) return;

    const interval = setInterval(() => {
      setElapsed(Date.now() - firstStart);
    }, 100);

    return () => clearInterval(interval);
  }, [agents]);

  const completed = agents.filter((a) => a.status === 'completed').length;
  const total = agents.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-6 right-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 min-w-[200px]"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-white/90">Progress</span>
        <span className="text-xs font-mono text-white/60">{(elapsed / 1000).toFixed(1)}s</span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl font-bold text-white">{completed}</span>
        <span className="text-sm text-white/60">/ {total} agents</span>
      </div>

      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
          initial={{ width: 0 }}
          animate={{ width: `${(completed / total) * 100}%` }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        />
      </div>
    </motion.div>
  );
}

// Calculate force-directed layout positions
function calculateForceDirectedPositions(agents: AgentNode[], width: number, height: number): Map<string, Position> {
  const positions = new Map<string, Position>();
  const phases = new Map<number, AgentNode[]>();

  // Group by phase
  agents.forEach((agent) => {
    if (!phases.has(agent.phase)) {
      phases.set(agent.phase, []);
    }
    phases.get(agent.phase)!.push(agent);
  });

  const padding = 100;
  const verticalSpacing = (height - padding * 2) / Math.max(phases.size - 1, 1);

  Array.from(phases.entries())
    .sort(([a], [b]) => a - b)
    .forEach(([_phaseNum, phaseAgents], phaseIdx) => {
      const y = padding + phaseIdx * verticalSpacing;
      const horizontalSpacing = (width - padding * 2) / Math.max(phaseAgents.length + 1, 1);

      phaseAgents.forEach((agent, idx) => {
        const x = padding + (idx + 1) * horizontalSpacing;
        positions.set(agent.id, { x, y });
      });
    });

  return positions;
}

// Mock activities for demo
const mockActivities: Record<string, ActivityLog[]> = {
  dayPlanner: [
    { type: 'info', message: 'Analyzing route waypoints...', timestamp: Date.now() - 5000 },
    { type: 'info', message: 'Calculating optimal daily breakdown...', timestamp: Date.now() - 4000, subItems: ['Considering driving distances', 'Balancing activity density'] },
    { type: 'success', message: 'Day structure created', timestamp: Date.now() - 3000, details: '5 days planned' },
  ],
  googleActivities: [
    { type: 'info', message: 'Searching for activities...', timestamp: Date.now() - 2500 },
    { type: 'info', message: 'Found 47 potential activities', timestamp: Date.now() - 2000 },
    { type: 'info', message: 'Ranking by relevance...', timestamp: Date.now() - 1500 },
    { type: 'success', message: 'Top activities selected', timestamp: Date.now() - 1000 },
  ],
};

// Main component
export function AgentOrchestrationVisualizer({ agents }: { agents: AgentNode[] }) {
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 700 });

  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById('agent-viz-container');
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const positions = useMemo(
    () => calculateForceDirectedPositions(agents, dimensions.width, dimensions.height),
    [agents, dimensions]
  );

  const completed = agents.filter((a) => a.status === 'completed').length;
  const total = agents.length;

  return (
    <div
      id="agent-viz-container"
      className="relative w-full min-h-[700px] rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a24 50%, #0a0a0f 100%)',
      }}
      onClick={() => expandedNode && setExpandedNode(null)}
    >
      {/* Grain texture */}
      <GrainTexture />

      {/* Animated gradient mesh */}
      <GradientMesh />

      {/* SVG Canvas */}
      <svg className="w-full h-full relative z-10" style={{ minHeight: 700 }}>
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="gradient-border" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="gradient-completed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="gradient-error" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>

        {/* Render edges */}
        <AnimatePresence>
          {agents.flatMap((agent) =>
            agent.dependencies
              .filter((dep) => positions.has(dep) && positions.has(agent.id))
              .map((dep) => (
                <CurvedEdge
                  key={`${dep}-${agent.id}`}
                  from={dep}
                  to={agent.id}
                  active={agent.status === 'running' || agent.status === 'completed'}
                  fromPos={positions.get(dep)!}
                  toPos={positions.get(agent.id)!}
                />
              ))
          )}
        </AnimatePresence>

        {/* Render nodes */}
        <AnimatePresence>
          {agents.map((agent) => {
            const position = positions.get(agent.id);
            if (!position) return null;

            return (
              <AgentNodeComponent
                key={agent.id}
                agent={agent}
                position={position}
                onClick={() => {
                  if (agent.status === 'running' || agent.status === 'completed') {
                    setExpandedNode(expandedNode === agent.id ? null : agent.id);
                  }
                }}
                isExpanded={false}
              />
            );
          })}
        </AnimatePresence>
      </svg>

      {/* Expanded node panel */}
      <AnimatePresence>
        {expandedNode && (
          <AgentNodeComponent
            agent={agents.find((a) => a.id === expandedNode)!}
            position={positions.get(expandedNode)!}
            onClick={() => setExpandedNode(null)}
            isExpanded={true}
          />
        )}
      </AnimatePresence>

      {/* Global progress indicator */}
      <GlobalProgress agents={agents} />
    </div>
  );
}
