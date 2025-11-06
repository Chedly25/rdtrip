/**
 * Agent Orchestration Visualizer V5
 * Complete Redesign: Full-screen, white background, dynamic animations, mock images
 */

import { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform, } from 'framer-motion';
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
  Clock,
  Zap,
  TrendingUp
} from 'lucide-react';
import type { AgentNode } from './AgentOrchestrationVisualizer';
import type { PartialItinerary } from './ProgressiveItineraryPreview';

interface Props {
  agents: AgentNode[];
  partialResults: PartialItinerary;
}

interface MockImage {
  id: string;
  url: string;
  type: 'restaurant' | 'hotel' | 'landmark' | 'activity';
  label: string;
}

// Mock images from Unsplash for progressive reveal
const MOCK_IMAGES: MockImage[] = [
  // Restaurants
  { id: '1', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop', type: 'restaurant', label: 'Fine Dining' },
  { id: '2', url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop', type: 'restaurant', label: 'Bistro' },
  { id: '3', url: 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=400&h=400&fit=crop', type: 'restaurant', label: 'Café' },
  { id: '4', url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=400&fit=crop', type: 'restaurant', label: 'Terrace' },

  // Hotels
  { id: '5', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=400&fit=crop', type: 'hotel', label: 'Luxury Hotel' },
  { id: '6', url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=400&fit=crop', type: 'hotel', label: 'Boutique Stay' },
  { id: '7', url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=400&fit=crop', type: 'hotel', label: 'Resort' },
  { id: '8', url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=400&fit=crop', type: 'hotel', label: 'City Hotel' },

  // Landmarks
  { id: '9', url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&h=400&fit=crop', type: 'landmark', label: 'Eiffel Tower' },
  { id: '10', url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=400&fit=crop', type: 'landmark', label: 'Arc de Triomphe' },
  { id: '11', url: 'https://images.unsplash.com/photo-1471623320832-752e8bbf8413?w=400&h=400&fit=crop', type: 'landmark', label: 'Notre Dame' },
  { id: '12', url: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400&h=400&fit=crop', type: 'landmark', label: 'Monument' },

  // Activities
  { id: '13', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop', type: 'activity', label: 'Mountain' },
  { id: '14', url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=400&fit=crop', type: 'activity', label: 'Beach' },
  { id: '15', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', type: 'activity', label: 'Museum' },
  { id: '16', url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=400&fit=crop', type: 'activity', label: 'Park' },

  // More variety
  { id: '17', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=400&fit=crop', type: 'restaurant', label: 'Modern Cuisine' },
  { id: '18', url: 'https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=400&h=400&fit=crop', type: 'hotel', label: 'Cozy Room' },
  { id: '19', url: 'https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?w=400&h=400&fit=crop', type: 'landmark', label: 'Bridge' },
  { id: '20', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=400&fit=crop', type: 'activity', label: 'Nature' },
  { id: '21', url: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=400&h=400&fit=crop', type: 'restaurant', label: 'Street Food' },
  { id: '22', url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=400&fit=crop', type: 'hotel', label: 'Pool View' },
  { id: '23', url: 'https://images.unsplash.com/photo-1460472178825-e5240623afd5?w=400&h=400&fit=crop', type: 'landmark', label: 'Tower' },
  { id: '24', url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=400&fit=crop', type: 'activity', label: 'Sunset' },
];

// Animated number with spring physics
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

// Agent configuration
const AGENT_CONFIG = {
  dayPlanner: { icon: Calendar, color: '#8b5cf6', label: 'Route Planning' },
  googleActivities: { icon: Sparkles, color: '#3b82f6', label: 'Activities' },
  activities: { icon: Sparkles, color: '#3b82f6', label: 'Activities' },
  googleRestaurants: { icon: UtensilsCrossed, color: '#f97316', label: 'Restaurants' },
  restaurants: { icon: UtensilsCrossed, color: '#f97316', label: 'Restaurants' },
  googleAccommodations: { icon: Hotel, color: '#ef4444', label: 'Hotels' },
  accommodations: { icon: Hotel, color: '#ef4444', label: 'Hotels' },
  scenicStops: { icon: Palmtree, color: '#10b981', label: 'Scenic Stops' },
  weather: { icon: Cloud, color: '#06b6d4', label: 'Weather' },
  events: { icon: PartyPopper, color: '#ec4899', label: 'Events' },
  practicalInfo: { icon: Info, color: '#14b8a6', label: 'Tips' },
  budget: { icon: DollarSign, color: '#f59e0b', label: 'Budget' }
};

// Agent card with micro-animations
function AgentCard({ agent, index }: { agent: AgentNode; index: number }) {
  const config = AGENT_CONFIG[agent.name as keyof typeof AGENT_CONFIG] || AGENT_CONFIG.activities;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 100, damping: 20 }}
      className="relative flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200 shadow-sm"
    >
      {/* Connecting line to next agent */}
      {index < 8 && (
        <div className="absolute left-1/2 top-full w-0.5 h-3 bg-gray-200" />
      )}

      {/* Animated icon */}
      <motion.div
        className="relative flex items-center justify-center w-10 h-10 rounded-full"
        style={{ backgroundColor: `${config.color}15` }}
        animate={agent.status === 'running' ? {
          scale: [1, 1.1, 1],
          rotate: agent.name.includes('Planner') ? [0, 0, 0] : [0, 360]
        } : {}}
        transition={agent.status === 'running' ? {
          duration: agent.name.includes('Planner') ? 2 : 3,
          repeat: Infinity,
          ease: 'linear'
        } : {}}
      >
        <Icon className="w-5 h-5" style={{ color: config.color }} />

        {/* Pulse ring for running */}
        {agent.status === 'running' && (
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: config.color }}
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.div>

      {/* Agent info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900">{config.label}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {agent.status === 'completed' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              <Check className="w-3.5 h-3.5 text-green-600" />
            </motion.div>
          )}
          {agent.status === 'running' && (
            <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
          )}
          {agent.status === 'waiting' && (
            <Clock className="w-3.5 h-3.5 text-gray-400" />
          )}
          <span className={`text-xs ${
            agent.status === 'completed' ? 'text-green-600 font-medium' :
            agent.status === 'running' ? 'text-blue-600 font-medium' :
            'text-gray-500'
          }`}>
            {agent.status === 'completed' ? 'Complete' :
             agent.status === 'running' ? 'Working...' :
             'Waiting'}
          </span>
        </div>
      </div>

      {/* Progress bar for running agents */}
      {agent.status === 'running' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100">
          <motion.div
            className="h-full"
            style={{ backgroundColor: config.color }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      )}
    </motion.div>
  );
}

// Progressive image grid with mock images
function ImageGrid({ partialResults: _partialResults }: { partialResults: PartialItinerary }) {
  const [revealedCount, setRevealedCount] = useState(0);

  // Reveal one image every 1.5 seconds
  useEffect(() => {
    if (revealedCount < MOCK_IMAGES.length) {
      const timer = setTimeout(() => {
        setRevealedCount(prev => Math.min(prev + 1, MOCK_IMAGES.length));
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [revealedCount]);

  const imagesToShow = MOCK_IMAGES.slice(0, Math.min(revealedCount, 12));

  return (
    <div className="grid grid-cols-4 gap-3 p-6">
      {imagesToShow.map((image) => (
        <motion.div
          key={image.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 shadow-sm hover:shadow-md transition-shadow"
        >
          {/* Skeleton loader first */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"
            animate={{ x: ['0%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />

          {/* Image loads on top */}
          <motion.img
            src={image.url}
            alt={image.label}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            loading="lazy"
          />

          {/* Label overlay */}
          <motion.div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-white text-xs font-medium">{image.label}</div>
          </motion.div>
        </motion.div>
      ))}

      {/* Empty slots with skeleton */}
      {Array.from({ length: Math.max(0, 12 - imagesToShow.length) }).map((_, i) => (
        <div
          key={`skeleton-${i}`}
          className="aspect-square rounded-lg bg-gray-100 relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-50 to-gray-200"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      ))}
    </div>
  );
}

// Main component
export function AgentOrchestrationVisualizerV5({ agents, partialResults }: Props) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const completedCount = agents.filter(a => a.status === 'completed').length;
  const totalCount = agents.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Calculate stats
  const mockPlacesCount = Math.min(Math.floor(elapsedTime * 1.5), 45);
  const mockPhotosCount = Math.min(Math.floor(elapsedTime * 2.5), 120);

  return (
    <div className="fixed inset-0 bg-white overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-6 h-6 text-blue-600" />
              </motion.div>
              Your Trip is Being Crafted
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              AI agents are working in parallel to create your perfect itinerary
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                <AnimatedNumber value={elapsedTime} />s
              </div>
              <div className="text-xs text-gray-500">Elapsed</div>
            </div>

            <div className="relative w-20 h-20">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="36" stroke="#e5e7eb" strokeWidth="6" fill="none" />
                <motion.circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="#3b82f6"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: '0 226' }}
                  animate={{ strokeDasharray: `${(progressPercent / 100) * 226} 226` }}
                  transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-lg font-bold text-gray-900">
                  <AnimatedNumber value={completedCount} />
                </div>
                <div className="text-[10px] text-gray-500">/ {totalCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Left sidebar - Agents */}
        <div className="w-80 border-r border-gray-200 bg-gray-50 overflow-y-auto">
          <div className="p-6 space-y-2">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-gray-600" />
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Agent Progress
              </h2>
            </div>
            {agents.map((agent, index) => (
              <AgentCard key={agent.id} agent={agent} index={index} />
            ))}
          </div>
        </div>

        {/* Center - Image grid */}
        <div className="flex-1 bg-white overflow-y-auto">
          <ImageGrid partialResults={partialResults} />
        </div>

        {/* Right sidebar - Statistics */}
        <div className="w-80 border-l border-gray-200 bg-gray-50 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Discovered stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Discovered So Far
              </h3>

              <div className="space-y-4">
                <motion.div>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-sm text-gray-600">Places</span>
                    <motion.span
                      className="text-3xl font-bold text-blue-600"
                      key={mockPlacesCount}
                      initial={{ scale: 1.3 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      <AnimatedNumber value={mockPlacesCount} />
                    </motion.span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-blue-600 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${Math.min((mockPlacesCount / 45) * 100, 100)}%` }}
                      transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                    />
                  </div>
                </motion.div>

                <motion.div>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-sm text-gray-600">Photos</span>
                    <motion.span
                      className="text-3xl font-bold text-purple-600"
                      key={mockPhotosCount}
                      initial={{ scale: 1.3 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      <AnimatedNumber value={mockPhotosCount} />
                    </motion.span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-purple-600 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${Math.min((mockPhotosCount / 120) * 100, 100)}%` }}
                      transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                    />
                  </div>
                </motion.div>

                <div className="pt-2 border-t border-gray-100 text-xs text-gray-500">
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  Updated in real-time as agents discover content
                </div>
              </div>
            </div>

            {/* Quick facts */}
            <div className="space-y-3">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-1">
                  <UtensilsCrossed className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-900">Restaurants</span>
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  <AnimatedNumber value={Math.floor(mockPlacesCount * 0.3)} />
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                <div className="flex items-center gap-2 mb-1">
                  <Hotel className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-medium text-red-900">Hotels</span>
                </div>
                <div className="text-2xl font-bold text-red-700">
                  <AnimatedNumber value={Math.floor(mockPlacesCount * 0.15)} />
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-900">Activities</span>
                </div>
                <div className="text-2xl font-bold text-green-700">
                  <AnimatedNumber value={Math.floor(mockPlacesCount * 0.4)} />
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                <div className="flex items-center gap-2 mb-1">
                  <Palmtree className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-medium text-purple-900">Scenic Stops</span>
                </div>
                <div className="text-2xl font-bold text-purple-700">
                  <AnimatedNumber value={Math.floor(mockPlacesCount * 0.15)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
