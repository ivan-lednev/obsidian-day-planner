#!/bin/sh

git config --global --add safe.directory /app
export npm_config_platform=linux
npm install --loglevel=silly --prefer-offline --no-audit --ignore-scripts
npm ci --loglevel=silly --prefer-offline --no-audit --ignore-scripts

exec "$@"
