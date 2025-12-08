import { motion } from 'framer-motion';
import { Compass, MapPin, Sparkles } from 'lucide-react';
import type { TripSummary } from '../../stores/discoveryStore';

interface DiscoveryLoadingStateProps {
  tripSummary: TripSummary | null;
}

/**
 * DiscoveryLoadingState
 *
 * Beautiful loading screen while fetching suggested cities.
 * Shows animated elements to indicate progress.
 */
export function DiscoveryLoadingState({ tripSummary }: DiscoveryLoadingStateProps) {
  return (
    <div className="min-h-screen bg-rui-cream flex flex-col items-center justify-center p-6">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating pins */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 100 }}
            animate={{
              opacity: [0, 0.3, 0],
              y: [-20, -200],
              x: [0, (i - 2) * 30],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.8,
              ease: 'easeOut',
            }}
            className="absolute bottom-0 left-1/2"
          >
            <MapPin className="w-6 h-6 text-rui-accent/30" />
          </motion.div>
        ))}

        {/* Gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="
            absolute top-1/4 right-1/4
            w-64 h-64 rounded-full
            bg-rui-accent/10 blur-3xl
          "
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="
            absolute bottom-1/4 left-1/4
            w-80 h-80 rounded-full
            bg-rui-sage/10 blur-3xl
          "
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-md">
        {/* Animated compass */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative mx-auto w-24 h-24 mb-8"
        >
          {/* Outer ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="
              absolute inset-0 rounded-full
              border-2 border-dashed border-rui-accent/30
            "
          />

          {/* Inner ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="
              absolute inset-3 rounded-full
              border border-rui-sage/30
            "
          />

          {/* Center icon */}
          <div
            className="
              absolute inset-0 flex items-center justify-center
              bg-rui-accent/10 rounded-full
            "
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Compass className="w-10 h-10 text-rui-accent" />
            </motion.div>
          </div>

          {/* Sparkle accents */}
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="w-5 h-5 text-rui-golden" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-display text-2xl md:text-3xl font-semibold text-rui-black mb-3"
        >
          Discovering your route
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-body-1 text-rui-grey-50 mb-8"
        >
          Finding the perfect stops for your{' '}
          {tripSummary?.totalNights || 'upcoming'}-night adventure
        </motion.p>

        {/* Loading steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <LoadingStep delay={0} text="Analyzing your route" />
          <LoadingStep delay={0.5} text="Finding hidden gems" />
          <LoadingStep delay={1} text="Curating suggestions" />
        </motion.div>
      </div>
    </div>
  );
}

interface LoadingStepProps {
  delay: number;
  text: string;
}

function LoadingStep({ delay, text }: LoadingStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 + delay }}
      className="flex items-center justify-center gap-3"
    >
      {/* Animated dot */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: delay,
        }}
        className="w-2 h-2 rounded-full bg-rui-accent"
      />
      <span className="text-body-2 text-rui-grey-60">{text}</span>
    </motion.div>
  );
}
