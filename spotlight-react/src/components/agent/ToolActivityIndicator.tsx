/**
 * ToolActivityIndicator - Real-time Tool Execution Display
 *
 * Shows which tools the agent is currently executing
 * Beautiful animated badges matching teal brand
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, MapPin, Search, Navigation, Info, Loader, CheckCircle, AlertCircle } from 'lucide-react';

interface ActiveTool {
  name: string;
  status: 'running' | 'complete' | 'error';
  input?: any;
}

interface ToolActivityIndicatorProps {
  activeTools: ActiveTool[];
}

export function ToolActivityIndicator({ activeTools }: ToolActivityIndicatorProps) {
  if (activeTools.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mt-3">
      <AnimatePresence mode="popLayout">
        {activeTools.map((tool, index) => (
          <motion.div
            key={`${tool.name}-${index}`}
            initial={{ opacity: 0, x: -10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
              tool.status === 'complete'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : tool.status === 'error'
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-teal-50 border border-teal-200 text-teal-700'
            }`}
          >
            {/* Tool Icon */}
            <div className="flex-shrink-0">
              {getToolIcon(tool.name, tool.status)}
            </div>

            {/* Tool Name */}
            <span className="flex-1">{formatToolName(tool.name)}</span>

            {/* Status Indicator */}
            <div className="flex-shrink-0">
              {tool.status === 'running' && (
                <Loader className="w-3.5 h-3.5 animate-spin" />
              )}
              {tool.status === 'complete' && (
                <CheckCircle className="w-3.5 h-3.5" />
              )}
              {tool.status === 'error' && (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Get appropriate icon for tool
 */
function getToolIcon(toolName: string, status: string) {
  const iconClass = `w-3.5 h-3.5 ${
    status === 'running' ? '' : status === 'complete' ? '' : ''
  }`;

  if (toolName === 'checkWeather') {
    return <Cloud className={iconClass} />;
  } else if (toolName === 'searchActivities') {
    return <Search className={iconClass} />;
  } else if (toolName === 'getDirections') {
    return <Navigation className={iconClass} />;
  } else if (toolName === 'getCityInfo') {
    return <Info className={iconClass} />;
  } else if (toolName === 'webSearch') {
    return <Search className={iconClass} />;
  } else {
    return <MapPin className={iconClass} />;
  }
}

/**
 * Format tool name for display
 */
function formatToolName(toolName: string): string {
  const nameMap: Record<string, string> = {
    checkWeather: 'Checking weather',
    searchActivities: 'Searching activities',
    getDirections: 'Getting directions',
    getCityInfo: 'Getting city info',
    webSearch: 'Searching web',
    findAlternative: 'Finding alternatives',
    checkOpeningHours: 'Checking hours',
    addExpense: 'Adding expense',
    searchFlights: 'Searching flights',
    searchHotels: 'Searching hotels',
    translateText: 'Translating',
    currencyConversion: 'Converting currency',
    getLocalTips: 'Getting local tips'
  };

  return nameMap[toolName] || toolName;
}
