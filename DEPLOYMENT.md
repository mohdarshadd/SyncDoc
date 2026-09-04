# Deploying SyncDoc to Render.com

SyncDoc is a monorepo (npm workspaces) with two packages:

- `backend` — Express REST API + Yjs WebSocket sync (serves everything on one port)
- `frontend` — React/Vite SPA (built to `frontend/dist`)

In production the backend **serves the built frontend itself** (same origin). This keeps
cookie-based auth (`sameSite: lax`, `secure`, `httpOnly`) and the WebSocket connection on a
single domain. That means you only need **one** Render web service (no separate static site).

## What you need

1. A GitHub repo containing this code (already pushed).
2. A Render.com account with the GitHub app installed.
3. A MongoDB connection string. Easiest options:

   - **Render MongoDB** (free beta): create a database in the Render dashboard, copy its
     internal connection string.
   - **MongoDB Atlas** (free M0): create a cluster, allow network access, copy the
     `mongodb+srv://...` URI.

## Option A — Deploy from the `render.yaml` blueprint (recommended)

1. On Render: **New -> Blueprint**.
2. Connect the SyncDoc GitHub repo. Render reads `render.yaml` and proposes the service.
3. For the `MONGO_URI` env var, select a connected MongoDB (Render MongoDB or Atlas) or paste
   a connection string.
4. Set `CLIENT_ORIGIN` to your app domain, e.g. `https://syncdoc.onrender.com`
   (or leave it unset / `*` if you don't need strict CORS).
5. Set the generated secrets for `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (auto-generated).
6. **Apply / Create Resources** and wait for the build to finish (build command runs
   `npm install && npm run build`, start command runs `npm start -w backend`).

Your app is live at `https://<service>.onrender.com`.

## Option B — Manual web service (if not using the blueprint)

1. **New -> Web Service**, connect the repo.
2. **Root Directory**: leave `.` (repo root).
3. **Environment**: Node.
4. **Build Command**: `npm install && npm run build`
5. **Start Command**: `npm start -w backend`
6. **Health Check Path**: `/api/health`
7. Add environment variables (see table below).
8. **Create Web Service**.

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `NODE_ENV` | yes | Set `production` (enables `secure` cookies + static serving). |
| `PORT` | auto | Render sets this; the backend reads `process.env.PORT`. |
| `MONGO_URI` | yes | Your MongoDB connection string. |
| `JWT_ACCESS_SECRET` | yes | Long random string (auto-generated). |
| `JWT_REFRESH_SECRET` | yes | Long random string (auto-generated). |
| `CLIENT_ORIGIN` | optional | Comma-separated allowed origins, or `*`. Same-origin means it's rarely needed. |
| `VITE_WS_URL` | optional | Only needed if WebSocket is served from a different host; otherwise the frontend auto-derives `wss://<host>/ws` from `window.location`. |

## After deploy

- The backend serves the frontend on the same origin, so REST auth and the Yjs WebSocket work
  automatically.
- Open `/api/health` — it should report `"mongo": "connected"`.
- Register a user, create a document, and open the same doc in two browser tabs to confirm
  real-time sync.

## Local development (unchanged)

```bash
npm install
copy backend\.env.example backend\.env   # set MONGO_URI
npm run dev                              # backend :4000, frontend :5173
```

In dev the Vite dev server proxies `/api` to `:4000`, and the frontend connects to
`ws://localhost:4000/ws` — no extra config needed.
