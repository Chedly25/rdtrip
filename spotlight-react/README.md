# Road Trip Spotlight - React Edition

A modern, beautiful React application for planning road trips with an interactive spotlight page featuring city destinations, activities, and smooth animations.

## Features

- **Interactive City Cards**: Beautiful cards with images, activities, and smooth hover animations
- **Drag & Drop Reordering**: Easily reorder your destinations using intuitive drag and drop
- **City Search**: Search and add new destinations with real-time search
- **City Details Modal**: View comprehensive information about each destination
- **Add Stop Buttons**: Insert new destinations anywhere in your journey
- **Smooth Animations**: Professional animations using Framer Motion
- **Type-Safe**: Built with TypeScript for robust code
- **State Management**: Zustand for simple, efficient state management
- **API Integration**: Ready to connect to backend API with React Query

## Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type safety and better developer experience
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Declarative animations
- **@dnd-kit** - Accessible drag and drop
- **Radix UI** - Accessible component primitives
- **Zustand** - Simple state management
- **React Query** - Data fetching and caching
- **Lucide React** - Beautiful icon library

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at [http://localhost:5173/](http://localhost:5173/)

## Project Structure

```
spotlight-react/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   └── Button.tsx         # Reusable button component
│   │   └── spotlight/
│   │       ├── CityCard.tsx       # City card component
│   │       ├── SortableCityCard.tsx  # Draggable city card wrapper
│   │       ├── AddStopButton.tsx  # Add destination button
│   │       ├── AddDestinationModal.tsx  # Search & add modal
│   │       ├── CityDetailsModal.tsx     # City details modal
│   │       └── SpotlightPage.tsx  # Main spotlight page
│   ├── stores/
│   │   └── spotlightStore.ts      # Zustand state management
│   ├── services/
│   │   └── api.ts                 # API service layer
│   ├── hooks/
│   │   └── useApi.ts              # React Query hooks
│   ├── types/
│   │   └── index.ts               # TypeScript type definitions
│   ├── lib/
│   │   └── utils.ts               # Utility functions
│   ├── App.tsx                    # Root component
│   ├── main.tsx                   # App entry point
│   └── index.css                  # Global styles
├── tailwind.config.js             # Tailwind configuration
├── postcss.config.js              # PostCSS configuration
├── vite.config.ts                 # Vite configuration
└── tsconfig.json                  # TypeScript configuration
```

## API Integration

The app is designed to work with a backend API. Set your API URL in a `.env` file:

```bash
cp .env.example .env
# Edit .env and set VITE_API_URL
```

### API Endpoints Expected

- `GET /api/cities/search?q=query` - Search cities
- `GET /api/cities/:id` - Get city details
- `GET /api/waypoints` - Get all waypoints
- `POST /api/waypoints` - Save waypoints
- `DELETE /api/waypoints/:id` - Delete waypoint
- `POST /api/cities/recommendations` - Get recommendations
- `GET /api/trips/:id/export?format=pdf|json|csv` - Export trip

The app includes fallback mock data when the API is not available.

## Key Components

### SpotlightPage
Main page component that orchestrates all functionality:
- Displays city cards in a responsive grid
- Handles drag and drop reordering
- Manages modals for adding destinations and viewing details
- Integrates with state management

### CityCard
Beautiful card component featuring:
- Hero image with gradient fallback
- City name and activities list
- Drag handle and remove button
- Smooth hover animations
- Click to view details

### AddDestinationModal
Search and add new destinations:
- Real-time search with debouncing
- Beautiful loading states
- Search results with animations
- Integration with React Query

### CityDetailsModal
Full-screen modal showing:
- Hero image with overlay
- City description
- Complete activities list
- Suggested duration (placeholder)
- Edit functionality (placeholder)

## State Management

Uses Zustand for simple, efficient state management:

```typescript
const { waypoints, addWaypoint, removeWaypoint, setWaypoints } = useSpotlightStore()
```

State is persisted and synced across components automatically.

## Animations

All animations use Framer Motion for smooth, professional effects:
- Card hover effects
- Modal enter/exit animations
- Drag and drop feedback
- List transitions with AnimatePresence

## Customization

### Colors
Edit `tailwind.config.js` to customize the color scheme:

```javascript
colors: {
  primary: { 500: '#667eea' },
  secondary: { 500: '#764ba2' },
}
```

### Animations
Adjust animation timings in component files or add custom animations in `tailwind.config.js`.

## Development

### Mock Data
The app includes mock data for development. See `src/App.tsx` for the mock waypoints.

### Hot Module Replacement
Vite provides instant HMR - changes appear immediately without full page reload.

### Type Checking
TypeScript is configured for strict type checking. Run `tsc --noEmit` to check for type errors.

## Production Build

```bash
npm run build
```

Outputs optimized bundle to `dist/` directory. Deploy with any static hosting service.

## Next Steps

- Connect to real backend API
- Add map integration (Google Maps or Mapbox)
- Implement hotels and restaurants sections
- Build itinerary planning features
- Add route calculation and display
- Implement user authentication
- Add trip sharing functionality

## License

This project is part of the Road Trip application suite.
