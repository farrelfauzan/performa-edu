#!/bin/bash

# =============================================================================
# Manual Deployment Script for Performa-Edu
# =============================================================================
# This script builds and deploys all services to Google Cloud Run.
# Use this for manual deployments instead of Cloud Build.
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-}"
REGION="${GCP_REGION:-asia-southeast1}"
TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD 2>/dev/null || echo 'latest')}"
VPC_CONNECTOR="${VPC_CONNECTOR:-serverless-connector}"
SQL_INSTANCE="${SQL_INSTANCE:-${PROJECT_ID}:${REGION}:performa-edu-db}"

# Validate required variables
if [[ -z "$PROJECT_ID" ]]; then
    log_error "GCP_PROJECT_ID environment variable is required"
    echo "Usage: GCP_PROJECT_ID=your-project-id ./deploy.sh"
    exit 1
fi

echo ""
echo "=========================================="
echo "🚀 Deploying Performa-Edu to Cloud Run"
echo "=========================================="
echo ""
echo "Configuration:"
echo "  Project ID:     $PROJECT_ID"
echo "  Region:         $REGION"
echo "  Image Tag:      $TAG"
echo "  VPC Connector:  $VPC_CONNECTOR"
echo "  SQL Instance:   $SQL_INSTANCE"
echo ""

# Confirm before proceeding
read -p "Do you want to proceed with deployment? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_warning "Deployment cancelled"
    exit 0
fi

# Authenticate Docker with GCR
log_info "Configuring Docker authentication..."
gcloud auth configure-docker gcr.io --quiet

# =============================================================================
# Build Images
# =============================================================================
log_info "Building Docker images..."

# Build all images in parallel
log_info "Building api-gateway..."
docker build \
    -t "gcr.io/$PROJECT_ID/api-gateway:$TAG" \
    -t "gcr.io/$PROJECT_ID/api-gateway:latest" \
    -f apps/api-gateway/Dockerfile \
    --target production \
    . &
PID_API=$!

log_info "Building auth-service..."
docker build \
    -t "gcr.io/$PROJECT_ID/auth-service:$TAG" \
    -t "gcr.io/$PROJECT_ID/auth-service:latest" \
    -f apps/auth-service/Dockerfile \
    --target production \
    . &
PID_AUTH=$!

log_info "Building content-service..."
docker build \
    -t "gcr.io/$PROJECT_ID/content-service:$TAG" \
    -t "gcr.io/$PROJECT_ID/content-service:latest" \
    -f apps/content-service/Dockerfile \
    --target production \
    . &
PID_CONTENT=$!

log_info "Building customer-service..."
docker build \
    -t "gcr.io/$PROJECT_ID/customer-service:$TAG" \
    -t "gcr.io/$PROJECT_ID/customer-service:latest" \
    -f apps/customer-service/Dockerfile \
    --target production \
    . &
PID_CUSTOMER=$!

# Wait for all builds to complete
wait $PID_API $PID_AUTH $PID_CONTENT $PID_CUSTOMER
log_success "All images built successfully"

# =============================================================================
# Push Images
# =============================================================================
log_info "Pushing images to Container Registry..."

docker push "gcr.io/$PROJECT_ID/api-gateway:$TAG" &
docker push "gcr.io/$PROJECT_ID/api-gateway:latest" &
docker push "gcr.io/$PROJECT_ID/auth-service:$TAG" &
docker push "gcr.io/$PROJECT_ID/auth-service:latest" &
docker push "gcr.io/$PROJECT_ID/content-service:$TAG" &
docker push "gcr.io/$PROJECT_ID/content-service:latest" &
docker push "gcr.io/$PROJECT_ID/customer-service:$TAG" &
docker push "gcr.io/$PROJECT_ID/customer-service:latest" &

wait
log_success "All images pushed successfully"

# =============================================================================
# Deploy Internal gRPC Services
# =============================================================================
log_info "Deploying internal gRPC services..."

# Deploy Auth Service
log_info "Deploying auth-service..."
gcloud run deploy auth-service \
    --image="gcr.io/$PROJECT_ID/auth-service:$TAG" \
    --region="$REGION" \
    --platform=managed \
    --no-allow-unauthenticated \
    --ingress=internal \
    --use-http2 \
    --port=5001 \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=5 \
    --set-env-vars="NODE_ENV=production,AUTH_SERVICE_GRPC_HOST=0.0.0.0,AUTH_SERVICE_GRPC_PORT=5001" \
    --set-secrets="DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest,JWT_REFRESH_SECRET=jwt-refresh-secret:latest,REDIS_URL=redis-url:latest" \
    --vpc-connector="$VPC_CONNECTOR" \
    --set-cloudsql-instances="$SQL_INSTANCE" \
    --service-account="auth-service-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --project="$PROJECT_ID" \
    --quiet

# Deploy Content Service
log_info "Deploying content-service..."
gcloud run deploy content-service \
    --image="gcr.io/$PROJECT_ID/content-service:$TAG" \
    --region="$REGION" \
    --platform=managed \
    --no-allow-unauthenticated \
    --ingress=internal \
    --use-http2 \
    --port=5002 \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=5 \
    --set-env-vars="NODE_ENV=production,CONTENT_SERVICE_GRPC_HOST=0.0.0.0,CONTENT_SERVICE_GRPC_PORT=5002" \
    --set-secrets="DATABASE_URL=database-url:latest,REDIS_URL=redis-url:latest" \
    --vpc-connector="$VPC_CONNECTOR" \
    --set-cloudsql-instances="$SQL_INSTANCE" \
    --service-account="content-service-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --project="$PROJECT_ID" \
    --quiet

# Deploy Customer Service
log_info "Deploying customer-service..."
gcloud run deploy customer-service \
    --image="gcr.io/$PROJECT_ID/customer-service:$TAG" \
    --region="$REGION" \
    --platform=managed \
    --no-allow-unauthenticated \
    --ingress=internal \
    --use-http2 \
    --port=5003 \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=5 \
    --set-env-vars="NODE_ENV=production,CUSTOMER_SERVICE_GRPC_HOST=0.0.0.0,CUSTOMER_SERVICE_GRPC_PORT=5003" \
    --set-secrets="DATABASE_URL=database-url:latest,REDIS_URL=redis-url:latest" \
    --vpc-connector="$VPC_CONNECTOR" \
    --set-cloudsql-instances="$SQL_INSTANCE" \
    --service-account="customer-service-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --project="$PROJECT_ID" \
    --quiet

log_success "Internal gRPC services deployed"

# =============================================================================
# Get Service URLs
# =============================================================================
log_info "Getting service URLs..."

AUTH_URL=$(gcloud run services describe auth-service --region="$REGION" --project="$PROJECT_ID" --format='value(status.url)')
CONTENT_URL=$(gcloud run services describe content-service --region="$REGION" --project="$PROJECT_ID" --format='value(status.url)')
CUSTOMER_URL=$(gcloud run services describe customer-service --region="$REGION" --project="$PROJECT_ID" --format='value(status.url)')

# Extract hostnames (remove https://)
AUTH_HOST="${AUTH_URL#https://}"
CONTENT_HOST="${CONTENT_URL#https://}"
CUSTOMER_HOST="${CUSTOMER_URL#https://}"

log_info "Auth Service:     $AUTH_URL"
log_info "Content Service:  $CONTENT_URL"
log_info "Customer Service: $CUSTOMER_URL"

# =============================================================================
# Deploy API Gateway
# =============================================================================
log_info "Deploying api-gateway..."

gcloud run deploy api-gateway \
    --image="gcr.io/$PROJECT_ID/api-gateway:$TAG" \
    --region="$REGION" \
    --platform=managed \
    --allow-unauthenticated \
    --port=3000 \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=10 \
    --set-env-vars="NODE_ENV=production,PORT=3000,AUTH_SERVICE_GRPC_HOST=${AUTH_HOST},AUTH_SERVICE_GRPC_PORT=443,CONTENT_SERVICE_GRPC_HOST=${CONTENT_HOST},CONTENT_SERVICE_GRPC_PORT=443,CUSTOMER_SERVICE_GRPC_HOST=${CUSTOMER_HOST},CUSTOMER_SERVICE_GRPC_PORT=443" \
    --set-secrets="DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest,REDIS_URL=redis-url:latest" \
    --vpc-connector="$VPC_CONNECTOR" \
    --set-cloudsql-instances="$SQL_INSTANCE" \
    --service-account="api-gateway-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --project="$PROJECT_ID" \
    --quiet

API_URL=$(gcloud run services describe api-gateway --region="$REGION" --project="$PROJECT_ID" --format='value(status.url)')

log_success "API Gateway deployed"

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "🌐 Public Endpoints:"
echo "   API Gateway: $API_URL"
echo ""
echo "🔧 Internal Services (gRPC):"
echo "   Auth Service:     $AUTH_URL"
echo "   Content Service:  $CONTENT_URL"
echo "   Customer Service: $CUSTOMER_URL"
echo ""
echo "📝 Test the API:"
echo "   curl $API_URL/api/health"
echo ""
echo "📊 View logs:"
echo "   gcloud run services logs read api-gateway --region=$REGION --limit=50"
echo ""
