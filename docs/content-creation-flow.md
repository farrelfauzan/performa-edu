# Content Creation Flow — Two-Phase Upload

## Overview

Content creation uses a **two-phase upload** pattern to handle video files efficiently without hitting gRPC message size limits. The client sends metadata first, receives presigned S3 URLs, uploads directly to S3, then triggers backend conversion.

In addition to section videos, content supports:

- **Thumbnail** (image) — uploaded directly via presigned URL, stored as `Content.thumbnailUrl`
- **Preview Video** — uploaded via presigned URL, then converted to HLS like section videos. On conversion completion, `Content.previewUrl` is set to the HLS playlist URL.

---

## Architecture

```
Phase 1: Create Content + Get Upload URLs
──────────────────────────────────────────
Client
  │  POST /api/v1/contents/with-sections
  │  (title, body, year, categoryId, sections, thumbnail?, previewVideo?)
  ▼
API Gateway ──gRPC──► Content Service
  │                      │
  │                      ├─ BEGIN TRANSACTION
  │                      │   ├─ Create Content record (status: DRAFT)
  │                      │   ├─ Create ContentSection records
  │                      │   ├─ Create ContentMedia records for section videos (PENDING)
  │                      │   ├─ Create ContentMedia for thumbnail (IMAGE, no section)
  │                      │   └─ Create ContentMedia for preview video (VIDEO, no section)
  │                      │
  │                      ├─ Get presigned S3 upload URLs per section video
  │                      ├─ Get presigned S3 upload URL for thumbnail → store S3 key as Content.thumbnailUrl
  │                      ├─ Get presigned S3 upload URL for preview video
  │                      └─ Store S3 keys on ContentMedia records
  │
  ◄── Returns: content + sections + uploadUrls[] + thumbnailUploadUrl? + previewUploadUrl?
       (each URL has: mediaId, uploadUrl, fields, s3Key, expiresIn)


Phase 2: Direct Upload to S3
─────────────────────────────
Client
  │  For each uploadUrl (section videos + thumbnail + preview):
  │  POST {uploadUrl} with multipart form (fields + file)
  ▼
S3 / MinIO ── file stored


Phase 3: Trigger Conversion
────────────────────────────
Client
  │  POST /api/v1/contents/:id/convert
  │  (optional: callbackUrl)
  ▼
API Gateway ──gRPC──► Content Service
  │                      │
  │                      ├─ Find all PENDING video ContentMedia for content
  │                      ├─ For each: start HLS conversion job
  │                      └─ Update status to PROCESSING
  │
  ◄── Returns: jobs[] (mediaId, jobId)


Phase 4: Webhook Callback
──────────────────────────
HLS Converter
  │  POST /api/v1/contents/webhooks/conversion
  │  { job_id, status, master_playlist_url, error_message }
  ▼
API Gateway ──gRPC──► Content Service
                         │
                         ├─ Look up ContentMedia by S3 key from job
                         ├─ On "completed":
                         │   ├─ Set hlsUrl, status=COMPLETED, processedAt
                         │   └─ If preview video (VIDEO, no section): update Content.previewUrl
                         └─ On "failed": set status=FAILED
```

---

## API Endpoints

### `POST /api/v1/contents/with-sections` (Auth required)

Create content with sections and video slots. Returns presigned upload URLs.

**Request Body:**

```json
{
  "title": "Course Title",
  "categoryId": "clxxx...",
  "year": 2026,
  "body": "Course description...",
  "status": 0,
  "sections": [
    {
      "title": "Getting Started",
      "description": "Introduction section",
      "sortOrder": 0,
      "videos": [
        {
          "title": "Welcome Video",
          "sortOrder": 0,
          "fileName": "welcome.mp4",
          "mimeType": "video/mp4",
          "fileSize": 104857600
        }
      ]
    }
  ],
  "thumbnail": {
    "fileName": "thumbnail.jpg",
    "mimeType": "image/jpeg",
    "fileSize": 512000
  },
  "previewVideo": {
    "fileName": "preview.mp4",
    "mimeType": "video/mp4",
    "fileSize": 20971520
  }
}
```

**Response:**

```json
{
  "data": {
    "content": { "id": "clxxx...", "title": "Course Title", ... },
    "sections": [ { "id": "clxxx...", "title": "Getting Started", "medias": [...] } ],
    "uploadUrls": [
      {
        "mediaId": "clxxx...",
        "uploadUrl": "https://s3.../bucket",
        "fields": { "key": "...", "policy": "...", ... },
        "s3Key": "uploads/abc123.mp4",
        "expiresIn": 3600
      }
    ],
    "thumbnailUploadUrl": {
      "mediaId": "clxxx...",
      "uploadUrl": "https://s3.../bucket",
      "fields": { "key": "...", "policy": "...", ... },
      "s3Key": "uploads/thumbnail-abc.jpg",
      "expiresIn": 3600
    },
    "previewUploadUrl": {
      "mediaId": "clxxx...",
      "uploadUrl": "https://s3.../bucket",
      "fields": { "key": "...", "policy": "...", ... },
      "s3Key": "uploads/preview-abc.mp4",
      "expiresIn": 3600
    }
  }
}
```

### `POST /api/v1/contents/:id/convert` (Auth required)

Trigger HLS conversion for all pending videos.

**Request Body (optional):**

```json
{
  "callbackUrl": "https://your-api.com/api/v1/contents/webhooks/conversion"
}
```

### `POST /api/v1/contents/webhooks/conversion` (Public)

Webhook endpoint for HLS converter callbacks.

**Request Body (from HLS converter):**

```json
{
  "job_id": "job_abc123",
  "status": "completed",
  "master_playlist_url": "https://s3.../output/master.m3u8",
  "error_message": null
}
```

---

## Error Handling

- **Partial failure:** Content and sections are always persisted. Each video has independent `processingStatus` (PENDING → PROCESSING → COMPLETED/FAILED). Failed videos can be retried without recreating the content.
- **Upload timeout:** Presigned URLs have an expiration (returned in `expiresIn`). Client must upload before expiry.
- **Conversion failure:** Individual videos marked as FAILED. Content stays in DRAFT until all videos are COMPLETED.
- **Thumbnail:** Image only — no conversion needed. S3 key stored as `Content.thumbnailUrl` at creation time.
- **Preview video:** Goes through the same HLS pipeline as section videos. On completion, `Content.previewUrl` is updated via the webhook callback.

---

## Files Modified

| File                                                                    | Purpose                                                                                       |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `proto/content-service.proto`                                           | Added RPCs: `CreateContentWithSections`, `StartContentConversion`, `HandleConversionWebhook`  |
| `types/proto/content-service.ts`                                        | Auto-generated from proto                                                                     |
| `apps/content-service/src/app/repositories/content.repository.ts`       | `createContentWithSections()`, `startContentConversion()`                                     |
| `apps/content-service/src/app/repositories/content-media.repository.ts` | `startConversion()`, upload URL + webhook handler methods                                     |
| `apps/content-service/src/app/content.service.ts`                       | Wired new methods                                                                             |
| `apps/content-service/src/app/content.controller.ts`                    | gRPC handlers for new RPCs                                                                    |
| `apps/content-service/src/app/content.module.ts`                        | Registered `ContentMediaRepository`                                                           |
| `apps/api-gateway/src/app/content/content.controller.ts`                | HTTP endpoints: `POST /with-sections`, `POST /:id/convert`, `POST /webhooks/conversion`       |
| `libs/src/prisma/schema.prisma`                                         | Added `thumbnailUrl`, `previewUrl` to Content model                                           |
| `libs/src/zod-dtos/content-dtos/`                                       | Zod DTOs: `CreateContentWithSectionsDto`, `StartContentConversionDto`, `ConversionWebhookDto` |
