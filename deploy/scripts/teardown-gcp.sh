#!/bin/bash

# =============================================================================
# GCP Infrastructure Teardown Script for Performa-Edu
# =============================================================================
# WARNING: This script will DELETE all resources created by setup-gcp.sh
# Use with caution!
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
DB_INSTANCE_NAME="${DB_INSTANCE_NAME:-performa-edu-db}"
REDIS_INSTANCE_NAME="${REDIS_INSTANCE_NAME:-performa-edu-redis}"
VPC_CONNECTOR_NAME="${VPC_CONNECTOR_NAME:-serverless-connector}"

# Validate required variables
if [[ -z "$PROJECT_ID" ]]; then
    log_error "GCP_PROJECT_ID environment variable is required"
    echo "Usage: GCP_PROJECT_ID=your-project-id ./teardown-gcp.sh"
    exit 1
fi

echo ""
echo "=========================================="
echo "⚠️  Performa-Edu GCP Infrastructure Teardown"
echo "=========================================="
echo ""
echo -e "${RED}WARNING: This will DELETE the following resources:${NC}"
echo "  • Cloud Run services (api-gateway, auth-service, content-service, teacher-service)"
echo "  • Cloud SQL Instance: $DB_INSTANCE_NAME (INCLUDING ALL DATA)"
echo "  • Redis Instance: $REDIS_INSTANCE_NAME"
echo "  • VPC Connector: $VPC_CONNECTOR_NAME"
echo "  • Secrets in Secret Manager"
echo "  • Service Accounts"
echo ""
echo -e "${RED}THIS ACTION CANNOT BE UNDONE!${NC}"
echo ""

# Double confirmation
read -p "Are you ABSOLUTELY sure you want to delete all resources? Type 'DELETE' to confirm: " CONFIRM
if [[ "$CONFIRM" != "DELETE" ]]; then
    log_warning "Teardown cancelled"
    exit 0
fi

echo ""
read -p "Final confirmation - Delete all resources in project '$PROJECT_ID'? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_warning "Teardown cancelled"
    exit 0
fi

# Set the project
gcloud config set project "$PROJECT_ID"

# =============================================================================
# Delete Cloud Run Services
# =============================================================================
log_info "Deleting Cloud Run services..."

SERVICES=("api-gateway" "auth-service" "content-service" "teacher-service")
for SERVICE in "${SERVICES[@]}"; do
    if gcloud run services describe "$SERVICE" --region="$REGION" --project="$PROJECT_ID" &>/dev/null; then
        gcloud run services delete "$SERVICE" --region="$REGION" --project="$PROJECT_ID" --quiet
        log_success "Deleted Cloud Run service: $SERVICE"
    else
        log_warning "Cloud Run service '$SERVICE' not found"
    fi
done

# =============================================================================
# Delete Container Images
# =============================================================================
log_info "Deleting container images..."

for SERVICE in "${SERVICES[@]}"; do
    # List and delete all tags for the image
    if gcloud container images list-tags "gcr.io/$PROJECT_ID/$SERVICE" --format='get(digest)' 2>/dev/null | head -1 | grep -q .; then
        gcloud container images list-tags "gcr.io/$PROJECT_ID/$SERVICE" --format='get(digest)' | \
            xargs -I {} gcloud container images delete "gcr.io/$PROJECT_ID/$SERVICE@{}" --force-delete-tags --quiet 2>/dev/null || true
        log_success "Deleted container images for: $SERVICE"
    fi
done

# =============================================================================
# Delete Cloud SQL Instance
# =============================================================================
log_info "Deleting Cloud SQL instance..."

if gcloud sql instances describe "$DB_INSTANCE_NAME" --project="$PROJECT_ID" &>/dev/null; then
    # First, disable deletion protection
    gcloud sql instances patch "$DB_INSTANCE_NAME" --no-deletion-protection --project="$PROJECT_ID" --quiet 2>/dev/null || true
    
    gcloud sql instances delete "$DB_INSTANCE_NAME" --project="$PROJECT_ID" --quiet
    log_success "Deleted Cloud SQL instance: $DB_INSTANCE_NAME"
else
    log_warning "Cloud SQL instance '$DB_INSTANCE_NAME' not found"
fi

# =============================================================================
# Delete Redis Instance
# =============================================================================
log_info "Deleting Redis instance..."

if gcloud redis instances describe "$REDIS_INSTANCE_NAME" --region="$REGION" --project="$PROJECT_ID" &>/dev/null; then
    gcloud redis instances delete "$REDIS_INSTANCE_NAME" --region="$REGION" --project="$PROJECT_ID" --quiet
    log_success "Deleted Redis instance: $REDIS_INSTANCE_NAME"
else
    log_warning "Redis instance '$REDIS_INSTANCE_NAME' not found"
fi

# =============================================================================
# Delete VPC Connector
# =============================================================================
log_info "Deleting VPC Connector..."

if gcloud compute networks vpc-access connectors describe "$VPC_CONNECTOR_NAME" --region="$REGION" --project="$PROJECT_ID" &>/dev/null; then
    gcloud compute networks vpc-access connectors delete "$VPC_CONNECTOR_NAME" --region="$REGION" --project="$PROJECT_ID" --quiet
    log_success "Deleted VPC Connector: $VPC_CONNECTOR_NAME"
else
    log_warning "VPC Connector '$VPC_CONNECTOR_NAME' not found"
fi

# =============================================================================
# Delete Secrets
# =============================================================================
log_info "Deleting secrets..."

SECRETS=("database-url" "jwt-secret" "jwt-refresh-secret" "redis-url")
for SECRET in "${SECRETS[@]}"; do
    if gcloud secrets describe "$SECRET" --project="$PROJECT_ID" &>/dev/null; then
        gcloud secrets delete "$SECRET" --project="$PROJECT_ID" --quiet
        log_success "Deleted secret: $SECRET"
    else
        log_warning "Secret '$SECRET' not found"
    fi
done

# =============================================================================
# Delete Service Accounts
# =============================================================================
log_info "Deleting service accounts..."

SERVICE_ACCOUNTS=("api-gateway-sa" "auth-service-sa" "content-service-sa" "teacher-service-sa")
for SA in "${SERVICE_ACCOUNTS[@]}"; do
    SA_EMAIL="${SA}@${PROJECT_ID}.iam.gserviceaccount.com"
    if gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" &>/dev/null; then
        gcloud iam service-accounts delete "$SA_EMAIL" --project="$PROJECT_ID" --quiet
        log_success "Deleted service account: $SA"
    else
        log_warning "Service account '$SA' not found"
    fi
done

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "=========================================="
echo "✅ Teardown Complete"
echo "=========================================="
echo ""
echo "All Performa-Edu resources have been deleted from project: $PROJECT_ID"
echo ""
log_warning "Note: Some resources may take a few minutes to fully delete."
log_warning "Billing may continue briefly for resources being deleted."
echo ""
