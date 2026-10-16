#!/usr/bin/env bash
# Update GraphLink on PythonAnywhere to the latest `deploy` branch.
# Run from a PythonAnywhere Bash console:  bash ~/GraphLink/deploy/pythonanywhere/deploy.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/GraphLink}"
DATA_DIR="${DATA_DIR:-$HOME/graphlink-data}"
VENV="${VENV:-$HOME/.virtualenvs/graphlink}"
WSGI_FILE="${WSGI_FILE:-/var/www/${USER,,}_pythonanywhere_com_wsgi.py}"

if [[ ! -f "$DATA_DIR/env" ]]; then
  echo "Missing $DATA_DIR/env. Copy deploy/pythonanywhere/env.example there first." >&2
  exit 1
fi
set -a
# shellcheck disable=SC1091
source "$DATA_DIR/env"
set +a

echo "==> Fetching the latest build"
cd "$APP_DIR"
git fetch origin deploy
git reset --hard origin/deploy

if [[ ! -f frontend/dist/index.html ]]; then
  echo "frontend/dist is missing. Is the deploy branch built by GitHub Actions?" >&2
  exit 1
fi

echo "==> Installing Python packages"
# shellcheck disable=SC1091
source "$VENV/bin/activate"
pip install --no-cache-dir --quiet -r backend/requirements.txt

echo "==> Migrating database and collecting static files"
cd backend
python manage.py migrate --noinput
python manage.py collectstatic --noinput --verbosity 0

echo "==> Reloading the web app"
touch "$WSGI_FILE"
echo "Deployed $(git -C "$APP_DIR" log -1 --format='%h %s')"
