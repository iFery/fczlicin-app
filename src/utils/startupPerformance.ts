/**
 * Startup Performance Instrumentation
 * 
 * Tracks precise timing throughout the app startup lifecycle:
 * - Process start → JS runtime initialization → App bootstrap → First render → First meaningful screen → App interactive
 * 
 * Usage:
 * - Call markStartupCheckpoint(tag) at critical points
 * - Logs include absolute timestamp and delta from previous checkpoint
 * - All logs prefixed with [TAG] for easy filtering
 * 
 * Example output:
 * [BOOT] App entry: 0ms
 * [INIT] App component mounted: +42ms
 * [CACHE] Cache loaded: +310ms
 * [RENDER] First screen rendered: +620ms
 * [READY] App interactive: +890ms
 */

const STARTUP_TAG = '🚀 [STARTUP]';

interface Checkpoint {
  tag: string;
  timestamp: number;
  delta: number;
  description?: string;
}

class StartupPerformanceTracker {
  private startTime: number;
  private checkpoints: Checkpoint[] = [];
  private enabled: boolean = true;

  constructor() {
    // Use performance.now() for high-resolution timing
    // Fallback to Date.now() if not available
    this.startTime = typeof performance !== 'undefined' && performance.now 
      ? performance.now() 
      : Date.now();
    
    // Log the very first checkpoint
    this.logCheckpoint({
      tag: 'BOOT',
      timestamp: 0,
      delta: 0,
      description: 'App entry point - first JS execution',
    });
  }

  /**
   * Mark a checkpoint in the startup timeline
   * @param tag - Unique tag for this checkpoint (e.g., 'INIT', 'CACHE', 'RENDER')
   * @param description - Optional description of what happened at this checkpoint
   */
  markCheckpoint(tag: string, description?: string): void {
    if (!this.enabled) return;

    const now = typeof performance !== 'undefined' && performance.now 
      ? performance.now() 
      : Date.now();
    
    const timestamp = typeof performance !== 'undefined' && performance.now
      ? now - this.startTime
      : now - this.startTime;
    
    const lastCheckpoint = this.checkpoints[this.checkpoints.length - 1];
    const delta = lastCheckpoint 
      ? timestamp - (typeof performance !== 'undefined' && performance.now 
          ? lastCheckpoint.timestamp 
          : lastCheckpoint.timestamp)
      : timestamp;

    const checkpoint: Checkpoint = {
      tag,
      timestamp,
      delta,
      description,
    };

    this.checkpoints.push(checkpoint);
    this.logCheckpoint(checkpoint);
  }

  /**
   * Log a checkpoint to console with formatted output
   */
  private logCheckpoint(checkpoint: Checkpoint): void {
    const deltaStr = checkpoint.delta >= 0 
      ? `+${checkpoint.delta.toFixed(2)}ms` 
      : `${checkpoint.delta.toFixed(2)}ms`;
    
    const timestampStr = checkpoint.timestamp.toFixed(2);
    const descriptionStr = checkpoint.description 
      ? ` - ${checkpoint.description}` 
      : '';
    
    // Format: [TAG] Description: TIMESTAMPms (+DELTAms)
    const logMessage = `[${checkpoint.tag}] ${timestampStr}ms (${deltaStr})${descriptionStr}`;
    
    // Use console.log for visibility (can be filtered in dev tools)
    console.log(`${STARTUP_TAG} ${logMessage}`);
    
    // Also log to native console for logcat/Xcode
    if (typeof console.trace !== 'undefined') {
      // React Native will log this to native logs
    }
  }

  /**
   * Get all checkpoints as an array
   */
  getCheckpoints(): Checkpoint[] {
    return [...this.checkpoints];
  }

  /**
   * Get the full startup timeline as a formatted string
   */
  getTimeline(): string {
    const lines = [
      `${STARTUP_TAG} === STARTUP PERFORMANCE TIMELINE ===`,
      `${STARTUP_TAG} Total duration: ${this.checkpoints[this.checkpoints.length - 1]?.timestamp.toFixed(2)}ms`,
      `${STARTUP_TAG} `,
      ...this.checkpoints.map(checkpoint => {
        const deltaStr = checkpoint.delta >= 0 
          ? `+${checkpoint.delta.toFixed(2)}ms` 
          : `${checkpoint.delta.toFixed(2)}ms`;
        const descriptionStr = checkpoint.description 
          ? ` - ${checkpoint.description}` 
          : '';
        return `${STARTUP_TAG} [${checkpoint.tag}] ${checkpoint.timestamp.toFixed(2)}ms (${deltaStr})${descriptionStr}`;
      }),
      `${STARTUP_TAG} === END TIMELINE ===`,
    ];
    
    return lines.join('\n');
  }

  /**
   * Log the complete timeline summary
   */
  logTimeline(): void {
    console.log(this.getTimeline());
  }

  /**
   * Group checkpoints by phase for analysis
   */
  getPhaseTimings(): Record<string, { start: number; end: number; duration: number }> {
    const phases: Record<string, { start: number; end: number; duration: number }> = {};
    
    // Define phase boundaries by tag prefixes
    const phaseDefinitions = [
      { name: 'Boot', tags: ['BOOT', 'ENTRY'] },
      { name: 'Init', tags: ['INIT', 'FIREBASE', 'CONFIG'] },
      { name: 'Bootstrap', tags: ['BOOTSTRAP', 'CACHE', 'PRELOAD', 'REMOTE_CONFIG', 'UPDATE'] },
      { name: 'Render', tags: ['RENDER', 'FONT', 'PROVIDER', 'NAVIGATION'] },
      { name: 'Screen', tags: ['SCREEN', 'HOME', 'FIRST_SCREEN'] },
      { name: 'Interactive', tags: ['READY', 'INTERACTIVE'] },
    ];
    
    for (const phase of phaseDefinitions) {
      const phaseCheckpoints = this.checkpoints.filter(cp => 
        phase.tags.some(tag => cp.tag.startsWith(tag))
      );
      
      if (phaseCheckpoints.length > 0) {
        phases[phase.name] = {
          start: phaseCheckpoints[0].timestamp,
          end: phaseCheckpoints[phaseCheckpoints.length - 1].timestamp,
          duration: phaseCheckpoints[phaseCheckpoints.length - 1].timestamp - phaseCheckpoints[0].timestamp,
        };
      }
    }
    
    return phases;
  }

  /**
   * Disable tracking (for production builds if needed)
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Enable tracking
   */
  enable(): void {
    this.enabled = true;
  }
}

// Singleton instance
let trackerInstance: StartupPerformanceTracker | null = null;

/**
 * Get or create the singleton tracker instance
 */
export function getStartupTracker(): StartupPerformanceTracker {
  if (!trackerInstance) {
    trackerInstance = new StartupPerformanceTracker();
  }
  return trackerInstance;
}

/**
 * Mark a startup checkpoint
 * @param tag - Unique tag for this checkpoint
 * @param description - Optional description
 */
export function markStartupCheckpoint(tag: string, description?: string): void {
  getStartupTracker().markCheckpoint(tag, description);
}

/**
 * Get the startup timeline
 */
export function getStartupTimeline(): string {
  return getStartupTracker().getTimeline();
}

/**
 * Log the complete startup timeline
 */
export function logStartupTimeline(): void {
  getStartupTracker().logTimeline();
}

/**
 * Get phase timings for analysis
 */
export function getStartupPhaseTimings(): Record<string, { start: number; end: number; duration: number }> {
  return getStartupTracker().getPhaseTimings();
}

// Export the tracker class for advanced usage
export { StartupPerformanceTracker };
