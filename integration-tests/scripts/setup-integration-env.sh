#!/bin/bash
# integration-tests/scripts/setup-integration-env.sh

set -e

echo "🚀 Setting up Echo integration test environment..."

# Change to integration-tests directory
cd "$(dirname "$0")/.."

# Detect environment
if [ "$CI" = "true" ]; then
    echo "📦 Running in CI environment"
    ENV_FILE=".env.test"
    IS_CI=true
elif [ -f ".env.test.local" ]; then
    echo "🏠 Using local integration environment"
    ENV_FILE=".env.test.local"
    IS_CI=false
else
    echo "🔧 Using default integration environment"
    ENV_FILE=".env.test"
    IS_CI=false
fi

# Load environment variables
if [ -f "$ENV_FILE" ]; then
    # Export variables from env file (skip comments and empty lines)
    set -a
    # Use a more reliable method to load environment variables
    while IFS= read -r line || [[ -n "$line" ]]; do
        # Skip comments and empty lines
        if [[ ! "$line" =~ ^[[:space:]]*# ]] && [[ -n "${line// }" ]]; then
            export "$line"
        fi
    done < "$ENV_FILE"
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
    "CLERK_PUBLISHABLE_KEY"
    "INTEGRATION_TEST_JWT"
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
    
    # macOS-compatible timeout implementation
    start_time=$(date +%s)
    timeout_duration=120
    
    while true; do
        current_time=$(date +%s)
        elapsed=$((current_time - start_time))
        
        if [ $elapsed -ge $timeout_duration ]; then
            echo "❌ Services failed to start within $timeout_duration seconds"
            break
        fi
        
        # Check if all services (including echo-control) are healthy
        if docker-compose -f docker/docker-compose.yml ps | grep -q "healthy" && \
           curl -f "$ECHO_CONTROL_URL/api/health" >/dev/null 2>&1; then
            echo "✅ Services are healthy"
            
            # Seed the database
            echo "🌱 Seeding integration test database..."
            pnpm db:seed
            
            exit 0
        fi
        
        echo "⏳ Still waiting for services... (${elapsed}s elapsed)"
        sleep 5
    done
    
    {
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
    start_time=$(date +%s)
    while ! pg_isready -h localhost -p 5433 -U test -d echo_integration_test; do
        current_time=$(date +%s)
        elapsed=$((current_time - start_time))
        if [ $elapsed -ge 30 ]; then
            echo "❌ Database failed to start within 30 seconds"
            exit 1
        fi
        echo "⏳ Waiting for database... (${elapsed}s elapsed)"
        sleep 2
    done
    
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
    start_time=$(date +%s)
    while ! curl -f http://localhost:3001/api/health >/dev/null 2>&1; do
        current_time=$(date +%s)
        elapsed=$((current_time - start_time))
        if [ $elapsed -ge 60 ]; then
            echo "❌ echo-control failed to start within 60 seconds"
            kill $ECHO_CONTROL_PID 2>/dev/null || true
            exit 1
        fi
        echo "⏳ Waiting for echo-control health check... (${elapsed}s elapsed)"
        sleep 2
    done || {
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