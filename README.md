<img src="https://github.com/05kashyap/GraphLink/assets/120780494/e585e0f8-9f52-483a-9665-2001efdd6264" width="350">

# GraphLink

A small social network built to demonstrate and analyse a graph-theory based recommender
([SocialNet_RecSys](https://github.com/05kashyap/SocialNet_RecSys)). Every follow is an edge in a
directed graph, and GraphLink suggests who to follow — and shows *why* each person was suggested.

> Created as part of our discrete mathematics course project.

## Features

- **Graph Lab** — an interactive force-directed view of the live follow graph, coloured by community
  (greedy modularity), sized by degree, with your suggestions overlaid and per-node metrics
  (in/out degree, eigenvector centrality, articulation points).
- **Explainable recommendations** with three cases (see `backend/graph/alterutil.py`):
  1. **Cold start** (degree 0): influential users (eigenvector centrality) and bridge users (articulation points).
  2. **Bridge** (you're an articulation point): each community's hub plus other bridge users.
  3. **Small network**: friends of friends plus influential users.

  Every suggestion is tagged with the algorithm(s) that produced it, plus a separate "follow back" list.
- Posts, likes, comments, a "Following" feed and a "Most liked" featured post.
- Profiles with followers/following, follow/unfollow, avatar upload.
- Registration, login, password reset by email.
- Light and dark themes, responsive down to phone widths.

## Results

| Evaluation metrics | Result |
| ------------------ | ------ |
| Accuracy           | 0.7877 |
| Precision (at k=5) | 1.0    |
| Recall (at k=5)    | 0.5381 |
| F1 score           | 0.6996 |

| Graph matching metrics      | Result  |
| --------------------------- | ------- |
| Graph edit distance         | 0.6     |
| Edge overlap ratio          | 0.91044 |
| Structural Hamming distance | 0.19999 |

## Architecture

```
backend/    Django + Django REST Framework JSON API (/api/*), NetworkX recommender, SQLite
frontend/   React + TypeScript + Vite + Tailwind CSS single-page app
```

- The frontend talks to the backend only through `/api/` with session-cookie auth and CSRF.
- In development, Vite serves the app on `:5173` and proxies `/api`, `/media` and `/admin` to Django on `:8000`.
- In production, `npm run build` writes `frontend/dist/`, and Django (via WhiteNoise) serves it from the same
  origin — so the whole app still deploys as a single Django site.

### API overview

| Endpoint | Description |
| --- | --- |
| `GET /api/auth/me`, `POST /api/auth/login`, `/logout`, `/register` | Session auth |
| `POST /api/auth/password-reset`, `/password-reset/confirm` | Password reset by email |
| `PATCH /api/auth/me` | Update username, email, avatar (multipart) |
| `GET /api/posts?feed=latest\|following`, `POST /api/posts` | Feeds and posting |
| `GET\|PATCH\|DELETE /api/posts/:id`, `POST\|DELETE /api/posts/:id/like`, `GET\|POST /api/posts/:id/comments` | Posts |
| `GET /api/posts/featured` | Most liked post |
| `GET /api/users`, `/api/users/:username`, `/posts`, `/followers`, `/following` | People |
| `POST\|DELETE /api/users/:username/follow` | Follow / unfollow |
| `GET /api/graph` | Nodes, links, communities and network statistics |
| `GET /api/recommendations` | Your recommendation case, suggestions with reasons, follow-backs |

## Running locally

Requirements: [Miniconda](https://docs.conda.io/en/latest/miniconda.html) or
[Miniforge](https://github.com/conda-forge/miniforge). The conda environment provides both Python and
Node.js, so nothing else needs to be installed first.

**One-time setup** (from the repository root)

```bash
conda env create -f environment.yml
conda activate graphlink
cd frontend && npm install && cd ..
cd backend && python manage.py migrate
```

The repository ships with a small demo database (`backend/db.sqlite3`). Create your own account from the
sign-up page, or an admin with `python manage.py createsuperuser`.

**Run the app** (two terminals, each starting with `conda activate graphlink`)

```bash
cd backend && python manage.py runserver    # API on http://127.0.0.1:8000
cd frontend && npm run dev                  # app on http://localhost:5173
```

If `backend/requirements.txt` changes later, update the environment with
`conda env update -f environment.yml --prune`.

**Tests and checks**

```bash
(cd backend && python manage.py test)
(cd frontend && npm run lint && npm run build)
```

## Deploying (single host, e.g. PythonAnywhere)

```bash
cd frontend && npm ci && npm run build      # writes frontend/dist, served by Django
cd ../backend && pip install -r requirements.txt
python manage.py migrate && python manage.py collectstatic --noinput
```

Environment variables:

| Variable | Purpose |
| --- | --- |
| `DJANGO_SECRET_KEY` | Secret key (required in production) |
| `DJANGO_DEBUG` | `False` in production |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated hostnames |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | Comma-separated origins, e.g. `https://example.pythonanywhere.com` |
| `DJANGO_DB_PATH` | Optional path to the SQLite database |
| `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` | Gmail SMTP credentials for password reset emails |

With `DJANGO_DEBUG=False`, serve `/media/` (user uploads) from `backend/media` using your host's static-file
mapping.

## Tech stack

Django, Django REST Framework, NetworkX, NumPy/SciPy, SQLite · React, TypeScript, Vite, Tailwind CSS,
TanStack Query, react-force-graph.

## Authors

[kashyap05](https://github.com/05kashyap), [adya2004](https://github.com/adya2004) and
[Vijayvkb007](https://github.com/Vijayvkb007).
