#!/bin/bash
# integration-tests/scripts/teardown-integration-env.sh

set -e

echo "🧹 Tearing down Echo integration test environment..."

# Change to integration-tests directory
cd "$(dirname "$0")/.."

# Detect environment
if [ "$CI" = "true" ]; then
    echo "📦 CI environment detected"
    IS_CI=true
else
    echo "🏠 Local environment detected"
    IS_CI=false
fi

if [ "$IS_CI" != "true" ]; then
    echo "🐳 Stopping Docker services..."
    
    # Stop and remove containers, networks, and volumes
    docker-compose -f docker/docker-compose.yml down -v
    
    echo "🗑️  Cleaning up Docker resources..."
    
    # Remove any dangling images from our compose
    docker image prune -f --filter "label=com.docker.compose.project=integration-tests" || true
    
    # Remove unused volumes
    docker volume prune -f || true
    
    echo "✅ Local integration environment cleaned up"
    
else
    echo "📦 CI teardown - stopping background processes..."
    
    # Kill any background echo-control processes
    pkill -f "next start" || true
    pkill -f "echo-control" || true
    
    # Kill any background echo-data-server processes
    pkill -f "echo-server" || true
    pkill -f "echo-data-server" || true
    
    echo "🗃️ Cleaning up CI database..."
    cd ../echo-control
    
    # Reset database (optional in CI, but good for cleanup)
    if command -v pnpm >/dev/null 2>&1; then
        pnpm db:reset || echo "⚠️  Database reset failed (might not be running)"
    fi
    
    cd ../integration-tests
    echo "✅ CI integration environment cleaned up"
fi

echo "🎉 Integration test environment teardown complete!"