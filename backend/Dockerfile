FROM node:20-slim

WORKDIR /app

# Install required system dependencies for Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy source code
COPY . .

# Debug: List files to see what was copied
RUN echo "=== Files in /app ===" && ls -la
RUN echo "=== Files in /app/src ===" && ls -la src/ || echo "src directory not found"

# Cache busting - add timestamp to force rebuild
RUN echo "Build timestamp: $(date)" > /tmp/build-timestamp

# Force clean Prisma cache and regenerate with correct binary
RUN rm -rf node_modules/.prisma
RUN rm -rf node_modules/@prisma/client
RUN npm install @prisma/client

# Set environment variable to force correct binary target
ENV PRISMA_CLI_BINARY_TARGETS="debian-openssl-3.0.x"
ENV PRISMA_QUERY_ENGINE_LIBRARY="/app/node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node"

# Force regenerate with correct binary target (from schema)
RUN npx prisma generate

# Debug: Check system and Prisma binaries
RUN echo "=== System info ===" && uname -a && lsb_release -a 2>/dev/null || echo "No lsb_release"
RUN echo "=== OpenSSL version ===" && openssl version
RUN echo "=== Prisma binaries ===" && ls -la node_modules/.prisma/client/ || echo "No .prisma directory"
RUN echo "=== Binary files ===" && find node_modules/.prisma/client -name "*.so*" || echo "No .so files found"
RUN echo "=== Checking for musl binary ===" && find node_modules/.prisma/client -name "*musl*" || echo "No musl binary found (good!)"
RUN echo "=== Checking for debian binary ===" && find node_modules/.prisma/client -name "*debian*" || echo "No debian binary found (bad!)"

# Build the application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]