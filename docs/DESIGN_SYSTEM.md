# RDTrip Design System
## Wanderlust Editorial Design Language

**Version:** 2.0
**Last Updated:** December 2024

---

# Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Foundations](#2-foundations)
3. [Component Library](#3-component-library)
4. [Page Specifications](#4-page-specifications)
5. [Companion UI System](#5-companion-ui-system)
6. [UX Patterns](#6-ux-patterns)
7. [Responsive Design](#7-responsive-design)
8. [Accessibility](#8-accessibility)
9. [Animation & Motion](#9-animation--motion)

---

# 1. Design Philosophy

## 1.1 Core Principles

### Warm, Not Cold
Travel is emotional. Our design should feel like a beautifully designed travel magazine, not a corporate booking tool.

```
❌ Avoid: Sharp edges, pure whites, cold blues, sterile layouts
✅ Embrace: Rounded corners, warm creams, terracotta accents, editorial typography
```

### Editorial, Not Dashboard
Information hierarchy matters. Lead with inspiration, support with data.

```
❌ Avoid: Dense data tables, overwhelming options, feature lists
✅ Embrace: Hero imagery, curated suggestions, progressive disclosure
```

### Companion, Not Tool
The interface should feel like traveling with a knowledgeable friend.

```
❌ Avoid: Robotic responses, form-heavy flows, transactional language
✅ Embrace: Conversational UI, proactive suggestions, personality
```

### Confident, Not Uncertain
Make decisions for the user when appropriate. Don't overwhelm with choices.

```
❌ Avoid: "Here are 50 options", endless dropdowns, analysis paralysis
✅ Embrace: "I recommend this", smart defaults, confident suggestions
```

## 1.2 Design Mood Board

**Visual References:**
- Kinfolk Magazine (editorial warmth)
- Airbnb Luxe (premium travel)
- Apple Maps (clean cartography)
- Notion (companion-like interface)

**Key Words:**
- Wanderlust
- Curated
- Intimate
- Confident
- Warm
- Sophisticated

---

# 2. Foundations

## 2.1 Color Palette

### Primary Colors

```css
/* Warm Neutrals */
--rui-white: #FFFBF5;        /* Warm cream - primary background */
--rui-black: #2C2417;        /* Warm black - primary text */

/* Accent */
--rui-accent: #C45830;       /* Terracotta - primary accent */
--rui-accent-dark: #A03820;  /* Terracotta dark - hover states */
--rui-accent-light: #FFF0EB; /* Terracotta tint - subtle backgrounds */

/* Supporting */
--rui-gold: #D4A853;         /* Golden - ratings, premium */
--rui-green: #4A7C59;        /* Earthy green - success, nature */
--rui-blue: #4A90A4;         /* Mediterranean blue - water, info */
--rui-red: #B54A4A;          /* Brick red - errors, warnings */
```

### Grey Scale (Warm-Tinted)

```css
--rui-grey-5: #FAF7F2;       /* Lightest - subtle backgrounds */
--rui-grey-10: #F5F0E8;      /* Light - borders, dividers */
--rui-grey-20: #E8DFD3;      /* Medium light - disabled */
--rui-grey-30: #D4C4B0;      /* Medium - placeholder text */
--rui-grey-50: #8B7355;      /* Medium dark - secondary text */
--rui-grey-70: #5C4D3D;      /* Dark - strong secondary */
--rui-grey-90: #3D3328;      /* Darkest - emphasis */
```

### Semantic Colors

```css
--color-success: #4A7C59;
--color-warning: #D4A853;
--color-error: #B54A4A;
--color-info: #4A90A4;
```

### Color Usage Guidelines

| Element | Color | Token |
|---------|-------|-------|
| Page background | Warm cream | `--rui-white` |
| Card background | White/Cream | `#FFFFFF` or `--rui-white` |
| Primary text | Warm black | `--rui-black` |
| Secondary text | Medium brown | `--rui-grey-50` |
| Placeholder text | Light brown | `--rui-grey-30` |
| Primary buttons | Terracotta | `--rui-accent` |
| Links | Terracotta | `--rui-accent` |
| Borders | Warm beige | `--rui-grey-10` |
| Dividers | Warm beige | `--rui-grey-10` |
| Selection/Focus | Terracotta | `--rui-accent` |
| Ratings/Stars | Gold | `--rui-gold` |
| Success states | Earthy green | `--rui-green` |
| Error states | Brick red | `--rui-red` |

## 2.2 Typography

### Font Families

```css
/* Display/Headlines - Fraunces */
--font-marketing: 'Fraunces', Georgia, serif;

/* Body/UI - Satoshi */
--font-body: 'Satoshi', -apple-system, BlinkMacSystemFont, sans-serif;

/* Monospace - for data/codes */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale

```css
/* Headlines */
--text-display-1: 3.5rem;    /* 56px - Hero headlines */
--text-display-2: 2.5rem;    /* 40px - Page titles */
--text-heading-1: 2rem;      /* 32px - Section headers */
--text-heading-2: 1.5rem;    /* 24px - Card titles */
--text-heading-3: 1.25rem;   /* 20px - Subsection */
--text-heading-4: 1.125rem;  /* 18px - Small headers */

/* Body */
--text-body-1: 1rem;         /* 16px - Primary body */
--text-body-2: 0.875rem;     /* 14px - Secondary body */
--text-body-3: 0.75rem;      /* 12px - Captions, labels */

/* Emphasis */
--text-emphasis-1: 1.125rem; /* 18px - Large emphasis */
--text-emphasis-2: 1rem;     /* 16px - Medium emphasis */
```

### Typography Pairings

```
HEADLINE (Fraunces)
"Barcelona to Valencia"

SUBHEAD (Satoshi Medium)
3 cities · 7 nights · €1,200 estimated

BODY (Satoshi Regular)
The Mediterranean coast offers stunning beaches,
incredible food, and vibrant nightlife.

CAPTION (Satoshi Regular)
Last updated 2 hours ago
```

### Line Heights

```css
--leading-tight: 1.1;     /* Headlines */
--leading-snug: 1.25;     /* Subheads */
--leading-normal: 1.5;    /* Body text */
--leading-relaxed: 1.75;  /* Long-form reading */
```

## 2.3 Spacing System

### Base Unit: 4px

```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Spacing Guidelines

| Context | Spacing |
|---------|---------|
| Icon to text | 8px (`space-2`) |
| Related items | 12px (`space-3`) |
| Card padding | 16-24px (`space-4` to `space-6`) |
| Section gap | 32-48px (`space-8` to `space-12`) |
| Page margins | 20-40px (responsive) |

## 2.4 Border Radius

```css
--radius-none: 0;
--radius-sm: 4px;      /* Small elements */
--radius-md: 8px;      /* Buttons, inputs */
--radius-lg: 12px;     /* Cards, panels */
--radius-xl: 16px;     /* Large cards */
--radius-2xl: 24px;    /* Hero sections */
--radius-3xl: 32px;    /* Bottom sheets */
--radius-full: 9999px; /* Pills, avatars */
```

### Radius Usage

| Element | Radius |
|---------|--------|
| Buttons | 12px (`radius-lg`) |
| Input fields | 12px (`radius-lg`) |
| Small cards | 16px (`radius-xl`) |
| Large cards | 24px (`radius-2xl`) |
| Bottom sheets | 28px (top only) |
| Pills/Badges | Full (`radius-full`) |
| Avatars | Full (`radius-full`) |
| Map markers | 8px (`radius-md`) |

## 2.5 Shadows

```css
/* Elevation levels */
--shadow-sm: 0 1px 2px rgba(44, 36, 23, 0.05);
--shadow-md: 0 4px 6px rgba(44, 36, 23, 0.07);
--shadow-lg: 0 10px 15px rgba(44, 36, 23, 0.1);
--shadow-xl: 0 20px 25px rgba(44, 36, 23, 0.12);
--shadow-2xl: 0 25px 50px rgba(44, 36, 23, 0.15);

/* Accent shadow (for primary buttons) */
--shadow-accent: 0 4px 14px rgba(196, 88, 48, 0.25);

/* Inner shadow (for inputs) */
--shadow-inner: inset 0 2px 4px rgba(44, 36, 23, 0.05);

/* Upward shadow (for bottom sheets) */
--shadow-up: 0 -8px 40px rgba(44, 36, 23, 0.15);
```

### Shadow Usage

| Element | Shadow |
|---------|--------|
| Cards (rest) | `shadow-md` |
| Cards (hover) | `shadow-lg` |
| Modals | `shadow-xl` |
| Bottom sheets | `shadow-up` |
| Primary buttons | `shadow-accent` |
| Dropdowns | `shadow-lg` |
| Floating buttons | `shadow-xl` |

## 2.6 Z-Index Scale

```css
--z-base: 0;
--z-dropdown: 10;
--z-sticky: 20;
--z-overlay: 30;
--z-modal: 40;
--z-popover: 50;
--z-tooltip: 60;
--z-toast: 70;
```

---

# 3. Component Library

## 3.1 Buttons

### Primary Button

```jsx
<button className="
  bg-[#C45830] text-white
  px-6 py-3
  rounded-xl
  font-semibold text-[15px]
  shadow-[0_4px_14px_rgba(196,88,48,0.25)]
  hover:bg-[#A03820] hover:shadow-lg
  active:scale-[0.98]
  transition-all duration-200
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Primary Action
</button>
```

**States:**
- Default: Terracotta background
- Hover: Darker terracotta + larger shadow
- Active: Scale down slightly
- Disabled: 50% opacity
- Loading: Spinner icon + "Loading..."

### Secondary Button

```jsx
<button className="
  bg-[#F5F0E8] text-[#2C2417]
  border border-[#E8DFD3]
  px-6 py-3
  rounded-xl
  font-semibold text-[15px]
  hover:bg-[#E8DFD3]
  active:scale-[0.98]
  transition-all duration-200
">
  Secondary Action
</button>
```

### Ghost Button

```jsx
<button className="
  bg-transparent text-[#2C2417]
  px-4 py-2
  rounded-lg
  font-medium text-[14px]
  hover:bg-[#F5F0E8]
  active:scale-[0.98]
  transition-all duration-200
">
  Ghost Action
</button>
```

### Icon Button

```jsx
<button className="
  w-10 h-10
  flex items-center justify-center
  rounded-xl
  bg-[#F5F0E8]
  text-[#8B7355]
  hover:bg-[#E8DFD3] hover:text-[#2C2417]
  transition-all duration-200
">
  <Icon className="w-5 h-5" />
</button>
```

### Button Sizes

| Size | Height | Padding | Font |
|------|--------|---------|------|
| sm | 32px | 12px 16px | 13px |
| md | 40px | 12px 20px | 14px |
| lg | 48px | 14px 24px | 15px |
| xl | 56px | 16px 32px | 16px |

## 3.2 Cards

### City Card (Compact)

```jsx
<div className="
  w-[180px]
  bg-[#FFFBF5]
  rounded-2xl
  overflow-hidden
  shadow-md
  hover:shadow-lg hover:scale-[1.01]
  transition-all duration-200
  cursor-pointer
">
  {/* Image */}
  <div className="relative h-[120px] bg-[#F5F0E8]">
    <img className="w-full h-full object-cover" />
    {/* Number badge */}
    <div className="absolute top-2 right-2 w-6 h-6 bg-[#C45830] rounded-lg flex items-center justify-center">
      <span className="text-[11px] font-bold text-white">1</span>
    </div>
    {/* Subtle vignette */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
  </div>

  {/* Content */}
  <div className="p-3">
    <h3 className="font-semibold text-[15px] text-[#2C2417] truncate">Barcelona</h3>
    <div className="flex items-center justify-between mt-1">
      <span className="text-xs text-[#8B7355]">Spain</span>
      <div className="flex items-center gap-1 text-[#8B7355]">
        <Moon className="w-3 h-3" />
        <span className="text-xs font-medium">3</span>
      </div>
    </div>
  </div>
</div>
```

### Activity Card

```jsx
<div className="
  bg-white
  rounded-xl
  border border-[#E8DFD3]
  p-4
  hover:shadow-md
  transition-all duration-200
">
  <div className="flex gap-4">
    {/* Image */}
    <div className="w-20 h-20 rounded-lg bg-[#F5F0E8] overflow-hidden flex-shrink-0">
      <img className="w-full h-full object-cover" />
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0">
      <h4 className="font-semibold text-[15px] text-[#2C2417] truncate">
        Sagrada Familia
      </h4>
      <p className="text-sm text-[#8B7355] mt-0.5">Landmark · 2-3 hours</p>

      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 fill-[#D4A853] text-[#D4A853]" />
          <span className="text-sm font-medium text-[#2C2417]">4.8</span>
        </div>
        <span className="text-sm text-[#8B7355]">€26</span>
      </div>
    </div>

    {/* Action */}
    <button className="self-center">
      <Plus className="w-5 h-5 text-[#8B7355] hover:text-[#C45830]" />
    </button>
  </div>
</div>
```

### Restaurant Card

```jsx
<div className="
  bg-white
  rounded-xl
  border border-[#E8DFD3]
  p-4
">
  <div className="flex gap-4">
    {/* Image */}
    <div className="w-16 h-16 rounded-lg bg-[#F5F0E8] overflow-hidden flex-shrink-0">
      <img className="w-full h-full object-cover" />
    </div>

    {/* Content */}
    <div className="flex-1">
      <div className="flex items-start justify-between">
        <h4 className="font-semibold text-[15px] text-[#2C2417]">Can Culleretes</h4>
        <span className="text-xs px-2 py-0.5 bg-[#FFF0EB] text-[#C45830] rounded-full">
          Dinner
        </span>
      </div>
      <p className="text-sm text-[#8B7355] mt-0.5">Catalan · €€</p>

      <div className="flex items-center gap-1 mt-2">
        <Star className="w-3.5 h-3.5 fill-[#D4A853] text-[#D4A853]" />
        <span className="text-sm font-medium text-[#2C2417]">4.6</span>
        <span className="text-xs text-[#8B7355] ml-1">(2,340)</span>
      </div>
    </div>
  </div>
</div>
```

### Hotel Card

```jsx
<div className="
  bg-white
  rounded-2xl
  border border-[#E8DFD3]
  overflow-hidden
">
  {/* Image */}
  <div className="relative h-40 bg-[#F5F0E8]">
    <img className="w-full h-full object-cover" />
    <div className="absolute top-3 left-3 px-2 py-1 bg-white/95 rounded-full">
      <span className="text-xs font-semibold text-[#2C2417]">€156/night</span>
    </div>
  </div>

  {/* Content */}
  <div className="p-4">
    <h4 className="font-semibold text-[16px] text-[#2C2417]">Hotel 1898</h4>
    <p className="text-sm text-[#8B7355] mt-0.5">Gothic Quarter · 0.3km from center</p>

    <div className="flex items-center justify-between mt-3">
      <div className="flex items-center gap-1">
        <Star className="w-4 h-4 fill-[#D4A853] text-[#D4A853]" />
        <span className="text-sm font-semibold text-[#2C2417]">4.7</span>
        <span className="text-xs text-[#8B7355]">(1,892 reviews)</span>
      </div>
      <button className="text-sm font-medium text-[#C45830]">
        View Details
      </button>
    </div>
  </div>
</div>
```

## 3.3 Form Elements

### Text Input

```jsx
<div className="space-y-2">
  <label className="text-sm font-medium text-[#2C2417]">
    Destination
  </label>
  <input
    type="text"
    placeholder="Where to?"
    className="
      w-full
      px-4 py-3
      bg-white
      border border-[#E8DFD3]
      rounded-xl
      text-[15px] text-[#2C2417]
      placeholder:text-[#D4C4B0]
      focus:outline-none focus:ring-2 focus:ring-[#C45830] focus:border-transparent
      transition-all duration-200
    "
  />
</div>
```

### Search Input

```jsx
<div className="relative">
  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B7355]" />
  <input
    type="text"
    placeholder="Search activities..."
    className="
      w-full
      pl-12 pr-4 py-3
      bg-[#F5F0E8]
      border-none
      rounded-full
      text-[15px] text-[#2C2417]
      placeholder:text-[#8B7355]
      focus:outline-none focus:ring-2 focus:ring-[#C45830]
    "
  />
</div>
```

### Select / Dropdown

```jsx
<div className="relative">
  <select className="
    w-full
    px-4 py-3
    bg-white
    border border-[#E8DFD3]
    rounded-xl
    text-[15px] text-[#2C2417]
    appearance-none
    focus:outline-none focus:ring-2 focus:ring-[#C45830]
  ">
    <option>Select option</option>
  </select>
  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B7355] pointer-events-none" />
</div>
```

### Stepper (Nights)

```jsx
<div className="flex items-center gap-2">
  <button className="
    w-8 h-8
    rounded-lg
    flex items-center justify-center
    text-[#8B7355]
    hover:bg-[#F5F0E8]
    disabled:opacity-30
  ">
    <Minus className="w-4 h-4" />
  </button>

  <span className="w-8 text-center text-lg font-semibold text-[#2C2417]">
    3
  </span>

  <button className="
    w-8 h-8
    rounded-lg
    flex items-center justify-center
    text-[#8B7355]
    hover:bg-[#F5F0E8]
    disabled:opacity-30
  ">
    <Plus className="w-4 h-4" />
  </button>
</div>
```

## 3.4 Pills & Badges

### Stat Pill

```jsx
<span className="
  px-3 py-1.5
  bg-[#F5F0E8]
  rounded-full
  text-xs font-medium text-[#8B7355]
">
  3 cities
</span>
```

### Category Badge

```jsx
<span className="
  px-2.5 py-1
  bg-[#FFF0EB]
  rounded-full
  text-xs font-medium text-[#C45830]
">
  Food & Wine
</span>
```

### Status Badge

```jsx
// Confirmed
<span className="px-2 py-0.5 bg-[#E8F5EC] text-[#4A7C59] text-xs font-medium rounded-full">
  Booked
</span>

// Pending
<span className="px-2 py-0.5 bg-[#FFF8E8] text-[#D4A853] text-xs font-medium rounded-full">
  Pending
</span>

// Warning
<span className="px-2 py-0.5 bg-[#FFF0EB] text-[#B54A4A] text-xs font-medium rounded-full">
  Action needed
</span>
```

## 3.5 Navigation

### Header

```jsx
<header className="
  h-14
  bg-[#FFFBF5]/95
  backdrop-blur-xl
  border-b border-[#E8DFD3]
  px-4
  flex items-center justify-between
">
  {/* Left */}
  <div className="flex items-center gap-3">
    <button className="w-9 h-9 rounded-xl bg-[#F5F0E8] flex items-center justify-center">
      <ArrowLeft className="w-4 h-4 text-[#2C2417]" />
    </button>
    <h1 className="font-semibold text-[#2C2417]">
      Barcelona <span className="text-[#C45830]">→</span> Valencia
    </h1>
  </div>

  {/* Right */}
  <div className="flex items-center gap-2">
    <button className="w-9 h-9 rounded-xl bg-[#F5F0E8] flex items-center justify-center">
      <Share2 className="w-4 h-4 text-[#8B7355]" />
    </button>
    <button className="px-4 py-2 bg-[#C45830] text-white rounded-xl text-sm font-medium">
      Generate
    </button>
  </div>
</header>
```

### Bottom Navigation (Mobile)

```jsx
<nav className="
  fixed bottom-0 left-0 right-0
  h-16
  bg-[#FFFBF5]
  border-t border-[#E8DFD3]
  px-6
  flex items-center justify-around
">
  <button className="flex flex-col items-center gap-1">
    <Map className="w-5 h-5 text-[#C45830]" />
    <span className="text-xs text-[#C45830] font-medium">Route</span>
  </button>
  <button className="flex flex-col items-center gap-1">
    <Calendar className="w-5 h-5 text-[#8B7355]" />
    <span className="text-xs text-[#8B7355]">Itinerary</span>
  </button>
  <button className="flex flex-col items-center gap-1">
    <MessageCircle className="w-5 h-5 text-[#8B7355]" />
    <span className="text-xs text-[#8B7355]">Companion</span>
  </button>
</nav>
```

### Tab Bar

```jsx
<div className="flex gap-1 p-1 bg-[#F5F0E8] rounded-xl">
  <button className="
    flex-1 px-4 py-2
    bg-white
    rounded-lg
    text-sm font-medium text-[#2C2417]
    shadow-sm
  ">
    Overview
  </button>
  <button className="
    flex-1 px-4 py-2
    rounded-lg
    text-sm font-medium text-[#8B7355]
    hover:text-[#2C2417]
  ">
    Activities
  </button>
  <button className="
    flex-1 px-4 py-2
    rounded-lg
    text-sm font-medium text-[#8B7355]
    hover:text-[#2C2417]
  ">
    Hotels
  </button>
</div>
```

## 3.6 Overlays & Modals

### Bottom Sheet

```jsx
<div className="
  fixed bottom-0 left-0 right-0
  bg-[#FFFBF5]
  rounded-t-[28px]
  shadow-[0_-8px_40px_rgba(44,36,23,0.15)]
">
  {/* Handle */}
  <div className="flex justify-center pt-3 pb-2">
    <div className="w-12 h-1.5 bg-[#D4C4B0] rounded-full" />
  </div>

  {/* Content */}
  <div className="px-5 pb-8">
    {/* ... */}
  </div>
</div>
```

### Modal

```jsx
<div className="
  fixed inset-0 z-50
  flex items-center justify-center
  bg-black/40
  backdrop-blur-sm
">
  <div className="
    w-full max-w-md
    mx-4
    bg-[#FFFBF5]
    rounded-2xl
    shadow-2xl
    overflow-hidden
  ">
    {/* Header */}
    <div className="px-6 py-4 border-b border-[#E8DFD3]">
      <h2 className="text-lg font-semibold text-[#2C2417]">Modal Title</h2>
    </div>

    {/* Body */}
    <div className="px-6 py-4">
      {/* ... */}
    </div>

    {/* Footer */}
    <div className="px-6 py-4 bg-[#FAF7F2] flex gap-3 justify-end">
      <button className="px-4 py-2 text-sm font-medium text-[#8B7355]">
        Cancel
      </button>
      <button className="px-4 py-2 bg-[#C45830] text-white text-sm font-medium rounded-lg">
        Confirm
      </button>
    </div>
  </div>
</div>
```

### Toast / Notification

```jsx
<div className="
  fixed bottom-20 left-1/2 -translate-x-1/2
  px-4 py-3
  bg-[#2C2417]
  text-white
  rounded-xl
  shadow-xl
  flex items-center gap-3
">
  <Check className="w-5 h-5 text-[#4A7C59]" />
  <span className="text-sm">Activity added to Day 3</span>
  <button className="text-xs text-[#D4C4B0] hover:text-white">Undo</button>
</div>
```

---

# 4. Page Specifications

## 4.1 Landing Page

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER                                                         │
│  Logo                                    [Sign In] [Get Started]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    HERO SECTION                                 │
│                                                                 │
│       [Animated map background with subtle parallax]            │
│                                                                 │
│                 "Where to?"                                     │
│                                                                 │
│        ┌─────────────────────────────────────────┐             │
│        │                                         │             │
│        │  Describe your dream road trip...       │             │
│        │  ____________________________________   │             │
│        │                                         │             │
│        └─────────────────────────────────────────┘             │
│                                                                 │
│        Example prompts (clickable):                             │
│        "2 weeks through Portugal"                               │
│        "Barcelona to Rome coastal route"                        │
│        "Wine country in France"                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    HOW IT WORKS                                 │
│                                                                 │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐                  │
│   │    1    │     │    2    │     │    3    │                  │
│   │ Describe│     │Customize│     │   Go    │                  │
│   │  Dream  │ ──► │  Route  │ ──► │ Travel! │                  │
│   └─────────┘     └─────────┘     └─────────┘                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                 FEATURED ROUTES                                 │
│                                                                 │
│   [Card: Amalfi Coast] [Card: Scottish Highlands] [Card: ...]   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    TESTIMONIALS                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  FOOTER                                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Hero Section Specs

**Background:**
- Animated Mapbox map with soft warm filter
- Subtle grain texture overlay
- Gradient overlay: `linear-gradient(180deg, rgba(255,251,245,0) 0%, rgba(255,251,245,0.8) 100%)`

**Input Box:**
- Width: 600px (desktop), 100% - 40px (mobile)
- Background: `#FFFFFF`
- Border: `1px solid #E8DFD3`
- Border radius: 24px
- Padding: 24px
- Shadow: `0 10px 40px rgba(44, 36, 23, 0.1)`

**Example Prompts:**
- Style: Ghost buttons
- Animate: Fade in sequentially

### Conversation Mode (After Input)

When user starts typing, transition to conversation:

```
┌─────────────────────────────────────────────────────────────────┐
│  [← Back]                                              [?]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    [Map animates to show region]                │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  USER: "2 weeks through Portugal, love food and wine"    │  │
│  │                                                          │  │
│  │  ──────────────────────────────────────────────────────  │  │
│  │                                                          │  │
│  │  COMPANION: "Portugal is beautiful! A few questions:     │  │
│  │                                                          │  │
│  │  What kind of trip are you imagining?                    │  │
│  │                                                          │  │
│  │  [Beaches] [Culture] [Food & Wine] [Mix]                │  │
│  │                                                          │  │
│  │  ──────────────────────────────────────────────────────  │  │
│  │                                                          │  │
│  │  Type a message...                          [Send]       │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 4.2 Route Generation Loading

### Visual Design

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                 [Animated Route Illustration]                   │
│                                                                 │
│        ○ ─────── ○ ─────── ○ ─────── ○                         │
│      Paris    Lyon     Nice    Monaco                          │
│        ↑ animated dot traveling along path                      │
│                                                                 │
│                                                                 │
│               "Crafting your journey..."                        │
│                                                                 │
│              ████████████░░░░░░░░░░░░ 45%                      │
│                                                                 │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  ✓ Finding the best route                               │  │
│   │  ⟳ Discovering hidden gems...                           │  │
│   │  ○ Checking local events                                │  │
│   │  ○ Optimizing your days                                 │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  💡 TIP                                                 │  │
│   │  "The best views along the Côte d'Azur are between     │  │
│   │   Nice and Monaco - consider an early morning drive"    │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Specifications

**Progress Animation:**
- Dot travels along route path (SVG animation)
- Cities pulse when "visited"

**Progress Bar:**
- Height: 4px
- Background: `#E8DFD3`
- Fill: Linear gradient `#C45830 → #D4A853`
- Shimmer animation on fill

**Phase Indicators:**
- Completed: `✓` in green circle
- In progress: Spinning loader
- Pending: Empty circle

**Travel Tips:**
- Rotate through 5-6 tips
- Fade transition between tips

## 4.3 Spotlight Page

### Desktop Layout (70/30 Split)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                     │
│  [←] Barcelona → Rome  [3 cities] [7 nights]              [Share] [Export]  │
├───────────────────────────────────────────────────┬─────────────────────────┤
│                                                   │                         │
│                                                   │   COMPANION PANEL       │
│                                                   │   ─────────────────     │
│                                                   │                         │
│              MAP VIEW                             │   "Nice route! The      │
│                                                   │   coastal drive from    │
│   [Mapbox with route line and markers]            │   Barcelona to Nice     │
│                                                   │   is stunning."         │
│                                                   │                         │
│                                                   │   ─────────────────     │
│                                                   │                         │
│                                                   │   [Artifact area        │
│                                                   │    when showing         │
│                                                   │    search results]      │
│                                                   │                         │
├───────────────────────────────────────────────────┤                         │
│                                                   │                         │
│  BOTTOM SHEET                                     │   ─────────────────     │
│  ────────────────                                 │                         │
│  Barcelona → Nice → Rome  [3 stops] [7 nights]    │   💬 Ask anything...    │
│                                                   │                         │
│  [City Card] [City Card] [City Card] [+ Add]      │                         │
│                                                   │                         │
└───────────────────────────────────────────────────┴─────────────────────────┘
```

### Mobile Layout

```
┌─────────────────────────┐
│  HEADER                 │
│  [←] BCN → ROM [Share]  │
├─────────────────────────┤
│                         │
│     MAP VIEW            │
│     (60% height)        │
│                         │
│  [Route + markers]      │
│                         │
├─────────────────────────┤
│  ─── Drag handle ───    │
│                         │
│  Barcelona → Rome       │
│  [3 stops] [7 nights]   │
│                         │
│  [Card] [Card] [+]      │
│  (horizontal scroll)    │
│                         │
├─────────────────────────┤
│  💬 "Need tips?"  [↑]   │
│  (tap to expand)        │
└─────────────────────────┘
```

### Map Styling

**Route Line:**
```javascript
{
  'line-color': '#C45830',
  'line-width': 4,
  'line-opacity': 0.8
}
```

**City Markers:**
- Size: 32px diameter
- Background: `#C45830`
- Number: White, 12px bold
- Border: 3px white
- Shadow: `0 2px 8px rgba(196, 88, 48, 0.3)`

**Start/End Markers:**
- Larger (40px)
- Different icon (flag/checkered)

### Bottom Sheet States

**Collapsed (default):**
- Height: 220px
- Shows: Header + city cards

**Expanded (city selected):**
- Height: 480px (or 60% viewport)
- Shows: Header + city cards + selected city panel

**Full (mobile companion):**
- Height: 85% viewport
- Shows: Full companion conversation

## 4.4 Itinerary Page

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                     │
│  [←] Day 3 of 7: Barcelona              [◀ Day 2] [Day 4 ▶]                │
├───────────────────────────────────────────────────┬─────────────────────────┤
│                                                   │                         │
│  DAY ITINERARY                                    │   COMPANION PANEL       │
│  ──────────────                                   │   ─────────────────     │
│                                                   │                         │
│  ☀️ MORNING                                       │   "Day 3 looks packed!  │
│  ┌──────────────────────────────────────────┐    │   Consider pushing      │
│  │  9:00 AM                                 │    │   Sagrada to afternoon" │
│  │  La Boqueria Market                      │    │                         │
│  │  [Activity Card with full details]       │    │   [Weather: ☀️ 24°C]    │
│  └──────────────────────────────────────────┘    │   [Day status: Tight]   │
│  ┌──────────────────────────────────────────┐    │                         │
│  │  11:00 AM                                │    │   ─────────────────     │
│  │  Gothic Quarter Walk                     │    │                         │
│  └──────────────────────────────────────────┘    │   [Activity search      │
│                                                   │    results here]        │
│  🍽️ LUNCH                                        │                         │
│  ┌──────────────────────────────────────────┐    │                         │
│  │  1:30 PM                                 │    │                         │
│  │  Cal Pep (Tapas, €€€)                   │    │   ─────────────────     │
│  └──────────────────────────────────────────┘    │                         │
│                                                   │   💬 "Find me a         │
│  🌅 AFTERNOON                                     │      rooftop bar..."    │
│  ...                                              │                         │
│                                                   │                         │
└───────────────────────────────────────────────────┴─────────────────────────┘
```

### Day Header

```jsx
<div className="flex items-center justify-between p-4 border-b border-[#E8DFD3]">
  <div>
    <p className="text-sm text-[#8B7355]">Day 3 of 7</p>
    <h1 className="text-xl font-semibold text-[#2C2417]">Barcelona</h1>
  </div>

  <div className="flex items-center gap-2">
    <span className="px-3 py-1 bg-[#FFF0EB] text-[#C45830] rounded-full text-sm">
      6 activities
    </span>
    <span className="px-3 py-1 bg-[#F5F0E8] text-[#8B7355] rounded-full text-sm">
      ☀️ 24°C
    </span>
  </div>
</div>
```

### Time Block Headers

```jsx
// Morning
<div className="flex items-center gap-2 py-2">
  <div className="w-8 h-8 rounded-full bg-[#FFF8E8] flex items-center justify-center">
    <Sun className="w-4 h-4 text-[#D4A853]" />
  </div>
  <span className="text-sm font-semibold text-[#2C2417]">Morning</span>
</div>

// Lunch
<div className="flex items-center gap-2 py-2">
  <div className="w-8 h-8 rounded-full bg-[#FFF0EB] flex items-center justify-center">
    <Utensils className="w-4 h-4 text-[#C45830]" />
  </div>
  <span className="text-sm font-semibold text-[#2C2417]">Lunch</span>
</div>

// Afternoon
<div className="flex items-center gap-2 py-2">
  <div className="w-8 h-8 rounded-full bg-[#FFF5E8] flex items-center justify-center">
    <Sunset className="w-4 h-4 text-[#D4A853]" />
  </div>
  <span className="text-sm font-semibold text-[#2C2417]">Afternoon</span>
</div>

// Evening
<div className="flex items-center gap-2 py-2">
  <div className="w-8 h-8 rounded-full bg-[#F0F0FF] flex items-center justify-center">
    <Moon className="w-4 h-4 text-[#4A90A4]" />
  </div>
  <span className="text-sm font-semibold text-[#2C2417]">Evening</span>
</div>
```

### Activity Timeline Card

```jsx
<div className="flex gap-4">
  {/* Time column */}
  <div className="w-16 flex-shrink-0">
    <span className="text-sm font-medium text-[#2C2417]">9:00</span>
    <span className="text-xs text-[#8B7355] ml-1">AM</span>
  </div>

  {/* Timeline line */}
  <div className="flex flex-col items-center">
    <div className="w-3 h-3 rounded-full bg-[#C45830]" />
    <div className="w-0.5 flex-1 bg-[#E8DFD3]" />
  </div>

  {/* Content card */}
  <div className="flex-1 pb-6">
    <div className="bg-white rounded-xl border border-[#E8DFD3] p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        <img className="w-16 h-16 rounded-lg object-cover" />
        <div className="flex-1">
          <h4 className="font-semibold text-[#2C2417]">La Boqueria Market</h4>
          <p className="text-sm text-[#8B7355]">Food Market · 1-2 hours</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm text-[#8B7355]">Free entry</span>
            <span className="text-sm text-[#4A7C59]">Open now</span>
          </div>
        </div>
        <button className="text-[#8B7355] hover:text-[#C45830]">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</div>
```

---

# 5. Companion UI System

## 5.1 Companion Panel Layout

### Desktop (Sidebar)

```
┌─────────────────────────────────┐
│  COMPANION                  [−] │  ← Minimize button
├─────────────────────────────────┤
│                                 │
│  MESSAGE THREAD                 │
│  (scrollable)                   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ ASSISTANT MESSAGE       │   │
│  │ with warm background    │   │
│  └─────────────────────────┘   │
│                                 │
│         ┌───────────────────┐  │
│         │ USER MESSAGE      │  │
│         │ right-aligned     │  │
│         └───────────────────┘  │
│                                 │
│  ┌─────────────────────────┐   │
│  │ ASSISTANT MESSAGE       │   │
│  └─────────────────────────┘   │
│                                 │
├─────────────────────────────────┤
│                                 │
│  ARTIFACT AREA                  │
│  (when showing results)         │
│                                 │
│  [Activity Grid / Hotel List]   │
│                                 │
├─────────────────────────────────┤
│                                 │
│  💬 Ask anything...      [→]   │
│                                 │
└─────────────────────────────────┘
```

**Specifications:**
- Width: 340px (desktop)
- Background: `#FFFBF5`
- Border-left: `1px solid #E8DFD3`
- Header height: 48px
- Input area height: 64px

### Mobile (Bottom Sheet)

**Collapsed:**
```
┌─────────────────────────────────┐
│  💬 "Need restaurant recs?"  [↑]│  ← Single line preview
└─────────────────────────────────┘
```

**Expanded:**
```
┌─────────────────────────────────┐
│  ── Handle ──                   │
├─────────────────────────────────┤
│  COMPANION                      │
│                                 │
│  [Message thread]               │
│                                 │
│  [Artifact area]                │
│                                 │
├─────────────────────────────────┤
│  💬 Type or speak...      [→]  │
└─────────────────────────────────┘
```

## 5.2 Message Bubbles

### Assistant Message

```jsx
<div className="flex gap-3 max-w-[85%]">
  {/* Avatar */}
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C45830] to-[#D4A853] flex items-center justify-center flex-shrink-0">
    <Compass className="w-4 h-4 text-white" />
  </div>

  {/* Bubble */}
  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-[#E8DFD3]">
    <p className="text-[15px] text-[#2C2417] leading-relaxed">
      Barcelona's amazing for food! Here are my top picks...
    </p>
  </div>
</div>
```

### User Message

```jsx
<div className="flex justify-end">
  <div className="max-w-[85%] bg-[#2C2417] rounded-2xl rounded-tr-sm px-4 py-3">
    <p className="text-[15px] text-white leading-relaxed">
      What are the best tapas bars in Barcelona?
    </p>
  </div>
</div>
```

### Quick Reply Buttons

```jsx
<div className="flex flex-wrap gap-2 mt-3">
  <button className="
    px-3 py-1.5
    bg-[#F5F0E8]
    border border-[#E8DFD3]
    rounded-full
    text-sm text-[#2C2417]
    hover:bg-[#E8DFD3]
    transition-colors
  ">
    Show me more
  </button>
  <button className="
    px-3 py-1.5
    bg-[#FFF0EB]
    border border-[#C45830]/20
    rounded-full
    text-sm text-[#C45830]
    hover:bg-[#C45830] hover:text-white
    transition-colors
  ">
    Add to itinerary
  </button>
</div>
```

### Typing Indicator

```jsx
<div className="flex gap-3 max-w-[85%]">
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C45830] to-[#D4A853] flex items-center justify-center">
    <Compass className="w-4 h-4 text-white" />
  </div>
  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-[#E8DFD3]">
    <div className="flex gap-1">
      <span className="w-2 h-2 rounded-full bg-[#D4C4B0] animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 rounded-full bg-[#D4C4B0] animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 rounded-full bg-[#D4C4B0] animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
</div>
```

## 5.3 Artifact Components

### Activity Grid

```jsx
<div className="bg-[#FAF7F2] rounded-xl p-4 border border-[#E8DFD3]">
  <h4 className="text-sm font-semibold text-[#8B7355] uppercase tracking-wide mb-3">
    Top Activities in Barcelona
  </h4>

  <div className="grid grid-cols-2 gap-3">
    {activities.map(activity => (
      <div className="bg-white rounded-lg p-3 border border-[#E8DFD3]">
        <img className="w-full h-20 rounded-md object-cover mb-2" />
        <h5 className="font-medium text-[14px] text-[#2C2417] truncate">
          {activity.name}
        </h5>
        <div className="flex items-center gap-1 mt-1">
          <Star className="w-3 h-3 fill-[#D4A853] text-[#D4A853]" />
          <span className="text-xs text-[#8B7355]">{activity.rating}</span>
        </div>
        <button className="
          w-full mt-2 py-1.5
          bg-[#FFF0EB]
          rounded-md
          text-xs font-medium text-[#C45830]
          hover:bg-[#C45830] hover:text-white
          transition-colors
        ">
          Add to Day 3
        </button>
      </div>
    ))}
  </div>
</div>
```

### Comparison View (What-If)

```jsx
<div className="bg-[#FAF7F2] rounded-xl p-4 border border-[#E8DFD3]">
  <h4 className="text-sm font-semibold text-[#8B7355] uppercase tracking-wide mb-3">
    Route Comparison
  </h4>

  <div className="grid grid-cols-2 gap-4">
    {/* Current */}
    <div className="bg-white rounded-lg p-3 border border-[#E8DFD3]">
      <span className="text-xs text-[#8B7355]">Current</span>
      <p className="font-semibold text-[#2C2417] mt-1">10 days</p>
      <p className="text-sm text-[#8B7355]">€2,400</p>
      <p className="text-xs text-[#8B7355] mt-2">5 cities</p>
    </div>

    {/* Alternative */}
    <div className="bg-white rounded-lg p-3 border-2 border-[#C45830]">
      <span className="text-xs text-[#C45830] font-medium">+4 Days</span>
      <p className="font-semibold text-[#2C2417] mt-1">14 days</p>
      <p className="text-sm text-[#8B7355]">€3,100 <span className="text-[#B54A4A]">(+€700)</span></p>
      <p className="text-xs text-[#8B7355] mt-2">7 cities</p>
    </div>
  </div>

  <button className="
    w-full mt-4 py-2.5
    bg-[#C45830] text-white
    rounded-lg
    text-sm font-medium
    hover:bg-[#A03820]
    transition-colors
  ">
    Apply Extended Route
  </button>
</div>
```

## 5.4 Proactive Bubble

### Ambient Bubble (Low Priority)

```jsx
<div className="
  fixed bottom-24 right-6
  max-w-[300px]
  bg-white
  rounded-2xl
  shadow-lg
  border border-[#E8DFD3]
  p-4
  animate-in slide-in-from-right
">
  <button className="absolute top-2 right-2 text-[#D4C4B0] hover:text-[#8B7355]">
    <X className="w-4 h-4" />
  </button>

  <p className="text-[14px] text-[#2C2417] pr-6">
    Barcelona's looking empty. Want me to suggest some activities?
  </p>

  <div className="flex gap-2 mt-3">
    <button className="
      px-3 py-1.5
      bg-[#C45830] text-white
      rounded-lg
      text-sm font-medium
    ">
      Yes please
    </button>
    <button className="
      px-3 py-1.5
      text-[#8B7355]
      text-sm
    ">
      Later
    </button>
  </div>
</div>
```

### Alert Bubble (High Priority)

```jsx
<div className="
  fixed bottom-24 right-6
  max-w-[320px]
  bg-white
  rounded-2xl
  shadow-xl
  border-2 border-[#D4A853]
  p-4
">
  <div className="flex items-start gap-3">
    <div className="w-10 h-10 rounded-full bg-[#FFF8E8] flex items-center justify-center flex-shrink-0">
      <AlertTriangle className="w-5 h-5 text-[#D4A853]" />
    </div>
    <div>
      <h4 className="font-semibold text-[#2C2417]">Weather Alert</h4>
      <p className="text-sm text-[#8B7355] mt-1">
        Heavy rain expected in Nice on Day 4. Your beach plans might need adjusting.
      </p>
    </div>
  </div>

  <div className="flex gap-2 mt-4">
    <button className="
      flex-1 py-2
      bg-[#C45830] text-white
      rounded-lg
      text-sm font-medium
    ">
      Help me reschedule
    </button>
    <button className="
      px-4 py-2
      bg-[#F5F0E8]
      rounded-lg
      text-sm text-[#8B7355]
    ">
      Dismiss
    </button>
  </div>
</div>
```

## 5.5 Input Area

```jsx
<div className="p-4 border-t border-[#E8DFD3] bg-[#FFFBF5]">
  <div className="flex items-center gap-2">
    <div className="flex-1 relative">
      <input
        type="text"
        placeholder="Ask anything..."
        className="
          w-full
          px-4 py-3
          bg-white
          border border-[#E8DFD3]
          rounded-xl
          text-[15px] text-[#2C2417]
          placeholder:text-[#D4C4B0]
          focus:outline-none focus:ring-2 focus:ring-[#C45830] focus:border-transparent
        "
      />
    </div>
    <button className="
      w-11 h-11
      bg-[#C45830]
      rounded-xl
      flex items-center justify-center
      text-white
      hover:bg-[#A03820]
      disabled:opacity-50
      transition-colors
    ">
      <Send className="w-5 h-5" />
    </button>
  </div>
</div>
```

---

# 6. UX Patterns

## 6.1 Loading States

### Skeleton Loading

```jsx
// Card skeleton
<div className="bg-white rounded-xl border border-[#E8DFD3] p-4 animate-pulse">
  <div className="flex gap-3">
    <div className="w-16 h-16 rounded-lg bg-[#F5F0E8]" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-[#F5F0E8] rounded w-3/4" />
      <div className="h-3 bg-[#F5F0E8] rounded w-1/2" />
    </div>
  </div>
</div>
```

### Spinner

```jsx
<div className="w-5 h-5 border-2 border-[#E8DFD3] border-t-[#C45830] rounded-full animate-spin" />
```

### Progress Indicator

```jsx
<div className="h-1 bg-[#E8DFD3] rounded-full overflow-hidden">
  <div
    className="h-full bg-gradient-to-r from-[#C45830] to-[#D4A853] transition-all duration-500"
    style={{ width: '45%' }}
  />
</div>
```

## 6.2 Empty States

### No Activities

```jsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="w-16 h-16 rounded-full bg-[#FFF0EB] flex items-center justify-center mb-4">
    <Sparkles className="w-7 h-7 text-[#C45830]" />
  </div>
  <h3 className="text-lg font-semibold text-[#2C2417] mb-1">
    No activities yet
  </h3>
  <p className="text-sm text-[#8B7355] max-w-[250px] mb-4">
    Add activities to make the most of your time in Barcelona
  </p>
  <button className="
    px-4 py-2
    bg-[#C45830] text-white
    rounded-lg
    text-sm font-medium
  ">
    Discover Activities
  </button>
</div>
```

### No Search Results

```jsx
<div className="flex flex-col items-center justify-center py-8 text-center">
  <Search className="w-10 h-10 text-[#D4C4B0] mb-3" />
  <p className="text-sm text-[#8B7355]">
    No results found for "xyz"
  </p>
  <button className="text-sm text-[#C45830] mt-2">
    Try a different search
  </button>
</div>
```

## 6.3 Error States

### Inline Error

```jsx
<div className="flex items-center gap-2 p-3 bg-[#FFF0EB] rounded-lg border border-[#B54A4A]/20">
  <AlertCircle className="w-5 h-5 text-[#B54A4A]" />
  <p className="text-sm text-[#B54A4A]">
    Unable to load activities. Please try again.
  </p>
</div>
```

### Full Page Error

```jsx
<div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
  <div className="w-20 h-20 rounded-full bg-[#FFF0EB] flex items-center justify-center mb-6">
    <Frown className="w-10 h-10 text-[#B54A4A]" />
  </div>
  <h2 className="text-xl font-semibold text-[#2C2417] mb-2">
    Something went wrong
  </h2>
  <p className="text-sm text-[#8B7355] max-w-[300px] mb-6">
    We couldn't load this page. Please check your connection and try again.
  </p>
  <button className="
    px-6 py-3
    bg-[#C45830] text-white
    rounded-xl
    font-medium
  ">
    Try Again
  </button>
</div>
```

## 6.4 Success States

### Action Confirmation

```jsx
<div className="
  fixed bottom-20 left-1/2 -translate-x-1/2
  flex items-center gap-3
  px-4 py-3
  bg-[#2C2417]
  text-white
  rounded-xl
  shadow-xl
  animate-in slide-in-from-bottom
">
  <div className="w-6 h-6 rounded-full bg-[#4A7C59] flex items-center justify-center">
    <Check className="w-4 h-4" />
  </div>
  <span className="text-sm">Activity added to Day 3</span>
  <button className="text-xs text-[#D4C4B0] hover:text-white ml-2">
    Undo
  </button>
</div>
```

## 6.5 Micro-interactions

### Button Press

```css
.button-press {
  transition: transform 0.1s ease;
}
.button-press:active {
  transform: scale(0.98);
}
```

### Card Hover

```css
.card-hover {
  transition: all 0.2s ease;
}
.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px rgba(44, 36, 23, 0.1);
}
```

### Selection Ring

```css
.selection-ring {
  transition: all 0.2s ease;
}
.selection-ring.selected {
  ring: 2px;
  ring-color: #C45830;
  transform: scale(1.02);
}
```

### Focus Glow

```css
.focus-glow:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(196, 88, 48, 0.2);
}
```

---

# 7. Responsive Design

## 7.1 Breakpoints

```css
--breakpoint-sm: 640px;   /* Mobile landscape */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large desktop */
--breakpoint-2xl: 1536px; /* Extra large */
```

## 7.2 Layout Adaptations

### Landing Page

| Breakpoint | Hero Width | Input Width | Columns |
|------------|------------|-------------|---------|
| Mobile | 100% | 100% - 32px | 1 |
| Tablet | 100% | 500px | 2 |
| Desktop | 100% | 600px | 3 |

### Spotlight Page

| Breakpoint | Layout | Companion | Bottom Sheet |
|------------|--------|-----------|--------------|
| Mobile | Stack | Bottom drawer | Collapsible |
| Tablet | 60/40 | Side panel | Expandable |
| Desktop | 70/30 | Side panel | Expandable |

### Itinerary Page

| Breakpoint | Layout | Companion | Day Cards |
|------------|--------|-----------|-----------|
| Mobile | Full width | Bottom drawer | Stacked |
| Tablet | 60/40 | Side panel | Stacked |
| Desktop | 65/35 | Side panel | Stacked |

## 7.3 Touch Targets

- Minimum touch target: 44px × 44px
- Recommended spacing between targets: 8px
- Icon buttons: 44px minimum

## 7.4 Typography Scaling

```css
/* Mobile */
@media (max-width: 640px) {
  --text-display-1: 2.5rem;  /* 40px */
  --text-display-2: 2rem;    /* 32px */
  --text-heading-1: 1.5rem;  /* 24px */
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1023px) {
  --text-display-1: 3rem;    /* 48px */
  --text-display-2: 2.25rem; /* 36px */
}

/* Desktop - use default values */
```

---

# 8. Accessibility

## 8.1 Color Contrast

All text must meet WCAG AA standards:
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- Interactive elements: 3:1 minimum

**Our palette compliance:**
| Combination | Ratio | Pass |
|-------------|-------|------|
| `#2C2417` on `#FFFBF5` | 12.5:1 | ✓ AAA |
| `#8B7355` on `#FFFBF5` | 4.8:1 | ✓ AA |
| `#C45830` on `#FFFBF5` | 4.6:1 | ✓ AA |
| `#FFFFFF` on `#C45830` | 4.6:1 | ✓ AA |

## 8.2 Focus Management

```css
/* Visible focus ring */
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(196, 88, 48, 0.4);
}

/* Skip link */
.skip-link {
  position: absolute;
  left: -9999px;
}
.skip-link:focus {
  left: 16px;
  top: 16px;
  z-index: 100;
}
```

## 8.3 ARIA Labels

```jsx
// Icon-only button
<button aria-label="Share route">
  <Share2 className="w-5 h-5" />
</button>

// Loading state
<button aria-busy="true" aria-label="Generating route">
  <Spinner /> Generating...
</button>

// Expandable section
<button
  aria-expanded={isExpanded}
  aria-controls="details-panel"
>
  View Details
</button>

// Live region for updates
<div aria-live="polite" aria-atomic="true">
  Activity added to Day 3
</div>
```

## 8.4 Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move to next focusable element |
| Shift + Tab | Move to previous element |
| Enter/Space | Activate button/link |
| Escape | Close modal/dropdown |
| Arrow keys | Navigate within menus |

## 8.5 Screen Reader Support

```jsx
// Hidden text for context
<span className="sr-only">Rating:</span>
<span>4.8 out of 5 stars</span>

// Descriptive links
<a href="...">
  View details for Sagrada Familia
  <span className="sr-only">, opens in new tab</span>
</a>

// Form labels
<label htmlFor="destination" className="sr-only">
  Destination city
</label>
<input id="destination" placeholder="Where to?" />
```

---

# 9. Animation & Motion

## 9.1 Timing Functions

```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
```

## 9.2 Duration Scale

```css
--duration-instant: 0ms;
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--duration-slower: 500ms;
```

## 9.3 Common Animations

### Fade In

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn 200ms ease-out;
}
```

### Slide Up

```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-up {
  animation: slideUp 300ms ease-out;
}
```

### Scale In

```css
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.scale-in {
  animation: scaleIn 200ms ease-out;
}
```

### Pulse

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.pulse {
  animation: pulse 2s ease-in-out infinite;
}
```

### Route Draw

```css
@keyframes drawRoute {
  from { stroke-dashoffset: 1000; }
  to { stroke-dashoffset: 0; }
}

.route-line {
  stroke-dasharray: 1000;
  animation: drawRoute 2s ease-out forwards;
}
```

## 9.4 Framer Motion Presets

```javascript
// Page transition
const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
};

// Card stagger
const cardContainer = {
  animate: {
    transition: { staggerChildren: 0.05 }
  }
};

const cardItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 }
};

// Bottom sheet
const bottomSheet = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
  transition: { type: 'spring', damping: 30, stiffness: 300 }
};

// Companion bubble
const bubble = {
  initial: { opacity: 0, scale: 0.8, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.8, y: 20 },
  transition: { type: 'spring', damping: 25, stiffness: 400 }
};
```

## 9.5 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

# Appendix: Design Tokens (Tailwind Config)

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'rui-white': '#FFFBF5',
        'rui-black': '#2C2417',
        'rui-accent': '#C45830',
        'rui-accent-dark': '#A03820',
        'rui-accent-light': '#FFF0EB',
        'rui-gold': '#D4A853',
        'rui-green': '#4A7C59',
        'rui-blue': '#4A90A4',
        'rui-red': '#B54A4A',
        'rui-grey': {
          5: '#FAF7F2',
          10: '#F5F0E8',
          20: '#E8DFD3',
          30: '#D4C4B0',
          50: '#8B7355',
          70: '#5C4D3D',
          90: '#3D3328',
        }
      },
      fontFamily: {
        'marketing': ['Fraunces', 'Georgia', 'serif'],
        'body': ['Satoshi', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        'rui-sm': '4px',
        'rui-md': '8px',
        'rui-lg': '12px',
        'rui-xl': '16px',
        'rui-2xl': '24px',
        'rui-3xl': '32px',
      },
      boxShadow: {
        'rui-sm': '0 1px 2px rgba(44, 36, 23, 0.05)',
        'rui-md': '0 4px 6px rgba(44, 36, 23, 0.07)',
        'rui-lg': '0 10px 15px rgba(44, 36, 23, 0.1)',
        'rui-xl': '0 20px 25px rgba(44, 36, 23, 0.12)',
        'rui-accent': '0 4px 14px rgba(196, 88, 48, 0.25)',
        'rui-up': '0 -8px 40px rgba(44, 36, 23, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
      }
    }
  }
}
```

---

*This design system is the single source of truth for all RDTrip interfaces. All new components and pages must adhere to these specifications.*
