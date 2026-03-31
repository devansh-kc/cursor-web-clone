// Wraps fetch() with automatic timeout cancellation
export async function apiFetcher({
  url,
  options = {},
  timeout = 1000,
  abortSignal,
}: {
  url: string;
  options?: RequestInit;
  timeout: number;
  abortSignal?: AbortController;
}) {
  // Auto-abort if server doesn't respond in time
  const timeoutId = setTimeout(() => abortSignal?.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: abortSignal?.signal, // Pass the signal to fetch
    });
    // Request was successful, clear the timeout
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    // Clear the timeout in case of an error before the timeout occurs
    clearTimeout(timeoutId);
    // Handle the specific timeout error
    throw error;
  }
}
