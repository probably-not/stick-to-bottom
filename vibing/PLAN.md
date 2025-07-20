# Vanilla JavaScript StickToBottom Implementation Plan

## Overview

This document provides a detailed plan for refactoring the React `useStickToBottom` hook and `StickToBottom` component into a framework-agnostic Vanilla JavaScript implementation. The original code is extremely well-written and optimized, so this plan emphasizes maximum code reuse.

**Key Principle**: ~70% of the existing code can be copied directly or with minor modifications. Only the React-specific wrapper needs rewriting.

## 1. Code That Can Be Copied Directly (No Changes)

### 1.1 Constants
Copy these lines verbatim from the original:
```javascript
// Lines 246-248
const STICK_TO_BOTTOM_OFFSET_PX = 70;
const SIXTY_FPS_INTERVAL_MS = 1000 / 60;
const RETAIN_ANIMATION_DURATION_MS = 350;
```

### 1.2 Default Spring Animation Configuration
Copy the entire object:
```javascript
// Lines 185-209
const DEFAULT_SPRING_ANIMATION = {
  damping: 0.7,
  stiffness: 0.05,
  mass: 1.25,
};
```

### 1.3 Global Mouse Tracking
Copy the entire mouse tracking system:
```javascript
// Lines 250-262
let mouseDown = false;

globalThis.document?.addEventListener("mousedown", () => {
  mouseDown = true;
});

globalThis.document?.addEventListener("mouseup", () => {
  mouseDown = false;
});

globalThis.document?.addEventListener("click", () => {
  mouseDown = false;
});
```

### 1.4 Animation Caching System
Copy the entire `mergeAnimations` function and cache:
```javascript
// Lines 683-708
const animationCache = new Map();

function mergeAnimations(...animations) {
  // Copy entire function body as-is
}
```

## 2. Code That Needs Minor Modifications

### 2.1 State Object Structure

The state object (lines 302-372) can be mostly copied. Replace React refs with direct property access:

**Original**: `scrollRef.current`  
**Replace with**: `this.scrollElement`

**Original**: `contentRef.current`  
**Replace with**: `this.contentElement`

**Original**: `optionsRef.current`  
**Replace with**: `this.options`

Example modifications:
```javascript
// Original getter
get scrollTop() {
  return scrollRef.current?.scrollTop ?? 0;
}

// Modified for vanilla
get scrollTop() {
  return this.scrollElement?.scrollTop ?? 0;
}
```

### 2.2 Core Methods to Port

#### `isSelecting()` Method (lines 276-289)
Copy the logic, wrap in a class method:
```javascript
isSelecting() {
  // Copy entire function body
  // Replace scrollRef.current with this.scrollElement
}
```

#### `scrollToBottom()` Method (lines 375-525)
This is the most complex method. Copy the entire logic with these replacements:
- `state.` → `this.state.`
- `setIsAtBottom()` → `this.setIsAtBottom()`
- `setEscapedFromLock()` → `this.setEscapedFromLock()`
- `scrollToBottom()` → `this.scrollToBottom()`
- `optionsRef.current` → `this.options`

#### Event Handlers
Copy logic from:
- `handleScroll` (lines 537-608)
- `handleWheel` (lines 610-637)
- ResizeObserver setup (lines 644-730)

Apply same ref replacements as above.

### 2.3 Getter Methods
Copy these getters directly into the class:
- `targetScrollTop` getter
- `calculatedTargetScrollTop` getter (includes caching logic)
- `scrollDifference` getter
- `isNearBottom` getter

## 3. New Code to Write

### 3.1 Class Structure
```javascript
class StickToBottom {
  constructor(scrollElement, contentElement, options = {}) {
    // Initialize properties
    this.scrollElement = scrollElement;
    this.contentElement = contentElement;
    this.options = { ...DEFAULT_SPRING_ANIMATION, ...options };
    
    // Initialize state (copy structure from lines 302-372)
    this.state = { /* ... */ };
    
    // Event emitter setup
    this.listeners = new Map();
    
    // Bind methods
    this.handleScroll = this.handleScroll.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    
    // Initialize
    this.init();
  }
}
```

### 3.2 Simple Event Emitter
```javascript
on(event, handler) {
  if (!this.listeners.has(event)) {
    this.listeners.set(event, new Set());
  }
  this.listeners.get(event).add(handler);
  return () => this.off(event, handler); // Return unsubscribe function
}

off(event, handler) {
  this.listeners.get(event)?.delete(handler);
}

emit(event, data) {
  this.listeners.get(event)?.forEach(handler => handler(data));
}
```

### 3.3 State Setters with Events
```javascript
setIsAtBottom(isAtBottom) {
  const changed = this.state.isAtBottom !== isAtBottom;
  this.state.isAtBottom = isAtBottom;
  if (changed) {
    this.emit('bottomChange', isAtBottom);
    this.emit('stateChange', { isAtBottom });
  }
}

setEscapedFromLock(escapedFromLock) {
  const changed = this.state.escapedFromLock !== escapedFromLock;
  this.state.escapedFromLock = escapedFromLock;
  if (changed) {
    this.emit('escapeChange', escapedFromLock);
    this.emit('stateChange', { escapedFromLock });
  }
}
```

### 3.4 Initialization and Cleanup
```javascript
init() {
  // Setup event listeners
  if (this.scrollElement) {
    this.scrollElement.addEventListener('scroll', this.handleScroll, { passive: true });
    this.scrollElement.addEventListener('wheel', this.handleWheel, { passive: true });
  }
  
  // Setup ResizeObserver (copy logic from lines 644-730)
  this.setupResizeObserver();
  
  // Initial scroll if specified
  if (this.options.initial !== false) {
    this.scrollToBottom({ animation: this.options.initial });
  }
}

destroy() {
  // Remove event listeners
  this.scrollElement?.removeEventListener('scroll', this.handleScroll);
  this.scrollElement?.removeEventListener('wheel', this.handleWheel);
  
  // Disconnect ResizeObserver
  this.state.resizeObserver?.disconnect();
  
  // Clear animation
  this.state.animation = null;
  
  // Clear listeners
  this.listeners.clear();
}
```

### 3.5 Element Setters
Replace `useRefCallback` with simple setters:
```javascript
setScrollElement(element) {
  // Remove old listeners
  if (this.scrollElement) {
    this.scrollElement.removeEventListener('scroll', this.handleScroll);
    this.scrollElement.removeEventListener('wheel', this.handleWheel);
  }
  
  // Set new element
  this.scrollElement = element;
  
  // Add new listeners
  if (element) {
    element.addEventListener('scroll', this.handleScroll, { passive: true });
    element.addEventListener('wheel', this.handleWheel, { passive: true });
  }
}

setContentElement(element) {
  // Disconnect old observer
  this.state.resizeObserver?.disconnect();
  
  // Set new element
  this.contentElement = element;
  
  // Reconnect observer
  if (element && this.state.resizeObserver) {
    this.state.resizeObserver.observe(element);
  }
}
```

## 4. Testing Strategy

### 4.1 Behavior Parity Tests
Create tests that verify the vanilla version matches React version behavior:
1. Scroll detection (up/down/at bottom)
2. Spring animation physics
3. Resize handling (positive/negative)
4. Escape detection
5. Selection handling
6. Animation queueing

### 4.2 Example Test Setup
```javascript
// Create side-by-side comparison
const reactVersion = // ... React implementation
const vanillaVersion = new StickToBottom(container, content, options);

// Compare states after operations
assert(reactVersion.isAtBottom === vanillaVersion.isAtBottom);
assert(reactVersion.escapedFromLock === vanillaVersion.escapedFromLock);
```

## 5. Module Structure

```
stick-to-bottom-vanilla/
├── src/
│   ├── index.js          // Main StickToBottom class
│   ├── constants.js      // Direct copy of constants
│   ├── animations.js     // Direct copy of animation functions
│   └── utils.js          // Helper functions
├── dist/
│   ├── stick-to-bottom.js      // UMD build
│   ├── stick-to-bottom.esm.js  // ES modules
│   ├── stick-to-bottom.min.js  // Minified
│   └── stick-to-bottom.d.ts    // TypeScript definitions
├── examples/
│   ├── basic.html
│   ├── chat.html
│   └── react-comparison.html
└── test/
    └── parity.test.js
```

## 6. Implementation Checklist

- [ ] Copy all constants and global variables
- [ ] Copy `mergeAnimations` function
- [ ] Create class structure with same state shape
- [ ] Port `isSelecting` method
- [ ] Port `scrollToBottom` method with ref replacements
- [ ] Port event handlers (`handleScroll`, `handleWheel`)
- [ ] Port ResizeObserver logic
- [ ] Implement simple event emitter
- [ ] Add state setters with event emission
- [ ] Create initialization and cleanup methods
- [ ] Test against React version for behavior parity
- [ ] Create documentation with migration guide
- [ ] Add TypeScript definitions

## 7. Usage Example

```javascript
// Basic usage matching React version
const container = document.querySelector('.chat-container');
const content = document.querySelector('.messages-content');

const stickToBottom = new StickToBottom(container, content, {
  resize: 'smooth',
  initial: 'smooth',
  damping: 0.7,
  stiffness: 0.05,
  mass: 1.25
});

// Listen to state changes
const unsubscribe = stickToBottom.on('bottomChange', (isAtBottom) => {
  document.querySelector('.scroll-button').hidden = isAtBottom;
});

// Programmatic control
button.onclick = () => {
  stickToBottom.scrollToBottom({ 
    animation: 'smooth',
    duration: 500 
  });
};

// Cleanup
window.addEventListener('beforeunload', () => {
  stickToBottom.destroy();
});
```

## 8. Migration Notes

### From React Version
```javascript
// React
const { scrollRef, contentRef, isAtBottom, scrollToBottom } = useStickToBottom();

// Vanilla equivalent
const stickToBottom = new StickToBottom(scrollEl, contentEl);
const { isAtBottom } = stickToBottom;
const { scrollToBottom } = stickToBottom;
```

### Key Differences
1. No refs - use direct element references
2. No hooks - use event listeners for state changes
3. Manual cleanup required (call `destroy()`)
4. Can dynamically change elements with setters

## 9. Performance Considerations

The original implementation is already highly optimized. Maintain these optimizations:
1. Animation caching system (don't recreate animation objects)
2. RAF-based animation loop
3. Debounced resize handling
4. Passive event listeners
5. Early returns in hot paths

## 10. Additional Features (Optional)

After achieving parity, consider adding:
1. Static helper for auto-attachment: `StickToBottom.attach(selector, options)`
2. Preset animations: `StickToBottom.presets.chat`
3. Plugin system for extensions
4. Scroll position persistence across page reloads