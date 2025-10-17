#!/bin/bash

echo "Setting up default RTMP configuration..."

# Run the script inside the backend container
docker exec restreamer-backend node /app/src/scripts/create-default-config.js

echo "Default configuration setup complete!"
