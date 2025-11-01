// Fine-tuning Job Types
export type JobStatus = "running" | "completed" | "failed" | "pending" | "paused" | "stopped";

export interface FineTuningJob {
  id: string;
  name: string;
  model: string;
  dataset: string;
  status: JobStatus;
  progress: number;
  createdAt: string;
  duration: string;
}

// Model Types
export interface Model {
  id: string;
  name: string;
  author: string;
  downloads: number;
  likes: number;
  tags: string[];
  pipeline_tag?: string;
  last_modified?: string;
  description?: string;
  size_gb?: number;
}

export interface DownloadedModel {
  model_id: string;
  local_path: string;
  size_mb: number;
}

export type DownloadStatusType = "idle" | "downloading" | "completed" | "failed";

export interface DownloadStatus {
  [key: string]: {
    status: DownloadStatusType;
    progress: number;
    error?: string;
  };
}

// Playground Types
export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ModelConfig {
  temperature: number;
  max_tokens: number;
  top_p: number;
}

// Training Metrics Types
export interface LossDataPoint {
  step: number;
  epoch: number;
  loss: number;
}
