#!/bin/bash

echo "🚀 Setting up Echo Control PostgreSQL Database..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
# Database - Docker PostgreSQL
DATABASE_URL="postgresql://echo_user:echo_password@localhost:5432/echo_control?schema=public"

# Authentication (Mocked for now)
CLERK_SECRET_KEY="mock_clerk_secret_key"
CLERK_PUBLISHABLE_KEY="mock_clerk_publishable_key"

# Stripe (Mocked for now)
STRIPE_SECRET_KEY="mock_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="mock_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="mock_webhook_secret"

# Application
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
API_KEY_PREFIX="echo_"
EOF
    echo "✅ .env file created"
else
    echo "ℹ️  .env file already exists"
fi

# Start PostgreSQL container
echo "🐳 Starting PostgreSQL container..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker-compose exec postgres pg_isready -U echo_user -d echo_control 2>/dev/null; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

echo "✅ PostgreSQL is ready!"

# Check if .env file exists and show DATABASE_URL
if [ -f .env ]; then
    echo "🔍 Checking DATABASE_URL..."
    grep "DATABASE_URL" .env
fi

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
npx prisma generate
npx prisma db push

echo "🎉 Database setup complete!"
echo ""
echo "📊 You can now run:"
echo "  npm run dev          # Start the application"
echo "  npx prisma studio    # View the database"
echo "  docker-compose logs  # View database logs"
echo "  docker-compose down  # Stop the database" 