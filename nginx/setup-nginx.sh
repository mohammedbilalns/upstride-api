#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────
# Upstride Nginx Setup Script
# ──────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Copying http-level config to /etc/nginx/conf.d/"
cp "$SCRIPT_DIR/upstride-http.conf" /etc/nginx/conf.d/upstride-http.conf

echo "==> Copying site config to /etc/nginx/sites-available/"
cp "$SCRIPT_DIR/upstride-api.conf" /etc/nginx/sites-available/upstride-api

echo "==> Enabling site..."
ln -sf /etc/nginx/sites-available/upstride-api /etc/nginx/sites-enabled/upstride-api

echo "==> Removing default site..."
rm -f /etc/nginx/sites-enabled/default

echo "==> Testing nginx config..."
if nginx -t; then
  if systemctl is-active --quiet nginx; then
    echo "==> Reloading nginx..."
    systemctl reload nginx
  else
    echo "==> Starting nginx..."
    systemctl start nginx
  fi
  echo ""
  echo "  Nginx configured successfully!"
  echo "   Domain: upstride-api.bilalnsmuhammed.in"
  echo ""
  echo "   Next step — get SSL:"
  echo "   sudo certbot --nginx -d upstride-api.bilalnsmuhammed.in"
else
  echo ""
  echo "❌ Nginx config test failed. Check the errors above."
  exit 1
fi
