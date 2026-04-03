#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  Out West Glow Golf — Deploy Script
#  Run this on the Ionos server after pushing to GitHub.
#
#  First time setup on the server:
#    chmod +x /kunden/homepages/40/d493077416/htdocs/test_west/deploy.sh
#
#  Then to deploy any update, just SSH in and run:
#    ~/test_west/deploy.sh
#    (or the full path below)
# ─────────────────────────────────────────────────────────────

SITE_DIR="/kunden/homepages/40/d493077416/htdocs/test_west"

echo ""
echo "==> Out West Glow Golf Deploy"
echo "==> $(date)"
echo ""

cd "$SITE_DIR" || { echo "ERROR: Could not cd to $SITE_DIR"; exit 1; }

echo "--> Pulling latest from GitHub..."
git pull origin main

echo "--> Setting file permissions..."
find . -type f \( -name "*.html" -o -name "*.css" -o -name "*.js" -o -name "*.php" -o -name "*.svg" -o -name "*.png" -o -name "*.jpg" -o -name "*.ico" \) -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;

echo ""
echo "==> Done! Site is live."
echo ""
