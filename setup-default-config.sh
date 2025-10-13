#!/bin/bash

echo "Setting up default RTMP configuration..."

# Run the script inside the backend container
docker exec custom-restreamer-backend-1 node /app/src/scripts/create-default-config.js

echo "Default configuration setup complete!"
