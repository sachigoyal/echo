# Multi-stage build for echo-server
# This Dockerfile should be built from the workspace root to access dependencies

# Stage 1: Build stage
FROM node:18-slim AS builder

WORKDIR /workspace

# Copy base TypeScript config
COPY tsconfig.base.json ./

# Copy and build the TypeScript SDK dependency first
COPY echo-typescript-sdk/ ./echo-typescript-sdk/
WORKDIR /workspace/echo-typescript-sdk
RUN npm install && npm run build

# Copy echo-control for Prisma client dependency
WORKDIR /workspace
COPY echo-control/package*.json ./echo-control/
COPY echo-control/prisma/ ./echo-control/prisma/
COPY echo-control/src/generated/ ./echo-control/src/generated/

# Copy echo-server source and config
COPY echo-server/package*.json ./echo-server/
COPY echo-server/tsconfig.json ./echo-server/
COPY echo-server/src/ ./echo-server/src/

# Install echo-server dependencies and build
WORKDIR /workspace/echo-server
RUN npm install

# Build the TypeScript application
RUN npm run build

# Stage 2: Production stage
FROM node:18-slim AS production

# Install system dependencies for keytar
RUN apt-get update && apt-get install -y \
    libsecret-1-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built TypeScript SDK to the correct location for the local dependency
COPY --from=builder /workspace/echo-typescript-sdk ./echo-typescript-sdk

# Copy echo-server package files
COPY echo-server/package*.json ./

# Copy echo-control Prisma client for runtime dependency
COPY --from=builder /workspace/echo-control/src/generated/ ./echo-control/src/generated/

# Install only production dependencies using npm install to handle local deps
# This will create the proper symlinks for the local file dependencies
RUN npm install --only=production && npm cache clean --force

# Fix the symlink path for the TypeScript SDK since npm creates relative paths
RUN rm -f node_modules/@zdql/echo-typescript-sdk && \
    ln -sf /app/echo-typescript-sdk node_modules/@zdql/echo-typescript-sdk

# Copy built application from builder stage
COPY --from=builder /workspace/echo-server/dist ./dist

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose the correct port (3069 as defined in server.ts)
EXPOSE 3069

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3069/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
CMD ["npm", "start"] 