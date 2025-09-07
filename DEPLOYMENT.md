# 🚀 Deployment Guide

## Quick Heroku Deployment

### Prerequisites
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed
- Git installed
- GitHub account (already set up)

### Steps

1. **Clone and setup:**
```bash
git clone https://github.com/Chedly25/rdtrip.git
cd rdtrip
npm install
```

2. **Login to Heroku:**
```bash
heroku login
```

3. **Create Heroku app:**
```bash
heroku create your-app-name
# Replace 'your-app-name' with your desired app name
```

4. **Deploy:**
```bash
git push heroku main
```

5. **Open your app:**
```bash
heroku open
```

## Deployment Checklist ✅

### Server Configuration
- [x] Express.js server with proper PORT handling
- [x] Static file serving configured
- [x] Compression middleware enabled
- [x] Security headers (Helmet.js)
- [x] CSP headers for external resources
- [x] Health check endpoint (`/health`)

### Dependencies
- [x] All dependencies in package.json
- [x] Node.js 18.x specified in engines
- [x] Start script configured
- [x] No devDependencies in production

### Files
- [x] Procfile with `web: node server.js`
- [x] .gitignore with proper exclusions
- [x] Environment variables template (.env.example)
- [x] Repository information in package.json

### Frontend
- [x] ES6 modules properly configured
- [x] All external resources (CDNs) whitelisted in CSP
- [x] Responsive design for mobile
- [x] Error handling and loading states

## Environment Variables

The application works without environment variables, but you can optionally set:

```bash
# On Heroku (optional)
heroku config:set NODE_ENV=production
```

**Note:** API keys are user-provided through the UI, not stored as environment variables for security.

## Monitoring

Check your app status:
```bash
heroku ps
heroku logs --tail
```

## Custom Domain (Optional)

To add a custom domain:
```bash
heroku domains:add yourdomain.com
```

## Scaling (if needed)

```bash
heroku ps:scale web=1  # Default
heroku ps:scale web=2  # Scale up if needed
```

## Troubleshooting

### Common Issues

1. **Build fails:** Check that all dependencies are in package.json
2. **App crashes:** Check logs with `heroku logs --tail`
3. **Static files not loading:** Ensure public/ directory structure is correct
4. **CSP errors:** Check browser console, may need to update CSP headers

### Debug Commands
```bash
heroku logs --tail                    # Live logs
heroku ps                            # App status  
heroku config                        # Environment variables
heroku releases                      # Deployment history
heroku run bash                      # Access app container
```

## Performance Optimization

The app is already optimized with:
- Gzip compression
- Efficient route calculation (<500ms)
- CDN resources (Leaflet, fonts)
- Responsive image loading
- Minimal bundle size

## Security Features

- ✅ Helmet.js security headers
- ✅ Content Security Policy
- ✅ No hardcoded secrets
- ✅ Input validation and sanitization
- ✅ HTTPS enforcement (Heroku automatic)

## Cost Estimation

**Heroku Free Tier:** $0/month (with limitations)
**Heroku Basic:** $7/month (recommended for production)
**External APIs:** Perplexity API costs vary by usage

The application is highly optimized and should run efficiently on the smallest Heroku dyno.