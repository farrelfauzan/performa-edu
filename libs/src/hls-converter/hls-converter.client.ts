import type {
  HlsConverterConfig,
  UploadUrlRequest,
  PresignedUploadResponse,
  ConvertRequest,
  ConversionStartResponse,
  ListJobsParams,
  JobListResponse,
  JobResponse,
  TaskStatusResponse,
  HealthResponse,
} from './hls-converter.types';

export class HlsConverterError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'HlsConverterError';
    this.status = status;
    this.detail = detail;
  }
}

export class HlsConverterClient {
  private readonly baseUrl: string;
  private readonly apiPrefix: string;
  private readonly timeout: number;
  private readonly headers: Record<string, string>;

  constructor(config: HlsConverterConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.apiPrefix = config.apiPrefix ?? '/api/v1';
    this.timeout = config.timeout ?? 30_000;
    this.headers = config.headers ?? {};
  }

  private url(path: string): string {
    return `${this.baseUrl}${this.apiPrefix}${path}`;
  }

  private async request<T>(
    method: string,
    url: string,
    body?: unknown
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const init: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...this.headers,
        },
        signal: controller.signal,
      };

      if (body !== undefined) {
        init.body = JSON.stringify(body);
      }

      const res = await fetch(url, init);

      if (!res.ok) {
        let detail: string;
        try {
          const err = (await res.json()) as { detail: string };
          detail = err.detail;
        } catch {
          detail = res.statusText;
        }
        throw new HlsConverterError(res.status, detail);
      }

      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  async getUploadUrl(
    params: UploadUrlRequest
  ): Promise<PresignedUploadResponse> {
    return this.request<PresignedUploadResponse>(
      'POST',
      this.url('/videos/upload-url'),
      params
    );
  }

  async getBulkUploadUrls(
    params: UploadUrlRequest[]
  ): Promise<PresignedUploadResponse[]> {
    return this.request<PresignedUploadResponse[]>(
      'POST',
      this.url('/videos/bulk-upload-urls'),
      { videos: params }
    );
  }

  async uploadFile(
    presigned: PresignedUploadResponse,
    file: Blob | Buffer
  ): Promise<void> {
    const form = new FormData();

    for (const [key, value] of Object.entries(presigned.fields)) {
      form.append(key, value);
    }
    form.append(
      'file',
      file instanceof Blob ? file : new Blob([file as BlobPart])
    );

    const res = await fetch(presigned.upload_url, {
      method: 'POST',
      body: form,
    });

    if (!res.ok) {
      throw new HlsConverterError(
        res.status,
        `S3 upload failed: ${res.statusText}`
      );
    }
  }

  async convert(params: ConvertRequest): Promise<ConversionStartResponse> {
    return this.request<ConversionStartResponse>(
      'POST',
      this.url('/videos/convert'),
      params
    );
  }

  async bulkConvert(
    requests: ConvertRequest[]
  ): Promise<ConversionStartResponse[]> {
    return this.request<ConversionStartResponse[]>(
      'POST',
      this.url('/videos/bulk-convert'),
      { videos: requests }
    );
  }

  async listJobs(params?: ListJobsParams): Promise<JobListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.page_size) query.set('page_size', String(params.page_size));
    if (params?.status) query.set('status', params.status);

    const qs = query.toString();
    return this.request<JobListResponse>(
      'GET',
      this.url(`/videos/jobs${qs ? `?${qs}` : ''}`)
    );
  }

  async getJob(jobId: string): Promise<JobResponse> {
    return this.request<JobResponse>(
      'GET',
      this.url(`/videos/jobs/${encodeURIComponent(jobId)}`)
    );
  }

  async getJobTaskStatus(jobId: string): Promise<TaskStatusResponse> {
    return this.request<TaskStatusResponse>(
      'GET',
      this.url(`/videos/jobs/${encodeURIComponent(jobId)}/status`)
    );
  }

  async waitForCompletion(
    jobId: string,
    intervalMs = 3000,
    maxAttempts = 200
  ): Promise<JobResponse> {
    for (let i = 0; i < maxAttempts; i++) {
      const job = await this.getJob(jobId);
      if (job.status === 'completed' || job.status === 'failed') {
        return job;
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new HlsConverterError(408, 'Timed out waiting for job completion');
  }

  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('GET', this.url('/health'));
  }
}
