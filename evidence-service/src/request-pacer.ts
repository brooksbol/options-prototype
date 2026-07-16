/**
 * Request Pacer — queues upstream Tradier calls to respect rate limits.
 *
 * Instead of rejecting requests with 429, the pacer holds them in a queue
 * and dispatches at a safe pace (~1 request per second, well within 60/min).
 *
 * The frontend sees delayed responses, not failures.
 * Provider rate limits are fully owned by the backend.
 */

type QueuedRequest<T> = {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
  enqueuedAt: number;
};

export class RequestPacer {
  private queue: QueuedRequest<unknown>[] = [];
  private processing = false;
  private readonly intervalMs: number;
  private readonly maxQueueSize: number;
  private stats = { dispatched: 0, queued: 0, rejected: 0 };

  /**
   * @param requestsPerSecond - target pacing rate (default: 0.9 = ~54/min, safe margin under 60)
   * @param maxQueueSize - reject if queue exceeds this (prevent unbounded memory, default: 200)
   */
  constructor(requestsPerSecond: number = 0.9, maxQueueSize: number = 200) {
    this.intervalMs = Math.ceil(1000 / requestsPerSecond);
    this.maxQueueSize = maxQueueSize;
  }

  /**
   * Submit a request to be paced. Returns a promise that resolves when the
   * request executes (may be delayed by queue position).
   */
  async submit<T>(execute: () => Promise<T>): Promise<T> {
    if (this.queue.length >= this.maxQueueSize) {
      this.stats.rejected++;
      throw new Error("Request queue full — provider capacity exhausted");
    }

    this.stats.queued++;

    return new Promise<T>((resolve, reject) => {
      this.queue.push({ execute: execute as () => Promise<unknown>, resolve: resolve as (v: unknown) => void, reject, enqueuedAt: Date.now() });
      this.processQueue();
    });
  }

  /**
   * Get pacing state for diagnostics.
   */
  getState(): { queueDepth: number; paceMs: number; dispatched: number; queued: number; rejected: number } {
    return {
      queueDepth: this.queue.length,
      paceMs: this.intervalMs,
      dispatched: this.stats.dispatched,
      queued: this.stats.queued,
      rejected: this.stats.rejected,
    };
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return; // already draining
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      try {
        const result = await item.execute();
        this.stats.dispatched++;
        item.resolve(result);
      } catch (err) {
        item.reject(err);
      }

      // Pace: wait before processing the next request
      if (this.queue.length > 0) {
        await sleep(this.intervalMs);
      }
    }

    this.processing = false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Singleton
let instance: RequestPacer | null = null;

export function getRequestPacer(): RequestPacer {
  if (!instance) instance = new RequestPacer(0.9, 200);
  return instance;
}
