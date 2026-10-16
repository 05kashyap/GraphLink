# Deploying GraphLink to PythonAnywhere

GraphLink runs on PythonAnywhere as a single Django web app: Django serves the API under `/api/` and the
compiled React frontend for every other URL.

PythonAnywhere doesn't build the frontend. A GitHub Actions workflow
(`.github/workflows/deploy-branch.yml`) does that on every push to `main`:

1. It runs the backend tests and builds the frontend.
2. It publishes the source plus `frontend/dist` to a `deploy` branch.
3. PythonAnywhere then pulls that branch.

```
push to main ──► GitHub Actions: test + build ──► `deploy` branch ──► deploy.sh on PythonAnywhere
```

Live data (the SQLite database and uploaded images) lives in `~/graphlink-data/`, outside the repository.
A deploy can never overwrite it.

The commands below assume the username `kashyap05` and the repository cloned at `~/GraphLink`. Substitute your
own if they differ. The **Code** section of the Web tab shows where the current site lives.

---

## 0. Before you start (on GitHub)

1. Merge the revamp into `main`. The workflow only runs from the default branch.
2. Open the repository's **Actions** tab and wait for **Build deploy branch** to go green. A `deploy` branch now
   exists.
   - If the "Publish deploy branch" step fails with a 403, go to **Settings → Actions → General → Workflow
     permissions**, choose **Read and write permissions**, then re-run the workflow.

## 1. Back up the live site

Open a **Bash console** on PythonAnywhere:

```bash
cp ~/GraphLink/db.sqlite3 ~/graphlink-backup-$(date +%F).sqlite3
tar czf ~/graphlink-media-backup-$(date +%F).tgz -C ~/GraphLink media
```

## 2. Move live data out of the repository

```bash
mkdir -p ~/graphlink-data
cp ~/GraphLink/db.sqlite3 ~/graphlink-data/db.sqlite3
cp -r ~/GraphLink/media ~/graphlink-data/media
```

The new version uses the same database tables, so existing users, posts and follows carry over unchanged.

## 3. Create the settings file

```bash
cd ~/GraphLink
git fetch origin deploy
git checkout -f -B deploy origin/deploy      # switches the clone to the new layout
cp deploy/pythonanywhere/env.example ~/graphlink-data/env
python3 -c "import secrets; print(secrets.token_urlsafe(50))"   # copy the output
nano ~/graphlink-data/env
```

In `env`:
- paste the generated value after `DJANGO_SECRET_KEY=`;
- check the username in the hosts and paths;
- optionally fill in the email settings.

Save with `Ctrl+O`, `Enter`, then exit with `Ctrl+X`.

`git checkout -f` throws away local edits to tracked files in the old clone. That's why steps 1 and 2 come first.

## 4. Create a virtualenv

Pick the newest Python 3.10+ that `ls /usr/bin/python3.*` lists. 3.12 is shown here:

```bash
mkvirtualenv graphlink --python=/usr/bin/python3.12
deactivate
```

## 5. Run the first deploy

```bash
bash ~/GraphLink/deploy/pythonanywhere/deploy.sh
```

The script:
- pulls the `deploy` branch;
- installs the Python packages;
- runs migrations and collects static files;
- reloads the web app.

The "reload" at the end only takes effect after the next step.

## 6. Configure the Web tab

On the **Web** tab of your `kashyap05.pythonanywhere.com` app:

| Setting | Value |
| --- | --- |
| Source code | `/home/kashyap05/GraphLink/backend` |
| Working directory | `/home/kashyap05/GraphLink/backend` |
| Python version | Same as the virtualenv (e.g. 3.12) |
| Virtualenv | `/home/kashyap05/.virtualenvs/graphlink` |
| Force HTTPS (Security section) | Enabled |

**WSGI configuration file:**
1. Click the link to open it.
2. Replace *everything* in it with the contents of `deploy/pythonanywhere/wsgi.py`. You can print that with
   `cat ~/GraphLink/deploy/pythonanywhere/wsgi.py`.
3. Save.

**Static files:** delete any old entries, then add:

| URL | Directory |
| --- | --- |
| `/static/` | `/home/kashyap05/GraphLink/backend/staticfiles` |
| `/media/` | `/home/kashyap05/graphlink-data/media` |
| `/assets/` | `/home/kashyap05/GraphLink/frontend/dist/assets` |

Click **Reload** at the top of the page, then open https://kashyap05.pythonanywhere.com.

Optionally, create an admin account for `/admin/`:

```bash
workon graphlink
set -a; source ~/graphlink-data/env; set +a
cd ~/GraphLink/backend && python manage.py createsuperuser
```

---

## Updating the site later

1. Push or merge to `main` and wait for the **Build deploy branch** workflow to pass.
2. In a PythonAnywhere Bash console:
   ```bash
   bash ~/GraphLink/deploy/pythonanywhere/deploy.sh
   ```

The script exits early, before any changes, if `~/graphlink-data/env` or the built frontend is missing.

## Troubleshooting

Check **Web tab → Log files → Error log** first.

| Symptom | Fix |
| --- | --- |
| `Set DJANGO_SECRET_KEY when DJANGO_DEBUG is False` | `~/graphlink-data/env` is missing, or has no secret key. The WSGI file must be the one from this folder. |
| `DisallowedHost` / Bad Request (400) | Add your domain to `DJANGO_ALLOWED_HOSTS`, then reload. |
| 403 "CSRF verification failed" when logging in | `DJANGO_CSRF_TRUSTED_ORIGINS` must be `https://<your domain>`, and Force HTTPS must be on. |
| Login seems to work but you're logged straight back out | Visit the site over `https://`. Session cookies are HTTPS-only in production. |
| Blank page or 404s for `/assets/...` | The `deploy` branch wasn't built, or the `/assets/` static mapping is wrong. |
| Avatars missing | Check the `/media/` mapping points at `~/graphlink-data/media`. |
| Password reset email never arrives | Free accounts have restricted outbound internet access. Check the error log, and PythonAnywhere's help pages on sending email. |

### Free-plan notes

- **Disk:** the virtualenv uses roughly 150 MB of the 512 MB quota. `deploy.sh` installs with
  `--no-cache-dir` so pip doesn't fill the disk.
- **Expiry:** free web apps stop after three months unless you click **Run until 3 months from today** on the
  Web tab.
- **Rolling back:**
  - Code: revert the change on `main`, let the workflow rebuild, then run `deploy.sh`. The `deploy` branch is
    rebuilt from scratch each time, so old builds aren't kept there.
  - Data: copy the backups from step 1 back into `~/graphlink-data/`, then reload.
