/**
 * ToolExecutionStatus - Modern Tool Execution Display
 *
 * Minimalist, typography-focused status updates
 * No badges, no spinners - just clean, modern design
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { ActiveTool } from '../../contexts/AgentProvider';

interface ToolExecutionStatusProps {
  activeTools: ActiveTool[];
}

export function ToolExecutionStatus({ activeTools }: ToolExecutionStatusProps) {
  if (activeTools.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2">
      <AnimatePresence mode="popLayout">
        {activeTools.map((tool, index) => (
          <motion.div
            key={`${tool.name}-${index}`}
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="relative"
          >
            {/* Status Line */}
            <div className="flex items-center gap-3">
              {/* Status Indicator */}
              <div className="relative flex items-center justify-center w-4 h-4 flex-shrink-0">
                {tool.status === 'running' && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-teal-500"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.6, 0.3, 0.6],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
                <div
                  className={`relative w-2 h-2 rounded-full ${
                    tool.status === 'complete'
                      ? 'bg-emerald-500'
                      : tool.status === 'error'
                      ? 'bg-red-500'
                      : 'bg-teal-600'
                  }`}
                />
              </div>

              {/* Status Text */}
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`text-xs font-medium ${
                  tool.status === 'complete'
                    ? 'text-emerald-700'
                    : tool.status === 'error'
                    ? 'text-red-700'
                    : 'text-gray-700'
                }`}
              >
                {formatToolStatus(tool)}
              </motion.span>
            </div>

            {/* Connecting Line to Next Tool */}
            {index < activeTools.length - 1 && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 16 }}
                className="absolute left-[7px] top-5 w-px bg-gray-200"
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Format tool status as clean text
 */
function formatToolStatus(tool: ActiveTool): string {
  const toolNames: Record<string, { running: string; complete: string }> = {
    checkWeather: {
      running: 'Checking weather forecast',
      complete: 'Weather data retrieved'
    },
    searchActivities: {
      running: 'Searching for activities',
      complete: 'Activities found'
    },
    getDirections: {
      running: 'Calculating route',
      complete: 'Route calculated'
    },
    getCityInfo: {
      running: 'Gathering city information',
      complete: 'City data retrieved'
    },
    webSearch: {
      running: 'Searching the web',
      complete: 'Search complete'
    },
    findAlternative: {
      running: 'Finding alternatives',
      complete: 'Alternatives found'
    },
    searchFlights: {
      running: 'Searching flights',
      complete: 'Flights found'
    },
    searchHotels: {
      running: 'Searching accommodations',
      complete: 'Hotels found'
    }
  };

  const statusText = toolNames[tool.name] || {
    running: `Running ${tool.name}`,
    complete: `${tool.name} complete`
  };

  if (tool.status === 'error') {
    return `Failed to ${statusText.running.toLowerCase()}`;
  }

  return tool.status === 'complete' ? statusText.complete : statusText.running;
}
