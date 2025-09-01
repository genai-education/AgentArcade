/**
 * Visual Node Editor Module
 * Handles drag-and-drop agent design with visual programming
 */

class NodeEditor {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.nodes = new Map();
    this.connections = new Set();
    this.selectedNodes = new Set();
    this.selectedConnection = null;
    
    // Viewport state
    this.viewport = {
      x: 0,
      y: 0,
      zoom: 1,
      minZoom: 0.1,
      maxZoom: 3.0
    };
    
    // Interaction state
    this.isDragging = false;
    this.isConnecting = false;
    this.dragStart = { x: 0, y: 0 };
    this.connectionStart = null;
    this.connectionPreview = null;
    
    // Current agent
    this.currentAgent = null;
    
    // Node types definition
    this.nodeTypes = this.initializeNodeTypes();
    
    // Event listeners
    this.eventListeners = new Map();
    
    // Animation
    this.animationFrame = null;
    this.lastUpdate = 0;
  }

  async initialize(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    
    // Set canvas size
    this.resizeCanvas();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Setup drag and drop from palette
    this.setupDragAndDrop();
    
    // Start render loop
    this.startRenderLoop();
    
    console.log('🎨 Node Editor initialized');
  }

  initializeNodeTypes() {
    return {
      // Input nodes
      'text-input': {
        name: 'Text Input',
        category: 'input',
        icon: '📝',
        color: '#4CAF50',
        inputs: [],
        outputs: ['text'],
        properties: {
          placeholder: { type: 'text', default: 'Enter text...' },
          multiline: { type: 'boolean', default: false }
        }
      },
      'data-input': {
        name: 'Data Input',
        category: 'input',
        icon: '📊',
        color: '#2196F3',
        inputs: [],
        outputs: ['data'],
        properties: {
          dataType: { type: 'select', options: ['json', 'csv', 'xml'], default: 'json' },
          source: { type: 'text', default: '' }
        }
      },
      
      // Processing nodes
      'analyze': {
        name: 'Analyze',
        category: 'processing',
        icon: '🔍',
        color: '#FF9800',
        inputs: ['data'],
        outputs: ['analysis'],
        properties: {
          analysisType: { type: 'select', options: ['sentiment', 'keywords', 'summary'], default: 'summary' },
          depth: { type: 'range', min: 1, max: 5, default: 3 }
        }
      },
      'plan': {
        name: 'Plan',
        category: 'processing',
        icon: '📋',
        color: '#9C27B0',
        inputs: ['objective'],
        outputs: ['plan'],
        properties: {
          planningStyle: { type: 'select', options: ['detailed', 'high-level', 'step-by-step'], default: 'detailed' },
          timeframe: { type: 'text', default: 'short-term' }
        }
      },
      'critique': {
        name: 'Critique',
        category: 'processing',
        icon: '🔍',
        color: '#F44336',
        inputs: ['content'],
        outputs: ['feedback'],
        properties: {
          critiqueStyle: { type: 'select', options: ['constructive', 'detailed', 'brief'], default: 'constructive' },
          focusAreas: { type: 'text', default: 'logic, clarity, completeness' }
        }
      },
      'summarize': {
        name: 'Summarize',
        category: 'processing',
        icon: '📄',
        color: '#607D8B',
        inputs: ['content'],
        outputs: ['summary'],
        properties: {
          length: { type: 'select', options: ['brief', 'medium', 'detailed'], default: 'medium' },
          style: { type: 'select', options: ['bullet-points', 'paragraph', 'outline'], default: 'paragraph' }
        }
      },
      
      // Output nodes
      'text-output': {
        name: 'Text Output',
        category: 'output',
        icon: '📤',
        color: '#795548',
        inputs: ['text'],
        outputs: [],
        properties: {
          format: { type: 'select', options: ['plain', 'markdown', 'html'], default: 'plain' }
        }
      },
      'action': {
        name: 'Action',
        category: 'output',
        icon: '⚡',
        color: '#E91E63',
        inputs: ['trigger'],
        outputs: [],
        properties: {
          actionType: { type: 'select', options: ['notify', 'save', 'execute'], default: 'notify' },
          parameters: { type: 'text', default: '{}' }
        }
      }
    };
  }

  setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
    
    // Touch events for mobile
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    
    // Context menu
    this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Window resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  setupDragAndDrop() {
    const nodeItems = document.querySelectorAll('.node-item');
    
    nodeItems.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        const nodeType = item.dataset.type;
        e.dataTransfer.setData('application/json', JSON.stringify({
          type: 'node',
          nodeType: nodeType
        }));
      });
    });
    
    this.canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    
    this.canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        if (data.type === 'node') {
          const rect = this.canvas.getBoundingClientRect();
          const x = (e.clientX - rect.left - this.viewport.x) / this.viewport.zoom;
          const y = (e.clientY - rect.top - this.viewport.y) / this.viewport.zoom;
          
          this.addNode(data.nodeType, { x, y });
        }
      } catch (error) {
        console.error('Failed to handle drop:', error);
      }
    });
  }

  addNode(type, position) {
    const nodeType = this.nodeTypes[type];
    if (!nodeType) {
      console.error('Unknown node type:', type);
      return null;
    }
    
    const node = new SkillNode({
      id: this.generateId(),
      type: type,
      name: nodeType.name,
      position: position,
      properties: this.cloneProperties(nodeType.properties),
      inputs: nodeType.inputs.map(input => ({ name: input, connected: false })),
      outputs: nodeType.outputs.map(output => ({ name: output, connections: [] }))
    });
    
    this.nodes.set(node.id, node);
    this.updateStats();
    this.requestRender();
    
    return node;
  }

  createConnection(outputNode, outputPort, inputNode, inputPort) {
    // Validate connection
    if (!this.validateConnection(outputNode, outputPort, inputNode, inputPort)) {
      return null;
    }
    
    const connection = new NodeConnection({
      id: this.generateId(),
      outputNode: outputNode.id,
      outputPort: outputPort,
      inputNode: inputNode.id,
      inputPort: inputPort
    });
    
    this.connections.add(connection);
    
    // Update node connection state
    outputNode.outputs[outputPort].connections.push(connection.id);
    inputNode.inputs[inputPort].connected = true;
    
    this.updateStats();
    this.requestRender();
    
    return connection;
  }

  validateConnection(outputNode, outputPort, inputNode, inputPort) {
    // Can't connect to self
    if (outputNode.id === inputNode.id) {
      return false;
    }
    
    // Check if input is already connected
    if (inputNode.inputs[inputPort].connected) {
      return false;
    }
    
    // Check for circular dependencies
    if (this.wouldCreateCycle(outputNode, inputNode)) {
      return false;
    }
    
    return true;
  }

  wouldCreateCycle(outputNode, inputNode) {
    // Simple cycle detection - traverse from inputNode to see if we reach outputNode
    const visited = new Set();
    const stack = [inputNode];
    
    while (stack.length > 0) {
      const current = stack.pop();
      if (visited.has(current.id)) continue;
      visited.add(current.id);
      
      if (current.id === outputNode.id) {
        return true;
      }
      
      // Add connected output nodes to stack
      current.outputs.forEach(output => {
        output.connections.forEach(connId => {
          const conn = Array.from(this.connections).find(c => c.id === connId);
          if (conn) {
            const nextNode = this.nodes.get(conn.inputNode);
            if (nextNode) stack.push(nextNode);
          }
        });
      });
    }
    
    return false;
  }

  startRenderLoop() {
    const render = (timestamp) => {
      const deltaTime = timestamp - this.lastUpdate;
      this.lastUpdate = timestamp;
      
      this.update(deltaTime);
      this.render();
      
      this.animationFrame = requestAnimationFrame(render);
    };
    
    this.animationFrame = requestAnimationFrame(render);
  }

  update(deltaTime) {
    // Update animations, node states, etc.
    for (const node of this.nodes.values()) {
      node.update(deltaTime);
    }
  }

  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Apply viewport transformation
    this.ctx.save();
    this.ctx.translate(this.viewport.x, this.viewport.y);
    this.ctx.scale(this.viewport.zoom, this.viewport.zoom);
    
    // Render grid
    this.renderGrid();
    
    // Render connections
    this.renderConnections();
    
    // Render connection preview
    if (this.connectionPreview) {
      this.renderConnectionPreview();
    }
    
    // Render nodes
    this.renderNodes();
    
    this.ctx.restore();
    
    // Render UI overlay
    this.renderUI();
  }

  renderGrid() {
    const gridSize = 20;
    const startX = Math.floor(-this.viewport.x / this.viewport.zoom / gridSize) * gridSize;
    const startY = Math.floor(-this.viewport.y / this.viewport.zoom / gridSize) * gridSize;
    const endX = startX + (this.canvas.width / this.viewport.zoom) + gridSize;
    const endY = startY + (this.canvas.height / this.viewport.zoom) + gridSize;
    
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    
    this.ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(endX, y);
    }
    this.ctx.stroke();
  }

  renderNodes() {
    for (const node of this.nodes.values()) {
      this.renderNode(node);
    }
  }

  renderNode(node) {
    const nodeType = this.nodeTypes[node.type];
    const isSelected = this.selectedNodes.has(node.id);
    
    // Node background
    this.ctx.fillStyle = isSelected ? '#2a2a3e' : '#1a1a2e';
    this.ctx.strokeStyle = isSelected ? '#00ff88' : 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = isSelected ? 2 : 1;
    
    this.ctx.fillRect(node.position.x, node.position.y, node.width, node.height);
    this.ctx.strokeRect(node.position.x, node.position.y, node.width, node.height);
    
    // Node header
    this.ctx.fillStyle = nodeType.color;
    this.ctx.fillRect(node.position.x, node.position.y, node.width, 30);
    
    // Node icon and title
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText(nodeType.icon, node.position.x + 8, node.position.y + 20);
    
    this.ctx.font = '12px Arial';
    this.ctx.fillText(nodeType.name, node.position.x + 30, node.position.y + 18);
    
    // Input ports
    node.inputs.forEach((input, index) => {
      const y = node.position.y + 40 + (index * 20);
      this.renderPort(node.position.x - 6, y, input.connected, 'input');
    });
    
    // Output ports
    node.outputs.forEach((output, index) => {
      const y = node.position.y + 40 + (index * 20);
      this.renderPort(node.position.x + node.width - 6, y, output.connections.length > 0, 'output');
    });
  }

  renderPort(x, y, connected, type) {
    this.ctx.fillStyle = connected ? '#00ff88' : '#808080';
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1;
    
    this.ctx.beginPath();
    this.ctx.arc(x, y, 6, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
  }

  renderConnections() {
    for (const connection of this.connections) {
      this.renderConnection(connection);
    }
  }

  renderConnection(connection) {
    const outputNode = this.nodes.get(connection.outputNode);
    const inputNode = this.nodes.get(connection.inputNode);
    
    if (!outputNode || !inputNode) return;
    
    const startX = outputNode.position.x + outputNode.width;
    const startY = outputNode.position.y + 40 + (connection.outputPort * 20);
    const endX = inputNode.position.x;
    const endY = inputNode.position.y + 40 + (connection.inputPort * 20);
    
    this.ctx.strokeStyle = '#00ff88';
    this.ctx.lineWidth = 2;
    
    // Draw bezier curve
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    
    const controlX1 = startX + 50;
    const controlX2 = endX - 50;
    
    this.ctx.bezierCurveTo(controlX1, startY, controlX2, endY, endX, endY);
    this.ctx.stroke();
  }

  renderConnectionPreview() {
    if (!this.connectionPreview) return;
    
    this.ctx.strokeStyle = '#0066ff';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.connectionPreview.startX, this.connectionPreview.startY);
    this.ctx.lineTo(this.connectionPreview.endX, this.connectionPreview.endY);
    this.ctx.stroke();
    
    this.ctx.setLineDash([]);
  }

  renderUI() {
    // Render any UI overlays here
  }

  // Event handlers
  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - this.viewport.x) / this.viewport.zoom;
    const y = (e.clientY - rect.top - this.viewport.y) / this.viewport.zoom;
    
    const clickedNode = this.getNodeAt(x, y);
    const clickedPort = this.getPortAt(x, y);
    
    if (clickedPort) {
      this.startConnection(clickedPort);
    } else if (clickedNode) {
      this.selectNode(clickedNode, !e.ctrlKey);
      this.startDrag(x, y);
    } else {
      this.clearSelection();
      this.startPan(x, y);
    }
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - this.viewport.x) / this.viewport.zoom;
    const y = (e.clientY - rect.top - this.viewport.y) / this.viewport.zoom;
    
    if (this.isConnecting && this.connectionStart) {
      this.updateConnectionPreview(x, y);
    } else if (this.isDragging) {
      this.updateDrag(x, y);
    }
  }

  handleMouseUp(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - this.viewport.x) / this.viewport.zoom;
    const y = (e.clientY - rect.top - this.viewport.y) / this.viewport.zoom;
    
    if (this.isConnecting) {
      this.finishConnection(x, y);
    }
    
    this.isDragging = false;
    this.isConnecting = false;
    this.connectionPreview = null;
  }

  // Utility methods
  getNodeAt(x, y) {
    for (const node of this.nodes.values()) {
      if (x >= node.position.x && x <= node.position.x + node.width &&
          y >= node.position.y && y <= node.position.y + node.height) {
        return node;
      }
    }
    return null;
  }

  getPortAt(x, y) {
    // Implementation for port detection
    return null;
  }

  selectNode(node, clearOthers = true) {
    if (clearOthers) {
      this.selectedNodes.clear();
    }
    this.selectedNodes.add(node.id);
    this.requestRender();
  }

  clearSelection() {
    this.selectedNodes.clear();
    this.requestRender();
  }

  generateId() {
    return 'node_' + Math.random().toString(36).substr(2, 9);
  }

  cloneProperties(properties) {
    return JSON.parse(JSON.stringify(properties));
  }

  updateStats() {
    // Update node and connection counts in UI
    const nodeCountEl = document.getElementById('node-count');
    const connectionCountEl = document.getElementById('connection-count');
    
    if (nodeCountEl) nodeCountEl.textContent = this.nodes.size;
    if (connectionCountEl) connectionCountEl.textContent = this.connections.size;
  }

  requestRender() {
    // Render will happen in next animation frame
  }

  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  handleResize() {
    this.resizeCanvas();
  }

  // Placeholder methods
  handleWheel(e) { /* TODO: Zoom implementation */ }
  handleTouchStart(e) { /* TODO: Touch support */ }
  handleTouchMove(e) { /* TODO: Touch support */ }
  handleTouchEnd(e) { /* TODO: Touch support */ }
  handleContextMenu(e) { e.preventDefault(); }
  handleKeyDown(e) { /* TODO: Keyboard shortcuts */ }
  handleKeyUp(e) { /* TODO: Keyboard shortcuts */ }
  startConnection(port) { /* TODO: Connection logic */ }
  updateConnectionPreview(x, y) { /* TODO: Connection preview */ }
  finishConnection(x, y) { /* TODO: Connection completion */ }
  startDrag(x, y) { /* TODO: Node dragging */ }
  updateDrag(x, y) { /* TODO: Node dragging */ }
  startPan(x, y) { /* TODO: Canvas panning */ }
  createNewAgent() { /* TODO: New agent creation */ }
  exportAgent() { /* TODO: Agent export */ }
  refresh() { /* TODO: Refresh implementation */ }
}

// Node and Connection classes
class SkillNode {
  constructor(config) {
    this.id = config.id;
    this.type = config.type;
    this.name = config.name;
    this.position = config.position;
    this.properties = config.properties;
    this.inputs = config.inputs;
    this.outputs = config.outputs;
    this.width = 150;
    this.height = 80;
    this.state = 'idle';
  }
  
  update(deltaTime) {
    // Update node state, animations, etc.
  }
}

class NodeConnection {
  constructor(config) {
    this.id = config.id;
    this.outputNode = config.outputNode;
    this.outputPort = config.outputPort;
    this.inputNode = config.inputNode;
    this.inputPort = config.inputPort;
  }
}

export { NodeEditor, SkillNode, NodeConnection };
