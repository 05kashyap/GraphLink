"""
WSGI entry point for PythonAnywhere.

Paste this into the WSGI configuration file linked from the Web tab
(/var/www/<username>_pythonanywhere_com_wsgi.py), replacing its contents.
"""
import os
import sys
from pathlib import Path

HOME = Path.home()
APP_DIR = HOME / "GraphLink" / "backend"
ENV_FILE = HOME / "graphlink-data" / "env"


def load_env(path):
    """Read KEY=VALUE lines (the same file deploy.sh sources) into os.environ."""
    for line in path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip("'\""))


load_env(ENV_FILE)
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "graphlink.settings")

from django.core.wsgi import get_wsgi_application  # noqa: E402

application = get_wsgi_application()
