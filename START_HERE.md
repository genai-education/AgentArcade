# 🚀 Agent Arcades - Quick Start Guide

## The Issue You're Experiencing

You're seeing a **CORS error** because modern browsers block ES6 modules when opening HTML files directly (`file://` protocol). This is a security feature that requires a web server.

## 🎯 Quick Solutions

### Option 1: Use the Standalone Version (Immediate)
**Open `index-standalone.html` directly in your browser**
- This version works without a web server
- Has simulated initialization and basic UI
- Shows what the full app will look like
- No CORS issues!

### Option 2: Set Up a Local Web Server (Recommended)

#### Using Python (if you have Python installed):
```bash
# Navigate to the project folder in terminal/command prompt
cd "C:\Users\KingTesseract\Documents\Websites\VibeFlix\AgentArcade"

# Python 3 (Port 6000)
python -m http.server 6000

# Python 2 (if you have older Python)
python -m SimpleHTTPServer 6000
```

Then open: `http://localhost:6000`

#### Using Node.js (if you have Node.js installed):
```bash
# Navigate to project folder
cd "C:\Users\KingTesseract\Documents\Websites\VibeFlix\AgentArcade"

# Use npx (no installation needed) - Port 6000
npx serve . -p 6000

# Or install globally and use http-server
npm install -g http-server
http-server -p 6000
```

Then open: `http://localhost:6000`

#### Using PHP (if you have PHP installed):
```bash
# Navigate to project folder
cd "C:\Users\KingTesseract\Documents\Websites\VibeFlix\AgentArcade"

# Start PHP server on port 6000
php -S localhost:6000
```

Then open: `http://localhost:6000`

#### Using Live Server (VS Code Extension):
1. Install "Live Server" extension in VS Code
2. Configure port 6000 in VS Code settings (search "live server port")
3. Right-click on `index.html`
4. Select "Open with Live Server"

## 🔧 Troubleshooting

### If you see "Initializing..." forever:

1. **Check the browser console** (F12 → Console tab)
2. **Try the debug version**: `http://localhost:6000?debug=true`
3. **Use the test page**: Open `debug-test.html` first
4. **Try fallback mode**: If initialization fails, click "Launch Minimal Mode"

### Browser Requirements:
- **Chrome 61+** (recommended)
- **Firefox 60+**
- **Safari 11+**
- **Edge 79+**

### Common Issues:
- **WebGPU not supported**: The app will use fallback mode
- **Storage issues**: The app will use memory-only mode
- **Network issues**: The app works offline after first load

## 📁 File Structure

```
AgentArcade/
├── index.html              # Main app (needs web server)
├── index-standalone.html   # Standalone version (works directly)
├── debug-test.html         # Diagnostic tool
├── test-initialization.html # Comprehensive testing
├── START_HERE.md           # This guide
├── js/                     # JavaScript modules
├── css/                    # Stylesheets
└── manifest.json           # PWA configuration
```

## 🎮 What to Expect

### Standalone Version (`index-standalone.html`):
- ✅ Works immediately without setup
- ✅ Shows the UI and design
- ✅ Simulated loading process
- ❌ Limited functionality (demo only)

### Full Version (`index.html` with web server on port 6000):
- ✅ Complete functionality
- ✅ Real AI integration (when available)
- ✅ Full visual programming interface
- ✅ Tournament system and skill chips
- ✅ Offline PWA capabilities

## 🐛 Debug Mode

Add `?debug=true` to any URL to enable debug mode:
- `http://localhost:6000?debug=true`
- Shows detailed initialization steps
- Real-time debug information
- Enhanced error messages

## 📞 Still Having Issues?

1. **Try the standalone version first**: `index-standalone.html`
2. **Check the debug test**: `debug-test.html`
3. **Enable debug mode**: Add `?debug=true` to the URL
4. **Check browser console**: Look for specific error messages
5. **Try a different browser**: Chrome 113+ recommended

## 🎯 Next Steps

1. **Start with standalone**: Open `index-standalone.html` to see the design
2. **Set up web server**: Use one of the methods above (port 6000)
3. **Open full app**: Navigate to `http://localhost:6000`
4. **Enable debug mode**: Add `?debug=true` if you encounter issues
5. **Explore features**: Try the visual editor, arena, and tournaments!

---

**Ready to build AI agents? Let's get started!** 🚀
