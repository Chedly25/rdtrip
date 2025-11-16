/**
 * Design System Test Page
 * Phase 0: Verify all Apple-grade components render correctly
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Button,
  GlassPanel,
  Card,
  Input,
  Heading,
  Text,
  supportsGlassmorphism
} from '../components/design-system';
import { macOSOpen } from '../animations/macOS-transitions';
import { useHoverLift, useStaggeredList } from '../animations/useAppleAnimation';

export function DesignSystemTest() {
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const { hoverProps: cardHoverProps, isHovered: cardHovered } = useHoverLift(12);
  const getStaggerProps = useStaggeredList(0.08);

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const testItems = [
    'Component system',
    'Animation presets',
    'Glassmorphism effects',
    'Typography hierarchy',
    'Interactive states'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <Heading level={1}>RDTrip Design System</Heading>
        <Text variant="body" className="text-gray-600 mt-2">
          Apple-grade components with 60fps animations
        </Text>
        <div className="mt-4 flex items-center gap-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            supportsGlassmorphism()
              ? 'bg-green-100 text-green-700'
              : 'bg-orange-100 text-orange-700'
          }`}>
            {supportsGlassmorphism() ? '✓ Glassmorphism Supported' : '⚠ Glassmorphism Fallback Active'}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Buttons Section */}
        <Card variant="standard" padding={6}>
          <Heading level={3} className="mb-6">Button Variants</Heading>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" size="sm">Primary Small</Button>
              <Button variant="primary" size="md">Primary Medium</Button>
              <Button variant="primary" size="lg">Primary Large</Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" size="md">Secondary</Button>
              <Button variant="ghost" size="md">Ghost</Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" loading={loading} onClick={handleLoadingDemo}>
                {loading ? 'Loading...' : 'Show Loading'}
              </Button>
              <Button variant="secondary" disabled>Disabled</Button>
            </div>
          </div>
        </Card>

        {/* Glass Panel Section */}
        <GlassPanel blur="lg" opacity={0.8}>
          <Heading level={3} className="mb-4">Glassmorphism Panel</Heading>
          <Text variant="body" className="mb-4">
            Frosted glass effect with backdrop-filter blur(20px) and saturate(180%).
            Hardware-accelerated for 60fps performance.
          </Text>
          <div className="space-y-3">
            <GlassPanel blur="sm" opacity={0.6}>
              <Text variant="caption">Small blur variant</Text>
            </GlassPanel>
            <GlassPanel blur="md" opacity={0.7}>
              <Text variant="caption">Medium blur variant</Text>
            </GlassPanel>
            <GlassPanel blur="lg" opacity={0.8}>
              <Text variant="caption">Large blur variant (default)</Text>
            </GlassPanel>
          </div>
        </GlassPanel>

        {/* Card Variants */}
        <Card variant="standard" padding={6}>
          <Heading level={3} className="mb-6">Card Components</Heading>
          <div className="space-y-4">
            <Card variant="standard" hoverable>
              <Text variant="body">Standard Card (Hoverable)</Text>
              <Text variant="caption" className="text-gray-500 mt-1">
                Hover to see lift effect with shadow
              </Text>
            </Card>
            <Card variant="glass" hoverable>
              <Text variant="body">Glass Card (Hoverable)</Text>
              <Text variant="caption" className="text-gray-500 mt-1">
                Frosted glass variant with blur
              </Text>
            </Card>
          </div>
        </Card>

        {/* Typography */}
        <Card variant="standard" padding={6}>
          <Heading level={3} className="mb-6">Typography System</Heading>
          <div className="space-y-4">
            <div>
              <Heading level={1}>Heading 1</Heading>
              <Text variant="caption" className="text-gray-500">48px - Page titles</Text>
            </div>
            <div>
              <Heading level={2}>Heading 2</Heading>
              <Text variant="caption" className="text-gray-500">36px - Section titles</Text>
            </div>
            <div>
              <Heading level={3}>Heading 3</Heading>
              <Text variant="caption" className="text-gray-500">24px - Subsection titles</Text>
            </div>
            <div>
              <Text variant="body">Body Text</Text>
              <Text variant="caption" className="text-gray-500">16px - Main content</Text>
            </div>
            <div>
              <Text variant="caption">Caption Text</Text>
              <Text variant="caption" className="text-gray-500">14px - Secondary info</Text>
            </div>
          </div>
        </Card>

        {/* Form Inputs */}
        <Card variant="standard" padding={6}>
          <Heading level={3} className="mb-6">Form Inputs</Heading>
          <div className="space-y-4">
            <Input
              type="text"
              label="Text Input"
              placeholder="Enter your name"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Input
              type="email"
              label="Email Input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<span>📧</span>}
            />
            <Input
              type="text"
              label="Error State"
              placeholder="Invalid input"
              error="This field is required"
            />
            <Input
              type="text"
              label="Disabled Input"
              placeholder="Cannot edit"
              disabled
            />
          </div>
        </Card>

        {/* Animation Showcase - macOS App Opening */}
        <Card variant="standard" padding={6}>
          <Heading level={3} className="mb-4">macOS Animations</Heading>
          <Text variant="body" className="mb-6 text-gray-600">
            Click to see macOS app opening animation (300ms spring)
          </Text>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            Open Modal
          </Button>

          <AnimatePresence>
            {showModal && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowModal(false)}
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                />

                {/* Modal with macOS opening animation */}
                <motion.div
                  {...macOSOpen}
                  className="fixed inset-x-0 bottom-0 z-50 flex items-end justify-center p-4"
                >
                  <GlassPanel blur="lg" opacity={0.95} className="max-w-md w-full p-8">
                    <Heading level={2} className="mb-4">macOS Animation</Heading>
                    <Text variant="body" className="mb-6">
                      This modal uses the exact animation from macOS app opening:
                      scale(0.95→1) + blur(8px→0) + fade + slide up in 300ms with snappy spring
                    </Text>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                      Close
                    </Button>
                  </GlassPanel>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </Card>

        {/* Staggered List Animation */}
        <Card variant="standard" padding={6}>
          <Heading level={3} className="mb-4">Staggered List Animation</Heading>
          <Text variant="body" className="mb-6 text-gray-600">
            List items animate in sequence with 80ms delay between each
          </Text>
          <div className="space-y-3">
            {testItems.map((item, i) => (
              <motion.div
                key={i}
                {...getStaggerProps(i)}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-semibold text-sm">
                    {i + 1}
                  </div>
                  <Text variant="body">{item}</Text>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Hover Lift Effect */}
        <Card variant="standard" padding={6}>
          <Heading level={3} className="mb-4">Hover Lift Effect</Heading>
          <Text variant="body" className="mb-6 text-gray-600">
            Apple-style hover interaction with useHoverLift hook
          </Text>
          <motion.div
            {...cardHoverProps}
            className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-8 text-white cursor-pointer"
          >
            <Heading level={3} className="text-white mb-2">Interactive Card</Heading>
            <Text variant="body" className="text-white/90">
              {cardHovered ? '↑ Lifting with spring animation!' : 'Hover over me'}
            </Text>
          </motion.div>
        </Card>

        {/* Animation Performance Specs */}
        <Card variant="glass" padding={6} className="lg:col-span-2">
          <Heading level={3} className="mb-4">Performance Specifications</Heading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Text variant="label" className="font-semibold mb-2">GPU-Accelerated</Text>
              <Text variant="caption" className="text-gray-600">
                Only animates transform and opacity for guaranteed 60fps
              </Text>
            </div>
            <div>
              <Text variant="label" className="font-semibold mb-2">Apple Springs</Text>
              <Text variant="caption" className="text-gray-600">
                Smooth (300/30/1), Snappy (400/30/0.8), Bouncy (500/25/0.5)
              </Text>
            </div>
            <div>
              <Text variant="label" className="font-semibold mb-2">macOS Timing</Text>
              <Text variant="caption" className="text-gray-600">
                200-300ms transitions matching Apple Human Interface Guidelines
              </Text>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
