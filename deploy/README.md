# Performa-Edu Deployment

This directory contains deployment configurations and scripts for deploying Performa-Edu to Google Cloud Platform.

## Directory Structure

```
deploy/
├── cloudrun/               # Cloud Run service YAML configurations
│   ├── api-gateway.yaml
│   ├── auth-service.yaml
│   ├── content-service.yaml
│   └── teacher-service.yaml
└── scripts/                # Deployment scripts
    ├── setup-gcp.sh        # Initial GCP infrastructure setup
    ├── deploy.sh           # Manual deployment script
    └── teardown-gcp.sh     # Cleanup script (DESTRUCTIVE)
```

## Prerequisites

1. **Google Cloud SDK**: Install [gcloud CLI](https://cloud.google.com/sdk/docs/install)
2. **Docker**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
3. **GCP Project**: Create a project in [Google Cloud Console](https://console.cloud.google.com)
4. **Billing**: Enable billing for your GCP project

## Quick Start

### 1. Initial Setup (One-time)

```bash
# Set your project ID
export GCP_PROJECT_ID=your-project-id
export GCP_REGION=asia-southeast1  # Optional, default is asia-southeast1

# Run the setup script
./deploy/scripts/setup-gcp.sh
```

This will create:
- Cloud SQL PostgreSQL instance
- Memorystore Redis instance  
- VPC Connector for private access
- Secret Manager secrets
- Service accounts with proper IAM permissions

### 2. Deploy Services

#### Option A: Using Cloud Build (CI/CD)

```bash
# Submit a build
gcloud builds submit --config=cloudbuild.yaml

# Or set up a trigger for automatic deployments
gcloud builds triggers create github \
  --repo-owner=YOUR_ORG \
  --repo-name=performa-edu \
  --branch-pattern='^main$' \
  --build-config=cloudbuild.yaml
```

#### Option B: Manual Deployment

```bash
export GCP_PROJECT_ID=your-project-id
./deploy/scripts/deploy.sh
```

### 3. Verify Deployment

```bash
# Get the API Gateway URL
API_URL=$(gcloud run services describe api-gateway --region=asia-southeast1 --format='value(status.url)')

# Test the health endpoint
curl $API_URL/api/health
```

## Environment Variables

Environment variables are managed via:
- **Secret Manager**: For sensitive data (DATABASE_URL, JWT_SECRET, etc.)
- **Cloud Run env vars**: For non-sensitive configuration

See `.env.production.example` for the full list of variables.

## Cost Estimation

| Resource | Monthly Cost (Estimated) |
|----------|-------------------------|
| Cloud Run (scale-to-zero) | $0 - $50+ |
| Cloud SQL (db-f1-micro) | ~$10 |
| Memorystore (1GB Basic) | ~$35 |
| VPC Connector | ~$7 |
| **Total (idle)** | ~$52/month |

*Costs vary based on usage. Cloud Run scales to zero when not in use.*

## Cleanup

To delete all resources:

```bash
export GCP_PROJECT_ID=your-project-id
./deploy/scripts/teardown-gcp.sh
```

⚠️ **WARNING**: This will permanently delete all data including the database!

## Troubleshooting

### View Logs

```bash
# API Gateway logs
gcloud run services logs read api-gateway --region=asia-southeast1 --limit=100

# Auth service logs
gcloud run services logs read auth-service --region=asia-southeast1 --limit=100
```

### Check Service Status

```bash
gcloud run services list --region=asia-southeast1
```

### Database Connection Issues

1. Verify the Cloud SQL instance is running
2. Check VPC Connector is properly configured
3. Verify service account has `roles/cloudsql.client` permission

### gRPC Connection Issues

1. Ensure `--use-http2` flag is set for gRPC services
2. Verify internal services have `--ingress=internal`
3. Check service-to-service authentication is configured
