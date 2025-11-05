import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

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
}

interface Position {
  x: number;
  y: number;
}

// Animated grid background
function AnimatedGrid() {
  return (
    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-slate-300"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      {/* Animated gradient overlay */}
      <motion.circle
        cx="50%"
        cy="50%"
        r="30%"
        fill="url(#radialGradient)"
        initial={{ scale: 0.8, opacity: 0.3 }}
        animate={{ scale: 1.2, opacity: 0.1 }}
        transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
      />
      <defs>
        <radialGradient id="radialGradient">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// Animated connection line between agents
function AnimatedConnection({
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
  const pathD = `M ${fromPos.x} ${fromPos.y} Q ${(fromPos.x + toPos.x) / 2} ${fromPos.y - 30} ${toPos.x} ${toPos.y}`;

  return (
    <g>
      {/* Background line */}
      <path
        d={pathD}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="2"
        strokeDasharray="5,5"
      />

      {/* Animated active line */}
      {active && (
        <motion.path
          d={pathD}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      )}

      {/* Animated particle when active */}
      {active && (
        <motion.circle
          r="4"
          fill="#3b82f6"
          initial={{ offsetDistance: '0%', opacity: 0 }}
          animate={{ offsetDistance: '100%', opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{ offsetPath: `path("${pathD}")` } as any}
        />
      )}
    </g>
  );
}

// Individual agent node
function AgentNodeComponent({
  agent,
  position,
}: {
  agent: AgentNode;
  position: Position;
}) {
  const statusColors = {
    waiting: 'bg-gray-200 border-gray-300 text-gray-600',
    running: 'bg-blue-100 border-blue-400 text-blue-700',
    completed: 'bg-green-100 border-green-400 text-green-700',
    error: 'bg-red-100 border-red-400 text-red-700',
  };

  const statusIcons = {
    waiting: '⏳',
    running: '⚡',
    completed: '✓',
    error: '✗',
  };

  const duration = agent.endTime && agent.startTime
    ? ((agent.endTime - agent.startTime) / 1000).toFixed(1)
    : agent.startTime
    ? ((Date.now() - agent.startTime) / 1000).toFixed(1)
    : null;

  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      {/* Node circle */}
      <motion.circle
        cx={position.x}
        cy={position.y}
        r={agent.status === 'running' ? 35 : 30}
        className={`${statusColors[agent.status]} transition-all duration-300`}
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="3"
        animate={
          agent.status === 'running'
            ? {
                scale: [1, 1.05, 1],
                transition: { duration: 1.5, repeat: Infinity },
              }
            : {}
        }
      />

      {/* Progress ring for running agents */}
      {agent.status === 'running' && (
        <motion.circle
          cx={position.x}
          cy={position.y}
          r={40}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeDasharray={`${2 * Math.PI * 40}`}
          initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
          animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - agent.progress / 100) }}
          transition={{ duration: 0.5 }}
          style={{ transform: 'rotate(-90deg)', transformOrigin: `${position.x}px ${position.y}px` }}
        />
      )}

      {/* Icon */}
      <text
        x={position.x}
        y={position.y + 5}
        textAnchor="middle"
        fontSize="20"
      >
        {statusIcons[agent.status]}
      </text>

      {/* Label */}
      <foreignObject
        x={position.x - 60}
        y={position.y + 50}
        width="120"
        height="60"
      >
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-900 truncate px-2">
            {agent.label}
          </p>
          {duration && (
            <p className="text-xs text-gray-500 mt-1">
              {duration}s
            </p>
          )}
        </div>
      </foreignObject>
    </motion.g>
  );
}

// Stats panel
function StatsPanel({ agents }: { agents: AgentNode[] }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const firstStart = Math.min(
      ...agents.filter(a => a.startTime).map(a => a.startTime!)
    );

    if (!firstStart || firstStart === Infinity) return;

    const interval = setInterval(() => {
      setElapsed(Date.now() - firstStart);
    }, 100);

    return () => clearInterval(interval);
  }, [agents]);

  const completed = agents.filter(a => a.status === 'completed').length;
  const running = agents.filter(a => a.status === 'running').length;
  const waiting = agents.filter(a => a.status === 'waiting').length;
  const total = agents.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 min-w-[250px]"
    >
      <h4 className="text-sm font-bold text-gray-900 mb-3">Generation Progress</h4>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>{completed} / {total} agents</span>
          <span>{Math.round((completed / total) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${(completed / total) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Completed
          </span>
          <span className="font-semibold text-gray-900">{completed}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            Running
          </span>
          <span className="font-semibold text-gray-900">{running}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 flex items-center gap-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
            Waiting
          </span>
          <span className="font-semibold text-gray-900">{waiting}</span>
        </div>
      </div>

      {/* Elapsed time */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Elapsed Time</span>
          <span className="font-mono font-semibold text-gray-900">
            {(elapsed / 1000).toFixed(1)}s
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// Calculate positions for agent nodes in a flow layout
function calculatePositions(agents: AgentNode[]): Map<string, Position> {
  const positions = new Map<string, Position>();
  const phases = new Map<number, AgentNode[]>();

  // Group by phase
  agents.forEach(agent => {
    if (!phases.has(agent.phase)) {
      phases.set(agent.phase, []);
    }
    phases.get(agent.phase)!.push(agent);
  });

  const padding = 80;
  const nodeSpacing = 150;
  const phaseSpacing = 200;

  let currentY = padding;

  Array.from(phases.entries())
    .sort(([a], [b]) => a - b)
    .forEach(([, phaseAgents]) => {
      const totalWidth = (phaseAgents.length - 1) * nodeSpacing;
      const startX = (800 - totalWidth) / 2; // Center horizontally (assuming 800px width)

      phaseAgents.forEach((agent, idx) => {
        positions.set(agent.id, {
          x: startX + idx * nodeSpacing,
          y: currentY,
        });
      });

      currentY += phaseSpacing;
    });

  return positions;
}

// Main visualizer component
export function AgentOrchestrationVisualizer({ agents }: { agents: AgentNode[] }) {
  const positions = calculatePositions(agents);

  return (
    <div className="relative w-full h-[600px] bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl overflow-hidden shadow-xl">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20">
        <AnimatedGrid />
      </div>

      {/* SVG Canvas */}
      <svg className="w-full h-full relative z-10">
        {/* Render dependency arrows */}
        <AnimatePresence>
          {agents.flatMap(agent =>
            agent.dependencies
              .filter(dep => positions.has(dep) && positions.has(agent.id))
              .map(dep => (
                <AnimatedConnection
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

        {/* Render agent nodes */}
        <AnimatePresence>
          {agents.map(agent => {
            const position = positions.get(agent.id);
            if (!position) return null;

            return (
              <AgentNodeComponent
                key={agent.id}
                agent={agent}
                position={position}
              />
            );
          })}
        </AnimatePresence>
      </svg>

      {/* Stats panel */}
      <StatsPanel agents={agents} />
    </div>
  );
}
