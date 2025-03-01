export class SerialTaskExecutor {
  private queue: Array<() => Promise<any>> = [];

  private running = false;

  public enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }

        this.executeNext();
      });

      if (!this.running) {
        this.running = true;
        this.executeNext();
      }
    });
  }

  private executeNext(): void {
    if (this.queue.length === 0) {
      this.running = false;
      return;
    }

    const task = this.queue.shift()!;
    task();
  }
}
