/**
 * API Client Utility
 * Centralized API request handling with error management and retry logic
 */

import { API_URL } from "@/constants/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
  retry?: number;
  retryDelay?: number;
}

/**
 * Core fetch wrapper with error handling and retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { retry = 0, retryDelay = 1000, ...fetchOptions } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retry; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);

      // Return response even if not ok - let caller handle status
      return response;
    } catch (error) {
      lastError = error as Error;

      // If not the last attempt, wait before retrying
      if (attempt < retry) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw new ApiError(
    `Network request failed after ${retry + 1} attempts: ${lastError?.message}`,
    undefined,
    lastError
  );
}

/**
 * Generic API request function
 */
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Build URL with query parameters
  let url = `${API_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // Set default headers
  const headers = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  };

  const response = await fetchWithRetry(url, {
    ...fetchOptions,
    headers,
  });

  // Handle non-OK responses
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }

    throw new ApiError(
      errorData?.detail || errorData?.message || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      errorData
    );
  }

  // Parse JSON response
  try {
    return await response.json();
  } catch (error) {
    // If response is not JSON, return empty object
    return {} as T;
  }
}

/**
 * API client methods
 */
export const apiClient = {
  /**
   * GET request
   */
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),

  /**
   * POST request
   */
  post: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * PUT request
   */
  put: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * PATCH request
   */
  patch: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * DELETE request
   */
  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),

  /**
   * Download file (returns blob)
   */
  download: async (endpoint: string, filename: string, options?: RequestOptions) => {
    const url = `${API_URL}${endpoint}`;
    const response = await fetchWithRetry(url, options);

    if (!response.ok) {
      throw new ApiError(
        `Download failed: HTTP ${response.status}`,
        response.status
      );
    }

    const blob = await response.blob();

    // Create download link
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  },
};

/**
 * Specific API endpoint helpers
 */
export const api = {
  // Jobs
  jobs: {
    list: () => apiClient.get("/jobs"),
    get: (id: string) => apiClient.get(`/jobs/${id}/info`),
    create: (data: any) => apiClient.post("/jobs", data),
    delete: (id: string) => apiClient.delete(`/jobs/${id}`),
    pause: (id: string) => apiClient.post(`/jobs/${id}/pause`),
    resume: (id: string) => apiClient.post(`/jobs/${id}/resume`),
    stop: (id: string) => apiClient.post(`/jobs/${id}/stop`),
    metrics: (id: string) => apiClient.get(`/jobs/${id}/metrics`),
    logs: (id: string) => apiClient.get(`/jobs/${id}/logs`),
    checkpoints: (id: string) => apiClient.get(`/jobs/${id}/checkpoints`),
    downloadCheckpoint: (jobId: string, checkpointId: string, filename: string) =>
      apiClient.download(`/jobs/${jobId}/checkpoints/${checkpointId}/download`, filename),
  },

  // Datasets
  datasets: {
    list: () => apiClient.get("/datasets"),
    get: (id: string) => apiClient.get(`/datasets/${id}`),
    create: (data: any) => apiClient.post("/datasets", data),
    delete: (id: string) => apiClient.delete(`/datasets/${id}`),
  },

  // Hardware
  hardware: {
    stats: () => apiClient.get("/hardware/stats"),
    systemInfo: () => apiClient.get("/hardware/system-info"),
    cpu: () => apiClient.get("/hardware/cpu"),
    memory: () => apiClient.get("/hardware/memory"),
    gpu: () => apiClient.get("/hardware/gpu"),
    disk: () => apiClient.get("/hardware/disk"),
  },

  // Playground
  playground: {
    chat: (data: any) => apiClient.post("/playground/chat", data),
    models: () => apiClient.get("/playground/models"),
  },
};
