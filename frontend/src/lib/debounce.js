/**
 * Creates a debounced version of a function that delays execution
 * and cancels previous pending calls.
 * @param {Function} fn - The function to debounce
 * @param {number} delayMs - Delay in milliseconds
 * @returns {Function} Debounced function with cancel method
 */
export function debounce(fn, delayMs = 300) {
  let timeoutId = null;
  let lastArgs = null;

  const debounced = (...args) => {
    lastArgs = args;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...lastArgs);
      timeoutId = null;
      lastArgs = null;
    }, delayMs);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastArgs = null;
    }
  };

  return debounced;
}

/**
 * Creates a debounced async function that returns a promise.
 * Cancels previous pending requests when a new one is triggered.
 * @param {Function} asyncFn - Async function to debounce
 * @param {number} delayMs - Delay in milliseconds
 * @returns {Function} Debounced async function with cancel method
 */
export function debounceAsync(asyncFn, delayMs = 300) {
  let timeoutId = null;
  let lastArgs = null;
  let lastPromise = null;

  const debounced = async (...args) => {
    lastArgs = args;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await asyncFn(...lastArgs);
          lastPromise = Promise.resolve(result);
          resolve(result);
        } catch (error) {
          lastPromise = Promise.reject(error);
          reject(error);
        } finally {
          timeoutId = null;
          lastArgs = null;
        }
      }, delayMs);
    });
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastArgs = null;
    }
  };

  return debounced;
}
