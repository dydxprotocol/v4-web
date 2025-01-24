export class Signal extends EventTarget {
  notify() {
    this.dispatchEvent(new Event('trigger'));
  }

  onTrigger(callback: () => void) {
    // Store the callback reference
    const listener = callback.bind(null);
    this.addEventListener('trigger', listener);

    // Return an unsubscribe function
    return () => {
      this.removeEventListener('trigger', listener);
    };
  }
}
