#!/bin/bash
# integration-tests/scripts/setup-integration-env.sh

set -e

echo "🚀 Setting up Echo integration test environment..."

# Change to integration-tests directory
cd "$(dirname "$0")/.."

# Detect environment
if [ "$CI" = "true" ]; then
    echo "📦 Running in CI environment"
    ENV_FILE=".env.integration.ci"
    IS_CI=true
elif [ -f ".env.integration.local" ]; then
    echo "🏠 Using local integration environment"
    ENV_FILE=".env.integration.local"
    IS_CI=false
else
    echo "🔧 Using default integration environment"
    ENV_FILE=".env.integration"
    IS_CI=false
fi

# Load environment variables
if [ -f "$ENV_FILE" ]; then
    # Export variables from env file (skip comments and empty lines)
    set -a
    source <(grep -v '^#' "$ENV_FILE" | grep -v '^$')
    set +a
    echo "✅ Loaded environment from $ENV_FILE"
else
    echo "❌ Environment file $ENV_FILE not found"
    exit 1
fi

# Validate required environment variables
required_vars=(
    "DATABASE_URL"
    "ECHO_CONTROL_URL"
    "JWT_SECRET"
    "CLERK_SECRET_KEY"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables: ${missing_vars[*]}"
    echo "Please set these variables in $ENV_FILE"
    exit 1
fi

echo "✅ All required environment variables are set"

# Start services based on environment
if [ "$IS_CI" != "true" ]; then
    echo "🐳 Starting Docker services for integration tests..."
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker Desktop."
        exit 1
    fi
    
    # Start services
    docker-compose -f docker/docker-compose.yml up -d
    
    # Wait for services to be healthy
    echo "⏳ Waiting for services to be ready..."
    timeout 120 bash -c '
        while true; do
            if docker-compose -f docker/docker-compose.yml ps | grep -q "healthy"; then
                echo "✅ Services are healthy"
                break
            fi
            echo "⏳ Still waiting for services..."
            sleep 5
        done
    ' || {
        echo "❌ Services failed to start within 2 minutes"
        echo "📊 Service status:"
        docker-compose -f docker/docker-compose.yml ps
        echo "📋 Logs from echo-control-test:"
        docker-compose -f docker/docker-compose.yml logs echo-control-test
        exit 1
    }
    
else
    echo "📦 CI environment detected - services managed by GitHub Actions"
    
    # In CI, manually start echo-control since it's not in Docker
    echo "🗃️ Setting up database for CI..."
    cd ../echo-control
    
    # Wait for database to be available
    timeout 30 bash -c '
        while ! pg_isready -h localhost -p 5433 -U test -d echo_integration_test; do
            echo "⏳ Waiting for database..."
            sleep 2
        done
    '
    
    # Run Prisma migrations
    pnpm prisma:push
    
    # Seed integration test data
    echo "🌱 Seeding integration test database..."
    INTEGRATION_TEST_MODE=true pnpm db:seed
    
    echo "🚀 Starting echo-control test server..."
    pnpm build
    
    # Start echo-control in background
    pnpm start &
    ECHO_CONTROL_PID=$!
    
    # Wait for health check
    timeout 60 bash -c '
        while ! curl -f http://localhost:3001/api/health >/dev/null 2>&1; do
            echo "⏳ Waiting for echo-control health check..."
            sleep 2
        done
    ' || {
        echo "❌ echo-control failed to start within 60 seconds"
        kill $ECHO_CONTROL_PID 2>/dev/null || true
        exit 1
    }
    
    echo "✅ echo-control is healthy at http://localhost:3001"
    cd ../integration-tests
fi

echo ""
echo "🎉 Integration environment ready!"
echo ""
echo "🌐 Services:"
echo "  📊 Echo Control: $ECHO_CONTROL_URL"
echo "  🗄️  Database: ${DATABASE_URL#*@}"
echo ""
echo "🧪 Available test commands:"
echo "  pnpm test:oauth-protocol  - OAuth2 compliance tests"
echo "  pnpm test:react-sdk       - React SDK integration tests"
echo "  pnpm test:typescript-sdk  - TypeScript SDK integration tests"
echo "  pnpm test:cross-sdk       - Cross-SDK interoperability tests"
echo "  pnpm test:e2e             - End-to-end browser tests"
echo "  pnpm test:all             - Run all integration tests"
echo ""
echo "🗄️  Database management:"
echo "  pnpm db:seed              - Seed test data"
echo "  pnpm db:reset             - Clean all test data"
echo "  pnpm db:reset-and-seed    - Reset and seed test data"
echo ""
echo "🐳 Docker management:"
echo "  pnpm docker:up            - Start all services"
echo "  pnpm docker:down          - Stop all services"
echo "  pnpm docker:logs          - View service logs"