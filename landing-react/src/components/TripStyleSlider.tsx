import { motion } from 'framer-motion'
import { Coffee, Zap } from 'lucide-react'

interface TripStyleSliderProps {
  value: number // 0-100
  onChange: (value: number) => void
}

export function TripStyleSlider({ value, onChange }: TripStyleSliderProps) {
  // Labels based on value
  const getLabel = () => {
    if (value < 25) return 'Relaxed & Slow'
    if (value < 50) return 'Mostly Relaxed'
    if (value < 75) return 'Balanced'
    return 'Action-Packed'
  }

  const getDescription = () => {
    if (value < 25) return 'Fewer stops, more time to unwind at each place'
    if (value < 50) return 'Leisurely pace with time to explore'
    if (value < 75) return 'Good mix of activities and downtime'
    return 'Hit all the highlights, maximize experiences'
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-semibold text-rui-black">
        <Zap className="h-4 w-4 text-rui-grey-50" />
        Trip Style
      </label>

      <div className="rounded-rui-16 bg-rui-grey-2 p-5">
        {/* Slider */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Coffee className="h-4 w-4 text-rui-grey-50" />
              <span className="text-xs text-rui-grey-50">Relaxation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-rui-grey-50">Exploration</span>
              <Zap className="h-4 w-4 text-rui-grey-50" />
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full cursor-pointer"
            style={{
              background: `linear-gradient(to right, #09BE67 0%, #09BE67 ${value}%, #E2E2E7 ${value}%, #E2E2E7 100%)`
            }}
          />
        </div>

        {/* Current selection */}
        <motion.div
          key={getLabel()}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-lg font-bold text-rui-black">{getLabel()}</div>
          <div className="text-sm text-rui-grey-50">{getDescription()}</div>
        </motion.div>

        {/* Visual indicator */}
        <div className="mt-4 flex justify-between">
          {[0, 25, 50, 75, 100].map((mark) => (
            <div
              key={mark}
              className={`h-1.5 w-1.5 rounded-full transition-all ${
                value >= mark ? 'bg-success' : 'bg-rui-grey-20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
