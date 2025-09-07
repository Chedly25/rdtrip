const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "https://unpkg.com"],
            connectSrc: ["'self'", "https://api.perplexity.ai"],
            imgSrc: ["'self'", "data:", "https://*.tile.openstreetmap.org"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
        },
    },
}));

// Compression middleware
app.use(compression());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check for Heroku
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});