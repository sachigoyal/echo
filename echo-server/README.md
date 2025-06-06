# Echo Server

## Prerequisites

This server depends on the generated Prisma client from the `echo-control` project. Before running the server, you need to ensure the Prisma client is copied locally.

## Development

### First Time Setup

1. Make sure the `echo-control` project has generated its Prisma client:

   ```bash
   cd ../echo-control
   npm run build  # or whatever command generates the Prisma client
   ```

2. Copy the generated Prisma client:
   ```bash
   npm run copy-prisma
   ```

### Running the Server

```bash
# Development mode (automatically copies Prisma client)
npm run dev

# Production mode
npm run build
npm start
```

The `dev` and `start` scripts automatically run `copy-prisma` as a pre-hook, so you don't need to run it manually.

## Docker Considerations

When building a Docker image, you'll need to ensure both projects are available in the build context:

### Option 1: Multi-stage build with both projects

```dockerfile
FROM node:18-alpine AS base

# Copy both projects
COPY echo-control/ /app/echo-control/
COPY echo-server/ /app/echo-server/

# Build echo-control first
WORKDIR /app/echo-control
RUN npm ci && npm run build

# Build echo-server
WORKDIR /app/echo-server
RUN npm ci && npm run build

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=base /app/echo-server/dist ./dist
COPY --from=base /app/echo-server/node_modules ./node_modules
COPY --from=base /app/echo-server/package.json ./package.json

CMD ["npm", "start"]
```

### Option 2: Build artifacts approach

1. Build the echo-control project and export the generated files
2. Copy the generated files into the echo-server build context
3. Build the echo-server

## Scripts

- `copy-prisma`: Copies the generated Prisma client from echo-control
- `dev`: Runs the development server (with auto-copy)
- `build`: Builds the TypeScript code (with auto-copy)
- `start`: Starts the production server (with auto-copy)

## Error Handling

If the generated Prisma client is not found, the server will throw a descriptive error message asking you to run `npm run copy-prisma`.
