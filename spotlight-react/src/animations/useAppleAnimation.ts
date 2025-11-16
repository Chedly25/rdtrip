/**
 * useAppleAnimation - Reusable Animation Hooks
 * Phase 0: Animation System
 */

import { useState, useCallback } from 'react';
import { useAnimation } from 'framer-motion';
import { appleSpring } from './apple-springs';
import { createLiftEffect, createPressEffect } from './macOS-transitions';

/**
 * useHoverLift - Apple-style hover lift effect
 *
 * Returns handlers for hover state and animation values
 *
 * Usage:
 * ```tsx
 * const { hoverProps, isHovered } = useHoverLift();
 * <motion.div {...hoverProps}>Card</motion.div>
 * ```
 */
export function useHoverLift(liftDistance?: number) {
  const [isHovered, setIsHovered] = useState(false);

  const hoverProps = {
    whileHover: createLiftEffect(liftDistance),
    whileTap: createPressEffect(),
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };

  return {
    isHovered,
    hoverProps,
  };
}

/**
 * useSequentialAnimation - Trigger animations in sequence
 *
 * Useful for multi-step animations (e.g., fly-to-itinerary)
 *
 * Usage:
 * ```tsx
 * const controls = useSequentialAnimation();
 * await controls.start({ x: 100 });
 * await controls.start({ y: 200 });
 * ```
 */
export function useSequentialAnimation() {
  const controls = useAnimation();

  const runSequence = useCallback(
    async (steps: Array<{ [key: string]: any }>) => {
      for (const step of steps) {
        await controls.start({
          ...step,
          transition: appleSpring.snappy,
        });
      }
    },
    [controls]
  );

  return {
    controls,
    runSequence,
  };
}

/**
 * useStaggeredList - Stagger animation for list items
 *
 * Returns custom prop for each list item based on index
 *
 * Usage:
 * ```tsx
 * const getItemProps = useStaggeredList();
 * {items.map((item, i) => (
 *   <motion.div key={i} {...getItemProps(i)}>
 *     {item}
 *   </motion.div>
 * ))}
 * ```
 */
export function useStaggeredList(delay: number = 0.05) {
  const getItemProps = useCallback(
    (index: number) => ({
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: {
        ...appleSpring.snappy,
        delay: index * delay,
      },
    }),
    [delay]
  );

  return getItemProps;
}

/**
 * useSpringValue - Animated value with spring physics
 *
 * Returns a value that animates with spring physics
 *
 * Usage:
 * ```tsx
 * const scale = useSpringValue(1);
 * // Later: scale.set(1.2)
 * <motion.div style={{ scale }}>Content</motion.div>
 * ```
 */
export function useSpringValue(initialValue: number) {
  const controls = useAnimation();
  const [value, setValue] = useState(initialValue);

  const set = useCallback(
    (newValue: number) => {
      setValue(newValue);
      controls.start({
        scale: newValue,
        transition: appleSpring.snappy,
      });
    },
    [controls]
  );

  return {
    value,
    set,
    controls,
  };
}
