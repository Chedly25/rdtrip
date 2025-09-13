# 🚗 Road Trip Planner MVP

AI-powered travel planning platform that generates personalized road trip routes from Aix-en-Provence to European destinations using specialized AI agents.

## ✨ Features

- **Clean Apple-grade UI** with modern design system
- **Mapbox Integration** for interactive route visualization  
- **3 AI Agents**: Adventure, Culture, and Food specialists
- **Smart Route Generation** with customizable stops (2-5)
- **Real-time Processing** with visual feedback

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the server**
   ```bash
   npm start
   ```

3. **Open your browser**
   ```
   http://localhost:4000
   ```

## 🎯 How to Use

1. Enter a European destination (e.g., "Barcelona", "Rome", "Amsterdam")
2. Select number of stops (2-5)
3. Choose travel styles (Adventure, Culture, Food)
4. Click "Generate Route"
5. View AI recommendations and route on the map

## 🔧 Tech Stack

- **Backend**: Node.js, Express
- **AI**: Perplexity API with specialized agents
- **Maps**: Mapbox GL JS
- **Frontend**: Vanilla JavaScript with Apple design principles
- **Styling**: Pure CSS with CSS Variables

## 📡 API Endpoints

- `POST /api/generate-route` - Generate AI-powered route recommendations

## 🔑 Environment Variables

Already configured in `.env`:
- `MAPBOX_API_KEY` - For map visualization
- `PERPLEXITY_API_KEY` - For AI agent processing
- `PORT` - Server port (default: 4000)

## 🗺️ Current Status

✅ MVP Complete - Core functionality working
✅ Apple-grade UI implemented
✅ Mapbox integration active
✅ 3 AI agents operational
✅ Route generation working

Ready for testing and further development!