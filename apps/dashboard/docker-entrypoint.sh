#!/bin/sh
set -e

PORT=${PORT:-80}
API_URL=${API_URL:-}

if [ -n "$API_URL" ]; then
  cat > /etc/nginx/conf.d/default.conf <<NGINX
server {
    listen ${PORT};
    root /usr/share/nginx/html;
    index index.html;
    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    location /api/ {
        proxy_pass ${API_URL}/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$http_host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    location ~* \\.(?:js|css|woff2?|png|jpg|svg|ico)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX
  echo "Nginx: proxying /api/ -> ${API_URL}/api/"
else
  cat > /etc/nginx/conf.d/default.conf <<NGINX
server {
    listen ${PORT};
    root /usr/share/nginx/html;
    index index.html;
    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    location ~* \\.(?:js|css|woff2?|png|jpg|svg|ico)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX
  echo "WARNING: API_URL not set — /api/ requests will not be proxied. Set API_URL to your API service URL in Railway."
fi

exec nginx -g 'daemon off;'
