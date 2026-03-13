export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ── Request types ──

export interface UploadUrlRequest {
  filename: string;
  content_type: string;
}

export interface ConvertRequest {
  s3_key: string;
  original_filename: string;
  callback_url?: string;
}

export interface ListJobsParams {
  page?: number;
  page_size?: number;
  status?: JobStatus;
}

// ── Response types ──

export interface PresignedUploadResponse {
  upload_url: string;
  fields: Record<string, string>;
  s3_key: string;
  expires_in: number;
}

export interface ConversionStartResponse {
  job_id: string;
  task_id: string;
  status: string;
  message: string;
}

export interface JobResponse {
  job_id: string;
  status: JobStatus;
  original_filename: string;
  source_s3_key: string;
  output_s3_prefix: string | null;
  master_playlist_url: string | null;
  error_message: string | null;
  created_at: string | null;
  completed_at: string | null;
}

export interface JobListResponse {
  jobs: JobResponse[];
  total: number;
  page: number;
  page_size: number;
}

export interface TaskStatusResponse {
  task_id: string;
  status: string;
  progress: number | null;
  result: Record<string, unknown> | null;
}

export interface HealthResponse {
  status: string;
}

// ── Webhook payload (received at your callback_url) ──

export interface WebhookPayload {
  job_id: string;
  status: 'completed' | 'failed';
  master_playlist_url: string | null;
  error_message: string | null;
}

// ── SDK config ──

export interface HlsConverterConfig {
  baseUrl: string;
  apiPrefix?: string;
  timeout?: number;
  headers?: Record<string, string>;
}
