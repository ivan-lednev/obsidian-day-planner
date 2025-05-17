#!/bin/sh

# Echo the repo name for logging purposes
echo "REPO_NAME is: ${REPO_NAME}"

# Check if REPO_NAME is set, if not, exit with an error message
if [ -z "$REPO_NAME" ]; then
  echo "Error: REPO_NAME is not set."
  exit 1
fi

# Get the latest tag if it exists, otherwise use 'untagged'
TAG=$(git describe --abbrev=0 --tags 2>/dev/null || echo 'untagged')
echo "Using tag: $TAG"

# Run npm build with additional logging options for detailed output
npm run build --no-package-lock --loglevel=silly

# Ensure the directory exists before copying files into it
mkdir -p "${REPO_NAME}"

# Copy files into the directory, using "." to specify current directory
cp main.js manifest.json styles.css README.md "${REPO_NAME}/."

# Create zip file, adding the tag to the filename for version control
zip -r "${REPO_NAME}-${TAG}.zip" "${REPO_NAME}"

# Echo the name of the created archive for confirmation
echo "Created archive: ${REPO_NAME}-${TAG}.zip"
