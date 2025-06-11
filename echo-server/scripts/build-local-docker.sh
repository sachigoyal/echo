#!/bin/bash
# Build Docker image from echo-server directory
# This script should be run from the echo-server directory
cd .. && docker build -f ./echo-server/docker/Dockerfile.local -t echo-server-local .