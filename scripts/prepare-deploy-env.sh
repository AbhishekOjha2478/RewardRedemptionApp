#!/usr/bin/env bash
# Builds the environment variables the backend needs in production.
# Run it, answer the prompts, then copy the result into Render.
#
#   bash scripts/prepare-deploy-env.sh
#
# The file it writes is ignored by git and never leaves your machine.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$REPO_ROOT/deploy/render.env"
mkdir -p "$REPO_ROOT/deploy"

echo "TiDB Cloud connection details"
echo "Press Enter to accept each value in brackets. Only the password is needed."
echo

DEFAULT_HOST="gateway01.ap-southeast-1.prod.aws.tidbcloud.com"
DEFAULT_USER="AF5uFGy3gm4FNpR.root"

read -r -p "  Host [$DEFAULT_HOST] : " DB_HOST
DB_HOST="${DB_HOST:-$DEFAULT_HOST}"
case "$DB_HOST" in
  *.*) ;;
  *) echo
     echo "  '$DB_HOST' is not a hostname. It should end in tidbcloud.com."
     echo "  If you pasted your password here by mistake, run this again and"
     echo "  press Enter at this prompt to accept the default."
     exit 1 ;;
esac

read -r -p "  Port [4000] : " DB_PORT
DB_PORT="${DB_PORT:-4000}"
read -r -p "  Database name [ces_rewards] : " DB_NAME
DB_NAME="${DB_NAME:-ces_rewards}"
read -r -p "  Username [$DEFAULT_USER] : " DB_USERNAME
DB_USERNAME="${DB_USERNAME:-$DEFAULT_USER}"
read -r -s -p "  Password (typing is hidden) : " DB_PASSWORD
echo
echo

if [ -z "$DB_PASSWORD" ]; then
  echo "A password is required. Run this again."
  exit 1
fi

read -r -p "Choose an admin password for the portal [generated] : " SEED_ADMIN_PASSWORD
if [ -z "$SEED_ADMIN_PASSWORD" ]; then
  SEED_ADMIN_PASSWORD="Aurum$(head -c 6 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 8)!1"
  echo "  generated: $SEED_ADMIN_PASSWORD"
fi

JWT_SECRET="$(head -c 48 /dev/urandom | base64 | tr -d '\n')"

cat > "$OUT" <<VARS
SPRING_PROFILES_ACTIVE=prod
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USERNAME=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD
DB_PARAMS=sslMode=VERIFY_IDENTITY&serverTimezone=UTC
JWT_SECRET=$JWT_SECRET
JWT_ACCESS_MINUTES=15
JWT_REFRESH_DAYS=7
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=$SEED_ADMIN_PASSWORD
SEED_ADMIN_EMAIL=admin@cesportal.local
SEED_ADMIN_FULL_NAME=Portal Administrator
DEMO_SEED_ENABLED=false
CORS_ORIGINS=http://localhost:5173
VARS

chmod 600 "$OUT"

echo
if command -v mysql > /dev/null 2>&1; then
  echo "Testing the connection..."
  if mysql --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USERNAME" \
       --password="$DB_PASSWORD" --ssl-mode=VERIFY_IDENTITY \
       -e "SELECT 'connected' AS status; SHOW DATABASES LIKE '$DB_NAME';" 2>/dev/null; then
    echo "  connection works"
  else
    echo "  WARNING: could not connect. Check the password, and that you ran"
    echo "           CREATE DATABASE $DB_NAME; in the TiDB SQL editor."
  fi
  echo
fi

echo "Written to deploy/render.env"
echo
echo "Next:"
echo "  1. In Render, create a Web Service from this repository."
echo "  2. Root directory: backend"
echo "  3. Paste every line of deploy/render.env into its Environment tab."
echo "  4. Once Cloudflare Pages is live, change CORS_ORIGINS to that exact address."
echo
echo "Your portal login will be:  admin / $SEED_ADMIN_PASSWORD"
echo "Write that down. It is only shown now."
