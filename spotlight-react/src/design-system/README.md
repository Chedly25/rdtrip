# Waycraft Design System - "Wanderlust Editorial"

A travel app that feels like flipping through a beautiful magazine.

## Philosophy

- **Warm & Inviting**: Amber, terracotta, gold accents throughout
- **Editorial Feel**: Heavy use of Fraunces serif for headlines
- **Minimal but Rich**: Clean layouts with subtle texture
- **Magazine-Like**: Image zoom effects, decorative patterns, gradient overlays

---

## Color Palette

### Primary Colors

| Token | Value | Usage |
|-------|-------|-------|
| `rui-black` | `#2C2417` | Primary text, headings |
| `rui-accent` | `#C45830` | CTAs, links, highlights (Terracotta) |
| `rui-secondary` | `#4A90A4` | Alternative accent (Mediterranean Blue) |

### Neutral Scale (Grey)

| Token | Value | Usage |
|-------|-------|-------|
| `rui-grey-50` | `#8B7355` | Secondary text, icons |
| `rui-grey-20` | `#C4B8A5` | Borders, disabled |
| `rui-grey-10` | `#E5DDD0` | Subtle borders |
| `rui-grey-8` | `#EDE6DB` | Hover backgrounds |
| `rui-grey-5` | `#F5F0E8` | Card backgrounds |
| `rui-grey-2` | `#FAF7F2` | Page backgrounds |
| `rui-white` | `#FFFBF5` | Elevated surfaces |

### Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| `success` | `#4A7C59` | Success states, positive |
| `warning` | `#D4A853` | Warnings, premium gold |
| `danger` | `#B54A4A` | Errors, destructive |
| `info` | `#4A6FA5` | Information, links |

### Light Backgrounds

| Token | Value | Usage |
|-------|-------|-------|
| `rui-accent-light` | `#FEF3EE` | Accent background |
| `rui-secondary-light` | `#E8F4F7` | Secondary background |

---

## Typography

### Font Families

```css
--font-display: 'Fraunces', Georgia, serif;  /* Headlines, titles */
--font-body: 'Satoshi', system-ui, sans-serif; /* Body text */
--font-mono: 'JetBrains Mono', monospace;     /* Code */
```

### Type Scale

**Display (Marketing/Hero)**
- `text-display-1`: 4rem, 700 weight - Hero headlines
- `text-display-2`: 3rem, 700 weight - Section headers
- `text-display-3`: 2.25rem, 600 weight - Page titles

**Headings (UI)**
- `text-heading-1`: 2rem, 600 weight - Major sections
- `text-heading-2`: 1.5rem, 600 weight - Card titles
- `text-heading-3`: 1.25rem, 600 weight - Subsections

**Emphasis (Labels)**
- `text-emphasis-1`: 1rem, 500 weight - Strong labels
- `text-emphasis-2`: 0.875rem, 500 weight - Medium labels
- `text-emphasis-3`: 0.75rem, 500 weight - Small labels

**Body**
- `text-body-1`: 1rem, 400 weight - Default body
- `text-body-2`: 0.875rem, 400 weight - Secondary text
- `text-body-3`: 0.75rem, 400 weight - Captions

### Usage Patterns

```tsx
// Page title with editorial feel
<h1 className="font-display text-heading-1 text-rui-black">
  Explore Paris
</h1>

// Card header
<h2 className="font-display text-heading-3 text-rui-black">
  Hidden Gems
</h2>

// Body text
<p className="text-body-2 text-rui-grey-50">
  Discover local favorites...
</p>
```

---

## Spacing System

Based on 8px grid with custom tokens:

| Token | Value | Usage |
|-------|-------|-------|
| `rui-2` | 2px | Micro gaps |
| `rui-4` | 4px | Tight spacing |
| `rui-6` | 6px | Small padding |
| `rui-8` | 8px | Default gap |
| `rui-12` | 12px | Component padding |
| `rui-16` | 16px | Section gaps |
| `rui-24` | 24px | Card padding |
| `rui-32` | 32px | Section margins |
| `rui-48` | 48px | Page sections |

### Common Patterns

```tsx
// Card content
<div className="p-rui-24 space-y-rui-16">

// Button padding
<button className="px-rui-16 py-rui-12">

// Section gaps
<section className="space-y-rui-32">
```

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rui-4` | 4px | Small elements |
| `rui-8` | 8px | Inputs, badges |
| `rui-12` | 12px | Buttons |
| `rui-16` | 16px | Small cards |
| `rui-24` | 24px | Cards, modals |
| `rui-32` | 32px | Large containers |

```tsx
// Button
<button className="rounded-rui-12">

// Card
<div className="rounded-rui-24">

// Pill/Tag
<span className="rounded-full">
```

---

## Shadows

Warm-tinted shadows using `rgba(44, 36, 23, opacity)`:

| Token | Usage |
|-------|-------|
| `shadow-rui-1` | Subtle elevation |
| `shadow-rui-2` | Cards at rest |
| `shadow-rui-3` | Cards on hover, modals |
| `shadow-rui-4` | Floating elements |
| `shadow-accent` | CTA buttons (terracotta-tinted) |

```tsx
// Card with hover shadow
<div className="shadow-rui-2 hover:shadow-rui-3 transition-shadow">

// Primary CTA
<button className="shadow-accent">
```

---

## Animation & Transitions

### Durations

| Token | Value | Usage |
|-------|-------|-------|
| `rui-xs` | 100ms | Micro interactions |
| `rui-sm` | 200ms | Default transitions |
| `rui-md` | 300ms | Modals, overlays |
| `rui-lg` | 450ms | Page transitions |

### Easing Functions

| Token | Usage |
|-------|-------|
| `rui-default` | Standard transitions |
| `smooth` | Fast, polished feel |
| `spring` | Bouncy interactions |

### Framer Motion Patterns

```tsx
// Card entrance
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3, ease: [0.15, 0.5, 0.5, 1] }}

// Hover effect
whileHover={{ scale: 1.02, y: -2 }}
whileTap={{ scale: 0.98 }}

// Modal
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ type: 'spring', damping: 25, stiffness: 300 }}
```

---

## Component Patterns

### Buttons

```tsx
// Primary (Terracotta)
<button className="
  bg-rui-accent text-rui-white
  px-rui-16 py-rui-12
  rounded-rui-12
  shadow-accent
  hover:bg-rui-accent/90
  transition-all duration-rui-sm
">

// Secondary
<button className="
  bg-rui-grey-5 text-rui-black
  border border-rui-grey-10
  px-rui-16 py-rui-12
  rounded-rui-12
  hover:bg-rui-grey-8
  transition-all duration-rui-sm
">

// Ghost
<button className="
  text-rui-grey-50
  hover:text-rui-black hover:bg-rui-grey-5
  px-rui-12 py-rui-8
  rounded-rui-8
  transition-all duration-rui-sm
">
```

### Cards

```tsx
// Standard card
<div className="
  bg-rui-white
  rounded-rui-24
  shadow-rui-2
  p-rui-24
  border border-rui-grey-10
  hover:shadow-rui-3
  transition-shadow duration-rui-md
">

// Editorial card (with hover lift)
<div className="card-editorial p-rui-24">
```

### Badges

```tsx
// Default
<span className="
  inline-flex items-center
  px-rui-8 py-rui-4
  rounded-full
  text-body-3 font-medium
  bg-rui-grey-5 text-rui-grey-50
">

// Success
<span className="bg-success/10 text-success">

// Warning/Premium
<span className="bg-warning/10 text-warning">
```

### Form Inputs

```tsx
<input className="
  w-full
  px-rui-16 py-rui-12
  rounded-rui-12
  border border-rui-grey-10
  bg-rui-white
  text-body-1 text-rui-black
  placeholder:text-rui-grey-20
  focus:border-rui-accent focus:ring-2 focus:ring-rui-accent/20
  transition-all duration-rui-sm
"/>
```

---

## Utility Classes

### Glass Effect
```tsx
<div className="glass">
  {/* backdrop-blur with warm tint */}
</div>
```

### Warm Gradient Background
```tsx
<div className="warm-gradient">
  {/* Subtle warm gradient */}
</div>
```

### Accent Gradient (CTAs)
```tsx
<button className="accent-gradient text-white">
  {/* Terracotta to gold */}
</button>
```

### Image Zoom on Hover
```tsx
<div className="img-zoom">
  <img src="..." />
</div>
```

---

## Do's and Don'ts

### Do
- Use `rui-*` color tokens instead of Tailwind defaults
- Use `font-display` for headlines
- Use warm shadows (`shadow-rui-*`)
- Maintain 8px grid spacing
- Use `rounded-rui-*` for consistency

### Don't
- Use `stone-*`, `gray-*`, `slate-*` colors
- Use cold shadows
- Use inconsistent border radius values
- Skip hover/focus states
- Forget mobile-first responsive design

---

## Migration Guide

If updating components using Tailwind defaults:

| Old (Don't) | New (Do) |
|-------------|----------|
| `bg-stone-50` | `bg-rui-grey-5` |
| `bg-stone-100` | `bg-rui-grey-8` |
| `text-stone-500` | `text-rui-grey-50` |
| `text-stone-800` | `text-rui-black` |
| `border-stone-200` | `border-rui-grey-10` |
| `shadow-sm` | `shadow-rui-1` |
| `shadow-lg` | `shadow-rui-3` |
| `rounded-xl` | `rounded-rui-16` |
| `rounded-2xl` | `rounded-rui-24` |
