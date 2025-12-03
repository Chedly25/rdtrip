/**
 * Command Bar - Cmd+K Natural Language Interface
 *
 * A powerful command palette for natural language route modifications.
 * Inspired by Linear, Raycast, and Spotlight - but with a warm editorial twist.
 *
 * Design: Dark mode with amber/golden accents, typewriter-inspired typography
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  Command,
  Sparkles,
  MapPin,
  RefreshCw,
  Trash2,
  Moon,
  Plus,
  ArrowRight,
  Loader2,
  Wand2,
  Compass
} from 'lucide-react';
import { useSpotlightStoreV2 } from '../../../stores/spotlightStoreV2';

interface CommandAction {
  id: string;
  type: 'remove' | 'replace' | 'add' | 'reorder' | 'nights' | 'custom';
  icon: typeof MapPin;
  label: string;
  description: string;
  cityIndex?: number;
  cityName?: string;
  value?: any;
}

interface ParsedCommand {
  intent: 'remove' | 'replace' | 'add' | 'reorder' | 'adjust_nights' | 'unknown';
  confidence: number;
  entities: {
    city?: string;
    nights?: number;
    position?: 'before' | 'after';
    referenceCity?: string;
  };
  suggestedActions: CommandAction[];
}

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteAction: (action: CommandAction) => void;
}

// Dark editorial colors with amber accents
const colors = {
  bg: '#1A1814',
  bgElevated: '#252220',
  bgHover: '#2D2A27',
  border: '#3D3835',
  text: '#F5F0EB',
  textMuted: '#9B8E82',
  textDim: '#6B6058',
  amber: '#D4A853',
  amberDark: '#B8923D',
  amberGlow: 'rgba(212, 168, 83, 0.15)',
  terracotta: '#C45830',
  sage: '#6B8E7B',
  error: '#E85A4F',
};

// Quick command suggestions based on current route
function getQuickCommands(cities: string[]): CommandAction[] {
  const commands: CommandAction[] = [];

  // Add city command
  commands.push({
    id: 'add-city',
    type: 'add',
    icon: Plus,
    label: 'Add a city',
    description: 'Insert a new stop in your route'
  });

  // Commands for each city
  cities.forEach((city, index) => {
    if (index > 0 && index < cities.length - 1) {
      commands.push({
        id: `remove-${index}`,
        type: 'remove',
        icon: Trash2,
        label: `Remove ${city}`,
        description: `Remove from your route`,
        cityIndex: index,
        cityName: city
      });
    }

    commands.push({
      id: `replace-${index}`,
      type: 'replace',
      icon: RefreshCw,
      label: `Replace ${city}`,
      description: `Find an alternative city`,
      cityIndex: index,
      cityName: city
    });

    commands.push({
      id: `nights-${index}`,
      type: 'nights',
      icon: Moon,
      label: `Adjust nights in ${city}`,
      description: `Change how long you stay`,
      cityIndex: index,
      cityName: city
    });
  });

  return commands;
}

// Example suggestions for empty input
const exampleQueries = [
  "Remove Porto from the route",
  "Add a beach day near Lisbon",
  "Spend 3 nights in Barcelona",
  "Replace Madrid with Valencia",
  "Add Sintra between Lisbon and Porto",
];

export function CommandBar({
  isOpen,
  onClose,
  onExecuteAction
}: CommandBarProps) {
  const { route, getCityName } = useSpotlightStoreV2();
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [parsedCommand, setParsedCommand] = useState<ParsedCommand | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get city names from route
  const cityNames = route?.cities.map(c => getCityName(c.city)) || [];

  // Get filtered commands based on query
  const quickCommands = getQuickCommands(cityNames);
  const filteredCommands = query.trim()
    ? quickCommands.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.description.toLowerCase().includes(query.toLowerCase())
      )
    : quickCommands.slice(0, 6);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
      setParsedCommand(null);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onExecuteAction(filteredCommands[selectedIndex]);
          onClose();
        } else if (query.trim()) {
          handleNaturalLanguageQuery();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, query, onClose, onExecuteAction]);

  // Parse natural language query
  const handleNaturalLanguageQuery = useCallback(async () => {
    if (!query.trim() || !route) return;

    setIsProcessing(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/route/parse-command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: query,
          routeContext: {
            cities: route.cities.map(c => ({
              name: getCityName(c.city),
              nights: c.nights
            }))
          }
        })
      });

      if (!response.ok) throw new Error('Failed to parse command');

      const parsed: ParsedCommand = await response.json();
      setParsedCommand(parsed);

      // If high confidence, auto-execute
      if (parsed.confidence > 0.85 && parsed.suggestedActions.length === 1) {
        onExecuteAction(parsed.suggestedActions[0]);
        onClose();
      }
    } catch (err) {
      console.error('Command parsing failed:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [query, route, getCityName, onExecuteAction, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
          style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}
        />

        {/* Command Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="relative w-full max-w-2xl mx-4 rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            boxShadow: `0 25px 60px -15px rgba(0,0,0,0.5), 0 0 0 1px ${colors.border}, inset 0 1px 0 ${colors.bgElevated}`
          }}
        >
          {/* Ambient glow */}
          <div
            className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-40 rounded-full blur-3xl pointer-events-none"
            style={{ background: colors.amberGlow }}
          />

          {/* Input area */}
          <div className="relative p-4 border-b" style={{ borderColor: colors.border }}>
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: colors.amberGlow }}
              >
                {isProcessing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 className="w-5 h-5" style={{ color: colors.amber }} />
                  </motion.div>
                ) : (
                  <Wand2 className="w-5 h-5" style={{ color: colors.amber }} />
                )}
              </div>

              {/* Input */}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                  setParsedCommand(null);
                }}
                placeholder="Type a command or ask anything..."
                className="flex-1 bg-transparent text-lg font-medium outline-none placeholder:opacity-40"
                style={{
                  color: colors.text,
                  fontFamily: "'JetBrains Mono', 'SF Mono', monospace"
                }}
              />

              {/* Keyboard hint */}
              <div className="flex items-center gap-1.5">
                <kbd
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    background: colors.bgElevated,
                    color: colors.textMuted,
                    border: `1px solid ${colors.border}`
                  }}
                >
                  esc
                </kbd>
              </div>
            </div>

            {/* AI hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: query.length > 2 ? 1 : 0.5 }}
              className="text-xs mt-3 ml-13 flex items-center gap-1.5"
              style={{ color: colors.textDim, marginLeft: '52px' }}
            >
              <Sparkles className="w-3 h-3" style={{ color: colors.amber }} />
              {query.length > 2
                ? 'Press Enter to process with AI'
                : 'Describe what you want to change'}
            </motion.p>
          </div>

          {/* Results area */}
          <div className="max-h-80 overflow-y-auto">
            {/* Quick commands */}
            {filteredCommands.length > 0 && !parsedCommand && (
              <div className="p-2">
                <p
                  className="px-3 py-2 text-xs font-medium uppercase tracking-wider"
                  style={{ color: colors.textDim }}
                >
                  {query ? 'Matching Commands' : 'Quick Actions'}
                </p>
                {filteredCommands.map((cmd, index) => {
                  const Icon = cmd.icon;
                  const isSelected = index === selectedIndex;

                  return (
                    <motion.button
                      key={cmd.id}
                      onClick={() => {
                        onExecuteAction(cmd);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      whileHover={{ x: 2 }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
                      style={{
                        background: isSelected ? colors.bgHover : 'transparent',
                        borderLeft: isSelected ? `2px solid ${colors.amber}` : '2px solid transparent'
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: isSelected ? colors.amberGlow : colors.bgElevated,
                          color: isSelected ? colors.amber : colors.textMuted
                        }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-medium text-sm truncate"
                          style={{ color: colors.text }}
                        >
                          {cmd.label}
                        </p>
                        <p
                          className="text-xs truncate"
                          style={{ color: colors.textMuted }}
                        >
                          {cmd.description}
                        </p>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-1"
                        >
                          <kbd
                            className="px-1.5 py-0.5 rounded text-xs"
                            style={{
                              background: colors.bgElevated,
                              color: colors.textMuted,
                              border: `1px solid ${colors.border}`
                            }}
                          >
                            Enter
                          </kbd>
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Parsed command results */}
            {parsedCommand && (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4" style={{ color: colors.amber }} />
                  <p className="text-sm font-medium" style={{ color: colors.text }}>
                    AI understood your request
                  </p>
                  <span
                    className="ml-auto px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      background: parsedCommand.confidence > 0.7 ? colors.sage + '30' : colors.terracotta + '30',
                      color: parsedCommand.confidence > 0.7 ? colors.sage : colors.terracotta
                    }}
                  >
                    {Math.round(parsedCommand.confidence * 100)}% confident
                  </span>
                </div>

                <div className="space-y-2">
                  {parsedCommand.suggestedActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <motion.button
                        key={action.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => {
                          onExecuteAction(action);
                          onClose();
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:scale-[1.01]"
                        style={{
                          background: colors.bgElevated,
                          border: `1px solid ${colors.border}`
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: colors.amberGlow, color: colors.amber }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium" style={{ color: colors.text }}>
                            {action.label}
                          </p>
                          <p className="text-sm" style={{ color: colors.textMuted }}>
                            {action.description}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5" style={{ color: colors.textMuted }} />
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty state with examples */}
            {!query && filteredCommands.length === 0 && (
              <div className="p-6 text-center">
                <Compass
                  className="w-12 h-12 mx-auto mb-4"
                  style={{ color: colors.textDim }}
                />
                <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
                  Try these examples:
                </p>
                <div className="space-y-2">
                  {exampleQueries.map((example, i) => (
                    <button
                      key={i}
                      onClick={() => setQuery(example)}
                      className="block w-full text-left px-4 py-2 rounded-lg text-sm transition-colors"
                      style={{
                        color: colors.textMuted,
                        background: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = colors.bgHover;
                        e.currentTarget.style.color = colors.text;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = colors.textMuted;
                      }}
                    >
                      "{example}"
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="px-4 py-3 flex items-center justify-between border-t"
            style={{
              borderColor: colors.border,
              background: colors.bgElevated
            }}
          >
            <div className="flex items-center gap-4 text-xs" style={{ color: colors.textDim }}>
              <span className="flex items-center gap-1.5">
                <kbd
                  className="px-1.5 py-0.5 rounded"
                  style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
                >
                  ↑↓
                </kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1.5">
                <kbd
                  className="px-1.5 py-0.5 rounded"
                  style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
                >
                  ↵
                </kbd>
                Select
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs" style={{ color: colors.textDim }}>
              <Command className="w-3 h-3" />
              <span>K to open</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

export default CommandBar;
