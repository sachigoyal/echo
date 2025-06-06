# Use Node.js 20 as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

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