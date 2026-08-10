/**
 * Utility to retry lazy-loaded component imports if they fail
 * This helps with transient network errors during dynamic imports
 */

const RETRY_DELAY = 500; // Reduced to 500ms for faster retries
const MAX_RETRIES = 2; // Reduced to 2 retries for faster failure detection

export function lazyRetry<T>(
  componentImport: () => Promise<T>,
  componentName: string,
  retryCount = 0
): Promise<T> {
  return new Promise((resolve, reject) => {
    componentImport()
      .then(resolve)
      .catch((error) => {
        // If we've exceeded max retries, show error
        if (retryCount >= MAX_RETRIES) {
          console.error(`Failed to load ${componentName} after ${MAX_RETRIES} retries:`, error);
          reject(error);
          return;
        }

        // Log retry attempt (only in development)
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Failed to load ${componentName}, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
        }

        // Retry after delay
        setTimeout(() => {
          lazyRetry(componentImport, componentName, retryCount + 1)
            .then(resolve)
            .catch(reject);
        }, RETRY_DELAY);
      });
  });
}