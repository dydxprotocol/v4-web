export function createTimer() {
  let startTime: number | undefined;

  return {
    start(): void {
      startTime = Date.now();
    },
    elapsed(): number | undefined {
      if (startTime == null) {
        return undefined;
      }
      return Date.now() - startTime;
    },
  };
}

export function startTimer() {
  const startTime: number = Date.now();

  return {
    elapsed(): number {
      return Date.now() - startTime;
    },
  };
}
