import { useEffect, useState } from 'react';
import { Menu, AlignJustify, List, LayoutList } from 'lucide-react';
import { motion } from 'framer-motion';

type DensityMode = 'compact' | 'comfortable' | 'spacious';

interface DensitySelectorProps {
  value?: DensityMode;
  onChange: (mode: DensityMode) => void;
}

export function DensitySelector({ value, onChange }: DensitySelectorProps) {
  const [density, setDensity] = useState<DensityMode>(value || 'compact');

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('itinerary-density') as DensityMode;
    if (saved && ['compact', 'comfortable', 'spacious'].includes(saved)) {
      setDensity(saved);
      onChange(saved);
    }
  }, []);

  const handleChange = (mode: DensityMode) => {
    setDensity(mode);
    localStorage.setItem('itinerary-density', mode);
    onChange(mode);
  };

  const modes = [
    { value: 'compact', icon: List, label: 'Compact', description: 'More items per screen' },
    { value: 'comfortable', icon: AlignJustify, label: 'Comfortable', description: 'Balanced view' },
    { value: 'spacious', icon: LayoutList, label: 'Spacious', description: 'Detailed cards' }
  ] as const;

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
        <Menu className="h-4 w-4" />
        <span className="hidden sm:inline">Density</span>
      </button>

      {/* Dropdown Menu */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        whileHover={{ opacity: 1, y: 0 }}
        className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50"
      >
        <div className="p-2 space-y-1">
          {modes.map(({ value: mode, icon: Icon, label, description }) => (
            <button
              key={mode}
              onClick={() => handleChange(mode)}
              className={`
                w-full flex items-start gap-3 px-3 py-2 rounded-md text-left transition-colors
                ${density === mode
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-50 text-gray-700'
                }
              `}
            >
              <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                density === mode ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{description}</div>
              </div>
              {density === mode && (
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 mt-1.5" />
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
