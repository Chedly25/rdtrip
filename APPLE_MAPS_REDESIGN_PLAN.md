# Spotlight Redesign: Apple Maps Style

## Current Problems

### City Cards (288px wide, 144px image)
1. **Too bulky** - Take up too much space, only 2-3 visible at once
2. **Wrong information** - Night stepper, activity counts, "View Details" button are secondary info shown upfront
3. **Missing key info** - No city highlights/taglines explaining why visit
4. **Hard to interact** - Too many competing click targets (card, drag handle, stepper, button)
5. **Visual style** - Heavy, corporate feel. Shadows too prominent.

### Bottom Panel Layout
1. **Trip Summary Card wastes space** - 320px fixed panel on left
2. **Gradient fade looks cheap** - `from-white via-white/95 to-transparent`
3. **No expandability** - Everything shown at once, no progressive disclosure
4. **Add button placement weird** - FAB above cards feels disconnected

---

## Apple Maps Design Patterns

### Bottom Sheet Behavior
- **Collapsed state**: Shows minimal horizontal scrolling content
- **Medium state**: More details, still map visible
- **Full state**: Full screen content
- **Drag handle**: Small pill indicator at top to pull up

### Place Cards (Apple Style)
- **Compact**: ~160-200px wide
- **Photo**: Small square thumbnail (60-80px) or none
- **Primary info**: Name, one-line highlight
- **Secondary info**: Small badge (rating, distance, category)
- **Interaction**: Single tap to select, long-press to reorder

### Visual Language
- **Clean white background** with subtle top shadow
- **SF Pro typography** - we'll use Inter (similar)
- **Minimal borders** - use spacing instead
- **Soft shadows** - barely there, not prominent
- **Accent color** - iOS blue for interactive elements (or we keep monochrome black)

---

## Redesign Specification

### Phase 1: Compact City Cards

**New CityCard dimensions: 180px wide**

```
┌─────────────────────────┐
│  ┌────┐                 │
│  │ 📷 │  Barcelona      │
│  │ 60 │  Medieval charm │
│  └────┘  ───────────────│
│         2 nights • ✓    │
└─────────────────────────┘
```

**Structure:**
- **Left**: 60x60px rounded-lg image thumbnail
- **Right**:
  - City name (16px semibold)
  - Highlight tagline (13px regular, grey - e.g., "Medieval Old Town")
  - Bottom: nights badge + checkmark if has activities

**Interactions:**
- Single tap: Select (highlights on map, shows info card)
- Long-press + drag: Reorder
- No inline editing - editing happens in detail modal

**Removed from card:**
- Night stepper (move to detail modal)
- Activity/restaurant counts (move to detail modal)
- "View Details" button (tap card instead)
- Drag grip handle (use long-press)
- Large image header

### Phase 2: Bottom Sheet Layout

**Collapsed State (default):**
```
┌────────────────────────────────────────────────────┐
│                    ─────                            │  <- Drag handle
│  Paris → Rome  •  5 cities  •  12 nights           │  <- Trip summary inline
├────────────────────────────────────────────────────┤
│ [Card][Card][Card][Card][Card][+]                  │  <- Horizontal scroll
└────────────────────────────────────────────────────┘
Height: ~140px
```

**Components:**
1. **Drag handle**: 36x5px rounded pill, centered
2. **Trip summary**: Single line, inline with header
3. **Cards row**: Horizontal scroll, 180px cards, 12px gap
4. **Add button**: Small icon at end of scroll (not FAB)

**Expanded State (pull up):**
```
┌────────────────────────────────────────────────────┐
│                    ─────                            │
│  Paris → Rome                                       │
│  5 cities  •  12 nights  •  €2,400 est.            │
├────────────────────────────────────────────────────┤
│ [Card][Card][Card][Card][Card][+]                  │
├────────────────────────────────────────────────────┤
│  Selected City Details                              │
│  ┌─────────────────────────────────────────────┐   │
│  │ Barcelona                                    │   │
│  │ Nights: [−] 2 [+]                           │   │
│  │ Activities: 5 • Restaurants: 3              │   │
│  │                                              │   │
│  │ Highlights:                                  │   │
│  │ • Gothic Quarter walking tour               │   │
│  │ • La Sagrada Familia                        │   │
│  │ • Barceloneta Beach                         │   │
│  └─────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
Height: ~400px (or 50% of screen)
```

### Phase 3: City Highlights System

**Add highlights prop to CityCard:**
```typescript
interface CityCardProps {
  cityName: string;
  country?: string;
  index: number;
  nights: number;
  highlight?: string;  // "Medieval Old Town", "Beach Paradise", etc.
  hasActivities?: boolean;  // Simple boolean instead of count
  isSelected: boolean;
  onSelect: () => void;
}
```

**Generate highlights from city data:**
```typescript
const getHighlight = (city: CityData): string => {
  // Check activities for themes
  if (city.activities?.some(a => a.type === 'beach')) return 'Coastal Paradise';
  if (city.activities?.some(a => a.type === 'historic')) return 'Rich History';
  if (city.activities?.some(a => a.type === 'nightlife')) return 'Vibrant Nightlife';

  // Fallback based on city name (known cities)
  const highlights: Record<string, string> = {
    'Barcelona': 'Gothic Quarter & Beaches',
    'Paris': 'City of Lights',
    'Rome': 'Ancient Wonders',
    'Amsterdam': 'Canals & Culture',
    // ... more
  };
  return highlights[cityName] || country || '';
};
```

---

## Visual Specifications

### Colors (keeping monochrome but refined)
```css
--bg-primary: #FFFFFF;
--bg-secondary: #F8F9FA;  /* Slightly warmer than pure grey */
--text-primary: #1A1A1A;  /* Slightly softer than pure black */
--text-secondary: #6B7280;
--border: #E5E7EB;
--shadow: rgba(0, 0, 0, 0.08);
```

### Typography
```css
/* City name */
font-size: 15px;
font-weight: 600;
line-height: 20px;

/* Highlight */
font-size: 13px;
font-weight: 400;
color: var(--text-secondary);
line-height: 18px;

/* Badge */
font-size: 12px;
font-weight: 500;
```

### Spacing
```css
/* Card padding */
padding: 12px;

/* Card gap */
gap: 12px;

/* Bottom sheet padding */
padding: 16px 20px;
```

### Shadows
```css
/* Card shadow - very subtle */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);

/* Bottom sheet shadow */
box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);

/* Selected card */
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
```

### Border Radius
```css
/* Cards */
border-radius: 16px;

/* Image thumbnail */
border-radius: 12px;

/* Drag handle */
border-radius: 2.5px;

/* Badges */
border-radius: 6px;
```

---

## Implementation Order

### Step 1: New CompactCityCard component
- Create new component (don't modify existing yet)
- 180px width, horizontal layout
- 60x60 thumbnail
- Name + highlight + nights badge
- Click to select, no inline editing

### Step 2: New BottomSheet component
- Replaces BottomPanel
- Drag handle with gesture support
- Collapsed/expanded states
- Inline trip summary header
- Cards scroll area
- Selected city detail area (expanded only)

### Step 3: Update SpotlightV2
- Replace BottomPanel with BottomSheet
- Connect selected city to detail display
- Handle sheet state (collapsed/expanded)

### Step 4: City highlights integration
- Add highlight generation logic
- Update city data to include highlights
- Display in cards

### Step 5: Polish & Animation
- Smooth sheet transitions
- Card selection animation
- Scroll snap behavior
- Loading states

---

## File Changes

### New Files
- `spotlight-react/src/components/spotlight/v3/CompactCityCard.tsx`
- `spotlight-react/src/components/spotlight/v3/BottomSheet.tsx`
- `spotlight-react/src/components/spotlight/v3/SelectedCityPanel.tsx`
- `spotlight-react/src/utils/cityHighlights.ts`

### Modified Files
- `spotlight-react/src/components/spotlight/v2/SpotlightV2.tsx`
- `spotlight-react/tailwind.config.js` (refined colors)

### Deprecated (keep for reference)
- `spotlight-react/src/components/spotlight/v3/CityCard.tsx` (old bulky version)
- `spotlight-react/src/components/spotlight/v3/BottomPanel.tsx` (old layout)
- `spotlight-react/src/components/spotlight/v3/TripSummaryCard.tsx` (replaced by inline summary)

---

## Success Criteria

1. **5+ cards visible** in horizontal scroll without scrolling
2. **Single tap to select** - no competing click targets
3. **Key info at a glance** - name, highlight, nights
4. **Detail on demand** - expand sheet or tap for more
5. **Smooth animations** - 60fps sheet gestures
6. **Clean visual hierarchy** - clear primary/secondary info
7. **Map stays hero** - bottom sheet doesn't dominate

---

## References

- [Apple Maps Bottom Sheet (Stack Overflow)](https://stackoverflow.com/questions/37967555/how-can-i-mimic-the-bottom-sheet-from-the-maps-app)
- [Pulley - iOS 10 Maps UI Library](https://github.com/52inc/Pulley)
- [Apple Support - Place Cards](https://support.apple.com/guide/ipad/get-information-about-places-ipad58171d60/ipados)
