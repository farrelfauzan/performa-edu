#!/bin/bash

# =============================================================================
# GCP Infrastructure Setup Script for Performa-Edu
# =============================================================================
# This script sets up all necessary GCP infrastructure including:
# - Cloud SQL PostgreSQL instance
# - Memorystore Redis instance
# - VPC Connector for serverless access
# - Secret Manager secrets
# - Service accounts with proper IAM permissions
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

# Configuration - Override these with environment variables
PROJECT_ID="${GCP_PROJECT_ID:-}"
REGION="${GCP_REGION:-asia-southeast1}"
DB_INSTANCE_NAME="${DB_INSTANCE_NAME:-performa-edu-db}"
DB_NAME="${DB_NAME:-performa_edu_db}"
DB_USER="${DB_USER:-performa_user}"
REDIS_INSTANCE_NAME="${REDIS_INSTANCE_NAME:-performa-edu-redis}"
VPC_CONNECTOR_NAME="${VPC_CONNECTOR_NAME:-serverless-connector}"

# Validate required variables
if [[ -z "$PROJECT_ID" ]]; then
    log_error "GCP_PROJECT_ID environment variable is required"
    echo "Usage: GCP_PROJECT_ID=your-project-id ./setup-gcp.sh"
    exit 1
fi

echo ""
echo "=========================================="
echo "🚀 Performa-Edu GCP Infrastructure Setup"
echo "=========================================="
echo ""
echo "Configuration:"
echo "  Project ID:     $PROJECT_ID"
echo "  Region:         $REGION"
echo "  DB Instance:    $DB_INSTANCE_NAME"
echo "  DB Name:        $DB_NAME"
echo "  Redis Instance: $REDIS_INSTANCE_NAME"
echo "  VPC Connector:  $VPC_CONNECTOR_NAME"
echo ""

# Confirm before proceeding
read -p "Do you want to proceed with this configuration? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_warning "Setup cancelled"
    exit 0
fi

# Set the project
log_info "Setting active project to $PROJECT_ID..."
gcloud config set project "$PROJECT_ID"

# =============================================================================
# Enable Required APIs
# =============================================================================
log_info "Enabling required GCP APIs..."
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    sqladmin.googleapis.com \
    redis.googleapis.com \
    secretmanager.googleapis.com \
    vpcaccess.googleapis.com \
    compute.googleapis.com \
    containerregistry.googleapis.com \
    --project="$PROJECT_ID"
log_success "APIs enabled"

# =============================================================================
# Create VPC Connector
# =============================================================================
log_info "Creating VPC Connector for serverless access..."
if gcloud compute networks vpc-access connectors describe "$VPC_CONNECTOR_NAME" --region="$REGION" --project="$PROJECT_ID" &>/dev/null; then
    log_warning "VPC Connector '$VPC_CONNECTOR_NAME' already exists"
else
    gcloud compute networks vpc-access connectors create "$VPC_CONNECTOR_NAME" \
        --region="$REGION" \
        --range=10.8.0.0/28 \
        --min-instances=2 \
        --max-instances=10 \
        --project="$PROJECT_ID"
    log_success "VPC Connector created"
fi

# =============================================================================
# Create Cloud SQL PostgreSQL Instance
# =============================================================================
log_info "Creating Cloud SQL PostgreSQL instance..."
if gcloud sql instances describe "$DB_INSTANCE_NAME" --project="$PROJECT_ID" &>/dev/null; then
    log_warning "Cloud SQL instance '$DB_INSTANCE_NAME' already exists"
else
    gcloud sql instances create "$DB_INSTANCE_NAME" \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region="$REGION" \
        --storage-size=10GB \
        --storage-auto-increase \
        --backup-start-time=03:00 \
        --availability-type=zonal \
        --maintenance-window-day=SUN \
        --maintenance-window-hour=03 \
        --deletion-protection \
        --project="$PROJECT_ID"
    log_success "Cloud SQL instance created"
fi

# Get SQL connection name
SQL_CONNECTION_NAME=$(gcloud sql instances describe "$DB_INSTANCE_NAME" --project="$PROJECT_ID" --format='value(connectionName)')
log_info "SQL Connection Name: $SQL_CONNECTION_NAME"

# Create database
log_info "Creating database '$DB_NAME'..."
if gcloud sql databases describe "$DB_NAME" --instance="$DB_INSTANCE_NAME" --project="$PROJECT_ID" &>/dev/null; then
    log_warning "Database '$DB_NAME' already exists"
else
    gcloud sql databases create "$DB_NAME" \
        --instance="$DB_INSTANCE_NAME" \
        --project="$PROJECT_ID"
    log_success "Database created"
fi

# Create database user
log_info "Creating database user '$DB_USER'..."
DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=')
if gcloud sql users describe "$DB_USER" --instance="$DB_INSTANCE_NAME" --project="$PROJECT_ID" &>/dev/null; then
    log_warning "Database user '$DB_USER' already exists - updating password"
    gcloud sql users set-password "$DB_USER" \
        --instance="$DB_INSTANCE_NAME" \
        --password="$DB_PASSWORD" \
        --project="$PROJECT_ID"
else
    gcloud sql users create "$DB_USER" \
        --instance="$DB_INSTANCE_NAME" \
        --password="$DB_PASSWORD" \
        --project="$PROJECT_ID"
fi
log_success "Database user configured"

# =============================================================================
# Create Memorystore Redis Instance
# =============================================================================
log_info "Creating Memorystore Redis instance..."
if gcloud redis instances describe "$REDIS_INSTANCE_NAME" --region="$REGION" --project="$PROJECT_ID" &>/dev/null; then
    log_warning "Redis instance '$REDIS_INSTANCE_NAME' already exists"
else
    gcloud redis instances create "$REDIS_INSTANCE_NAME" \
        --size=1 \
        --region="$REGION" \
        --tier=basic \
        --redis-version=redis_7_0 \
        --project="$PROJECT_ID"
    log_success "Redis instance created"
fi

# Get Redis IP
REDIS_IP=$(gcloud redis instances describe "$REDIS_INSTANCE_NAME" --region="$REGION" --project="$PROJECT_ID" --format='value(host)')
REDIS_PORT=$(gcloud redis instances describe "$REDIS_INSTANCE_NAME" --region="$REGION" --project="$PROJECT_ID" --format='value(port)')
log_info "Redis IP: $REDIS_IP:$REDIS_PORT"

# =============================================================================
# Create Secrets in Secret Manager
# =============================================================================
log_info "Creating secrets in Secret Manager..."

# Database URL for Cloud SQL (using Unix socket)
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?host=/cloudsql/${SQL_CONNECTION_NAME}"

create_or_update_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if gcloud secrets describe "$secret_name" --project="$PROJECT_ID" &>/dev/null; then
        echo -n "$secret_value" | gcloud secrets versions add "$secret_name" --data-file=- --project="$PROJECT_ID"
        log_info "Updated secret: $secret_name"
    else
        echo -n "$secret_value" | gcloud secrets create "$secret_name" --data-file=- --replication-policy=automatic --project="$PROJECT_ID"
        log_success "Created secret: $secret_name"
    fi
}

create_or_update_secret "database-url" "$DATABASE_URL"
create_or_update_secret "jwt-secret" "$(openssl rand -base64 32)"
create_or_update_secret "jwt-refresh-secret" "$(openssl rand -base64 32)"
create_or_update_secret "redis-url" "redis://${REDIS_IP}:${REDIS_PORT}"

log_success "Secrets configured"

# =============================================================================
# Create Service Accounts
# =============================================================================
log_info "Creating service accounts..."

SERVICE_ACCOUNTS=("api-gateway-sa" "auth-service-sa" "content-service-sa" "customer-service-sa")

for SA in "${SERVICE_ACCOUNTS[@]}"; do
    if gcloud iam service-accounts describe "${SA}@${PROJECT_ID}.iam.gserviceaccount.com" --project="$PROJECT_ID" &>/dev/null; then
        log_warning "Service account '$SA' already exists"
    else
        gcloud iam service-accounts create "$SA" \
            --display-name="$SA" \
            --project="$PROJECT_ID"
        log_success "Created service account: $SA"
    fi
done

# =============================================================================
# Grant IAM Permissions
# =============================================================================
log_info "Granting IAM permissions..."

for SA in "${SERVICE_ACCOUNTS[@]}"; do
    SA_EMAIL="${SA}@${PROJECT_ID}.iam.gserviceaccount.com"
    
    # Secret Manager access
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:${SA_EMAIL}" \
        --role="roles/secretmanager.secretAccessor" \
        --condition=None \
        --quiet
    
    # Cloud SQL access
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:${SA_EMAIL}" \
        --role="roles/cloudsql.client" \
        --condition=None \
        --quiet
    
    # Cloud Run invoker (for service-to-service communication)
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:${SA_EMAIL}" \
        --role="roles/run.invoker" \
        --condition=None \
        --quiet
    
    log_info "Granted permissions to: $SA"
done

log_success "IAM permissions configured"

# =============================================================================
# Grant Cloud Build Permissions
# =============================================================================
log_info "Granting Cloud Build service account permissions..."

# Get Cloud Build service account
CLOUDBUILD_SA="${PROJECT_ID}@cloudbuild.gserviceaccount.com"

# Cloud Build needs these permissions
CLOUDBUILD_ROLES=(
    "roles/run.admin"
    "roles/iam.serviceAccountUser"
    "roles/secretmanager.secretAccessor"
)

for ROLE in "${CLOUDBUILD_ROLES[@]}"; do
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:${CLOUDBUILD_SA}" \
        --role="$ROLE" \
        --condition=None \
        --quiet
done

log_success "Cloud Build permissions configured"

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "=========================================="
echo "✅ GCP Infrastructure Setup Complete!"
echo "=========================================="
echo ""
echo "📋 Resources Created:"
echo "  • Cloud SQL Instance:  $DB_INSTANCE_NAME"
echo "  • Database:            $DB_NAME"
echo "  • Database User:       $DB_USER"
echo "  • Redis Instance:      $REDIS_INSTANCE_NAME"
echo "  • VPC Connector:       $VPC_CONNECTOR_NAME"
echo "  • Service Accounts:    ${SERVICE_ACCOUNTS[*]}"
echo ""
echo "🔑 Connection Information:"
echo "  • SQL Connection Name: $SQL_CONNECTION_NAME"
echo "  • Redis Endpoint:      $REDIS_IP:$REDIS_PORT"
echo "  • VPC Connector:       projects/$PROJECT_ID/locations/$REGION/connectors/$VPC_CONNECTOR_NAME"
echo ""
echo "📝 Next Steps:"
echo "  1. Connect your repository to Cloud Build:"
echo "     gcloud builds triggers create github --repo-owner=YOUR_ORG --repo-name=performa-edu --branch-pattern='^main$' --build-config=cloudbuild.yaml"
echo ""
echo "  2. Or deploy manually:"
echo "     ./deploy/scripts/deploy.sh"
echo ""
echo "  3. Or trigger a build:"
echo "     gcloud builds submit --config=cloudbuild.yaml"
echo ""
