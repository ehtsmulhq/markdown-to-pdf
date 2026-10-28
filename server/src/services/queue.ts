export function createQueue() {
  const queue: Array<() => Promise<void>> = [];
  let isProcessing = false;

  const processNext = async () => {
    if (isProcessing || queue.length === 0) return;
    isProcessing = true;
    const task = queue.shift();
    if (task) {
      try {
        await task();
      } catch (err) {
        console.error("Queue execution error:", err);
      } finally {
        isProcessing = false;
        processNext();
      }
    }
  };

  return {
    enqueue<T>(fn: () => Promise<T>): Promise<T> {
      return new Promise<T>((resolve, reject) => {
        queue.push(async () => {
          try {
            const result = await fn();
            resolve(result);
          } catch (err) {
            reject(err);
          }
        });
        processNext();
      });
    },
  };
}
