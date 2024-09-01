#!/bin/sh

npm cache clean --force
rm -rf node_modules package-lock.json
git config --global --add safe.directory /app
npm install

exec "$@"
