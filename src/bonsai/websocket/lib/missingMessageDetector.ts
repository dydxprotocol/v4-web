import { timeUnits } from '@/constants/time';

const MAX_MISSING_MESSAGES = 1_000;

export class MissingMessageDetector {
  private maxSeenId: number | undefined;

  private timedOut = false;

  private missing: {
    [id: number]: NodeJS.Timeout;
  } = {};

  constructor(
    private onTimeout: (messageId: number) => void,
    private timeoutMs: number = timeUnits.second * 30
  ) {}

  insert(messageId: number): void {
    if (this.timedOut) return;

    if (this.maxSeenId == null) {
      this.maxSeenId = messageId;
      return;
    }

    if (messageId <= this.maxSeenId) {
      // This is a message filling a gap OR smaller than our initial message
      if (messageId in this.missing) {
        clearTimeout(this.missing[messageId]);
        delete this.missing[messageId];
      }
      return;
    }

    const gapSize = messageId - this.maxSeenId - 1;
    if (Object.keys(this.missing).length + gapSize > MAX_MISSING_MESSAGES) {
      this.timedOut = true;
      this.cleanup();
      this.onTimeout(this.maxSeenId + 1);
      return;
    }

    // Add missing ids between maxId and messageId
    // eslint-disable-next-line no-plusplus
    for (let id = this.maxSeenId + 1; id < messageId; id++) {
      this.missing[id] = setTimeout(() => {
        if (id in this.missing) {
          this.timedOut = true;
          this.cleanup();
          this.onTimeout(id);
        }
      }, this.timeoutMs);
    }

    this.maxSeenId = messageId;
  }

  cleanup(): void {
    Object.values(this.missing).forEach((info) => clearTimeout(info));
    this.missing = {};
  }
}
