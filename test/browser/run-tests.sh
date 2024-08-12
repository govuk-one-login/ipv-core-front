#!/bin/bash
# Wait for the mock server to be up
until curl -s http://localhost:8080/health; do
  echo "Waiting for mock server..."
  sleep 5
done

# Wait for the web server to be up
until curl -s http://localhost:4501/healthcheck; do
  echo "Waiting for web server..."
  sleep 5
done

echo "All services are up!"

npm run test
