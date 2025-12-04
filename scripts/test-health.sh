#!/bin/bash

# Health Check Test Script for Auth Service
# Make sure your auth service is running first

echo "🏥 Testing Health Checks for Auth Service"
echo "========================================="

# Set the service URL and proto path
SERVICE_URL="localhost:50051"
PROTO_PATH="/Users/farrelfauzan/Documents/performa-edu/proto"

# Function to run grpcurl with error handling
run_health_check() {
    local test_name="$1"
    local proto_file="$2"
    local service_method="$3"
    local data="$4"
    
    echo ""
    echo "🔍 $test_name"
    echo "-------------------------------------------"
    
    if grpcurl -plaintext -import-path "$PROTO_PATH" -proto "$proto_file" \
       -d "$data" "$SERVICE_URL" "$service_method" 2>/dev/null; then
        echo "✅ SUCCESS"
    else
        echo "❌ FAILED - Service might be down or method not implemented"
    fi
}

# Test 1: Auth Service Health Check
run_health_check \
    "Testing Auth Service Health Check" \
    "auth-service-health.proto" \
    "authservicehealth.AuthServiceHealth/Check" \
    "{}"

# Test 2: Liveness Check
run_health_check \
    "Testing Liveness Probe" \
    "auth-service-health.proto" \
    "authservicehealth.AuthServiceHealthMonitor/CheckLiveness" \
    "{}"

# Test 3: Readiness Check
run_health_check \
    "Testing Readiness Probe" \
    "auth-service-health.proto" \
    "authservicehealth.AuthServiceHealthMonitor/CheckReadiness" \
    "{}"

# Test 4: Watch Health (streaming)
echo ""
echo "🔍 Testing Health Watch (streaming - 5 second timeout)"
echo "-------------------------------------------"
if timeout 5s grpcurl -plaintext -import-path "$PROTO_PATH" -proto "auth-service-health.proto" \
   -d "{}" "$SERVICE_URL" "authservicehealth.AuthServiceHealth/Watch" 2>/dev/null; then
    echo "✅ STREAMING SUCCESS"
else
    echo "⚠️  STREAMING TIMEOUT (expected for continuous stream)"
fi

# Test 5: List available services
echo ""
echo "🔍 Listing Available Services"
echo "-------------------------------------------"
if grpcurl -plaintext -import-path "$PROTO_PATH" -proto "auth-service.proto" \
   "$SERVICE_URL" list 2>/dev/null; then
    echo "✅ SERVICE LIST SUCCESS"
else
    echo "❌ FAILED - Cannot list services"
fi

# Test 6: Service connectivity check
echo ""
echo "🔍 Testing Service Connectivity"
echo "-------------------------------------------"
if nc -z localhost 50051 2>/dev/null; then
    echo "✅ Port 50051 is open and accessible"
else
    echo "❌ Cannot connect to localhost:50051"
    echo "💡 Make sure your auth service is running with: pnpm nx serve auth-service"
fi

echo ""
echo "================================================"
echo "🏁 Health Check Tests Completed!"
echo "================================================"
echo ""
echo "💡 Tips:"
echo "   • If tests fail, ensure auth service is running"
echo "   • Check GRPC_HOST and GRPC_PORT environment variables"
echo "   • Verify proto files are up to date with: nx generate-proto-types"
echo ""