/**
 * ItinerarySidebar - Tabbed Glassmorphic Sidebar
 * Phase 1: Right sidebar with 4 tabs
 *
 * Tabs:
 * - Route: Day-by-day itinerary
 * - Chat: Real-time collaboration
 * - Expenses: Budget tracking & splitting
 * - Tasks: Trip task management
 */

import { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  MessageCircle,
  DollarSign,
  CheckSquare
} from 'lucide-react';
import { type SpotlightRoute } from '../../../stores/spotlightStoreV2';
import { GlassPanel } from '../../design-system';
import { fadeWithBlur } from '../../../animations/macOS-transitions';
import { Spinner } from '../../skeletons/SkeletonLoaders';
import RoutePanel from './RoutePanel';

// Lazy load heavy tab panels
const ChatPanel = lazy(() => import('./ChatPanel'));
const ExpensesPanel = lazy(() => import('./ExpensesPanel'));
const TasksPanel = lazy(() => import('./TasksPanel'));

interface ItinerarySidebarProps {
  route: SpotlightRoute | null;
  routeId: string | null;
  userId?: string;
}

type TabType = 'route' | 'chat' | 'expenses' | 'tasks';

// Loading skeleton for lazy-loaded tabs (Phase 6: Beautiful loading states)
const TabLoadingSkeleton = () => (
  <div className="flex items-center justify-center h-full">
    <GlassPanel blur="md" opacity={0.8} className="p-8">
      <Spinner size="lg" />
    </GlassPanel>
  </div>
);

const ItinerarySidebar = ({ route, routeId, userId }: ItinerarySidebarProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('route');

  const tabs = [
    { id: 'route' as TabType, label: 'Route', icon: Calendar },
    { id: 'chat' as TabType, label: 'Chat', icon: MessageCircle },
    { id: 'expenses' as TabType, label: 'Expenses', icon: DollarSign },
    { id: 'tasks' as TabType, label: 'Tasks', icon: CheckSquare },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Tab Navigation */}
      <GlassPanel
        blur="md"
        opacity={0.9}
        noPadding
        className="border-b border-gray-200"
      >
        <div className="flex items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-4 py-4
                  transition-all duration-200
                  ${isActive
                    ? 'text-primary-600 bg-white/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/30'
                  }
                  border-b-2 ${isActive ? 'border-primary-500' : 'border-transparent'}
                  font-medium text-sm
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </GlassPanel>

      {/* Tab Content with smooth transitions */}
      <div className="flex-1 overflow-hidden relative">
        <motion.div
          key={activeTab}
          {...fadeWithBlur}
          className="absolute inset-0 overflow-auto"
        >
          {activeTab === 'route' && <RoutePanel route={route} routeId={routeId} />}
          {activeTab === 'chat' && (
            <Suspense fallback={<TabLoadingSkeleton />}>
              <ChatPanel routeId={routeId} userId={userId} />
            </Suspense>
          )}
          {activeTab === 'expenses' && (
            <Suspense fallback={<TabLoadingSkeleton />}>
              <ExpensesPanel routeId={routeId} userId={userId} />
            </Suspense>
          )}
          {activeTab === 'tasks' && (
            <Suspense fallback={<TabLoadingSkeleton />}>
              <TasksPanel routeId={routeId} userId={userId} />
            </Suspense>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ItinerarySidebar;
