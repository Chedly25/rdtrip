# Revolut-Style Landing Page Redesign Plan

## Overview
Transform the landing page to match Revolut's premium design language, focusing on smooth animations, refined typography, and polished interactions.

---

## Phase 1: Design Tokens & Tailwind Config ✅ IN PROGRESS
Update `tailwind.config.js` with Revolut's exact design tokens.

### Tasks:
- [ ] Add Aeonik Pro font (headlines) + Inter (body)
- [ ] Update color palette to Revolut's system
- [ ] Add animation timing/easing variables
- [ ] Update spacing scale
- [ ] Update border-radius scale
- [ ] Add shadow system

### Revolut Design Tokens:

#### Typography
```
Fonts:
- Headlines: "Aeonik Pro" (weight 900)
- Body: "Inter" (400, 500, 600, 700)

Sizes:
- marketing-display1: 3.5rem (56px)
- marketing-display2: 2.5rem (40px)
- marketing-display3: 2rem (32px)
- heading1: 2rem (32px)
- heading2: 1.5rem (24px)
- heading3: 1.25rem (20px)
- body1: 1rem (16px)
- body2: 0.875rem (14px)
```

#### Animation
```
Durations:
- xs: 100ms
- sm: 200ms
- md: 300ms
- lg: 450ms
- xl: 900ms

Easing:
- default: cubic-bezier(0.15, 0.5, 0.5, 1)
- shadow: cubic-bezier(0.4, 0.3, 0.8, 0.6)
- toast/spring: cubic-bezier(0.175, 0.885, 0.21, 1.65)
- parallax: cubic-bezier(0.35, 0, 0, 1)
```

#### Colors
```
--color-black: #191C1F
--color-foreground: #191C1F
--color-grey-50: #717173
--color-grey-20: #C9C9CD
--color-grey-10: #E2E2E7
--color-grey-8: #EBEBF0
--color-grey-5: #F1F2F4
--color-grey-2: #F7F7F7
--color-white: #FFFFFF
--color-accent: #4F55F1
```

#### Spacing
```
s2: 0.125rem
s4: 0.25rem
s6: 0.375rem
s8: 0.5rem
s12: 0.75rem
s16: 1rem
s20: 1.25rem
s24: 1.5rem
s32: 2rem
s40: 2.5rem
s48: 3rem
s56: 3.5rem
s64: 4rem
```

#### Border Radius
```
r4: 0.25rem
r6: 0.375rem
r8: 0.5rem
r12: 0.75rem
r16: 1rem
r24: 1.5rem
r32: 2rem
round: 9999px
```

---

## Phase 2: Hero Section Redesign
Transform hero with Revolut's parallax scroll and typography.

### Tasks:
- [ ] Implement scroll-linked parallax background
- [ ] Update typography to Aeonik Pro headlines
- [ ] Add smooth entrance animations
- [ ] Implement state-layer button hover effects
- [ ] Add scroll indicator with smooth bounce

### Key Patterns:
- Hero image: `transform: translate(-50%, 0px) scale(1.75)` linked to scroll
- Headline: Aeonik Pro Black, line-height 1.0
- Button: Round pill with state-layer overlay on hover

---

## Phase 3: Navigation Redesign
Match Revolut's clean, minimal navigation.

### Tasks:
- [ ] Glassmorphism header on scroll
- [ ] Smooth opacity/blur transitions
- [ ] State-layer button hovers
- [ ] Mobile menu animation

---

## Phase 4: Component Library Updates
Update all shared components to new design language.

### Tasks:
- [ ] Button component with state-layer
- [ ] Card component with new shadows
- [ ] Input component styling
- [ ] Loading states/skeletons

---

## Phase 5: Section-by-Section Updates
Apply new design to all landing page sections.

### Tasks:
- [ ] Agent Showcase section
- [ ] Features section
- [ ] Destination showcase
- [ ] Route form section
- [ ] Footer

---

## Phase 6: Polish & Micro-interactions
Final touches for premium feel.

### Tasks:
- [ ] Scroll-triggered animations
- [ ] Hover state refinements
- [ ] Loading state improvements
- [ ] Performance optimization

---

## Files to Modify

### Phase 1:
- `landing-react/tailwind.config.js`
- `landing-react/src/index.css`

### Phase 2:
- `landing-react/src/components/Hero.tsx`

### Phase 3:
- `landing-react/src/components/Navigation.tsx`

### Phase 4:
- `landing-react/src/components/ui/Button.tsx`
- `landing-react/src/components/ui/Card.tsx`
- `landing-react/src/components/ui/Input.tsx`

### Phase 5:
- `landing-react/src/components/AgentShowcase.tsx`
- `landing-react/src/components/Features.tsx`
- `landing-react/src/components/DestinationShowcase.tsx`
- `landing-react/src/components/RouteForm.tsx`
- `landing-react/src/components/Footer.tsx`

---

## Progress Tracking

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: Design Tokens | ✅ Complete | 100% |
| Phase 2: Hero | ✅ Complete | 100% |
| Phase 3: Navigation | ✅ Complete | 100% |
| Phase 4: Components | ✅ Complete | 100% |
| Phase 5: Sections | ✅ Complete | 100% |
| Phase 6: Polish | ⏳ Pending | 0% |

---

## Reference
- Source: Revolut France homepage (revolut.com/fr-FR/)
- CSS file: fb39406d0bb20291.css
- Design system: RUI (Revolut UI)
