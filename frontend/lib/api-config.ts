/**
 * Get the API URL based on the environment
 * In production (packaged app), uses port 8001
 * In development, uses port 8000
 */
export function getApiUrl(): string {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  }

  // Check if the current page is being served from localhost:3002 (production app)
  const isProductionApp = window.location.port === '3002';

  if (isProductionApp) {
    return 'http://localhost:8001/api';
  }

  // Development mode
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
}
