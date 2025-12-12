/**
 * IntelligenceSettingsPanel
 *
 * A refined control panel for tuning city intelligence parameters.
 * Allows users to adjust quality thresholds, agent priorities,
 * and processing preferences.
 *
 * Design Philosophy:
 * - Mission control aesthetic with warm touches
 * - Sliders and toggles that feel tactile and responsive
 * - Real-time preview of setting impacts
 * - Clear explanations for each setting
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Sliders,
  Gauge,
  Zap,
  Shield,
  Sparkles,
  ChevronRight,
  Check,
  RotateCcw,
  AlertTriangle,
  X,
  Save,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface IntelligenceSettings {
  // Quality
  qualityThreshold: number; // 0-100, default 85
  maxIterations: number; // 1-5, default 3

  // Performance
  parallelAgents: number; // 1-4, default 3
  timeoutSeconds: number; // 30-300, default 120

  // Features
  enableRefinement: boolean; // default true
  enableCaching: boolean; // default true
  enableWeatherIntegration: boolean; // default true
  enablePhotoSpots: boolean; // default true

  // Agent priorities (0-100)
  agentPriorities: {
    story: number;
    clusters: number;
    gems: number;
    logistics: number;
  };
}

interface IntelligenceSettingsPanelProps {
  settings: IntelligenceSettings;
  onSettingsChange: (settings: IntelligenceSettings) => void;
  onSave?: () => void;
  onReset?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: 'panel' | 'modal' | 'inline';
}

// =============================================================================
// Default Settings
// =============================================================================

export const DEFAULT_INTELLIGENCE_SETTINGS: IntelligenceSettings = {
  qualityThreshold: 85,
  maxIterations: 3,
  parallelAgents: 3,
  timeoutSeconds: 120,
  enableRefinement: true,
  enableCaching: true,
  enableWeatherIntegration: true,
  enablePhotoSpots: true,
  agentPriorities: {
    story: 80,
    clusters: 90,
    gems: 75,
    logistics: 70,
  },
};

// =============================================================================
// Configuration
// =============================================================================

const QUALITY_PRESETS = [
  { value: 70, label: 'Quick', description: 'Faster results, basic quality', icon: Zap },
  { value: 85, label: 'Balanced', description: 'Good quality, reasonable time', icon: Gauge },
  { value: 95, label: 'Thorough', description: 'Best quality, takes longer', icon: Shield },
];

// =============================================================================
// Main Component
// =============================================================================

export function IntelligenceSettingsPanel({
  settings,
  onSettingsChange,
  onSave,
  onReset,
  isOpen: _isOpen = true,
  onOpenChange,
  variant = 'panel',
}: IntelligenceSettingsPanelProps) {
  void _isOpen; // Available for panel visibility control
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['quality']));

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(localSettings) !== JSON.stringify(settings);
    setHasChanges(changed);
  }, [localSettings, settings]);

  // Update local settings
  const updateSetting = useCallback(<K extends keyof IntelligenceSettings>(
    key: K,
    value: IntelligenceSettings[K]
  ) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Update agent priority
  const updateAgentPriority = useCallback((agent: keyof IntelligenceSettings['agentPriorities'], value: number) => {
    setLocalSettings(prev => ({
      ...prev,
      agentPriorities: { ...prev.agentPriorities, [agent]: value },
    }));
  }, []);

  // Toggle section
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Save changes
  const handleSave = () => {
    onSettingsChange(localSettings);
    onSave?.();
  };

  // Reset to defaults
  const handleReset = () => {
    setLocalSettings(DEFAULT_INTELLIGENCE_SETTINGS);
    onReset?.();
  };

  // Discard changes
  const handleDiscard = () => {
    setLocalSettings(settings);
  };

  const content = (
    <div className="space-y-6">
      {/* Quality Section */}
      <SettingsSection
        title="Quality & Speed"
        icon={Gauge}
        isExpanded={expandedSections.has('quality')}
        onToggle={() => toggleSection('quality')}
      >
        <div className="space-y-5">
          {/* Quality presets */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">
              Quality Preset
            </label>
            <div className="grid grid-cols-3 gap-2">
              {QUALITY_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = localSettings.qualityThreshold === preset.value;

                return (
                  <button
                    key={preset.value}
                    onClick={() => updateSetting('qualityThreshold', preset.value)}
                    className={`
                      relative flex flex-col items-center gap-2 p-3 rounded-xl
                      border-2 transition-all duration-200
                      ${isSelected
                        ? 'border-amber-500 bg-amber-50 shadow-md shadow-amber-500/10'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }
                    `}
                  >
                    <div
                      className={`
                        w-10 h-10 rounded-xl flex items-center justify-center
                        ${isSelected ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'}
                      `}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-semibold ${isSelected ? 'text-amber-700' : 'text-gray-700'}`}>
                        {preset.label}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{preset.description}</p>
                    </div>
                    {isSelected && (
                      <motion.div
                        layoutId="quality-check"
                        className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quality slider (fine-tune) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Fine-tune Quality
              </label>
              <span className="text-sm font-bold text-amber-600">{localSettings.qualityThreshold}%</span>
            </div>
            <SliderInput
              value={localSettings.qualityThreshold}
              onChange={(v) => updateSetting('qualityThreshold', v)}
              min={50}
              max={100}
              color="amber"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Higher quality requires more processing time and iterations
            </p>
          </div>

          {/* Max iterations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Max Refinement Cycles
              </label>
              <span className="text-sm font-bold text-violet-600">{localSettings.maxIterations}</span>
            </div>
            <SliderInput
              value={localSettings.maxIterations}
              onChange={(v) => updateSetting('maxIterations', v)}
              min={1}
              max={5}
              step={1}
              color="violet"
            />
          </div>
        </div>
      </SettingsSection>

      {/* Performance Section */}
      <SettingsSection
        title="Performance"
        icon={Zap}
        isExpanded={expandedSections.has('performance')}
        onToggle={() => toggleSection('performance')}
      >
        <div className="space-y-5">
          {/* Parallel agents */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Parallel Agents
              </label>
              <span className="text-sm font-bold text-emerald-600">{localSettings.parallelAgents}</span>
            </div>
            <SliderInput
              value={localSettings.parallelAgents}
              onChange={(v) => updateSetting('parallelAgents', v)}
              min={1}
              max={4}
              step={1}
              color="emerald"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              More parallel agents = faster, but higher resource usage
            </p>
          </div>

          {/* Timeout */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Timeout
              </label>
              <span className="text-sm font-bold text-sky-600">{localSettings.timeoutSeconds}s</span>
            </div>
            <SliderInput
              value={localSettings.timeoutSeconds}
              onChange={(v) => updateSetting('timeoutSeconds', v)}
              min={30}
              max={300}
              step={10}
              color="sky"
            />
          </div>
        </div>
      </SettingsSection>

      {/* Features Section */}
      <SettingsSection
        title="Features"
        icon={Sparkles}
        isExpanded={expandedSections.has('features')}
        onToggle={() => toggleSection('features')}
      >
        <div className="space-y-3">
          <ToggleSwitch
            label="Automatic Refinement"
            description="Re-run agents if quality is below threshold"
            checked={localSettings.enableRefinement}
            onChange={(v) => updateSetting('enableRefinement', v)}
          />
          <ToggleSwitch
            label="Smart Caching"
            description="Cache results to speed up repeat visits"
            checked={localSettings.enableCaching}
            onChange={(v) => updateSetting('enableCaching', v)}
          />
          <ToggleSwitch
            label="Weather Integration"
            description="Include weather-aware recommendations"
            checked={localSettings.enableWeatherIntegration}
            onChange={(v) => updateSetting('enableWeatherIntegration', v)}
          />
          <ToggleSwitch
            label="Photo Spots"
            description="Find Instagram-worthy locations"
            checked={localSettings.enablePhotoSpots}
            onChange={(v) => updateSetting('enablePhotoSpots', v)}
          />
        </div>
      </SettingsSection>

      {/* Agent Priorities Section */}
      <SettingsSection
        title="Agent Priorities"
        icon={Sliders}
        isExpanded={expandedSections.has('priorities')}
        onToggle={() => toggleSection('priorities')}
        badge="Advanced"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500 -mt-1 mb-3">
            Adjust how much weight each agent has in the final intelligence score
          </p>

          {Object.entries(localSettings.agentPriorities).map(([agent, value]) => (
            <div key={agent}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700 capitalize">
                  {agent} Agent
                </label>
                <span className="text-xs font-bold text-gray-500">{value}%</span>
              </div>
              <SliderInput
                value={value}
                onChange={(v) => updateAgentPriority(agent as keyof IntelligenceSettings['agentPriorities'], v)}
                min={0}
                max={100}
                color="gray"
              />
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* Actions */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="sticky bottom-0 pt-4 -mx-4 px-4 pb-4 bg-gradient-to-t from-white via-white to-transparent"
          >
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-700 flex-1">You have unsaved changes</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDiscard}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-white transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-md shadow-amber-500/25"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset button */}
      <div className="pt-2 border-t border-gray-100">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to defaults
        </button>
      </div>
    </div>
  );

  // Render based on variant
  if (variant === 'inline') {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`
        bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden
        ${variant === 'modal' ? 'max-w-md w-full mx-auto' : 'w-80'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-lg">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Intelligence Settings</h3>
            <p className="text-xs text-gray-500">Tune quality & performance</p>
          </div>
        </div>
        {onOpenChange && (
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
        {content}
      </div>
    </motion.div>
  );
}

// =============================================================================
// Settings Section
// =============================================================================

interface SettingsSectionProps {
  title: string;
  icon: typeof Settings;
  isExpanded: boolean;
  onToggle: () => void;
  badge?: string;
  children: React.ReactNode;
}

function SettingsSection({
  title,
  icon: Icon,
  isExpanded,
  onToggle,
  badge,
  children,
}: SettingsSectionProps) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
          <Icon className="w-4 h-4 text-gray-600" />
        </div>
        <span className="flex-1 text-left font-medium text-gray-900">{title}</span>
        {badge && (
          <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-semibold uppercase">
            {badge}
          </span>
        )}
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-1 border-t border-gray-100">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Slider Input
// =============================================================================

interface SliderInputProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  color?: 'amber' | 'violet' | 'emerald' | 'sky' | 'gray';
}

function SliderInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  color = 'amber',
}: SliderInputProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  const _colorClasses = {
    amber: 'bg-amber-500',
    violet: 'bg-violet-500',
    emerald: 'bg-emerald-500',
    sky: 'bg-sky-500',
    gray: 'bg-gray-500',
  };
  void _colorClasses; // Available for styling

  return (
    <div className="relative">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-200 slider-thumb"
        style={{
          background: `linear-gradient(to right, ${color === 'amber' ? '#f59e0b' : color === 'violet' ? '#8b5cf6' : color === 'emerald' ? '#10b981' : color === 'sky' ? '#0ea5e9' : '#6b7280'} 0%, ${color === 'amber' ? '#f59e0b' : color === 'violet' ? '#8b5cf6' : color === 'emerald' ? '#10b981' : color === 'sky' ? '#0ea5e9' : '#6b7280'} ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
        }}
      />
      <style>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          border: 3px solid currentColor;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        .slider-thumb::-webkit-slider-thumb:active {
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// Toggle Switch
// =============================================================================

interface ToggleSwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSwitch({ label, description, checked, onChange }: ToggleSwitchProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <motion.div
          animate={{ backgroundColor: checked ? '#10b981' : '#d1d5db' }}
          className="w-11 h-6 rounded-full transition-colors"
        />
        <motion.div
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 left-0 w-4 h-4 rounded-full bg-white shadow-md"
        />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
          {label}
        </p>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
}

export default IntelligenceSettingsPanel;
