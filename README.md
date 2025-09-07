# 🚗 Aix-en-Provence Road Trip Planner

A sophisticated web application for planning road trips from Aix-en-Provence through Provence, the French Riviera, and Italy. Features real-time route calculation, AI-powered travel insights, and interactive map visualization.

## ✨ Features

### Core Route Planning
- **Real-time Route Calculation**: 3-stage spatial filtering algorithm
- **100+ European Cities**: Comprehensive database with real coordinates and activities
- **6 Trip Themes**: Adventure, Romantic, Cultural, Hidden Gems, Family, Balanced
- **Customizable Options**: 1-6 stops, adjustable detour tolerance (10-50%)
- **Interactive Map**: Leaflet-based visualization with numbered markers

### AI-Powered Insights (Perplexity API)
- 📖 **Trip Narrator**: Poetic journey descriptions
- 🍽️ **Local Food Guide**: Authentic restaurants and specialties
- 🌤️ **Weather Advisor**: Current conditions and best travel times
- 💎 **Hidden Gems**: Secret spots tourists miss
- 📅 **Full Itinerary**: Day-by-day plans with times and budgets

### Export & Integration
- **Google Maps Export**: Direct waypoint links
- **GPX Download**: Navigation files for GPS devices
- **Mobile Responsive**: Works on all devices

## 🏗️ Architecture

### Frontend Structure
```
public/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # Responsive CSS with clean design
└── js/
    ├── app.js          # Main application initialization
    ├── cities.js       # Complete cities database (100+ cities)
    ├── routeCalculator.js  # Route calculation engine
    ├── uiController.js     # UI interactions and map display
    └── aiFeatures.js       # Perplexity API integration
```

### Backend
- **Express.js Server**: Static file serving with security middleware
- **Heroku Ready**: Configured for cloud deployment

## 🚀 Quick Start

### Local Development
```bash
# Clone and install dependencies
git clone <repository-url>
cd roadtrip-planner
npm install

# Start development server
npm run dev
# or
npm start

# Open http://localhost:3000
```

### Deployment to Heroku
```bash
# Login to Heroku
heroku login

# Create Heroku app
heroku create your-app-name

# Deploy
git add .
git commit -m "Initial deployment"
git push heroku main

# Open your app
heroku open
```

## 🛠️ Technical Implementation

### Route Calculation Algorithm
1. **Stage 1**: Bounding box filter reduces search space
2. **Stage 2**: Ellipse filter based on detour tolerance
3. **Stage 3**: Theme-based scoring and geographic ordering

### Cities Database
Each city includes:
- Accurate GPS coordinates
- Real population data
- Theme scores (0-1 scale for 6 themes)
- Specific activities and attractions
- Country designation (FR/IT/MC)

### Performance Features
- Route calculation: <500ms for 100 cities
- Autocomplete: Instant (<100ms)
- Fuzzy city name matching
- Intelligent stop ordering
- Distance optimization

## 🎯 Usage Examples

### Basic Route Planning
1. Enter destination (e.g., "Nice", "Venice", "Florence")
2. Select trip theme
3. Adjust stops and detour tolerance
4. Click "Calculate Route"
5. View interactive map and route details

### AI Features
1. Add Perplexity API key (optional)
2. Calculate a route first
3. Click any AI feature button
4. Get personalized travel insights

### Export Options
- **Google Maps**: Opens route in Google Maps app
- **GPX File**: Downloads for GPS navigation devices

## 🌍 Supported Regions

### French Riviera
Nice, Cannes, Antibes, Monaco, Menton, Saint-Tropez

### Italian Destinations  
Venice, Florence, Milan, Turin, Genoa, Verona, Pisa

### Alpine Routes
Chamonix, Annecy, Grenoble, Gap, Chambéry

### Provence Circuit
Avignon, Arles, Luberon villages, Gordes, Roussillon

### Hidden Gems
50+ villages under 5,000 population with authentic experiences

## 🔧 Configuration

### Environment Variables
```env
PORT=3000  # Server port (Heroku sets automatically)
```

### API Keys
- **Perplexity API**: User-provided for AI features (not hardcoded)
- **Maps**: Uses free OpenStreetMap tiles

## 🧪 Testing Checklist

- [x] Route calculation for all major destinations
- [x] Autocomplete suggestions work
- [x] Theme selection affects city selection  
- [x] Slider changes update routes
- [x] Map displays with correct markers
- [x] Individual stops can be removed
- [x] Google Maps export functions
- [x] GPX download creates valid files
- [x] AI features work with API key
- [x] Mobile layout is responsive
- [x] Error messages are user-friendly

## 📱 Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+
- Mobile browsers

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenStreetMap contributors for map tiles
- Leaflet.js for mapping functionality
- Perplexity AI for travel insights
- Inter font family for clean typography
- All the real travel data sources

---

**Built with ❤️ for road trip enthusiasts exploring Southern Europe**