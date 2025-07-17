# stick-to-bottom

[![npm version](https://img.shields.io/npm/v/stick-to-bottom.svg?style=flat-square)](https://www.npmjs.com/package/stick-to-bottom)
[![npm downloads](https://img.shields.io/npm/dm/stick-to-bottom.svg?style=flat-square)](https://www.npmjs.com/package/stick-to-bottom)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight **zero-dependency** vanilla JavaScript library that automatically sticks to the bottom of a container and smoothly animates content while new items are added. Perfect for chat applications, live logs, and any streaming content interface.

## ✨ Features

- **Framework Agnostic**: Pure vanilla JavaScript, works with any framework or no framework
- **Zero Dependencies**: No external dependencies, lightweight and fast
- **Smooth Animations**: Velocity-based spring animations with configurable parameters
- **Smart Scroll Detection**: Distinguishes between user scrolling and programmatic scrolling
- **Resize Handling**: Automatically handles content size changes using ResizeObserver
- **Mobile Friendly**: Works seamlessly on touch devices
- **TypeScript Support**: Full TypeScript definitions included
- **Escape Detection**: Users can scroll up to "escape" the sticky behavior
- **Selection Aware**: Pauses scrolling when user is selecting text

## 🚀 Installation

```bash
npm install stick-to-bottom
```

```bash
yarn add stick-to-bottom
```

```bash
pnpm add stick-to-bottom
```

## 📖 Usage

### Basic Usage

```javascript
import StickToBottom from 'stick-to-bottom';

// Get your container and content elements
const container = document.querySelector('.chat-container');
const content = document.querySelector('.messages');

// Create the stick-to-bottom instance
const stickToBottom = new StickToBottom(container, content);

// Add new messages
const newMessage = document.createElement('div');
newMessage.textContent = 'Hello world!';
content.appendChild(newMessage);

// The container will automatically scroll to bottom with smooth animation
```

### With Options

```javascript
const stickToBottom = new StickToBottom(container, content, {
  // Spring animation configuration
  damping: 0.7,        // How much to damp the animation (0-1)
  stiffness: 0.05,     // Animation stiffness
  mass: 1.25,          // Animation mass
  
  // Behavior options
  initial: 'smooth',   // Scroll to bottom on initialization
  resize: 'smooth',    // How to handle resize events
  
  // Custom target calculation
  targetScrollTop: (target, { scrollElement, contentElement }) => {
    return target - 50; // Leave 50px from bottom
  }
});
```

### Event Handling

```javascript
// Listen for state changes
const unsubscribe = stickToBottom.on('bottomChange', (isAtBottom) => {
  const scrollButton = document.querySelector('.scroll-to-bottom');
  scrollButton.style.display = isAtBottom ? 'none' : 'block';
});

// Listen for escape events
stickToBottom.on('escapeChange', (hasEscaped) => {
  console.log('User has escaped sticky behavior:', hasEscaped);
});

// Listen for all state changes
stickToBottom.on('stateChange', (state) => {
  console.log('State changed:', state);
});

// Clean up
unsubscribe();
```

### Programmatic Scrolling

```javascript
// Scroll to bottom with default animation
stickToBottom.scrollToBottom();

// Scroll with custom animation
stickToBottom.scrollToBottom({
  animation: 'instant',  // or spring config object
  duration: 500,         // wait 500ms before allowing completion
  ignoreEscapes: true    // ignore user scroll during animation
});

// Scroll with promise handling
stickToBottom.scrollToBottom().then((success) => {
  if (success) {
    console.log('Scrolled to bottom successfully');
  } else {
    console.log('Scroll was cancelled');
  }
});
```

## 🎯 Real-World Examples

### Chat Application

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .chat-container {
      height: 400px;
      overflow-y: auto;
      border: 1px solid #ccc;
      padding: 10px;
    }
    
    .message {
      margin-bottom: 10px;
      padding: 8px;
      background: #f0f0f0;
      border-radius: 4px;
    }
    
    .scroll-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      cursor: pointer;
      display: none;
    }
  </style>
</head>
<body>
  <div class="chat-container" id="chat">
    <div class="messages" id="messages">
      <!-- Messages will be added here -->
    </div>
  </div>
  
  <button class="scroll-button" id="scrollButton">↓</button>
  <input type="text" id="messageInput" placeholder="Type a message..." />
  
  <script type="module">
    import StickToBottom from './dist/stick-to-bottom.esm.js';
    
    const container = document.getElementById('chat');
    const messages = document.getElementById('messages');
    const scrollButton = document.getElementById('scrollButton');
    const input = document.getElementById('messageInput');
    
    // Initialize StickToBottom
    const stickToBottom = new StickToBottom(container, messages, {
      resize: 'smooth',
      initial: 'smooth'
    });
    
    // Show/hide scroll button based on position
    stickToBottom.on('bottomChange', (isAtBottom) => {
      scrollButton.style.display = isAtBottom ? 'none' : 'block';
    });
    
    // Scroll to bottom when button clicked
    scrollButton.addEventListener('click', () => {
      stickToBottom.scrollToBottom({ animation: 'smooth' });
    });
    
    // Add message function
    function addMessage(text) {
      const messageEl = document.createElement('div');
      messageEl.className = 'message';
      messageEl.textContent = text;
      messages.appendChild(messageEl);
    }
    
    // Handle input
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        addMessage(input.value);
        input.value = '';
      }
    });
    
    // Simulate incoming messages
    setInterval(() => {
      addMessage(`Message ${Date.now()}`);
    }, 2000);
  </script>
</body>
</html>
```

### Live Log Viewer

```javascript
import StickToBottom from 'stick-to-bottom';

class LogViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.logContainer = document.createElement('div');
    this.container.appendChild(this.logContainer);
    
    this.stickToBottom = new StickToBottom(this.container, this.logContainer, {
      resize: 'instant',  // Instant scroll for logs
      initial: true
    });
    
    this.setupControls();
  }
  
  setupControls() {
    // Auto-scroll toggle
    const toggle = document.createElement('button');
    toggle.textContent = 'Auto-scroll: ON';
    
    this.stickToBottom.on('bottomChange', (isAtBottom) => {
      toggle.textContent = `Auto-scroll: ${isAtBottom ? 'ON' : 'OFF'}`;
    });
    
    toggle.addEventListener('click', () => {
      this.stickToBottom.scrollToBottom();
    });
    
    this.container.parentElement.appendChild(toggle);
  }
  
  addLog(level, message) {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${level}`;
    logEntry.innerHTML = `
      <span class="timestamp">${new Date().toLocaleTimeString()}</span>
      <span class="level">[${level.toUpperCase()}]</span>
      <span class="message">${message}</span>
    `;
    
    this.logContainer.appendChild(logEntry);
    
    // Keep only last 1000 entries
    while (this.logContainer.children.length > 1000) {
      this.logContainer.removeChild(this.logContainer.firstChild);
    }
  }
}

// Usage
const logger = new LogViewer('log-container');
logger.addLog('info', 'Application started');
logger.addLog('error', 'Connection failed');
```

## 📚 API Reference

### Constructor

```javascript
new StickToBottom(scrollElement, contentElement, options)
```

**Parameters:**
- `scrollElement` (HTMLElement): The scrollable container
- `contentElement` (HTMLElement): The content element to observe
- `options` (Object, optional): Configuration options

**Options:**
- `damping` (number, default: 0.7): Animation damping (0-1)
- `stiffness` (number, default: 0.05): Animation stiffness
- `mass` (number, default: 1.25): Animation mass
- `initial` (boolean|string|Object, default: true): Initial scroll behavior
- `resize` (string|Object, default: inherited): Resize scroll behavior
- `targetScrollTop` (function): Custom target scroll calculation

### Methods

#### `scrollToBottom(options)`
Scrolls to the bottom with optional configuration.

**Parameters:**
- `options.animation` (string|Object): Animation configuration ('instant' or spring config)
- `options.duration` (number|Promise): Duration to wait before completion
- `options.wait` (number|boolean): Wait time before starting
- `options.preserveScrollPosition` (boolean): Don't change isAtBottom state
- `options.ignoreEscapes` (boolean): Ignore user scroll during animation

**Returns:** Promise<boolean> - Resolves to true if successful

#### `on(event, handler)`
Subscribe to events.

**Events:**
- `bottomChange`: Fired when isAtBottom state changes
- `escapeChange`: Fired when user escapes sticky behavior
- `nearBottomChange`: Fired when near bottom state changes
- `stateChange`: Fired on any state change

**Returns:** Function to unsubscribe

#### `off(event, handler)`
Unsubscribe from events.

#### `setScrollElement(element)`
Change the scroll element.

#### `setContentElement(element)`
Change the content element.

#### `destroy()`
Clean up all event listeners and resources.

### Properties

#### `state`
Current state object containing:
- `isAtBottom` (boolean): Whether currently at bottom
- `escapedFromLock` (boolean): Whether user has scrolled up
- `isNearBottom` (boolean): Whether near bottom (within offset)
- `scrollTop` (number): Current scroll position
- `targetScrollTop` (number): Target scroll position

#### `scrollTop` (getter/setter)
Get or set the current scroll position.

#### `isNearBottom` (getter)
Check if scroll position is near bottom.

## 🔧 Configuration

### Animation Configuration

```javascript
{
  damping: 0.7,      // How much to slow down the animation (0 = no damping, 1 = full damping)
  stiffness: 0.05,   // How quickly animation reaches target (higher = faster)
  mass: 1.25         // Inertial mass (higher = slower, more momentum)
}
```

### Behavior Options

```javascript
{
  initial: 'smooth',     // Scroll on initialization: true, false, 'instant', 'smooth', or animation config
  resize: 'smooth',      // Scroll on resize: 'instant', 'smooth', or animation config
  targetScrollTop: (target, elements) => {
    // Custom target calculation
    return target - 100; // Leave 100px from bottom
  }
}
```

## 🌟 Advanced Usage

### Custom Animation Presets

```javascript
const animations = {
  bounce: { damping: 0.5, stiffness: 0.1, mass: 0.8 },
  gentle: { damping: 0.8, stiffness: 0.03, mass: 1.5 },
  snappy: { damping: 0.6, stiffness: 0.08, mass: 1.0 }
};

const stickToBottom = new StickToBottom(container, content, {
  ...animations.gentle,
  resize: animations.snappy
});
```

### Dynamic Element Management

```javascript
class DynamicChat {
  constructor() {
    this.stickToBottom = new StickToBottom(null, null);
    this.setupDynamicElements();
  }
  
  setupDynamicElements() {
    // Change containers dynamically
    document.addEventListener('tab-change', (e) => {
      const newContainer = document.querySelector(`#${e.detail.tabId} .chat`);
      const newContent = newContainer.querySelector('.messages');
      
      this.stickToBottom.setScrollElement(newContainer);
      this.stickToBottom.setContentElement(newContent);
    });
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the React `useStickToBottom` hook
- Built for modern web applications that need smooth scrolling behavior
- Designed with chat applications and live content in mind