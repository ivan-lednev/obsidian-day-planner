#!/bin/sh

echo "REPO_NAME is: ${REPO_NAME}"

if [ -z "$REPO_NAME" ]; then
  echo "Error: REPO_NAME is not set."
  exit 1
fi

TAG=$(git describe --abbrev=0 --tags 2>/dev/null || echo 'untagged')

echo "Using tag: $TAG"

npm run build

mkdir -p "${REPO_NAME}"

cp main.js manifest.json styles.css README.md "${REPO_NAME}/."

zip -r "${REPO_NAME}-${TAG}.zip" "${REPO_NAME}"

echo "Created archive: ${REPO_NAME}-${TAG}.zip"
