/**
 * Agent Orchestration Visualizer V3
 * Premium, Linear/Vercel-quality loading screen
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import type { AgentNode } from './AgentOrchestrationVisualizer';

interface Props {
  agents: AgentNode[];
}

// Spring configuration
const springConfig = { damping: 18, stiffness: 150, mass: 0.5 };

// Animated gradient mesh background
function AnimatedBackground() {
  return (
    <div className="absolute inset-0" style={{
      background: 'radial-gradient(circle at center, #0a0a0f 0%, #1a1a2e 100%)'
    }}>
      {/* Animated color mesh */}
      <div className="absolute inset-0 opacity-15">
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
            filter: 'blur(200px)',
            left: '20%',
            top: '30%'
          }}
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0]
          }}
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
          animate={{
            x: [0, -80, 0],
            y: [0, 100, 0]
          }}
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
          animate={{
            x: [0, 60, 0],
            y: [0, -70, 0]
          }}
          transition={{ duration: 55, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Grain texture overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </div>
  );
}

// Progress card (top-right)
function ProgressCard({ completed, total, elapsedTime }: { completed: number; total: number; elapsedTime: number }) {
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-6 right-6 z-50"
      style={{
        width: '240px',
        height: '100px',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        padding: '20px'
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="uppercase text-xs tracking-wider opacity-60">Progress</div>
        <div className="text-sm font-mono opacity-80">{elapsedTime}s</div>
      </div>

      <div className="flex items-baseline gap-1 mb-3">
        <div className="text-5xl font-bold text-white">{completed}</div>
        <div className="text-sm opacity-60">/ {total} agents</div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
            width: `${progress}%`
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </motion.div>
  );
}

// Particle for animations
interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

// Canvas-based particle system
function ParticleCanvas({ particles }: { particles: Particle[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        const alpha = particle.life / particle.maxLife;
        ctx.fillStyle = particle.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    animate();
  }, [particles]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      width={1920}
      height={1080}
    />
  );
}

// Glass morphism node with multi-layer visual stack
function GlassNode({
  agent,
  position,
  onClick
}: {
  agent: AgentNode;
  position: { x: number; y: number };
  onClick: () => void;
}) {
  const [particles, setParticles] = useState<Particle[]>([]);

  // Emit particles for running state
  useEffect(() => {
    if (agent.status !== 'running') return;

    const interval = setInterval(() => {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 0.5 + Math.random() * 0.5;

      setParticles(prev => [
        ...prev.slice(-20), // Keep last 20
        {
          id: Math.random().toString(),
          x: position.x,
          y: position.y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          life: 800,
          maxLife: 800,
          color: '#8b5cf6',
          size: 2
        }
      ]);
    }, 100);

    return () => clearInterval(interval);
  }, [agent.status, position]);

  // Confetti burst for completed state
  useEffect(() => {
    if (agent.status === 'completed') {
      const colors = ['#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b'];
      const newParticles: Particle[] = [];

      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * 2 * i) / 10;
        const velocity = 2 + Math.random();

        newParticles.push({
          id: Math.random().toString(),
          x: position.x,
          y: position.y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity - 1,
          life: 1500,
          maxLife: 1500,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 3
        });
      }

      setParticles(prev => [...prev, ...newParticles]);
    }
  }, [agent.status, position]);

  // Update particle positions
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.05, // Gravity for confetti
            life: p.life - 16
          }))
          .filter(p => p.life > 0)
      );
    }, 16);

    return () => clearInterval(interval);
  }, []);

  const getGlowColor = () => {
    switch (agent.status) {
      case 'waiting': return 'rgba(139,92,246,0.3)';
      case 'running': return 'rgba(139,92,246,0.6)';
      case 'completed': return 'rgba(16,185,129,0.5)';
      case 'error': return 'rgba(239,68,68,0.5)';
      default: return 'rgba(139,92,246,0.3)';
    }
  };

  const getAnimationProps = () => {
    switch (agent.status) {
      case 'waiting':
        return {
          animate: { scale: [1, 1.08, 1] },
          transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
        };
      case 'completed':
        return {
          animate: { scale: [1, 1.25, 1.05, 1] },
          transition: {
            duration: 0.5,
            times: [0, 0.2, 0.5, 1],
            type: 'spring',
            ...springConfig
          }
        };
      case 'error':
        return {
          animate: { x: [-5, 5, -5, 5, 0] },
          transition: { duration: 0.4 }
        };
      default:
        return {
          animate: { scale: 1 }
        };
    }
  };

  return (
    <>
      <ParticleCanvas particles={particles} />

      <motion.g
        style={{ cursor: agent.status === 'running' || agent.status === 'completed' ? 'pointer' : 'default' }}
        onClick={() => {
          if (agent.status === 'running' || agent.status === 'completed') {
            onClick();
          }
        }}
        {...getAnimationProps()}
      >
        {/* Outer glow */}
        <circle
          cx={position.x}
          cy={position.y}
          r={42}
          fill="none"
          style={{
            filter: `drop-shadow(0 0 30px ${getGlowColor()})`
          }}
        />

        {/* Border ring */}
        {agent.status === 'running' && (
          <motion.circle
            cx={position.x}
            cy={position.y}
            r={40}
            fill="none"
            stroke="url(#rotatingGradient)"
            strokeWidth="2"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: `${position.x}px ${position.y}px` }}
          />
        )}

        {agent.status !== 'running' && (
          <circle
            cx={position.x}
            cy={position.y}
            r={40}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
          />
        )}

        {/* Glass fill */}
        <circle
          cx={position.x}
          cy={position.y}
          r={40}
          fill={
            agent.status === 'completed'
              ? 'url(#completedGradient)'
              : agent.status === 'error'
              ? 'url(#errorGradient)'
              : 'rgba(255,255,255,0.08)'
          }
          style={{
            backdropFilter: 'blur(24px)'
          }}
        />

        {/* Inner dot */}
        {(agent.status === 'waiting' || agent.status === 'running') && (
          <motion.circle
            cx={position.x}
            cy={position.y}
            r={6}
            fill="url(#accentGradient)"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.8))'
            }}
            animate={
              agent.status === 'running'
                ? { opacity: [0.5, 1, 0.5] }
                : {}
            }
            transition={
              agent.status === 'running'
                ? { duration: 1.2, repeat: Infinity }
                : {}
            }
          />
        )}

        {/* Status icon */}
        {agent.status === 'completed' && (
          <g>
            <motion.path
              d={`M ${position.x - 10} ${position.y} L ${position.x - 2} ${position.y + 8} L ${position.x + 10} ${position.y - 8}`}
              stroke="white"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </g>
        )}

        {agent.status === 'error' && (
          <g>
            <line
              x1={position.x - 8}
              y1={position.y - 8}
              x2={position.x + 8}
              y2={position.y + 8}
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line
              x1={position.x + 8}
              y1={position.y - 8}
              x2={position.x - 8}
              y2={position.y + 8}
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Label */}
        <text
          x={position.x}
          y={position.y + 60}
          textAnchor="middle"
          fill="rgba(255,255,255,0.7)"
          fontSize="14"
          fontWeight="500"
          letterSpacing="0.3"
          style={{
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          }}
        >
          {agent.label}
        </text>
      </motion.g>
    </>
  );
}

// Curved edge with Bezier path
function CurvedEdge({
  from,
  to,
  active,
  fromPos,
  toPos
}: {
  from: string;
  to: string;
  active: boolean;
  fromPos: { x: number; y: number };
  toPos: { x: number; y: number };
}) {
  // Calculate control points for smooth curve
  const midX = (fromPos.x + toPos.x) / 2;
  const midY = (fromPos.y + toPos.y) / 2;
  const controlY = midY - 80; // Curve upward

  const path = `M ${fromPos.x} ${fromPos.y} Q ${midX} ${controlY} ${toPos.x} ${toPos.y}`;

  return (
    <g>
      {/* Base path */}
      <path
        d={path}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="2"
        fill="none"
      />

      {/* Active animated path */}
      {active && (
        <>
          <motion.path
            d={path}
            stroke="url(#edgeGradient)"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0, opacity: 0.3 }}
            animate={{ pathLength: 1, opacity: 0.8 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          />

          {/* Traveling dot */}
          <motion.circle
            r="4"
            fill="#8b5cf6"
            style={{ filter: 'drop-shadow(0 0 6px #8b5cf6)' }}
            initial={{ offsetDistance: '0%', opacity: 0 }}
            animate={{ offsetDistance: '100%', opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <animateMotion dur="2s" repeatCount="indefinite">
              <mpath href={`#path-${from}-${to}`} />
            </animateMotion>
          </motion.circle>

          <path id={`path-${from}-${to}`} d={path} fill="none" style={{ display: 'none' }} />
        </>
      )}
    </g>
  );
}

// Expansion panel
function ExpansionPanel({
  agent,
  onClose,
  position
}: {
  agent: AgentNode;
  onClose: () => void;
  position: { x: number; y: number };
}) {
  const activities = (agent as any).activities || [];

  return (
    <motion.div
      layoutId={`node-${agent.id}`}
      className="fixed z-50"
      initial={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        x: position.x - 40,
        y: position.y - 40
      }}
      animate={{
        width: 420,
        height: 640,
        borderRadius: 24,
        x: window.innerWidth / 2 - 210,
        y: window.innerHeight / 2 - 320
      }}
      exit={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        x: position.x - 40,
        y: position.y - 40
      }}
      transition={{ type: 'spring', damping: 0.7, stiffness: 120, duration: 0.5 }}
      style={{
        background: 'rgba(20,20,30,0.95)',
        backdropFilter: 'blur(40px)',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)'
      }}
    >
      {/* Header */}
      <div className="h-[120px] p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-[60px] h-[60px] rounded-full flex items-center justify-center"
            style={{
              background: agent.status === 'completed'
                ? 'linear-gradient(135deg, #8b5cf6, #06b6d4)'
                : 'rgba(139,92,246,0.2)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            {agent.status === 'completed' ? (
              <Check className="w-6 h-6 text-white" />
            ) : agent.status === 'error' ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-1">{agent.label}</h3>
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-1 text-xs rounded-full"
                style={{
                  background: agent.status === 'completed'
                    ? 'linear-gradient(90deg, #10b981, #059669)'
                    : agent.status === 'running'
                    ? 'linear-gradient(90deg, #8b5cf6, #7c3aed)'
                    : 'rgba(107,114,128,0.3)',
                  color: 'white'
                }}
              >
                {agent.status}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Activity feed */}
      <div className="h-[calc(640px-120px)] overflow-y-auto p-6">
        <div className="relative">
          {/* Timeline line */}
          <div
            className="absolute left-6 top-0 bottom-0 w-0.5"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          />

          {/* Activities */}
          <div className="space-y-6">
            {activities.length === 0 ? (
              <div className="text-white/60 text-sm">No activities yet...</div>
            ) : (
              activities.map((activity: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.3 }}
                  className="relative pl-12"
                >
                  {/* Timeline node */}
                  <div
                    className="absolute left-[18px] w-2 h-2 rounded-full"
                    style={{
                      background: activity.status === 'completed'
                        ? '#10b981'
                        : activity.status === 'error'
                        ? '#ef4444'
                        : '#8b5cf6'
                    }}
                  />

                  <div className="text-white/90 text-sm leading-relaxed">
                    {activity.description}
                  </div>

                  {activity.timestamp && (
                    <div className="text-white/40 text-xs mt-1 font-mono">
                      {activity.timestamp}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function AgentOrchestrationVisualizerV3({ agents }: Props) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Track elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate force-directed layout positions
  const positions = useMemo(() => {
    const width = 1200;
    const height = 700;
    const centerX = width / 2;
    const centerY = height / 2;

    // Simple phase-based circular layout
    const phaseGroups: { [key: number]: AgentNode[] } = {};
    agents.forEach(agent => {
      if (!phaseGroups[agent.phase]) {
        phaseGroups[agent.phase] = [];
      }
      phaseGroups[agent.phase].push(agent);
    });

    const pos: { [id: string]: { x: number; y: number } } = {};
    const phases = Object.keys(phaseGroups).map(Number).sort();

    phases.forEach((phase, phaseIndex) => {
      const nodesInPhase = phaseGroups[phase];
      const radius = 150 + phaseIndex * 120;
      const angleStep = (Math.PI * 2) / nodesInPhase.length;

      nodesInPhase.forEach((node, nodeIndex) => {
        const angle = angleStep * nodeIndex;
        pos[node.id] = {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius
        };
      });
    });

    return pos;
  }, [agents]);

  const completed = agents.filter(a => a.status === 'completed').length;
  const total = agents.length;

  return (
    <div className="relative w-full min-h-[700px] rounded-3xl overflow-hidden">
      <AnimatedBackground />

      <ProgressCard completed={completed} total={total} elapsedTime={elapsedTime} />

      <svg
        width="1200"
        height="700"
        className="relative mx-auto"
        style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          <linearGradient id="completedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          <linearGradient id="errorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>

          <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          <linearGradient id="rotatingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>

        {/* Render edges */}
        {agents.map(agent =>
          agent.dependencies?.map(depId => {
            const dep = agents.find(a => a.id === depId);
            if (!dep || !positions[agent.id] || !positions[depId]) return null;

            return (
              <CurvedEdge
                key={`${depId}-${agent.id}`}
                from={depId}
                to={agent.id}
                active={dep.status === 'completed' && agent.status === 'running'}
                fromPos={positions[depId]}
                toPos={positions[agent.id]}
              />
            );
          })
        )}

        {/* Render nodes */}
        {agents.map(agent => {
          if (!positions[agent.id]) return null;

          return (
            <GlassNode
              key={agent.id}
              agent={agent}
              position={positions[agent.id]}
              onClick={() => setExpandedAgent(agent.id)}
              isExpanded={expandedAgent === agent.id}
            />
          );
        })}
      </svg>

      {/* Expansion panel */}
      <AnimatePresence>
        {expandedAgent && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setExpandedAgent(null)}
            />

            <ExpansionPanel
              agent={agents.find(a => a.id === expandedAgent)!}
              onClose={() => setExpandedAgent(null)}
              position={positions[expandedAgent]}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
