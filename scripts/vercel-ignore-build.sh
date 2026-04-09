#!/bin/bash

echo "Checking deployment branch: $VERCEL_GIT_COMMIT_REF"

# Allow manual deployments
if [ -z "$VERCEL_GIT_COMMIT_REF" ]; then
  echo "No Git reference found. Proceeding with build (likely a manual deployment via CLI)."
  exit 1
fi

if [ "$VERCEL_GIT_COMMIT_REF" = "master" ] || [ "$VERCEL_GIT_COMMIT_REF" = "main" ]; then
  echo "Auto deployments are disabled for production branches. Skipping build."
  exit 0 # Exit code 0 means "cancel the build" in Vercel
else
  echo "Preview branch detected. Proceeding with build."
  exit 1 # Exit code 1 means "continue the build" in Vercel
fi
