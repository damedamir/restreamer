#!/bin/bash

# Download and run the latest setup script
echo "Downloading latest setup script..."
curl -fsSL https://raw.githubusercontent.com/damedamir/custom-restreamer/main/setup-server.sh -o /tmp/setup-server-latest.sh
chmod +x /tmp/setup-server-latest.sh

echo "Running latest setup script..."
/tmp/setup-server-latest.sh

echo "Cleaning up..."
rm -f /tmp/setup-server-latest.sh
