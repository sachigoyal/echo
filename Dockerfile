# Use Node.js 20 as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Declare build arguments for environment variables needed during build
ARG DATABASE_URL
ARG STRIPE_SECRET_KEY
ARG STRIPE_PUBLISHABLE_KEY
ARG STRIPE_WEBHOOK_SECRET
ARG CLERK_SECRET_KEY
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG API_KEY_PREFIX
ARG NODE_ENV
ARG ANTHROPIC_API_KEY
ARG OPENAI_API_KEY
ARG ECHO_API_KEY
ARG ECHO_BASE_URL
ARG WEBHOOK_URL

# Set environment variables from build arguments
ENV DATABASE_URL=$DATABASE_URL
ENV STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
ENV STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY
ENV STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET
ENV CLERK_SECRET_KEY=$CLERK_SECRET_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV API_KEY_PREFIX=$API_KEY_PREFIX
ENV NODE_ENV=$NODE_ENV
ENV ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ENV ECHO_API_KEY=$ECHO_API_KEY
ENV ECHO_BASE_URL=$ECHO_BASE_URL
ENV WEBHOOK_URL=$WEBHOOK_URL

# Install system dependencies
RUN apk add --no-cache \
    bash \
    git \
    openssh-client

# Copy package files for dependency installation
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy all project files first
COPY echo-control/ ./echo-control/
COPY echo-server/ ./echo-server/
COPY echo-typescript-sdk/ ./echo-typescript-sdk/

# Install dependencies for both projects (including dev dependencies for build)
WORKDIR /app/echo-control
RUN npm ci

WORKDIR /app/echo-server
RUN npm ci

# Step 1: Build echo-control and generate Prisma client
WORKDIR /app/echo-control
RUN npm run prisma:generate
RUN npm run build

WORKDIR /app/echo-typescript-sdk
RUN npm install
RUN npm run build

# Step 2: Copy the generated Prisma files to echo-server
WORKDIR /app/echo-server
RUN npm run copy-prisma

# Step 3: Build echo-server
RUN npm run build

# Expose the port that echo-server runs on
EXPOSE 3069

# Step 4: Start the server
CMD ["npm", "start"] 