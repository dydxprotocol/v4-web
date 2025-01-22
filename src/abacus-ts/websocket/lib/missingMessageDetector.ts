import { timeUnits } from '@/constants/time';

export class MissingMessageDetector {
  private maxSeenId: number | undefined;

  private missing: {
    [id: number]: NodeJS.Timeout;
  } = {};

  constructor(
    private onTimeout: (messageId: number) => void,
    private timeoutMs: number = timeUnits.second * 30
  ) {}

  insert(messageId: number): void {
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

    // Add missing ids between maxId and messageId
    // eslint-disable-next-line no-plusplus
    for (let id = this.maxSeenId + 1; id < messageId; id++) {
      this.missing[id] = setTimeout(() => {
        if (id in this.missing) {
          this.onTimeout(id);
          delete this.missing[id];
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
