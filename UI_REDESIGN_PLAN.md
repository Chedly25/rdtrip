# RdTrip Premium UI/UX Redesign Plan
## From AI-Generated Look to Revolut-Level Premium Design

---

## 🎯 Design Philosophy & Vision

### Core Principles
1. **Radical Minimalism**: Remove everything that doesn't serve a purpose
2. **Sophisticated Restraint**: Limited color palette with purposeful accents
3. **Micro-Delights**: Subtle animations that feel premium, not flashy
4. **Information Hierarchy**: Clear visual priority without clutter
5. **Consistent Rhythm**: Mathematical spacing and sizing system
6. **Premium Feel**: Quality over quantity in every interaction

### Inspiration References
- **Revolut**: Clean cards, smooth transitions, sophisticated color use
- **Linear**: Beautiful gradients, perfect typography, attention to detail
- **Stripe**: Technical elegance, perfect documentation-style layouts
- **Arc Browser**: Innovative interactions, thoughtful animations
- **Raycast**: Command palette UX, keyboard-first design options

---

## 🎨 1. Design System Foundation

### 1.1 Color System - Monochrome with Strategic Accents

```scss
// Base Palette - Gray Scale (Neutral)
$gray: (
  50: #FAFAFA,   // Backgrounds
  100: #F5F5F5,  // Subtle backgrounds
  200: #E5E5E5,  // Borders, dividers
  300: #D4D4D4,  // Disabled states
  400: #A3A3A3,  // Placeholder text
  500: #737373,  // Secondary text
  600: #525252,  // Body text
  700: #404040,  // Headings
  800: #262626,  // Primary text
  900: #171717,  // Rich black
  950: #0A0A0A   // True black
);

// Brand Colors - Refined & Sophisticated
$brand: (
  primary: #0066FF,    // Electric blue (main CTA)
  primary-dark: #0052CC,
  primary-light: #3384FF,

  success: #00D924,    // Vibrant green
  warning: #FFB800,    // Warm amber
  error: #FF3B3B,      // Soft red
  info: #0066FF,       // Same as primary
);

// Semantic Colors for Agents (Muted & Sophisticated)
$agents: (
  adventure: (
    base: #059669,     // Emerald
    light: #10B981,
    dark: #047857,
    gradient: linear-gradient(135deg, #059669 0%, #10B981 100%)
  ),
  culture: (
    base: #7C3AED,     // Purple
    light: #8B5CF6,
    dark: #6D28D9,
    gradient: linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)
  ),
  food: (
    base: #EA580C,     // Orange
    light: #F97316,
    dark: #DC2626,
    gradient: linear-gradient(135deg, #DC2626 0%, #F97316 100%)
  ),
  hidden-gems: (
    base: #0891B2,     // Cyan
    light: #06B6D4,
    dark: #0E7490,
    gradient: linear-gradient(135deg, #0E7490 0%, #06B6D4 100%)
  )
);

// Dark Mode Palette
$dark: (
  bg-primary: #0A0A0A,
  bg-secondary: #171717,
  bg-tertiary: #262626,
  bg-elevated: #2A2A2A,
  border: #404040,
  text-primary: #FAFAFA,
  text-secondary: #A3A3A3
);
```

### 1.2 Typography System - Premium & Readable

```scss
// Font Stack
$font-display: 'Inter Display', -apple-system, BlinkMacSystemFont, sans-serif;
$font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
$font-mono: 'JetBrains Mono', 'SF Mono', monospace;

// Type Scale - Perfect Fourth (1.333 ratio)
$type-scale: (
  xs: 0.75rem,    // 12px - Captions, labels
  sm: 0.875rem,   // 14px - Secondary text
  base: 1rem,     // 16px - Body text
  md: 1.125rem,   // 18px - Large body
  lg: 1.333rem,   // 21px - H4
  xl: 1.777rem,   // 28px - H3
  2xl: 2.369rem,  // 38px - H2
  3xl: 3.157rem,  // 50px - H1
  4xl: 4.209rem   // 67px - Hero
);

// Line Heights
$line-height: (
  tight: 1.1,     // Headlines
  snug: 1.3,      // Subheadlines
  normal: 1.5,    // Body text
  relaxed: 1.7,   // Readable text
  loose: 2.0      // Spacious text
);

// Font Weights
$font-weight: (
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  black: 900
);

// Letter Spacing
$letter-spacing: (
  tight: -0.025em,   // Headlines
  normal: 0,         // Body
  wide: 0.025em,     // Subheadings
  wider: 0.05em,     // Buttons
  widest: 0.1em     // Labels (uppercase)
);
```

### 1.3 Spacing System - Mathematical Harmony

```scss
// 8-point Grid System
$spacing: (
  0: 0,
  px: 1px,
  0.5: 0.125rem,  // 2px
  1: 0.25rem,     // 4px
  2: 0.5rem,      // 8px
  3: 0.75rem,     // 12px
  4: 1rem,        // 16px
  5: 1.25rem,     // 20px
  6: 1.5rem,      // 24px
  7: 1.75rem,     // 28px
  8: 2rem,        // 32px
  10: 2.5rem,     // 40px
  12: 3rem,       // 48px
  14: 3.5rem,     // 56px
  16: 4rem,       // 64px
  20: 5rem,       // 80px
  24: 6rem,       // 96px
  32: 8rem,       // 128px
  40: 10rem,      // 160px
  48: 12rem,      // 192px
  56: 14rem,      // 224px
  64: 16rem,      // 256px
);

// Layout Containers
$container: (
  xs: 20rem,      // 320px
  sm: 24rem,      // 384px
  md: 28rem,      // 448px
  lg: 32rem,      // 512px
  xl: 36rem,      // 576px
  2xl: 42rem,     // 672px
  3xl: 48rem,     // 768px
  4xl: 56rem,     // 896px
  5xl: 64rem,     // 1024px
  6xl: 72rem,     // 1152px
  7xl: 80rem,     // 1280px
  full: 100%
);
```

### 1.4 Elevation System - Subtle Depth

```scss
// Box Shadows - Subtle and Premium
$shadows: (
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
  sm: '0 2px 4px 0 rgba(0, 0, 0, 0.04)',
  md: '0 4px 8px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 8px 16px -2px rgba(0, 0, 0, 0.08)',
  xl: '0 16px 32px -4px rgba(0, 0, 0, 0.10)',
  2xl: '0 24px 48px -8px rgba(0, 0, 0, 0.12)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',

  // Colored shadows for CTAs
  primary: '0 4px 16px -2px rgba(0, 102, 255, 0.2)',
  success: '0 4px 16px -2px rgba(0, 217, 36, 0.2)',
  error: '0 4px 16px -2px rgba(255, 59, 59, 0.2)',
);

// Border Radius - Smooth curves
$radius: (
  none: 0,
  sm: 0.25rem,    // 4px - Subtle
  md: 0.5rem,     // 8px - Default
  lg: 0.75rem,    // 12px - Cards
  xl: 1rem,       // 16px - Modals
  2xl: 1.5rem,    // 24px - Large cards
  3xl: 2rem,      // 32px - Hero elements
  full: 9999px    // Pills
);
```

### 1.5 Animation System - Smooth & Natural

```scss
// Timing Functions - Natural feel
$easing: (
  linear: linear,
  ease: cubic-bezier(0.25, 0.1, 0.25, 1),
  ease-in: cubic-bezier(0.42, 0, 1, 1),
  ease-out: cubic-bezier(0, 0, 0.58, 1),
  ease-in-out: cubic-bezier(0.42, 0, 0.58, 1),

  // Custom easings
  spring: cubic-bezier(0.34, 1.56, 0.64, 1),
  spring-soft: cubic-bezier(0.43, 0.09, 0.38, 1.1),
  bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55),
  smooth: cubic-bezier(0.23, 1, 0.32, 1),
);

// Duration Scale
$duration: (
  instant: 50ms,
  fast: 150ms,
  normal: 250ms,
  slow: 350ms,
  slower: 500ms,
  slowest: 750ms
);

// Predefined Animations
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes shimmer {
  from {
    background-position: -200% center;
  }
  to {
    background-position: 200% center;
  }
}
```

---

## 🧩 2. Component Library Redesign

### 2.1 Button Components

```tsx
// Button variants following Revolut's clean style
const ButtonVariants = {
  primary: {
    base: "bg-gray-900 text-white hover:bg-gray-800",
    dark: "bg-white text-gray-900 hover:bg-gray-100"
  },
  secondary: {
    base: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    dark: "bg-gray-800 text-white hover:bg-gray-700"
  },
  ghost: {
    base: "bg-transparent text-gray-700 hover:bg-gray-100",
    dark: "bg-transparent text-gray-300 hover:bg-gray-800"
  },
  outline: {
    base: "border border-gray-200 bg-transparent text-gray-900 hover:bg-gray-50",
    dark: "border border-gray-700 bg-transparent text-white hover:bg-gray-900"
  }
};

// Size variants
const ButtonSizes = {
  xs: "px-3 py-1.5 text-xs",
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-2.5 text-base",
  lg: "px-8 py-3 text-lg",
  xl: "px-10 py-4 text-xl"
};

// Refined button with micro-animations
const PremiumButton = `
  relative overflow-hidden
  font-medium tracking-wide
  rounded-xl
  transition-all duration-200 ease-out
  transform active:scale-[0.98]
  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900
  disabled:opacity-50 disabled:cursor-not-allowed

  // Ripple effect on click
  before:absolute before:inset-0
  before:bg-white before:opacity-0
  hover:before:opacity-10
  before:transition-opacity before:duration-300
`;
```

### 2.2 Card Components

```tsx
// Card system with glass morphism
const CardVariants = {
  flat: {
    base: "bg-white border border-gray-200",
    dark: "bg-gray-900 border border-gray-800"
  },
  elevated: {
    base: "bg-white shadow-lg",
    dark: "bg-gray-900 shadow-2xl shadow-black/20"
  },
  glass: {
    base: "bg-white/80 backdrop-blur-xl border border-gray-200/50",
    dark: "bg-gray-900/80 backdrop-blur-xl border border-gray-800/50"
  },
  gradient: {
    base: "bg-gradient-to-br from-gray-50 to-white border border-gray-200",
    dark: "bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700"
  }
};

// Interactive card with smooth hover
const InteractiveCard = `
  group
  rounded-2xl p-6
  transition-all duration-300 ease-out
  hover:shadow-xl hover:-translate-y-1
  cursor-pointer

  // Subtle border glow on hover
  relative before:absolute before:inset-0
  before:rounded-2xl before:p-[1px]
  before:bg-gradient-to-br before:from-gray-200 before:to-transparent
  before:opacity-0 hover:before:opacity-100
  before:transition-opacity before:duration-300
`;
```

### 2.3 Input Components

```tsx
// Premium input field design
const InputStyles = `
  w-full px-4 py-3
  bg-gray-50 border border-gray-200
  rounded-xl
  text-gray-900 placeholder-gray-400
  transition-all duration-200 ease-out

  focus:bg-white
  focus:border-gray-900
  focus:outline-none
  focus:ring-2 focus:ring-gray-900/10

  hover:border-gray-300

  // Subtle inner shadow
  shadow-inner shadow-gray-100/50
`;

// Floating label input
const FloatingLabelInput = `
  <div class="relative">
    <input class="peer pt-6 pb-2" placeholder=" "/>
    <label class="
      absolute left-4 top-4
      text-gray-500 text-sm
      transition-all duration-200
      peer-placeholder-shown:top-4 peer-placeholder-shown:text-base
      peer-focus:top-2 peer-focus:text-xs peer-focus:text-gray-900
    ">
      Label
    </label>
  </div>
`;
```

### 2.4 Navigation Components

```tsx
// Sticky navigation with blur
const PremiumNavigation = `
  fixed top-0 left-0 right-0 z-50
  bg-white/80 backdrop-blur-xl
  border-b border-gray-200/50

  // Smooth scroll hide/show
  transition-transform duration-300 ease-out
  translate-y-0 // or -translate-y-full when hidden

  // Shadow on scroll
  shadow-sm // increases with scroll
`;

// Navigation items with pill hover
const NavItem = `
  relative px-4 py-2
  text-gray-600 font-medium
  transition-all duration-200

  hover:text-gray-900

  // Pill background on hover
  before:absolute before:inset-0
  before:bg-gray-100 before:rounded-full
  before:scale-x-0 before:scale-y-0
  hover:before:scale-x-100 hover:before:scale-y-100
  before:transition-transform before:duration-300 before:ease-out
`;
```

### 2.5 Modal/Dialog Components

```tsx
// Premium modal with smooth animations
const ModalOverlay = `
  fixed inset-0 z-50
  bg-black/50 backdrop-blur-sm
  animate-fadeIn
`;

const ModalContent = `
  fixed top-1/2 left-1/2 z-50
  -translate-x-1/2 -translate-y-1/2

  bg-white rounded-3xl
  shadow-2xl

  min-w-[400px] max-w-[600px]
  max-h-[85vh] overflow-auto

  animate-scaleIn

  // Custom scrollbar
  scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent
`;
```

---

## 📱 3. Page-by-Page Transformation

### 3.1 Landing Page Redesign

#### Hero Section
```scss
// Remove video background - too busy
// Replace with subtle animated gradient
.hero {
  background: linear-gradient(
    135deg,
    #667eea 0%,
    #764ba2 50%,
    #f093fb 100%
  );
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;

  // Noise texture overlay for depth
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url('data:image/svg+xml,...'); // SVG noise
    opacity: 0.03;
    mix-blend-mode: overlay;
  }
}

// Typography - Clean and bold
.hero-title {
  font-size: clamp(2.5rem, 8vw, 5rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1.1;

  // Gradient text
  background: linear-gradient(to right, #1a1a1a 0%, #4a4a4a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

// CTA Button - Prominent but refined
.hero-cta {
  padding: 1rem 2.5rem;
  background: #0066FF;
  color: white;
  border-radius: 9999px;
  font-weight: 600;
  letter-spacing: 0.025em;

  // Subtle glow
  box-shadow:
    0 4px 16px rgba(0, 102, 255, 0.3),
    0 1px 3px rgba(0, 0, 0, 0.1);

  transition: all 0.2s ease-out;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 8px 24px rgba(0, 102, 255, 0.4),
      0 2px 6px rgba(0, 0, 0, 0.1);
  }
}
```

#### Route Form Redesign
```scss
// Clean card design
.route-form-card {
  background: white;
  border-radius: 2rem;
  padding: 3rem;

  // Subtle elevation
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.04),
    0 8px 32px rgba(0, 0, 0, 0.06);
}

// City selector - Refined autocomplete
.city-selector {
  // Remove border, use background
  .input {
    border: none;
    background: #F5F5F5;

    &:focus {
      background: #EBEBEB;
      box-shadow: inset 0 0 0 2px #0066FF;
    }
  }

  // Dropdown with smooth animation
  .dropdown {
    margin-top: 0.5rem;
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);

    // Slide down animation
    animation: slideDown 0.2s ease-out;
  }
}

// Trip pace - Icon buttons with smooth selection
.pace-selector {
  display: flex;
  gap: 1rem;
  padding: 0.25rem;
  background: #F5F5F5;
  border-radius: 1rem;

  .pace-option {
    flex: 1;
    padding: 1rem;
    border-radius: 0.75rem;
    transition: all 0.2s ease-out;

    &:hover {
      background: white;
    }

    &.selected {
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transform: scale(1.02);
    }
  }
}

// Duration slider - Premium feel
.duration-slider {
  // Custom track
  input[type="range"] {
    -webkit-appearance: none;
    height: 6px;
    background: #F5F5F5;
    border-radius: 3px;

    // Progress fill
    background-image: linear-gradient(
      to right,
      #0066FF 0%,
      #0066FF var(--value),
      #F5F5F5 var(--value)
    );

    // Custom thumb
    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 24px;
      height: 24px;
      background: white;
      border: 2px solid #0066FF;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.2s;

      &:hover {
        box-shadow:
          0 0 0 8px rgba(0, 102, 255, 0.1),
          0 2px 8px rgba(0, 0, 0, 0.2);
      }
    }
  }
}

// Agent selector - Clean cards
.agent-card {
  position: relative;
  padding: 1.5rem;
  background: white;
  border: 2px solid #E5E5E5;
  border-radius: 1rem;
  transition: all 0.2s ease-out;

  &:hover {
    border-color: #D4D4D4;
    transform: translateY(-2px);
  }

  &.selected {
    border-color: #0066FF;
    background: #F0F7FF;

    // Checkmark animation
    .checkmark {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      width: 1.5rem;
      height: 1.5rem;
      background: #0066FF;
      border-radius: 50%;

      animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
  }
}
```

### 3.2 Results Display Redesign

```scss
// Tab navigation - Pill style
.agent-tabs {
  display: flex;
  gap: 0.5rem;
  padding: 0.25rem;
  background: #F5F5F5;
  border-radius: 9999px;

  .tab {
    flex: 1;
    padding: 0.75rem 1.5rem;
    border-radius: 9999px;
    font-weight: 500;
    color: #737373;
    transition: all 0.2s ease-out;

    &:hover {
      color: #404040;
    }

    &.active {
      background: white;
      color: #171717;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }
}

// City cards - Refined design
.city-card {
  background: white;
  border-radius: 1.5rem;
  overflow: hidden;
  transition: all 0.3s ease-out;

  // Image container with parallax
  .image-container {
    position: relative;
    height: 200px;
    overflow: hidden;

    img {
      width: 100%;
      height: 120%;
      object-fit: cover;
      transition: transform 0.6s ease-out;
    }

    // Subtle gradient overlay
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to bottom,
        transparent 0%,
        rgba(0, 0, 0, 0.3) 100%
      );
    }
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);

    img {
      transform: scale(1.05);
    }
  }

  // Content area
  .content {
    padding: 1.5rem;

    .city-name {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .highlights {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-top: 1rem;

      .highlight-pill {
        padding: 0.25rem 0.75rem;
        background: #F5F5F5;
        border-radius: 9999px;
        font-size: 0.875rem;
        color: #525252;
      }
    }
  }
}

// Budget display - Clean data viz
.budget-display {
  background: #FAFAFA;
  border-radius: 1rem;
  padding: 1.5rem;

  .total {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
  }

  .breakdown {
    .category {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid #E5E5E5;

      &:last-child {
        border-bottom: none;
      }

      .label {
        color: #737373;
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .icon {
          width: 1.25rem;
          height: 1.25rem;
          color: #A3A3A3;
        }
      }

      .amount {
        font-weight: 600;
        color: #171717;
      }
    }
  }
}
```

### 3.3 Map/Spotlight Page Redesign

```scss
// Clean header bar
.spotlight-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: white/90;
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  z-index: 40;

  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;

  // Tab switcher
  .view-tabs {
    display: flex;
    gap: 0.25rem;
    padding: 0.25rem;
    background: #F5F5F5;
    border-radius: 0.75rem;

    button {
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-weight: 500;
      color: #737373;
      transition: all 0.2s;

      &.active {
        background: white;
        color: #171717;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
    }
  }
}

// Map styling
.map-container {
  position: relative;
  height: calc(100vh - 64px);

  // Custom map style (Mapbox Studio)
  // Use monochrome base with accent colors for markers
}

// Floating city cards - Glass morphism
.floating-sidebar {
  position: absolute;
  top: 1rem;
  left: 1rem;
  bottom: 1rem;
  width: 360px;

  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 1.5rem;

  overflow-y: auto;
  padding: 1.5rem;

  // Custom scrollbar
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #D4D4D4;
    border-radius: 3px;
  }

  .city-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .city-item {
      padding: 1rem;
      background: white;
      border-radius: 1rem;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        transform: translateX(4px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      }

      &.active {
        border: 2px solid #0066FF;
        background: #F0F7FF;
      }
    }
  }
}

// Custom markers
.city-marker {
  width: 32px;
  height: 32px;
  background: white;
  border: 3px solid #0066FF;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);

  display: flex;
  align-items: center;
  justify-content: center;

  font-weight: 700;
  color: #0066FF;

  transition: all 0.2s;

  &:hover {
    transform: scale(1.2);
    box-shadow: 0 6px 20px rgba(0, 102, 255, 0.4);
  }
}

.landmark-marker {
  width: 24px;
  height: 24px;
  background: #F5F5F5;
  border: 2px solid #A3A3A3;
  border-radius: 0.5rem;

  &.restaurant {
    background: #FFF4E6;
    border-color: #F97316;
  }

  &.activity {
    background: #E6F4FF;
    border-color: #0066FF;
  }

  &.scenic {
    background: #E6FFE6;
    border-color: #00D924;
  }
}
```

### 3.4 Itinerary View Redesign

```scss
// Clean timeline layout
.itinerary-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;

  .day-section {
    position: relative;
    margin-bottom: 3rem;

    // Timeline line
    &::before {
      content: '';
      position: absolute;
      left: 2rem;
      top: 3rem;
      bottom: -3rem;
      width: 2px;
      background: #E5E5E5;
    }

    &:last-child::before {
      display: none;
    }
  }

  .day-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;

    .day-number {
      width: 4rem;
      height: 4rem;
      background: white;
      border: 2px solid #E5E5E5;
      border-radius: 50%;

      display: flex;
      align-items: center;
      justify-content: center;

      font-weight: 700;
      font-size: 1.25rem;

      position: relative;
      z-index: 1;
    }

    .day-info {
      .date {
        font-weight: 600;
        font-size: 1.125rem;
        color: #171717;
      }

      .city {
        color: #737373;
        font-size: 0.875rem;
      }
    }
  }

  .time-blocks {
    margin-left: 5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;

    .time-block {
      .time-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #737373;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.75rem;
      }

      .activities {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
      }
    }
  }
}

// Activity cards - Compact and clean
.activity-card {
  background: white;
  border: 1px solid #E5E5E5;
  border-radius: 1rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #D4D4D4;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .activity-image {
    width: 100%;
    height: 100px;
    object-fit: cover;
    border-radius: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .activity-name {
    font-weight: 600;
    font-size: 0.875rem;
    color: #171717;
    margin-bottom: 0.25rem;
  }

  .activity-duration {
    font-size: 0.75rem;
    color: #737373;

    display: flex;
    align-items: center;
    gap: 0.25rem;

    .icon {
      width: 0.875rem;
      height: 0.875rem;
    }
  }
}

// Restaurant cards
.restaurant-card {
  @extend .activity-card;

  .rating {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-top: 0.5rem;

    .stars {
      color: #FFB800;
    }

    .price {
      margin-left: auto;
      color: #737373;
      font-size: 0.75rem;
    }
  }
}
```

---

## 🎭 4. Animation & Interaction Design

### 4.1 Micro-Interactions

```javascript
// Page transitions with FLIP animation
const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] }
};

// Stagger children animations
const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

// Smooth scroll with momentum
const smoothScroll = {
  behavior: 'smooth',
  block: 'start',
  inline: 'nearest'
};

// Hover effects
const hoverScale = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { type: "spring", stiffness: 400, damping: 17 }
};

// Loading states
const shimmerAnimation = {
  backgroundImage: 'linear-gradient(90deg, #f0f0f0 0%, #f8f8f8 50%, #f0f0f0 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s ease-in-out infinite'
};

// Success animations
const successPulse = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.9, 1],
  },
  transition: {
    duration: 0.3,
    repeat: 2,
    repeatType: "reverse"
  }
};
```

### 4.2 Loading & Skeleton States

```tsx
// Skeleton component
const Skeleton = ({ className }) => (
  <div className={cn(
    "relative overflow-hidden bg-gray-100 rounded-lg",
    "before:absolute before:inset-0",
    "before:bg-gradient-to-r before:from-transparent before:via-gray-200/60 before:to-transparent",
    "before:-translate-x-full before:animate-shimmer",
    className
  )} />
);

// Loading patterns
const LoadingCard = () => (
  <div className="p-6 space-y-4">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <div className="flex gap-2 mt-4">
      <Skeleton className="h-8 w-20 rounded-full" />
      <Skeleton className="h-8 w-20 rounded-full" />
    </div>
  </div>
);

// Progress indicator
const ProgressBar = ({ value }) => (
  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
    <motion.div
      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
      initial={{ width: 0 }}
      animate={{ width: `${value}%` }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    />
  </div>
);
```

### 4.3 Gesture Controls

```javascript
// Swipe gestures for mobile
const swipeHandlers = {
  onSwipedLeft: () => nextSlide(),
  onSwipedRight: () => prevSlide(),
  preventDefaultTouchmoveEvent: true,
  trackMouse: true
};

// Drag to dismiss
const dragConstraints = {
  drag: "y",
  dragConstraints: { top: 0, bottom: 300 },
  dragElastic: 0.2,
  onDragEnd: (e, { offset }) => {
    if (offset.y > 100) dismiss();
  }
};

// Pinch to zoom on map
const pinchZoom = {
  minScale: 0.5,
  maxScale: 3,
  wheelZoom: true,
  pinchZoom: true,
  doubleClickZoom: true
};

// Pull to refresh
const pullToRefresh = {
  threshold: 150,
  onRefresh: async () => {
    await refetchData();
  },
  resistance: 2.5
};
```

---

## 🚀 5. Implementation Strategy

### Phase 1: Foundation (Week 1-2)
1. **Design System Setup**
   - Create shared design tokens file
   - Set up CSS variables for theming
   - Configure Tailwind with custom theme
   - Create base component library

2. **Typography & Color System**
   - Implement Inter font with proper weights
   - Set up color palette with CSS variables
   - Create dark mode toggle and theming
   - Test color contrast for accessibility

3. **Component Library Core**
   - Build Button, Card, Input components
   - Create Modal, Tooltip, Dropdown
   - Implement loading states and skeletons
   - Add animation utilities

### Phase 2: Landing Page (Week 3-4)
1. **Navigation & Hero**
   - Redesign sticky navigation with blur
   - Replace video with gradient hero
   - Add smooth scroll animations
   - Implement mobile menu

2. **Route Form Overhaul**
   - Redesign city selector with better UX
   - Create new pace/duration selectors
   - Update agent cards with smooth selection
   - Add form validation with inline errors

3. **Results Display**
   - Redesign city cards with hover effects
   - Create new budget visualization
   - Update timeline component
   - Add smooth tab transitions

### Phase 3: Map & Itinerary (Week 5-6)
1. **Map Interface**
   - Custom Mapbox style (monochrome)
   - Redesign markers and interactions
   - Add floating sidebar with glass effect
   - Implement smooth pan/zoom

2. **Itinerary View**
   - Create timeline-based layout
   - Redesign activity/restaurant cards
   - Add day navigation
   - Implement drag-and-drop reordering

3. **Generation Experience**
   - Redesign loading animations
   - Create celebration on completion
   - Add progress visualization
   - Implement error states

### Phase 4: Polish & Optimization (Week 7-8)
1. **Performance**
   - Code splitting by route
   - Image optimization and lazy loading
   - Bundle size optimization
   - Implement virtual scrolling

2. **Accessibility**
   - Keyboard navigation
   - Screen reader support
   - Focus management
   - Color contrast verification

3. **Mobile Experience**
   - Responsive breakpoints
   - Touch gestures
   - Mobile-specific interactions
   - PWA capabilities

4. **Testing & Refinement**
   - Cross-browser testing
   - Performance profiling
   - User testing
   - Bug fixes and polish

---

## 📊 Success Metrics

### Performance Targets
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1
- **Bundle Size**: < 200KB (initial)

### User Experience Metrics
- **Task Completion Rate**: > 95%
- **Error Rate**: < 2%
- **User Satisfaction**: > 4.5/5
- **Mobile Usage**: > 60%

### Design Quality Indicators
- Consistent spacing (8px grid)
- Smooth animations (60fps)
- Color contrast (WCAG AA)
- Typography hierarchy (clear)

---

## 🎯 Key Differentiators

### What Makes This Premium
1. **Restraint**: Less is more - remove unnecessary elements
2. **Consistency**: Every element follows the same design language
3. **Performance**: Blazing fast with smooth animations
4. **Details**: Micro-interactions that delight
5. **Accessibility**: Works for everyone
6. **Modern**: Uses latest design trends thoughtfully

### Avoid These Common Pitfalls
- Over-animating (keep it subtle)
- Too many colors (monochrome + accent)
- Inconsistent spacing (stick to the grid)
- Generic shadows (use subtle, purposeful depth)
- Cluttered layouts (embrace whitespace)
- Slow interactions (optimize everything)

---

## 🔧 Technical Implementation Notes

### Required Dependencies
```json
{
  "framer-motion": "^11.0.0",
  "clsx": "^2.1.0",
  "tailwind-merge": "^2.2.0",
  "@radix-ui/react-*": "latest",
  "react-intersection-observer": "^9.5.0",
  "react-use-gesture": "^9.1.0",
  "lottie-react": "^2.4.0"
}
```

### Tailwind Config Extensions
```javascript
module.exports = {
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'pulse-soft': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
      backdropBlur: {
        xs: '2px',
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('tailwind-scrollbar'),
  ]
}
```

---

This comprehensive plan provides a clear roadmap to transform your travel planning website into a premium, Revolut-level experience. The key is maintaining discipline in the implementation - resist the urge to add unnecessary elements and focus on perfecting the essentials.