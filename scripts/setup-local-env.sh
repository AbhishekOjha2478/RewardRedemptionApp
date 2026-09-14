#!/usr/bin/env bash
# One-time local environment setup. Run once, with sudo available:
#   bash scripts/setup-local-env.sh
#
# It does three things:
#   1. lets your user talk to Docker without sudo
#   2. creates the MySQL database and a dedicated application user
#   3. prints what it did so you can verify
set -euo pipefail

DB_NAME="${DB_NAME:-ces_rewards}"
DB_USER="${DB_USERNAME:-ces_app}"
DB_PASS="${DB_PASSWORD:-ces_app_pw}"

echo "==> 1/3  Docker group"
if groups "$USER" | grep -qw docker; then
  echo "    already in the docker group"
else
  sudo groupadd -f docker
  sudo usermod -aG docker "$USER"
  echo "    added $USER to the docker group"
  echo "    NOTE: log out and back in (or run 'newgrp docker') for this to take effect"
fi

echo "==> 2/3  MySQL database and user"
sudo mysql <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL
echo "    database '${DB_NAME}' and user '${DB_USER}' ready"

echo "==> 3/3  Verifying the app user can connect"
if mysql -u "${DB_USER}" -p"${DB_PASS}" -e "USE \`${DB_NAME}\`; SELECT 'connection OK' AS status;" 2>/dev/null; then
  echo "    verified"
else
  echo "    WARNING: could not connect as ${DB_USER}. Check the password above."
  exit 1
fi

echo
echo "Done. Local environment is ready."
echo "  database : ${DB_NAME}"
echo "  username : ${DB_USER}"
echo "  password : ${DB_PASS}"
echo
echo "These match the defaults in backend/src/main/resources/application.yml,"
echo "so the backend will connect without any extra configuration."
