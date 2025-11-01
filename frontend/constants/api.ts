import { getApiUrl } from "@/lib/api-config";

// Get API URL dynamically based on environment
export const API_URL = typeof window !== 'undefined'
  ? getApiUrl()
  : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api");

export const API_ENDPOINTS = {
  jobs: `${API_URL}/jobs`,
  models: `${API_URL}/models`,
  datasets: `${API_URL}/datasets`,
} as const;
