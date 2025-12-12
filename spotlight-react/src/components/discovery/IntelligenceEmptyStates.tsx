/**
 * IntelligenceEmptyStates
 *
 * Beautiful, contextual empty states for City Intelligence components.
 * Each state provides helpful guidance and encourages user action.
 *
 * Design Philosophy:
 * - Warm, inviting illustrations
 * - Clear calls-to-action
 * - Contextual messaging
 * - Subtle animations
 */

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

// =============================================================================
// Base Empty State Component
// =============================================================================

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'compact' | 'card' | 'full';
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  variant = 'default',
  className = '',
}: EmptyStateProps) {
  const variants = {
    default: 'py-12 px-6',
    compact: 'py-6 px-4',
    card: 'py-8 px-6 bg-gradient-to-br from-gray-50 to-amber-50/30 rounded-2xl border border-amber-100',
    full: 'py-16 px-8',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`text-center ${variants[variant]} ${className}`}
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="inline-flex items-center justify-center mb-4"
      >
        {icon}
      </motion.div>

      {/* Content */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-semibold text-gray-900 mb-2"
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-600 text-sm max-w-xs mx-auto mb-6"
      >
        {description}
      </motion.p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-3"
        >
          {action && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={action.onClick}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-md shadow-amber-200"
            >
              {action.label}
            </motion.button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-5 py-2.5 text-amber-700 font-medium hover:text-amber-800 transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// =============================================================================
// Illustrated Icons
// =============================================================================

function MapExploreIcon() {
  return (
    <div className="relative w-20 h-20">
      {/* Base map */}
      <svg className="w-full h-full" viewBox="0 0 80 80" fill="none">
        <rect x="10" y="15" width="60" height="50" rx="4" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
        <path d="M10 30 L70 30" stroke="#FDE68A" strokeWidth="2" strokeDasharray="4 4" />
        <path d="M10 45 L70 45" stroke="#FDE68A" strokeWidth="2" strokeDasharray="4 4" />
        <path d="M30 15 L30 65" stroke="#FDE68A" strokeWidth="2" strokeDasharray="4 4" />
        <path d="M50 15 L50 65" stroke="#FDE68A" strokeWidth="2" strokeDasharray="4 4" />
      </svg>
      {/* Animated pin */}
      <motion.div
        className="absolute top-3 right-4"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="20" height="26" viewBox="0 0 20 26" fill="none">
          <path d="M10 0C4.5 0 0 4.5 0 10C0 17.5 10 26 10 26S20 17.5 20 10C20 4.5 15.5 0 10 0Z" fill="#F97316" />
          <circle cx="10" cy="10" r="4" fill="white" />
        </svg>
      </motion.div>
    </div>
  );
}

function AgentWorkingIcon() {
  return (
    <div className="relative w-20 h-20">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0"
      >
        <svg className="w-full h-full" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="35" stroke="#FDE68A" strokeWidth="2" strokeDasharray="6 6" />
        </svg>
      </motion.div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function GemIcon() {
  return (
    <motion.div
      animate={{
        rotate: [-5, 5, -5],
        scale: [1, 1.05, 1],
      }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      className="w-20 h-20 flex items-center justify-center"
    >
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
        <path d="M30 5L5 22L30 55L55 22L30 5Z" fill="url(#gemGradient)" stroke="#F59E0B" strokeWidth="2" />
        <path d="M5 22L30 30L55 22" stroke="#FDE68A" strokeWidth="2" />
        <path d="M30 30V55" stroke="#FDE68A" strokeWidth="2" />
        <path d="M15 5L30 30L45 5" stroke="#FDE68A" strokeWidth="1.5" />
        <defs>
          <linearGradient id="gemGradient" x1="30" y1="5" x2="30" y2="55">
            <stop stopColor="#FEF3C7" />
            <stop offset="1" stopColor="#FBBF24" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
}

function ClusterIcon() {
  return (
    <div className="relative w-20 h-20">
      {/* Cluster dots */}
      {[
        { x: 30, y: 20, size: 12, delay: 0 },
        { x: 50, y: 35, size: 16, delay: 0.2 },
        { x: 25, y: 45, size: 14, delay: 0.4 },
        { x: 55, y: 55, size: 10, delay: 0.6 },
        { x: 40, y: 60, size: 12, delay: 0.8 },
      ].map((dot, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: dot.delay, type: 'spring', stiffness: 300 }}
          style={{
            left: dot.x,
            top: dot.y,
            width: dot.size,
            height: dot.size,
          }}
          className="absolute rounded-full bg-gradient-to-br from-amber-300 to-orange-400 shadow-md"
        />
      ))}
      {/* Connecting lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 80 80" fill="none">
        <path d="M36 26 L56 41" stroke="#FDE68A" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M56 41 L32 51" stroke="#FDE68A" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M32 51 L61 61" stroke="#FDE68A" strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>
    </div>
  );
}

function FeedbackIcon() {
  return (
    <motion.div
      className="w-20 h-20 flex items-center justify-center"
    >
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center"
        >
          <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </motion.div>
        {/* Sparkles */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              rotate: 45,
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.6,
            }}
            style={{
              top: [-4, 8, 0][i],
              right: [4, -8, 16][i],
            }}
            className="absolute w-3 h-3 text-amber-400"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z" />
            </svg>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function TimeIcon() {
  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center shadow-inner">
        <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" stroke="#F59E0B" strokeWidth="2" />
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            style={{ originX: '20px', originY: '20px' }}
          >
            <line x1="20" y1="20" x2="20" y2="10" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
          </motion.g>
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{ originX: '20px', originY: '20px' }}
          >
            <line x1="20" y1="20" x2="28" y2="20" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
          </motion.g>
          <circle cx="20" cy="20" r="2" fill="#F97316" />
        </svg>
      </div>
    </div>
  );
}

function PhotoIcon() {
  return (
    <motion.div
      className="relative w-20 h-20"
      whileHover={{ rotate: 3 }}
    >
      {/* Stacked photos effect */}
      <div className="absolute inset-0 rounded-xl bg-amber-200 transform rotate-6 translate-x-1 translate-y-1" />
      <div className="absolute inset-0 rounded-xl bg-amber-100 transform -rotate-3" />
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 border-2 border-amber-200 overflow-hidden">
        {/* Mountain landscape */}
        <svg className="w-full h-full" viewBox="0 0 80 80" fill="none">
          <rect width="80" height="80" fill="url(#skyGradient)" />
          <path d="M0 60 L25 35 L45 55 L60 40 L80 60 L80 80 L0 80 Z" fill="#34D399" />
          <path d="M0 70 L30 50 L50 65 L80 45 L80 80 L0 80 Z" fill="#059669" />
          <circle cx="60" cy="20" r="8" fill="#FBBF24" />
          <defs>
            <linearGradient id="skyGradient" x1="40" y1="0" x2="40" y2="80">
              <stop stopColor="#FEF3C7" />
              <stop offset="1" stopColor="#FDE68A" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </motion.div>
  );
}

function CacheIcon() {
  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <motion.div
        className="absolute"
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="35" stroke="#FDE68A" strokeWidth="4" strokeDasharray="12 8" />
        </svg>
      </motion.div>
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      </div>
    </div>
  );
}

// =============================================================================
// Specific Empty States
// =============================================================================

export function NoCitiesSelectedEmpty({ onAddCity }: { onAddCity?: () => void }) {
  return (
    <EmptyState
      icon={<MapExploreIcon />}
      title="No Cities to Explore"
      description="Add cities to your route and we'll gather intelligent insights about each destination."
      action={onAddCity ? { label: 'Add a City', onClick: onAddCity } : undefined}
      variant="card"
    />
  );
}

export function IntelligencePendingEmpty({ cityName }: { cityName?: string }) {
  return (
    <EmptyState
      icon={<AgentWorkingIcon />}
      title="Intelligence Gathering"
      description={cityName
        ? `Our agents are researching ${cityName}. This usually takes a moment.`
        : "Select a city to see its intelligent insights."
      }
      variant="default"
    />
  );
}

export function NoHiddenGemsEmpty({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <EmptyState
      icon={<GemIcon />}
      title="No Hidden Gems Yet"
      description="We're still discovering off-the-beaten-path spots. Check back soon!"
      action={onRefresh ? { label: 'Refresh', onClick: onRefresh } : undefined}
      variant="compact"
    />
  );
}

export function NoClustersEmpty({ cityName }: { cityName?: string }) {
  return (
    <EmptyState
      icon={<ClusterIcon />}
      title="No Clusters Found"
      description={cityName
        ? `We couldn't identify distinct neighborhoods in ${cityName} yet.`
        : "Cluster data will appear once the city is analyzed."
      }
      variant="compact"
    />
  );
}

export function NoFeedbackEmpty({ onProvideFeedback }: { onProvideFeedback?: () => void }) {
  return (
    <EmptyState
      icon={<FeedbackIcon />}
      title="Share Your Thoughts"
      description="Your feedback helps us improve recommendations for everyone."
      action={onProvideFeedback ? { label: 'Give Feedback', onClick: onProvideFeedback } : undefined}
      variant="card"
    />
  );
}

export function NoTimeBlocksEmpty() {
  return (
    <EmptyState
      icon={<TimeIcon />}
      title="No Time Blocks"
      description="Activity timing recommendations will appear once analysis is complete."
      variant="compact"
    />
  );
}

export function NoPhotoSpotsEmpty({ onExplore }: { onExplore?: () => void }) {
  return (
    <EmptyState
      icon={<PhotoIcon />}
      title="Photo Spots Coming"
      description="We're identifying the most photogenic locations in this city."
      action={onExplore ? { label: 'Explore Map', onClick: onExplore } : undefined}
      variant="compact"
    />
  );
}

export function NoCacheDataEmpty() {
  return (
    <EmptyState
      icon={<CacheIcon />}
      title="No Cached Data"
      description="Intelligence data will be cached automatically as you explore cities."
      variant="card"
    />
  );
}

export function NoSearchResultsEmpty({ query, onClear }: { query: string; onClear?: () => void }) {
  return (
    <EmptyState
      icon={
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      }
      title="No Results Found"
      description={`We couldn't find anything matching "${query}". Try a different search.`}
      action={onClear ? { label: 'Clear Search', onClick: onClear } : undefined}
      variant="default"
    />
  );
}

export function DeepDiveWelcomeEmpty({ onSelectTopic }: { onSelectTopic?: () => void }) {
  return (
    <EmptyState
      icon={
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
      }
      title="Deep Dive Ready"
      description="Choose a topic to explore in depth. Our agents will gather specialized intel."
      action={onSelectTopic ? { label: 'Select Topic', onClick: onSelectTopic } : undefined}
      variant="full"
    />
  );
}

export function OfflineEmpty({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
        </div>
      }
      title="You're Offline"
      description="Connect to the internet to access city intelligence features."
      action={onRetry ? { label: 'Try Again', onClick: onRetry } : undefined}
      variant="card"
    />
  );
}

// =============================================================================
// Generic Empty State Factory
// =============================================================================

export function createEmptyState(config: {
  iconType: 'map' | 'agent' | 'gem' | 'cluster' | 'feedback' | 'time' | 'photo' | 'cache';
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  const icons = {
    map: <MapExploreIcon />,
    agent: <AgentWorkingIcon />,
    gem: <GemIcon />,
    cluster: <ClusterIcon />,
    feedback: <FeedbackIcon />,
    time: <TimeIcon />,
    photo: <PhotoIcon />,
    cache: <CacheIcon />,
  };

  return (
    <EmptyState
      icon={icons[config.iconType]}
      title={config.title}
      description={config.description}
      action={config.action}
    />
  );
}

// =============================================================================
// Exports
// =============================================================================

export const EmptyStates = {
  NoCitiesSelected: NoCitiesSelectedEmpty,
  IntelligencePending: IntelligencePendingEmpty,
  NoHiddenGems: NoHiddenGemsEmpty,
  NoClusters: NoClustersEmpty,
  NoFeedback: NoFeedbackEmpty,
  NoTimeBlocks: NoTimeBlocksEmpty,
  NoPhotoSpots: NoPhotoSpotsEmpty,
  NoCacheData: NoCacheDataEmpty,
  NoSearchResults: NoSearchResultsEmpty,
  DeepDiveWelcome: DeepDiveWelcomeEmpty,
  Offline: OfflineEmpty,
};

export default EmptyStates;
