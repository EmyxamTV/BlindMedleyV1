#!/bin/sh
set -e

cd /app

echo "Running database migrations..."
node --no-warnings ace migration:run --force

echo "Starting the application..."
exec node --no-warnings bin/server.js
