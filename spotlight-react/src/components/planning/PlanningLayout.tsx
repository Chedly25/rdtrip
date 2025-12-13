/**
 * PlanningLayout
 *
 * Two-column responsive layout for the planning page.
 * - Left panel (45%): Your Plan (clusters)
 * - Right panel (55%): Discover (suggestions)
 * - Bottom panel: Companion (always visible, expandable)
 */

import { motion } from 'framer-motion';
import type { PlanningLayoutProps } from '../../types/planning';

export function PlanningLayout({
  leftPanel,
  rightPanel,
  companionPanel,
}: PlanningLayoutProps) {
  return (
    <div className="flex-1 flex flex-col bg-[#FAF7F2] overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel - Your Plan */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full lg:w-[45%] border-b lg:border-b-0 lg:border-r border-[#E5DDD0] overflow-hidden flex flex-col"
        >
          {/* Panel Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-[#E5DDD0] bg-[#FFFBF5]">
            <h2 className="font-['Fraunces',serif] text-lg sm:text-xl text-[#2C2417] font-semibold">
              Your Plan
            </h2>
            <p className="text-sm text-[#8B7355] font-['Satoshi',sans-serif] mt-0.5">
              Build your trip by area
            </p>
          </div>

          {/* Panel Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {leftPanel}
          </div>
        </motion.div>

        {/* Right Panel - Discover */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
          className="w-full lg:w-[55%] overflow-hidden flex flex-col"
        >
          {/* Panel Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-[#E5DDD0] bg-[#FFFBF5]">
            <h2 className="font-['Fraunces',serif] text-lg sm:text-xl text-[#2C2417] font-semibold">
              Discover
            </h2>
            <p className="text-sm text-[#8B7355] font-['Satoshi',sans-serif] mt-0.5">
              Find things to add to your plan
            </p>
          </div>

          {/* Panel Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {rightPanel}
          </div>
        </motion.div>
      </div>

      {/* Companion Panel - Fixed at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
        className="border-t border-[#E5DDD0] bg-[#FFFBF5] shadow-[0_-4px_20px_rgba(44,36,23,0.06)]"
      >
        {companionPanel}
      </motion.div>
    </div>
  );
}

export default PlanningLayout;
