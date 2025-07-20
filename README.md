# stick-to-bottom

**DISCLAIMER: THIS LIBRARY WAS 100% VIBE CODED BY CLAUDE CODE SONNET.**

[![npm version](https://img.shields.io/npm/v/@probably-not/stick-to-bottom.svg?style=flat-square)](https://www.npmjs.com/package/@probably-not/stick-to-bottom)
[![npm downloads](https://img.shields.io/npm/dm/@probably-not/stick-to-bottom.svg?style=flat-square)](https://www.npmjs.com/package/@probably-not/stick-to-bottom)
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
npm install @probably-not/stick-to-bottom
```

```bash
yarn add @probably-not/stick-to-bottom
```

```bash
pnpm add @probably-not/stick-to-bottom
```

## 📖 Usage

### Basic Usage

```javascript
import StickToBottom from '@probably-not/stick-to-bottom';

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

- Inspired by the React `useStickToBottom` hook from Stackblitz Labs
- Built for modern web applications that need smooth scrolling behavior
- Designed with chat applications and live content in mind