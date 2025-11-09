import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Custom fetch with retry logic for network errors
const customFetch = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second
  const timeout = 30000; // 30 seconds

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Merge abort signals if one already exists
      let signal = controller.signal;
      if (options?.signal) {
        const mergedController = new AbortController();
        options.signal.addEventListener('abort', () => mergedController.abort());
        controller.signal.addEventListener('abort', () => mergedController.abort());
        signal = mergedController.signal;
      }

      const response = await fetch(url, {
        ...options,
        signal,
      });
      
      // Clear timeout on success
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      // If successful or non-network error, return immediately
      if (response.ok || response.status < 500) {
        return response;
      }
      
      // For server errors, retry
      if (attempt < maxRetries - 1) {
        console.warn(`[Supabase] Request failed with status ${response.status}, retrying... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }
      
      return response;
    } catch (error: any) {
      // Clear timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      // Handle timeout errors
      if (error?.name === 'AbortError') {
        console.warn(`[Supabase] Request timeout after ${timeout}ms`);
      }
      
      // Handle network errors (connection reset, failed to fetch, etc.)
      const isNetworkError = 
        error?.name === 'TypeError' ||
        error?.name === 'AbortError' ||
        error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('ERR_CONNECTION_RESET') ||
        error?.message?.includes('ERR_CONNECTION_CLOSED') ||
        error?.message?.includes('network') ||
        error?.code === 'ECONNRESET' ||
        error?.code === 'ETIMEDOUT';

      if (isNetworkError && attempt < maxRetries - 1) {
        console.warn(`[Supabase] Network error occurred, retrying... (attempt ${attempt + 1}/${maxRetries}):`, error.message || error);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }
      
      // If it's the last attempt or not a network error, throw
      throw error;
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw new Error('Failed to fetch after all retries');
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // Enable to detect password reset tokens in URL
  },
  global: {
    fetch: customFetch,
    headers: {
      'x-client-info': 'permit-hub@1.0.0',
    },
  },
});
