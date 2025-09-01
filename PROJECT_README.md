# 🎮 Agent Arcades

**Revolutionary Client-Side AI Agent Development Platform**

Agent Arcades is a cutting-edge Progressive Web Application (PWA) that brings AI agent development directly to your browser. Create, train, and compete with AI agents using visual programming, all powered by client-side AI models with zero server dependencies.

## ✨ Key Features

### 🎨 Visual Agent Design
- **Drag-and-Drop Interface**: Build AI agents using intuitive visual programming
- **Skill Node System**: Combine processing, logic, memory, and synergy nodes
- **Real-Time Preview**: See your agent's behavior as you build
- **Template Library**: Start with pre-built agent templates

### 🤖 Client-Side AI
- **Web-LLM Integration**: Runs AI models entirely in your browser
- **Hardware Optimization**: Automatically selects optimal models for your device
- **Offline Capability**: Full functionality without internet connection
- **Privacy First**: All data stays on your device

### 🏟️ Multi-Agent Arena
- **Real-Time Simulations**: Watch agents compete in live scenarios
- **Multiple Scenarios**: Debug challenges, planning gauntlets, creative tasks
- **Performance Metrics**: Detailed analytics and execution traces
- **Team Coordination**: Multi-agent collaboration challenges

### 🏆 Gamified Learning
- **Tournament System**: Compete in single-elimination, round-robin, and gauntlet modes
- **Skill Chip Collection**: Earn and fuse collectible skill chips
- **Achievement System**: Unlock rewards for milestones and accomplishments
- **Daily Challenges**: Fresh challenges with unique rewards

## 🚀 Getting Started

### Prerequisites
- Modern browser with WebGPU support (Chrome 113+, Edge 113+)
- At least 4GB RAM recommended
- 2GB free storage for AI models

### Quick Start
1. Open `index.html` in a modern browser
2. The app will automatically detect your hardware and load the optimal AI model
3. Complete the tutorial to learn the basics
4. Start creating your first AI agent!

### Installation as PWA
1. Click the install button in your browser's address bar
2. Or use "Add to Home Screen" on mobile devices
3. Enjoy native app-like experience with offline functionality

## 🏗️ Architecture

### Core Technologies
- **Vanilla JavaScript**: No framework dependencies
- **Web-LLM**: Client-side AI model execution
- **IndexedDB**: Local data persistence
- **Service Worker**: Offline functionality
- **WebGPU**: Hardware-accelerated AI inference

### Project Structure
```
agent-arcades/
├── index.html              # Main application entry
├── manifest.json           # PWA manifest
├── service-worker.js       # Offline functionality
├── css/                    # Stylesheets
│   ├── main.css           # Core styles and design system
│   ├── components.css     # UI component styles
│   ├── node-editor.css    # Visual editor styles
│   ├── arena.css          # Arena and simulation styles
│   └── responsive.css     # Mobile and responsive design
├── js/                     # JavaScript modules
│   ├── app.js             # Main application controller
│   ├── modules/           # Core feature modules
│   │   ├── web-llm-integration.js
│   │   ├── node-editor.js
│   │   ├── agent-engine.js
│   │   ├── tournament.js
│   │   ├── skill-chips.js
│   │   └── scenarios.js
│   └── utils/             # Utility functions
│       ├── storage.js
│       ├── error-handler.js
│       └── performance.js
└── assets/                # Static assets
    └── icons/             # PWA icons and graphics
```

## 🎯 Core Features

### Visual Node Editor
- Drag-and-drop skill nodes to build agent logic
- Real-time connection validation
- Undo/redo functionality
- Template system for quick starts

### Multi-Agent Arena
- Real-time simulation visualization
- Multiple scenario types (debug, planning, creative, coordination)
- Performance metrics and analytics
- Replay system for analysis

### Tournament System
- Single elimination, round-robin, and gauntlet modes
- Automated bracket generation
- Reward distribution system
- Leaderboards and rankings

### Skill Chip Collection
- Four rarity levels: Common, Rare, Epic, Legendary
- Five categories: Processing, Logic, Memory, Synergy, Special
- Fusion system to combine chips
- Achievement-based unlocks

## 🔧 Development

### Local Development
```bash
# Serve the application locally
python -m http.server 8000
# or
npx serve .

# Open in browser
open http://localhost:8000
```

### Key Components

#### WebLLM Integration (`js/modules/web-llm-integration.js`)
- Handles AI model loading and inference
- Hardware capability detection
- Model selection optimization
- Error handling and fallbacks

#### Node Editor (`js/modules/node-editor.js`)
- Visual programming interface
- Node type definitions and validation
- Connection management
- Canvas rendering and interactions

#### Agent Engine (`js/modules/agent-engine.js`)
- Multi-agent simulation engine
- Scenario execution
- Performance monitoring
- Arena visualization

#### Storage Manager (`js/utils/storage.js`)
- IndexedDB wrapper for data persistence
- Import/export functionality
- Cache management
- Data migration support

## 🌟 Advanced Features

### Performance Optimization
- Automatic hardware detection
- Model caching and optimization
- Efficient rendering with requestAnimationFrame
- Memory management and cleanup

### Accessibility
- Full keyboard navigation
- Screen reader support
- High contrast mode
- Reduced motion preferences

### Mobile Support
- Responsive design for all screen sizes
- Touch-optimized interactions
- PWA installation on mobile
- Offline-first architecture

## 🐛 Troubleshooting

### Common Issues
1. **WebGPU Not Supported**: Use Chrome 113+ or Edge 113+
2. **Model Loading Fails**: Check internet connection and storage space
3. **Performance Issues**: Close other tabs, check available RAM
4. **Storage Full**: Clear browser cache or export data

### Browser Compatibility
- ✅ Chrome 113+ (Recommended)
- ✅ Edge 113+
- ⚠️ Firefox (Limited WebGPU support)
- ❌ Safari (WebGPU not yet supported)

## 📱 PWA Features

- **Offline Functionality**: Complete app works without internet
- **Install Prompts**: Native app-like installation
- **Background Sync**: Data sync when connection restored
- **Push Notifications**: Tournament and achievement alerts
- **App Shortcuts**: Quick access to key features

## 🔮 Future Enhancements

- [ ] Community scenario sharing
- [ ] Advanced AI model options
- [ ] Multiplayer tournaments
- [ ] Agent marketplace
- [ ] VR/AR arena visualization
- [ ] Educational curriculum integration
- [ ] Voice control interface
- [ ] Advanced analytics dashboard

## 📊 Performance Metrics

The application includes comprehensive performance monitoring:
- Frame rate tracking
- Memory usage monitoring
- AI inference timing
- User interaction latency
- Storage usage analytics

## 🔒 Privacy & Security

- **Zero Data Collection**: No analytics or tracking
- **Local Processing**: All AI runs in your browser
- **No Server Dependencies**: Complete client-side operation
- **Data Ownership**: You control all your data
- **Export/Import**: Full data portability

## 🎓 Educational Value

Agent Arcades serves as both entertainment and education:
- Learn AI concepts through hands-on experience
- Understand multi-agent systems
- Practice problem-solving skills
- Explore different AI architectures
- Gamified learning progression

## 🤝 Contributing

This is a demonstration project showcasing modern web technologies and AI integration. The codebase is designed to be educational and extensible.

## 🙏 Acknowledgments

- [Web-LLM](https://github.com/mlc-ai/web-llm) for client-side AI capabilities
- [Hugging Face](https://huggingface.co/) for AI model hosting
- The open-source community for inspiration and tools

---

**Experience the future of AI development in your browser!** 🚀

*Agent Arcades - Where AI meets creativity, competition, and learning.*


## 🧪 Local Development & Troubleshooting (localhost)

### Recommended local ports

- Safe ports: 5173, 8080, 8000, 3000
- Avoid unsafe ports (e.g., 6000) that some browsers block with ERR_UNSAFE_PORT

### Start a local server

- Python
  - `python -m http.server 5173`
  - Open: http://localhost:5173
- Node.js
  - `npx serve . -p 5173`
  - Open: http://localhost:5173
- VS Code (Live Server)
  - Set port to 5173 in settings, then “Open with Live Server” on index.html

### Debug URLs

- Main app: http://localhost:5173
- Debug mode: http://localhost:5173?debug=true
- Debug test page: http://localhost:5173/debug-test.html
- Init test page: http://localhost:5173/test-initialization.html

### Common console errors and fixes

1) SyntaxError: Unexpected identifier 'as'

- Cause: TypeScript-style cast in a JS file (e.g., `(performance as any).memory`)
- Fix: Use plain JS guards instead of TS casts
  - Example fixed snippet in `js/modules/web-llm-integration.js`:
    - `const memoryInfo = (performance && performance.memory) ? performance.memory : null;`

2) PWA icon 404s

- Symptom: 404 errors for missing icons such as `/assets/icons/icon-144x144.png`
- Fix: Ensure the manifest only references icons that exist
  - Current setup: `manifest.json` uses `assets/icons/favicon.svg` only

3) “Failed to load modules” (while using file://)

- Cause: ES modules require a web server; opening `index.html` directly via file:// will fail
- Fix: Use a local server (see “Start a local server” above)

### Hard refresh and cache reset

Because service workers and caches can keep old assets:

1. Open DevTools → Application → Service Workers → Unregister
2. Application → Clear Storage → “Clear site data”
3. Hard refresh the page (Ctrl+Shift+R)

### Notes about WebGPU and fallbacks

- If WebGPU isn’t available, Web‑LLM initialization falls back gracefully
- The app can run in a minimal mode if heavy features are unavailable

### Port troubleshooting

- If you see `ERR_UNSAFE_PORT` on 6000, use 5173 or 8080 instead
- If a port is in use, choose another safe port (e.g., 5174, 8081)

> Tip: Keep `debug-test.html` handy—it validates browser capabilities, module loading, and provides quick links.
