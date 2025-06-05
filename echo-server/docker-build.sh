#!/bin/bash

# Docker build script for echo-server
# This script must be run from the workspace root directory

set -e

# Check if we're in the workspace root
if [ ! -f "tsconfig.base.json" ] || [ ! -d "echo-server" ] || [ ! -d "echo-typescript-sdk" ]; then
    echo "Error: This script must be run from the workspace root directory"
    echo "Current directory: $(pwd)"
    echo "Expected files/directories: tsconfig.base.json, echo-server/, echo-typescript-sdk/"
    exit 1
fi

# Build the Docker image
echo "Building echo-server Docker image from workspace root..."
docker build -f echo-server/Dockerfile -t echo-server:latest .

echo "✅ Docker image built successfully!"
echo "Run with: docker run -p 3069:3069 echo-server:latest" 