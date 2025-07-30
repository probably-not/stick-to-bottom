/**
 * TypeScript definitions for StickToBottom
 */

interface SpringAnimation {
  /** A value from 0 to 1, on how much to damp the animation. 0 means no damping, 1 means full damping. */
  damping: number;
  /** The stiffness of how fast/slow the animation gets up to speed. */
  stiffness: number;
  /** The inertial mass associated with the animation. Higher numbers make the animation slower. */
  mass: number;
}

interface StickToBottomOptions extends SpringAnimation {
  /** Whether to scroll to bottom on initialization. Default: true */
  initial?: boolean | SpringAnimation | "instant";
  /** Animation configuration for resize events */
  resize?: SpringAnimation | "instant";
  /** If true. uses isAtBottom instead of isNearBottom when determining if the user is at the bottom */
  useStrictCheck?: boolean;
  /** Custom target scroll top calculation function */
  targetScrollTop?: (targetScrollTop: number, elements: {
    scrollElement: HTMLElement;
    contentElement: HTMLElement;
  }) => number;
}

interface ScrollOptions {
  /** Animation configuration */
  animation?: SpringAnimation | "instant";
  /** Wait time before scrolling in milliseconds */
  wait?: number | boolean;
  /** Animation duration in milliseconds or a Promise */
  duration?: number | Promise<any>;
  /** Whether to preserve current scroll position */
  preserveScrollPosition?: boolean;
  /** Whether to ignore escape detection during animation */
  ignoreEscapes?: boolean;
}

interface StickToBottomState {
  scrollTop: number;
  lastScrollTop: number | undefined;
  ignoreScrollToTop: number | undefined;
  targetScrollTop: number;
  calculatedTargetScrollTop: number;
  scrollDifference: number;
  resizeDifference: number;
  animation: any;
  lastTick: number | undefined;
  velocity: number;
  accumulated: number;
  escapedFromLock: boolean;
  isAtBottom: boolean;
  isNearBottom: boolean;
  resizeObserver: ResizeObserver | undefined;
}

type EventHandler<T = any> = (data: T) => void;
type UnsubscribeFunction = () => void;

/**
 * StickToBottom class - Vanilla JavaScript implementation
 * 
 * Provides stick-to-bottom behavior for scrollable containers,
 * automatically scrolling to the bottom when new content is added while
 * preserving user scroll position when they scroll up.
 */
declare class StickToBottom {
  scrollElement: HTMLElement | null;
  contentElement: HTMLElement | null;
  options: StickToBottomOptions;
  state: StickToBottomState;
  
  /**
   * Creates a new StickToBottom instance
   * @param scrollElement - The scrollable container element
   * @param contentElement - The content element to observe for size changes
   * @param options - Configuration options
   */
  constructor(
    scrollElement: HTMLElement | null,
    contentElement: HTMLElement | null,
    options?: Partial<StickToBottomOptions>
  );

  /**
   * Subscribe to events
   * @param event - Event name
   * @param handler - Event handler function
   * @returns Unsubscribe function
   */
  on(event: 'bottomChange', handler: EventHandler<boolean>): UnsubscribeFunction;
  on(event: 'escapeChange', handler: EventHandler<boolean>): UnsubscribeFunction;
  on(event: 'nearBottomChange', handler: EventHandler<boolean>): UnsubscribeFunction;
  on(event: 'stateChange', handler: EventHandler<Partial<StickToBottomState>>): UnsubscribeFunction;
  on(event: string, handler: EventHandler): UnsubscribeFunction;

  /**
   * Unsubscribe from events
   * @param event - Event name
   * @param handler - Event handler function
   */
  off(event: string, handler: EventHandler): void;

  /**
   * Emit an event
   * @param event - Event name
   * @param data - Event data
   */
  emit(event: string, data?: any): void;

  /** Get current scroll position */
  get scrollTop(): number;
  /** Set scroll position */
  set scrollTop(value: number);

  /** Get target scroll position for bottom */
  get targetScrollTop(): number;

  /** Get calculated target scroll position */
  get calculatedTargetScrollTop(): number;

  /** Get difference between current and target scroll position */
  get scrollDifference(): number;

  /** Check if scroll position is near bottom */
  get isNearBottom(): boolean;

  /**
   * Detects if the user is currently selecting text within the scroll container
   * @returns True if user is selecting text
   */
  isSelecting(): boolean;

  /**
   * Scrolls to the bottom of the container with animation
   * @param scrollOptions - Scroll options or animation type
   * @returns Promise that resolves when scroll completes
   */
  scrollToBottom(scrollOptions?: ScrollOptions | string): Promise<boolean>;

  /**
   * Sets the scroll element and updates event listeners
   * @param element - The new scroll element
   */
  setScrollElement(element: HTMLElement | null): void;

  /**
   * Sets the content element and updates resize observer
   * @param element - The new content element
   */
  setContentElement(element: HTMLElement | null): void;

  /**
   * Initializes the StickToBottom instance
   * Sets up event listeners and resize observer
   */
  init(): void;

  /**
   * Destroys the StickToBottom instance
   * Removes all event listeners and cleans up resources
   */
  destroy(): void;
}

export = StickToBottom;
export as namespace StickToBottom;