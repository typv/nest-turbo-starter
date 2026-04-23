#!/bin/bash

# Define directories to clean:
# "." represents the root, and ${1:-apps} uses the first argument or defaults to "apps"
TARGET_DIRS=("." "${1:-apps}")

echo "Starting project cleanup..."

for dir in "${TARGET_DIRS[@]}"; do
  # Check if the target directory exists before attempting to clean
  if [ -d "$dir" ]; then
    echo "----------------------------------------"
    echo "Cleaning up in: $dir/"

    # Use find to locate and remove build artifacts
    # -maxdepth 2 ensures we don't go too deep into nested sub-projects
    find "$dir" -maxdepth 2 -type d \( -name "node_modules" -o -name "dist" -o -name ".turbo" \) -exec rm -rf '{}' +

    # Remove TypeScript build info files
    find "$dir" -type f -name "tsconfig.build.tsbuildinfo" -delete
  else
    # Warn the user if the specified directory is missing
    echo "Warning: Directory '$dir' does not exist, skipping."
  fi
done

echo "----------------------------------------"
echo "Cleanup complete!"