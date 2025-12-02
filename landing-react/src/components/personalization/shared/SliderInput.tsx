/**
 * Slider Input
 *
 * An elegant range slider with custom styling and labels.
 * Features smooth animations and warm editorial design.
 *
 * Design: Taupe track, terracotta→gold gradient active track, white thumb with terracotta border
 */

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 30 }

interface SliderLabel {
  value: number
  label: string
  description?: string
}

interface SliderInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  labels?: SliderLabel[]
  showLabelsBelow?: boolean
  showCurrentLabel?: boolean
  className?: string
  ariaLabel?: string
}

export function SliderInput({
  value,
  onChange,
  min = 1,
  max = 5,
  step = 1,
  labels = [],
  showLabelsBelow = true,
  showCurrentLabel = true,
  className = '',
  ariaLabel = 'Slider',
}: SliderInputProps) {
  const [isDragging, setIsDragging] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  // Calculate percentage for thumb position and fill
  const percentage = ((value - min) / (max - min)) * 100

  // Find current label
  const currentLabel = labels.find((l) => l.value === value)

  // Handle track click
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    const newValue = Math.round((percentage * (max - min) + min) / step) * step
    onChange(Math.max(min, Math.min(max, newValue)))
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault()
        onChange(Math.min(max, value + step))
        break
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault()
        onChange(Math.max(min, value - step))
        break
      case 'Home':
        e.preventDefault()
        onChange(min)
        break
      case 'End':
        e.preventDefault()
        onChange(max)
        break
    }
  }

  // Handle drag
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!trackRef.current) return
      const rect = trackRef.current.getBoundingClientRect()
      const moveX = e.clientX - rect.left
      const percentage = moveX / rect.width
      const newValue = Math.round((percentage * (max - min) + min) / step) * step
      onChange(Math.max(min, Math.min(max, newValue)))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, min, max, step, onChange])

  return (
    <div className={`w-full ${className}`}>
      {/* Current value label */}
      {showCurrentLabel && currentLabel && (
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mb-3 text-center"
        >
          <span
            className="text-sm font-semibold sm:text-base"
            style={{
              color: '#2C2417',
              fontFamily: "var(--font-display, 'Fraunces', Georgia, serif)",
            }}
          >
            {currentLabel.label}
          </span>
          {currentLabel.description && (
            <p
              className="mt-0.5 text-[11px] sm:text-xs"
              style={{ color: '#8B7355' }}
            >
              {currentLabel.description}
            </p>
          )}
        </motion.div>
      )}

      {/* Slider Track */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="relative h-2 cursor-pointer rounded-full sm:h-2.5"
        style={{ background: '#E5DDD0' }}
        role="slider"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {/* Active track fill */}
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #C45830 0%, #D4A853 100%)',
          }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        />

        {/* Thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
          style={{ left: `${percentage}%` }}
          animate={{
            scale: isDragging ? 1.15 : 1,
            x: '-50%',
          }}
          transition={springTransition}
          onMouseDown={() => setIsDragging(true)}
        >
          <div
            className="h-5 w-5 rounded-full shadow-lg sm:h-6 sm:w-6"
            style={{
              background: '#FFFBF5',
              border: '3px solid #C45830',
              boxShadow: isDragging
                ? '0 4px 12px rgba(196, 88, 48, 0.3)'
                : '0 2px 8px rgba(44, 36, 23, 0.15)',
            }}
          />
        </motion.div>

        {/* Step markers */}
        {Array.from({ length: max - min + 1 }).map((_, i) => {
          const markerValue = min + i
          const markerPercentage = ((markerValue - min) / (max - min)) * 100
          const isActive = markerValue <= value

          return (
            <div
              key={markerValue}
              className="absolute top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors sm:h-1.5 sm:w-1.5"
              style={{
                left: `${markerPercentage}%`,
                background: isActive ? '#FFFBF5' : '#C9B89C',
                opacity: markerPercentage === 0 || markerPercentage === 100 ? 0 : 1,
              }}
            />
          )
        })}
      </div>

      {/* Labels below */}
      {showLabelsBelow && labels.length > 0 && (
        <div className="mt-2 flex justify-between px-1">
          {labels.map((label) => (
            <button
              key={label.value}
              type="button"
              onClick={() => onChange(label.value)}
              className={`
                text-[10px] font-medium transition-colors sm:text-[11px]
                ${label.value === value ? '' : 'hover:opacity-80'}
              `}
              style={{
                color: label.value === value ? '#C45830' : '#8B7355',
              }}
            >
              {label.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default SliderInput
