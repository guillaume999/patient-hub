#!/bin/sh
set -e

# Inject PocketBase URL at container startup (runtime)
# Set PB_URL as environment variable in Portainer stack
if [ -n "$PB_URL" ]; then
  echo "Injecting PB_URL: $PB_URL"
    find /usr/share/nginx/html/assets -name "*.js" \
        -exec sed -i "s|__PB_URL_PLACEHOLDER__|${PB_URL}|g" {} \;
        else
          echo "WARNING: PB_URL not set, using build-time default"
          fi

          exec nginx -g "daemon off;"
