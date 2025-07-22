/**
 * Vanilla JavaScript implementation of StickToBottom
 * Ported from React useStickToBottom hook
 * 
 * This class provides stick-to-bottom behavior for scrollable containers,
 * automatically scrolling to the bottom when new content is added while
 * preserving user scroll position when they scroll up.
 */

// Constants
const STICK_TO_BOTTOM_OFFSET_PX = 70;
const SIXTY_FPS_INTERVAL_MS = 1000 / 60;
const RETAIN_ANIMATION_DURATION_MS = 350;

// Default spring animation configuration
const DEFAULT_SPRING_ANIMATION = {
  /**
   * A value from 0 to 1, on how much to damp the animation.
   * 0 means no damping, 1 means full damping.
   *
   * @default 0.7
   */
  damping: 0.7,

  /**
   * The stiffness of how fast/slow the animation gets up to speed.
   *
   * @default 0.05
   */
  stiffness: 0.05,

  /**
   * The inertial mass associated with the animation.
   * Higher numbers make the animation slower.
   *
   * @default 1.25
   */
  mass: 1.25,
};

// Global mouse tracking
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

// Animation caching system
const animationCache = new Map();

function mergeAnimations(...animations) {
  const result = { ...DEFAULT_SPRING_ANIMATION };
  let instant = false;

  for (const animation of animations) {
    if (animation === "instant") {
      instant = true;
      continue;
    }

    if (typeof animation !== "object") {
      continue;
    }

    instant = false;

    result.damping = animation.damping ?? result.damping;
    result.stiffness = animation.stiffness ?? result.stiffness;
    result.mass = animation.mass ?? result.mass;
  }

  const key = JSON.stringify(result);

  if (!animationCache.has(key)) {
    animationCache.set(key, Object.freeze(result));
  }

  return instant ? "instant" : animationCache.get(key);
}

/**
 * StickToBottom class - Vanilla JavaScript implementation
 * 
 * @class StickToBottom
 * @param {HTMLElement} scrollElement - The scrollable container element
 * @param {HTMLElement} contentElement - The content element to observe for size changes
 * @param {Object} options - Configuration options
 */
class StickToBottom {
  constructor(scrollElement, contentElement, options = {}) {
    // Initialize properties
    this.scrollElement = scrollElement;
    this.contentElement = contentElement;
    this.options = { ...DEFAULT_SPRING_ANIMATION, ...options };
    
    // Event emitter setup
    this.listeners = new Map();
    
    // Initialize state
    this.state = {
      scrollTop: 0,
      lastScrollTop: undefined,
      ignoreScrollToTop: undefined,
      targetScrollTop: 0,
      calculatedTargetScrollTop: 0,
      scrollDifference: 0,
      resizeDifference: 0,
      animation: undefined,
      lastTick: undefined,
      velocity: 0,
      accumulated: 0,
      escapedFromLock: false,
      isAtBottom: options.initial !== false,
      isNearBottom: false,
      resizeObserver: undefined,
    };
    
    // Cache for calculated values
    this.lastCalculation = undefined;
    
    // Bind methods
    this.handleScroll = this.handleScroll.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    
    // Initialize
    this.init();
  }

  // Event emitter methods
  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event, data) {
    this.listeners.get(event)?.forEach(handler => handler(data));
  }

  // State getters
  get scrollTop() {
    return this.scrollElement?.scrollTop ?? 0;
  }

  set scrollTop(scrollTop) {
    if (this.scrollElement) {
      this.scrollElement.scrollTop = scrollTop;
      this.state.ignoreScrollToTop = this.scrollElement.scrollTop;
    }
  }

  get targetScrollTop() {
    if (!this.scrollElement || !this.contentElement) {
      if (!this.scrollElement) {
        console.warn('StickToBottom: scrollElement not set');
      }
      if (!this.contentElement) {
        console.warn('StickToBottom: contentElement not set');
      }
      return 0;
    }

    return (
      this.scrollElement.scrollHeight - 1 - this.scrollElement.clientHeight
    );
  }

  get calculatedTargetScrollTop() {
    if (!this.scrollElement || !this.contentElement) {
      if (!this.scrollElement) {
        console.warn('StickToBottom: scrollElement not set');
      }
      if (!this.contentElement) {
        console.warn('StickToBottom: contentElement not set');
      }
      return 0;
    }

    const { targetScrollTop } = this;

    if (!this.options.targetScrollTop) {
      return targetScrollTop;
    }

    if (this.lastCalculation?.targetScrollTop === targetScrollTop) {
      return this.lastCalculation.calculatedScrollTop;
    }

    const calculatedScrollTop = Math.max(
      Math.min(
        this.options.targetScrollTop(targetScrollTop, {
          scrollElement: this.scrollElement,
          contentElement: this.contentElement,
        }),
        targetScrollTop,
      ),
      0,
    );

    this.lastCalculation = { targetScrollTop, calculatedScrollTop };

    requestAnimationFrame(() => {
      this.lastCalculation = undefined;
    });

    return calculatedScrollTop;
  }

  get scrollDifference() {
    return this.calculatedTargetScrollTop - this.scrollTop;
  }

  get isNearBottom() {
    return this.scrollDifference <= STICK_TO_BOTTOM_OFFSET_PX;
  }

  // State setters with events
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

  setIsNearBottom(isNearBottom) {
    const changed = this.state.isNearBottom !== isNearBottom;
    this.state.isNearBottom = isNearBottom;
    if (changed) {
      this.emit('nearBottomChange', isNearBottom);
      this.emit('stateChange', { isNearBottom });
    }
  }

  /**
   * Detects if the user is currently selecting text within the scroll container
   * @returns {boolean} - True if user is selecting text
   */
  isSelecting() {
    if (!mouseDown) {
      return false;
    }

    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) {
      return false;
    }

    const range = selection.getRangeAt(0);
    return (
      range.commonAncestorContainer.contains(this.scrollElement) ||
      this.scrollElement?.contains(range.commonAncestorContainer)
    );
  }

  /**
   * Scrolls to the bottom of the container with animation
   * @param {Object|string} scrollOptions - Scroll options or animation type
   * @param {string|Object} scrollOptions.animation - Animation configuration
   * @param {number} scrollOptions.wait - Wait time before scrolling
   * @param {number|Promise} scrollOptions.duration - Animation duration
   * @param {boolean} scrollOptions.preserveScrollPosition - Whether to preserve scroll position
   * @param {boolean} scrollOptions.ignoreEscapes - Whether to ignore escape detection
   * @returns {Promise<boolean>} - Resolves when scroll completes
   */
  scrollToBottom(scrollOptions = {}) {
    if (typeof scrollOptions === "string") {
      scrollOptions = { animation: scrollOptions };
    }

    if (!scrollOptions.preserveScrollPosition) {
      this.setIsAtBottom(true);
    }

    const waitElapsed = Date.now() + (Number(scrollOptions.wait) || 0);
    const behavior = mergeAnimations(
      this.options,
      scrollOptions.animation,
    );
    const { ignoreEscapes = false } = scrollOptions;

    let durationElapsed;
    let startTarget = this.calculatedTargetScrollTop;

    if (scrollOptions.duration instanceof Promise) {
      scrollOptions.duration.finally(() => {
        durationElapsed = Date.now();
      });
    } else {
      durationElapsed = waitElapsed + (scrollOptions.duration ?? 0);
    }

    const next = async () => {
      const promise = new Promise(requestAnimationFrame).then(() => {
        if (!this.state.isAtBottom) {
          this.state.animation = undefined;
          return false;
        }

        const scrollTop = this.scrollTop;
        const tick = performance.now();
        const tickDelta = (tick - (this.state.lastTick ?? tick)) / SIXTY_FPS_INTERVAL_MS;
        this.state.animation ||= { behavior, promise, ignoreEscapes };

        if (this.state.animation.behavior === behavior) {
          this.state.lastTick = tick;
        }

        if (this.isSelecting()) {
          return next();
        }

        if (waitElapsed > Date.now()) {
          return next();
        }

        if (scrollTop < Math.min(startTarget, this.calculatedTargetScrollTop)) {
          if (this.state.animation?.behavior === behavior) {
            if (behavior === "instant") {
              this.scrollTop = this.calculatedTargetScrollTop;
              return next();
            }

            this.state.velocity = (behavior.damping * this.state.velocity +
              behavior.stiffness * this.scrollDifference) / behavior.mass;
            this.state.accumulated += this.state.velocity * tickDelta;
            this.scrollTop += this.state.accumulated;

            if (this.scrollTop !== scrollTop) {
              this.state.accumulated = 0;
            }
          }

          return next();
        }

        if (durationElapsed > Date.now()) {
          startTarget = this.calculatedTargetScrollTop;
          return next();
        }

        this.state.animation = undefined;

        // If we're still below the target, queue up another scroll
        if (this.scrollTop < this.calculatedTargetScrollTop) {
          return this.scrollToBottom({
            animation: mergeAnimations(
              this.options,
              this.options.resize,
            ),
            ignoreEscapes,
            duration: Math.max(0, durationElapsed - Date.now()) || undefined,
          });
        }

        return this.state.isAtBottom;
      });

      return promise.then((isAtBottom) => {
        requestAnimationFrame(() => {
          if (!this.state.animation) {
            this.state.lastTick = undefined;
            this.state.velocity = 0;
          }
        });

        return isAtBottom;
      });
    };

    if (scrollOptions.wait !== true) {
      this.state.animation = undefined;
    }

    if (this.state.animation?.behavior === behavior) {
      return this.state.animation.promise;
    }

    return next();
  }

  // Event handlers
  handleScroll(event) {
    if (event.target !== this.scrollElement) {
      return;
    }

    const scrollTop = this.scrollTop;
    const { ignoreScrollToTop, isAtBottom } = this.state;
    let { lastScrollTop = scrollTop } = this.state;

    this.state.lastScrollTop = scrollTop;
    this.state.ignoreScrollToTop = undefined;

    if (ignoreScrollToTop && ignoreScrollToTop > scrollTop) {
      // When the user scrolls up while animation plays, set lastScrollTop to ignored event
      lastScrollTop = ignoreScrollToTop;
    }

    this.setIsNearBottom(this.isNearBottom);

    // Use timeout to handle resize events correctly
    setTimeout(() => {
      // When there's a resize difference ignore the resize event
      if (this.state.resizeDifference || scrollTop === ignoreScrollToTop) {
        return;
      }

      if (this.isSelecting()) {
        this.setEscapedFromLock(true);
        this.setIsAtBottom(false);
        return;
      }

      const isScrollingDown = scrollTop > lastScrollTop;
      const isScrollingUp = scrollTop < lastScrollTop;

      if (this.state.animation?.ignoreEscapes) {
        this.scrollTop = lastScrollTop;
        return;
      }

      if (isScrollingUp && !isAtBottom) {
        this.setEscapedFromLock(true);
        this.setIsAtBottom(false);
      }

      if (isScrollingDown) {
        this.setEscapedFromLock(false);
      }

      if (!this.state.escapedFromLock && this.isNearBottom) {
        this.setIsAtBottom(true);
      }
    }, 1);
  }

  handleWheel(event) {
    let element = event.target;

    while (!["scroll", "auto"].includes(getComputedStyle(element).overflow)) {
      if (!element.parentElement) {
        return;
      }
      element = element.parentElement;
    }

    // The browser may cancel scrolling from mouse wheel if we update it from animation
    // To prevent this, always escape when the wheel is scrolled up
    if (
      element === this.scrollElement &&
      event.deltaY < 0 &&
      this.scrollElement.scrollHeight > this.scrollElement.clientHeight &&
      !this.state.animation?.ignoreEscapes
    ) {
      this.setEscapedFromLock(true);
      this.setIsAtBottom(false);
    }
  }

  // ResizeObserver setup
  setupResizeObserver() {
    this.state.resizeObserver?.disconnect();

    if (!this.contentElement) {
      return;
    }

    let previousHeight;

    this.state.resizeObserver = new ResizeObserver(([entry]) => {
      const { height } = entry.contentRect;
      const difference = height - (previousHeight ?? height);

      this.state.resizeDifference = difference;

      // Sometimes the browser can overscroll past the target
      if (this.scrollTop > this.targetScrollTop) {
        this.scrollTop = this.targetScrollTop;
      }

      this.setIsNearBottom(this.isNearBottom);

      if (difference >= 0) {
        // If it's a positive resize, scroll to the bottom when we're already at the bottom
        const animation = mergeAnimations(
          this.options,
          previousHeight
            ? this.options.resize
            : this.options.initial,
        );

        this.scrollToBottom({
          animation,
          wait: true,
          preserveScrollPosition: true,
          duration:
            animation === "instant" ? undefined : RETAIN_ANIMATION_DURATION_MS,
        });
      } else {
        // If it's a negative resize, check if we're near the bottom
        // if we are want to un-escape from the lock, because the resize
        // could have caused the container to be at the bottom
        if (this.isNearBottom) {
          this.setEscapedFromLock(false);
          this.setIsAtBottom(true);
        }
      }

      previousHeight = height;

      // Reset the resize difference after the scroll event has fired
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (this.state.resizeDifference === difference) {
            this.state.resizeDifference = 0;
          }
        }, 1);
      });
    });

    this.state.resizeObserver?.observe(this.contentElement);
  }

  /**
   * Sets the scroll element and updates event listeners
   * @param {HTMLElement} element - The new scroll element
   */
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

  /**
   * Sets the content element and updates resize observer
   * @param {HTMLElement} element - The new content element
   */
  setContentElement(element) {
    // Disconnect old observer
    this.state.resizeObserver?.disconnect();

    // Set new element
    this.contentElement = element;

    // Setup new observer
    this.setupResizeObserver();
  }

  /**
   * Initializes the StickToBottom instance
   * Sets up event listeners and resize observer
   */
  init() {
    // Setup event listeners
    if (this.scrollElement) {
      this.scrollElement.addEventListener('scroll', this.handleScroll, { passive: true });
      this.scrollElement.addEventListener('wheel', this.handleWheel, { passive: true });
    }

    // Setup ResizeObserver
    this.setupResizeObserver();

    // Initial scroll if specified
    if (this.options.initial !== false) {
      this.scrollToBottom({ animation: this.options.initial });
    }
  }

  /**
   * Destroys the StickToBottom instance
   * Removes all event listeners and cleans up resources
   */
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
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StickToBottom;
}

if (typeof window !== 'undefined') {
  window.StickToBottom = StickToBottom;
}

export default StickToBottom;
