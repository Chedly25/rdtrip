import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// =============================================================================
// PACKING GENERATOR - AI-Powered List Creation
// =============================================================================
// Vintage travel agent desk aesthetic - typewriter, stamps, travel documents
// Guides user through trip details to generate personalized packing lists
// =============================================================================

// Wanderlust Editorial + Trunk color palette
const colors = {
  // Core editorial colors
  terracotta: '#C84B31',
  terracottaLight: '#E85D3B',
  golden: '#D4A574',
  goldenLight: '#E8C39E',
  sage: '#7D8471',
  sageLight: '#9BA18F',
  cream: '#FAF7F2',
  espresso: '#2C1810',

  // Trunk-specific
  leather: '#8B4513',
  leatherLight: '#A0522D',
  leatherDark: '#5D2E0C',
  brass: '#B8860B',
  brassLight: '#DAA520',
  canvas: '#F5F5DC',

  // Typewriter/paper
  paper: '#FFFEF8',
  paperAged: '#F5E6C8',
  inkBlack: '#1A1A1A',
  inkFaded: '#4A4A4A',
  typewriterRed: '#8B0000',
};

// Trip activity options
const activityOptions = [
  { id: 'beach', label: 'Beach & Swimming', icon: '🏖️' },
  { id: 'hiking', label: 'Hiking & Nature', icon: '🥾' },
  { id: 'city', label: 'City Exploration', icon: '🏙️' },
  { id: 'nightlife', label: 'Nightlife & Dining', icon: '🍸' },
  { id: 'adventure', label: 'Adventure Sports', icon: '🧗' },
  { id: 'cultural', label: 'Museums & Culture', icon: '🏛️' },
  { id: 'business', label: 'Business Meetings', icon: '💼' },
  { id: 'romantic', label: 'Romantic Getaway', icon: '💕' },
  { id: 'family', label: 'Family Activities', icon: '👨‍👩‍👧' },
  { id: 'photography', label: 'Photography', icon: '📷' },
  { id: 'wellness', label: 'Spa & Wellness', icon: '🧘' },
  { id: 'winter', label: 'Winter Sports', icon: '⛷️' },
];

// Weather options
const weatherOptions = [
  { id: 'hot', label: 'Hot & Sunny', icon: '☀️', temp: '25°C+' },
  { id: 'warm', label: 'Warm', icon: '🌤️', temp: '18-25°C' },
  { id: 'mild', label: 'Mild', icon: '⛅', temp: '10-18°C' },
  { id: 'cold', label: 'Cold', icon: '❄️', temp: 'Below 10°C' },
  { id: 'rainy', label: 'Rainy', icon: '🌧️', temp: 'Variable' },
  { id: 'mixed', label: 'Mixed/Variable', icon: '🌦️', temp: 'Unpredictable' },
];

// Duration presets
const durationPresets = [
  { days: 3, label: 'Weekend Trip', icon: '📅' },
  { days: 7, label: 'One Week', icon: '📆' },
  { days: 14, label: 'Two Weeks', icon: '🗓️' },
  { days: 30, label: 'Extended Stay', icon: '📋' },
];

interface TripDetails {
  destination: string;
  duration: number;
  weather: string[];
  activities: string[];
  travelers: number;
  specialNeeds: string[];
}

interface PackingGeneratorProps {
  onGenerate: (details: TripDetails) => void;
  isGenerating?: boolean;
  className?: string;
}

// TypewriterText component reserved for future animated text effects

// =============================================================================
// PAPER TEXTURE OVERLAY
// =============================================================================
const PaperTexture: React.FC = () => (
  <div style={{
    position: 'absolute',
    inset: 0,
    background: `
      radial-gradient(ellipse at 100% 0%, rgba(139, 69, 19, 0.05) 0%, transparent 50%),
      radial-gradient(ellipse at 0% 100%, rgba(139, 69, 19, 0.03) 0%, transparent 50%)
    `,
    pointerEvents: 'none',
  }} />
);

// =============================================================================
// TRAVEL STAMP DECORATION
// =============================================================================
const TravelStamp: React.FC<{ destination?: string }> = ({ destination }) => (
  <motion.div
    initial={{ scale: 0, rotate: -30 }}
    animate={{ scale: 1, rotate: -12 }}
    transition={{ type: 'spring', damping: 10, delay: 0.5 }}
    style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      width: '80px',
      height: '80px',
      border: `3px solid ${colors.typewriterRed}`,
      borderRadius: '50%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0.6,
      transform: 'rotate(-12deg)',
    }}
  >
    <span style={{
      fontSize: '8px',
      fontFamily: '"Courier New", monospace',
      color: colors.typewriterRed,
      letterSpacing: '1px',
    }}>
      DEPARTURE
    </span>
    <span style={{
      fontSize: '20px',
      marginTop: '4px',
    }}>
      ✈️
    </span>
    {destination && (
      <span style={{
        fontSize: '7px',
        fontFamily: '"Courier New", monospace',
        color: colors.typewriterRed,
        marginTop: '4px',
        maxWidth: '60px',
        textAlign: 'center',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {destination.toUpperCase()}
      </span>
    )}
  </motion.div>
);

// =============================================================================
// FORM FIELD WRAPPER
// =============================================================================
const FormField: React.FC<{
  label: string;
  hint?: string;
  children: React.ReactNode;
  step: number;
}> = ({ label, hint, children, step }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: step * 0.1 }}
    style={{
      marginBottom: '24px',
    }}
  >
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: '8px',
      marginBottom: '10px',
    }}>
      <span style={{
        fontFamily: '"Courier New", monospace',
        fontSize: '12px',
        color: colors.leather,
        fontWeight: 700,
        letterSpacing: '2px',
      }}>
        {step.toString().padStart(2, '0')}.
      </span>
      <label style={{
        fontFamily: 'Georgia, serif',
        fontSize: '15px',
        fontWeight: 600,
        color: colors.espresso,
      }}>
        {label}
      </label>
    </div>
    {hint && (
      <p style={{
        fontFamily: 'Georgia, serif',
        fontSize: '12px',
        color: colors.sage,
        fontStyle: 'italic',
        marginBottom: '10px',
        marginLeft: '32px',
      }}>
        {hint}
      </p>
    )}
    <div style={{ marginLeft: '32px' }}>
      {children}
    </div>
  </motion.div>
);

// =============================================================================
// TEXT INPUT (TYPEWRITER STYLE)
// =============================================================================
const TypewriterInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}> = ({ value, onChange, placeholder }) => (
  <div style={{
    position: 'relative',
    background: colors.paper,
    borderRadius: '4px',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  }}>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '14px 16px',
        fontFamily: '"Courier New", monospace',
        fontSize: '16px',
        color: colors.inkBlack,
        background: 'transparent',
        border: 'none',
        outline: 'none',
        letterSpacing: '1px',
      }}
    />
    {/* Typewriter underline effect */}
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: value ? '100%' : 0 }}
      style={{
        position: 'absolute',
        bottom: '4px',
        left: '16px',
        right: '16px',
        height: '2px',
        background: `repeating-linear-gradient(90deg, ${colors.inkBlack} 0, ${colors.inkBlack} 8px, transparent 8px, transparent 12px)`,
      }}
    />
  </div>
);

// =============================================================================
// NUMBER SELECTOR (VINTAGE DIAL STYLE)
// =============================================================================
const NumberSelector: React.FC<{
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  presets?: { value: number; label: string; icon: string }[];
}> = ({ value, onChange, min, max, presets }) => (
  <div>
    {/* Presets */}
    {presets && (
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '12px',
        flexWrap: 'wrap',
      }}>
        {presets.map((preset) => (
          <motion.button
            key={preset.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(preset.value)}
            style={{
              padding: '8px 14px',
              background: value === preset.value ? colors.leather : colors.paper,
              border: `1px solid ${value === preset.value ? colors.leather : colors.golden}`,
              borderRadius: '4px',
              fontFamily: '"Courier New", monospace',
              fontSize: '11px',
              color: value === preset.value ? colors.canvas : colors.espresso,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{preset.icon}</span>
            <span>{preset.label}</span>
          </motion.button>
        ))}
      </div>
    )}

    {/* Custom input */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: colors.brass,
          border: 'none',
          color: colors.canvas,
          fontSize: '18px',
          fontWeight: 700,
          cursor: value <= min ? 'not-allowed' : 'pointer',
          opacity: value <= min ? 0.5 : 1,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
        −
      </motion.button>

      <div style={{
        minWidth: '80px',
        textAlign: 'center',
        padding: '8px 16px',
        background: colors.paper,
        borderRadius: '4px',
        border: `1px solid ${colors.golden}`,
      }}>
        <span style={{
          fontFamily: '"Courier New", monospace',
          fontSize: '20px',
          fontWeight: 700,
          color: colors.espresso,
        }}>
          {value}
        </span>
        <span style={{
          fontFamily: 'Georgia, serif',
          fontSize: '11px',
          color: colors.sage,
          marginLeft: '4px',
        }}>
          {value === 1 ? 'day' : 'days'}
        </span>
      </div>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: colors.brass,
          border: 'none',
          color: colors.canvas,
          fontSize: '18px',
          fontWeight: 700,
          cursor: value >= max ? 'not-allowed' : 'pointer',
          opacity: value >= max ? 0.5 : 1,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
        +
      </motion.button>
    </div>
  </div>
);

// =============================================================================
// MULTI-SELECT CHIPS
// =============================================================================
const MultiSelectChips: React.FC<{
  options: { id: string; label: string; icon: string; temp?: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  maxSelect?: number;
}> = ({ options, selected, onChange, maxSelect }) => {
  const toggleOption = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else if (!maxSelect || selected.length < maxSelect) {
      onChange([...selected, id]);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
    }}>
      {options.map((option) => {
        const isSelected = selected.includes(option.id);
        return (
          <motion.button
            key={option.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => toggleOption(option.id)}
            style={{
              padding: '10px 14px',
              background: isSelected
                ? `linear-gradient(135deg, ${colors.leather} 0%, ${colors.leatherLight} 100%)`
                : colors.paper,
              border: `1px solid ${isSelected ? colors.leather : colors.golden}`,
              borderRadius: '6px',
              fontFamily: 'Georgia, serif',
              fontSize: '13px',
              color: isSelected ? colors.canvas : colors.espresso,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: isSelected
                ? '0 2px 8px rgba(139,69,19,0.3)'
                : '0 1px 3px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: '16px' }}>{option.icon}</span>
            <span>{option.label}</span>
            {option.temp && (
              <span style={{
                fontSize: '10px',
                opacity: 0.7,
                fontFamily: '"Courier New", monospace',
              }}>
                ({option.temp})
              </span>
            )}
            {isSelected && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  marginLeft: '4px',
                  fontSize: '12px',
                }}
              >
                ✓
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

// =============================================================================
// GENERATE BUTTON
// =============================================================================
const GenerateButton: React.FC<{
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
}> = ({ onClick, disabled, isLoading }) => (
  <motion.button
    whileHover={disabled ? {} : { scale: 1.02, y: -2 }}
    whileTap={disabled ? {} : { scale: 0.98 }}
    onClick={onClick}
    disabled={disabled || isLoading}
    style={{
      width: '100%',
      padding: '18px 32px',
      background: disabled
        ? colors.sage
        : `linear-gradient(135deg, ${colors.leather} 0%, ${colors.leatherDark} 100%)`,
      border: `2px solid ${disabled ? colors.sage : colors.brass}`,
      borderRadius: '8px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      boxShadow: disabled
        ? 'none'
        : '0 4px 12px rgba(139,69,19,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
    }}
  >
    {isLoading ? (
      <>
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ fontSize: '20px' }}
        >
          ⚙️
        </motion.span>
        <span style={{
          fontFamily: '"Courier New", monospace',
          fontSize: '14px',
          color: colors.canvas,
          letterSpacing: '2px',
          fontWeight: 700,
        }}>
          GENERATING YOUR LIST...
        </span>
      </>
    ) : (
      <>
        <span style={{ fontSize: '20px' }}>🧳</span>
        <span style={{
          fontFamily: '"Courier New", monospace',
          fontSize: '14px',
          color: colors.canvas,
          letterSpacing: '2px',
          fontWeight: 700,
        }}>
          GENERATE PACKING LIST
        </span>
        <span style={{ fontSize: '20px' }}>✨</span>
      </>
    )}
  </motion.button>
);

// =============================================================================
// VALIDATION INDICATOR
// =============================================================================
const ValidationIndicator: React.FC<{
  isValid: boolean;
  message: string;
}> = ({ isValid, message }) => (
  <AnimatePresence>
    {!isValid && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        style={{
          marginTop: '8px',
          padding: '8px 12px',
          background: 'rgba(200, 75, 49, 0.1)',
          borderRadius: '4px',
          borderLeft: `3px solid ${colors.terracotta}`,
        }}
      >
        <p style={{
          fontFamily: '"Courier New", monospace',
          fontSize: '11px',
          color: colors.terracotta,
        }}>
          ⚠ {message}
        </p>
      </motion.div>
    )}
  </AnimatePresence>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const PackingGenerator: React.FC<PackingGeneratorProps> = ({
  onGenerate,
  isGenerating = false,
  className,
}) => {
  const [tripDetails, setTripDetails] = useState<TripDetails>({
    destination: '',
    duration: 7,
    weather: [],
    activities: [],
    travelers: 1,
    specialNeeds: [],
  });

  const updateField = useCallback(<K extends keyof TripDetails>(
    field: K,
    value: TripDetails[K]
  ) => {
    setTripDetails(prev => ({ ...prev, [field]: value }));
  }, []);

  // Validation
  const isDestinationValid = tripDetails.destination.trim().length >= 2;
  const isWeatherValid = tripDetails.weather.length > 0;
  const isActivitiesValid = tripDetails.activities.length > 0;
  const isFormValid = isDestinationValid && isWeatherValid && isActivitiesValid;

  const handleGenerate = () => {
    if (isFormValid) {
      onGenerate(tripDetails);
    }
  };

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        background: `linear-gradient(180deg, ${colors.cream} 0%, ${colors.paperAged} 100%)`,
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        border: `1px solid ${colors.golden}`,
        overflow: 'hidden',
      }}
    >
      <PaperTexture />
      <TravelStamp destination={tripDetails.destination} />

      {/* Header */}
      <div style={{ marginBottom: '32px', position: 'relative' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontSize: '28px' }}>📝</span>
          <h2 style={{
            fontFamily: 'Georgia, serif',
            fontSize: '24px',
            fontWeight: 700,
            color: colors.espresso,
          }}>
            Packing List Generator
          </h2>
        </motion.div>
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: '14px',
          color: colors.sage,
          fontStyle: 'italic',
          marginLeft: '40px',
        }}>
          Tell us about your trip, and we'll create a personalized packing list
        </p>

        {/* Decorative line */}
        <div style={{
          marginTop: '16px',
          height: '2px',
          background: `linear-gradient(90deg, ${colors.brass} 0%, transparent 100%)`,
        }} />
      </div>

      {/* Form Fields */}
      <div style={{ position: 'relative' }}>
        {/* Destination */}
        <FormField
          label="Where are you headed?"
          hint="Enter your destination city or country"
          step={1}
        >
          <TypewriterInput
            value={tripDetails.destination}
            onChange={(v) => updateField('destination', v)}
            placeholder="e.g., Paris, France"
          />
          <ValidationIndicator
            isValid={isDestinationValid || tripDetails.destination.length === 0}
            message="Please enter a destination (at least 2 characters)"
          />
        </FormField>

        {/* Duration */}
        <FormField
          label="How long is your trip?"
          step={2}
        >
          <NumberSelector
            value={tripDetails.duration}
            onChange={(v) => updateField('duration', v)}
            min={1}
            max={90}
            presets={durationPresets.map(p => ({
              value: p.days,
              label: p.label,
              icon: p.icon,
            }))}
          />
        </FormField>

        {/* Weather */}
        <FormField
          label="What's the weather like?"
          hint="Select all that may apply during your trip"
          step={3}
        >
          <MultiSelectChips
            options={weatherOptions}
            selected={tripDetails.weather}
            onChange={(v) => updateField('weather', v)}
          />
          <ValidationIndicator
            isValid={isWeatherValid}
            message="Please select at least one weather condition"
          />
        </FormField>

        {/* Activities */}
        <FormField
          label="What will you be doing?"
          hint="Select the activities you're planning"
          step={4}
        >
          <MultiSelectChips
            options={activityOptions}
            selected={tripDetails.activities}
            onChange={(v) => updateField('activities', v)}
          />
          <ValidationIndicator
            isValid={isActivitiesValid}
            message="Please select at least one activity"
          />
        </FormField>

        {/* Number of Travelers */}
        <FormField
          label="How many travelers?"
          step={5}
        >
          <NumberSelector
            value={tripDetails.travelers}
            onChange={(v) => updateField('travelers', v)}
            min={1}
            max={10}
          />
        </FormField>
      </div>

      {/* Summary Preview */}
      <AnimatePresence>
        {isFormValid && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{
              marginTop: '24px',
              marginBottom: '24px',
              padding: '16px',
              background: colors.paper,
              borderRadius: '6px',
              border: `1px dashed ${colors.golden}`,
            }}
          >
            <p style={{
              fontFamily: '"Courier New", monospace',
              fontSize: '12px',
              color: colors.inkFaded,
              marginBottom: '8px',
              letterSpacing: '1px',
            }}>
              YOUR TRIP SUMMARY:
            </p>
            <p style={{
              fontFamily: 'Georgia, serif',
              fontSize: '14px',
              color: colors.espresso,
              lineHeight: 1.6,
            }}>
              <strong>{tripDetails.duration} days</strong> in{' '}
              <strong>{tripDetails.destination}</strong> for{' '}
              <strong>{tripDetails.travelers} {tripDetails.travelers === 1 ? 'traveler' : 'travelers'}</strong>
              <br />
              Weather: {tripDetails.weather.map(w =>
                weatherOptions.find(o => o.id === w)?.icon
              ).join(' ')}
              <br />
              Activities: {tripDetails.activities.slice(0, 4).map(a =>
                activityOptions.find(o => o.id === a)?.icon
              ).join(' ')}
              {tripDetails.activities.length > 4 && ` +${tripDetails.activities.length - 4} more`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate Button */}
      <GenerateButton
        onClick={handleGenerate}
        disabled={!isFormValid}
        isLoading={isGenerating}
      />

      {/* AI Disclaimer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          marginTop: '16px',
          textAlign: 'center',
          fontFamily: 'Georgia, serif',
          fontSize: '11px',
          color: colors.sage,
          fontStyle: 'italic',
        }}
      >
        ✨ Powered by AI - We'll create a smart, personalized list based on your trip details
      </motion.p>
    </div>
  );
};

export default PackingGenerator;
export type { TripDetails, PackingGeneratorProps };
