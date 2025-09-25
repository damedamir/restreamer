FROM node:20-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Install required libraries for Prisma on Alpine Linux
RUN apk add --no-cache \
    openssl1.1-compat \
    libc6-compat \
    libssl1.1

# Copy source code
COPY . .

# Debug: List files to see what was copied
RUN echo "=== Files in /app ===" && ls -la
RUN echo "=== Files in /app/src ===" && ls -la src/ || echo "src directory not found"

# Cache busting - add timestamp to force rebuild
RUN echo "Build timestamp: $(date)" > /tmp/build-timestamp

# Clean and regenerate Prisma client AFTER installing libraries
RUN rm -rf node_modules/.prisma
RUN npx prisma generate

# Build the application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]